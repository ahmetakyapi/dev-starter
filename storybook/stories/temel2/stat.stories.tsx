import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkline } from "@/components/ui/sparkline";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Veri/Ölçü",
  component: Stat,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Etiket + değer + değişim; board dilinde gri kuyunun içindeki beyaz karoda durur; her `Stat` bir `dt`/`dd` çifti olduğu için daima `StatGrid` (`dl`) içinde kullanılır. Değişim işaret, ok ve renkle söylenir; artışın kötü haber olduğu ölçülerde (gider, gecikme) `positiveIsGood={false}` yalnızca rengi çevirir.",
      },
    },
  },
  args: {
    label: "Aylık Gelir",
    value: "₺1.240.000",
    change: 8.4,
    changeLabel: "geçen aya göre",
    positiveIsGood: true,
    digits: 1,
    size: "md",
  },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Story />
        </StatGrid>
      </Frame>
    ),
  ],
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const Artis: Story = { name: "Artış", args: { label: "Yeni Üye", value: "1.284", change: 12.6 } };

export const Dusus: Story = { name: "Düşüş", args: { label: "Dönüşüm Oranı", value: "%3,2", change: -0.8, changeLabel: "geçen haftaya göre" } };

export const Degisimsiz: Story = { name: "Değişimsiz", args: { label: "Aktif Abone", value: "4.910", change: 0.02 } };

export const ArtisKotu: Story = {
  name: "Artış Kötü (positiveIsGood=false)",
  args: { label: "Ortalama Gecikme", value: "412", unit: "ms", change: 18.3, positiveIsGood: false, changeLabel: "dünden" },
};

export const DususIyi: Story = {
  name: "Düşüş İyi (positiveIsGood=false)",
  args: { label: "Aylık Gider", value: "₺318.400", change: -6.1, positiveIsGood: false },
};

export const DegisimYok: Story = { name: "Değişim Bilgisi Yok", args: { change: null, changeLabel: undefined } };

export const Buyuk: Story = { name: "Büyük", args: { size: "lg", label: "Toplam Ciro", value: "₺8,4", unit: "milyon" } };

export const IzgaraVeEgri: Story = {
  name: "Ölçü Izgarası",
  parameters: { bare: true },
  decorators: [
    (Story) => (
      <Frame width="xl">
        <Story />
      </Frame>
    ),
  ],
  render: () => (
    <StatGrid className="rounded-xl bg-overlay p-5 shadow-raised">
      <Stat label="Haftalık Ciro" value="₺84.120" change={6.4} changeLabel="geçen haftaya göre" />
      <Stat label="Sipariş" value="1.128" change={-2.3} changeLabel="geçen haftaya göre" />
      <Stat label="İade Oranı" value="%1,9" change={-0.4} positiveIsGood={false} changeLabel="geçen haftaya göre" />
      <Stat label="Sepet Ortalaması" value="₺746" change={0} changeLabel="geçen haftaya göre" />
    </StatGrid>
  ),
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Artış, iyi">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Stat label="Yeni Üye" value="1.284" change={12.6} changeLabel="geçen aya göre" />
        </StatGrid>
      </Cell>
      <Cell label="Düşüş, kötü">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Stat label="Dönüşüm Oranı" value="%3,2" change={-0.8} changeLabel="geçen haftaya göre" />
        </StatGrid>
      </Cell>
      <Cell label="Değişimsiz">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Stat label="Aktif Abone" value="4.910" change={0} changeLabel="geçen aya göre" />
        </StatGrid>
      </Cell>
      <Cell label="Artış, kötü (positiveIsGood=false)">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Stat label="Ortalama Gecikme" value="412" unit="ms" change={18.3} positiveIsGood={false} changeLabel="dünden" />
        </StatGrid>
      </Cell>
      <Cell label="Büyük boy">
        <StatGrid className="grid-cols-1 rounded-xl bg-overlay p-5 shadow-raised sm:grid-cols-1">
          <Stat size="lg" label="Toplam Ciro" value="₺8,4" unit="milyon" change={4.2} />
        </StatGrid>
      </Cell>
      <Cell label="Mini eğriyle">
        <div className="flex w-full items-end justify-between gap-4 rounded-xl bg-overlay p-5 shadow-raised">
          <StatGrid className="grid-cols-1 sm:grid-cols-1">
            <Stat label="Haftalık Ciro" value="₺84.120" change={6.4} />
          </StatGrid>
          <Sparkline title="Son 12 Hafta Ciro" values={[42, 48, 45, 52, 58, 55, 61, 66, 63, 70, 74, 79]} />
        </div>
      </Cell>
    </Gallery>
  ),
};
