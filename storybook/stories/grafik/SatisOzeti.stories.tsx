import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building2, Eye, Rocket, UserPlus, Users, Zap } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { RadarChart } from "@/components/ui/radar-chart";
import { RingChart } from "@/components/ui/ring-chart";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StageBars } from "@/components/ui/stage-bars";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { Screen } from "../_lib/Frame";
import { OzetKarolari } from "./_sahne";
import { AYLAR, KAZANC, sayi, tl, tlKisa, toplam } from "./_veri";

/* SaaS satış özeti: aylık kazanç, plan dağılımı, kayıt hunisi ve iki
   satış ekibinin profili. Bölge seçimi bütün kartları birlikte değiştirir. */

type Bolge = "tum" | "marmara" | "ege";

const VERI: Record<
  Bolge,
  {
    kazanc: readonly number[];
    degisim: number;
    hedef: number;
    plan: readonly { label: string; value: number; series: 1 | 2 | 3 | 4 | 5 }[];
    huni: readonly number[];
  }
> = {
  tum: {
    kazanc: KAZANC,
    degisim: 14.8,
    hedef: 60000,
    plan: [
      { label: "Pro Aylık", value: 275, series: 5 },
      { label: "Pro Yıllık", value: 200, series: 4 },
      { label: "Ekip", value: 187, series: 3 },
      { label: "Kurumsal", value: 173, series: 2 },
      { label: "Başlangıç", value: 90, series: 1 },
    ],
    huni: [1180, 790, 460, 250, 120, 40],
  },
  marmara: {
    kazanc: [1120, 3480, 4910, 3620, 1980, 1040, 1730, 2650, 3410, 2280, 6120, 4370],
    degisim: 18.2,
    hedef: 36000,
    plan: [
      { label: "Pro Aylık", value: 168, series: 5 },
      { label: "Pro Yıllık", value: 131, series: 4 },
      { label: "Ekip", value: 124, series: 3 },
      { label: "Kurumsal", value: 118, series: 2 },
      { label: "Başlangıç", value: 41, series: 1 },
    ],
    huni: [690, 482, 291, 167, 84, 31],
  },
  ege: {
    kazanc: [430, 1520, 1980, 1310, 640, 380, 690, 920, 1240, 890, 2210, 1580],
    degisim: 6.4,
    hedef: 15000,
    plan: [
      { label: "Pro Aylık", value: 64, series: 5 },
      { label: "Pro Yıllık", value: 41, series: 4 },
      { label: "Ekip", value: 38, series: 3 },
      { label: "Kurumsal", value: 22, series: 2 },
      { label: "Başlangıç", value: 31, series: 1 },
    ],
    huni: [302, 198, 109, 54, 23, 6],
  },
};

const BOLGELER = [
  { value: "tum", label: "Tümü" },
  { value: "marmara", label: "Marmara" },
  { value: "ege", label: "Ege" },
] as const;

const ASAMA = [
  { label: "Ziyaret", icon: <Eye /> },
  { label: "Kayıt", icon: <UserPlus /> },
  { label: "Aktif", icon: <Zap /> },
  { label: "Pro", icon: <Rocket /> },
  { label: "Ekip", icon: <Users /> },
  { label: "Kurumsal", icon: <Building2 /> },
];

const EKSEN = ["Görüşme", "Demo", "Teklif", "Kapanış", "Yenileme", "Çapraz Satış"];
const EKIP: Record<Bolge, readonly [readonly number[], readonly number[]]> = {
  tum: [[88, 82, 79, 74, 91, 63], [70, 86, 80, 74, 69, 77]],
  marmara: [[93, 86, 82, 78, 94, 66], [74, 88, 83, 79, 72, 81]],
  ege: [[76, 74, 68, 61, 86, 52], [61, 79, 71, 63, 60, 66]],
};

function SatisOzeti({ baslangicBolgesi = "tum" }: { baslangicBolgesi?: Bolge }) {
  const [bolge, setBolge] = useState<Bolge>(baslangicBolgesi);
  const v = VERI[bolge];
  const yillik = toplam(v.kazanc);
  const plan = toplam(v.plan.map((p) => p.value));
  const enBuyuk = v.plan[0];
  const [a, b] = EKIP[bolge];
  const ort = (x: readonly number[]) => Math.round(toplam(x) / x.length);
  const enIyi = v.kazanc.indexOf(Math.max(...v.kazanc));
  const enDusuk = v.kazanc.indexOf(Math.min(...v.kazanc));
  const AY_ADI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <Screen>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-small font-medium text-muted">Defter · Satış</p>
            <h1 className="mt-1 text-heading font-semibold tracking-tight text-strong">Satış Özeti</h1>
            <p className="mt-1 text-small text-muted">2026 Yılı, Aylık Abonelik Gelirleri</p>
          </div>
          <SegmentedControl aria-label="Bölge" options={BOLGELER} value={bolge} onValueChange={setBolge} />
        </header>

        <h2 className="sr-only">Grafikler</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <ChartCard id="satis-kazanc" className="flex min-w-0 flex-col lg:col-span-7 [&>div]:flex-1" label="Bu Yıl Kazanılan" value={tl(yillik)} change={v.degisim} changeLabel="geçen yıla göre"
            footer={
              <OzetKarolari
                items={[
                  { label: "En İyi Ay", value: `${AY_ADI[enIyi]} · ${tl(v.kazanc[enIyi])}` },
                  { label: "En Düşük Ay", value: `${AY_ADI[enDusuk]} · ${tl(v.kazanc[enDusuk])}` },
                  { label: "Aylık Ortalama", value: tl(Math.round(yillik / 12)) },
                  { label: "Yıllık Hedef", value: `%${Math.round((yillik / v.hedef) * 100)} · ${tl(v.hedef)}` },
                ]}
              />
            }
          >
            <TrackBarChart
              title="Aylık Kazanç"
              data={AYLAR.map((label, i) => ({ label, value: v.kazanc[i] }))}
              ticks={[0, 5000, 10000]}
              format={tlKisa}
              height="h-72"
            />
          </ChartCard>

          <ChartCard
            id="satis-plan"
            className="min-w-0 lg:col-span-5"
            label="Plana Göre Abone"
            value={sayi(plan)}
            change={5.2}
            changeLabel="geçen aya göre"
            footer={<ChartLegend className="px-1 pb-1" items={v.plan} />}
          >
            <RingChart title="Plana Göre Abone" rings={v.plan}>
              <div>
                <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">%{Math.round((enBuyuk.value / plan) * 100)}</p>
                <p className="text-small text-muted">{enBuyuk.label}</p>
              </div>
            </RingChart>
          </ChartCard>

          <ChartCard
            id="satis-huni"
            className="min-w-0 lg:col-span-7"
            label="Kayıt Hunisi"
            value={sayi(v.huni[0])}
            change={2.4}
            footer={<ChartLegend columns={3} className="px-1 pb-1" items={ASAMA.map((s, i) => ({ label: s.label, value: v.huni[i], series: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6 }))} />}
          >
            <StageBars title="Kayıt Hunisi" stages={ASAMA.map((s, i) => ({ ...s, value: v.huni[i] }))} />
          </ChartCard>

          <ChartCard
            id="satis-ekip"
            className="min-w-0 lg:col-span-5"
            label="Satış Ekibi Profili"
            value={String(ort(a))}
            change={Math.round(((ort(a) - ort(b)) / ort(b)) * 1000) / 10}
            changeLabel="ikinci ekibe göre"
            footer={
              <ChartLegend
                className="px-1 pb-1"
                items={[
                  { label: "Kurumsal Ekip", value: ort(a), series: 2, unit: "ort." },
                  { label: "KOBİ Ekibi", value: ort(b), series: 4, unit: "ort." },
                ]}
              />
            }
          >
            <RadarChart
              key={bolge}
              title="Satış Ekibi Profili"
              unit="puan"
              axes={EKSEN}
              series={[
                { label: "Kurumsal Ekip", values: a, series: 2 },
                { label: "KOBİ Ekibi", values: b, series: 4 },
              ]}
            />
          </ChartCard>
        </div>
      </main>
    </Screen>
  );
}

const meta = {
  title: "Grafikler/Pano/Satış Özeti",
  id: "dashboard-sales",
  component: SatisOzeti,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sunucu tarafı grafiklerin (iz üstünde sütun, halka, aşama çubukları) bir radarla birlikte kullanımı. Kartlar 7 + 5 sütunluk iki sıra; telefonda tek sütun. Bölge seçimi bütün kartları birlikte günceller.",
      },
    },
  },
  args: { baslangicBolgesi: "tum" },
  argTypes: {
    baslangicBolgesi: { control: "inline-radio", options: ["tum", "marmara", "ege"], description: "Açılıştaki bölge" },
  },
} satisfies Meta<typeof SatisOzeti>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const kart = canvas.getByRole("region", { name: "Bu Yıl Kazanılan" });
    await expect(kart).toHaveTextContent("₺58.880");
    await userEvent.click(canvas.getByRole("radio", { name: "Ege" }));
    await expect(kart).toHaveTextContent("₺13.790");
    await userEvent.click(canvas.getByRole("radio", { name: "Tümü" }));
  },
};

export const AegeanRegion: Story = {
  name: "Ege Bölgesi",
  args: { baslangicBolgesi: "ege" },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
