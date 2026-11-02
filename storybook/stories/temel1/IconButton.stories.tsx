import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bold, Italic, Link2, MoreHorizontal, Pencil, Settings, Share2, Trash2, Underline } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { IconButton } from "@/components/ui/icon-button";
import { Cell, Gallery } from "../_lib/Frame";

const GLYPHS = { Settings, Pencil, Share2, Trash2, MoreHorizontal } as const;

const meta = {
  title: "Bileşenler/Düğme ve İkon/İkon Düğmesi",
  id: "components-buttons-icon-button",
  component: IconButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Yalnızca ikon taşıyan düğme; `aria-label` tipte zorunludur ve Title Case yazılır. Dokunmatikte her boy 44 piksel, `sm` yalnızca fareyle 36'ya iner. Daha zengin ipucu için `Tooltip` ile sar ve `showTitle={false}` ver.",
      },
    },
  },
  argTypes: {
    icon: { control: "select", options: Object.keys(GLYPHS), mapping: GLYPHS },
    variant: { control: "inline-radio", options: ["ghost", "secondary", "primary", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  args: { icon: Settings, "aria-label": "Ayarları Aç", variant: "secondary", size: "md", disabled: false, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Ayarları Aç" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Destructive: Story = {
  name: "Yıkıcı Eylem",
  args: { icon: Trash2, "aria-label": "Kaydı Sil", variant: "danger" },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true, icon: Share2, "aria-label": "Paylaş" },
};

export const Toolbar: Story = {
  name: "Araç Çubuğu",
  render: () => (
    <div role="toolbar" aria-label="Metin biçimi" className="inline-flex items-center gap-0.5 rounded-lg bg-overlay p-1 shadow-raised">
      <IconButton icon={Bold} aria-label="Kalın" size="sm" />
      <IconButton icon={Italic} aria-label="İtalik" size="sm" />
      <IconButton icon={Underline} aria-label="Altı Çizili" size="sm" />
      <span aria-hidden className="mx-1 h-5 w-px bg-line" />
      <IconButton icon={Link2} aria-label="Bağlantı Ekle" size="sm" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      {(["ghost", "secondary", "primary", "danger"] as const).map((variant) => (
        <Cell key={variant} label={`${variant} · sm · md · lg`}>
          <div className="flex items-center gap-2">
            {(["sm", "md", "lg"] as const).map((size) => (
              <IconButton
                key={size}
                variant={variant}
                size={size}
                icon={variant === "danger" ? Trash2 : Pencil}
                aria-label={variant === "danger" ? `Sil (${size})` : `Düzenle (${size})`}
              />
            ))}
          </div>
        </Cell>
      ))}
    </Gallery>
  ),
};
