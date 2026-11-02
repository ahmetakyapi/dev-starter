import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { AYLAR, BILET_ACILAN, GUNLER, KAZANC, SON_14_GUN, sayi, tl, tlKisa, toplam } from "./_veri";

type Args = ComponentProps<typeof TrackBarChart> & { sutunSayisi: number; paraBirimi: boolean };

const AYLIK = AYLAR.map((label, i) => ({ label, value: KAZANC[i] }));

const meta = {
  title: "Grafikler/İz Üstünde Sütun",
  component: TrackBarChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Ay, gün, hafta gibi sıralı tek seri için sütunlar; her sütunun arkasında tavanı gösteren soluk bir iz var, ızgara çizgisine gerek kalmaz. Etiketler kısa olmalı (\"Oca\", \"Pzt\"): 12 sütun telefonda sütun başına ~24 px bırakır. Üzerine gelinince değer yazılır; klavye ve ekran okuyucu değeri `sr-only` tablodan okur.",
      },
    },
  },
  args: {
    title: "Aylık Kazanç",
    data: AYLIK,
    ticks: [0, 5000, 10000],
    series: 1,
    height: "h-48",
    sutunSayisi: 12,
    paraBirimi: true,
  },
  argTypes: {
    data: { control: "object" },
    format: { control: false },
    series: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    height: { control: "select", options: ["h-32", "h-48", "h-64"] },
    sutunSayisi: { control: { type: "range", min: 1, max: 12, step: 1 }, description: "Gösterilen sütun sayısı" },
    paraBirimi: { control: "boolean", description: "Eksen ve balon ₺ biçiminde" },
  },
  render: ({ sutunSayisi, paraBirimi, data, ...args }) => {
    const shown = data.slice(0, sutunSayisi);
    const sum = toplam(shown.map((d) => d.value));
    return (
      <Sahne width="lg">
        <ChartCard id="iz-kart" label="Bu Yıl Kazanılan" value={paraBirimi ? tl(sum) : sayi(sum)} change={14.8} action={<Donem defaultValue="yil" />}>
          <TrackBarChart {...args} data={shown} format={paraBirimi ? tlKisa : sayi} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Veri ekran okuyucuya tabloda: 12 satır, Kasım ₺9,7 bin
    const table = canvas.getByRole("table", { name: "Aylık Kazanç" });
    await expect(within(table).getAllByRole("row")).toHaveLength(12);
    await expect(within(table).getByRole("row", { name: /Kas/ })).toHaveTextContent("₺9,7 bin");
  },
};

export const Haftalik: Story = {
  name: "Haftalık Bilet (Yedi Gün)",
  args: {
    title: "Günlük Açılan Bilet",
    data: GUNLER.map((label, i) => ({ label, value: BILET_ACILAN[i] })),
    ticks: [0, 100, 200],
    series: 2,
    sutunSayisi: 7,
    paraBirimi: false,
  },
};

export const OnDortGun: Story = {
  name: "On Dört Gün, Uzun Etiket",
  args: {
    title: "Son 14 Gün Açılan Bilet",
    data: SON_14_GUN.map((label, i) => ({ label, value: BILET_ACILAN[i] })),
    ticks: [0, 100, 200],
    series: 3,
    sutunSayisi: 14,
    paraBirimi: false,
  },
  argTypes: { sutunSayisi: { control: { type: "range", min: 1, max: 14, step: 1 } } },
};

export const AzVeri: Story = {
  name: "Az Veri (Üç Ay)",
  args: { sutunSayisi: 3 },
};

export const SifirDegerler: Story = {
  name: "Sıfır Değerli Aylar",
  args: {
    data: AYLAR.map((label, i) => ({ label, value: i < 4 ? 0 : KAZANC[i] })),
  },
};

export const Bos: Story = {
  name: "Boş (Hepsi Sıfır)",
  args: { data: AYLAR.map((label) => ({ label, value: 0 })) },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      {([1, 2, 3, 4, 5, 6] as const).map((s) => (
        <GrafikHucre key={s} label={`Seri ${s}`}>
          <ChartCard id={`iz-v${s}`} label={`Aylık Kazanç · Seri ${s}`} value={tl(toplam(KAZANC))} change={s % 2 ? 14.8 : -2.1}>
            <TrackBarChart title={`Aylık Kazanç, seri ${s}`} data={AYLIK} ticks={[0, 5000, 10000]} format={tlKisa} series={s} height="h-32" />
          </ChartCard>
        </GrafikHucre>
      ))}
    </Gallery>
  ),
};
