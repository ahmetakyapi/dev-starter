"use client";

import { Download, FileText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DateRangePresets, type DateRangeValue, type RangePreset } from "@/components/ui/date-range-presets";
import { InsightCallout } from "@/components/ui/insight-callout";
import { NoticeDeck } from "@/components/ui/notice-deck";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { TickMeter } from "@/components/ui/tick-meter";
import { Toaster, toast } from "@/components/ui/toast";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";
import { BrandMark, MetricStrip, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Kira uyum raporları (Noticeline referansı: yapı ve davranış; ad, metin,
 * rakam kurgusal, ÖRNEK VERİ). Dönem seçici tüm bölümleri değiştirir:
 * bildirim türlerine göre zamanında oranı, aylık ödeme hızı, kamu kaydındaki
 * boşluklar ve dışa aktarma paketi. Özet rakamlar satır verisinden türetilir.
 */

const TODAY = new Date(2026, 10, 21);
const PRESETS: readonly RangePreset[] = [
  { id: "30", label: "Son 30 Gün", days: 30 },
  { id: "90", label: "Son 90 Gün", days: 90 },
  { id: "365", label: "Son 12 Ay", days: 365 },
];

type Row = { label: string; ok: number; total: number };
type Period = {
  rows: readonly Row[];
  /** Tahsilat süresi, aylık ortalama gün (son altı ay). */
  pay: readonly number[];
  scored: [number, number];
  gaps: { start: number; closed: number; fresh: number };
};

const DATA: Record<string, Period> = {
  "30": {
    rows: [
      { label: "Kira Artış Bildirimi", ok: 14, total: 15 },
      { label: "Tahliye İhtarı", ok: 9, total: 10 },
      { label: "Depozito İade Bildirimi", ok: 11, total: 11 },
      { label: "Bakım Ziyareti Bildirimi", ok: 8, total: 8 },
      { label: "Sözleşme Yenileme Bildirimi", ok: 6, total: 6 },
    ],
    pay: [11.2, 10.4, 9.8, 9.9, 9.1, 8.6],
    scored: [31, 33],
    gaps: { start: 10, closed: 3, fresh: 0 },
  },
  "90": {
    rows: [
      { label: "Kira Artış Bildirimi", ok: 41, total: 45 },
      { label: "Tahliye İhtarı", ok: 28, total: 30 },
      { label: "Depozito İade Bildirimi", ok: 33, total: 34 },
      { label: "Bakım Ziyareti Bildirimi", ok: 25, total: 26 },
      { label: "Sözleşme Yenileme Bildirimi", ok: 18, total: 19 },
    ],
    pay: [11.8, 11.0, 10.6, 10.3, 9.7, 9.4],
    scored: [88, 96],
    gaps: { start: 17, closed: 10, fresh: 0 },
  },
  "365": {
    rows: [
      { label: "Kira Artış Bildirimi", ok: 163, total: 180 },
      { label: "Tahliye İhtarı", ok: 112, total: 120 },
      { label: "Depozito İade Bildirimi", ok: 131, total: 136 },
      { label: "Bakım Ziyareti Bildirimi", ok: 98, total: 104 },
      { label: "Sözleşme Yenileme Bildirimi", ok: 71, total: 74 },
    ],
    pay: [12.9, 12.4, 12.1, 11.8, 11.4, 11.1],
    scored: [301, 338],
    gaps: { start: 28, closed: 21, fresh: 0 },
  },
};

const MONTHS = ["Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas"];
const dayText = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} gün`;

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Uyum",
    items: [
      { href: "#raporlar", label: "Raporlar", icon: <FileText aria-hidden /> },
      { href: "#bildirimler", label: "Bildirimler", icon: <ShieldCheck aria-hidden /> },
    ],
  },
];

function Cell({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <p className="truncate text-small font-medium text-muted">{label}</p>
      <div className="mt-1 text-title font-semibold tracking-tight text-strong tabular-nums">{children}</div>
      {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
    </div>
  );
}

function download(name: string, header: string[], body: (string | number)[][]) {
  const csv = [header, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function UyumRaporlariPage() {
  const [range, setRange] = useState<DateRangeValue>({ kind: "preset", id: "30" });
  const [notice, setNotice] = useState(true);
  const key = range.kind === "preset" ? range.id : "30";
  const d = DATA[key];
  const periodLabel = range.kind === "preset" ? (PRESETS.find((p) => p.id === key)?.label ?? "") : "Seçili Aralık";

  const { ok, total } = useMemo(() => d.rows.reduce((s, r) => ({ ok: s.ok + r.ok, total: s.total + r.total }), { ok: 0, total: 0 }), [d]);
  const pctOn = Math.round((ok / total) * 100);
  const last = d.pay[d.pay.length - 1];
  const open = d.gaps.start - d.gaps.closed + d.gaps.fresh;
  const scoredPct = Math.round((d.scored[0] / d.scored[1]) * 100);

  const files: RecordItem[] = [
    {
      id: "ozet",
      title: "Bildirim Özeti",
      subtitle: `${periodLabel} · ${d.rows.length} bildirim türü`,
      meta: "CSV",
      actions: (
        <Button
          variant="secondary"
          size="sm"
          aria-label="Bildirim Özetini İndir"
          onClick={() => {
            download("bildirim-ozeti.csv", ["Bildirim Türü", "Zamanında", "Toplam"], d.rows.map((r) => [r.label, r.ok, r.total]));
            toast.success("Bildirim özeti indirildi");
          }}
        >
          <Download aria-hidden /> İndir
        </Button>
      ),
    },
    {
      id: "odeme",
      title: "Ödeme Hızı",
      subtitle: "Son altı ayın ortalama tahsilat süresi",
      meta: "CSV",
      actions: (
        <Button
          variant="secondary"
          size="sm"
          aria-label="Ödeme Hızını İndir"
          onClick={() => {
            download("odeme-hizi.csv", ["Ay", "Ortalama Gün"], d.pay.map((v, i) => [MONTHS[i], v]));
            toast.success("Ödeme hızı indirildi");
          }}
        >
          <Download aria-hidden /> İndir
        </Button>
      ),
    },
    {
      id: "bosluk",
      title: "Boşluk Raporu",
      subtitle: `${open} açık boşluk, kayıt numaralarıyla`,
      meta: "Yazdırılabilir",
      actions: (
        <Button variant="secondary" size="sm" aria-label="Boşluk Raporunu Yazdır" onClick={() => window.print()}>
          <FileText aria-hidden /> Yazdır
        </Button>
      ),
    },
  ];

  return (
    <>
      <Shell brand={{ name: "Uyum Defteri", href: "#raporlar", logo: <BrandMark><ShieldCheck /></BrandMark> }} groups={NAV} current="#raporlar" user={{ name: "Nizam", detail: "Uyum Sorumlusu" }}>
        <Page>
          <PageHead
            title="Uyum Raporları"
            description="Bildirimlerin zamanında gitmesi, ödeme hızı ve kamu kaydındaki boşluklar."
            badge={<SampleStamp />}
            actions={<DateRangePresets label="Dönem" presets={PRESETS} value={range} onValueChange={setRange} today={TODAY} />}
          />
          <MetricStrip>
            <Cell label="Zamanında Bildirimler">
              %{pctOn}
              <TickMeter label="Zamanında Bildirim Oranı" value={ok} max={total} ticks={24} marker={0.95} valueText={`${ok} / ${total} bildirim zamanında, eşik %95`} className="mt-2" />
            </Cell>
            <Cell label="Ödeme Süresi" hint="Son ay ortalaması">{dayText(last)}</Cell>
            <Cell label="Zamanında Puanlama" hint={`${d.scored[0]} / ${d.scored[1]} kiracı`}>%{scoredPct}</Cell>
            <Cell label="Kapatılan Boşluklar" hint={`${open} boşluk hâlâ açık`}>{d.gaps.closed}</Cell>
          </MetricStrip>
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
            <div className="grid min-w-0 gap-5">
              <Panel id="tur-zamaninda" title="Bildirim Türüne Göre Zamanında" note={periodLabel}>
                <ul role="list" className="grid gap-3.5">
                  {d.rows.map((r) => {
                    const p = r.ok / r.total;
                    return (
                      <li key={r.label} className="grid gap-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-base">
                          <span className="min-w-0 truncate text-strong">{r.label}</span>
                          <span className={cn("shrink-0 font-medium tabular-nums", p < 0.9 ? "text-warning" : "text-strong")}>
                            {r.ok}/{r.total}
                            {p < 0.9 ? <span className="sr-only">, eşiğin altında</span> : null}
                          </span>
                        </div>
                        <div role="meter" aria-label={r.label} aria-valuemin={0} aria-valuemax={r.total} aria-valuenow={r.ok} aria-valuetext={`${r.ok} / ${r.total} zamanında`} className="h-1.5 overflow-hidden rounded-full bg-chart-track">
                          <div className={cn("h-full rounded-full", p < 0.9 ? "bg-warning" : "bg-primary")} style={{ width: `${p * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <Panel id="odeme-hizi" title="Ay İçinde Ödeme Hızı" note="Kira tahsilatının ortalama süresi, son altı ay">
                <TrackBarChart title="Aylık Ortalama Ödeme Süresi" data={d.pay.map((v, i) => ({ label: MONTHS[i], value: v }))} ticks={[0, 5, 10, 15]} threshold={{ value: 10, label: "Hedef" }} format={(n) => `${n.toLocaleString("tr-TR")} g`} />
                <p className="mt-3 text-small text-muted">
                  Kasım ortalaması <span className="font-medium text-strong tabular-nums">{dayText(last)}</span>, son altı ayın en kısası.
                </p>
              </Panel>
            </div>
            <div className="grid min-w-0 gap-5">
              <Panel id="bosluklar" title="Kamu Kaydındaki Boşluklar" note="Kayıt ile gerçek durum arasındaki fark" bodyClassName="grid gap-4">
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line-soft sm:grid-cols-4">
                  {[
                    ["Başta Açık", d.gaps.start],
                    ["Kapanan", d.gaps.closed],
                    ["Yeni", d.gaps.fresh],
                    ["Şu An Açık", open],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-overlay p-3">
                      <dt className="text-small text-muted">{k}</dt>
                      <dd className="mt-0.5 text-read font-semibold text-strong tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <InsightCallout title={`${open} Açık Boşluğun Tek Nedeni Var: Eksik Sözleşme Tescili`} label="Neden" kind="warning" headingLevel={3} actions={<Button variant="secondary" size="sm" onClick={() => toast("Tescil listesi açıldı (örnek)")}>Listeyi Aç</Button>}>
                  Boşlukların hepsi kamu kaydına işlenmemiş sözleşme yenilemeleri. Üç tescili tamamlamak açık boşluk sayısını yarıya indirir.
                </InsightCallout>
              </Panel>
              <Panel id="aktarma" title="Dışa Aktarma Paketi" note="Denetim için hazır dosyalar" bodyClassName="p-0">
                <RecordList label="Dışa Aktarma Paketi" items={files} />
              </Panel>
            </div>
          </div>
        </Page>
      </Shell>
      {notice ? (
        <div className="fixed bottom-4 left-4 z-30 lg:left-[17rem]">
          <NoticeDeck
            label="Bildirim Uyarısı"
            interval={0}
            onDismiss={() => setNotice(false)}
            items={[
              {
                id: "cuma",
                eyebrow: "Süre",
                title: "Bildirim Cuma Günü Doluyor",
                body: "Kira artış bildirimi için yasal süre Cuma 17:00'de bitiyor.",
                action: (
                  <button type="button" className="font-medium text-primary-ink underline-offset-2 hover:underline" onClick={() => toast("Bildirim taslağı açıldı (örnek)")}>
                    Bildirimi Aç
                  </button>
                ),
              },
            ]}
          />
        </div>
      ) : null}
      <Toaster />
    </>
  );
}
