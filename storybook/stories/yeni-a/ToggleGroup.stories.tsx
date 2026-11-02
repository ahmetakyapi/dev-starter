import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  LayoutGrid,
  List,
  Strikethrough,
  Underline,
} from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { ToggleGroup, type ToggleGroupItem } from "@/components/ui/toggle-group";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_settle";

type Format = "bold" | "italic" | "underline" | "strike";
const FORMAT: ToggleGroupItem<Format>[] = [
  { value: "bold", label: "Kalın", icon: Bold, iconOnly: true, shortcut: ["⌘", "B"], keyshortcuts: "Meta+B Control+B" },
  { value: "italic", label: "İtalik", icon: Italic, iconOnly: true, shortcut: ["⌘", "I"], keyshortcuts: "Meta+I Control+I" },
  { value: "underline", label: "Altı Çizili", icon: Underline, iconOnly: true, shortcut: ["⌘", "U"], keyshortcuts: "Meta+U Control+U" },
  { value: "strike", label: "Üstü Çizili", icon: Strikethrough, iconOnly: true },
];

const ALIGN: ToggleGroupItem<"left" | "center" | "right">[] = [
  { value: "left", label: "Sola Hizala", icon: AlignLeft, iconOnly: true },
  { value: "center", label: "Ortala", icon: AlignCenter, iconOnly: true },
  { value: "right", label: "Sağa Hizala", icon: AlignRight, iconOnly: true },
];

const VIEW: ToggleGroupItem<"grid" | "list">[] = [
  { value: "grid", label: "Izgara", icon: LayoutGrid },
  { value: "list", label: "Liste", icon: List },
];

const FILTERS: ToggleGroupItem<"unread" | "mention" | "assigned">[] = [
  { value: "unread", label: "Okunmamış" },
  { value: "mention", label: "Bahsedilen" },
  { value: "assigned", label: "Bana Atanan", disabled: true },
];

const meta = {
  title: "Bileşenler/Düğme ve İkon/Aç-Kapa Grubu",
  id: "toggle-group",
  component: ToggleGroup<Format>,
  tags: ["autodocs"],
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Basılı / basılı değil düğmeler (`aria-pressed`): araç çubuğunda Kalın · İtalik, görünümde Izgara · Liste. `multiple` ile birden çoğu basılı; tekli kipte basılı düğmeye yeniden basmak onu bırakır. Hep biri seçili olmalıysa segmented-control. Yalnız ikonlu öğenin adı tipte zorunlu ve tooltip'te görünür.",
      },
    },
  },
  args: {
    "aria-label": "Metin Biçimi",
    items: FORMAT,
    multiple: true,
    defaultValue: ["bold"],
    size: "md",
    variant: "well",
    orientation: "horizontal",
    disabled: false,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["well", "ghost"] },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    items: { control: false },
  },
  render: (args) => (
    <Frame width="sm">
      <div className="flex justify-center">
        <ToggleGroup {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof ToggleGroup<Format>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Kalın" });
    const italic = canvas.getByRole("button", { name: "İtalik" });
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(italic);
    await expect(italic).toHaveAttribute("aria-pressed", "true");
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    // Oklar düğmeler arasında dolaşır.
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Altı Çizili" })).toHaveFocus();
  },
};

export const Single: Story = {
  name: "Tekli Seçim",
  render: () => (
    <Frame width="sm">
      <div className="flex justify-center">
        <ToggleGroup aria-label="Hizalama" items={ALIGN} defaultValue={["left"]} />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Ortala" }));
    await expect(canvas.getByRole("button", { name: "Ortala" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "Sola Hizala" })).toHaveAttribute("aria-pressed", "false");
  },
};

export const WithLabels: Story = {
  name: "Metinli",
  render: () => (
    <Frame width="sm">
      <div className="flex justify-center">
        <ToggleGroup aria-label="Görünüm" items={VIEW} defaultValue={["grid"]} />
      </div>
    </Frame>
  ),
};

export const Toolbar: Story = {
  name: "Araç Çubuğunda",
  render: () => (
    <Frame width="md">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-overlay p-1.5 shadow-raised">
        <ToggleGroup aria-label="Metin Biçimi" items={FORMAT} multiple defaultValue={["bold", "underline"]} variant="ghost" size="sm" />
        <span aria-hidden className="h-6 w-px bg-line" />
        <ToggleGroup aria-label="Hizalama" items={ALIGN} defaultValue={["left"]} variant="ghost" size="sm" />
      </div>
    </Frame>
  ),
};

export const Disabled: Story = {
  name: "Devre Dışı Öğe",
  render: () => (
    <Frame width="sm">
      <div className="flex justify-center">
        <ToggleGroup aria-label="Bildirim Süzgeci" items={FILTERS} multiple defaultValue={["unread"]} />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Kuyu, çoklu, ikon">
        <ToggleGroup aria-label="Metin Biçimi" items={FORMAT} multiple defaultValue={["bold", "italic"]} />
      </Cell>
      <Cell label="Kuyu, tekli, ikon">
        <ToggleGroup aria-label="Hizalama" items={ALIGN} defaultValue={["center"]} />
      </Cell>
      <Cell label="Kuyu, ikon + metin">
        <ToggleGroup aria-label="Görünüm" items={VIEW} defaultValue={["list"]} />
      </Cell>
      <Cell label="Hayalet, küçük">
        <ToggleGroup aria-label="Metin Biçimi" items={FORMAT} multiple defaultValue={["underline"]} variant="ghost" size="sm" />
      </Cell>
      <Cell label="Yalnız metin, devre dışı öğe">
        <ToggleGroup aria-label="Bildirim Süzgeci" items={FILTERS} multiple defaultValue={["mention"]} />
      </Cell>
      <Cell label="Dikey">
        <ToggleGroup aria-label="Hizalama" items={ALIGN} defaultValue={["right"]} orientation="vertical" />
      </Cell>
    </Gallery>
  ),
};
