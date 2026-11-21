import { audit, auditDenied } from "./_audit";
import { createSlice, nextId, useStoreVersion } from "./_core";
import { PERIODS_12, SUPPLIERS, TODAY, TODAY_KEY, addDays, customer, dayKey, parseDay } from "./_data";
import { TRANSFERS, batchInvoiced, distributionBilled, type Transfer, type TransferStage } from "./_data-operasyon";
import { allCustomers, patchCustomer, patchOf } from "./_data-musteri";
import { can } from "./_permissions";

/**
 * Tedarikçiler sayfasının oturum durumu: geçiş (tedarikçi değişikliği) kuyruğu ve
 * dağıtım bedeli mutabakatı. Tek yayın kanalındaki dilimlerde durur: sayfa
 * değişince korunur, Aboneler sayfasından başlatılan değişiklik de bu kuyruğa düşer.
 *
 * DOĞRU YÖN: dağıtım bedeli TOPLU FATURASINI dağıtım şirketi (Kuzeyova) keser ve
 * tedarikçiye gönderir; fark varsa TEDARİKÇİ itiraz eder. Burada portal kullanıcısı
 * itirazı kaydeder, düzeltme keser ya da itirazı gerekçeyle reddeder.
 */

/** Azami geçiş süresi (gün): ÖRNEK parametre, mevzuattan teyit edilmeli. */
export const TRANSFER_MAX_DAYS = 21;

export type TransferRow = Transfer & { source: "portal" | "musteri" };

const stored = createSlice<readonly TransferRow[]>(TRANSFERS.map((t) => ({ ...t, source: "portal" as const })));

/** Abone kartından başlatılan (henüz kuyrukta olmayan) değişiklikler: sanal "talep" kayıtları. */
function customerInitiated(): TransferRow[] {
  const have = new Set(stored.get().map((t) => t.customerId));
  return allCustomers()
    .filter((c) => !have.has(c.id) && patchOf(c.id)?.supplierChange)
    .map((c) => {
      const sc = patchOf(c.id)!.supplierChange!;
      return { id: `G-M-${c.id.slice(2)}`, customerId: c.id, from: c.supplierId, to: sc.supplierId, stage: "talep" as const, requested: TODAY_KEY, effective: null, blocker: null, source: "musteri" as const };
    });
}

export const getTransfers = (): TransferRow[] => [...customerInitiated(), ...stored.get()];
export function useTransfers(): TransferRow[] {
  useStoreVersion();
  return getTransfers();
}

export const transferElapsed = (t: Transfer) => Math.max(0, Math.round((TODAY.getTime() - parseDay(t.requested).getTime()) / 86_400_000));
/** Kalan gün; negatifse süre aşıldı. */
export const transferDaysLeft = (t: Transfer) => TRANSFER_MAX_DAYS - transferElapsed(t);

function materialize(id: string): TransferRow | undefined {
  const existing = stored.get().find((t) => t.id === id);
  if (existing) return existing;
  const virtual = customerInitiated().find((t) => t.id === id);
  if (virtual) stored.set((l) => [virtual, ...l]);
  return virtual;
}
const patchRow = (id: string, change: Partial<TransferRow>) => stored.set((l) => l.map((t) => (t.id === id ? { ...t, ...change } : t)));

const guard = (action: string, target: string): boolean => {
  if (!can("musteri")) {
    auditDenied(action, target);
    return false;
  }
  return true;
};

export function moveToVerify(id: string): boolean {
  if (!guard("Geçişi doğrulamaya aldı", id)) return false;
  const t = materialize(id);
  if (!t) return false;
  patchRow(id, { stage: "dogrulama" as TransferStage });
  audit("Geçişi doğrulamaya aldı", id, "Talep Alındı", "Doğrulama");
  return true;
}

export function giveTransferDate(id: string, effective: string): { ok: true } | { ok: false; error: string } {
  if (!guard("Geçiş tarihi verdi", id)) return { ok: false, error: "Yetkiniz yok." };
  const t = stored.get().find((x) => x.id === id);
  if (!t) return { ok: false, error: "Talep bulunamadı." };
  if (t.blocker) return { ok: false, error: "Engel kapanmadan tarih verilemez." };
  const limit = dayKey(addDays(parseDay(t.requested), TRANSFER_MAX_DAYS));
  if (effective <= TODAY_KEY) return { ok: false, error: "Tarih bugünden sonra olmalı." };
  if (effective > limit) return { ok: false, error: `Geçiş en geç ${limit} tarihinde olmalı (azami ${TRANSFER_MAX_DAYS} gün).` };
  patchRow(id, { stage: "tarih", effective });
  audit("Geçiş tarihi verdi", id, undefined, effective);
  return { ok: true };
}

/** Tamamlanınca abonenin tedarikçisi gerçekten değişir (Aboneler, Faturalar aynı kaynağı görür). */
export function completeTransfer(id: string): boolean {
  if (!guard("Geçişi tamamladı", id)) return false;
  const t = stored.get().find((x) => x.id === id);
  if (!t) return false;
  patchRow(id, { stage: "tamam" });
  patchCustomer(t.customerId, { supplierId: t.to, supplierChange: null }, { title: "Tedarikçi değişti", description: `${t.from} → ${t.to} (${id})`, tone: "success" });
  audit("Geçişi tamamladı", id, t.from, t.to);
  return true;
}

export function rejectTransfer(id: string, reason: string, note: string): boolean {
  if (!guard("Geçiş talebini reddetti", id)) return false;
  const t = materialize(id);
  if (!t) return false;
  stored.set((l) => l.filter((x) => x.id !== id));
  if (t.source === "musteri" || patchOf(t.customerId)?.supplierChange) patchCustomer(t.customerId, { supplierChange: null }, { title: "Tedarikçi değişikliği reddedildi", description: reason, tone: "warning" });
  audit("Geçiş talebini reddetti", id, undefined, `${reason}${note.trim() ? ` · ${note.trim()}` : ""}`);
  return true;
}

export function startTransferFor(customerId: string, to: string): TransferRow | null {
  if (!guard("Geçiş başlattı", customerId)) return null;
  const c = customer(customerId);
  if (stored.get().some((t) => t.customerId === customerId && t.stage !== "tamam")) return null;
  const row: TransferRow = { id: nextId("G-", 5200), customerId, from: c.supplierId, to, stage: "talep", requested: TODAY_KEY, effective: null, blocker: null, source: "portal" };
  stored.set((l) => [row, ...l]);
  audit("Geçiş başlattı", row.id, c.supplierId, to);
  return row;
}

/* ======================================================================== */
/* Dağıtım bedeli toplu faturası mutabakatı                                  */
/* ======================================================================== */

export type ReconState = { status: "mutabik" | "itirazli"; how: "duzeltme" | "kabul" | "red" | "itiraz"; by: string; note: string };
const recon = createSlice<Readonly<Record<string, ReconState>>>({});
export const getRecon = (supplierId: string, period: string): ReconState | undefined => recon.get()[`${supplierId}:${period}`];
export function useRecon(): Readonly<Record<string, ReconState>> {
  return recon.use();
}

export type BatchInvoice = {
  id: string;
  supplierId: string;
  period: string;
  /** Abone faturalarındaki dağıtım bedeli toplamı (kuruş). */
  billed: number;
  /** Dağıtım şirketinin tedarikçiye kestiği toplu fatura (kuruş). */
  batch: number;
  /** Toplu fatura − abone faturaları. */
  diff: number;
  issued: string;
  due: string;
  state: ReconState | undefined;
};

export function batchInvoice(supplierId: string, period: string): BatchInvoice {
  const billed = distributionBilled(supplierId, period);
  const batch = batchInvoiced(supplierId, period);
  const issued = `${period}-28`;
  return {
    id: `DB-${period.replace("-", "")}-${supplierId.slice(2)}`,
    supplierId,
    period,
    billed,
    batch,
    diff: batch - billed,
    issued,
    due: dayKey(addDays(parseDay(issued), 10)),
    state: getRecon(supplierId, period),
  };
}
export const batchInvoices = (period: string): BatchInvoice[] => SUPPLIERS.map((s) => batchInvoice(s.id, period));

/** Tutardan fark: portal "farkı" düzeltmeyle kapatınca etkin fark 0. */
export const effectiveDiff = (b: BatchInvoice) => (b.state?.status === "mutabik" ? 0 : b.diff);

function decideRecon(b: BatchInvoice, state: ReconState, action: string) {
  recon.set((m) => ({ ...m, [`${b.supplierId}:${b.period}`]: state }));
  audit(action, b.id, `Fark ${b.diff / 100} TL`, state.how);
}
const reconGuard = (action: string, target: string) => {
  if (!can("odeme")) {
    auditDenied(action, target);
    return false;
  }
  return true;
};

/** Tedarikçinin itirazını kaydet (fark inceleniyor). */
export function recordSupplierObjection(b: BatchInvoice, note: string): boolean {
  if (!reconGuard("Tedarikçi itirazını kaydetti", b.id)) return false;
  decideRecon(b, { status: "itirazli", how: "itiraz", by: "Tedarikçi", note }, "Tedarikçi itirazını kaydetti");
  return true;
}
/** Düzeltme faturası keserek mutabık yap (fark iade/ek fatura ile kapanır). */
export function settleWithCorrection(b: BatchInvoice): boolean {
  if (!reconGuard("Düzeltme faturası kesti", b.id)) return false;
  decideRecon(b, { status: "mutabik", how: "duzeltme", by: "Kuzeyova", note: `Düzeltme faturası: ${b.diff > 0 ? "iade" : "ek"} ${Math.abs(b.diff) / 100} TL` }, "Dağıtım bedeli düzeltme faturası kesti");
  return true;
}
/** İtirazı gerekçeyle reddet (toplu fatura geçerli). */
export function rejectObjection(b: BatchInvoice, note: string): boolean {
  if (!reconGuard("Tedarikçi itirazını reddetti", b.id)) return false;
  decideRecon(b, { status: "mutabik", how: "red", by: "Kuzeyova", note }, "Tedarikçi itirazını reddetti");
  return true;
}

export const reconPeriods = () => PERIODS_12.slice(-3).reverse();
/** Tüm tedarikçi ve son üç dönem için etkin açık fark (mutlak, kuruş). */
export function openReconDiff(): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const p of reconPeriods())
    for (const b of batchInvoices(p)) {
      const d = effectiveDiff(b);
      if (d !== 0) {
        count++;
        total += Math.abs(d);
      }
    }
  return { count, total };
}
