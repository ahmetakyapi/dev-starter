import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/spinner";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yükleme/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Küçük, satır içi bekleme işareti: düğme içi, tek hücre, kısa istek. Sayfa ya da panel düzeyinde iskelet (`Skeleton`) kullan. Düğmenin metni zaten bir şey söylüyorsa `label={null}` ver; düğme içinde `tone=\"current\"` metin rengini alır.",
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["primary", "current", "muted"] },
  },
  args: { size: "md", tone: "primary", label: "Yükleniyor" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const DugmeIcinde: Story = {
  name: "Düğme İçinde",
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="brand" disabled aria-busy="true">
        <Spinner size="sm" tone="current" label={null} />
        Hesap oluşturuluyor
      </Button>
      <Button variant="secondary" disabled aria-busy="true">
        <Spinner size="sm" tone="current" label={null} />
        Yükleniyor
      </Button>
    </div>
  ),
};

export const SatirIcinde: Story = {
  name: "Satır İçinde",
  render: () => (
    <Frame width="sm">
      <p className="flex items-center gap-2 text-base text-body">
        <Spinner size="sm" tone="muted" label={null} />
        Döviz kurları güncelleniyor
      </p>
    </Frame>
  ),
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boylar: sm · md · lg">
        <div className="flex items-center gap-6">
          <Spinner size="sm" label="Küçük yükleniyor" />
          <Spinner size="md" label="Orta yükleniyor" />
          <Spinner size="lg" label="Büyük yükleniyor" />
        </div>
      </Cell>
      <Cell label="Tonlar: primary · muted">
        <div className="flex items-center gap-6">
          <Spinner tone="primary" label="Vurgu tonunda yükleniyor" />
          <Spinner tone="muted" label="Sönük tonda yükleniyor" />
        </div>
      </Cell>
      <Cell label="current: düğmenin metin rengi">
        <Button variant="primary" disabled aria-busy="true">
          <Spinner size="sm" tone="current" label={null} />
          Kaydediliyor
        </Button>
      </Cell>
    </Gallery>
  ),
};
