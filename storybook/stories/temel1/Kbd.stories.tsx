import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Kbd, KbdCombo } from "@/components/ui/kbd";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Command K", action: "Komut paletini aç" },
  { keys: ["⌘", "B"], label: "Command B", action: "Kenar çubuğunu daralt" },
  { keys: ["⇧", "⌘", "E"], label: "Shift Command E", action: "Dışa aktar" },
  { keys: ["G", "P"], label: "G sonra P", action: "Panoya git" },
  { keys: ["Esc"], label: "Escape", action: "Katmanı kapat" },
] as const;

const meta = {
  title: "Bileşenler/Düğme ve İkon/Klavye Tuşu",
  id: "components-buttons-kbd",
  component: Kbd,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Klavye tuşu (`<kbd>`). Simgeli tuşlarda (⌘ ⇧ ⌥ ↵) `label` ver: ad görünmez metin olarak yazılır, simge gizlenir. Kısayolun tamamı için `KbdCombo` tek bir okunan ad taşır. Dokunmatikte kısayol anlamsızdır; ipuçlarını `pointer-fine:` ile gizlemek çoğu zaman doğru karar.",
      },
    },
  },
  args: { children: "K" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Symbolic: Story = {
  name: "Simgeli",
  args: { children: "⌘", label: "Command" },
};

export const KeyCombination: Story = {
  name: "Tuş Kombinasyonu",
  render: () => <KbdCombo keys={["⇧", "⌘", "P"]} label="Shift Command P" />,
};

export const InText: Story = {
  name: "Metin İçinde",
  render: () => (
    <Frame width="sm">
      <p className="text-base text-body">
        Her yerden aramak için <KbdCombo keys={["⌘", "K"]} label="Command K" /> tuşlarına basın; kapatmak için <Kbd>Esc</Kbd>.
      </p>
    </Frame>
  ),
};

export const ShortcutList: Story = {
  name: "Kısayol Listesi",
  render: () => (
    <Frame width="md">
      <dl className="divide-y divide-line-soft rounded-xl bg-overlay px-4 shadow-raised">
        {SHORTCUTS.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-base text-body">{row.action}</dt>
            <dd>
              <KbdCombo keys={row.keys} label={row.label} />
            </dd>
          </div>
        ))}
      </dl>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      <Cell label="Harf">
        <Kbd>K</Kbd>
      </Cell>
      <Cell label="Sözcük">
        <Kbd>Esc</Kbd>
      </Cell>
      <Cell label="Simge (adlı)">
        <div className="flex gap-1.5">
          <Kbd label="Command">⌘</Kbd>
          <Kbd label="Shift">⇧</Kbd>
          <Kbd label="Option">⌥</Kbd>
          <Kbd label="Enter">↵</Kbd>
        </div>
      </Cell>
      <Cell label="Oklar">
        <div className="flex gap-1.5">
          <Kbd label="Yukarı ok">↑</Kbd>
          <Kbd label="Aşağı ok">↓</Kbd>
        </div>
      </Cell>
    </Gallery>
  ),
};
