import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, within } from "storybook/test";
import { CompareSlider } from "@/components/ui/compare-slider";
import { Cell, Frame, Gallery } from "../_lib/Frame";

function Draft({ tone, text }: { tone: "old" | "new"; text: string }) {
  return (
    <div className={tone === "old" ? "bg-surface-sunken p-5 pt-14" : "bg-overlay p-5 pt-14"}>
      <p className="text-small text-muted">Konu: Siparişiniz hakkında</p>
      <p className="mt-2 text-read text-strong">{text}</p>
    </div>
  );
}

const OLD = "Sayın müşterimiz, siparişiniz kargoya verilmiştir. Gecikme için özür dileriz.";
const NEW = "Merhaba Seda, SP-2041 numaralı siparişiniz aktarma merkezinde iki gündür bekliyor. Yarın dağıtıma çıkacak; takip bağlantısını akşam ileteceğim.";

function Tiles({ cols }: { cols: number }) {
  return (
    <div className="grid gap-2 bg-surface p-5 pt-14" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols * 2 }, (_, i) => (
        <div key={i} className="h-16 rounded-md bg-overlay shadow-raised" />
      ))}
    </div>
  );
}

const meta = {
  title: "Bileşenler/Veri/Karşılaştırma",
  id: "compare-slider",
  component: CompareSlider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Önce / sonra: iki katman üst üste, aradaki çizgi sürüklenir. Görsel, metin taslağı, tasarım varyantı. Denetim kabı kaplayan yerel `<input type=\"range\">`: oklar, Home/End, dokunma ve ekran okuyucu ondan; değer metni iki tarafı da söyler. Kırpma `clip-path` ile, içerik yeniden düzenlenmez. Dikey kaydırma (`pan-y`) sayfada kalır.",
      },
    },
  },
  args: {
    before: <Draft tone="old" text={OLD} />,
    after: <Draft tone="new" text={NEW} />,
    beforeLabel: "Şablon",
    afterLabel: "Asistan",
    label: "Yanıt taslağı",
  },
  render: (args) => (
    <Frame width="lg">
      <CompareSlider {...args} />
    </Frame>
  ),
} satisfies Meta<typeof CompareSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Metin Taslağı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Yanıt taslağı" });
    await expect(slider).toHaveAttribute("aria-valuetext", "Şablon %50, Asistan %50");
    // userEvent.keyboard yerel range girdisinin değerini sentetik tuşla
    // değiştirmez (tarayıcı varsayılan eylemi sentetik olayda çalışmaz);
    // değer değişimi `change` olayıyla tetiklenir.
    fireEvent.change(slider, { target: { value: "52" } });
    await expect(slider).toHaveValue("52");
    fireEvent.change(slider, { target: { value: "100" } });
    await expect(slider).toHaveAttribute("aria-valuetext", "Şablon %100, Asistan %0"); // slop-ok: kaydırıcının End tuşundaki uç değeri, veri değil
  },
};

export const StartPosition: Story = {
  name: "Başlangıç Konumu",
  args: { defaultValue: 25 },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole("slider");
    fireEvent.change(slider, { target: { value: "70" } });
    await expect(slider).toHaveValue("70");
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Metin · Şablon ve Asistan">
        <CompareSlider label="Taslak" beforeLabel="Şablon" afterLabel="Asistan" before={<Draft tone="old" text={OLD} />} after={<Draft tone="new" text={NEW} />} className="w-full" />
      </Cell>
      <Cell label="Düzen · Üç ve Dört Sütun">
        <CompareSlider label="Pano düzeni" beforeLabel="Üç Sütun" afterLabel="Dört Sütun" defaultValue={60} before={<Tiles cols={3} />} after={<Tiles cols={4} />} className="w-full" />
      </Cell>
    </Gallery>
  ),
};
