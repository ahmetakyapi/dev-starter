import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building2 } from "lucide-react";
import { expect, within } from "storybook/test";
import { DetailPanel, DetailSection } from "@/components/ui/detail-panel";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Money } from "@/components/ui/money";
import { Stamp } from "@/components/ui/stamp";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Veri/Ayrıntı Paneli",
  id: "detail-panel",
  component: DetailPanel,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Listenin yanında duran ana-ayrıntı yüzeyi: başlık (ikon, ad, alt satır, eylem) ve başlıklı bölümler (`DetailSection`: sayaç + \"Tümünü Gör\"). İçerik serbest: `key-value-list`, `factor-list`, `insight-callout`, `bar-list` buraya konur. Kayıt seçili değilse `emptyText`. Fixora mülk ve satıcı ekranlarından (yalnız yapı). Örnek kayıtlar KURGUDUR.",
      },
    },
  },
  args: { title: "Çınar Apartmanı", subtitle: "Atatürk Cad. 14, Çankaya", icon: <Building2 /> },
  render: (args) => (
    <Frame width="sm">
      <DetailPanel {...args}>
        <DetailSection title="Teklif" action={<a href="#teklif">Tümünü Gör</a>}>
          <div className="flex items-center justify-between py-2">
            <Money value={43370} currency="TRY" className="text-heading" />
            <Stamp tone="success" label="Onaylandı" date="27 Eylül" size="sm" slam={false} />
          </div>
        </DetailSection>
        <DetailSection title="Açık İş Emirleri" count={14}>
          <KeyValueList
            items={[
              { label: "Kazan basınç kaybı", value: "Sürüyor" },
              { label: "3C'de radyatör soğuk", value: "Yeni" },
              { label: "Yangın kapısı, 2. kat", value: "Planlandı" },
            ]}
          />
        </DetailSection>
      </DetailPanel>
    </Frame>
  ),
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("complementary", { name: "Çınar Apartmanı" })).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: /Açık İş Emirleri/ })).toHaveTextContent("14");
    await expect(canvas.getByText("ONAYLANDI")).toBeInTheDocument();
  },
};

export const NoSelection: Story = {
  name: "Kayıt Seçili Değil",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="sm">
      <DetailPanel title="Ayrıntı" emptyText="Ayrıntı için listeden bir kayıt seç." />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Ayrıntı için listeden bir kayıt seç.")).toBeInTheDocument();
  },
};
