/**
 * Portal: yeni modüllerin tohumlu başlangıç verisi (başvurular, kaçak
 * vakaları, sayaç stoku, çağrılar, trafo yükü, üreticiler, itirazlar, alacaklar,
 * KVKK). Hepsi `_data.ts` ile AYNI abone, sayaç, okuma ve fatura listelerinden
 * türer (uydurma bağımsız sayı yok) ve `_store.ts` dilimlerinin başlangıç değeridir.
 * `Date.now()` ve `Math.random()` yok: sabit tohum, aynı sonuç.
 */

import {
  CUSTOMERS,
  FLAGGED_READINGS,
  INVOICES,
  METERS,
  OUTAGES,
  PRODUCER_CUSTOMER_IDS,
  READINGS,
  REGIONS,
  TODAY,
  TODAY_KEY,
  TRANSFORMERS,
  addDays,
  customer,
  dayKey,
  hashSeed,
  int,
  between,
  pick,
  seeded,
  type Customer,
  type Meter,
  type Outage,
} from "./_data";
import { METER_POOL } from "./_data-musteri";

const pad = (n: number) => String(n).padStart(2, "0");
const at = (daysAgo: number, hour: number, minute = 0) => {
  const d = addDays(TODAY, -daysAgo);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
};
const FIRST = ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Mustafa", "Emine", "Ali", "Hatice", "Hasan", "Zeynep", "İbrahim", "Elif", "Hüseyin", "Merve", "Yusuf", "Selin"];
const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan"];
const STAFF = ["Kerem Şahin", "Derya Kalkan", "Mehmet Aral", "Esin Çakır", "Volkan Tosun", "Gül Ersoy"];

/* ======================================================================== */
/* BAŞVURULAR (yeni bağlantı)                                                */
/* ======================================================================== */

export type ApplicationKind = "yeni" | "guc" | "devir" | "gecici";
export const APPLICATION_KIND_LABEL: Record<ApplicationKind, string> = { yeni: "Yeni Bağlantı", guc: "Güç Artırımı", devir: "Abonelik Devri", gecici: "Geçici Bağlantı" };
export type ApplicationStage = "basvuru" | "evrak" | "kesif" | "bedel" | "montaj" | "enerji" | "tamam" | "red";
export const APPLICATION_STAGES: readonly { id: Exclude<ApplicationStage, "red">; label: string; hint: string }[] = [
  { id: "basvuru", label: "Başvuru Alındı", hint: "Kayıt ve ön kontrol" },
  { id: "evrak", label: "Evrak Kontrolü", hint: "Eksik belge tamamlanır" },
  { id: "kesif", label: "Keşif", hint: "Saha keşfi ve proje" },
  { id: "bedel", label: "Bedel ve Sözleşme", hint: "Bağlantı bedeli tahsil edilir" },
  { id: "montaj", label: "Montaj", hint: "Sayaç tahsisi ve montaj" },
  { id: "enerji", label: "Enerjilendirme", hint: "Abonelik açılır" },
  { id: "tamam", label: "Tamamlandı", hint: "Abone aktif" },
];
export type ApplicationDoc = { id: string; label: string; ok: boolean };
export type Application = {
  id: string;
  kind: ApplicationKind;
  applicant: string;
  regionId: string;
  district: string;
  address: string;
  powerKw: number;
  voltage: "AG" | "OG";
  stage: ApplicationStage;
  createdAt: string;
  /** Aşamaya girdiği gün (SLA sayacı). */
  stageSince: string;
  docs: ApplicationDoc[];
  /** Bağlantı bedeli ve güvence bedeli (kuruş). */
  connectionFee: number;
  deposit: number;
  feePaid: boolean;
  assignedTo: string;
  /** Montajda tahsis edilen sayaç stok seri numarası. */
  meterSerial: string | null;
  note?: string;
};

const DOC_LABELS = ["Kimlik ya da vergi levhası", "Tapu ya da kira sözleşmesi", "Mimari/elektrik projesi", "İskan ya da yapı ruhsatı", "Vekaletname (varsa)"];

function buildApplications(): Application[] {
  const rand = seeded(61077);
  const stages: ApplicationStage[] = ["basvuru", "basvuru", "basvuru", "evrak", "evrak", "evrak", "evrak", "kesif", "kesif", "kesif", "bedel", "bedel", "bedel", "montaj", "montaj", "montaj", "enerji", "enerji", "tamam", "tamam", "tamam", "tamam", "red", "evrak", "kesif"];
  return stages.map((stage, i) => {
    const kind = pick(rand, ["yeni", "yeni", "yeni", "guc", "devir", "gecici"] as const);
    const reg = pick(rand, REGIONS);
    const og = reg.id === "sanayi" || rand() < 0.12;
    const powerKw = og ? int(rand, 150, 800) : pick(rand, [5, 8, 10, 15, 25, 40]);
    const stageIdx = APPLICATION_STAGES.findIndex((s) => s.id === stage);
    const docsOk = stage === "basvuru" ? 1 : stage === "evrak" ? 3 : 5;
    const created = int(rand, stageIdx * 2 + 2, stageIdx * 4 + 12);
    const fee = (powerKw * (og ? 690 : 410) + 18_000) * 100;
    const district = pick(rand, reg.districts);
    return {
      id: `BAS-26${pad(i + 1)}`,
      kind,
      applicant: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
      regionId: reg.id,
      district,
      address: `${pick(rand, ["Cumhuriyet", "Yeşilyurt", "Çınar", "Gazi", "Fatih"])} Sk. No: ${int(rand, 2, 90)}, ${district}`,
      powerKw,
      voltage: og ? "OG" : "AG",
      stage,
      createdAt: dayKey(addDays(TODAY, -created)),
      stageSince: dayKey(addDays(TODAY, -Math.min(created, int(rand, 1, 9)))),
      docs: DOC_LABELS.map((label, d) => ({ id: `d${d}`, label, ok: d < docsOk })),
      connectionFee: fee,
      deposit: Math.round(powerKw * 6_000),
      feePaid: stageIdx >= 4 || stage === "tamam",
      assignedTo: pick(rand, STAFF),
      meterSerial: stage === "enerji" || stage === "tamam" ? `KZA-26-${String(900_000 + i * 13)}` : null,
      note: stage === "red" ? "Tapu bilgisi uyuşmadı, başvuru sahibine bildirildi" : undefined,
    };
  });
}
export const APPLICATIONS: readonly Application[] = buildApplications();

/* ======================================================================== */
/* SAYAÇ STOKU                                                               */
/* ======================================================================== */

export type StockStatus = "stokta" | "tahsisli" | "sokulmus" | "muayenede" | "hurda";
export const STOCK_STATUS_LABEL: Record<StockStatus, string> = { stokta: "Stokta", tahsisli: "Tahsisli", sokulmus: "Sökülmüş", muayenede: "Muayenede", hurda: "Hurda" };
export type StockMeter = {
  id: string;
  serial: string;
  model: string;
  comm: "ami" | "gsm" | "elle";
  multiZone: boolean;
  depot: string;
  status: StockStatus;
  /** Bir sonraki muayene tarihi. */
  inspectionDue: string;
  seal: string | null;
  /** Tahsisli ise abone kimliği. */
  allocatedTo: string | null;
  note?: string;
};
export const DEPOTS = ["Merkez Depo", "Kıyı Depo", "Sanayi Depo"] as const;

function buildStock(): StockMeter[] {
  const rand = seeded(30417);
  const out: StockMeter[] = METER_POOL.map((m, i) => ({
    id: m.id,
    serial: m.serial,
    model: m.model,
    comm: m.comm,
    multiZone: m.multiZone,
    depot: DEPOTS[i % 3],
    status: "stokta" as const,
    inspectionDue: dayKey(addDays(TODAY, int(rand, 400, 2400))),
    seal: null,
    allocatedTo: null,
  }));
  const models = ["Akıllı Sayaç AS-310", "Akıllı Sayaç AS-330 (3 faz)", "Elektronik Sayaç ES-120", "OG Sayaç OS-500"];
  const plan: StockStatus[] = [...Array<StockStatus>(44).fill("stokta"), ...Array<StockStatus>(10).fill("muayenede"), ...Array<StockStatus>(8).fill("sokulmus"), ...Array<StockStatus>(4).fill("hurda"), ...Array<StockStatus>(9).fill("tahsisli")];
  plan.forEach((status, i) => {
    const model = status === "stokta" ? pick(rand, models.slice(0, 3)) : pick(rand, models);
    const owner = status === "tahsisli" ? METERS[i * 11 + 4] : null;
    out.push({
      id: `S-${String(i + 1).padStart(3, "0")}`,
      serial: owner ? owner.serial : `KZA-26-${String(400_000 + i * 17 + int(rand, 0, 9))}`,
      model: owner ? owner.model : model,
      comm: owner ? owner.comm : pick(rand, ["ami", "ami", "gsm", "elle"] as const),
      multiZone: owner ? owner.multiZone : rand() < 0.5,
      depot: pick(rand, DEPOTS),
      status,
      inspectionDue: status === "muayenede" ? dayKey(addDays(TODAY, int(rand, -40, 10))) : dayKey(addDays(TODAY, int(rand, status === "hurda" ? -400 : 120, status === "hurda" ? -30 : 2800))),
      seal: status === "tahsisli" ? `M-${String(int(rand, 100_000, 999_999))}` : null,
      allocatedTo: owner ? owner.customerId : null,
      note: status === "sokulmus" ? "Sökülen sayaç, depo kabulü bekliyor" : status === "hurda" ? "Muayene sonucu: kullanılamaz" : undefined,
    });
  });
  return out;
}
export const STOCK: readonly StockMeter[] = buildStock();

/* ======================================================================== */
/* KAÇAK VAKALARI                                                            */
/* ======================================================================== */

export type LeakStage = "supheli" | "kontrol" | "tutanak" | "bedel" | "itiraz" | "kapandi";
export const LEAK_STAGES: readonly { id: LeakStage; label: string; hint: string }[] = [
  { id: "supheli", label: "Şüphe", hint: "Okuma bayrağı ya da ihbar" },
  { id: "kontrol", label: "Saha Kontrolü", hint: "Kontrol iş emri" },
  { id: "tutanak", label: "Tutanak", hint: "Kaçak tespit tutanağı" },
  { id: "bedel", label: "Bedel", hint: "Kaçak bedeli tahakkuku" },
  { id: "itiraz", label: "İtiraz", hint: "Abone itirazı inceleniyor" },
  { id: "kapandi", label: "Kapandı", hint: "Tahsil edildi ya da düştü" },
];
export type LeakCase = {
  id: string;
  meterId: string;
  customerId: string;
  source: "okuma" | "ihbar" | "denetim";
  flag: string;
  openedAt: string;
  stage: LeakStage;
  /** Tahmini kaçak tüketim (kWh), süre (ay), bedel (kuruş; ÖRNEK hesap). */
  estimatedKwh: number;
  months: number;
  amount: number;
  tutanakNo: string | null;
  assignedTo: string;
  /** Kontrol iş emri, itiraz kaydı. */
  workOrderId: string | null;
  disputeId: string | null;
};

function buildLeaks(): LeakCase[] {
  const rand = seeded(88213);
  const pool: { meter: Meter; flag: string; source: LeakCase["source"] }[] = [];
  for (const m of METERS.filter((x) => x.status === "mudahale")) pool.push({ meter: m, flag: "Müdahale şüphesi (sayaç durumu)", source: "denetim" });
  for (const r of FLAGGED_READINGS.filter((x) => x.flags.includes("manyetik") || x.flags.includes("kapak-acma") || x.flags.includes("dusuk-tuketim"))) {
    const m = METERS.find((x) => x.id === r.meterId)!;
    if (!pool.some((p) => p.meter.id === m.id)) pool.push({ meter: m, flag: r.flags.includes("manyetik") ? "Manyetik müdahale kaydı" : r.flags.includes("kapak-acma") ? "Kapak açma kaydı" : "Beklenenin çok altında tüketim", source: "okuma" });
  }
  const stages: LeakStage[] = ["supheli", "supheli", "supheli", "kontrol", "kontrol", "kontrol", "tutanak", "tutanak", "bedel", "bedel", "bedel", "itiraz", "itiraz", "kapandi", "kapandi"];
  return stages.slice(0, Math.min(stages.length, pool.length)).map((stage, i) => {
    const p = pool[i];
    const c = customer(p.meter.customerId);
    const months = int(rand, 2, 8);
    const estimatedKwh = Math.round((c.baseKwh * between(rand, 0.4, 0.9)) * months);
    const stageIdx = LEAK_STAGES.findIndex((s) => s.id === stage);
    return {
      id: `KC-26${pad(i + 1)}`,
      meterId: p.meter.id,
      customerId: c.id,
      source: i % 5 === 4 ? "ihbar" : p.source,
      flag: p.flag,
      openedAt: dayKey(addDays(TODAY, -int(rand, 2 + stageIdx * 3, 8 + stageIdx * 5))),
      stage,
      estimatedKwh,
      months,
      amount: Math.round(estimatedKwh * 3.1 * 1.3 * 1.2 * 100),
      tutanakNo: stageIdx >= 2 ? `TT-${2026}-${String(300 + i)}` : null,
      assignedTo: pick(rand, STAFF),
      workOrderId: null,
      disputeId: null,
    };
  });
}
export const LEAKS: readonly LeakCase[] = buildLeaks();

/* ======================================================================== */
/* ÇAĞRI MERKEZİ                                                             */
/* ======================================================================== */

export type CallKind = "ariza" | "fatura" | "sayac" | "bilgi" | "sikayet" | "kesme";
export const CALL_KIND_LABEL: Record<CallKind, string> = { ariza: "Arıza", fatura: "Fatura", sayac: "Sayaç", bilgi: "Bilgi", sikayet: "Şikayet", kesme: "Kesme ve Bağlama" };
export type CallChannel = "telefon" | "sms" | "web" | "mobil";
export const CALL_CHANNEL_LABEL: Record<CallChannel, string> = { telefon: "Telefon", sms: "SMS", web: "Web", mobil: "Mobil Uygulama" };
export type CallStatus = "acik" | "islemde" | "kapandi";
export type Call = {
  id: string;
  at: Date;
  channel: CallChannel;
  kind: CallKind;
  customerId: string | null;
  meterId: string | null;
  transformerId: string | null;
  priority: "dusuk" | "normal" | "yuksek";
  status: CallStatus;
  assignee: string;
  /** Çözüm süresi hedefi (dakika). */
  slaMinutes: number;
  /** Bağlı arıza ve notlar. */
  outageId: string | null;
  note: string;
  rating?: number;
};

const CALL_NOTES: Record<CallKind, string[]> = {
  ariza: ["Mahallede enerji yok", "Yalnızca abonenin tesisatında enerji yok", "Enerji sürekli gidip geliyor", "Sigorta atıyor, sayaç ekranı kapalı"],
  fatura: ["Fatura tutarını yüksek buldu", "Son ödeme tarihini sordu", "Aynı döneme iki fatura geldiğini bildirdi"],
  sayac: ["Sayaç ekranında hata kodu görünüyor", "Sayaç değişimi talep etti", "Sayaç mührünün koptuğunu bildirdi"],
  bilgi: ["Tarife bilgisi istedi", "Yeni bağlantı başvuru sürecini sordu", "Tedarikçi değiştirmek istiyor"],
  sikayet: ["Ekibin geç geldiğini bildirdi", "Kesinti bildirimi almadığını söyledi", "Okuma görevlisi uğramadı"],
  kesme: ["Ödeme yaptı, yeniden bağlama bekliyor", "Kesme ihtarı aldı, ödeme planı soruyor"],
};

function buildCalls(): Call[] {
  const rand = seeded(54112);
  const rows: Call[] = [];
  let n = 0;
  const mk = (partial: Partial<Call> & Pick<Call, "at" | "kind">): Call => {
    const c = partial.customerId === undefined ? pick(rand, CUSTOMERS.filter((x) => x.status === "aktif")) : partial.customerId ? customer(partial.customerId) : null;
    const m = c ? METERS.find((x) => x.customerId === c.id) : undefined;
    n += 1;
    return {
      id: `CG-26${String(1000 + n)}`,
      channel: pick(rand, ["telefon", "telefon", "telefon", "sms", "web", "mobil"] as const),
      customerId: c ? c.id : null,
      meterId: partial.meterId ?? m?.id ?? null,
      transformerId: partial.transformerId ?? m?.transformerId ?? null,
      priority: partial.kind === "ariza" ? "yuksek" : "normal",
      status: "kapandi",
      assignee: pick(rand, ["Burak Tunç", "Nilay Özer"]),
      slaMinutes: partial.kind === "ariza" ? 120 : partial.kind === "kesme" ? 480 : 1440,
      outageId: null,
      note: pick(rand, CALL_NOTES[partial.kind]),
      ...partial,
    };
  };
  // Son 30 gün: günlük 5-9 çağrı (kapanmış).
  for (let d = 30; d >= 1; d--) {
    const count = int(rand, 3, 7);
    for (let k = 0; k < count; k++) {
      const kind = pick(rand, ["fatura", "fatura", "ariza", "sayac", "bilgi", "sikayet", "kesme"] as const);
      rows.push(mk({ at: at(d, int(rand, 8, 18), int(rand, 0, 59)), kind, rating: rand() < 0.6 ? int(rand, 3, 5) : undefined }));
    }
  }
  // Açık arızalara bağlı çağrılar: ortak arıza.
  const open = OUTAGES.filter((o) => o.status === "acik");
  open.forEach((o) => {
    const trs = o.transformerIds ?? [];
    const meters = METERS.filter((m) => m.transformerId && trs.includes(m.transformerId));
    meters.slice(0, 4).forEach((m, i) =>
      rows.push(mk({ at: at(0, 7, 30 + i * 6), kind: "ariza", customerId: m.customerId, meterId: m.id, transformerId: m.transformerId ?? null, status: i < 2 ? "islemde" : "acik", outageId: o.id, note: "Mahallede enerji yok" })),
    );
  });
  // Olası arıza: bir DTR'ye 3+ çağrı, henüz arızaya bağlanmamış.
  const loaded = new Map<string, Meter[]>();
  for (const m of METERS) if (m.transformerId) loaded.set(m.transformerId, [...(loaded.get(m.transformerId) ?? []), m]);
  const openTr = new Set(open.flatMap((o) => o.transformerIds ?? []));
  const cand = [...loaded.entries()].filter(([id, ms]) => ms.length >= 3 && !openTr.has(id)).slice(0, 2);
  cand.forEach(([trId, ms], ci) =>
    ms.slice(0, 3).forEach((m, i) => rows.push(mk({ at: at(0, 9, 5 + ci * 9 + i * 4), kind: "ariza", customerId: m.customerId, meterId: m.id, transformerId: trId, status: "acik", note: "Enerji sürekli gidip geliyor" }))),
  );
  return rows.sort((a, b) => b.at.getTime() - a.at.getTime());
}
export const CALLS: readonly Call[] = buildCalls();

/* ======================================================================== */
/* TRAFO YÜKÜ (SCADA)                                                        */
/* ======================================================================== */

export type TransformerLoad = { id: string; kva: number; connectedKva: number; loadKw: number; loadPct: number; customers: number };
/**
 * Doluluk = (modellenen abonelerin tepe yükü + modellenmeyen aboneler payı) / kapasite.
 * Pilot veride DTR başına birkaç abone var; gerisi "diğer aboneler" olarak kapasitenin
 * tohumlu bir payıyla temsil edilir (ÖRNEK). Birkaç trafo kasten yüksek yüklüdür.
 */
function buildLoads(): TransformerLoad[] {
  return TRANSFORMERS.map((t, i) => {
    const rand = seeded(hashSeed(`load:${t.id}`));
    const mine = METERS.filter((m) => m.transformerId === t.id);
    const modeled = mine.reduce((s, m) => s + (customer(m.customerId).baseKwh / 720) * 3.2, 0);
    const ghostShare = i % 17 === 3 ? between(rand, 0.78, 0.9) : between(rand, 0.28, 0.66);
    const loadKw = Math.round((modeled + t.kva * 0.9 * ghostShare) * 10) / 10;
    return { id: t.id, kva: t.kva, connectedKva: Math.round(t.kva * between(rand, 1.1, 1.5)), loadKw, loadPct: Math.round((loadKw / (t.kva * 0.9)) * 1000) / 10, customers: mine.length };
  });
}
export const TRANSFORMER_LOADS: readonly TransformerLoad[] = buildLoads();

/* ======================================================================== */
/* ÜRETİCİLER (net ölçüm, lisanssız üretim)                                   */
/* ======================================================================== */

export type ProducerStatus = "basvuru" | "kabul" | "devrede";
export const PRODUCER_STATUS_LABEL: Record<ProducerStatus, string> = { basvuru: "Başvuru", kabul: "Kabul Edildi", devrede: "Devrede" };
export type Producer = {
  id: string;
  customerId: string;
  meterId: string;
  kind: "GES";
  installedKw: number;
  status: ProducerStatus;
  appliedAt: string;
  acceptedAt: string | null;
  /** Devreden alacak (kWh): aylık net değer eksiye düşünce birikir. */
  creditKwh: number;
};

function buildProducers(): Producer[] {
  const rand = seeded(9171);
  const ids = [...PRODUCER_CUSTOMER_IDS];
  return ids.map((customerId, i) => {
    const m = METERS.find((x) => x.customerId === customerId)!;
    const c = customer(customerId);
    const status: ProducerStatus = i >= ids.length - 2 ? "basvuru" : i === ids.length - 3 ? "kabul" : "devrede";
    const installedKw = Math.min(c.contractKw ?? 10, c.kind === "ticari" ? pick(rand, [10, 15, 20, 30]) : pick(rand, [3, 5, 6, 8, 10]));
    return {
      id: `UR-${pad(i + 1)}`,
      customerId,
      meterId: m.id,
      kind: "GES" as const,
      installedKw,
      status,
      appliedAt: dayKey(addDays(TODAY, -int(rand, status === "basvuru" ? 4 : 120, status === "basvuru" ? 20 : 700))),
      acceptedAt: status === "basvuru" ? null : dayKey(addDays(TODAY, -int(rand, status === "kabul" ? 3 : 60, status === "kabul" ? 12 : 600))),
      creditKwh: status === "devrede" ? int(rand, 0, 900) : 0,
    };
  });
}
export const PRODUCERS: readonly Producer[] = buildProducers();

/* ======================================================================== */
/* İTİRAZLAR VE ALACAKLAR                                                     */
/* ======================================================================== */

export type DisputeKind = "fatura" | "sayac" | "kacak" | "kesme";
export const DISPUTE_KIND_LABEL: Record<DisputeKind, string> = { fatura: "Fatura", sayac: "Sayaç Doğruluğu", kacak: "Kaçak Tutanağı", kesme: "Kesme" };
export type DisputeStatus = "acik" | "inceleme" | "karar" | "kapandi";
export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = { acik: "Açık", inceleme: "İncelemede", karar: "Karar Bekliyor", kapandi: "Kapandı" };
export type Dispute = {
  id: string;
  kind: DisputeKind;
  /** İtiraz edilen kayıt: fatura/sayaç/vaka kimliği. */
  subjectId: string;
  customerId: string;
  reason: string;
  openedAt: string;
  /** Yanıt süresi sınırı (açılıştan 15 gün: ÖRNEK parametre). */
  dueAt: string;
  status: DisputeStatus;
  decision: "kabul" | "red" | "kismi" | null;
  /** Sayaç doğruluk testi istendi mi. */
  meterTest: boolean;
  assignedTo: string;
};

function buildDisputes(): Dispute[] {
  const rand = seeded(40233);
  const rows: Dispute[] = [];
  const add = (kind: DisputeKind, subjectId: string, customerId: string, reason: string, daysAgo: number, status: DisputeStatus, decision: Dispute["decision"] = null, meterTest = false) => {
    const opened = dayKey(addDays(TODAY, -daysAgo));
    rows.push({ id: `IT-26${pad(rows.length + 1)}`, kind, subjectId, customerId, reason, openedAt: opened, dueAt: dayKey(addDays(addDays(TODAY, -daysAgo), 15)), status, decision, meterTest, assignedTo: pick(rand, ["Burak Tunç", "Nilay Özer"]) });
  };
  INVOICES.filter((i) => i.status === "itirazli").slice(0, 6).forEach((i, k) => add("fatura", i.id, i.customerId, i.dispute ?? "Tüketim beklenenden yüksek", 2 + k * 2, k < 2 ? "acik" : k < 4 ? "inceleme" : "karar"));
  const faulty = METERS.filter((m) => m.status === "arizali" || m.status === "iletisim-yok").slice(0, 3);
  faulty.forEach((m, k) => add("sayac", m.id, m.customerId, "Sayaç fazla gösteriyor, doğruluk testi istiyorum", 3 + k * 4, k === 0 ? "inceleme" : "acik", null, true));
  LEAKS.filter((l) => l.stage === "itiraz" || l.stage === "kapandi").slice(0, 2).forEach((l, k) => add("kacak", l.id, l.customerId, "Tutanak hatalı, müdahale etmedim", 6 + k * 6, k === 0 ? "karar" : "kapandi", k === 0 ? null : "kismi"));
  const cut = CUSTOMERS.find((c) => c.status === "kesik");
  if (cut) add("kesme", cut.id, cut.id, "Ödeme yaptım ama enerji verilmedi", 1, "acik");
  return rows;
}
export const DISPUTES: readonly Dispute[] = buildDisputes();

export type CreditSource = "fazla-odeme" | "cift-odeme" | "iptal" | "kapanis" | "avans";
export const CREDIT_SOURCE_LABEL: Record<CreditSource, string> = { "fazla-odeme": "Fazla Ödeme", "cift-odeme": "Çift Ödeme", iptal: "İptal Faturası", kapanis: "Abonelik Kapanışı", avans: "Avans" };
export type Credit = { id: string; customerId: string; source: CreditSource; amount: number; createdAt: string; status: "acik" | "mahsup" | "iade"; note?: string };

function buildCredits(): Credit[] {
  const rand = seeded(7733);
  const sources: CreditSource[] = ["fazla-odeme", "fazla-odeme", "cift-odeme", "cift-odeme", "iptal", "iptal", "kapanis", "kapanis", "avans", "fazla-odeme"];
  return sources.map((source, i) => {
    const c = pick(rand, CUSTOMERS);
    const status: Credit["status"] = i < 6 ? "acik" : i < 8 ? "mahsup" : "iade";
    return { id: `AL-26${pad(i + 1)}`, customerId: c.id, source, amount: int(rand, 1_800, 94_000), createdAt: dayKey(addDays(TODAY, -int(rand, 1, 40))), status };
  });
}
export const CREDITS: readonly Credit[] = buildCredits();

/* ======================================================================== */
/* KVKK                                                                      */
/* ======================================================================== */

export type ConsentKind = "aydinlatma" | "ticari-ileti" | "sms" | "eposta";
export const CONSENT_LABEL: Record<ConsentKind, string> = { aydinlatma: "Aydınlatma metni", "ticari-ileti": "Ticari elektronik ileti", sms: "SMS bilgilendirme", eposta: "E-posta bilgilendirme" };
export type Consent = { id: string; customerId: string; kind: ConsentKind; given: boolean; at: string; channel: "sube" | "web" | "cagri" | "mobil" };
export type DataRequestKind = "erisim" | "silme" | "duzeltme" | "itiraz";
export const DATA_REQUEST_LABEL: Record<DataRequestKind, string> = { erisim: "Verime erişim", silme: "Verilerin silinmesi", duzeltme: "Düzeltme", itiraz: "İşlemeye itiraz" };
export type DataRequest = { id: string; customerId: string; kind: DataRequestKind; openedAt: string; /** 30 gün (ÖRNEK parametre). */ dueAt: string; status: "acik" | "isleniyor" | "tamam" };

function buildConsents(): Consent[] {
  const rand = seeded(3141);
  const rows: Consent[] = [];
  CUSTOMERS.slice(0, 80).forEach((c, i) => {
    const kinds: ConsentKind[] = ["aydinlatma", "ticari-ileti", "sms", "eposta"];
    for (const kind of kinds) {
      const given = kind === "aydinlatma" ? true : rand() < (kind === "sms" ? 0.82 : 0.45);
      rows.push({ id: `RZ-${i}-${kind}`, customerId: c.id, kind, given, at: dayKey(addDays(TODAY, -int(rand, 5, 900))), channel: pick(rand, ["sube", "web", "cagri", "mobil"] as const) });
    }
  });
  return rows;
}
export const CONSENTS: readonly Consent[] = buildConsents();

function buildDataRequests(): DataRequest[] {
  const rand = seeded(2718);
  const kinds: DataRequestKind[] = ["erisim", "erisim", "silme", "duzeltme", "itiraz", "erisim", "silme", "duzeltme"];
  return kinds.map((kind, i) => {
    const daysAgo = int(rand, 1, 33);
    const c = pick(rand, CUSTOMERS);
    return { id: `VT-26${pad(i + 1)}`, customerId: c.id, kind, openedAt: dayKey(addDays(TODAY, -daysAgo)), dueAt: dayKey(addDays(addDays(TODAY, -daysAgo), 30)), status: daysAgo > 28 ? ("isleniyor" as const) : i % 3 === 0 ? ("tamam" as const) : ("acik" as const) };
  });
}
export const DATA_REQUESTS: readonly DataRequest[] = buildDataRequests();

export type { Customer, Outage };
export { READINGS, TODAY_KEY };
