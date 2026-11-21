import { OUTAGE_LIST, minutesOf, LONG_OUTAGE_MINUTES } from "./_data-operasyon";
import { CUSTOMERS, TODAY, TODAY_KEY, addDays, daysBetween, parseDay, regionLoss } from "./_data";
import { effectiveOutages } from "./_ops";
import { getApplications, getCalls } from "./_store";
import { disputeSlaBreaches, openCredits, openDisputes, openOutages, pendingReadings } from "./_selectors";
import { allPayments, getFinance } from "./_data-finans";
import type { Filing, FilingStatus } from "./_data-rapor";

/**
 * Raporlar sayfasının CANLI hesapları. EPDK bildirim doğrulamaları elle "tamam"
 * yazılmaz: her kutu o anki depodan (seçiciler, ödemeler, arızalar) hesaplanır;
 * bir arıza kapanınca ya da bir mutabakat bitince kutu kendiliğinden yeşile döner.
 * Bütün süre ve eşikler ÖRNEK parametredir (doğrulanmadı).
 */

export type LiveCheck = { label: string; ok: boolean };

export function liveChecks(f: Filing): readonly LiveCheck[] {
  if (f.status === "gonderildi") return f.checks.map((c) => ({ ...c, ok: true }));
  switch (f.id) {
    case "f-1": {
      const rows = regionLoss("2026-10");
      const pending = pendingReadings("2026-10").length;
      return [
        { label: "Bütün bölgelerin girişi ve faturalanan enerjisi dolu", ok: rows.length > 0 && rows.every((r) => r.input > 0) },
        { label: pending ? `${pending} sayacın Ekim okuması bekliyor` : "Okuması bekleyen sayaç yok (dönem kapandı)", ok: pending === 0 },
        { label: "Bölge toplamı şebeke girişiyle uyumlu", ok: rows.reduce((s, r) => s + r.input, 0) >= rows.reduce((s, r) => s + r.lossKwh, 0) },
      ];
    }
    case "f-2": {
      const open = openOutages().length;
      const missing = effectiveOutages().filter((o) => o.kind === "plansiz" && o.status === "cozuldu" && !o.end).length;
      const unlinked = effectiveOutages().filter((o) => o.kind === "plansiz" && !(o.transformerIds && o.transformerIds.length)).length;
      return [
        { label: open ? `${open} açık arıza henüz kapanmadı` : "Kapanmamış arıza yok", ok: open === 0 },
        { label: missing ? `${missing} kesintinin bitiş saati eksik` : "Bütün kapanmış kesintilerin bitiş saati kayıtlı", ok: missing === 0 },
        { label: unlinked ? `${unlinked} kesintide etkilenen abone trafoya bağlı değil` : "Etkilenen aboneler dağıtım trafosuna bağlı", ok: unlinked === 0 },
      ];
    }
    case "f-3": {
      const recon = allPayments(getFinance()).filter((p) => p.recon === "bekliyor").length;
      const credits = openCredits().length;
      return [
        { label: recon ? `${recon} ödeme mutabakat bekliyor` : "Tahsilat mutabakatı tamam", ok: recon === 0 },
        { label: credits ? `${credits} açık alacak mahsup bekliyor` : "Mahsup bekleyen alacak yok", ok: credits === 0 },
      ];
    }
    case "f-5": {
      const done = getApplications().filter((a) => a.stage === "tamam").length;
      const calls = getCalls().length;
      const disputes = disputeSlaBreaches().length;
      return [
        { label: done ? `${done} tamamlanan başvurunun süresi hesaplandı` : "Süresi hesaplanacak başvuru yok", ok: done > 0 },
        { label: calls ? `${calls} çağrı kaydı süre hesabında` : "Çağrı kaydı yok", ok: calls > 0 },
        { label: disputes ? `${disputes} itirazın yanıt süresi aşıldı` : "İtiraz yanıt süreleri içinde", ok: disputes === 0 },
      ];
    }
    default:
      return f.checks;
  }
}

/** Durum depodan türer: gönderildiyse gönderildi, süresi geçtiyse gecikti, kutular tamamsa hazır. */
export function filingStatus(f: Filing, refs: Readonly<Record<string, string>>): FilingStatus {
  if (refs[f.id]) return "gonderildi";
  if (f.deadline < TODAY_KEY) return "gecikti";
  return liveChecks(f).every((c) => c.ok) ? "hazir" : "hazirlaniyor";
}

/** SAIDI / SAIFI hesap dökümü: neden bu sayı çıktı. */
export function reliabilityBreakdown(days: number) {
  const from = addDays(TODAY, -days).getTime();
  const inWindow = OUTAGE_LIST.filter((o) => o.kind === "plansiz" && o.start.getTime() >= from && o.start.getTime() <= TODAY.getTime());
  const long = inWindow.filter((o) => minutesOf(o) > LONG_OUTAGE_MINUTES);
  const short = inWindow.length - long.length;
  const denominator = CUSTOMERS.filter((c) => c.status === "aktif").length;
  const customerMinutes = long.reduce((s, o) => s + o.affected * minutesOf(o), 0);
  const interruptions = long.reduce((s, o) => s + o.affected, 0);
  const top = [...long].sort((a, b) => b.affected * minutesOf(b) - a.affected * minutesOf(a)).slice(0, 6);
  return { denominator, customerMinutes, interruptions, longCount: long.length, shortCount: short, top };
}

/** Ticari kalite göstergeleri: başvuru, çağrı, itiraz süreleri (ÖRNEK hedefler). */
export function qualityIndicators() {
  const apps = getApplications();
  const finished = apps.filter((a) => a.stage === "tamam");
  const appDays = finished.length ? finished.reduce((s, a) => s + daysBetween(parseDay(a.createdAt), parseDay(a.stageSince)), 0) / finished.length : 0;
  const openApps = apps.filter((a) => a.stage !== "tamam" && a.stage !== "red");
  const openAppAge = openApps.length ? openApps.reduce((s, a) => s + daysBetween(parseDay(a.createdAt), TODAY), 0) / openApps.length : 0;
  const openCalls = getCalls().filter((c) => c.status !== "kapandi");
  const waits = openCalls.map((c) => (TODAY.getTime() - c.at.getTime()) / 60_000);
  const avgWait = waits.length ? waits.reduce((s, w) => s + w, 0) / waits.length : 0;
  const slaOver = openCalls.filter((c) => (TODAY.getTime() - c.at.getTime()) / 60_000 > c.slaMinutes).length;
  return {
    appDays,
    appFinished: finished.length,
    openApps: openApps.length,
    openAppAge,
    callWait: avgWait,
    callOpen: openCalls.length,
    callSlaOver: slaOver,
    disputeOpen: openDisputes().length,
    disputeLate: disputeSlaBreaches().length,
  };
}
