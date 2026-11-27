"use client";

import { ArrowLeftRight, ArrowRight, BarChart3, Bot, Download, FileSearch, LayoutGrid, ListChecks, Network, PiggyBank, Plus, ScrollText, ShieldCheck, TriangleAlert, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { RecordList } from "@/components/ui/record-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { BrandMark, CARD, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Ajan harcamaları panosu (AgentPay görselinden yapı; ad, tutar ve satıcılar
 * kurgusal): ölçü karoları, canlı karar akışı, karar dağılımı, onay kuyruğu ve
 * olağan dışı harcama uyarısı. Açık ve koyu tema aynı sayfa: araç çubuğundaki
 * tema anahtarıyla değişir, sayfada `dark:` yok.
 */

type Period = "gun" | "hafta" | "ay";
const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "gun", label: "Bugün" },
  { value: "hafta", label: "Bu hafta" },
  { value: "ay", label: "Bu ay" },
];

const TL = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const nf = new Intl.NumberFormat("tr-TR");

/*
 * Tek kaynak: "Engellenen" ölçüsü = karar dağılımındaki "İlke ile engellendi"
 * (`stopped`); "Bekleyen" = onay kuyruğu (7 iş, `held` toplamı, aşağıdaki
 * `WAITING` iki işi bu toplamın içinde); tablodaki 8 satır günün işlemlerinden
 * küçük bir kesit (otomatik onaylılarının toplamı günün harcamasını aşmaz).
 */
const METRICS: Record<Period, { spend: number; change: number; pending: number; held: number; prevented: number; total: number; auto: number; human: number; stopped: number; greeting: string }> = {
  gun: { spend: 9840, change: 4.1, pending: 7, held: 13240, prevented: 9600, total: 892, auto: 696, human: 134, stopped: 62, greeting: "Bugün 18 ajan çalıştı. 6 cüzdanda ₺9.840 harcandı." },
  hafta: { spend: 21300, change: 8.6, pending: 7, held: 13240, prevented: 24300, total: 4120, auto: 3210, human: 640, stopped: 270, greeting: "Bu hafta 18 ajan çalıştı. 6 cüzdanda ₺21.300 harcandı." },
  ay: { spend: 84420, change: 12.4, pending: 7, held: 13240, prevented: 61800, total: 16900, auto: 13180, human: 2530, stopped: 1190, greeting: "18 ajan etkin. 6 cüzdanda bu ay ₺84.420 harcandı." },
};

type Decision = "auto" | "needs" | "blocked";
const DECISION: Record<Decision, { label: string; tone: "success" | "warning" | "danger" }> = {
  auto: { label: "Otomatik onaylı", tone: "success" },
  needs: { label: "Onay bekliyor", tone: "warning" },
  blocked: { label: "Engellendi", tone: "danger" },
};

type Activity = { id: string; agent: string; policy: string; icon: ReactNode; merchant: string; amount: number; decision: Decision; when: string };
const ACTIVITY: readonly Activity[] = [
  { id: "a1", agent: "Araştırma Ajanı", policy: "Araştırma API'leri v1", icon: <Bot />, merchant: "Dil Servisi", amount: 600, decision: "auto", when: "1 dk" },
  { id: "a2", agent: "Pazarlama Ajanı", policy: "Reklam Harcaması v3", icon: <Bot />, merchant: "Reklam Paneli", amount: 4200, decision: "auto", when: "2 dk" },
  { id: "a3", agent: "Araştırma Ajanı", policy: "Araştırma API'leri v1", icon: <Bot />, merchant: "Dil Servisi", amount: 600, decision: "auto", when: "4 dk" },
  { id: "a4", agent: "Tedarik Ajanı", policy: "Tedarik v2", icon: <Bot />, merchant: "Bulut Sunucu Hizmeti", amount: 1840, decision: "needs", when: "16 dk" },
  { id: "a5", agent: "Satış Ajanı", policy: "Satış Araçları v2", icon: <Bot />, merchant: "Müşteri İlişkileri Aracı", amount: 2400, decision: "blocked", when: "22 dk" },
  { id: "a6", agent: "Destek Ajanı", policy: "Destek Araçları v1", icon: <Bot />, merchant: "Destek Masası Aracı", amount: 240, decision: "auto", when: "38 dk" },
  { id: "a7", agent: "Pazarlama Ajanı", policy: "Reklam Harcaması v3", icon: <Bot />, merchant: "Tasarım Platformu", amount: 1800, decision: "needs", when: "42 dk" },
  { id: "a8", agent: "Tedarik Ajanı", policy: "Tedarik v2", icon: <Bot />, merchant: "Not Uygulaması", amount: 4800, decision: "blocked", when: "46 dk" },
];

const WAITING = [
  { id: "w1", agent: "Pazarlama Ajanı", detail: "Tasarım Platformu · yeni satıcı", amount: 1800, risk: "Orta" as const },
  { id: "w2", agent: "Tedarik Ajanı", detail: "Bulut Sunucu Hizmeti · yenileme", amount: 1840, risk: "Düşük" as const },
];

const SPLIT = (m: (typeof METRICS)[Period]) => [
  { label: "Kendiliğinden onaylandı", value: m.auto, bg: "bg-chart-2" },
  { label: "İnsan onayına gitti", value: m.human, bg: "bg-chart-5" },
  { label: "İlke ile engellendi", value: m.stopped, bg: "bg-chart-4" },
];

const NAV = [
  { items: [{ href: "#ozet", label: "Genel bakış", icon: <LayoutGrid /> }] },
  {
    label: "Ajanlar",
    items: [
      { href: "#ajanlar", label: "Ajanlar", icon: <Bot /> },
      { href: "#ag", label: "Ajan ağı", icon: <Network /> },
    ],
  },
  {
    label: "Para",
    items: [
      { href: "#islemler", label: "İşlemler", icon: <ArrowLeftRight /> },
      { href: "#onaylar", label: "Onaylar", icon: <ListChecks />, badge: "7" },
      { href: "#cuzdanlar", label: "Kartlar ve cüzdanlar", icon: <Wallet /> },
      { href: "#butceler", label: "Bütçeler", icon: <PiggyBank /> },
    ],
  },
  {
    label: "Kurallar",
    items: [
      { href: "#politikalar", label: "Politikalar", icon: <ScrollText /> },
      { href: "#risk", label: "Risk", icon: <ShieldCheck /> },
    ],
  },
  {
    label: "Kayıt",
    items: [
      { href: "#analitik", label: "Analitik", icon: <BarChart3 /> },
      { href: "#denetim", label: "Denetim günlüğü", icon: <FileSearch /> },
    ],
  },
] as const;

function Kpi({ icon, label, children, note }: { icon: ReactNode; label: string; children: ReactNode; note: ReactNode }) {
  return (
    <div className={cn(CARD, "flex min-w-0 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4")}>
      <p className="flex items-center gap-2 text-small text-muted">
        <span aria-hidden className="inline-grid size-7 place-items-center rounded-md bg-surface text-body ring-1 ring-line ring-inset [&_svg]:size-4">
          {icon}
        </span>
        {label}
      </p>
      <p className="text-title font-semibold tracking-tight text-strong tabular-nums sm:text-display">{children}</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted">{note}</p>
    </div>
  );
}

export function AjanHarcamalariPage({ initialPeriod = "ay" }: { initialPeriod?: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const m = METRICS[period];
  const pct = (n: number) => `%${Math.round((n / m.total) * 100)}`;

  const columns: Column<Activity>[] = [
    {
      key: "agent",
      header: "Ajan ve politika",
      render: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-strong">{a.agent}</p>
          <p className="font-mono text-micro text-muted">{a.policy}</p>
        </div>
      ),
    },
    {
      key: "merchant",
      header: "Satıcı",
      render: (a) => (
        <span className="flex items-center gap-2">
          <Avatar name={a.merchant} size="sm" className="!size-6" />
          {a.merchant}
        </span>
      ),
    },
    { key: "amount", header: "Tutar", numeric: true, render: (a) => <span className="font-mono text-strong">{TL.format(a.amount)}</span> },
    {
      key: "decision",
      header: "Karar",
      render: (a) => (
        <Badge tone={DECISION[a.decision].tone} dot>
          {DECISION[a.decision].label}
        </Badge>
      ),
    },
    { key: "when", header: "Ne zaman", numeric: true, render: (a) => <span className="font-mono text-muted">{a.when}</span> },
  ];

  return (
    <Shell brand={{ name: "AjanKasa", href: "#ozet", logo: <BrandMark><Wallet /></BrandMark> }} groups={NAV} current="#ozet" user={{ name: "Nizam Kaya", detail: "Yapay zekâ operasyonları" }}>
      <Page>
        <PageHead
          title="Günaydın, Nizam"
          badge={<SampleStamp />}
          description={m.greeting}
          actions={
            <>
              <SegmentedControl<Period> aria-label="Dönem" size="sm" options={PERIODS} value={period} onValueChange={setPeriod} />
              <Button variant="secondary" size="sm">
                <Download aria-hidden /> Dışa aktar
              </Button>
              <Button variant="primary" size="sm">
                <Plus aria-hidden /> Yeni ajan
              </Button>
            </>
          }
        />

        <section aria-label="Özet ölçüler" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={<Wallet />} label="Toplam ajan harcaması" note={<><span className="font-medium text-success">+%{String(m.change).replace(".", ",")}</span> önceki dönem</>}>
            {TL.format(m.spend)}
          </Kpi>
          <Kpi icon={<Bot />} label="Etkin ajan" note="6 duraklatıldı">
            18 <span className="text-read font-normal text-muted">/ 24</span>
          </Kpi>
          <Kpi icon={<ListChecks />} label="Bekleyen onay" note={<><Badge tone="warning" dot>Sana ihtiyaç var</Badge> <span>{TL.format(m.held)} bekliyor</span></>}>
            {m.pending}
          </Kpi>
          <Kpi icon={<ShieldCheck />} label="Engellenen" note={`${TL.format(m.prevented)} önlendi`}>
            {nf.format(m.stopped)}
          </Kpi>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            id="hareket"
            title="Ajan hareketi"
            note="Her cüzdandaki canlı karar akışı"
            actions={<Badge tone="success" dot>Canlı</Badge>}
            bodyClassName="px-0 sm:px-0 pt-2 pb-0"
          >
            <DataTable caption="Ajan hareketi" columns={columns} rows={ACTIVITY} rowKey={(a) => a.id} on="page" stickyFirst={false} minWidth="44rem" className="max-md:hidden" />
            <RecordList
              className="md:hidden"
              label="Ajan hareketi"
              items={ACTIVITY.map((a) => ({
                id: a.id,
                title: a.agent,
                subtitle: a.merchant,
                value: TL.format(a.amount),
                meta: `${a.when} önce`,
                status: (
                  <Badge tone={DECISION[a.decision].tone} dot>
                    {DECISION[a.decision].label}
                  </Badge>
                ),
              }))}
            />
            <p className="border-t border-line-soft px-4 py-3 text-small text-muted sm:px-5">Bugünkü {nf.format(m.total)} işlemin 8'i gösteriliyor</p>
          </Panel>

          <div className="flex min-w-0 flex-col gap-5">
            <Panel id="karar" title="Karar dağılımı" note="İlke motorundan geçen ödemeler">
              <p className="flex items-baseline gap-2">
                <span className="text-display font-semibold tracking-tight text-strong tabular-nums">{nf.format(m.total)}</span>
                <span className="text-small text-muted">ödeme ilke motorundan geçti</span>
              </p>
              <div aria-hidden className="mt-3 flex h-3 gap-1">
                {SPLIT(m).map((p) => (
                  <span key={p.label} className={cn("rounded-full", p.bg)} style={{ flexGrow: p.value }} />
                ))}
              </div>
              <dl className="mt-4 divide-y divide-line-soft text-base">
                {SPLIT(m).map((p) => (
                  <div key={p.label} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <dt className="flex min-w-0 flex-1 items-center gap-2 text-body">
                      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", p.bg)} />
                      {p.label}
                    </dt>
                    <dd className="flex items-baseline gap-3 tabular-nums">
                      <span className="font-medium text-strong">{nf.format(p.value)}</span>
                      <span className="w-10 text-right text-small text-muted">{pct(p.value)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel id="bekleyen" title="Sende bekleyenler" note="7 işten ilk ikisi" actions={<Badge tone="warning" dot>{m.pending} bekliyor</Badge>}>
              <ul className="divide-y divide-line-soft">
                {WAITING.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <Avatar name={w.agent} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-strong">{w.agent}</p>
                      <p className="truncate text-small text-muted">{w.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-strong">{TL.format(w.amount)}</span>
                      <Badge tone={w.risk === "Orta" ? "warning" : "success"} dot>
                        {w.risk}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="mt-2 -ml-3">
                Onay merkezini aç <ArrowRight aria-hidden />
              </Button>
            </Panel>

            <section aria-labelledby="uyari" className="rounded-xl bg-warning-wash p-4 ring-1 ring-warning/20 ring-inset">
              <div className="flex items-start gap-3">
                <span aria-hidden className="mt-0.5 text-warning [&_svg]:size-5">
                  <TriangleAlert />
                </span>
                <div className="min-w-0">
                  <h2 id="uyari" className="text-base font-semibold text-strong">
                    Olağan Dışı Harcama
                  </h2>
                  <p className="text-small text-body">Araştırma Ajanı · son 42 dakika</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-small">
                    <div>
                      <dt className="text-muted">Normal aralık</dt>
                      <dd className="font-mono text-strong">₺500 – ₺1.200 / gün</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Bugün</dt>
                      <dd className="font-mono font-semibold text-danger">₺8.400</dd>
                    </div>
                  </dl>
                  <Button variant="ghost" size="sm" className="mt-2 -ml-3">
                    Risk merkezinde incele <ArrowRight aria-hidden />
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Page>
    </Shell>
  );
}
