import { audit, auditDenied } from "./_audit";
import { CURRENT_PERIOD, PERIODS_12, READINGS, customer, meterById, supplier } from "./_data";
import { allInvoices, getFinance } from "./_data-finans";
import { TRANSFORMER_LOADS, type Producer } from "./_data-yeni";
import { can } from "./_permissions";
import { applyCredit, createCredit, settleProducerCredit } from "./_store";

/**
 * Üreticiler (net ölçüm / lisanssız üretim) için hesaplar. Çift yönlü sayaç:
 * 1.8.0 şebekeden çekilen, 2.8.0 şebekeye verilen enerji. Dönem sonu net değer
 * `çekilen − verilen`; eksiye düşen kısım devreden alacak (kWh) olarak birikir
 * ve dönem mahsubuyla faturaya yansıtılır. Birim bedel tedarikçinin T1 enerji
 * fiyatıdır (ÖRNEK; gerçek mahsup kuralları mevzuattan teyit edilmeli).
 */

export type ProducerPeriod = { period: string; consumed: number; exported: number; net: number; ratio: number };

/** Son 12 dönemin çekiş/veriş verisi (okumalardan). */
export function producerPeriods(p: Producer): ProducerPeriod[] {
  return PERIODS_12.map((period) => {
    const r = READINGS.find((x) => x.meterId === p.meterId && x.period === period && x.status !== "bekliyor");
    const consumed = Math.round(r?.usage.total ?? 0);
    const exported = Math.round(r?.exportKwh ?? 0);
    return { period, consumed, exported, net: consumed - exported, ratio: consumed > 0 ? Math.min(1, exported / consumed) : 0 };
  });
}

/** Çift yönlü sayaç endeksi (kümülatif): taban + dönem toplamları (ÖRNEK taban). */
export function producerIndexes(p: Producer): { period: string; imp: number; exp: number; consumed: number; exported: number }[] {
  const seed = Array.from(p.id).reduce((s, c) => s + c.charCodeAt(0), 0);
  let imp = 18_000 + seed * 37;
  let exp = 2_400 + seed * 11;
  return producerPeriods(p).map((r) => {
    imp += r.consumed;
    exp += r.exported;
    return { period: r.period, imp, exp, consumed: r.consumed, exported: r.exported };
  });
}

/** Trafo kapasitesi: üreticinin sayacının bağlı olduğu DTR'de boş güç ve uyarı. */
export function transformerHeadroom(p: Producer) {
  const m = meterById(p.meterId);
  const load = m?.transformerId ? TRANSFORMER_LOADS.find((t) => t.id === m.transformerId) : undefined;
  if (!load) return null;
  const capacityKw = Math.round(load.kva * 0.9 * 10) / 10;
  const headroomKw = Math.round((capacityKw - load.loadKw) * 10) / 10;
  return { id: load.id, kva: load.kva, loadPct: load.loadPct, headroomKw, warn: load.loadPct >= 85 || p.installedKw > Math.max(0, headroomKw) };
}

/** Kredi kWh karşılığı (kuruş): tedarikçinin T1 fiyatı. */
export const creditValue = (p: Producer, kwh: number) => Math.round(kwh * supplier(customer(p.customerId).supplierId).prices.t1 * 100);

/** Mahsubun yansıyacağı fatura: abonenin en eski açık faturası. */
export function settlementTarget(customerId: string) {
  return allInvoices(getFinance())
    .filter((i) => i.customerId === customerId && !i.cancelled && i.total - i.paid > 0)
    .sort((a, b) => (a.due < b.due ? -1 : 1))[0];
}

export type SettleResult = { ok: true; applied: number; remainder: number; invoiceId: string | null; creditId: string } | { ok: false; error: string };

/**
 * Dönem mahsubu: devreden alacağın seçilen kWh'si TL'ye çevrilir, abonenin en
 * eski açık faturasına tahsilat gibi işlenir (fatura bakiyesi, abone kartı,
 * Pano ve Ödemeler güncellenir); fatura bakiyesini aşan kısım açık alacak olarak kalır.
 */
export function settleToInvoice(p: Producer, kwh: number): SettleResult {
  if (!can("odeme")) {
    auditDenied("Üretici alacağını mahsup etti", p.id);
    return { ok: false, error: "Yetkiniz yok." };
  }
  if (!(kwh > 0)) return { ok: false, error: "kWh sıfırdan büyük olmalı." };
  if (kwh > p.creditKwh) return { ok: false, error: `Devreden alacak ${p.creditKwh} kWh; fazlası mahsup edilemez.` };
  const amount = creditValue(p, kwh);
  const target = settlementTarget(p.customerId);
  const remaining = target ? target.total - target.paid : 0;
  const applied = Math.min(amount, remaining);
  const remainder = amount - applied;
  const credit = createCredit(p.customerId, "avans", applied || amount);
  if (target && applied > 0) applyCredit(credit.id, target.id);
  if (remainder > 0 && applied > 0) createCredit(p.customerId, "avans", remainder);
  settleProducerCredit(p.id, kwh);
  audit("Üretici dönem mahsubu", p.id, `${p.creditKwh} kWh`, `${p.creditKwh - kwh} kWh · ${target ? target.id : "açık alacak"}`);
  return { ok: true, applied: target ? applied : 0, remainder: target ? remainder : amount, invoiceId: target?.id ?? null, creditId: credit.id };
}

export { CURRENT_PERIOD };
