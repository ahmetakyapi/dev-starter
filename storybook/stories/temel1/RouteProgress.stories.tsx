import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { RouteProgress, startRouteProgress, stopRouteProgress, useRouteNavigating } from "@/components/ui/route-progress";
import { Frame } from "../_lib/Frame";

function Controls() {
  const navigating = useRouteNavigating();
  return (
    <Frame width="md">
      <div className="grid gap-4 text-center">
        <p className="text-base text-body">
          Gezinme durumu: <strong className="text-strong">{navigating ? "Sürüyor" : "Boşta"}</strong>
        </p>
        <p className="text-small text-muted">Çubuk sayfanın en üstünde; 420 ms geçince ortada “Yükleniyor” hapı çıkar.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={startRouteProgress}>
            Gezinmeyi Başlat
          </Button>
          <Button variant="secondary" onClick={stopRouteProgress}>
            Durdur
          </Button>
        </div>
      </div>
    </Frame>
  );
}

/** Hikâye açılınca gezinme başlar, kapanınca durur (mağaza modül düzeyinde). */
function Running() {
  useEffect(() => {
    startRouteProgress();
    return stopRouteProgress;
  }, []);
  return <Controls />;
}

const meta = {
  title: "Bileşenler/Yükleme/Gezinme Göstergesi",
  component: RouteProgress,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Tıklama ile yeni ekranın belirmesi arasındaki boşluğu doldurur: üstte süresiz salınan ince çubuk, gecikirse “Yükleniyor” hapı. Kök layout'a `<Suspense>` içinde bir kez konur; adresi değiştirmeyen beklemeler için `startRouteProgress()` / `stopRouteProgress()`.",
      },
    },
  },
  args: { label: "Yükleniyor" },
  render: (args) => (
    <>
      <RouteProgress {...args} />
      <Controls />
    </>
  ),
} satisfies Meta<typeof RouteProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan (Boşta)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Gezinmeyi Başlat" }));
    await expect(canvas.getByText("Sürüyor")).toBeInTheDocument();
    await expect(await canvas.findByText("Yükleniyor", {}, { timeout: 2000 })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Durdur" }));
    await expect(canvas.getByText("Boşta")).toBeInTheDocument();
  },
};

export const Calisiyor: Story = {
  name: "Gezinme Sürüyor",
  tags: ["!autodocs"],
  args: { label: "Sayfa yükleniyor" },
  render: (args) => (
    <>
      <RouteProgress {...args} />
      <Running />
    </>
  ),
};
