#!/usr/bin/env node
/**
 * verify-kuzeyova-data: Kuzeyova Portalı örnek verisinin ve motorunun tutarlılık kuralları.
 *
 *   node scripts/verify-kuzeyova-data.mjs     (npm run verify:kuzeyova)
 *
 * TypeScript kaynağı esbuild ile geçici olarak paketlenir ve Node'da çalıştırılır
 * (depo vitest'i yalnız kök `snippets` ve `packages` için). Herhangi bir kural
 * kırılırsa çıkış kodu 1. CI'a bağlanmadı: ana oturum karar verir.
 */
import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const kuz = join(root, "stories", "kuzeyova");

const entry = `
import * as D from "${kuz}/_data";
import * as B from "${kuz}/_billing";
import * as C from "${kuz}/_calendar";
import * as FIN from "${kuz}/_data-finans";
import * as MUS from "${kuz}/_data-musteri";
import * as OPS from "${kuz}/_data-operasyon";
import * as OP from "${kuz}/_ops";
import * as Y from "${kuz}/_data-yeni";
import * as P from "${kuz}/_permissions";
import * as A from "${kuz}/_audit";
import * as S from "${kuz}/_store";
import * as SEL from "${kuz}/_selectors";
import * as CUT from "${kuz}/_cutpolicy";

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: Boolean(ok), detail });
const bad = (list, label, fmt) => ({ ok: list.length === 0, detail: list.length ? label + ": " + list.slice(0, 3).map(fmt).join(" | ") + (list.length > 3 ? " (+" + (list.length - 3) + ")" : "") : "" });
const rule = (name, list, fmt) => { const r = bad(list, "ihlal " + list.length, fmt); check(name, r.ok, r.detail); };

/* 1. Faturalar */
rule("Σ kalemler = fatura toplamı", D.INVOICES.filter((i) => i.energy + i.distribution + i.yekdem + i.funds + i.btv + i.vat + i.reactive + i.power !== i.total), (i) => i.id);
const paidBy = new Map();
for (const p of D.PAYMENTS) paidBy.set(p.invoiceId, (paidBy.get(p.invoiceId) ?? 0) + p.amount);
rule("Σ ödeme = faturada ödenen anapara", D.INVOICES.filter((i) => (paidBy.get(i.id) ?? 0) !== i.paid), (i) => i.id);
rule("fatura durumu türetimli", D.INVOICES.filter((i) => i.status !== B.deriveStatus({ total: i.total, paid: i.paid, due: i.due, disputed: i.status === "itirazli" }, D.TODAY_KEY)), (i) => i.id + ":" + i.status);
rule("ödenen fatura ödenen zammı tamam", D.INVOICES.filter((i) => i.status === "odendi" && i.lateFeePaid < i.lateFee), (i) => i.id);
rule("gecikmiş açık faturada zam hesaplı", D.INVOICES.filter((i) => i.status === "gecikti" && i.lateFee !== B.lateInterest(i.total - i.paid, i.due, D.TODAY_KEY)), (i) => i.id);
rule("fatura sahibi tedarikçi", D.INVOICES.filter((i) => i.issuer !== "tedarikci"), (i) => i.id);
rule("reaktif bedel konutta yok", D.INVOICES.filter((i) => i.reactive > 0 && D.customer(i.customerId).kind === "bireysel"), (i) => i.id);
rule("geciken faturada bakiye > 0", D.OVERDUE_INVOICES.filter((i) => i.total - i.paid <= 0), (i) => i.id);
rule("fatura TODAY sonrası kesilmemiş", D.INVOICES.filter((i) => i.issued > D.TODAY_KEY), (i) => i.id);
rule("ödeme TODAY sonrası değil", D.PAYMENTS.filter((p) => p.date > D.TODAY_KEY), (p) => p.id);
rule("banka/PTT ödemesi hafta sonu değil", D.PAYMENTS.filter((p) => (p.channel === "banka" || p.channel === "ptt") && C.isWeekend(p.date)), (p) => p.id + ":" + p.date);
const dayCounts = new Map();
for (const p of D.PAYMENTS) dayCounts.set(p.date, (dayCounts.get(p.date) ?? 0) + 1);
check("ödemeler tek güne yığılmamış", Math.max(...dayCounts.values()) < D.PAYMENTS.length * 0.08, "en yoğun gün: " + Math.max(...dayCounts.values()));

/* 2. Sayaç, trafo, müşteri */
rule("çarpan = CT × VT", D.METERS.filter((m) => m.multiplier !== (m.ctRatio ?? 1) * (m.vtRatio ?? 1)), (m) => m.id);
rule("OG sayaçta CT dolu, AG sayaçta çarpan 1", D.METERS.filter((m) => (D.customer(m.customerId).voltage === "OG" ? m.ct === "—" : m.multiplier !== 1)), (m) => m.id);
rule("kurulum ≤ bugün ve ≥ abonelik", D.METERS.filter((m) => m.installed > D.TODAY_KEY || m.installed < D.customer(m.customerId).since), (m) => m.id + ":" + m.installed);
rule("sayaç trafosu var", D.METERS.filter((m) => !D.TRANSFORMERS.some((t) => t.id === m.transformerId)), (m) => m.id);
rule("sayaç okuma günü fider rotasından", D.METERS.filter((m) => { const t = D.transformer(m.transformerId); const f = D.feeder(t.feederId); return m.readDay !== D.REGION_READ_DAYS[D.customer(m.customerId).regionId][f.index]; }), (m) => m.id);
rule("sözleşme gücü ≥ normal talep", D.CUSTOMERS.filter((c) => D.READINGS.some((r) => r.customerId === c.id && r.status !== "bekliyor" && !r.flags.includes("ani-sicrama") && r.demandKw > (c.contractKw ?? 0) * 1.0)), (c) => c.id + ":" + c.contractKw);
rule("serbest tüketici = yıllık tüketim sınırı", D.CUSTOMERS.filter((c) => c.free !== ((c.annualKwh ?? 0) >= D.FREE_LIMIT_KWH)), (c) => c.id);
rule("TM adı tek (kimlik = ad)", D.SUBSTATIONS.filter((s) => s.id !== s.name), (s) => s.id);

/* 3. Okumalar */
rule("bekleyen okuma kaynaksız", D.READINGS.filter((r) => (r.status === "bekliyor") !== (r.source === "yok")), (r) => r.id);
rule("konutta reaktif yok", D.READINGS.filter((r) => D.customer(r.customerId).kind === "bireysel" && (r.reactive.inductive || r.reactive.capacitive)), (r) => r.id);
const byMeter = new Map();
for (const r of D.READINGS) byMeter.set(r.meterId, [...(byMeter.get(r.meterId) ?? []), r]);
const monotone = [];
for (const [m, rs] of byMeter) { const done = rs.filter((r) => r.status !== "bekliyor").sort((a, b) => (a.period < b.period ? -1 : 1)); for (let i = 1; i < done.length; i++) if (done[i].index.t1 < done[i - 1].index.t1 && !done[i].flags.includes("geri-sayim")) monotone.push(m + ":" + done[i].period); }
rule("endeks monoton (geri sayım bayraklı hariç)", monotone, (x) => x);
check("beyan kaynaklı okuma var", D.READINGS.some((r) => r.source === "beyan"));

/* 4. İş emri ve takvim */
rule("kesme iş emri iş gününde", D.WORK_ORDERS.filter((w) => w.type === "kesme" && w.status === "planlandi" && !C.isBusinessDay(D.dayKey(w.scheduled))), (w) => w.id + ":" + D.dayKey(w.scheduled));
rule("planlı iş emirleri iş gününde", D.WORK_ORDERS.filter((w) => w.status === "planlandi" && !C.isBusinessDay(D.dayKey(w.scheduled))), (w) => w.id);
rule("planlı kesinti iş gününde", D.OUTAGES.filter((o) => o.status === "planlandi" && !C.isBusinessDay(D.dayKey(o.start))), (o) => o.id);

/* 5. Arıza */
rule("arıza süresi eksi değil", OPS.OUTAGE_LIST.filter((o) => OPS.minutesOf(o) < 0), (o) => o.id);
rule("arıza başlangıcı şimdiden sonra değil (plansız)", D.OUTAGES.filter((o) => o.kind === "plansiz" && o.start > D.TODAY), (o) => o.id);
rule("etkilenen abone = DTR'lerdeki sayaç", D.OUTAGES.filter((o) => o.transformerIds && o.affected !== D.METERS.filter((m) => o.transformerIds.includes(m.transformerId)).length), (o) => o.id);
const rel = OPS.reliability(30);
const longRows = OPS.OUTAGE_LIST.filter((o) => o.kind === "plansiz" && o.start.getTime() >= D.addDays(D.TODAY, -30).getTime() && o.start <= D.TODAY && OPS.minutesOf(o) > OPS.LONG_OUTAGE_MINUTES);
check("SAIFI/SAIDI yalnız uzun kesinti, payda aktif abone", rel.count === longRows.length, "sayı " + rel.count + " / beklenen " + longRows.length);

/* 6. Yeni varlıklar */
const ids = (name, list) => { const s = new Set(list.map((x) => x.id)); check(name + " kimlikleri benzersiz", s.size === list.length, list.length + " kayıt"); };
ids("başvuru", Y.APPLICATIONS); ids("kaçak", Y.LEAKS); ids("stok", Y.STOCK); ids("çağrı", Y.CALLS); ids("itiraz", Y.DISPUTES); ids("alacak", Y.CREDITS); ids("üretici", Y.PRODUCERS);
check("başvuru sayısı ~25", Y.APPLICATIONS.length >= 20, String(Y.APPLICATIONS.length));
check("kaçak vakası ≥ 10", Y.LEAKS.length >= 10, String(Y.LEAKS.length));
check("stok ~80", Y.STOCK.length >= 70, String(Y.STOCK.length));
check("çağrı ≥ 100", Y.CALLS.length >= 100, String(Y.CALLS.length));
check("üretici 12", Y.PRODUCERS.length === 12, String(Y.PRODUCERS.length));
rule("üretici sayacında exportKwh", Y.PRODUCERS.filter((p) => p.status === "devrede" && !D.READINGS.some((r) => r.meterId === p.meterId && r.exportKwh !== undefined)), (p) => p.id);
rule("yeni havuz sayaçları stokta", ["P-001"].filter((id) => !Y.STOCK.some((s) => s.id === id && s.status === "stokta")), (x) => x);
check("arıza adayı (DTR'de 3+ çağrı) var", SEL.faultCandidates().length >= 1, String(SEL.faultCandidates().length));
check("aşırı yüklü trafo var", SEL.overloadedTransformers().length >= 1, String(SEL.overloadedTransformers().length));

/* 7. Depo ve motor davranışı */
const overdueBefore = SEL.overdueInvoices();
check("rozet = seçici = tabandaki geciken sayısı", SEL.badges().invoices === overdueBefore.length && overdueBefore.length === D.OVERDUE_INVOICES.length, SEL.badges().invoices + " / " + D.OVERDUE_INVOICES.length);
const target = overdueBefore.find((i) => i.paid === 0 && D.customer(i.customerId).status === "aktif");
const balBefore = SEL.customerBalance(target.customerId);
const statsBefore = SEL.liveStats("3");
const auditBefore = A.getAuditLog().length;
FIN.recordPayment(target.id, { channel: "online", amount: target.total, reference: "TEST-1" });
const after = FIN.invoiceOf(target.id, FIN.getFinance());
check("ödeme: fatura Ödendi olur", after.status === "odendi", after.status);
check("ödeme: gecikme zammı ödemeyle tahsil edildi", after.lateFeePaid >= after.lateFee && after.lateFee > 0, String(after.lateFee));
check("ödeme: müşteri bakiyesi aynı anda azalır", SEL.customerBalance(target.customerId) === balBefore - target.total, balBefore + " → " + SEL.customerBalance(target.customerId));
check("ödeme: geciken sayısı azalır (rozet)", SEL.badges().invoices === overdueBefore.length - 1, String(SEL.badges().invoices));
check("ödeme: pano tahsilat oranı yükselir", SEL.liveStats("3").collectionRate >= statsBefore.collectionRate);
check("ödeme: denetim izine yazıldı", A.getAuditLog().length === auditBefore + 1 && A.getAuditLog()[0].action === "Ödeme girdi");
check("ödeme: Ödemeler listesinde", FIN.allPayments(FIN.getFinance()).some((p) => p.invoiceId === target.id && p.manual));

/* şüpheli okuma onayı rozeti düşürür ve faturaya serbest bırakır */
const flagged = SEL.flaggedReadings(D.CURRENT_PERIOD);
if (flagged.length) {
  const f = flagged[0];
  OP.resolveReading(f.id, "onayla");
  check("okuma onayı rozeti düşürür", SEL.badges().readings === flagged.length - 1);
  check("onaylanan okuma taslağa girer", FIN.draftsFor(D.CURRENT_PERIOD, FIN.getFinance()).some((d) => d.readingId === f.id) || D.INVOICES.some((i) => i.customerId === f.customerId && i.period === f.period));
}

/* kesme: politika, yetki, iki göz */
const hassas = D.CUSTOMERS.find((c) => (c.tags ?? []).some((t) => t.startsWith("Hassas")));
if (hassas) { const r = S.requestCut(hassas.id, "test"); check("hassas abone kesilemez", !r.ok && r.status === "engelli", JSON.stringify(r.blockers ?? r.status)); }
const slot = CUT.scheduleSlot(D.TODAY_KEY, 9);
check("kesme emri iş günü ve mesaide planlanır", C.isBusinessDay(D.dayKey(slot)) && slot.getHours() >= 8 && slot.getHours() < 17, slot.toString());
const debtor = SEL.overdueInvoices().find((i) => D.customer(i.customerId).status === "aktif" && i.status === "gecikti" && !CUT.getNotices()[i.customerId]);
if (debtor) {
  const cid = debtor.customerId;
  const noNotice = CUT.cutEligibility(cid);
  check("ihtar yokken kesme engelli", !noNotice.eligible && noNotice.blockers.some((b) => b.includes("ihtar")), noNotice.blockers.join("; "));
}
P.setViewAs("denetci");
const denied = S.updateTariff("yekdem", 0.07, D.TODAY_KEY);
check("denetçi tarife değiştiremez (reddedilir ve kayda geçer)", !denied.ok && A.getAuditLog()[0].ok === false);
P.setViewAs(null);
const ap = S.updateTariff("yekdem", 0.07, D.TODAY_KEY);
check("tarife iki göz onayı ister", ap.ok && ap.status === "onay-bekliyor");
if (ap.status === "onay-bekliyor") {
  const self = S.decide(ap.approval.id, true);
  check("isteyen kendi onayını veremez", !self.ok && self.reason === "kendi-istegi");
  P.setUser("u-3");
  P.setPermission("tarife", "tahsilat", true);
  const other = S.decide(ap.approval.id, true);
  check("ikinci kullanıcı onaylar, tarife uygulanır", other.ok && S.getSettingsSnapshot().params.yekdem === 0.07);
  P.resetPermissions(); P.setUser("u-1");
}

/* iş emri durum makinesi */
const wo = S.createWorkOrder({ type: "ariza", regionId: "merkez", reason: "test" });
S.assignWorkOrder(wo.id, "Ekip A (Merkez)"); S.advanceWorkOrder(wo.id); S.advanceWorkOrder(wo.id); S.advanceWorkOrder(wo.id);
check("iş emri durum makinesi tamamlanır", S.getWorkOrders().find((w) => w.id === wo.id)?.status === "tamamlandi");

/* arıza ekibi ve kalıcılık */
const open = OP.effectiveOutages().find((o) => o.status === "acik");
if (open) { OP.assignOutageCrew(open.id, "Ekip G (Yedek)"); check("arıza ekibi depoda kalıcı", OP.outageById(open.id).crew === "Ekip G (Yedek)"); OP.closeOutage(open.id); check("arıza kapatınca açık sayı düşer", SEL.openOutages().every((o) => o.id !== open.id)); }

/* Fatura çekirdeği */
const bill = B.computeInvoice({ kind: "sanayi", voltage: "OG", usage: { t1: 1000, t2: 500, t3: 500, total: 2000 }, reactive: { inductive: 800, capacitive: 0 }, demandKw: 300, contractKw: 250, prices: { t1: 3, t2: 4, t3: 2 } });
check("çok zamanlı enerji bedeli dilim fiyatlarıyla", bill.energy === 1000 * 300 + 500 * 400 + 500 * 200, String(bill.energy));
check("aşan reaktif bedel hesaplanır", bill.reactive > 0 && bill.reactiveExcessKvarh === 400, String(bill.reactiveExcessKvarh));
check("güç aşım bedeli hesaplanır", bill.power > 0 && bill.powerOverKw === 50, String(bill.powerOverKw));
check("faiz oranı tablosu tarih aralıklı", B.lateInterest(100000, "2025-12-01", "2026-01-01") > B.lateInterest(100000, "2020-06-01", "2020-07-02"));

/* Rapor */
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? "  ✓ " : "  ✗ ") + r.name + (r.detail && !r.ok ? "  → " + r.detail : ""));
console.log("\\n" + (failed.length ? failed.length + " kural kırıldı, " : "") + (results.length - failed.length) + "/" + results.length + " kural geçti");
process.exit(failed.length ? 1 : 0);
`;

const dir = mkdtempSync(join(tmpdir(), "kz-verify-"));
const out = join(dir, "run.mjs");
try {
  await build({ stdin: { contents: entry, resolveDir: root, loader: "ts", sourcefile: "verify-entry.ts" }, bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error", define: { "process.env.NODE_ENV": '"test"' } });
  writeFileSync(join(dir, "package.json"), '{"type":"module"}');
  await import(pathToFileURL(out).href);
} finally {
  // Çıkış process.exit ile olur; geçici klasörü yine de temizle.
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}
