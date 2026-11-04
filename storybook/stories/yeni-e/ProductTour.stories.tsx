import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ProductTour, type TourStep } from "@/components/ui/product-tour";
import { Button } from "@/components/ui/Button";

const STEPS: TourStep[] = [
  { target: "arama", title: "Ara", body: "Talep, müşteri ya da sipariş numarasıyla ara." },
  { target: "ozet", title: "Özet", body: "Bugünün sayıları, dünkülerle karşılaştırmalı." },
  { target: "yeni", title: "Yeni Talep", body: "Telefonla gelen talebi buradan kaydet." },
];

function Screen() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid min-h-dvh content-start gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div data-tour="arama" className="h-11 w-72 rounded-md bg-surface-sunken shadow-well" />
        <Button onClick={() => setOpen(true)}>Turu Başlat</Button>
      </div>
      <div data-tour="ozet" className="grid grid-cols-3 gap-3">
        {["Açık Talep 8", "Bugün Çözülen 5", "Ortalama Yanıt 6 dk"].map((t) => (
          <div key={t} className="rounded-xl bg-overlay p-5 text-title font-semibold text-strong shadow-raised">
            {t}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button data-tour="yeni" variant="secondary">
          Yeni Talep
        </Button>
      </div>
      <ProductTour label="Panel Turu" open={open} onOpenChange={setOpen} steps={STEPS} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Ürün Turu",
  id: "product-tour",
  component: ProductTour,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Ekranın önemli parçalarını sırayla gösteren tur: sayfa kararır, hedef bir pencereyle açıkta kalır, yanında kısa başlık ve bir cümle. Hedef `data-tour` ya da seçici; bulunamayan adım atlanır. Kart diyalog: odak alır, Tab içinde döner, ← → adım, Escape kapatır ve odak açana döner. Telefonda kart alta yaslanır. Dört-beş adımı geçme.",
      },
    },
  },
  args: { steps: STEPS, open: false, onOpenChange: () => undefined },
  render: () => <Screen />,
} satisfies Meta<typeof ProductTour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const start = canvas.getByRole("button", { name: "Turu Başlat" });
    await userEvent.click(start);
    const dialog = await page.findByRole("dialog", { name: "Ara" });
    await expect(dialog).toHaveTextContent("1 / 3");
    await userEvent.keyboard("{ArrowRight}");
    await expect(await page.findByRole("dialog", { name: "Özet" })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "İleri" }));
    await expect(await page.findByRole("dialog", { name: "Yeni Talep" })).toHaveTextContent("3 / 3");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(start).toHaveFocus();
  },
};
