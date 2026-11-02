import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const FAQ = [
  { q: "Kargo Ne Kadar Sürer?", a: "Standart gönderim 2-4 iş günü sürer; hızlı kargo ertesi gün kapında." },
  { q: "İade Nasıl Yapılır?", a: "Teslimden sonraki 14 gün içinde Siparişlerim sayfasından iade talebi aç." },
  { q: "Fatura Bilgimi Değiştirebilir miyim?", a: "Sipariş kargoya verilmeden önce Hesabım › Fatura Bilgileri'nden güncelleyebilirsin." },
];

function Items({ exclusive, openFirst = true }: { exclusive?: string; openFirst?: boolean }) {
  return FAQ.map((item, i) => (
    <AccordionItem key={item.q} title={item.q} exclusive={exclusive} defaultOpen={openFirst && i === 0}>
      {item.a}
    </AccordionItem>
  ));
}

const meta = {
  title: "Bileşenler/Gezinme/Açılır Bölümler",
  id: "accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Yerel `<details>`/`<summary>`: JavaScript'siz açılır, Ctrl+F kapalı içeriği bulur, ekran okuyucu \"genişletilmiş\" der. `exclusive` aynı gruptan yalnızca birini açık tutar. Açılan içerik bastığın yerde aşağı uzar; okuyucu metnin sonuna fırlatılmaz.",
      },
    },
  },
  args: { variant: "line", children: <Items exclusive="sss" /> },
  argTypes: { variant: { control: "inline-radio", options: ["line", "well"] }, children: { control: false } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="md">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvas.getByText("İade Nasıl Yapılır?");
    const details = summary.closest("details")!;
    await expect(details).not.toHaveAttribute("open");
    await userEvent.click(summary);
    await expect(details).toHaveAttribute("open");
    // `exclusive`: ilk soru kendiliğinden kapanır.
    await expect(canvas.getByText("Kargo Ne Kadar Sürer?").closest("details")).not.toHaveAttribute("open");
  },
};

export const Well: Story = { name: "Kuyu", args: { variant: "well" } };

export const AllCollapsed: Story = { name: "Hepsi Kapalı", args: { children: <Items openFirst={false} /> } };

export const IndependentItems: Story = {
  name: "Bağımsız Açılır",
  args: { children: <Items /> },
  parameters: { docs: { description: { story: "`exclusive` verilmediğinde birden çok soru aynı anda açık kalabilir." } } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="line (Varsayılan)" className="place-items-stretch">
        <Accordion>
          <Items exclusive="g1" />
        </Accordion>
      </Cell>
      <Cell label="well: Her Soru Beyaz Karo" className="place-items-stretch">
        <Accordion variant="well" className="bg-transparent p-0">
          <Items exclusive="g2" />
        </Accordion>
      </Cell>
    </Gallery>
  ),
};
