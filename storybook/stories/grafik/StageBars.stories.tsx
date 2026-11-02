import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditCard, Eye, PackageCheck, ShoppingCart, Truck, UserPlus } from "lucide-react";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { StageBars } from "@/components/ui/stage-bars";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { KAYIT_HUNISI, ODEME_HUNISI } from "./_veri";

type Args = ComponentProps<typeof StageBars> & { asamaSayisi: number; ikonlu: boolean; lejant: boolean };

const IKONLAR = [<Eye key="e" />, <ShoppingCart key="s" />, <CreditCard key="c" />, <UserPlus key="u" />, <PackageCheck key="p" />, <Truck key="t" />];
const SERILER = [1, 2, 3, 4, 5, 6] as const;

const meta = {
  title: "Grafikler/Aşama Çubukları",
  id: "stage-bars",
  component: StageBars,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bir hunideki adımlar ortak tabanlı hap çubuklar halinde: kayıp oranı uzunluktan doğrudan okunur, daralan huni çizimi gibi küçük farkı abartmaz. Pay hep ilk aşamaya göre; aşamalar arası dönüşüm gerekiyorsa `note` ile satıra yazılır. Sunucu bileşeni, JavaScript inmez.",
      },
    },
  },
  args: {
    title: "Kayıt Hunisi",
    stages: KAYIT_HUNISI,
    asamaSayisi: 6,
    ikonlu: false,
    lejant: true,
  },
  argTypes: {
    stages: { control: "object" },
    asamaSayisi: { control: { type: "range", min: 1, max: 6, step: 1 }, description: "Gösterilen aşama sayısı" },
    ikonlu: { control: "boolean", description: "Dolgunun başında ikon" },
    lejant: { control: "boolean", description: "Altta lejant karoları" },
  },
  render: ({ asamaSayisi, ikonlu, lejant, stages, ...args }) => {
    const shown = stages.slice(0, asamaSayisi).map((s, i) => ({ ...s, icon: ikonlu ? IKONLAR[i] : undefined }));
    return (
      <Sahne>
        <ChartCard
          id="asama-kart"
          label={args.title}
          value={(shown[0]?.value ?? 0).toLocaleString("tr-TR")}
          change={2.4}
          action={<Donem />}
          footer={
            lejant ? (
              <ChartLegend
                className="px-1 pb-1"
                items={shown.map((s, i) => ({ label: s.label, value: s.value, series: SERILER[i % 6] }))}
              />
            ) : undefined
          }
        >
          <StageBars {...args} stages={shown} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Kayıt Hunisi" });
    const rows = within(list).getAllByRole("listitem");
    await expect(rows).toHaveLength(6);
    // Pay metinde: son satır ilk aşamanın %3'ü
    await expect(rows[5]).toHaveTextContent("%3");
  },
};

export const WithIcon: Story = {
  name: "İkonlu, Ödeme Hunisi",
  args: { title: "Ödeme Hunisi", stages: ODEME_HUNISI, ikonlu: true },
};

export const FewData: Story = {
  name: "Az Veri (İki Aşama)",
  args: { title: "Deneme → Ücretli", stages: [{ label: "Deneme", value: 412 }, { label: "Ücretli", value: 87 }], asamaSayisi: 2 },
};

export const ZeroStage: Story = {
  name: "Sıfır Değerli Aşama",
  args: {
    title: "Kurumsal Hunisi",
    stages: [
      { label: "Demo Talebi", value: 64 },
      { label: "Görüşme", value: 21 },
      { label: "Teklif", value: 6 },
      { label: "Sözleşme", value: 0 },
    ],
    asamaSayisi: 4,
  },
};

export const WithStageNote: Story = {
  name: "Aşamalar Arası Not",
  args: {
    title: "Destek Bileti Akışı",
    stages: [
      { label: "Açılan", value: 2140 },
      { label: "İlk Yanıt", value: 2088, note: "Ortalama ilk yanıt 14 dk" },
      { label: "Çözülen", value: 1874, note: "Açılanların %88'i, hedef %85" },
      { label: "Yeniden Açılan", value: 96 },
    ],
    asamaSayisi: 4,
    lejant: false,
  },
};

export const LongLabel: Story = {
  name: "Uzun Etiket",
  args: {
    title: "Kurumsal Satış Hunisi",
    stages: [
      { label: "Web Sitesinden Demo Talebi", value: 940 },
      { label: "Satış Ekibiyle İlk Görüşme", value: 512 },
      { label: "Teknik Değerlendirme Toplantısı", value: 228 },
      { label: "İmzalı Yıllık Sözleşme", value: 61 },
    ],
    asamaSayisi: 4,
    lejant: false,
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      <GrafikHucre label="Altı Aşama">
        <ChartCard id="sb-v1" label="Kayıt Hunisi" value="1.180" change={2.4}>
          <StageBars title="Kayıt Hunisi" stages={KAYIT_HUNISI} />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İkonlu">
        <ChartCard id="sb-v2" label="Ödeme Hunisi" value="48.200" change={-1.2}>
          <StageBars title="Ödeme Hunisi" stages={ODEME_HUNISI.slice(0, 4).map((s, i) => ({ ...s, icon: IKONLAR[i] }))} />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İki Aşama">
        <ChartCard id="sb-v3" label="Deneme → Ücretli" value="%21">
          <StageBars title="Deneme → Ücretli" stages={[{ label: "Deneme", value: 412 }, { label: "Ücretli", value: 87 }]} />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Sıfır Değerli Son Aşama">
        <ChartCard id="sb-v4" label="Kurumsal Hunisi" value="64" change={-8.6}>
          <StageBars
            title="Kurumsal Hunisi"
            stages={[
              { label: "Demo", value: 64 },
              { label: "Teklif", value: 6 },
              { label: "Sözleşme", value: 0 },
            ]}
          />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
