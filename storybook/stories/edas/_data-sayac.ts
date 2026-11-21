import { createSlice } from "./_core";
import {
  CURRENT_PERIOD,
  METERS,
  READINGS,
  REGIONS,
  TODAY,
  TODAY_KEY,
  addDays,
  clock,
  customer,
  daysBetween,
  shortDate,
  type Meter,
  type Reading,
  type ReadingFlag,
  type ReadingSource,
} from "./_data";

/**
 * Sayaçlar ve Okumalar sayfalarının ek verisi: `_data.ts`'e dokunmadan, ondan
 * TÜRER. Rastgelelik yok; her değer sayaç ya da okuma kimliğinden hesaplanır
 * (aynı sayaç her açılışta aynı olay günlüğünü gösterir). `Date.now()` yok.
 */

function seed(text: string) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (rand: () => number, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/** "Bugün, 10:40" · "Dün" · "6 gün önce": göreli metin sunucu ve istemcide aynı (TODAY sabit). */
export function seenText(date: Date) {
  const days = daysBetween(date, TODAY);
  if (days <= 0) return date.getHours() || date.getMinutes() ? `Bugün, ${clock.format(date)}` : "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

/* --- Sayaç künyesi ------------------------------------------------------------ */

/** Mühür numarası ve kalibrasyon: sayaç kimliğinden. */
export function sealNo(m: Meter) {
  const rand = seed(`seal:${m.id}`);
  return `MH-${int(rand, 100000, 999999)}`;
}

/**
 * Muayene (kalibrasyon) süresi, YIL. ÖRNEK PARAMETRE: gerçek süre sayaç tipine
 * ve mevzuata göre değişir, doğrulanmadan kullanma; Ayarlar'a taşınabilir.
 */
export const INSPECTION_YEARS = 8;

/** Muayene (kalibrasyon) tarihi: kurulumdan `INSPECTION_YEARS` yıl sonra; geçmişse süresi dolmuş. */
export function inspection(m: Meter, years = INSPECTION_YEARS) {
  const [y, mo, d] = m.installed.split("-").map(Number);
  const due = new Date(y + years, mo - 1, d);
  return { due, overdue: due < TODAY, text: `${shortDate.format(due)} ${due.getFullYear()}` };
}

/** İletişim modülü sinyal gücü (dBm) ve çubuk sayısı; elle okunan sayaçta modül yok. */
export function signal(m: Meter) {
  if (m.comm === "elle") return null;
  const rand = seed(`sig:${m.id}`);
  const dbm = m.status === "iletisim-yok" ? -112 : -(58 + int(rand, 0, 40));
  const bars = dbm > -70 ? 4 : dbm > -84 ? 3 : dbm > -96 ? 2 : dbm > -108 ? 1 : 0;
  return { dbm, bars, label: ["Yok", "Zayıf", "Orta", "İyi", "Çok iyi"][bars] };
}

/** Sayaç saatinin sunucuya göre sapması (saniye). */
export function clockDrift(m: Meter) {
  const rand = seed(`clock:${m.id}`);
  return int(rand, -48, 48);
}

/* --- Olay günlüğü ------------------------------------------------------------- */

export type MeterEventKind = "kapak" | "manyetik" | "gerilim" | "saat" | "iletisim" | "firmware" | "role" | "okuma" | "is-emri";
export type MeterEvent = {
  id: string;
  kind: MeterEventKind;
  at: Date;
  title: string;
  detail: string;
  tone: "neutral" | "primary" | "success" | "warning" | "danger";
};

const FIRMWARE_STEPS = ["v2.4.1", "v2.4.3", "v2.5.0", "v3.0.2"];

/** Sayacın son doksan günlük olay günlüğü, yeniden eskiye. */
export function meterEvents(m: Meter): MeterEvent[] {
  const rand = seed(`ev:${m.id}`);
  const out: MeterEvent[] = [];
  const at = (daysAgo: number, hour: number, minute: number) => {
    const d = addDays(TODAY, -daysAgo);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
  };
  const push = (event: Omit<MeterEvent, "id">) => out.push({ ...event, id: `${m.id}-${out.length}` });

  if (m.status === "iletisim-yok") {
    push({ kind: "iletisim", at: m.lastSeen, title: "İletişim koptu", detail: `Son paket ${seenText(m.lastSeen).toLowerCase()} alındı; baş uç sistemi sayaca ulaşamıyor.`, tone: "danger" });
  }
  if (m.status === "mudahale") {
    push({ kind: "manyetik", at: at(int(rand, 1, 6), int(rand, 1, 5), int(rand, 0, 59)), title: "Manyetik müdahale algılandı", detail: "Güçlü manyetik alan 14 dakika sürdü; sayaç kayıt hatası bayrağı kaldırdı.", tone: "danger" });
    push({ kind: "kapak", at: at(int(rand, 7, 20), int(rand, 9, 18), int(rand, 0, 59)), title: "Klemens kapağı açıldı", detail: "Mühürlü kapak açma kaydı; mühür numarası okumayla eşleşmiyor.", tone: "danger" });
  }
  if (m.status === "arizali") {
    push({ kind: "gerilim", at: at(int(rand, 1, 9), int(rand, 0, 23), int(rand, 0, 59)), title: "Ölçüm devresi arızası", detail: "Faz akımı sıfır okunuyor, gerilim var. Saha kontrolü gerekir.", tone: "danger" });
  }

  const volts = int(rand, 1, 3);
  for (let i = 0; i < volts; i += 1) {
    push({
      kind: "gerilim",
      at: at(int(rand, 3, 80), int(rand, 0, 23), int(rand, 0, 59)),
      title: rand() < 0.5 ? "Gerilim kesintisi" : "Düşük gerilim",
      detail: rand() < 0.5 ? `${int(rand, 2, 41)} dakika süren kesinti, enerji kendiliğinden geldi.` : `Gerilim ${int(rand, 188, 205)} V'a düştü, ${int(rand, 3, 25)} dakika sürdü.`,
      tone: "warning",
    });
  }
  const clocks = int(rand, 1, 2);
  for (let i = 0; i < clocks; i += 1) {
    push({ kind: "saat", at: at(int(rand, 10, 85), int(rand, 2, 4), int(rand, 0, 59)), title: "Saat senkronu", detail: `Sayaç saati sunucuya ayarlandı (sapma ${int(rand, 4, 52)} sn).`, tone: "neutral" });
  }
  if (rand() < 0.5) {
    const [a, b] = [FIRMWARE_STEPS[Math.max(0, FIRMWARE_STEPS.indexOf(m.firmware) - 1)], m.firmware];
    push({ kind: "firmware", at: at(int(rand, 20, 88), 3, int(rand, 0, 59)), title: "Yazılım güncellendi", detail: a === b ? `Yazılım ${b} yeniden doğrulandı.` : `${a} sürümünden ${b} sürümüne uzaktan güncelleme.`, tone: "primary" });
  }
  // Okuma bayrakları da günlüğe düşer: kapak açma ve manyetik kayıtları okumadan gelir.
  for (const r of READINGS.filter((x) => x.meterId === m.id && x.period >= "2026-09" && x.flags.length)) {
    for (const flag of r.flags) {
      if (flag === "kapak-acma") push({ kind: "kapak", at: new Date(`${r.date}T09:10:00`), title: "Klemens kapağı açıldı", detail: `${r.period} okumasında kapak açma kaydı bulundu.`, tone: "warning" });
      if (flag === "manyetik") push({ kind: "manyetik", at: new Date(`${r.date}T09:10:00`), title: "Manyetik müdahale", detail: `${r.period} okumasında manyetik alan bayrağı bulundu.`, tone: "danger" });
    }
  }
  push({ kind: "okuma", at: at(0, 0, 5), title: "Gece yarısı endeksi alındı", detail: m.comm === "elle" ? "Elle okunan sayaç: otomatik endeks yok." : "Günlük endeks ve 15 dakikalık yük profili baş uç sistemine iletildi.", tone: "success" });

  return out.filter((e) => e.at <= TODAY).sort((a, b) => b.at.getTime() - a.at.getTime());
}

/* --- Okumalar: gecikme, tur planı, toplu içe aktarma -------------------------- */

/** Okumanın planlanan günden gecikmesi (gün): uzaktan 0, saha 0-3, tahmini 5. */
export function readingDelay(r: Reading) {
  if (r.source === "uzaktan") return 0;
  if (r.source === "tahmini") return 5;
  const rand = seed(`delay:${r.id}`);
  return int(rand, 0, 3);
}

const READERS = ["Selim Aktaş", "Dilek Uçar", "Tolga Bozkurt", "Nur Yaman", "Orhan Tuna", "Gülsüm Er", "Kerem Ay", "Pınar Sezer"];
export const READER_NAMES = READERS;

export type Route = {
  regionId: string;
  regionName: string;
  /** Okumaya çıkacak sayaçlar: elle okunanlar ve iletişimi kesik olanlar. */
  meters: { meter: Meter; customerName: string; district: string; done: boolean; added?: boolean }[];
  reader: string;
};

/** Bu dönemin saha tur planı: bölge başına bir tur, okuyucu varsayılanı bölge sırasından. */
export function buildRoutes(): Route[] {
  return REGIONS.map((r, i) => {
    const meters = METERS.filter((m) => {
      const c = customer(m.customerId);
      return c.regionId === r.id && (m.comm === "elle" || m.status === "iletisim-yok");
    })
      .map((meter) => {
        const c = customer(meter.customerId);
        const reading = READINGS.find((x) => x.meterId === meter.id && x.period === CURRENT_PERIOD);
        return { meter, customerName: c.name, district: c.district, done: !!reading && reading.status !== "bekliyor" };
      })
      .sort((a, b) => a.district.localeCompare(b.district, "tr") || a.meter.readDay - b.meter.readDay);
    return { regionId: r.id, regionName: r.name, meters, reader: READERS[i % READERS.length] };
  });
}

export type ImportRow = {
  line: number;
  serial: string;
  date: string;
  t1: number;
  t2: number;
  t3: number;
  problem: null | { kind: "eslesmeyen" | "tarih" | "tekrar" | "geri"; message: string };
};

/** Simüle toplu içe aktarma: elle okunan sayaçların bu dönem okumaları + dört tür hata. */
export function buildImportRows(): ImportRow[] {
  const pool = METERS.filter((m) => m.comm === "elle").slice(0, 40);
  const rows: ImportRow[] = pool.map((m, i) => {
    const last = [...READINGS].filter((r) => r.meterId === m.id && r.status !== "bekliyor").pop();
    const idx = last?.index ?? m.base;
    const bump = 90 + (i % 7) * 23;
    return {
      line: i + 2,
      serial: m.serial,
      date: TODAY_KEY,
      t1: idx.t1 + bump,
      t2: idx.t2 ? idx.t2 + Math.round(bump * 0.6) : 0,
      t3: idx.t3 ? idx.t3 + Math.round(bump * 0.4) : 0,
      problem: null,
    };
  });
  const bad = (i: number, problem: NonNullable<ImportRow["problem"]>, patch: Partial<ImportRow> = {}) => {
    rows[i] = { ...rows[i], ...patch, problem };
  };
  bad(3, { kind: "eslesmeyen", message: "Bu seri numarasıyla kayıtlı sayaç yok." }, { serial: "KZA-24-000417" });
  bad(9, { kind: "tarih", message: "Tarih GG.AA.YYYY biçiminde; GG-AA-YYYY beklenir." }, { date: "21.11.2026" });
  bad(14, { kind: "tekrar", message: "Aynı sayaç için dosyada ikinci satır (satır 4 ile aynı)." }, { serial: rows[2].serial });
  bad(22, { kind: "geri", message: "T1 endeksi önceki okumadan küçük; geri sayım olabilir." }, { t1: Math.max(0, rows[22].t1 - 4000) });
  bad(31, { kind: "eslesmeyen", message: "Bu seri numarasıyla kayıtlı sayaç yok." }, { serial: "KZA-23-998120" });
  return rows;
}


/* --- Ortak yardımcılar: dışa aktarma, sorun puanı, liste durumu -------------- */

/** Gerçek CSV indirir (BOM'lu: Excel Türkçe karakterleri doğru açar). Tarayıcı dışında sessizce geçer. */
export function downloadCsv(name: string, rows: readonly (readonly (string | number)[])[]) {
  if (typeof document === "undefined") return;
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Sayaç liste durumu: sayfa değişince korunur (modül düzeyinde dilim). */
export type MeterFilters = Readonly<Record<string, readonly string[]>>;
export type MeterSort = "sorun" | "serial" | "seen" | "name";
export type MeterListUi = { view: string; query: string; filters: MeterFilters; sort: MeterSort; shown: number; custom: readonly { id: string; label: string; filters: MeterFilters; query: string }[] };
export const meterListUi = createSlice<MeterListUi>({ view: "bugun", query: "", filters: {}, sort: "sorun", shown: 20, custom: [] });


/* --- Okumalar: oturum durumu (depoda) ------------------------------------------ */

export type EntryLogItem = { meterId: string; readingId: string; at: string; source: ReadingSource; total: number; flags: readonly ReadingFlag[] };
export type ReadingUi = { readers: Readonly<Record<string, string>>; sent: readonly string[]; entries: readonly EntryLogItem[]; imported: number };
/** Okuma sayfası durumu: okuyucu atamaları, gönderilen turlar, girilen okumalar. Sayfa değişince korunur. */
export const readingUi = createSlice<ReadingUi>({ readers: {}, sent: [], entries: [], imported: 0 });

/**
 * Canlı saha tur planı: elle okunan + iletişimi kesik sayaçlar ve Sayaçlar
 * sayfasından "tur planına eklenen" sayaçlar. `done`, DEPODAKİ okumadan türer
 * (girilen/onaylanan okuma turu ilerletir).
 */
export function buildRoutesLive(readings: readonly Reading[], inRoute: ReadonlySet<string>): Route[] {
  const current = new Map(readings.filter((r) => r.period === CURRENT_PERIOD).map((r) => [r.meterId, r]));
  return REGIONS.map((r, i) => {
    const meters = METERS.filter((m) => {
      const c = customer(m.customerId);
      return c.regionId === r.id && (m.comm === "elle" || m.status === "iletisim-yok" || inRoute.has(m.id));
    })
      .map((meter) => {
        const c = customer(meter.customerId);
        const reading = current.get(meter.id);
        return { meter, customerName: c.name, district: c.district, done: !!reading && reading.status !== "bekliyor", added: inRoute.has(meter.id) && meter.comm !== "elle" && meter.status !== "iletisim-yok" };
      })
      .sort((a, b) => Number(!!b.added) - Number(!!a.added) || a.district.localeCompare(b.district, "tr") || a.meter.readDay - b.meter.readDay);
    return { regionId: r.id, regionName: r.name, meters, reader: READERS[i % READERS.length] };
  });
}
