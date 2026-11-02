import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/sheet";
import { settle } from "./_settle";
import { Frame } from "../_lib/Frame";

const STATUSES = ["Açık", "Beklemede", "Kapandı"] as const;

function FilterBody() {
  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-small font-semibold text-strong">Durum</legend>
        {STATUSES.map((status, i) => (
          <label key={status} className="flex min-h-11 items-center gap-3 rounded-md px-1 text-base text-body">
            <input type="checkbox" defaultChecked={i === 0} className="size-4 accent-(--primary)" />
            {status}
          </label>
        ))}
      </fieldset>
      <Field label="Müşteri" name="musteri" placeholder="Acme Lojistik" />
      <Field label="En Az Tutar (₺)" name="tutar" type="number" inputMode="numeric" placeholder="5.000" />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Yan Panel",
  id: "components-overlays-sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Telefonda alttan, istenirse yandan açılan katman: filtreler, ayrıntı, kısa form. Diyalogla aynı temel (yerel `<dialog>`); alttan açılanda tutamaçtan aşağı sürüklemek kapatır, ama Kapat düğmesi ve Escape her zaman var. Alt dolgu güvenli alanı hesaba katar.",
      },
    },
  },
  argTypes: { side: { control: "inline-radio", options: ["bottom", "right"] } },
  args: {
    open: false,
    onOpenChange: fn(),
    title: "Filtreler",
    description: "Faturaları duruma, müşteriye ve tutara göre süzün.",
    side: "bottom",
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    const setOpen = (open: boolean) => {
      updateArgs({ open });
      args.onOpenChange(open);
    };
    return (
      <Frame width="sm" className="min-h-80">
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Filtreler
          </Button>
        </div>
        <Sheet
          {...args}
          onOpenChange={setOpen}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Temizle
              </Button>
              <Button onClick={() => setOpen(false)}>Sonuçları Göster</Button>
            </>
          }
        >
          <FilterBody />
        </Sheet>
      </Frame>
    );
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan (Kapalı)" };

export const OpensOnClick: Story = {
  name: "Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ args, canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Filtreler" }));
    const sheet = await screen.findByRole("dialog", { name: "Filtreler" });
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(within(sheet).getByRole("button", { name: "Sonuçları Göster" })).toBeVisible();
    await settle(globals);
  },
};

export const BottomOpen: Story = {
  name: "Alttan Açık",
  tags: ["!autodocs"],
  args: { open: true },
  play: async ({ globals }) => {
    await settle(globals);
  },
};

export const SideOpen: Story = {
  name: "Yandan Açık (Sağ Panel)",
  tags: ["!autodocs"],
  args: { open: true, side: "right", title: "Gelişmiş Filtreler", description: "Masaüstünde yan panel: liste arkada görünür kalır." },
  play: async ({ globals }) => {
    await settle(globals);
  },
};
