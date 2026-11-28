import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { DeviceFrame, DeviceRow } from "@/components/ui/device-frame";
import { RingChart } from "@/components/ui/ring-chart";
import { Sparkline } from "@/components/ui/sparkline";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Wallpaper } from "@/components/ui/wallpaper";

/** Kurgu kişisel finans ekranı (ÖRNEK veri). */
function FinanceHome() {
  return (
    <div className="grid gap-3 px-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lead font-semibold">Günaydın Deniz</h3>
        <span className="rounded-full bg-primary-wash px-2 text-micro font-medium text-primary-ink">Örnek</span>
      </div>
      <div className="rounded-lg bg-surface p-3 text-strong">
        <StatGrid className="grid-cols-1 sm:grid-cols-1"><Stat label="Net Varlık" value="₺128.443" change={2.4} changeLabel="Geçen Aya Göre" /></StatGrid>
        <Sparkline values={[96, 101, 99, 108, 112, 109, 118, 124, 128]} title="Son dokuz ay net varlık" width={200} height={36} className="mt-2 w-full" />
      </div>
      <div className="rounded-lg bg-surface p-3 text-strong">
        <p className="text-small font-medium text-muted">Kasım Harcaması</p>
        <RingChart
          title="Kategoriye göre kasım harcaması"
          className="mt-1 max-w-36"
          rings={[
            { label: "Kira", value: 18500, series: 2 },
            { label: "Market", value: 7200, series: 6 },
            { label: "Ulaşım", value: 3100, series: 3 },
          ]}
        >
          <span className="text-base font-semibold tabular-nums">₺28.800</span>
        </RingChart>
      </div>
    </div>
  );
}

function Goals() {
  return (
    <div className="grid gap-2 px-4 pt-2">
      <h3 className="text-lead font-semibold">Hedefler</h3>
      {[
        ["Tatil Fonu", "₺18.000 / ₺30.000"],
        ["Acil Durum", "₺42.000 / ₺50.000"],
        ["Yeni Bilgisayar", "₺9.500 / ₺45.000"],
      ].map(([name, amount]) => (
        <div key={name} className="rounded-lg bg-page/10 p-3">
          <p className="text-base font-medium">{name}</p>
          <p className="text-small tabular-nums opacity-75">{amount}</p>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Telefon Çerçevesi",
  id: "device-frame",
  component: DeviceFrame,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Token'la çizilmiş telefon maketi: ince çerçeve halkası ve kenar parlaması, durum çubuğu (saat, sinyal, kablosuz, pil), dinamik ada, kaydırılmayan içerik yuvası ve ev çubuğu. Oran 9 / 19.5 sabit, iç ölçüler `cqw` ile ölçeklenir. `tone=\"dark\"` ters ekran, `tilt` hafif 3B eğim (ince işaretçide üzerine gelince düzleşir). `DeviceRow` 2-3 telefonu dizer, telefonda yalnız ortadaki görünür. Çerçeve katmanları `aria-hidden`; `label` ile `figure`. Sunucu bileşeni. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: { label: "Kişisel finans uygulaması, ana ekran", size: 300, time: "9:41", tone: "light" },
  render: (args) => (
    <DeviceFrame {...args}>
      <FinanceHome />
    </DeviceFrame>
  ),
} satisfies Meta<typeof DeviceFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("figure")).toHaveAccessibleName("Kişisel finans uygulaması, ana ekran");
    await expect(canvas.getByRole("heading", { name: "Günaydın Deniz" })).toBeVisible();
    await expect(canvas.getByText("9:41").closest("[aria-hidden]")).not.toBeNull();
  },
};

export const DarkTilted: Story = {
  name: "Ters Ekran, Eğik",
  args: { tone: "dark", tilt: true, label: "Hedefler ekranı", time: "18:05" },
  render: (args) => (
    <DeviceFrame {...args}>
      <Goals />
    </DeviceFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("figure", { name: "Hedefler ekranı" })).toHaveAttribute("data-tilt", "true");
    await expect(canvas.getByRole("heading", { name: "Hedefler" })).toBeVisible();
  },
};

export const Row: Story = {
  name: "Üçlü Sıra, Duvar Kağıdı Üstünde",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative isolate overflow-hidden px-4 py-12">
      <Wallpaper scene="dunes" className="absolute inset-0 -z-10" />
      <DeviceRow label="Uygulamanın üç ekranı: hedefler, ana ekran ve harcamalar">
        <DeviceFrame size={260} tone="dark" time="18:05">
          <Goals />
        </DeviceFrame>
        <DeviceFrame size={300}>
          <FinanceHome />
        </DeviceFrame>
        <DeviceFrame size={260} tone="dark" time="18:05">
          <Goals />
        </DeviceFrame>
      </DeviceRow>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("figure", { name: /üç ekranı/ })).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "Günaydın Deniz" })).toBeVisible();
  },
};
