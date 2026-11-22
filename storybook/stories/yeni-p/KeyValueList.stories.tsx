import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { CopyButton } from "@/components/ui/copy-button";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const ITEMS = [
  { label: "Kaynak", value: "Facebook Reklamı" },
  { label: "Oluşturan", value: "Evan Howard · 14 Mart 2021" },
  { label: "Sipariş No", value: "INV-3105", mono: true, action: <CopyButton value="INV-3105" label="Sipariş numarasını kopyala" /> },
  { label: "Bakiye", value: "6.432,00 ₺", tone: "danger" as const, hint: "17 gün gecikmiş" },
];

const meta = {
  title: "Bileşenler/Veri/Anahtar Değer Listesi",
  id: "key-value-list",
  component: KeyValueList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir kaydın alanları: etiket solda, değer sağda, saç çizgili satırlar. `factor-list`ten farkı nötr olması (önem sinyali yok) ve satır sonu eylem yuvası (kopyala, düzenle) ile değer tonları. Dar yan panelde `layout=\"stacked\"` etiketi üste alır. `dl > div > dt + dd`. Noticeline ve Brick ekranlarından (yalnız yapı).",
      },
    },
  },
  args: { title: "Hesap", items: ITEMS },
  argTypes: { layout: { control: "inline-radio", options: ["split", "stacked"] }, items: { control: false } },
  render: (args) => (
    <Frame width="sm">
      <KeyValueList {...args} />
    </Frame>
  ),
} satisfies Meta<typeof KeyValueList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Hesap" })).toBeInTheDocument();
    await expect(canvas.getByText("Facebook Reklamı")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Sipariş numarasını kopyala" })).toBeInTheDocument();
  },
};

export const Layouts: Story = {
  name: "Yan Yana ve Üst Üste",
  render: () => (
    <Gallery cols={2}>
      <Cell label="split (varsayılan)">
        <KeyValueList items={ITEMS} className="w-full max-w-xs" />
      </Cell>
      <Cell label="stacked (dar yan panel)">
        <KeyValueList layout="stacked" items={[{ label: "Teslimat Adresi", value: "Atatürk Cad. 12, Çankaya, Ankara" }, ...ITEMS.slice(0, 2)]} className="w-full max-w-xs" />
      </Cell>
    </Gallery>
  ),
};

export const Empty: Story = {
  name: "Boş Liste",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="sm">
      <div data-testid="kv-empty">
        <KeyValueList title="Alanlar" items={[]} />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId("kv-empty")).toBeEmptyDOMElement();
  },
};
