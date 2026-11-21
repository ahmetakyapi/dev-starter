"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChartCard } from "@/components/ui/chart-card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Dialog } from "@/components/ui/dialog";
import { FactorList, type Severity } from "@/components/ui/factor-list";
import { ForecastChart } from "@/components/ui/forecast-chart";
import { ImpactBar } from "@/components/ui/impact-bar";
import { InsightCallout } from "@/components/ui/insight-callout";
import { LeverCard, LeverGrid } from "@/components/ui/lever-card";
import { OptionCards } from "@/components/ui/option-cards";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { SetupCard } from "@/components/ui/setup-card";
import { Switch } from "@/components/ui/switch";
import { ValueDiff } from "@/components/ui/value-diff";
import { cn } from "@/lib/utils";
import {
  CHANNELS,
  DELAYED,
  MONTHLY_TARGET,
  ORDERS,
  TARGET_SCALE,
  TODAY,
  daysBetween,
  periodStats,
  customer,
  num,
  tl,
  tlCompact,
  type PeriodStats,
  type Ticket,
} from "./_data";
import { CARD, Well, WellTitle, useApp } from "./_ui";

/**
 * Üçüncü görsel turunun Pusula yerleşimleri (Spendix, Fixora, Noticeline,
 * Clearbill ve margin ekranları): her bileşen gerçek bir ihtiyaca bağlı.
 * Sayılar `_data.ts`ten türer; tahmin ve kaldıraç etkileri varsayım yazılı.
 */

const WEEKDAY_ACC = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

/* ── Pano: günün önerisi ──────────────────────────────────────────────── */

/** Dönemin en yoğun gününe göre vardiya önerisi; sayılar talep kayıtlarından. */
export function PanoOneriCard({ s, className }: { s: PeriodStats; className?: string }) {
  const { navigate } = useApp();
  const counts = Array.from({ length: 7 }, (_, d) => s.tickets.filter((t) => t.date.getDay() === d).length);
  const busiest = counts.reduce((best, n, d) => (n > counts[best] ? d : best), 0);
  const avg = counts.reduce((a, b) => a + b, 0) / 7;
  const over = avg ? Math.round(((counts[busiest] - avg) / avg) * 100) : 0;
  return (
    <Well labelledBy="pano-oneri" className={className}>
      <WellTitle id="pano-oneri" hint="Dönem verisinden türeyen tek öneri; uygulamak senin kararın.">
        Günün Önerisi
      </WellTitle>
      <InsightCallout title={`${WEEKDAY_ACC[busiest]} Günleri İçin Yanıt Kapasitesini Artır`} label="Öneri" icon={Sparkles} kind="insight" headingLevel={3}
        actions={
          <Button size="sm" variant="secondary" onClick={() => navigate("inbox")}>
            Gelen Kutusunu Aç
          </Button>
        }
      >
        {WEEKDAY_ACC[busiest]} günü {num.format(counts[busiest])} talep geldi, haftanın günü ortalamasının %{num.format(over)} üstünde. İlk yanıt süresi hedefini bu günler zorluyor; o gün için bir kişiyi talep kuyruğuna ayırmak yeterli olur.
      </InsightCallout>
    </Well>
  );
}

/* ── Pano: sipariş hedefine etki ──────────────────────────────────────── */

/** Yoldaki ve hazırlanan siparişler teslim edilirse dönem hedefinin ne kadarına ulaşılır. */
export function OrderImpactCard({ s, className }: { s: PeriodStats; className?: string }) {
  const delivered = s.orders.filter((o) => o.status === "Teslim Edildi").reduce((a, o) => a + o.total, 0);
  const waiting = s.orders.filter((o) => o.status === "Yolda" || o.status === "Hazırlanıyor").reduce((a, o) => a + o.total, 0);
  const goal = Math.round(MONTHLY_TARGET * TARGET_SCALE[s.period]);
  const after = Math.round(((delivered + waiting) / goal) * 100);
  return (
    <ChartCard className={cn(CARD, className)} id="pano-hedef-etki" label="Yoldaki Siparişlerin Hedefe Etkisi" value={`%${num.format(after)} olur`}>
      <div className="grid gap-4 px-3 pb-3">
        <ImpactBar label="Dönem Ciro Hedefi" current={delivered} added={waiting} limit={goal} format={(n) => tlCompact.format(n)} />
        <p className="text-small text-muted">
          Teslim edilen {tl.format(delivered)}; yolda ya da hazırlanan {tl.format(waiting)} da teslim olursa hedefin %{num.format(after)} kadarı tamamlanır.
        </p>
      </div>
    </ChartCard>
  );
}

/* ── Gelen Kutusu: neden öncelikli ────────────────────────────────────── */

const SEVERITY: Record<string, Severity> = { Acil: "critical", Yüksek: "high", Normal: "medium", Düşük: "low" };

/** Talebin sırasını açıklayan etkenler: öncelik, bekleme, ilk yanıt, müşteri. */
export function TicketPriorityFactors({ t }: { t: Ticket }) {
  const age = Math.max(0, daysBetween(t.date, TODAY));
  const c = customer(t.customerId);
  const open = ORDERS.filter((o) => o.customerId === c.id && (o.status === "Gecikti" || o.status === "Yolda")).length;
  const late = ORDERS.filter((o) => o.customerId === c.id && o.status === "Gecikti").length;
  const first = t.firstResponseMin;
  return (
    <FactorList
      title="Neden Öncelikli"
      severity={SEVERITY[t.priority] ?? "medium"}
      headingLevel={3}
      factors={[
        { label: "Öncelik", value: t.priority, tone: t.priority === "Acil" ? "danger" : t.priority === "Yüksek" ? "warning" : "neutral" },
        { label: "Bekleme", value: age === 0 ? "Bugün geldi" : `${num.format(age)} gündür açık`, tone: age >= 3 ? "warning" : "neutral" },
        { label: "İlk Yanıt", value: first === null ? "Yanıtlanmadı" : `${first} dk`, hint: "Hedef 30 dakika", tone: first === null || first > 30 ? "danger" : "neutral" },
        { label: "Müşteri Siparişleri", value: `${num.format(open)} açık sipariş`, hint: late ? `${late} tanesi gecikmiş` : undefined, tone: late ? "warning" : "neutral" },
      ]}
    />
  );
}

/* ── Gelen Kutusu: sonuçlandırma penceresi ────────────────────────────── */

export type CloseOutcome = "cozuldu" | "beklemede" | "ustlen";

export function CloseTicketDialog({
  t,
  open,
  onOpenChange,
  onConfirm,
  mine,
}: {
  t: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (outcome: CloseOutcome, notify: boolean) => void;
  mine: boolean;
}) {
  const [outcome, setOutcome] = useState<CloseOutcome>("cozuldu");
  const [notify, setNotify] = useState(true);
  const unanswered = t.firstResponseMin === null;
  const effective: CloseOutcome = unanswered && outcome === "cozuldu" ? "beklemede" : mine && outcome === "ustlen" ? "beklemede" : outcome;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Talebi Sonuçlandır"
      description={`${t.id} · ${t.subject}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button
            onClick={() => {
              onConfirm(effective, notify);
              onOpenChange(false);
            }}
          >
            Uygula
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <OptionCards
          legend="Bu Talep Ne Olsun?"
          value={effective}
          onValueChange={(v) => setOutcome(v as CloseOutcome)}
          options={[
            { value: "cozuldu", title: "Çözüldü Olarak Kapat", description: "Müşteri bilgilendirilir, talep kapanır.", badge: unanswered ? undefined : "Önerilen", locked: unanswered ? { reason: "Müşteriye henüz yanıt verilmedi; önce yanıtla." } : undefined },
            { value: "beklemede", title: "Beklemeye Al", description: "Müşteriden ya da kargodan haber bekleniyor; talep açık kalır." },
            { value: "ustlen", title: "Üstlen ve Açık Tut", description: "Talep sana atanır, durum değişmez.", locked: mine ? { reason: "Talep zaten sende." } : undefined },
          ]}
        />
        <Switch label="Müşteriyi bilgilendir" hint="Seçtiğin sonuç müşteriye e-postayla gider" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
      </div>
    </Dialog>
  );
}

/* ── Görevler: fiyat listesi taslağı ──────────────────────────────────── */

/** Ekip kararı verilen kış sezonu fiyat listesinin yürürlükteki listeden farkı ve ön kontrolleri. */
export function PriceListWell() {
  const [channels, setChannels] = useState<string[]>(["Bayi"]);
  return (
    <Well labelledBy="gorev-fiyat" className="lg:col-span-2">
      <WellTitle id="gorev-fiyat" hint="Ekip kararı verilmeden önce taslağın neyi değiştirdiğini ve hangi kuralları zorladığını gör.">
        Fiyat Listesi Taslağı
      </WellTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <ValueDiff
            rows={[
              { label: "Yürürlükteki Liste", groups: ["KIS", "2025", "R3", "%10"], tone: "neutral", note: "Bayi indirimi %10" },
              { label: "Taslak Liste", groups: ["KIS", "2026", "R1", "%12"], tone: "good", note: "Bayi indirimi %12, ekip kararına bağlı" },
            ]}
          />
          <ChoiceChips
            legend="Hangi Kanallara Uygulansın"
            options={CHANNELS.map((c) => ({ value: c, label: c }))}
            value={channels}
            onValueChange={setChannels}
          />
        </div>
        <PolicyChecks
          title="Ön Kontroller"
          headingLevel={3}
          checks={[
            { id: "sinir", label: "İndirim sınırı içinde", detail: "%12, satış kuralının sınırı", state: "pass" },
            { id: "onay", label: "Yönetici onayı gerekli", detail: "6 Kasım'a kadar", state: "warn" },
            { id: "kanal", label: channels.length ? "Kanallar seçildi" : "Kanal seçilmedi", detail: channels.length ? channels.join(", ") : "En az bir kanal seç", state: channels.length ? "pass" : "fail" },
          ]}
        />
      </div>
    </Well>
  );
}

/* ── Raporlar: gelir tahmini ve senaryo ───────────────────────────────── */

const MONTHS = new Intl.DateTimeFormat("tr-TR", { month: "short" });

/** Son on iki ayın cirosundan üç aylık tahmin; kaldıraçlar ek etkiyi açıp kapatır. */
export function RevenueScenarioWell({ className }: { className?: string }) {
  const year = useMemo(() => periodStats("yil"), []);
  const [phone, setPhone] = useState(false);
  const [late, setLate] = useState(false);
  const [web, setWeb] = useState(false);

  const actual = year.revenueSeries.slice(-9);
  const last = actual.at(-1) ?? 0;
  const trend = actual.length > 3 ? (actual.at(-1)! - actual[0]) / (actual.length - 1) : 0;
  const path = [1, 2, 3].map((i) => Math.max(0, Math.round(last + trend * i)));

  const phoneRevenue = year.orders.filter((o) => o.channel === "Telefon").reduce((a, o) => a + o.total, 0) / 12;
  const webRevenue = year.orders.filter((o) => o.channel === "Web Mağaza").reduce((a, o) => a + o.total, 0) / 12;
  const delayedTotal = DELAYED.reduce((a, o) => a + o.total, 0);
  const levers = {
    phone: Math.round(phoneRevenue * 0.05),
    late: Math.round(delayedTotal / 3),
    web: Math.round(webRevenue * 0.04),
  };
  const extra = (phone ? levers.phone : 0) + (late ? levers.late : 0) + (web ? levers.web : 0);
  const anyOn = phone || late || web;

  const base = new Date(TODAY.getFullYear(), TODAY.getMonth() - 8, 1);
  const labels = Array.from({ length: 12 }, (_, i) => MONTHS.format(new Date(base.getFullYear(), base.getMonth() + i, 1)));
  const blank: (number | null)[] = Array(9).fill(null);
  const currentLine = [...actual.map((_, i) => (i === actual.length - 1 ? actual[i] : null)), ...path];
  const withLine = [...actual.map((_, i) => (i === actual.length - 1 ? actual[i] : null)), ...path.map((v) => v + extra)];
  const high = [...blank, ...path.map((v, i) => Math.round(v * (1.06 + i * 0.02)))];
  const low = [...blank, ...path.map((v, i) => Math.round(v * (0.94 - i * 0.02)))];
  const target = Math.round(MONTHLY_TARGET);
  const finalNow = path[2];
  const finalWith = finalNow + extra;
  const fmt = (v: number) => tlCompact.format(v);

  return (
    <section aria-labelledby="rapor-senaryo" className={cn(CARD, "flex flex-col gap-4", className)}>
      <header className="px-3 pt-3">
        <h3 id="rapor-senaryo" className="text-small font-medium text-muted">
          Gelir Tahmini ve Senaryo
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-heading font-semibold tracking-tight text-strong tabular-nums">{fmt(anyOn ? finalWith : finalNow)}</span>
          <span className="text-small text-muted">{labels[11]} ayı tahmini{anyOn ? `, ${fmt(extra)} ek etkiyle` : ""}</span>
        </p>
      </header>
      <div className="px-3">
        <ForecastChart
          title="Aylık Ciro Tahmini"
          labels={labels}
          actual={[...actual, null, null, null]}
          current={currentLine}
          withChanges={anyOn ? withLine : undefined}
          range={{ low, high }}
          target={{ value: target, label: "Aylık Hedef" }}
          format={fmt}
          actualUntil={8}
        />
      </div>
      <div className="px-3 pb-3">
        <LeverGrid label="Senaryo Kaldıraçları">
          <LeverCard
            title="Geciken Siparişleri Teslim Et"
            effect={`+${fmt(levers.late)}`}
            effectNote="aylık, üç aya yayılır"
            progress={Math.min(1, levers.late / Math.max(1, target - finalNow))}
            checked={late}
            onCheckedChange={setLate}
            description="Gecikmiş siparişlerin toplamı üç ayda tahsil edilir."
          />
          <LeverCard
            title="Telefon Sepetini %5 Büyüt"
            effect={`+${fmt(levers.phone)}`}
            effectNote="aylık"
            progress={Math.min(1, levers.phone / Math.max(1, target - finalNow))}
            checked={phone}
            onCheckedChange={setPhone}
            description="Varsayım: telefon siparişlerinde ortalama tutar %5 artar."
          />
          <LeverCard
            title="Web Dönüşümünü %4 Artır"
            effect={`+${fmt(levers.web)}`}
            effectNote="aylık"
            progress={Math.min(1, levers.web / Math.max(1, target - finalNow))}
            checked={web}
            onCheckedChange={setWeb}
            description="Varsayım: web mağaza cirosu %4 büyür."
          />
        </LeverGrid>
      </div>
    </section>
  );
}

/* ── Ayarlar: hesap kurulumu ──────────────────────────────────────────── */

const SETUP_STEPS = [
  { title: "Ekibi Davet Et", description: "Dört kişiyi daha ekleyince talepler otomatik dağılır." },
  { title: "Kargo Takibini Bağla", description: "Sipariş durumu taleplerin yanında görünür." },
  { title: "Yanıt Hedefini Belirle", description: "İlk yanıt süresi hedefin panoda izlenir." },
  { title: "Bildirimleri Seç", description: "Hangi olaylarda haber alacağını seç." },
] as const;

const NOTICE_TOPICS = [
  { value: "talep", label: "Yeni Talep" },
  { value: "gecikme", label: "Geciken Sipariş" },
  { value: "sla", label: "Süre Aşımı" },
  { value: "ozet", label: "Günlük Özet" },
  { value: "karar", label: "Ekip Kararı" },
] as const;

export function SetupWell() {
  const [step, setStep] = useState(2);
  const [topics, setTopics] = useState<string[]>(["talep", "sla"]);
  const current = SETUP_STEPS[Math.min(step, SETUP_STEPS.length - 1)];
  return (
    <Well labelledBy="ayar-kurulum" className="lg:col-span-2">
      <WellTitle id="ayar-kurulum" hint="Kurulum adımları sırayla ilerler; atladığın adıma sonra dönebilirsin.">
        Hesap Kurulumu
      </WellTitle>
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <SetupCard
          title={step >= SETUP_STEPS.length ? "Kurulum Tamam" : current.title}
          description={step >= SETUP_STEPS.length ? undefined : current.description}
          step={step}
          total={SETUP_STEPS.length}
          onSkip={() => setStep((n) => Math.min(n + 1, SETUP_STEPS.length))}
          onNext={() => setStep((n) => Math.min(n + 1, SETUP_STEPS.length))}
        />
        <ChoiceChips legend="Bildirim Konuları" options={NOTICE_TOPICS.map((t) => ({ value: t.value, label: t.label }))} value={topics} onValueChange={setTopics} max={4} />
      </div>
    </Well>
  );
}
