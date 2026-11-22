import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { WorkspaceSwitcher, type Workspace } from "@/components/ui/workspace-switcher";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const WORKSPACES: Workspace[] = [
  { id: "dh", name: "Dhowline Otelcilik", subtitle: "Cari Hesaplar" },
  { id: "nl", name: "Notisline", subtitle: "Yönetici" },
  { id: "pm", name: "Paymi Ödeme", subtitle: "Denetçi" },
];

const meta = {
  title: "Bileşenler/Gezinme/Çalışma Alanı Değiştirici",
  id: "workspace-switcher",
  component: WorkspaceSwitcher,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kenar çubuğunun tepesinde: hangi hesap/şirkette olduğunu söyler, bir tıkla başkasına geçirir. Menü `dropdown-menu` (Base UI Menu) üstünde: ok tuşları gezer, Escape tetikleyiciye döner; seçili alan radyo + işaret. Tek çalışma alanı varsa tıklanamaz düz kimlik kartı (ölü açılır liste çizilmez). `collapsed` yalnız logo karosunu gösterir. Clearbill, Noticeline ve Paymie'den (yalnız yapı). Şirket adları KURGUDUR.",
      },
    },
  },
  args: { workspaces: WORKSPACES, value: "dh" },
  argTypes: { workspaces: { control: false }, collapsed: { control: "boolean" } },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Frame width="sm">
        <WorkspaceSwitcher
          {...args}
          value={value}
          onValueChange={setValue}
          footer={<DropdownMenuItem icon={<Plus />}>Yeni Çalışma Alanı</DropdownMenuItem>}
        />
      </Frame>
    );
  },
} satisfies Meta<typeof WorkspaceSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Çalışma Alanı: Dhowline Otelcilik/ });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitemradio", { name: /Notisline/ }));
    await expect(canvas.getByRole("button", { name: /Çalışma Alanı: Notisline/ })).toBeInTheDocument();
  },
};

export const Single: Story = {
  name: "Tek ve Daraltılmış",
  tags: ["!autodocs"],
  render: () => (
    <Gallery cols={2}>
      <Cell label="Tek çalışma alanı: düz kart">
        <div className="w-60">
          <WorkspaceSwitcher workspaces={[WORKSPACES[0]]} value="dh" />
        </div>
      </Cell>
      <Cell label="Daraltılmış kenar çubuğu">
        <div className="w-16">
          <WorkspaceSwitcher workspaces={WORKSPACES} value="nl" collapsed />
        </div>
      </Cell>
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Tek çalışma alanında tıklanabilir tetikleyici yok.
    await expect(canvas.queryByRole("button", { name: /Dhowline/ })).toBeNull();
    await expect(canvas.getByRole("button", { name: /Notisline/ })).toBeInTheDocument();
  },
};
