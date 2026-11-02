import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CopyButton } from "@/components/ui/copy-button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Pano iframe'de çoğu zaman izinsiz: hikâyeler sonucu bilinen bir taklitle sınar. */
function mockClipboard(ok: boolean) {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: () => (ok ? Promise.resolve() : Promise.reject(new Error("İzin yok"))) },
  });
  return () => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else Reflect.deleteProperty(navigator, "clipboard");
  };
}

const LINK = "https://pano.acme.com.tr/davet/7KQ2-M4XD";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Kopyala Düğmesi",
  id: "copy-button",
  component: CopyButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Panoya kopyalar ve sonucu iki yoldan söyler: ikon değişir, görünmez canlı bölge “Kopyalandı” der. Pano izni yoksa sessizce başarılı görünmez, “Kopyalanamadı” der. `children` verilirse metinli düğme, verilmezse 44 piksellik ikon düğme.",
      },
    },
  },
  beforeEach: () => mockClipboard(true),
  args: { value: LINK, label: "Davet Bağlantısını Kopyala" },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan (İkon)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Davet Bağlantısını Kopyala" }));
    await expect(await canvas.findByRole("status")).toHaveTextContent("Kopyalandı");
  },
};

export const WithText: Story = {
  name: "Metinli",
  args: { children: "Bağlantıyı Kopyala" },
};

export const CopyFailed: Story = {
  name: "Kopyalanamadı",
  args: { children: "Bağlantıyı Kopyala" },
  beforeEach: () => mockClipboard(false),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Bağlantıyı Kopyala" }));
    await expect(await canvas.findByRole("status")).toHaveTextContent("Kopyalanamadı");
  },
};

export const InField: Story = {
  name: "API Anahtarı Satırında",
  render: (args) => (
    <Frame width="md">
      <p className="mb-2 text-small font-semibold text-strong">API Anahtarı</p>
      <div className="flex items-center gap-2 rounded-md border border-line bg-overlay py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-small text-body">sk_canli_4f9b2c7e1a8d</code>
        <CopyButton {...args} value="sk_canli_4f9b2c7e1a8d" label="API Anahtarını Kopyala" />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="İkon · Boşta">
        <CopyButton value={LINK} label="Bağlantıyı Kopyala" />
      </Cell>
      <Cell label="Metinli · Boşta">
        <CopyButton value={LINK} label="Kopyala">
          Bağlantıyı Kopyala
        </CopyButton>
      </Cell>
      <Cell label="Komut Satırında">
        <div className="flex items-center gap-2 rounded-md bg-surface-sunken py-1 pr-1 pl-3">
          <code className="font-mono text-small text-body">npm i @base-ui/react</code>
          <CopyButton value="npm i @base-ui/react" label="Komutu Kopyala" />
        </div>
      </Cell>
    </Gallery>
  ),
};
