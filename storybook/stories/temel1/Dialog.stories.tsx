import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/dialog";
import { settle } from "./_settle";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Katmanlar/Diyalog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Yerel `<dialog>` + `showModal()`: odak tuzağı, Escape ve üst katman tarayıcıdan; arka plana tıklayınca kapanma, odağın açan düğmeye dönmesi ve kaydırma kilidi bileşenden. Form doldurulan diyalogda `dismissible={false}` ver; yıkıcı onayda ilk odak `data-autofocus` ile “Vazgeç”te.",
      },
    },
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  args: {
    open: false,
    onOpenChange: fn(),
    title: "Projeyi Sil",
    description: "“Kasım Kampanyası” ve içindeki 14 rapor kalıcı olarak silinir. Bu işlem geri alınamaz.",
    size: "sm",
    dismissible: true,
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
          <Button variant="danger" onClick={() => setOpen(true)}>
            Projeyi Sil
          </Button>
        </div>
        <Dialog
          {...args}
          onOpenChange={setOpen}
          footer={
            <>
              <Button variant="secondary" data-autofocus onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Kalıcı Olarak Sil
              </Button>
            </>
          }
        />
      </Frame>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan (Kapalı)" };

export const TiklayincaAcilir: Story = {
  name: "Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ args, canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Projeyi Sil" }));
    const dialog = await screen.findByRole("dialog", { name: "Projeyi Sil" });
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Vazgeç" })).toHaveFocus());
    await settle(globals);
  },
};

export const KapanincaOdakDoner: Story = {
  name: "Kapanınca Odak Geri Döner",
  tags: ["!autodocs"],
  play: async ({ args, canvasElement, globals }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Projeyi Sil" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Projeyi Sil" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(trigger).toHaveFocus());
    await settle(globals);
  },
};

export const Acik: Story = {
  name: "Açık",
  tags: ["!autodocs"],
  args: { open: true },
  play: async ({ globals }) => {
    await settle(globals);
  },
};

function InviteDialog({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Üye Davet Et</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Üye Davet Et"
        description="Davet bağlantısı 7 gün geçerli olur."
        size="md"
        dismissible={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={() => setOpen(false)}>Davet Gönder</Button>
          </>
        }
      >
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <Field label="E-posta" name="email" type="email" placeholder="mert.aksoy@acme.com.tr" data-autofocus />
          <Field label="Rol" name="rol" defaultValue="Düzenleyici" hint="Yönetici, Düzenleyici ya da Okuyucu." />
        </form>
      </Dialog>
    </>
  );
}

export const FormluAcik: Story = {
  name: "Formlu (Açık, Dışarı Tıklamayla Kapanmaz)",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="sm" className="min-h-96">
      <div className="flex justify-center">
        <InviteDialog initialOpen />
      </div>
    </Frame>
  ),
  play: async ({ globals }) => {
    await settle(globals);
  },
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="sm · yıkıcı onay">
        <SizedDialog size="sm" title="Kaydı Sil" body="Bu kayıt kalıcı olarak silinir." />
      </Cell>
      <Cell label="md · form">
        <InviteDialog initialOpen={false} />
      </Cell>
      <Cell label="lg · uzun içerik, kaydırılır">
        <SizedDialog
          size="lg"
          title="Kullanım Koşulları"
          body={Array.from({ length: 12 }, (_, i) => `${i + 1}. madde: Hizmet, Acme Yazılım A.Ş. tarafından sunulur ve hesabınızdaki veriler Türkiye'deki veri merkezlerinde saklanır.`).join(" ")}
        />
      </Cell>
    </Gallery>
  ),
};

function SizedDialog({ size, title, body }: { size: "sm" | "md" | "lg"; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {title}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        size={size}
        footer={<Button onClick={() => setOpen(false)}>Tamam</Button>}
      >
        <p className="text-base text-body">{body}</p>
      </Dialog>
    </>
  );
}
