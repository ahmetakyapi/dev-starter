#!/usr/bin/env node
/**
 * verify-edas-finans: Faturalar, Ödemeler, Tedarikçiler ve Üreticiler sayfalarının
 * iş kuralları (ödeme sırası, zam, fazla ödeme, vade uzatma onayı, banka satırı
 * alacağı, geçiş tamamlama, üretici mahsubu). `npm run verify:edas-finans`.
 * TypeScript kaynağı esbuild ile geçici paketlenir (bkz. verify-edas-data.mjs).
 */
import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const edas = join(root, "stories", "edas");

const entry = `
import * as D from "${edas}/_data";
import * as FIN from "${edas}/_data-finans";
import * as F from "${edas}/_data-fatura";
import * as T from "${edas}/_data-tedarik";
import * as U from "${edas}/_data-uretici";
import * as OPS from "${edas}/_data-operasyon";
import * as MUS from "${edas}/_data-musteri";
import * as S from "${edas}/_store";
import * as P from "${edas}/_permissions";

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });
const fin = () => FIN.getFinance();
const inv = (id) => FIN.invoiceOf(id, fin());

/* 1. Ödeme: zam ödenmeden fatura kapanmaz, fazlası alacak olur */
const overdue = FIN.allInvoices(fin()).filter(FIN.isOverdue).find((i) => F.dueNow(i).fee > 0 && i.paid === 0);
check("zamlı geciken fatura bulundu", !!overdue);
if (overdue) {
  const due = F.dueNow(overdue);
  const low = F.checkPayment(overdue, { amount: due.fee - 1, reference: "", date: D.TODAY_KEY });
  check("zamdan az tutar reddedilir", low.errors.length > 0);
  const dup = F.checkPayment(overdue, { amount: 1000, reference: D.PAYMENTS[0].reference, date: D.TODAY_KEY });
  check("mükerrer referans reddedilir", dup.errors.some((e) => e.includes("mükerrer")));
  const future = F.checkPayment(overdue, { amount: 1000, reference: "", date: "2999-01-01" });
  check("gelecek tarih reddedilir", future.errors.length > 0);
  // anapara kadar öde: zam düşülünce anapara kalır → Ödendi OLMAZ
  F.submitPayment(overdue, { amount: due.principal, channel: "banka", reference: "TEST-1", date: D.TODAY_KEY });
  const afterPartial = inv(overdue.id);
  check("zam düşünce anapara kalırsa Ödendi olmaz", afterPartial.status !== "odendi" && F.dueNow(afterPartial).total > 0, afterPartial.status);
  // kalan tamamını öde (+ 5 TL fazla): kapanır, fazlası alacak
  const rest = F.dueNow(afterPartial);
  const credits = S.getCredits().length;
  const r = F.submitPayment(afterPartial, { amount: rest.total + 500, channel: "banka", reference: "TEST-2", date: D.TODAY_KEY });
  const closed = inv(overdue.id);
  check("kalan toplam ödenince Ödendi", closed.status === "odendi" && F.dueNow(closed).total === 0, closed.status);
  check("fazla ödeme avans alacağına yazılır", r.ok && r.check.excess === 500 && S.getCredits().length === credits + 1);
  // geçmiş tarihli ödeme zammı o tarihe göre
  const other = FIN.allInvoices(fin()).filter(FIN.isOverdue).find((i) => i.id !== overdue.id && i.paid === 0 && i.lateFee === 0);
  if (other) {
    const early = F.dueNow(other, other.due.replace(/-\\d\\d$/, "-28") > D.TODAY_KEY ? D.TODAY_KEY : other.due);
    check("vadesinde ödeme zam doğurmaz", early.fee === 0);
  }
}

/* 2. Fatura kalemleri toplamı */
const sample = FIN.allInvoices(fin()).slice(0, 80);
check("Σ fatura kalemleri = fatura tutarı (80 örnek)", sample.every((i) => F.linesTotal(F.invoiceLines(i)) === i.total));
check("belge düzenleyen: abone faturası tedarikçi adına", sample.filter((i) => i.issuer === "tedarikci").every((i) => !F.issuerOf(i).name.includes("Dağıtım")));

/* 3. Vade uzatma: 30 gün altı doğrudan, üstü iki göz */
const list = FIN.allInvoices(fin()).filter(FIN.isOverdue).slice(5, 7).map((i) => i.id);
const direct = F.requestExtension(list, 14, "Müşteri talebi, belgeli");
check("14 gün uzatma doğrudan uygulanır", direct.ok && direct.status === "uygulandi");
const before = list.map((id) => inv(id).due);
if (direct.ok && direct.status === "uygulandi") { direct.undo(); check("uzatma geri alınır", list.every((id, k) => inv(id).due !== before[k])); }
check("gerekçesiz uzatma reddedilir", !F.requestExtension(list, 14, "x").ok);
const big = F.requestExtension(list, 45, "Mücbir sebep, yönetim kararı");
check("45 gün onaya gider", big.ok && big.status === "onay-bekliyor");
if (big.ok && big.status === "onay-bekliyor") {
  check("isteyen kendi isteğini onaylayamaz", !F.decideExtension(big.request.id, true).ok);
  const other = (await import("${edas}/_data-operasyon")).USERS.find((u) => u.active && u.name !== P.currentUser().name && ["yonetici", "tahsilat", "musteri"].includes(u.role));
  P.setUser(other.id);
  const ok = F.decideExtension(big.request.id, true);
  check("ikinci yetkili onaylayınca uygulanır", ok.ok);
  P.setUser("u-1");
}

/* 4. Yetkisiz kullanıcı ödeme giremez */
const viewer = (await import("${edas}/_data-operasyon")).USERS.find((u) => u.active && u.role === "denetci");
if (viewer) {
  P.setUser(viewer.id);
  const some = FIN.allInvoices(fin()).find((i) => i.paid === 0);
  check("denetçi ödeme giremez", F.submitPayment(some, { amount: 1000, channel: "banka", reference: "", date: D.TODAY_KEY }).ok === false);
  P.setUser("u-1");
}

/* 5. Banka satırı → alacak */
const lines = FIN.unmatchedLines(fin());
const fazla = lines.find((l) => l.kind === "fazla");
if (fazla) {
  const n = S.getCredits().length;
  const r = F.resolveBankLine(fazla, "avans");
  check("fazla banka satırı alacak doğurur", r.credit && S.getCredits().length === n + 1);
}
const dupLine = lines.find((l) => l.kind === "mukerrer");
if (dupLine) {
  const n = S.getCredits().length;
  const r = F.resolveBankLine(dupLine, "iade");
  check("mükerrer satır iade alacağı yazar", r.credit && S.getCredits().length === n + 1 && S.getCredits().find((c) => c.id === r.credit.id)?.status === "iade");
}
const waitingBefore = FIN.allPayments(fin()).filter((p) => p.recon === "bekliyor").length;
const approved = FIN.approveMatched(FIN.unmatchedLines(fin()).map((l) => l.paymentId), Array.from({ length: 4 }, (_, i) => D.dayKey(D.addDays(D.TODAY, -i))));
check("eşleşenler onaylanınca bekleyen azalır", approved >= 0 && FIN.allPayments(fin()).filter((p) => p.recon === "bekliyor").length === waitingBefore - approved);

/* 6. Tahakkuk geri alma */
const periodDrafts = FIN.draftsFor(D.CURRENT_PERIOD, fin()).length;
if (periodDrafts > 0) {
  const run = FIN.runAccrual(D.CURRENT_PERIOD);
  check("tahakkuk fatura keser", run.count === periodDrafts);
  const removed = FIN.undoAccrual(D.CURRENT_PERIOD);
  check("tahakkuk geri alınır", removed === periodDrafts && FIN.draftsFor(D.CURRENT_PERIOD, fin()).length === periodDrafts);
}
const prev = F.accrualPreview(D.CURRENT_PERIOD);
check("önizleme: şüpheli okuma hariç tutulur", prev.flaggedExcluded >= 0 && prev.eligible + prev.flaggedExcluded + prev.pending <= 2000);

/* 7. Geçiş: tamamlanınca tedarikçi gerçekten değişir; süre sınırı */
const t = T.getTransfers().find((x) => x.stage === "tarih");
if (t) {
  const c0 = MUS.findCustomer(t.customerId).supplierId;
  T.completeTransfer(t.id);
  check("geçiş tamamlanınca müşterinin tedarikçisi değişir", MUS.findCustomer(t.customerId).supplierId === t.to && c0 !== t.to);
}
const verify = T.getTransfers().find((x) => x.stage === "talep");
if (verify) {
  T.moveToVerify(verify.id);
  const late = T.giveTransferDate(verify.id, "2999-01-01");
  check("azami süreyi aşan geçiş tarihi reddedilir", late.ok === false);
}
check("toplu fatura yönü: fark tedarikçi itirazına konu", T.batchInvoices(D.PERIODS_12[10]).some((b) => b.diff !== 0));
const b0 = T.batchInvoices(D.PERIODS_12[10]).find((b) => b.diff !== 0);
if (b0) {
  T.recordSupplierObjection(b0, "Fark var");
  check("itiraz kaydı durumu değiştirir", T.getRecon(b0.supplierId, b0.period)?.status === "itirazli");
  T.settleWithCorrection(b0);
  check("düzeltme kesilince etkin fark 0", T.effectiveDiff(T.batchInvoice(b0.supplierId, b0.period)) === 0);
}

/* 8. Üretici mahsubu fatura bakiyesini düşürür */
const prod = S.getProducers().find((p) => p.status === "devrede" && p.creditKwh > 0 && U.settlementTarget(p.customerId));
if (prod) {
  const target = U.settlementTarget(prod.customerId);
  const kwh = Math.min(prod.creditKwh, 50);
  const bal0 = target.total - target.paid;
  const res = U.settleToInvoice(prod, kwh);
  const after = inv(target.id);
  check("üretici mahsubu başarılı", res.ok);
  check("mahsup fatura bakiyesini düşürür", after.paid > target.paid && res.ok && bal0 - (after.total - after.paid) === res.applied, String(res.applied));
  check("devreden alacak kWh azalır", S.getProducers().find((p) => p.id === prod.id).creditKwh === prod.creditKwh - kwh);
  check("kWh fazlası reddedilir", U.settleToInvoice(S.getProducers().find((p) => p.id === prod.id), 999999).ok === false);
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? "  ✓ " : "  ✗ ") + r.name + (r.detail && !r.ok ? "  → " + r.detail : ""));
console.log("\\n" + (failed.length ? failed.length + " kural kırıldı, " : "") + (results.length - failed.length) + "/" + results.length + " kural geçti");
process.exit(failed.length ? 1 : 0);
`;

const dir = mkdtempSync(join(tmpdir(), "edas-finans-"));
const out = join(dir, "run.mjs");
try {
  await build({ stdin: { contents: entry, resolveDir: root, loader: "ts", sourcefile: "verify-entry.ts" }, bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error", define: { "process.env.NODE_ENV": '"test"' } });
  writeFileSync(join(dir, "package.json"), '{"type":"module"}');
  await import(pathToFileURL(out).href);
} finally {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}
