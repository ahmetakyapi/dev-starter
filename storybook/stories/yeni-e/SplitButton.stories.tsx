import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileSpreadsheet, FileText } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { SplitButton } from "@/components/ui/split-button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Düğme ve İkon/Bölünmüş Düğme",
  id: "split-button",
  component: SplitButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "En sık seçilen eylem ve aynı işin kardeşleri tek hapta (“CSV Olarak İndir” + ▾ Excel, PDF). İki ayrı düğme: sol yarı hemen yapar, ok menüyü açar (Base UI Menu: oklar, Escape, odak dönüşü). Farklı işler (Düzenle, Sil) tek düğmeye sıkıştırılmaz, onlar Açılır Menü.",
      },
    },
  },
  args: {
    children: "CSV Olarak İndir",
    onClick: fn(),
    items: [
      { label: "Excel (.xlsx)", icon: <FileSpreadsheet />, onSelect: fn() },
      { label: "PDF Özeti", icon: <FileText />, onSelect: fn() },
    ],
  },
  render: (args) => (
    <Frame width="sm">
      <SplitButton {...args} />
    </Frame>
  ),
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "CSV Olarak İndir" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole("button", { name: "Diğer Biçimler" }));
    await userEvent.click(await page.findByRole("menuitem", { name: /Excel/ }));
    await expect(args.items[0].onSelect).toHaveBeenCalledTimes(1);
  },
};

export const Secondary: Story = {
  name: "İkincil",
  args: { variant: "secondary", children: "Yayınla", menuLabel: "Yayın Seçenekleri", items: [{ label: "Taslak Olarak Kaydet", onSelect: fn() }, { label: "Zamanla", onSelect: fn() }] },
};

export const Disabled: Story = { name: "Devre Dışı", args: { disabled: true } };

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Birincil">
        <SplitButton onClick={() => undefined} items={[{ label: "Excel (.xlsx)", onSelect: () => undefined }]}>
          CSV Olarak İndir
        </SplitButton>
      </Cell>
      <Cell label="İkincil">
        <SplitButton variant="secondary" onClick={() => undefined} items={[{ label: "Zamanla", onSelect: () => undefined }]}>
          Yayınla
        </SplitButton>
      </Cell>
      <Cell label="Devre Dışı">
        <SplitButton disabled onClick={() => undefined} items={[{ label: "Zamanla", onSelect: () => undefined }]}>
          Yayınla
        </SplitButton>
      </Cell>
    </Gallery>
  ),
};
