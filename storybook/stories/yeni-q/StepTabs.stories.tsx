import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building2, Frame as FrameIcon, PenLine, Sparkles } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { ArtMat } from "@/components/ui/art-mat";
import { StepTabs, type StepTab } from "@/components/ui/step-tabs";
import { DemoWindow } from "./_sahne";

const scene = (variant: "strata" | "grid" | "wash") => (
  <ArtMat variant={variant} tone={variant === "strata" ? "earth" : "primary"} edge="torn" crop pad="lg" className="h-72 sm:h-96">
    <DemoWindow />
  </ArtMat>
);

const STEPS: StepTab[] = [
  { id: "ciz", title: "Çiz ya da Anlat", description: "Bir taslak yükle ya da ne istediğini tek cümleyle yaz.", icon: <PenLine />, panel: scene("wash") },
  { id: "sec", title: "Alanı Seç", description: "Haritada yerini işaretle, sınırları belirle.", icon: <FrameIcon />, panel: scene("grid") },
  { id: "uret", title: "Yapıyı Üret", description: "İlk sürüm saniyeler içinde hazır, her parçası düzenlenebilir.", icon: <Building2 />, panel: scene("strata") },
  { id: "duzenle", title: "İnce Ayar Yap", description: "Duvarı taşı, ölçüyü değiştir; bütün görünümler izler.", icon: <Sparkles />, panel: scene("wash") },
];

const meta = {
  title: "Bileşenler/Tanıtım/Adım Sekmeleri",
  id: "step-tabs",
  component: StepTabs,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "760px" },
      description: {
        component:
          "\"Nasıl çalışır\" için yatay adım şeridi: seçili adım tam renk, diğerleri soluk; altındaki sahne seçili adımı gösterir. WAI-ARIA tabs (←→ Home End). `autoPlay` ile kendiliğinden ilerler, yanında Durdur butonu (WCAG 2.2.2), üstüne gelince ve görünüm dışında durur; hareketi azaltan kullanıcıda ilerlemez. Synaps \"How it works\" referansından (yalnız yapı).",
      },
    },
  },
  args: { steps: STEPS, label: "Nasıl Çalışır", defaultValue: "sec", autoPlay: 0 },
  render: (args) => (
    <div className="min-h-dvh bg-page px-5 py-12 sm:px-10">
      <StepTabs {...args} className="mx-auto max-w-6xl" />
    </div>
  ),
} satisfies Meta<typeof StepTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const second = canvas.getByRole("tab", { name: /Alanı Seç/ });
    await expect(second).toHaveAttribute("aria-selected", "true");
    second.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: /Yapıyı Üret/ })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toBeInTheDocument();
  },
};

export const AutoPlay: Story = {
  name: "Kendiliğinden İlerleyen",
  args: { autoPlay: 4500, defaultValue: "ciz" },
  play: async ({ canvasElement }) => {
    // Hareket azaltma açıkken (testler öyle koşar) kendiliğinden ilerleme ve Durdur butonu yok; şerit yine seçilebilir.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: /Çiz ya da Anlat/ })).toHaveAttribute("aria-selected", "true");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await expect(canvas.getByRole("button", { name: "Adımları durdur" })).toBeInTheDocument();
  },
};

export const WithoutPanels: Story = {
  name: "Sahnesiz",
  args: { steps: STEPS.map(({ panel: _p, ...s }) => s), defaultValue: "ciz" },
};
