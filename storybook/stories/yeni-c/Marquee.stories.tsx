import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bean, Coffee, Flame, Package, Store, Truck } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { Marquee } from "@/components/ui/marquee";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const LOGOS = [
  { name: "Nehir Butik", Glyph: Package },
  { name: "Liman Kavurma", Glyph: Flame },
  { name: "Ege Süt", Glyph: Coffee },
  { name: "Atlas Lojistik", Glyph: Truck },
  { name: "Çarşı Pazarı", Glyph: Store },
  { name: "Yirgacheffe Kooperatifi", Glyph: Bean },
] as const;

const items = LOGOS.map(({ name, Glyph }) => (
  <span key={name} className="inline-flex items-center gap-2 text-base font-semibold text-body">
    <Glyph aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
    {name}
  </span>
));

const meta = {
  title: "Bileşenler/Gezinme/Kayan Şerit",
  id: "marquee",
  component: Marquee,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Müşteri logoları, entegrasyonlar, kısa alıntılar. Sayfada tek şerit. Üzerine gelmek ve odaklanmak bekletir; görünür “Şeridi Durdur” düğmesi WCAG 2.2.2 için varsayılan açık (klavye ve dokunmatiğin tek yolu). Döngü için ikinci kopya `aria-hidden` + `inert`: liste bir kez okunur, bağlantılar Tab sırasına bir kez girer. Hareketi azaltanda durağan, sarılan bir sıra.",
      },
    },
  },
  args: { label: "Müşterilerimiz", children: items },
  render: (args) => (
    <Frame width="xl">
      <Marquee {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Gerçek liste bir kez okunur; kopya erişilebilirlik ağacında yok.
    await expect(canvas.getAllByRole("list", { name: "Müşterilerimiz" })).toHaveLength(1);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(LOGOS.length);
    const toggle = canvas.getByRole("button", { name: "Şeridi Durdur" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(canvasElement.querySelector(".ui-marquee")).toHaveAttribute("data-paused");
  },
};

export const Reverse: Story = {
  name: "Ters Yön",
  args: { reverse: true, duration: 30 },
};

export const WithoutControl: Story = {
  name: "Düğmesiz (Kısa Şerit)",
  args: { control: false, duration: 4 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Logolar · Sağdan Sola">
        <Marquee label="Müşteriler">{items}</Marquee>
      </Cell>
      <Cell label="Rozetler · Soldan Sağa">
        <Marquee label="Entegrasyonlar" reverse gap={0.75} duration={28}>
          {["Slack", "Gmail", "Trendyol", "Paraşüt", "Shopify", "Yurtiçi Kargo", "Google Takvim"].map((name) => (
            <span key={name} className="inline-flex rounded-full bg-overlay px-3 py-1.5 text-small font-semibold text-strong shadow-raised">
              {name}
            </span>
          ))}
        </Marquee>
      </Cell>
    </Gallery>
  ),
};
