import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { CardFan, type CardFanItem } from "@/components/ui/card-fan";

const CARDS: CardFanItem[] = [
  { title: "Okuma Listesi", meta: "12 Kayıt", badge: "Yeni", tone: "chart-2" },
  { title: "Gezi Planları", meta: "3 Aktif", tone: "chart-6" },
  { title: "Proje Fikirleri", meta: "4 Aktif", badge: "Taslak", tone: "primary" },
  { title: "Tarif Defteri", meta: "28 Kayıt", tone: "chart-4" },
  { title: "Bütçe", meta: "Kasım", badge: "₺", tone: "chart-5" },
];

const meta = {
  title: "Bileşenler/Tanıtım/Yelpaze Kartlar",
  id: "card-fan",
  component: CardFan,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "3-5 renkli kart üst üste eğik dizili; üzerine gelince (ince işaretçi) ya da odakta yelpaze açılır, gelinen kart öne çıkar. Bölüm başlığının yanında süs ya da özet. `interactive` ile kartlar buton olur: tek sekme durağı, ← / → ve Home / End ile gezinti, `onSelect`. Hareketi azaltanda açık ve durağan. Telefonda kart 7rem, taşmaz. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: { cards: CARDS, label: "Beş koleksiyon", spread: "md" },
} satisfies Meta<typeof CardFan>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img")).toHaveAccessibleName("Beş koleksiyon");
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};

export const WithHeading: Story = {
  name: "Bölüm Başlığının Yanında, Üç Kart",
  args: { cards: CARDS.slice(0, 3), spread: "sm", label: undefined },
  render: (args) => (
    <section className="flex w-[min(100vw-2rem,44rem)] flex-wrap items-center justify-between gap-6 rounded-xl bg-surface p-6">
      <div className="max-w-xs">
        <h2 className="text-heading font-semibold text-strong">Koleksiyonlar</h2>
        <p className="mt-2 text-base text-body">Okuduklarını, gezilerini ve fikirlerini ayrı panolarda topla.</p>
      </div>
      <CardFan {...args} />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Koleksiyonlar" })).toBeVisible();
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};

function Selectable(args: React.ComponentProps<typeof CardFan>) {
  const [selected, setSelected] = useState(2);
  return (
    <div className="grid justify-items-center gap-4">
      <CardFan
        {...args}
        selected={selected}
        onSelect={(i) => {
          setSelected(i);
          args.onSelect?.(i);
        }}
      />
      <p className="text-small text-muted" aria-live="polite">
        Seçili: {CARDS[selected]?.title}
      </p>
    </div>
  );
}

export const Interactive: Story = {
  name: "Seçilebilir, Klavyeyle",
  args: { interactive: true, label: "Koleksiyon seç", onSelect: fn() },
  render: (args) => <Selectable {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Koleksiyon seç" });
    await expect(group).toBeInTheDocument();
    await userEvent.tab();
    const middle = canvas.getByRole("button", { name: /Proje Fikirleri/ });
    await expect(middle).toHaveFocus();
    await expect(middle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{ArrowRight}");
    const next = canvas.getByRole("button", { name: /Tarif Defteri/ });
    await expect(next).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelect).toHaveBeenCalledWith(3);
    await expect(next).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("button", { name: /Okuma Listesi/ })).toHaveFocus();
  },
};
