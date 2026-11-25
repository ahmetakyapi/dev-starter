import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Globe, LifeBuoy, Paintbrush, ScanFace, ShoppingBag, ThumbsUp } from "lucide-react";
import { expect, within } from "storybook/test";
import { ArtMat } from "@/components/ui/art-mat";
import { FeatureList, type FeatureItem } from "@/components/ui/feature-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { Frame } from "../_lib/Frame";
import { DemoWindow } from "./_sahne";

const ITEMS: FeatureItem[] = [
  { id: "a", title: "Sepet Önerileri", description: "Tek tıkla ek ürün, paket indirimi ve abonelik teklifi.", icon: <ShoppingBag />, color: 4 },
  { id: "b", title: "Yerelleştirme", description: "Müşterinin bulunduğu yere göre ödeme yöntemi ve para birimi.", icon: <Globe />, color: 2 },
  { id: "c", title: "Kişiselleştirme", description: "Doğru zamanda doğru teklif; veriye dayanan yerleşim.", icon: <ScanFace />, color: 3 },
  { id: "d", title: "Görünüm", description: "Ödeme sayfası markanın yazı tipi ve renkleriyle açılır.", icon: <Paintbrush />, color: 1 },
];

const meta = {
  title: "Bileşenler/Tanıtım/Özellik Listesi",
  id: "feature-list",
  component: FeatureList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Renkli çizgi ikon + başlık + soluk açıklama, satırlar kıl çizgiyle ayrılır. Sergilenen ürün görselinin yanında durur: görsel \"ne\", liste \"neden\" der. Kart ve ikon karesi yok; renk yalnız ikonda (süs), anlam metinde. Lasso referansından (yalnız yapı).",
      },
    },
  },
  args: { items: ITEMS, headingLevel: 3, dense: false },
  render: (args) => (
    <Frame width="md">
      <FeatureList {...args} />
    </Frame>
  ),
} satisfies Meta<typeof FeatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(4);
    await expect(canvas.getByRole("heading", { name: "Yerelleştirme" })).toBeInTheDocument();
  },
};

export const WithArtMat: Story = {
  name: "Paspartuyla Yan Yana",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-dvh bg-page px-5 py-16 sm:px-10">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-10">
          <SectionHeading title="Büyümenin sınırı" soft="ödeme ekranında başlar." />
          <FeatureList
            items={[
              { id: "a", title: "Tek Panelden Yönetim", description: "Bütün ödeme hesapların tek panoda, tek raporda.", icon: <ShoppingBag />, color: 4 },
              { id: "b", title: "Birebir Destek", description: "Hesap yöneticinle ödeme stratejini birlikte kur.", icon: <LifeBuoy />, color: 2 },
              { id: "c", title: "Daha Çok Onay", description: "Sağlayıcı başına onay oranını gör, yerel yöntemle artır.", icon: <ThumbsUp />, color: 3 },
            ]}
          />
        </div>
        <ArtMat variant="strata" tone="earth" edge="torn">
          <DemoWindow />
        </ArtMat>
      </div>
    </div>
  ),
};

export const Dense: Story = { name: "Sık", args: { dense: true } };
