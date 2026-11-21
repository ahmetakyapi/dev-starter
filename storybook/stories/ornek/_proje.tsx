"use client";

import { BarChart3, ChevronLeft, ChevronRight, Flag, Home, Inbox, ListTodo, Plus, Settings, Share2, Target, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { IconButton } from "@/components/ui/icon-button";
import { PathGraph, type PathColumn } from "@/components/ui/path-graph";
import { RecordList } from "@/components/ui/record-list";
import { TabLinks } from "@/components/ui/tabs";
import { TickMeter } from "@/components/ui/tick-meter";
import { cn } from "@/lib/utils";
import { BrandMark, CARD, Dot, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Proje görünümü (Plotline görselinden yapı; kişi, proje ve tarih kurgusal):
 * teslim tarihini belirleyen zincir, dört çentikli ölçü, yoldaki açık işler.
 * "Yolu kır" kartı önerileri sırayla gösterir; her öneri tarihi kaç gün
 * öne çektiğini söyler. Telefonda tablo kayıt listesine döner.
 */

const person = (name: string, size: "sm" | "md" = "sm") => <Avatar name={name} size={size} className="!size-6" />;

const COLUMNS: readonly PathColumn[] = [
  {
    id: "yap",
    label: "Yap",
    nodes: [
      { id: "ios", title: "iOS ödeme", meta: "2g · 26 Kas", leading: person("Ayşe Ural"), after: [] },
      { id: "api", title: "Ödeme API v2", meta: "1g · 2 Ara · engelli", leading: person("Serkan Okur"), critical: true, blocked: true, after: [] },
      { id: "android", title: "Android ödeme", meta: "1g · 25 Kas", leading: person("Levent Bal"), after: [] },
      { id: "offline", title: "Çevrimdışı eşitleme", meta: "3g · 27 Kas", leading: person("Devrim Malkoç"), after: [] },
    ],
  },
  {
    id: "test",
    label: "Test",
    nodes: [
      { id: "qa", title: "Ödeme ekranı testi", meta: "5g · 8 Ara", leading: person("Mine Tan"), critical: true, after: ["api", "ios"] },
      { id: "reg", title: "Regresyon turu", meta: "3g · 7 Ara", leading: person("Mine Tan"), after: ["android", "offline"] },
    ],
  },
  {
    id: "yayin",
    label: "Yayın",
    nodes: [{ id: "store", title: "Mağaza incelemesi", meta: "3g · 15 Ara", leading: person("Cem Yıldız"), critical: true, after: ["qa", "reg"] }],
  },
];

type Task = { id: string; key: string; area: string; name: string; owner: string; est: number; spent: number; finish: string; why: string; tone: "primary" | "warning" | "neutral" | "danger"; status: string; critical?: boolean };
const TASKS: readonly Task[] = [
  { id: "t1", key: "PRJ-230", area: "Yayın", name: "Mağaza incelemesi", owner: "Cem Yıldız", est: 3, spent: 0, finish: "15 Ara", why: "Çıkış tarihini belirler", tone: "primary", status: "Yolda", critical: true },
  { id: "t2", key: "PRJ-221", area: "Test", name: "Ödeme ekranı testi", owner: "Mine Tan", est: 4, spent: 0, finish: "8 Ara", why: "Mine iki test turuna da atanmış", tone: "primary", status: "Yolda", critical: true },
  { id: "t3", key: "PRJ-208", area: "Arka uç", name: "Ödeme API v2", owner: "Serkan Okur", est: 5, spent: 4, finish: "2 Ara", why: "Sağlayıcının test anahtarları bekleniyor", tone: "warning", status: "Engelli 3g", critical: true },
  { id: "t4", key: "PRJ-224", area: "Test", name: "Regresyon turu", owner: "Mine Tan", est: 3, spent: 0, finish: "7 Ara", why: "Çıkıştan önce boşluğu var", tone: "neutral", status: "5g boşluk" },
  { id: "t5", key: "PRJ-197", area: "Arka uç", name: "Çevrimdışı taslak eşitleme", owner: "Devrim Malkoç", est: 8, spent: 6, finish: "27 Kas", why: "Çıkıştan önce boşluğu var", tone: "neutral", status: "8g boşluk" },
  { id: "t6", key: "PRJ-212", area: "iOS", name: "iOS ödeme", owner: "Ayşe Ural", est: 6, spent: 9, finish: "26 Kas", why: "Ödeme sayfası tasarımdan sonra yeniden yazıldı", tone: "danger", status: "3g aştı" },
  { id: "t7", key: "PRJ-214", area: "Android", name: "Android ödeme", owner: "Levent Bal", est: 6, spent: 6, finish: "25 Kas", why: "iOS ile aynı anahtarları kullanır", tone: "neutral", status: "10g boşluk" },
];

const BREAKS = [
  { id: "b1", title: "Sağlayıcıdan test anahtarlarını iste", detail: "15 Ara → 11 Ara", gain: "2 işi açar", action: "Sağlayıcıya hatırlat" },
  { id: "b2", title: "Mine'nin iki test turunu ikiye böl", detail: "15 Ara → 12 Ara", gain: "1 işi açar", action: "Görevi böl" },
] as const;

const PEOPLE = [{ name: "Ayşe Ural" }, { name: "Serkan Okur" }, { name: "Levent Bal" }, { name: "Mine Tan" }, { name: "Cem Yıldız" }, { name: "Devrim Malkoç" }, { name: "Duru Er" }];

const NAV = [
  {
    items: [
      { href: "#ana", label: "Ana sayfa", icon: <Home /> },
      { href: "#gorevlerim", label: "Görevlerim", icon: <ListTodo />, badge: "8" },
      { href: "#gelen", label: "Gelen kutusu", icon: <Inbox /> },
      { href: "#hedefler", label: "Hedefler", icon: <Target /> },
      { href: "#raporlar", label: "Raporlar", icon: <BarChart3 /> },
    ],
  },
  {
    label: "Projeler",
    items: [
      { href: "#mobil", label: "Mobil uygulama 3.0", icon: <Dot className="bg-chart-2" />, badge: "Risk" },
      { href: "#web", label: "Web ödeme", icon: <Dot className="bg-chart-6" /> },
      { href: "#karsilama", label: "Karşılama v2", icon: <Dot className="bg-chart-5" /> },
      { href: "#veri", label: "Veri ambarı", icon: <Dot className="bg-chart-3" /> },
      { href: "#makrolar", label: "Destek makroları", icon: <Dot className="bg-chart-4" /> },
    ],
  },
  {
    items: [
      { href: "#ekip", label: "Ekip", icon: <Users />, badge: "24" },
      { href: "#ayarlar", label: "Ayarlar", icon: <Settings /> },
    ],
  },
] as const;

function Kpi({ label, value, note, children }: { label: string; value: React.ReactNode; note: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn(CARD, "flex min-w-0 flex-col gap-1.5 p-3 sm:p-4")}>
      <p className="text-small text-muted">{label}</p>
      <p className="text-title sm:text-heading font-semibold tracking-tight text-strong tabular-nums">{value}</p>
      <p className="text-small text-muted">{note}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ProjeGorunumuPage() {
  const [step, setStep] = useState(0);
  const brk = BREAKS[step];

  const columns: Column<Task>[] = [
    {
      key: "name",
      header: "İş",
      render: (t) => (
        <div className="flex items-stretch gap-3">
          <span aria-hidden className={cn("w-0.5 shrink-0 rounded-full", t.critical ? "bg-danger" : "bg-line-strong")} />
          <div className="min-w-0">
            <p className="font-medium text-strong">{t.name}</p>
            <p className="font-mono text-micro text-muted">
              {t.key} · {t.area}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Sorumlu",
      render: (t) => (
        <span className="flex items-center gap-2">
          <Avatar name={t.owner} size="sm" className="!size-6" />
          {t.owner}
        </span>
      ),
    },
    {
      key: "est",
      header: "Tahmin ve harcanan",
      width: "11rem",
      render: (t) => <TickMeter label={`${t.name}, tahmin ve harcanan`} value={t.spent} max={t.est} size="sm" ticks={Math.min(t.est, 10)} text={`${t.spent}/${t.est}g`} valueText={`${t.spent} gün harcandı, tahmin ${t.est} gün${t.spent > t.est ? `, ${t.spent - t.est} gün aştı` : ""}`} />,
    },
    { key: "finish", header: "Biter", render: (t) => <span className={cn("font-mono", t.critical ? "text-danger" : "text-body")}>{t.finish}</span> },
    { key: "why", header: "Neden önemli", render: (t) => <span className="text-body">{t.why}</span> },
    { key: "status", header: "Durum", render: (t) => <Badge tone={t.tone}>{t.status}</Badge> },
  ];

  return (
    <Shell brand={{ name: "Yolhane", href: "#ana", logo: <BrandMark><Flag /></BrandMark> }} groups={NAV} current="#mobil" user={{ name: "Seda Çelik", detail: "Ürün müdürü" }}>
      <Page>
        <PageHead
          title="Mobil uygulama 3.0"
          badge={
            <>
              <Badge tone="danger" dot>
                Risk altında
              </Badge>
              <SampleStamp />
            </>
          }
          description={
            <>
              Bu yolla <strong className="font-semibold text-strong">Sal 15 Ara</strong>'da çıkıyor, söz verilen Cum 11 Ara'dan{" "}
              <span className="text-danger">2 iş günü geç</span>. <strong className="font-semibold text-strong">2 iş</strong> tarihi ileri itiyor.
            </>
          }
          actions={
            <>
              <AvatarGroup people={PEOPLE} max={5} size="sm" label="Proje ekibi" />
              <Button variant="secondary" size="sm">
                <Share2 aria-hidden /> Paylaş
              </Button>
              <Button variant="primary" size="sm">
                <Plus aria-hidden /> Yeni görev
              </Button>
            </>
          }
        />

        {/* Telefonda sekmeler sığmaz: yatay kayar, sağ kenardaki solma "devamı var" der. */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <TabLinks
            aria-label="Proje görünümleri"
            current="#gorunum"
            className="w-max"
            items={[
              { href: "#gorunum", label: "Görünüm" },
              { href: "#pano", label: "Pano 19" },
              { href: "#zaman", label: "Zaman çizelgesi" },
              { href: "#liste", label: "Liste 50" },
              { href: "#yuk", label: "İş yükü" },
            ]}
          />
        </div>

        <section aria-label="Proje ölçüleri" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi label="Biten görevler" value={<>31<span className="text-muted">/50</span></>} note="+7 bu hafta · 19 açık">
            <TickMeter label="Biten görevler" value={31} max={50} ticks={40} text="%62" valueText="31 / 50 görev, %62" />
          </Kpi>
          <Kpi label="Bu yolla çıkış" value="15 Ara" note={<span className="text-danger">Söze göre +2 gün</span>}>
            <TickMeter label="Çıkışa kalan süre" value={12} max={10} ticks={10} text="12 / 10g" valueText="12 iş günü, söz verilen 10, 2 gün fazla" />
          </Kpi>
          <Kpi label="Başlangıçtan beri kapsam" value={<>+6 <span className="text-base font-normal text-muted">görev</span></>} note="Cüzdan, tablet ve 4 iş daha">
            <TickMeter label="Kapsam artışı" value={50} max={44} ticks={44} text="44 → 50" valueText="Görev sayısı 44'ten 50'ye çıktı" />
          </Kpi>
          <Kpi label="Ekip yükü, bu hafta" value={<>%95 <span className="text-base font-normal text-muted">ortalama</span></>} note={<><span className="text-danger">Mine %130</span> (52 s / 40 s), Duru'nun 18 s boşu var</>}>
            <TickMeter label="Ekip yükü" value={95} max={100} ticks={25} marker={0.8} text="ort. 95 / 100" valueText="Ekip ortalama yükü %95, sağlıklı sınır %80'in üstünde; Mine %130'da" />
          </Kpi>
        </section>

        <Panel id="yol" title="Çıkışa giden yol" note="Her iş, öncekiler bitince başlar. Kırmızı çizgi çıkış tarihini belirleyen zincirdir." bodyClassName="px-2 sm:px-3">
          <PathGraph
            label="Çıkışa giden yol"
            columns={COLUMNS}
            start={{ title: "Bugün", meta: "23 Kas", note: "+2g geç" }}
            goal={{ title: "Çıkış", meta: "15 Ara", note: "Söz verilen 11 Ara", after: ["store"] }}
          />
          <p aria-hidden className="mt-2 flex items-center justify-end gap-1 px-2 text-micro text-muted lg:hidden">
            Yolun devamı için yana kaydır <ChevronRight className="size-3" />
          </p>
          <div className="mt-4 grid gap-4 px-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:px-2">
            <div className="rounded-lg bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-micro font-medium tracking-wide text-muted">YOLU KIR · {step + 1} / {BREAKS.length}</p>
                <span className="flex gap-1">
                  <IconButton icon={ChevronLeft} aria-label="Önceki öneri" size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)} />
                  <IconButton icon={ChevronRight} aria-label="Sonraki öneri" size="sm" variant="ghost" disabled={step === BREAKS.length - 1} onClick={() => setStep(step + 1)} />
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0" aria-live="polite">
                  <p className="font-medium text-strong">{brk.title}</p>
                  <p className="text-small text-muted">
                    <span className="font-mono">{brk.detail}</span> · <span className="font-medium text-success">{brk.gain}</span>
                  </p>
                </div>
                <Button variant="primary" size="sm">
                  {brk.action}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-micro font-medium tracking-wide text-muted">SIRADAKİ DÖNÜM NOKTASI</p>
              <p className="mt-2 font-medium text-strong">Kod dondurma</p>
              <p className="text-small text-muted">Cum 27 Kas · 4 gün sonra</p>
              <TickMeter className="mt-3" label="Dönüm noktasına kalan süre" value={4} max={17} ticks={17} text="bugün → çıkış" valueText="Çıkışa 17 günün 4'ü geçti" size="sm" />
            </div>
          </div>
        </Panel>

        <Panel id="isler" title="Yoldaki açık işler" note="Önce kritik olanlar. Tahmine karşı harcanan, her çentik bir iş günü." bodyClassName="px-0 sm:px-0 pt-2 pb-0">
          <DataTable caption="Yoldaki açık işler" columns={columns} rows={TASKS} rowKey={(t) => t.id} on="page" stickyFirst={false} minWidth="60rem" className="max-md:hidden" />
          <RecordList
            className="md:hidden"
            label="Yoldaki açık işler"
            items={TASKS.map((t) => ({
              id: t.id,
              title: t.name,
              subtitle: `${t.key} · ${t.area}`,
              value: t.finish,
              meta: `${t.owner} · ${t.spent}/${t.est}g`,
              status: <Badge tone={t.tone}>{t.status}</Badge>,
            }))}
          />
          <p className="border-t border-line-soft px-4 py-3 text-small text-muted sm:px-5">18 iş günlük iş kaldı · 1 iş tahmini aştı · Mağaza incelemesi ortalama 3 gün sürer</p>
        </Panel>
      </Page>
    </Shell>
  );
}
