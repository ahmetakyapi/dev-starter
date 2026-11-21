/**
 * Operasyon sayfalarının (Arıza, Çağrı, Şebeke, İş Emirleri, Kaçak) ortak
 * türetilmiş verisi. Tek kaynak yine `_data.ts` + `_store.ts`; burada yalnız
 * görünüme özel hesaplar var: etkilenen müşteri listesi, güvenilirlik dökümü,
 * trafo gün eğrisi, çağrı yoğunluğu, kaçak skoru. `Date.now()` ve rastgelelik
 * yok (sabit tohum).
 */

import {
  CUSTOMERS,
  FEEDERS,
  METERS,
  OUTAGES,
  REGIONS,
  TODAY,
  TRANSFORMERS,
  addDays,
  between,
  customer,
  dayKey,
  hashSeed,
  outageMinutes,
  periodLabel,
  seeded,
  type Customer,
  type Outage,
  type Reading,
} from "./_data";
import { effectiveReadings } from "./_ops";
import { findCustomer } from "./_data-musteri";
import { TRANSFORMER_LOADS, type Call, type LeakCase } from "./_data-yeni";

/* --- Müşteri ve hassas abone -------------------------------------------------- */

export const customerOf = (id: string): Customer => findCustomer(id) ?? customer(id);
export const isSensitive = (c: Customer) => (c.tags ?? []).some((t) => t.startsWith("Hassas"));

/* --- Arıza -------------------------------------------------------------------- */

/**
 * Üreteç bazı açık kayıtları "bugün"ün ilerleyen bir saatinde başlatabilir
 * (süre eksi çıkardı). Şimdiden sonra başlayan PLANSIZ kayıt, kimliğinden
 * türeyen sabit bir süre önce başlamış sayılır.
 */
export const fixOutage = (o: Outage): Outage =>
  o.kind === "plansiz" && o.start.getTime() > TODAY.getTime() ? { ...o, start: new Date(TODAY.getTime() - (35 + ((o.id.charCodeAt(o.id.length - 1) * 7) % 140)) * 60_000) } : o;

/** Süre, dakika; hiçbir zaman eksi değil. */
export const outageMin = (o: Outage) => Math.max(0, outageMinutes(o));

const TR_SET = (o: Outage) => new Set(o.transformerIds ?? []);
/** Etkilenen müşteriler: kesintideki DTR'lere bağlı sayaçlardan türer; hassas aboneler öne. */
export function affectedCustomers(o: Outage): Customer[] {
  const trs = TR_SET(o);
  const ids = new Set(METERS.filter((m) => m.transformerId && trs.has(m.transformerId)).map((m) => m.customerId));
  const list = [...ids].map(customerOf);
  return list.sort((a, b) => Number(isSensitive(b)) - Number(isSensitive(a)) || a.name.localeCompare(b.name, "tr-TR"));
}
export const affectedSensitive = (o: Outage) => affectedCustomers(o).filter(isSensitive).length;

/** Feeder üzerindeki DTR'lerden sayaç taşıyanlar (kesinti etkisi simülasyonu). */
export const feederTransformers = (feederId: string) => TRANSFORMERS.filter((t) => t.feederId === feederId);
export const metersOnTransformers = (ids: readonly string[]) => METERS.filter((m) => m.transformerId && ids.includes(m.transformerId));
export function impactOf(transformerIds: readonly string[]) {
  const customers = [...new Set(metersOnTransformers(transformerIds).map((m) => m.customerId))].map(customerOf);
  return { customers, count: customers.length, sensitive: customers.filter(isSensitive).length };
}

/** Güvenilirlik dökümü: SAIDI/SAIFI yalnız UZUN kesintiler (> 3 dk, ÖRNEK eşik); payda aktif abone. */
export const LONG_MIN = 3;
export function reliabilityOf(outages: readonly Outage[], days: number) {
  const from = addDays(TODAY, -days).getTime();
  const rows = outages
    .filter((o) => o.kind === "plansiz" && o.start.getTime() >= from && o.start.getTime() <= TODAY.getTime() && outageMin(o) > LONG_MIN)
    .map((o) => ({ o, minutes: outageMin(o), customerMinutes: o.affected * outageMin(o) }));
  const total = CUSTOMERS.filter((c) => c.status === "aktif").length;
  const minutes = rows.reduce((s, r) => s + r.customerMinutes, 0);
  const events = rows.reduce((s, r) => s + r.o.affected, 0);
  const closed = rows.filter((r) => r.o.status === "cozuldu");
  return {
    rows: rows.sort((a, b) => b.customerMinutes - a.customerMinutes),
    total,
    saidi: Math.round((minutes / total) * 10) / 10,
    saifi: Math.round((events / total) * 100) / 100,
    mttr: closed.length ? Math.round(closed.reduce((s, r) => s + r.minutes, 0) / closed.length) : 0,
    minutes,
    events,
  };
}

/** Günlük açık arıza sayısı (her günün sonunda süren kayıtlar), son `days` gün; canlı arıza listesinden. */
export function dailyOpen(outages: readonly Outage[], days: number) {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(TODAY, i - (days - 1));
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const end = start + 86_400_000;
    return outages.filter((o) => o.kind === "plansiz" && o.start.getTime() < end && (o.end === null ? true : o.end.getTime() >= start)).length;
  });
}

/** Bölgeye göre plansız kesinti SAYISI (tek ölçü). */
export const outageCountByRegion = (outages: readonly Outage[]) => REGIONS.map((r) => ({ region: r, count: outages.filter((o) => o.kind === "plansiz" && o.regionId === r.id).length }));

export const ETA_CHOICES = [30, 60, 90, 120, 180, 240] as const;
export const OUTAGE_CAUSES = ["Kablo arızası", "Trafo aşırı yüklenme", "Fırtına, hat kopması", "Kuş teması", "Ağaç dalı teması", "Hatalı üçüncü kişi müdahalesi", "Izgara parçası arızası"] as const;
export const PLAN_CAUSES = ["Hat bakımı", "Trafo değişimi", "Yeni şebeke bağlantısı", "Direk değişimi"] as const;
export const OUTAGES_BASE = OUTAGES;

/* --- Çağrı ------------------------------------------------------------------- */

export const callDue = (c: Call) => new Date(c.at.getTime() + c.slaMinutes * 60_000);
/** SLA'ya kalan dakika (eksi: aşıldı). Kapanmış çağrıda 0. */
export const callRemaining = (c: Call) => (c.status === "kapandi" ? 0 : Math.round((callDue(c).getTime() - TODAY.getTime()) / 60_000));

/** Saat × haftanın günü yoğunluğu (Pzt..Paz), 08-19 arası. */
export const CALL_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
export function callHourGrid(calls: readonly Call[]) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: CALL_HOURS.length }, () => 0));
  for (const c of calls) {
    const dow = (c.at.getDay() + 6) % 7;
    const h = c.at.getHours();
    if (h >= CALL_HOURS[0] && h <= CALL_HOURS[CALL_HOURS.length - 1]) grid[dow][h - CALL_HOURS[0]] += 1;
  }
  return grid;
}
export const callDays = (calls: readonly Call[]) => {
  const by = new Map<string, number>();
  for (const c of calls) by.set(dayKey(c.at), (by.get(dayKey(c.at)) ?? 0) + 1);
  return [...by.entries()].map(([date, value]) => ({ date, value }));
};

/* --- Şebeke ------------------------------------------------------------------ */

export const loadOf = (id: string) => TRANSFORMER_LOADS.find((l) => l.id === id);
/** Gün eğrisi: tepe, modellenen doluluğa eşit olacak biçimde ölçeklenir (% kapasite, 24 saat). */
export function transformerCurve(id: string, offsetDays = 0): number[] {
  const l = loadOf(id);
  const peak = l?.loadPct ?? 50;
  const rand = seeded(hashSeed(`trc:${id}:${offsetDays}`));
  const raw = Array.from({ length: 24 }, (_, h) => 0.5 + 0.28 * Math.exp(-((h - 10) ** 2) / 14) + 0.5 * Math.exp(-((h - 20) ** 2) / 9));
  const top = Math.max(...raw);
  return raw.map((v) => Math.round(((v / top) * peak * between(rand, offsetDays ? 0.9 : 0.97, offsetDays ? 0.98 : 1.0)) * 10) / 10);
}
export const loadTone = (pct: number): "danger" | "warning" | "success" => (pct >= 90 ? "danger" : pct >= 75 ? "warning" : "success");

export type GridNode = { kind: "tm" | "fider" | "dtr"; id: string; label: string; kva: number; kw: number; pct: number; customers: number; children?: GridNode[]; extra?: string };
export function buildGrid(): GridNode[] {
  const loads = new Map(TRANSFORMER_LOADS.map((l) => [l.id, l] as const));
  const regionName = new Map(REGIONS.map((r) => [r.id, r.name] as const));
  return [...new Set(TRANSFORMERS.map((t) => t.substationId))].map((tmId) => {
    const feeders = FEEDERS.filter((f) => f.substationId === tmId).map((f): GridNode => {
      const dtrs = TRANSFORMERS.filter((t) => t.feederId === f.id).map((t): GridNode => {
        const l = loads.get(t.id);
        return { kind: "dtr", id: t.id, label: t.name, kva: t.kva, kw: l?.loadKw ?? 0, pct: l?.loadPct ?? 0, customers: l?.customers ?? 0 };
      });
      const kva = dtrs.reduce((s, d) => s + d.kva, 0);
      const kw = Math.round(dtrs.reduce((s, d) => s + d.kw, 0) * 10) / 10;
      return { kind: "fider", id: f.id, label: f.name, kva, kw, pct: Math.round((kw / (kva * 0.9)) * 1000) / 10, customers: dtrs.reduce((s, d) => s + d.customers, 0), children: dtrs };
    });
    const kva = feeders.reduce((s, f) => s + f.kva, 0);
    const kw = Math.round(feeders.reduce((s, f) => s + f.kw, 0) * 10) / 10;
    const tr = TRANSFORMERS.find((t) => t.substationId === tmId)!;
    return { kind: "tm", id: tmId, label: tmId, kva, kw, pct: Math.round((kw / (kva * 0.9)) * 1000) / 10, customers: feeders.reduce((s, f) => s + f.customers, 0), children: feeders, extra: regionName.get(tr.regionId) };
  });
}

/* --- Kaçak ------------------------------------------------------------------- */

const FLAG_POINTS: Record<string, number> = { manyetik: 30, "kapak-acma": 25, "dusuk-tuketim": 20, "geri-sayim": 15, "ani-sicrama": 10, "faz-kaybi": 12 };
export type SuspectRow = { meterId: string; customerId: string; score: number; flags: string[]; drop: number; status: string };
/** Şüpheli sayaç skoru: son üç dönemdeki bayraklar + müdahale durumu + tüketim düşüşü. */
export function suspectMeters(): SuspectRow[] {
  const rows = new Map<string, SuspectRow>();
  const byMeter = new Map<string, Reading[]>();
  for (const r of effectiveReadings()) byMeter.set(r.meterId, [...(byMeter.get(r.meterId) ?? []), r]);
  for (const m of METERS) {
    const rs = (byMeter.get(m.id) ?? []).filter((r) => r.status !== "bekliyor").sort((a, b) => a.period.localeCompare(b.period));
    const last3 = rs.slice(-3);
    const flags = [...new Set(last3.flatMap((r) => r.flags))];
    const prior = rs.slice(-9, -3);
    const avgPrior = prior.length ? prior.reduce((s, r) => s + r.usage.total, 0) / prior.length : 0;
    const avgLast = last3.length ? last3.reduce((s, r) => s + r.usage.total, 0) / last3.length : 0;
    const drop = avgPrior > 0 ? Math.max(0, Math.round((1 - avgLast / avgPrior) * 100)) : 0;
    const score = flags.reduce((s, f) => s + (FLAG_POINTS[f] ?? 5), 0) + (m.status === "mudahale" ? 30 : 0) + Math.min(25, drop / 2);
    if (score >= 20) rows.set(m.id, { meterId: m.id, customerId: m.customerId, score: Math.round(score), flags, drop, status: m.status });
  }
  return [...rows.values()].sort((a, b) => b.score - a.score);
}

/** Bir sayacın son 12 dönem tüketimi (kWh). */
export function consumption12(meterId: string): { labels: string[]; values: number[] } {
  const rs = effectiveReadings()
    .filter((r) => r.meterId === meterId && r.status !== "bekliyor")
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-12);
  return { labels: rs.map((r) => periodLabel(r.period).split(" ")[0].slice(0, 3)), values: rs.map((r) => r.usage.total) };
}

/** Kaçak bedeli hesap kalemleri (ÖRNEK parametre; `_store.ts` ile aynı çarpanlar). */
export const LEAK_PARAMS = { unitPrice: 3.1, penaltyFactor: 1.3, taxFactor: 1.2 } as const;
export const leakBreakdown = (kwh: number) => {
  const energy = kwh * LEAK_PARAMS.unitPrice;
  const penalty = energy * LEAK_PARAMS.penaltyFactor;
  const total = penalty * LEAK_PARAMS.taxFactor;
  return { energy: Math.round(energy * 100), penalty: Math.round(penalty * 100), total: Math.round(total * 100) };
};
export const leakStageIndex = (l: LeakCase, order: readonly string[]) => order.indexOf(l.stage);
