import { createSlice, nextId } from "./_core";
import { audit } from "./_audit";
import {
  METERS,
  OUTAGES,
  READINGS,
  TODAY,
  TRANSFORMERS,
  type Meter,
  type MeterStatus,
  type Outage,
  type Reading,
  type ReadingStatus,
} from "./_data";

/**
 * Okuma, sayaç ve arıza işlemleri: üreteç tabanının ÜSTÜNE yazılan yamalar.
 * Taban (`_data.ts`) değişmez; her işlem burada bir yama olarak durur ve
 * `effective*` işlevleri taban + yama birleşimini verir. Böylece okuma onayı,
 * ekip ataması ya da arıza kapatma sayfa değişince kaybolmaz ve rozetler,
 * pano ile tahakkuk aynı kaynaktan beslenir.
 */

/* --- Okumalar --------------------------------------------------------------- */

export type ReadingPatch = Partial<Pick<Reading, "status" | "source" | "index" | "usage" | "reactive" | "demandKw" | "flags" | "date">> & { note?: string };
const readingPatches = createSlice<Readonly<Record<string, ReadingPatch>>>({});

export const useReadingPatches = () => readingPatches.use();
export const getReadingPatches = () => readingPatches.get();

export const applyReadingPatch = (r: Reading, patches: Readonly<Record<string, ReadingPatch>> = readingPatches.get()): Reading => {
  const p = patches[r.id];
  if (!p) return r;
  const { note, ...rest } = p;
  void note;
  return { ...r, ...rest };
};
export const effectiveReadings = (): Reading[] => READINGS.map((r) => applyReadingPatch(r));
export const effectiveReadingStatus = (r: Reading): ReadingStatus => readingPatches.get()[r.id]?.status ?? r.status;

export type ReadingDecision = "onayla" | "duzelt" | "yeniden" | "tahmini";
/** Şüpheli okumayı karara bağlar. Onay, okumayı fatura taslağına serbest bırakır. */
export function resolveReading(readingId: string, decision: ReadingDecision, note?: string) {
  const r = READINGS.find((x) => x.id === readingId);
  if (!r) return;
  const before = effectiveReadingStatus(r);
  const status: ReadingStatus = decision === "onayla" ? "dogrulandi" : decision === "duzelt" ? "duzeltildi" : decision === "tahmini" ? "dogrulandi" : "bekliyor";
  readingPatches.set((p) => ({
    ...p,
    [readingId]: { ...p[readingId], status, note, ...(decision === "tahmini" ? { source: "tahmini" as const } : {}), ...(decision === "yeniden" ? { source: "yok" as const, flags: [] } : {}) },
  }));
  const label = { onayla: "Okuma onayladı", duzelt: "Okumayı düzeltti", yeniden: "Yeniden okuma istedi", tahmini: "Tahmini okuma yazdı" }[decision];
  audit(label, `${readingId} · ${r.meterId}`, before, status);
}

/** Bekleyen okumaya endeks girer; bayrak varsa şüpheli, yoksa doğrulanmış olur. */
export function enterReading(readingId: string, input: Required<Pick<ReadingPatch, "source" | "index" | "usage" | "reactive" | "demandKw" | "flags">>) {
  const r = READINGS.find((x) => x.id === readingId);
  if (!r) return;
  const status: ReadingStatus = input.flags.length ? "supheli" : "dogrulandi";
  readingPatches.set((p) => ({ ...p, [readingId]: { ...p[readingId], ...input, status } }));
  audit("Okuma girdi", `${readingId} · ${r.meterId}`, r.status, `${status} · ${input.usage.total} kWh`);
}

/* --- Sayaçlar ----------------------------------------------------------------- */

export type MeterOps = { relay?: "acik" | "kesik"; clockSyncedAt?: string; status?: MeterStatus; replacedBy?: string; inRoute?: boolean };
const meterOps = createSlice<Readonly<Record<string, MeterOps>>>({});
export const useMeterOps = () => meterOps.use();
export const getMeterOps = () => meterOps.get();

export const effectiveMeter = (m: Meter): Meter => {
  const o = meterOps.get()[m.id];
  return o?.status ? { ...m, status: o.status } : m;
};
export const effectiveMeters = (): Meter[] => METERS.map(effectiveMeter);

export function patchMeter(meterId: string, patch: MeterOps, auditLabel?: string, detail?: string) {
  meterOps.set((s) => ({ ...s, [meterId]: { ...s[meterId], ...patch } }));
  if (auditLabel) audit(auditLabel, meterId, undefined, detail);
}
export const relayOf = (meterId: string): "acik" | "kesik" => meterOps.get()[meterId]?.relay ?? "acik";

/* --- Arıza ve kesintiler ------------------------------------------------------- */

export type OutageEventTone = "neutral" | "primary" | "success" | "warning" | "danger";
export type OutagePatch = {
  crew?: string;
  /** Tahmini onarım süresi (dakika, şimdiden). */
  etaMin?: number;
  closedAt?: Date;
  cancelled?: boolean;
  smsSent?: number;
  events: readonly { id: string; at: Date; title: string; detail?: string; tone: OutageEventTone }[];
};
type OutageState = { patches: Readonly<Record<string, OutagePatch>>; extra: readonly Outage[] };
const outageState = createSlice<OutageState>({ patches: {}, extra: [] });
export const useOutageState = () => outageState.use();
export const getOutageState = () => outageState.get();

let clock = 0;
const stamp = () => new Date(TODAY.getTime() + ++clock * 60_000);

export function applyOutagePatch(o: Outage, s: OutageState = outageState.get()): Outage {
  const p = s.patches[o.id];
  if (!p) return o;
  if (p.cancelled) return { ...o, status: "cozuldu", end: p.closedAt ?? TODAY };
  if (p.closedAt) return { ...o, status: "cozuldu", end: p.closedAt, crew: p.crew ?? o.crew };
  return { ...o, crew: p.crew ?? o.crew };
}
export const effectiveOutages = (): Outage[] => [...outageState.get().extra, ...OUTAGES].map((o) => applyOutagePatch(o));
export const outageById = (id: string) => effectiveOutages().find((o) => o.id === id);

function addOutageEvent(id: string, title: string, tone: OutageEventTone, detail?: string, extra: Partial<OutagePatch> = {}) {
  outageState.set((s) => {
    const prev = s.patches[id] ?? { events: [] };
    return { ...s, patches: { ...s.patches, [id]: { ...prev, ...extra, events: [...prev.events, { id: nextId("oe-"), at: stamp(), title, detail, tone }] } } };
  });
}

export function assignOutageCrew(id: string, crew: string) {
  const o = outageById(id);
  addOutageEvent(id, "Ekip atandı", "primary", crew, { crew });
  audit("Arızaya ekip atadı", id, o?.crew, crew);
}
export function setOutageEta(id: string, etaMin: number) {
  addOutageEvent(id, "Tahmini süre güncellendi", "neutral", `${etaMin} dk`, { etaMin });
  audit("Arıza süresini güncelledi", id, undefined, `${etaMin} dk`);
}
export function sendOutageSms(id: string, count: number) {
  addOutageEvent(id, "Müşterilere SMS gönderildi", "neutral", `${count} abone`, { smsSent: (outageState.get().patches[id]?.smsSent ?? 0) + count });
  audit("Arıza SMS'i gönderdi", id, undefined, `${count} abone`);
}
export function closeOutage(id: string) {
  addOutageEvent(id, "Enerji verildi, kayıt kapatıldı", "success", undefined, { closedAt: stamp() });
  audit("Arızayı kapattı", id, "Açık", "Giderildi");
}
export function cancelOutage(id: string) {
  addOutageEvent(id, "Kayıt iptal edildi", "danger", undefined, { cancelled: true, closedAt: stamp() });
  audit("Planlı çalışmayı iptal etti", id, "Planlandı", "İptal");
}

export type NewOutage = { kind: "plansiz" | "planli"; substationId: string; regionId: string; feederId?: string; transformerIds?: readonly string[]; start: Date; end: Date | null; cause: string; crew: string; affected?: number };
/** Yeni arıza ya da planlı çalışma kaydı. Etkilenen abone, seçilen DTR'lerdeki sayaçlardan türer. */
export function createOutage(input: NewOutage): Outage {
  const trs = input.transformerIds ?? [];
  const affected = input.affected ?? (trs.length ? METERS.filter((m) => m.transformerId && trs.includes(m.transformerId)).length : TRANSFORMERS.filter((t) => t.feederId === input.feederId).length * 2);
  const o: Outage = {
    id: nextId(`K-${2026}`, 1300),
    kind: input.kind,
    status: input.kind === "planli" && input.start > TODAY ? "planlandi" : input.end ? "cozuldu" : "acik",
    substationId: input.substationId,
    regionId: input.regionId,
    start: input.start,
    end: input.end,
    affected: Math.max(1, affected),
    feederId: input.feederId,
    transformerIds: trs,
    cause: input.cause,
    crew: input.crew,
  };
  outageState.set((s) => ({ ...s, extra: [o, ...s.extra] }));
  audit(input.kind === "planli" ? "Planlı çalışma planladı" : "Arıza kaydı açtı", o.id, undefined, `${o.cause} · ${o.affected} abone`);
  return o;
}
