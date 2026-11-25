import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  AtmosphereHero,
  BeigeFinanceHero,
  CornerLabelHero,
  FloatCardsHero,
  FocusStackHero,
  HorizonHero,
  Scene,
} from "./_kahramanlar";
import { BandHero, ExhibitHero, StrataHero } from "./_sergi";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Kahraman Sahneleri",
  id: "sample-heroes",
  component: Scene,
  tags: ["autodocs"],
  parameters: {
    // a11y TODO (Odak Yığını uzak öğeleri bilerek soluk (aria-hidden); axe soluk metni ölçüyor): bkz. storybook/A11Y-DURUM.md
    a11y: { test: "todo" },
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Dokuz tam sayfa kahraman düzeni (üçü Sergi turundan: ürün dokulu zeminde, `art-mat`). Referans görsellerden yalnız yapı ve davranış alındı; metin, logo ve görsel alınmadı. Markalar kurgusal, logolar düz kelime işareti, sayılar \"ÖRNEK\". Zemin yalnız `wallpaper`, `mesh-gradient` ve token; menü bağlantıları sayfanın altındaki gerçek duraklara gider.",
      },
    },
  },
  args: { children: null },
} satisfies Meta<typeof Scene>;

export default meta;
type Story = StoryObj<typeof meta>;

const h1Once = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await expect(within(canvasElement).getAllByRole("heading", { level: 1 })).toHaveLength(1);
};

export const Atmosphere: Story = {
  name: "Atmosfer",
  render: () => (
    <Scene>
      <AtmosphereHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Manzara zemini üstünde soldan sağa solan başlık, serif vurgu, cam eylem ve altta kayan logo şeridi (Qbick, Ocost, Haven sahnelerinden). `ToneText fade`, `LiquidGlassLink`, `Marquee`, `Wallpaper`." } } },
  play: h1Once,
};

export const FloatingCards: Story = {
  name: "Süzülen Kartlar",
  render: () => (
    <Scene>
      <FloatCardsHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Başlığın çevresinde dönmüş, kenara taşan ürün parçaları (Socialscale). Kartlar gerçek bileşenlerle çizildi: `Stat`, `Sparkline`, `Badge`. `FloatCards`, `Announcement`; telefonda kartlar gizlenir." } } },
  play: h1Once,
};

export const FocusStackScene: Story = {
  name: "Odak Yığını",
  render: () => (
    <Scene>
      <FocusStackHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Solda başlık ve eylemler, sağda ortadaki öğenin öne çıktığı dikey yığın (Forge). `FocusStack` ok tuşlarıyla gezilir, hover ve odak döngüyü durdurur; zemin `MeshGradient`." } } },
  play: async (ctx) => {
    await h1Once(ctx);
    await expect(within(ctx.canvasElement).getByRole("region", { name: "Hazır ajanlar" })).toBeInTheDocument();
  },
};

export const CornerLabelScene: Story = {
  name: "Köşe Etiketi",
  render: () => (
    <Scene>
      <CornerLabelHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Tam ekran koyu sahne, altta solda köşe ayraçlı mono etiket ve dev başlık (Sightline). `CornerLabel`, `ToneText`, `DockingNav`, `Wallpaper`." } } },
  play: h1Once,
};

export const Horizon: Story = {
  name: "Ufuk",
  render: () => (
    <Scene>
      <HorizonHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Ortada logolu menü, ürün penceresi arkada kısmen görünür, önüne manzara biner ve sayfa zeminine solar (StatiQ). `HorizonScene`, `AppWindow`, `Wallpaper`." } } },
  play: h1Once,
};

export const BeigeFinance: Story = {
  name: "Bej Finans",
  render: () => (
    <Scene>
      <BeigeFinanceHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Köşelerde renk lekeleri, hap menü, iki tonlu başlık, pano penceresi, logo şeridi ve sayı şeridi (Synais). `MeshGradient`, `ToneText.Soft`, `AppWindow`, `StatStrip`; sayılar \"ÖRNEK\" künyeli." } } },
  play: h1Once,
};

export const Exhibit: Story = {
  name: "Sergi",
  render: () => (
    <Scene>
      <ExhibitHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Sola yaslı dev başlık, ilk kelimede kalem şeridi ve ikon, soluk devam; solda tanım ve iki eylem, sağda mono sayılar; altta kareli kağıt paspartusunda alttan kırpılan plan penceresi, iki yanda kesik kılavuzlar (Synaps). `HeadMark`, `ArtMat grid`, `AppWindow`." } } },
  play: h1Once,
};

export const Strata: Story = {
  name: "Boya Katmanı",
  render: () => (
    <Scene>
      <StrataHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Ortalı serif başlık, içinde ikon karesi ve italik vurgu; boya katmanlı, yırtık kenarlı zeminde grafik penceresi; altında ödeme yöntemi satırı (Lasso). `HeadMark tile`, `ArtMat strata earth`, `StackedBarChart`, `BarList`." } } },
  play: h1Once,
};

export const Band: Story = {
  name: "Daralan Bant",
  render: () => (
    <Scene>
      <BandHero />
    </Scene>
  ),
  parameters: { docs: { description: { story: "Solda iki satırlı sakin başlık, sağda e-posta + buton tek satırda; altında boya katmanlı bant, kaydırınca kenarlara taşan halinden karta daralır, üstünde üç ürün kartı (ortadaki öne çıkar) (Grain videosu). `ArtMat scrollInset`, `Stat`, `Badge`, `Eyebrow`." } } },
  play: h1Once,
};
