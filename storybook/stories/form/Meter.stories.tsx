import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Meter, SegmentedMeter } from "@/components/ui/meter";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

const GB = (n: number) => `${n.toLocaleString("tr-TR")} GB`;

const meta = {
  title: "Bileşenler/Geri Bildirim/Ölçer",
  id: "meter",
  component: Meter,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bilinen bir aralıkta doluluk (depolama, kota, koltuk, şifre gücü); bir işin ilerlemesi için İlerleme kullanın. Oran %75 ve %90 eşiklerini geçince ton değişir ve yanına durum metni gelir; yüksek değerin iyi olduğu ölçekte `inverted`. Doluluğun neyden oluştuğunu göstermek için SegmentedMeter.",
      },
    },
  },
  args: {
    label: "Depolama",
    value: 38.4,
    min: 0,
    max: 50,
    valueText: "38,4 GB / 50 GB",
    inverted: false,
    hint: "Takım planında 50 GB.",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 50, step: 0.1 } },
  },
  render: (args) => (
    <Frame width="md">
      <Meter {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
};

export const Thresholds: Story = {
  name: "Eşikler",
  render: () => (
    <Frame width="md">
      <div className="grid gap-6">
        <Meter label="API Kotası" value={4100} max={10000} valueText="4.100 / 10.000" />
        <Meter label="Depolama" value={39} max={50} valueText="39 GB / 50 GB" />
        <Meter
          label="Ekip Koltukları"
          value={9.5}
          max={10}
          valueText="9 / 10"
          statusText={{ warn: "Az Koltuk Kaldı", danger: "Bir Koltuk Kaldı" }}
        />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Az Yer Kaldı")).toBeInTheDocument();
    await expect(canvas.getByRole("meter", { name: "Ekip Koltukları" })).toHaveAttribute("aria-valuetext", "9 / 10, Bir Koltuk Kaldı");
  },
};

export const Segmented: Story = {
  name: "Bölümlü",
  render: () => (
    <Frame width="md">
      <SegmentedMeter
        label="Kullanım Dağılımı"
        max={50}
        format={GB}
        segments={[
          { label: "Belgeler", value: 14.2, series: 2 },
          { label: "Görseller", value: 17.6, series: 3 },
          { label: "Yedek", value: 6.6, series: 1 },
        ]}
      />
    </Frame>
  ),
};

export const SegmentedLarge: Story = {
  name: "Bölümlü · Büyük",
  render: () => (
    <Frame width="md">
      <div className="rounded-xl bg-overlay p-5 shadow-raised">
        <SegmentedMeter
          size="lg"
          label="Dosya Alanı"
          max={50}
          format={GB}
          segments={[
            { label: "Belgeler", value: 14.2, series: 2 },
            { label: "Görseller", value: 17.6, series: 3 },
            { label: "Yedek", value: 6.6, series: 1 },
          ]}
        />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("meter", { name: "Dosya Alanı" })).toHaveAttribute("aria-valuetext", "38,4 GB / 50 GB");
    // Lejant hapına odak: o bölümün değeri başlığa çıkar (yalnız görsel).
    await userEvent.tab();
    await expect(canvas.getByText("Belgeler", { selector: "p span" })).toBeVisible();
  },
};

export const SegmentedAlmostFull: Story = {
  name: "Bölümlü · Dolmak Üzere",
  render: () => (
    <Frame width="md">
      <div className="rounded-xl bg-overlay p-5 shadow-raised">
        <SegmentedMeter
          size="lg"
          label="Dosya Alanı"
          max={50}
          format={GB}
          segments={[
            { label: "Belgeler", value: 21.4, series: 2 },
            { label: "Görseller", value: 19.8, series: 3 },
            { label: "Yedek", value: 5.3, series: 1 },
          ]}
        />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Az Yer Kaldı")).toBeVisible();
    await expect(canvas.getByRole("meter")).toHaveAttribute("aria-valuetext", "46,5 GB / 50 GB, Az Yer Kaldı");
  },
};

export const Inverted: Story = {
  name: "Ters Ölçek",
  render: () => (
    <Frame width="md">
      <div className="grid gap-6">
        <Meter
          label="Şifre Gücü"
          value={1}
          max={10}
          valueText="Zayıf"
          inverted
          statusText={{ warn: "Biraz Daha Uzat", danger: "Çok Kolay Tahmin Edilir" }}
          hint="En az 12 karakter, bir rakam ve bir sembol."
        />
        <Meter
          label="Şifre Gücü"
          value={9}
          max={10}
          valueText="Güçlü"
          inverted
          statusText={{ warn: "Biraz Daha Uzat", danger: "Çok Kolay Tahmin Edilir" }}
        />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Normal">
        <Meter label="API Kotası" value={4100} max={10000} valueText="4.100 / 10.000" className="w-full" />
      </Cell>
      <Cell label="Uyarı Eşiği (%75)">
        <Meter label="Depolama" value={39} max={50} valueText="39 GB / 50 GB" className="w-full" />
      </Cell>
      <Cell label="Hata Eşiği (%90)">
        <Meter label="Posta Kutusu" value={14.6} max={15} valueText="14,6 GB / 15 GB" statusText={{ warn: "Az Yer Kaldı", danger: "Kota Doldu" }} className="w-full" />
      </Cell>
      <Cell label="Yüzde (Değer Metni Yok)">
        <Meter label="Bellek" value={58} className="w-full" />
      </Cell>
      <Cell label="Ters Ölçek">
        <Meter label="Şifre Gücü" value={2} max={10} valueText="Zayıf" inverted statusText={{ warn: "Biraz Daha Uzat", danger: "Çok Kolay" }} className="w-full" />
      </Cell>
      <Cell label="Bölümlü">
        <SegmentedMeter
          label="Kullanım Dağılımı"
          max={50}
          format={GB}
          className="w-full"
          segments={[
            { label: "Belgeler", value: 14.2, series: 2 },
            { label: "Görseller", value: 17.6, series: 3 },
            { label: "Yedek", value: 6.6, series: 1 },
          ]}
        />
      </Cell>
    </Gallery>
  ),
};
