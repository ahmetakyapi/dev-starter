import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Cell, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Temel/Tema Düğmesi",
  id: "theme-toggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Açık/koyu tema düğmesi. Tema `<html data-theme>` özniteliğinde yaşar; düğme onu dinler, kendi durumunu tutmaz, böylece sayfadaki iki düğme hep aynı şeyi gösterir. Seçim çerezde saklanır; hareketi azaltmayan kullanıcıda geçiş tıklanan noktadan açılan bir görünüm geçişiyle olur.",
      },
    },
  },
  argTypes: { initialTheme: { control: "inline-radio", options: ["light", "dark"] } },
  args: { initialTheme: "light" },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  /* Tıklar ve geri alır: hikâye bittiğinde tema araç çubuğundaki seçimde kalır. */
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    const label = button.getAttribute("aria-label");
    await userEvent.click(button);
    await waitFor(() => expect(button).not.toHaveAttribute("aria-label", label ?? ""));
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-label", label ?? ""));
  },
};

export const InHeaderBar: Story = {
  name: "Başlık Çubuğunda",
  render: (args) => (
    <header className="flex w-[min(100vw-2rem,48rem)] items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-3">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-strong">
        <span aria-hidden className="size-6 rounded-sm bg-brand" />
        Pusula
      </span>
      <nav aria-label="Ana menü" className="hidden gap-5 text-small font-medium text-body sm:flex">
        <a href="#ozellikler" className="hover:text-strong">Özellikler</a>
        <a href="#fiyatlar" className="hover:text-strong">Fiyatlar</a>
        <a href="#sss" className="hover:text-strong">SSS</a>
      </nav>
      <ThemeToggle {...args} />
    </header>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Gri Kuyuda">
        <ThemeToggle initialTheme="light" />
      </Cell>
      <Cell label="Beyaz Karoda" className="bg-overlay">
        <ThemeToggle initialTheme="light" />
      </Cell>
      <Cell label="Sayfa Zemininde" className="bg-page">
        <ThemeToggle initialTheme="light" />
      </Cell>
    </Gallery>
  ),
};
