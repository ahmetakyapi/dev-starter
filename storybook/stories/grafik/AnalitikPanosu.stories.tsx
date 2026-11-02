import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { AreaChart } from "@/components/ui/area-chart";
import { BarList } from "@/components/ui/bar-list";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { SankeyChart } from "@/components/ui/sankey-chart";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";
import { Screen } from "../_lib/Frame";
import { OzetKarolari } from "./_sahne";
import { AYLAR, GUNLER, gunluk, sayi, toplam, yuzdeDegisim } from "./_veri";

/* ── Veri: dönem seçimi bütün panoyu birlikte değiştirir ───────────────── */

type Donem = "hafta" | "ay" | "yil";

const OTUZ_GUN = Array.from({ length: 30 }, (_, i) => `${i + 2} Eki`);
const dalga = (n: number, taban: number, genlik: number, kaydir: number) =>
  Array.from({ length: n }, (_, i) => {
    const gun = i % 7;
    const haftaSonu = gun === 5 || gun === 6 ? 0.68 : 1;
    return Math.round((taban + Math.sin((i + kaydir) / 3.1) * genlik + i * (taban / 160)) * haftaSonu);
  });

const SERI: Record<Donem, { labels: readonly string[]; bu: readonly number[]; once: readonly number[]; oncekiAd: string; gore: string }> = {
  hafta: {
    labels: GUNLER,
    bu: [1420, 1515, 1488, 1392, 1610, 984, 862],
    once: [1302, 1376, 1410, 1288, 1452, 911, 805],
    oncekiAd: "Geçen Hafta",
    gore: "geçen haftaya göre",
  },
  ay: { labels: OTUZ_GUN, bu: dalga(30, 1380, 220, 0), once: dalga(30, 1210, 190, 2), oncekiAd: "Geçen Ay", gore: "geçen aya göre" },
  yil: {
    labels: AYLAR,
    bu: [31200, 33850, 38400, 36900, 40120, 43800, 41960, 45230, 48900, 51420, 55680, 59310],
    once: [26400, 27900, 30100, 31240, 30980, 34100, 35620, 35010, 37900, 40150, 42300, 44820],
    oncekiAd: "Geçen Yıl",
    gore: "geçen yıla göre",
  },
};

const DONEMLER = [
  { value: "hafta", label: "Hafta" },
  { value: "ay", label: "Ay" },
  { value: "yil", label: "Yıl" },
] as const;

const ALT_BASLIK: Record<Donem, string> = {
  hafta: "26 Ekim – 1 Kasım 2026",
  ay: "2 – 31 Ekim 2026",
  yil: "Ocak – Aralık 2026",
};

const URUN = [
  { label: "Kablosuz Kulak İçi Kulaklık", pay: 0.031 },
  { label: "Paslanmaz Çelik Termos 750 ml", pay: 0.023 },
  { label: "Ergonomik Ofis Sandalyesi", pay: 0.0147 },
  { label: "Organik Pamuk Nevresim Takımı", pay: 0.0132 },
  { label: "Seramik Kahve Fincanı İkili Set", pay: 0.0093 },
  { label: "Keten Masa Örtüsü 160 × 220", pay: 0.0071 },
  { label: "Bambu Banyo Paspası", pay: 0.0054 },
];

const KAYNAK = [
  { id: "arama", label: "Arama", series: 2, pay: 0.38 },
  { id: "sosyal", label: "Sosyal", series: 3, pay: 0.24 },
  { id: "dogrudan", label: "Doğrudan", series: 1, pay: 0.18 },
  { id: "eposta", label: "E-posta", series: 4, pay: 0.11 },
  { id: "reklam", label: "Reklam", series: 5, pay: 0.09 },
] as const;
/* Kaynağa göre sonuç payı: sipariş, sepette kaldı, ayrıldı */
const SONUC: Record<string, readonly [number, number, number]> = {
  arama: [0.052, 0.14, 0.808],
  sosyal: [0.021, 0.09, 0.889],
  dogrudan: [0.061, 0.16, 0.779],
  eposta: [0.074, 0.21, 0.716],
  reklam: [0.033, 0.12, 0.847],
};

/** Son 22 hafta günlük sipariş: dönemden bağımsız (ritim panosu). */
const SIPARIS_GUNLUK = gunluk({ weeks: 22, end: "2026-10-31", peak: 64, seed: 19 });

const GUN_ADI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/* ── Pano ───────────────────────────────────────────────────────────────── */

function Kart({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}

function AnalitikPanosu({ baslangicDonemi = "ay" }: { baslangicDonemi?: Donem }) {
  const [donem, setDonem] = useState<Donem>(baslangicDonemi);
  const s = SERI[donem];
  const ziyaret = toplam(s.bu);
  const ziyaretOnce = toplam(s.once);
  const siparis = Math.round(ziyaret * 0.0412);
  const siparisOnce = Math.round(ziyaretOnce * 0.0389);
  const donusum = (siparis / ziyaret) * 100;
  const donusumOnce = (siparisOnce / ziyaretOnce) * 100;
  const iade = donem === "hafta" ? 3.1 : donem === "ay" ? 2.8 : 2.6;

  const cihaz = [
    { label: "Mobil", value: Math.round(ziyaret * 0.51), series: 2 as const },
    { label: "Masaüstü", value: Math.round(ziyaret * 0.34), series: 3 as const },
    { label: "Tablet", value: Math.round(ziyaret * 0.15), series: 1 as const },
  ];

  const huni = [
    { label: "Ürün Görüntüleme", value: Math.round(ziyaret * 0.64) },
    { label: "Sepete Ekleme", value: Math.round(ziyaret * 0.19) },
    { label: "Ödeme Başlatma", value: Math.round(ziyaret * 0.071) },
    { label: "Sipariş", value: siparis },
  ];

  const kaynaklar = KAYNAK.map(({ id, label, series }) => ({ id, label, series }));
  const hedefler = [
    { id: "siparis", label: "Sipariş" },
    { id: "sepet", label: "Sepette" },
    { id: "ayrildi", label: "Ayrıldı" },
  ];
  const akis = KAYNAK.flatMap((k) =>
    hedefler.map((h, i) => ({ source: k.id, target: h.id, value: Math.round(ziyaret * k.pay * SONUC[k.id][i]) })),
  );

  const toplamGunluk = toplam(SIPARIS_GUNLUK.map((d) => d.value));
  const ortalama = Math.round(toplamGunluk / SIPARIS_GUNLUK.length);
  const gunToplam = [0, 0, 0, 0, 0, 0, 0];
  for (const d of SIPARIS_GUNLUK) gunToplam[(new Date(`${d.date}T00:00:00Z`).getUTCDay() + 6) % 7] += d.value;
  const yogunGun = GUN_ADI[gunToplam.indexOf(Math.max(...gunToplam))];

  return (
    <Screen>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-small font-medium text-muted">Kuzey Ev Tekstil · Mağaza</p>
            <h1 className="mt-1 text-heading font-semibold tracking-tight text-strong">Analitik</h1>
            <p className="mt-1 text-small text-muted">{ALT_BASLIK[donem]}</p>
          </div>
          <SegmentedControl aria-label="Dönem" options={DONEMLER} value={donem} onValueChange={setDonem} />
        </header>

        <h2 className="sr-only">Özet Ölçüler</h2>
        <dl className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat className="rounded-xl bg-surface px-5 py-4" label="Ziyaretçi" value={sayi(ziyaret)} change={yuzdeDegisim(ziyaret, ziyaretOnce)} changeLabel={s.gore} />
          <Stat className="rounded-xl bg-surface px-5 py-4" label="Sipariş" value={sayi(siparis)} change={yuzdeDegisim(siparis, siparisOnce)} changeLabel={s.gore} />
          <Stat
            className="rounded-xl bg-surface px-5 py-4"
            label="Dönüşüm Oranı"
            value={`%${donusum.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`}
            change={yuzdeDegisim(donusum, donusumOnce)}
            changeLabel={s.gore}
          />
          <Stat className="rounded-xl bg-surface px-5 py-4" label="İade Oranı" value={`%${iade.toLocaleString("tr-TR")}`} change={8.3} positiveIsGood={false} changeLabel="hedef %2,5" />
        </dl>

        <h2 className="sr-only">Grafikler</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <Kart className="lg:col-span-8">
            <ChartCard
              id="pano-ziyaret"
              className="h-full"
              label="Ziyaretçi"
              value={sayi(ziyaret)}
              change={yuzdeDegisim(ziyaret, ziyaretOnce)}
              changeLabel={s.gore}
              footer={
                <ChartLegend
                  className="px-1 pb-1"
                  items={[
                    { label: "Bu Dönem", value: ziyaret, series: 1, unit: "ziyaret" },
                    { label: s.oncekiAd, value: ziyaretOnce, series: 2, unit: "ziyaret" },
                  ]}
                />
              }
            >
              <AreaChart
                key={donem}
                title="Ziyaretçi"
                labels={s.labels}
                unit="ziyaret"
                height="h-56"
                series={[
                  { label: "Bu Dönem", values: s.bu, series: 1 },
                  { label: s.oncekiAd, values: s.once, series: 2 },
                ]}
              />
            </ChartCard>
          </Kart>

          <Kart className="lg:col-span-4">
            <ChartCard
              id="pano-cihaz"
              className="flex h-full flex-col [&>div]:flex-1"
              label="Cihaza Göre Ziyaret"
              value={sayi(ziyaret)}
              change={4.1}
              footer={<ChartLegend columns={3} className="px-1 pb-1" items={cihaz} />}
            >
              <div className="grid h-full place-items-center">
                <GaugeChart title="Cihaza Göre Ziyaret" parts={cihaz} />
              </div>
            </ChartCard>
          </Kart>

          <Kart className="lg:col-span-7">
            <ChartCard
              id="pano-huni"
              className="h-full"
              label="Ödeme Hunisi"
              value={`%${((siparis / huni[0].value) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`}
              change={-1.2}
              changeLabel="önceki döneme göre"
            >
              <FunnelChart title="Ödeme Hunisi" stages={huni} height="h-44" />
            </ChartCard>
          </Kart>

          <Kart className="lg:col-span-5">
            <ChartCard id="pano-urun" className="h-full" label="En Çok Satan Ürünler" value={sayi(siparis)} change={7.3}>
              <BarList
                title="En Çok Satan Ürünler"
                columns={["Ürün", "Adet"]}
                items={URUN.map((u) => ({ label: u.label, value: Math.round(siparis * u.pay * 10) }))}
              />
            </ChartCard>
          </Kart>

          <Kart className="lg:col-span-5">
            <ChartCard id="pano-ritim" className="flex h-full flex-col [&>div]:flex-1" label="Son 22 Hafta Sipariş" value={sayi(toplamGunluk)} change={9.6} changeLabel="önceki 22 haftaya göre"
              footer={
                <OzetKarolari
                  items={[
                    { label: "Günlük Ortalama", value: `${sayi(ortalama)} sipariş` },
                    { label: "En Yoğun Gün", value: yogunGun },
                  ]}
                />
              }
            >
              <Heatmap title="Son 22 Hafta Sipariş" data={SIPARIS_GUNLUK} weeks={22} unit="sipariş" />
            </ChartCard>
          </Kart>

          <Kart className="lg:col-span-7">
            <ChartCard id="pano-akis" className="h-full" label="Kaynağa Göre Sonuç" value={sayi(ziyaret)} change={3.8}>
              <SankeyChart key={donem} title="Kaynağa Göre Sonuç" unit="ziyaretçi" height="h-60" sources={kaynaklar} targets={hedefler} links={akis} />
            </ChartCard>
          </Kart>
        </div>
      </main>
    </Screen>
  );
}

/* ── Hikâyeler ──────────────────────────────────────────────────────────── */

const meta = {
  title: "Grafikler/Pano/Analitik Panosu",
  component: AnalitikPanosu,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bütün grafik bileşenlerinin bir arada kullanımı: üstte dört ölçü, geniş alan grafiği ve yanında gösterge, altta huni, sıralı liste, aktivite ızgarası ve sankey. 12 sütunlu ızgara masaüstünde zikzak genişliklerle dengelenir, telefonda tek sütuna iner. Dönem seçimi (Hafta / Ay / Yıl) bütün kartları birlikte günceller.",
      },
    },
  },
  args: { baslangicDonemi: "ay" },
  argTypes: {
    baslangicDonemi: { control: "inline-radio", options: ["hafta", "ay", "yil"], description: "Açılıştaki dönem" },
  },
} satisfies Meta<typeof AnalitikPanosu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("2 – 31 Ekim 2026")).toBeInTheDocument();
    // Dönem değişince bütün pano birlikte güncellenir
    await userEvent.click(canvas.getByRole("radio", { name: "Yıl" }));
    await expect(canvas.getByText("Ocak – Aralık 2026")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: "Ay" }));
    await expect(canvas.getByRole("radio", { name: "Ay" })).toBeChecked();
  },
};

export const Yillik: Story = {
  name: "Yıllık Görünüm",
  args: { baslangicDonemi: "yil" },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
