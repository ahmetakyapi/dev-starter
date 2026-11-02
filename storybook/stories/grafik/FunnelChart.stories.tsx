import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { KAYIT_HUNISI, ODEME_HUNISI } from "./_veri";

type Args = ComponentProps<typeof FunnelChart> & { asamaSayisi: number };

const oran = (stages: readonly { value: number }[]) => {
  const first = stages[0]?.value ?? 0;
  const last = stages.at(-1)?.value ?? 0;
  return first ? `%${((last / first) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}` : "%0";
};

const meta = {
  title: "Grafikler/Huni",
  component: FunnelChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Soldan sağa daralan aşamalar: \"nerede kaybediyoruz\" sorusunun bir bakışta cevabı, en dik iniş göze ilk çarpar. Sayı şekle bırakılmaz; her sütunda ilk aşamaya göre yüzde hapı, altta tam değerli lejant. `curve` yumuşak, `step` keskin geçiş; kesin kıyas gerekiyorsa aşama çubukları.",
      },
    },
  },
  args: {
    title: "Ödeme Hunisi",
    stages: ODEME_HUNISI,
    shape: "curve",
    legend: true,
    height: "h-40",
    asamaSayisi: 4,
  },
  argTypes: {
    stages: { control: "object" },
    shape: { control: "inline-radio", options: ["curve", "step"] },
    height: { control: "select", options: ["h-32", "h-40", "h-56"] },
    asamaSayisi: { control: { type: "range", min: 2, max: 6, step: 1 }, description: "Gösterilen aşama sayısı" },
  },
  render: ({ asamaSayisi, stages, ...args }) => {
    const shown = stages.slice(0, asamaSayisi);
    return (
      <Sahne width="lg">
        <ChartCard id="huni-kart" label={args.title} value={oran(shown)} change={-1.2} changeLabel="geçen aya göre" action={<Donem defaultValue="30g" />}>
          <FunnelChart {...args} stages={shown} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan (Eğri)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Aşamalar ekran okuyucuya sıralı listede, ilk aşamaya göre payıyla
    const list = canvas.getByRole("list", { name: /Ödeme Hunisi/ });
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(4);
    await expect(items[1]).toHaveTextContent("%30");
  },
};

export const Basamak: Story = {
  name: "Basamak",
  args: { shape: "step" },
};

export const AltiAsama: Story = {
  name: "Altı Aşama",
  args: { asamaSayisi: 6 },
};

export const IkiAsama: Story = {
  name: "Az Veri (İki Aşama)",
  args: { title: "Deneme → Ücretli", stages: [{ label: "Deneme", value: 412 }, { label: "Ücretli", value: 87 }], asamaSayisi: 2 },
};

export const SifirAsama: Story = {
  name: "Sıfır Değerli Aşama",
  args: {
    title: "Yeni Ürün Hunisi",
    stages: [
      { label: "Görüntüleme", value: 3120 },
      { label: "Sepet", value: 214 },
      { label: "Ödeme", value: 18 },
      { label: "Sipariş", value: 0 },
    ],
  },
};

export const UzunEtiket: Story = {
  name: "Uzun Etiket",
  args: {
    title: "SaaS Etkinleştirme",
    stages: [
      { label: "Kayıt Formunu Tamamlayan", value: 6270 },
      { label: "E-posta Adresini Doğrulayan", value: 4980 },
      { label: "İlk Projesini Oluşturan", value: 2710 },
      { label: "Ekip Arkadaşını Davet Eden", value: 940 },
    ],
  },
};

export const LejantsizKayit: Story = {
  name: "Lejantsız, SaaS Kayıt",
  args: { title: "Kayıt Hunisi", stages: KAYIT_HUNISI, legend: false, asamaSayisi: 6 },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      {(["curve", "step"] as const).map((shape) => (
        <GrafikHucre key={shape} label={shape === "curve" ? "Eğri geçiş" : "Basamaklı geçiş"}>
          <ChartCard id={`huni-${shape}`} label={shape === "curve" ? "Ödeme Hunisi · Eğri" : "Ödeme Hunisi · Basamak"} value={oran(ODEME_HUNISI.slice(0, 4))} change={-1.2}>
            <FunnelChart title={`Ödeme hunisi, ${shape === "curve" ? "eğri" : "basamak"}`} stages={ODEME_HUNISI.slice(0, 4)} shape={shape} />
          </ChartCard>
        </GrafikHucre>
      ))}
      <GrafikHucre label="Altı aşama, lejantsız">
        <ChartCard id="huni-alti" label="Kayıt Hunisi" value={oran(KAYIT_HUNISI)} change={2.4}>
          <FunnelChart title="Kayıt hunisi" stages={KAYIT_HUNISI} legend={false} />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İki aşama, basamak">
        <ChartCard id="huni-iki" label="Deneme → Ücretli" value="%21,1">
          <FunnelChart title="Deneme → Ücretli" shape="step" stages={[{ label: "Deneme", value: 412 }, { label: "Ücretli", value: 87 }]} />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
