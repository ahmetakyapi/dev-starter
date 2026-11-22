import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Stamp } from "@/components/ui/stamp";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Geri Bildirim/Damga",
  id: "stamp",
  component: Stamp,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir kaydın KARAR anı: hafif eğik, çift çerçeveli kâğıt damgası (Onaylandı, Reddedildi, Ödendi). Bilgi damganın metninde; eğim ve renk süs. Açılışta kısa bir \"vurma\" animasyonu (260 ms, tek sefer); hareketi azaltan kullanıcıda yok. Liste satırları için `badge`, damga tek kaydın ayrıntı ekranında. Brick proje kartından (yalnız yapı).",
      },
    },
  },
  args: { label: "Teklif Onaylandı", date: "27 Eylül 2026", tone: "success", rotate: -4, size: "md", slam: true },
  argTypes: {
    tone: { control: "inline-radio", options: ["success", "danger", "warning", "primary", "neutral"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    rotate: { control: { type: "range", min: -8, max: 8, step: 1 } },
  },
  render: (args) => (
    <Frame width="sm">
      <div className="grid place-items-center py-6">
        <Stamp {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Stamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Türkçe büyük harf: "Teklif Onaylandı" → "TEKLİF ONAYLANDI".
    await expect(canvas.getByText("TEKLİF ONAYLANDI")).toBeInTheDocument();
    await expect(canvas.getByText("27 Eylül 2026")).toBeInTheDocument();
  },
};

export const Tones: Story = {
  name: "Tonlar",
  render: () => (
    <Gallery cols={3}>
      <Cell label="success"><Stamp tone="success" label="Ödendi" date="3 Kasım" slam={false} /></Cell>
      <Cell label="danger"><Stamp tone="danger" label="İptal Edildi" date="9 Kasım" rotate={3} slam={false} /></Cell>
      <Cell label="warning"><Stamp tone="warning" label="Bekliyor" slam={false} /></Cell>
      <Cell label="primary"><Stamp tone="primary" label="İncelemede" slam={false} /></Cell>
      <Cell label="neutral"><Stamp tone="neutral" label="Taslak" slam={false} /></Cell>
      <Cell label="sm"><Stamp tone="success" label="Onaylandı" size="sm" slam={false} /></Cell>
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("İPTAL EDİLDİ")).toBeInTheDocument();
  },
};
