import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoadingMark } from "@/components/ui/loading-mark";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yükleme/Marka Halkası",
  component: LoadingMark,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfa ya da kart düzeyinde bekleme: dönen halkanın ortasında marka karosu. Yüzde göstermez; ne kadar kaldığını bilmediğimiz bir şeyi ilerleme gibi çizmek veri dürüstlüğüyle çelişir. Hareketi azaltan kullanıcıda halka sabit çeyrek yay olarak durur.",
      },
    },
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  args: { size: "md", label: "Pano hazırlanıyor", showLabel: true, children: "P" },
} satisfies Meta<typeof LoadingMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const AltYazisiz: Story = {
  name: "Alt Yazısız",
  args: { showLabel: false, label: "Yükleniyor", children: undefined },
};

export const KartIcinde: Story = {
  name: "Kart İçinde",
  render: (args) => (
    <Frame width="md">
      <section aria-busy="true" className="grid min-h-64 place-items-center rounded-xl bg-overlay p-6 shadow-raised">
        <LoadingMark {...args} size="lg" label="Rapor hesaplanıyor" />
      </section>
    </Frame>
  ),
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="sm · 32 piksel">
        <LoadingMark size="sm" label="Küçük yükleniyor" />
      </Cell>
      <Cell label="md · 48 piksel, alt yazılı">
        <LoadingMark size="md" label="Kayıtlar getiriliyor" showLabel>
          A
        </LoadingMark>
      </Cell>
      <Cell label="lg · 72 piksel, baş harfli">
        <LoadingMark size="lg" label="Pano hazırlanıyor" showLabel>
          P
        </LoadingMark>
      </Cell>
    </Gallery>
  ),
};
