/**
 * Ham Veri sayfasının hesapları (saf, `Date.now` yok). Kaynak `_data.ts`teki
 * `loadProfile`: sayacın bir gününün 96 aralıklı (15 dk) yük profili.
 * Bu dosya onu sayfanın ihtiyacına çevirir: ham kayıt satırı (endeks, tarife
 * dilimi, kalite bayrağı, paket no), çözünürlüğe göre toplama, kayıp paket
 * aralıkları, saat × gün ısı ızgarası, ham telegram, dışa aktarım ve API
 * örnekleri. Her şey KURGUSAL: sayaç, endeks ve telegram değeri gerçek değildir.
 */

import { createSlice } from "./_core";
import {
  METERS,
  TODAY_KEY,
  addDays,
  customer,
  dayKey,
  loadProfile,
  meterById,
  parseDay,
  type Meter,
} from "./_data";

/* --- Dönem ve çözünürlük ---------------------------------------------------- */

export type RangeId = "bugun" | "dun" | "7" | "bu-ay" | "gecen-ay";
export const RANGES: readonly { value: RangeId; label: string }[] = [
  { value: "bugun", label: "Bugün" },
  { value: "dun", label: "Dün" },
  { value: "7", label: "Son 7 Gün" },
  { value: "bu-ay", label: "Bu Ay" },
  { value: "gecen-ay", label: "Geçen Ay" },
];

const TODAY_DATE = parseDay(TODAY_KEY);

/** Seçilen aralığın günleri (`YYYY-MM-DD`), eskiden yeniye. */
export function rangeDays(id: RangeId): string[] {
  const days = (from: Date, to: Date) => {
    const out: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(dayKey(d));
    return out;
  };
  if (id === "bugun") return [TODAY_KEY];
  if (id === "dun") return [dayKey(addDays(TODAY_DATE, -1))];
  if (id === "7") return days(addDays(TODAY_DATE, -6), TODAY_DATE);
  if (id === "bu-ay") return days(new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1), TODAY_DATE);
  return days(new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth() - 1, 1), new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 0));
}

/** Aynı uzunlukta, hemen öncesindeki aralık. */
export const previousDays = (days: readonly string[]) => {
  const first = parseDay(days[0]);
  return days.map((_, i) => dayKey(addDays(first, i - days.length)));
};

export type Resolution = "15" | "60" | "gun";
export const RESOLUTIONS: readonly { value: Resolution; label: string }[] = [
  { value: "15", label: "15 dk" },
  { value: "60", label: "Saatlik" },
  { value: "gun", label: "Günlük" },
];
/** Grafikte kaç noktaya izin verilir: 15 dk ≤ 2 gün, saatlik ≤ 14 gün. */
export const resolutionAllowed = (res: Resolution, dayCount: number) => (res === "15" ? dayCount <= 2 : res === "60" ? dayCount <= 14 : true);
export const bestResolution = (dayCount: number): Resolution => (dayCount <= 2 ? "15" : dayCount <= 14 ? "60" : "gun");

/* --- Ölçüler -------------------------------------------------------------------- */

export type MeasureId = "kwh" | "kwh-t1" | "kwh-t2" | "kwh-t3" | "kw" | "kvarh-ind" | "kvarh-cap" | "volt" | "amp" | "pf";
export type Measure = { id: MeasureId; label: string; unit: string; kind: "sum" | "max" | "avg"; digits: number; chart: "area" | "line"; zone?: Zone };
export const MEASURES: readonly Measure[] = [
  { id: "kwh", label: "Aktif Tüketim (Toplam)", unit: "kWh", kind: "sum", digits: 2, chart: "area" },
  { id: "kwh-t1", label: "Aktif T1 (Gündüz 06-17)", unit: "kWh", kind: "sum", digits: 2, chart: "area", zone: "T1" },
  { id: "kwh-t2", label: "Aktif T2 (Puant 17-22)", unit: "kWh", kind: "sum", digits: 2, chart: "area", zone: "T2" },
  { id: "kwh-t3", label: "Aktif T3 (Gece 22-06)", unit: "kWh", kind: "sum", digits: 2, chart: "area", zone: "T3" },
  { id: "kw", label: "Talep Gücü (Demand)", unit: "kW", kind: "max", digits: 2, chart: "area" },
  { id: "kvarh-ind", label: "Endüktif Reaktif", unit: "kVArh", kind: "sum", digits: 2, chart: "area" },
  { id: "kvarh-cap", label: "Kapasitif Reaktif", unit: "kVArh", kind: "sum", digits: 2, chart: "area" },
  { id: "volt", label: "Gerilim Sapması (Nominale Göre)", unit: "%", kind: "avg", digits: 2, chart: "line" },
  { id: "amp", label: "Akım", unit: "A", kind: "avg", digits: 2, chart: "area" },
  { id: "pf", label: "Güç Faktörü (cos φ)", unit: "", kind: "avg", digits: 3, chart: "line" },
];
export const measureOf = (id: MeasureId) => MEASURES.find((m) => m.id === id)!;

/* --- Ham kayıt -------------------------------------------------------------------- */

export type Zone = "T1" | "T2" | "T3";
export const ZONE_LABEL: Record<Zone, string> = { T1: "T1 Gündüz", T2: "T2 Puant", T3: "T3 Gece" };
const zoneOfSlot = (slot: number): Zone => {
  const hour = Math.floor(slot / 4);
  return hour >= 6 && hour < 17 ? "T1" : hour >= 17 && hour < 22 ? "T2" : "T3";
};

export type Quality = "iyi" | "tahmin" | "eksik" | "dogrulanmamis";
export const QUALITY_LABEL: Record<Quality, string> = { iyi: "İyi", tahmin: "Tahmin", eksik: "Eksik", dogrulanmamis: "Doğrulanmamış" };

export type RawRow = {
  key: string;
  day: string;
  slot: number;
  time: string;
  /** UTC+3 zaman damgası. */
  ts: string;
  zone: Zone;
  /** Kümülatif aktif endeks (kWh, çarpan dahil değil). */
  index: number;
  kwh: number;
  kw: number;
  /** Nominal gerilimden sapma, %. */
  voltDev: number;
  volt: number;
  amp: number;
  pf: number;
  kvarhInd: number;
  kvarhCap: number;
  quality: Quality;
  packet: string;
  /** Orijinal veride eksik miydi (yeniden istekle dolsa bile). */
  wasMissing: boolean;
  gapId: string | null;
};

const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Bugün için yalnız gün içinde geçmiş aralıklar (10:40'a kadar). */
const lastSlot = (day: string) => (day === TODAY_KEY ? 42 : 95);

export type Gap = { id: string; day: string; from: string; to: string; packets: number; minutes: number };

/** Orijinal veride eksik olan ardışık aralıklar (gün gün). */
export function gapsOf(meterId: string, days: readonly string[]): Gap[] {
  const out: Gap[] = [];
  for (const day of days) {
    const pts = loadProfile(meterId, day).slice(0, lastSlot(day) + 1);
    let start = -1;
    const close = (end: number) => {
      out.push({
        id: `${meterId}:${day}:${start}`,
        day,
        from: pts[start].time,
        to: `${String(Math.floor((end + 1) / 4)).padStart(2, "0")}:${String(((end + 1) % 4) * 15).padStart(2, "0")}`,
        packets: end - start + 1,
        minutes: (end - start + 1) * 15,
      });
    };
    pts.forEach((p, i) => {
      if (p.missing && start < 0) start = i;
      if (!p.missing && start >= 0) {
        close(i - 1);
        start = -1;
      }
    });
    if (start >= 0) close(pts.length - 1);
  }
  return out;
}

/**
 * Ham kayıt satırları. `recovered`: yeniden istekle alınan boşlukların kimlikleri;
 * o satırlar artık "eksik" değil. Endeks, aralığın başından kümülatif ve
 * sayacın başlangıç endeksinden başlar.
 */
export function rawRows(meterId: string, days: readonly string[], recovered: ReadonlySet<string>): RawRow[] {
  const meter = meterById(meterId) ?? METERS[0];
  const c = customer(meter.customerId);
  const nominal = c.voltage === "OG" ? 15800 : 230;
  let index = meter.base.t1 + meter.base.t2 + meter.base.t3 + 1000;
  const gaps = new Map<string, string>();
  for (const g of gapsOf(meterId, days)) {
    const [startDay, startSlot] = [g.day, Number(g.id.split(":")[2])];
    for (let s = startSlot; s < startSlot + g.packets; s++) gaps.set(`${startDay}:${s}`, g.id);
  }
  const rows: RawRow[] = [];
  for (const day of days) {
    const pts = loadProfile(meterId, day).slice(0, lastSlot(day) + 1);
    for (const p of pts) {
      const gapId = gaps.get(`${day}:${p.slot}`) ?? null;
      const gone = p.missing && !(gapId && recovered.has(gapId));
      const h = hash(`${meterId}:${day}:${p.slot}`);
      const quality: Quality = gone ? "eksik" : h % 61 === 0 ? "tahmin" : h % 43 === 0 ? "dogrulanmamis" : "iyi";
      const zone = zoneOfSlot(p.slot);
      const kwh = gone ? 0 : p.kwh;
      index += kwh;
      const inductive = gone ? 0 : Math.round(p.kwh * Math.tan(Math.acos(p.pf)) * 0.45 * 1000) / 1000;
      const capacitive = gone ? 0 : Math.round(p.kwh * (zone === "T3" ? 0.09 : 0.02) * 1000) / 1000;
      rows.push({
        key: `${day}:${p.slot}`,
        day,
        slot: p.slot,
        time: p.time,
        ts: `${day} ${p.time}:00 +03:00`,
        zone,
        index: Math.round(index * 1000) / 1000,
        kwh,
        kw: gone ? 0 : p.kw,
        voltDev: gone ? 0 : Math.round(((p.volt / nominal - 1) * 100) * 100) / 100,
        volt: gone ? 0 : p.volt,
        amp: gone ? 0 : p.amp,
        pf: gone ? 0 : p.pf,
        kvarhInd: inductive,
        kvarhCap: capacitive,
        quality,
        packet: `P-${(h % 90000 + 10000).toString()}`,
        wasMissing: p.missing,
        gapId,
      });
    }
  }
  return rows;
}

/** Kalite özeti. */
export function qualityOf(rows: readonly RawRow[]) {
  const total = rows.length;
  const count = (q: Quality) => rows.filter((r) => r.quality === q).length;
  const missing = count("eksik");
  let gaps = 0;
  let inGap = false;
  for (const r of rows) {
    if (r.quality === "eksik" && !inGap) gaps += 1;
    inGap = r.quality === "eksik";
  }
  return { total, missing, gaps, estimated: count("tahmin"), unverified: count("dogrulanmamis"), completeness: total ? Math.round(((total - missing) / total) * 1000) / 10 : 0 };
}

/* --- Toplama --------------------------------------------------------------------- */

export type Bucket = { label: string; value: number; empty: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const monthShort = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/** Satırları çözünürlüğe göre toplar; etiketler kısa ("14:15", "21 14:00", "21 Kas"). */
export function bucketize(rows: readonly RawRow[], res: Resolution, measure: Measure, multiDay: boolean): Bucket[] {
  const keyOf = (r: RawRow) => (res === "15" ? r.key : res === "60" ? `${r.day}:${Math.floor(r.slot / 4)}` : r.day);
  const labelOf = (r: RawRow) => {
    if (res === "gun") return monthShort.format(parseDay(r.day));
    const dd = r.day.slice(8, 10);
    const hh = res === "15" ? r.time : `${pad(Math.floor(r.slot / 4))}:00`;
    void dd;
    return multiDay ? `${monthShort.format(parseDay(r.day))} ${hh}` : hh;
  };
  const groups = new Map<string, RawRow[]>();
  for (const r of rows) {
    const k = keyOf(r);
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const pick = (r: RawRow): number => {
    switch (measure.id) {
      case "kw":
        return r.kw;
      case "kvarh-ind":
        return r.kvarhInd;
      case "kvarh-cap":
        return r.kvarhCap;
      case "volt":
        return r.voltDev;
      case "amp":
        return r.amp;
      case "pf":
        return r.pf;
      default:
        return measure.zone && r.zone !== measure.zone ? 0 : r.kwh;
    }
  };
  return [...groups.values()].map((g) => {
    const live = g.filter((r) => r.quality !== "eksik");
    const empty = live.length === 0;
    const values = live.map(pick);
    const round = (v: number) => Math.round(v * 10_000) / 10_000;
    const value = empty ? 0 : measure.kind === "sum" ? values.reduce((s, v) => s + v, 0) : measure.kind === "max" ? Math.max(...values) : values.reduce((s, v) => s + v, 0) / values.length;
    return { label: labelOf(g[0]), value: round(value), empty };
  });
}

/** Boş (tamamen eksik) saatlerin ardışık aralıkları, en uzundan başlayarak en çok `limit` tane (grafik bandı). */
export function emptyRuns(buckets: readonly Bucket[], limit = 2): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = [];
  let start = -1;
  buckets.forEach((b, i) => {
    if (b.empty && start < 0) start = i;
    if (!b.empty && start >= 0) {
      runs.push({ from: start, to: i - 1 });
      start = -1;
    }
  });
  if (start >= 0) runs.push({ from: start, to: buckets.length - 1 });
  return runs.sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, limit).sort((a, b) => a.from - b.from);
}

/* --- Saat × gün ısı ızgarası ------------------------------------------------------- */

export const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/** Son 28 günün (bugün hariç) ortalama talebi: 7 gün (Pzt ilk) × 24 saat, kW. */
export function weekdayHourGrid(meterId: string) {
  const sums = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ total: 0, n: 0 })));
  for (let back = 1; back <= 28; back++) {
    const day = dayKey(addDays(TODAY_DATE, -back));
    const row = (parseDay(day).getDay() + 6) % 7;
    for (const p of loadProfile(meterId, day)) {
      if (p.missing) continue;
      const cell = sums[row][Math.floor(p.slot / 4)];
      cell.total += p.kw;
      cell.n += 1;
    }
  }
  const grid = sums.map((r) => r.map((c) => (c.n ? Math.round((c.total / c.n) * 100) / 100 : 0)));
  const flat = grid.flat();
  return { grid, max: Math.max(...flat, 0.01), min: Math.min(...flat) };
}

/* --- Telegram, API, dışa aktarım ------------------------------------------------------ */

const f3 = (v: number, width = 10) => v.toFixed(3).padStart(width, "0");

/** IEC 62056-21 (mod C) biçiminde KURGUSAL telegram; değerler aralığın son satırından türer. */
export function buildTelegram(meter: Meter, rows: readonly RawRow[]) {
  const c = customer(meter.customerId);
  const last = rows[rows.length - 1];
  const total = last?.index ?? meter.base.t1 + meter.base.t2 + meter.base.t3;
  const inductive = rows.reduce((s, r) => s + r.kvarhInd, 0) + meter.base.t1 * 0.19;
  const capacitive = rows.reduce((s, r) => s + r.kvarhCap, 0) + meter.base.t1 * 0.03;
  const peak = rows.reduce((m, r) => (r.kw > m.kw ? r : m), rows[0] ?? ({ kw: 0, day: TODAY_KEY, time: "00:00" } as RawRow));
  const t1 = total * (meter.multiZone ? 0.46 : 1);
  const t2 = total * (meter.multiZone ? 0.3 : 0);
  const t3 = total * (meter.multiZone ? 0.24 : 0);
  const stamp = last ? `${last.day.slice(2).replaceAll("-", "-")}` : TODAY_KEY.slice(2);
  const obis = [
    `/KZY5\\@${meter.model.split(" ")[2] ?? "AS310"}`,
    ``,
    `0.0.0(${meter.serial})`,
    `0.9.1(${last ? `${last.time}:00` : "10:40:00"})`,
    `0.9.2(${stamp})`,
    `1.8.0(${f3(total)}*kWh)`,
    `1.8.1(${f3(t1)}*kWh)`,
    `1.8.2(${f3(t2)}*kWh)`,
    `1.8.3(${f3(t3)}*kWh)`,
    `3.8.0(${f3(inductive)}*kvarh)`,
    `5.8.0(${f3(capacitive)}*kvarh)`,
    `1.6.0(${peak.kw.toFixed(2).padStart(5, "0")}*kW)(${peak.day.slice(2)} ${peak.time})`,
    `32.7.0(${(last?.volt ?? (c.voltage === "OG" ? 15800 : 230)).toFixed(1)}*V)`,
    `31.7.0(${(last?.amp ?? 0).toFixed(2)}*A)`,
    `13.7.0(${(last?.pf ?? 0.95).toFixed(2)})`,
    `!`,
  ].join("\r\n");
  const hex = Array.from(obis)
    .slice(0, 96)
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
    .reduce<string[]>((lines, byte, i) => {
      if (i % 16 === 0) lines.push(`${i.toString(16).padStart(4, "0").toUpperCase()}  `);
      lines[lines.length - 1] += `${byte} `;
      return lines;
    }, [])
    .join("\n");
  const json = JSON.stringify(
    {
      meter: meter.serial,
      timestamp: last?.ts ?? `${TODAY_KEY} 10:40:00 +03:00`,
      obis: { "1.8.0": { value: Math.round(total * 1000) / 1000, unit: "kWh" }, "3.8.0": { value: Math.round(inductive * 1000) / 1000, unit: "kvarh" }, "5.8.0": { value: Math.round(capacitive * 1000) / 1000, unit: "kvarh" }, "1.6.0": { value: peak.kw, unit: "kW" } },
      multiplier: meter.multiplier,
    },
    null,
    2,
  );
  return { obis, hex, json };
}

export const API_BASE = "https://api.kuzeyova-dagitim.example/v1";

export function apiExamples(meter: Meter, days: readonly string[], res: Resolution) {
  const from = days[0];
  const to = days[days.length - 1];
  const interval = res === "15" ? "15m" : res === "60" ? "1h" : "1d";
  const url = `${API_BASE}/meters/${meter.serial}/profile?from=${from}&to=${to}&interval=${interval}`;
  return {
    curl: `curl -G "${API_BASE}/meters/${meter.serial}/profile" \\\n  -H "Authorization: Bearer $KUZEYOVA_API_KEY" \\\n  --data-urlencode "from=${from}" \\\n  --data-urlencode "to=${to}" \\\n  --data-urlencode "interval=${interval}"`,
    js: `const res = await fetch(\n  "${url}",\n  { headers: { Authorization: \`Bearer \${process.env.KUZEYOVA_API_KEY}\` } },\n);\nconst { points } = await res.json();`,
    response: JSON.stringify(
      {
        meter: meter.serial,
        interval,
        timezone: "Europe/Istanbul",
        completeness: 0.987,
        points: [
          { ts: `${from}T00:00:00+03:00`, kwh: 0.182, kw: 0.73, quality: "good", packet: "P-48213" },
          { ts: `${from}T00:15:00+03:00`, kwh: 0.171, kw: 0.68, quality: "good", packet: "P-48214" },
        ],
        next: null,
      },
      null,
      2,
    ),
  };
}

export type ExportField = "ts" | "index" | "kwh" | "kw" | "kvarh" | "volt" | "amp" | "pf" | "quality" | "packet";
export const EXPORT_FIELDS: readonly { id: ExportField; label: string }[] = [
  { id: "ts", label: "Zaman Damgası (UTC+3)" },
  { id: "index", label: "Endeks" },
  { id: "kwh", label: "Aktif Tüketim" },
  { id: "kw", label: "Talep Gücü" },
  { id: "kvarh", label: "Reaktif (Endüktif ve Kapasitif)" },
  { id: "volt", label: "Gerilim" },
  { id: "amp", label: "Akım" },
  { id: "pf", label: "Güç Faktörü" },
  { id: "quality", label: "Kalite Bayrağı" },
  { id: "packet", label: "Paket No" },
];

const cell = (row: RawRow, field: ExportField): (string | number)[] => {
  switch (field) {
    case "ts":
      return [row.ts];
    case "index":
      return [row.index];
    case "kwh":
      return [row.kwh];
    case "kw":
      return [row.kw];
    case "kvarh":
      return [row.kvarhInd, row.kvarhCap];
    case "volt":
      return [row.volt];
    case "amp":
      return [row.amp];
    case "pf":
      return [row.pf];
    case "quality":
      return [QUALITY_LABEL[row.quality]];
    default:
      return [row.packet];
  }
};
const header = (field: ExportField): string[] => (field === "kvarh" ? ["kvarh_enduktif", "kvarh_kapasitif"] : [field === "ts" ? "zaman" : field === "index" ? "endeks" : field === "kwh" ? "kwh" : field === "kw" ? "kw" : field === "volt" ? "volt" : field === "amp" ? "amper" : field === "pf" ? "cos_phi" : field === "quality" ? "kalite" : "paket"]);

export function toCsv(rows: readonly RawRow[], fields: readonly ExportField[]) {
  const head = fields.flatMap(header).join(";");
  const body = rows.map((r) => fields.flatMap((f) => cell(r, f)).map((v) => (typeof v === "number" ? String(v).replace(".", ",") : v)).join(";"));
  return [head, ...body].join("\r\n");
}

export function toJson(rows: readonly RawRow[], fields: readonly ExportField[]) {
  const names = fields.flatMap(header);
  return JSON.stringify(
    rows.map((r) => Object.fromEntries(fields.flatMap((f) => cell(r, f)).map((v, i) => [names[i], v]))),
    null,
    2,
  );
}

/** Tahmini dosya boyutu (KB), yalnız bildirim metni için. */
export const sizeKb = (text: string) => Math.max(1, Math.round(text.length / 1024));

/* --- Kayıtlı sorgular -------------------------------------------------------------------- */

export type CompareMode = "yok" | "onceki" | "sayac";
export type SavedQuery = { id: string; name: string; meterId: string; range: RangeId; res: Resolution; measure: MeasureId; compare: CompareMode };

const firstMeter = (pred: (m: Meter) => boolean, skip = 0) => METERS.filter(pred)[skip] ?? METERS[skip];
export const SEED_QUERIES: readonly SavedQuery[] = [
  { id: "q-1", name: "Puant saati kontrolü", meterId: firstMeter((m) => m.multiZone && m.status === "okunuyor").id, range: "7", measure: "kwh-t2", res: "60", compare: "onceki" },
  { id: "q-2", name: "İletişimi kopan sayaçlar: son durum", meterId: firstMeter((m) => m.status === "iletisim-yok").id, range: "dun", measure: "kwh", res: "15", compare: "yok" },
  { id: "q-3", name: "Sanayi reaktif oran takibi", meterId: firstMeter((m) => customer(m.customerId).kind === "sanayi" && m.status === "okunuyor").id, range: "bu-ay", measure: "kvarh-ind", res: "gun", compare: "onceki" },
];

/** Varsayılan sayaç: uzaktan okunan, sağlıklı bir abone sayacı. */
export const DEFAULT_METER_ID = (METERS.find((m) => m.comm === "ami" && m.status === "okunuyor" && customer(m.customerId).kind === "bireysel") ?? METERS[0]).id;

export const dayShort = (day: string) => monthShort.format(parseDay(day));

/** Kayıtlı sorgular: sayfa değişince korunur (modül düzeyinde dilim). */
export const savedQueries = createSlice<readonly SavedQuery[]>(SEED_QUERIES);
