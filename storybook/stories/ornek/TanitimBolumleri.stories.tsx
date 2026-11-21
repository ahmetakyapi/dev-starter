import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FeatureTiles, NumbersAndQuote, Process as ProcessSection, SkyColumns, Stories } from "./_bolumler";
import type { ReactNode } from "react";

const Page = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-page text-body">
    <main>{children}</main>
  </div>
);

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Tanıtım Bölümleri",
  id: "sample-sections",
  component: Page,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Tanıtım sayfasının beş bölümü. Referans görsellerden yalnız yapı alındı. Kişi, marka ve sayı kurgusal; alıntı kartları \"ÖRNEK\" künyeli ve yayına çıkmadan gerçek, onaylı içerikle değiştirilir.",
      },
    },
  },
  args: { children: null },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FeatureTilesStory: Story = {
  name: "Özellik Karoları",
  render: () => (
    <Page>
      <FeatureTiles />
    </Page>
  ),
  parameters: { docs: { description: { story: "2/3 + 3/2 bento: açık, koyu, marka ve gökyüzü tonlu dört karo, içlerinde cam çerçeveli sahneler (Socialscale, StatiQ, Axon). `BentoGrid`, `FeatureTile`, `GlassFrame`." } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("heading", { level: 3 })).toHaveLength(4);
  },
};

export const CustomerStories: Story = {
  name: "Müşteri Hikâyeleri",
  render: () => (
    <Page>
      <Stories />
    </Page>
  ),
  parameters: { docs: { description: { story: "Fotoğraf, sade ve sonuç rakamlı dört alıntı karosu (Socialscale). `StoryGrid`, `StoryCard`; hepsi `sample` ile \"ÖRNEK\" künyeli." } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("article")).toHaveLength(4);
  },
};

export const Process: Story = {
  name: "Süreç",
  render: () => (
    <Page>
      <ProcessSection />
    </Page>
  ),
  parameters: { docs: { description: { story: "Koyu bölümde solda başlık, sağda dolan dikey ray (Synais). `StepRail tone=\"dark\"`." } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("list", { name: "Süreç" })).toBeInTheDocument();
  },
};

export const NumbersAndQuoteStory: Story = {
  name: "Sayılar ve Görüş",
  render: () => (
    <Page>
      <NumbersAndQuote />
    </Page>
  ),
  parameters: { docs: { description: { story: "Solda başlık, sağda tek alıntı; altında dört büyük sayı (Synais). `StoryCard`, `StatStrip`; sayılar örnek." } } },
};

export const SkyColumnsStory: Story = {
  name: "Üç Sütun Gökyüzü",
  render: () => (
    <Page>
      <SkyColumns />
    </Page>
  ),
  parameters: { docs: { description: { story: "Başlığın sağında iki eylem, altında üç gökyüzü sahnesi ve altlarında başlık + açıklama (Respan). `FeatureTile tone=\"sky\"`, `GlassFrame`." } } },
};
