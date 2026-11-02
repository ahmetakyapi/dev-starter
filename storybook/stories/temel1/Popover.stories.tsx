import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Filter, Share2 } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Button, buttonClass } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/Field";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { settle } from "./_settle";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Katmanlar/Açılır Kart",
  id: "components-overlays-popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir düğmeye bağlı, sayfayı kilitlemeyen küçük katman: filtre seçenekleri, kısa açıklama, paylaşım bağlantısı. Konumlama, dış tıklama ve Escape ile kapanma, odağın tetikleyiciye dönmesi Base UI'dan. İçinde form varsa `modal=\"trap-focus\"` ve bir `PopoverClose` ver.",
      },
    },
  },
  argTypes: { defaultOpen: { control: "boolean" }, children: { control: false } },
  args: { defaultOpen: false },
  render: (args) => (
    <Frame width="sm" className="min-h-96">
      <div className="flex justify-center">
        <Popover {...args}>
          <PopoverTrigger className={buttonClass({ variant: "secondary" })}>
            <Share2 aria-hidden />
            Paylaş
          </PopoverTrigger>
          <PopoverContent title="Panoyu Paylaş" description="Bağlantıya sahip herkes yalnızca okuyabilir.">
            <div className="flex items-center gap-2 rounded-md bg-surface-sunken py-1 pr-1 pl-3">
              <code className="min-w-0 flex-1 truncate font-mono text-small text-body">pano.acme.com.tr/p/q3-satis</code>
              <CopyButton value="https://pano.acme.com.tr/p/q3-satis" label="Bağlantıyı Kopyala" />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan (Kapalı)" };

export const OpensOnClick: Story = {
  name: "Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Paylaş" });
    await userEvent.click(trigger);
    const popup = await screen.findByRole("dialog", { name: "Panoyu Paylaş" });
    await waitFor(() => expect(popup).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await settle(globals);
  },
};

export const Open: Story = {
  name: "Açık",
  tags: ["!autodocs"],
  args: { defaultOpen: true },
  play: async ({ globals }) => {
    await settle(globals);
  },
};

export const WithFormOpen: Story = {
  name: "Formlu (Odak Tuzağı, Açık)",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="sm" className="min-h-[28rem]">
      <div className="flex justify-center">
        <Popover defaultOpen modal="trap-focus">
          <PopoverTrigger className={buttonClass({ variant: "secondary" })}>
            <Filter aria-hidden />
            Filtrele
          </PopoverTrigger>
          <PopoverContent title="Tutar Aralığı" align="center">
            <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
              <Field label="En az (₺)" name="min" type="number" defaultValue={5000} />
              <Field label="En çok (₺)" name="max" type="number" defaultValue={25000} />
              <div className="flex justify-end gap-2 pt-1">
                <PopoverClose className={buttonClass({ variant: "ghost", size: "sm" })}>Vazgeç</PopoverClose>
                <Button size="sm" type="submit">
                  Uygula
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </Frame>
  ),
  play: async ({ globals }) => {
    await settle(globals);
  },
};
