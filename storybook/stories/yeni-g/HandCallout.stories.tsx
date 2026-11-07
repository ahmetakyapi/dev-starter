import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HandCallout } from "@/components/ui/hand-callout";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Tanıtım/El Yazısı Not",
  id: "hand-callout",
  component: HandCallout,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kenarda duran el yazısı not ve çizilerek gelen ok; arayüzün bir noktasını gösterir (canlı demoda ilk dokunulacak yer). `mark-annotate` metnin üstüne çizer, bu metnin dışında durur. Yazı tipi `--font-hand-face` (fonts.ts → `handFont`, Caveat). Varsayılan süs; `onClick` ile düğme olur.",
      },
    },
  },
  args: { children: "buradan başla", direction: "down-right" },
  render: (args) => (
    <Frame width="lg">
      <div className="relative flex w-full flex-col items-end gap-1">
        <HandCallout {...args} />
        <span className="rounded-full bg-cta px-4 py-2 text-small font-medium text-on-brand shadow-cta">Şeridi Aç</span>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof HandCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Directions: Story = {
  name: "Yönler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      {(["down-right", "down-left", "up-right", "up-left"] as const).map((d) => (
        <Cell key={d} label={d}>
          <HandCallout direction={d}>şuraya bak</HandCallout>
        </Cell>
      ))}
    </Gallery>
  ),
};

export const AsButton: Story = {
  name: "Düğme Olarak",
  render: () => (
    <Frame>
      <HandCallout onClick={() => {}}>demoyu aç</HandCallout>
    </Frame>
  ),
};
