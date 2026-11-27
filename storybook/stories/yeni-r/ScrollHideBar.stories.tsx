import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Minus, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { ScrollHideBar } from "@/components/ui/scroll-hide-bar";

function Reader() {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setBox} data-testid="scroller" className="relative h-[420px] w-[min(100vw-2rem,40rem)] overflow-y-auto rounded-2xl bg-surface">
      <article className="mx-auto grid max-w-prose gap-4 px-6 py-10 text-read text-body">
        <h2 className="text-title font-medium text-strong">Kavrum Günlüğü</h2>
        {Array.from({ length: 14 }, (_, i) => (
          <p key={i}>
            Lot {40 + i}: çekirdek 9 dakika 40 saniyede ilk çatlamaya ulaştı; şubeye gitmeden önce iki gün dinlendirilecek. Tadım notları
            akşam paylaşılır.
          </p>
        ))}
      </article>
      <div className="sticky bottom-0 h-0">
        <ScrollHideBar scrollContainer={box} position="absolute" className="bottom-4">
          <div role="toolbar" aria-label="Okuma" className="flex items-center gap-0.5">
            {[
              [Minus, "Yazıyı Küçült"],
              [Plus, "Yazıyı Büyüt"],
              [Share2, "Paylaş"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Minus;
              return (
                <button key={label as string} type="button" aria-label={label as string} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-strong">
                  <I aria-hidden className="size-4" />
                </button>
              );
            })}
          </div>
        </ScrollHideBar>
      </div>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Kaydırınca Çekilen Çubuk",
  id: "scroll-hide-bar",
  component: ScrollHideBar,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      story: { inline: false, height: "480px" },
      description: {
        component:
          "Yüzen hap araç çubuğu: aşağı kaydırınca (6 px üstü, 80 px'ten sonra) kenara çekilir, yukarı kaydırınca geri gelir. İçinde odak varken ya da `open` doğruyken gizlenmez; gizliyken `inert`. Yerleşim değiştiren eylemler `useScrollHideBar().hold()` ile çubuğu 900 ms sabit tutar. Rol vermez: içerik araç çubuğuysa `role=\"toolbar\"` içeriğin işi. Hareket azaltmada kayma yerine solma. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { children: null },
  render: () => <Reader />,
} satisfies Meta<typeof ScrollHideBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = canvas.getByTestId("scroller");
    const bar = canvas.getByRole("toolbar", { name: "Okuma" }).closest("[data-edge]") as HTMLElement;
    await expect(bar).not.toHaveAttribute("data-hidden");
    scroller.scrollTop = 300;
    scroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(bar).toHaveAttribute("data-hidden"));
    scroller.scrollTop = 200;
    scroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(bar).not.toHaveAttribute("data-hidden"));
  },
};
