import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Activity, GitBranch, Table2 } from "lucide-react";
import { BentoGrid, FeatureTile, GlassFrame } from "@/components/ui/feature-tile";
import { Gallery } from "../_lib/Frame";

const FormMock = () => (
  <GlassFrame>
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-md bg-primary-wash text-primary-ink [&_svg]:size-4">
        <Table2 />
      </span>
      <div className="min-w-0">
        <p className="text-base font-medium">Form girişi</p>
        <p className="truncate text-small text-muted">Yapılandırılmış girdiyi toplar</p>
      </div>
    </div>
    <div className="mt-3 flex items-center justify-between rounded-md bg-surface px-3 py-2 text-small">
      <span className="text-body">Toplam girdi</span>
      <span className="font-medium tabular-nums">3</span>
    </div>
    <div className="mt-3 flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-md bg-warning-wash text-warning [&_svg]:size-4">
        <GitBranch />
      </span>
      <p className="text-base font-medium">Koşul</p>
    </div>
  </GlassFrame>
);

const RunsMock = () => (
  <GlassFrame>
    <p className="flex items-center gap-2 text-small text-muted">
      <Activity aria-hidden className="size-3.5" /> Aktif çalıştırma
    </p>
    <p className="mt-2 text-display font-medium tabular-nums">3,7 bin</p>
    <p className="text-small text-success">+12% geçen haftaya göre</p>
  </GlassFrame>
);

const meta = {
  title: "Bileşenler/Tanıtım/Özellik Karosu",
  id: "feature-tile",
  component: FeatureTile,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir yeteneği başlık, tek cümle ve altta kırpılan sahneyle anlatan bento karosu. Tonlar: açık gri kuyu, koyu, marka (beyaz metin her noktada AA) ve metni karonun altında duran gökyüzü sahnesi. `GlassFrame` sahnenin içindeki cam çerçeveli kart, `BentoGrid` dört karoyu 2/3 + 3/2 dizer (telefonda tek sütun). `href` karonun tamamını tek bağlantı yapar. Socialscale, Respan ve Axon tanıtım bölümlerinin yapısından; metin ve görsel alınmadı.",
      },
    },
  },
  args: { title: "Otomatik iş akışları", description: "Karmaşık akışları yapıştırıcı kod yazmadan tasarla, tetikle ve çalıştır." },
  argTypes: {
    tone: { control: "inline-radio", options: ["light", "dark", "brand", "sky"] },
    mediaAlign: { control: "inline-radio", options: ["bottom-bleed", "center"] },
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,28rem)]">
      <FeatureTile {...args} media={<FormMock />} />
    </div>
  ),
} satisfies Meta<typeof FeatureTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Marka",
  args: { tone: "brand" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { name: "Otomatik iş akışları" })).toBeInTheDocument();
  },
};

export const Tones: Story = {
  name: "Dört Ton",
  render: () => (
    <Gallery cols={2}>
      <FeatureTile tone="light" title="Açık" description="Gri kuyu; sakin, çoğunluk karo bu olmalı." media={<RunsMock />} />
      <FeatureTile tone="dark" title="Koyu" description="İki temada da koyu; pano ve kod sahneleri için." media={<RunsMock />} />
      <FeatureTile tone="brand" title="Marka" description="Vurgu karosu; sayfada bir ya da iki tane." media={<FormMock />} />
      <FeatureTile tone="sky" title="Gökyüzü" description="Metin altta, sahne üstte; üç sütunluk sıra için." media={<FormMock />} />
    </Gallery>
  ),
};

export const Bento: Story = {
  name: "Dörtlü Bento",
  render: () => (
    <div className="w-[min(100vw-2rem,72rem)]">
      <BentoGrid>
        <FeatureTile tone="brand" title="Otomatik iş akışları" description="Modelleri ve veri hatlarını dakikalar içinde bağla." media={<FormMock />} href="#a" />
        <FeatureTile tone="dark" title="Platform içgörüleri" description="Kullanım, başarım ve sistem sağlığını canlı izle." media={<RunsMock />} href="#b" />
        <FeatureTile tone="dark" title="Hareket açıklar, dağıtmaz" description="Küçük etkileşimlerden ürün animasyonuna." media={<RunsMock />} />
        <FeatureTile tone="light" title="SaaS için kuruldu" description="Büyümeye hazır, kullanılabilir ve hızlı." media={<FormMock />} />
      </BentoGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
  },
};
