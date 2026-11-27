import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FolderLock, ReceiptText } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ApprovalCard, ApprovalStrip } from "@/components/ui/approval-card";

const meta = {
  title: "Bileşenler/Yapay Zeka/İnsan Onayı",
  id: "approval-card",
  component: ApprovalCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Ajanın etkili bir eylemden önce durup kararı insana bıraktığı an: soru başlığı, sonuç cümlesi, etkilenenler, \"Bu karar denetim günlüğüne yazılır.\" satırı, isteğe not, Reddet / Onayla. Karar yalnız çağırana iletilir (`onDecision`); eylemi sunucu, yetkiyi kendisi denetleyerek yapar (`rules/agentic-ui.md` § 2). Konuşma içindeki tek satırlık hali `ApprovalStrip`. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: {
    icon: <FolderLock />,
    title: "Ece Doğan'a Muhasebe klasörüne erişim verilsin mi?",
    description: (
      <>
        <p>Ece klasördeki 214 faturayı görebilecek ve yeni dosya yükleyebilecek.</p>
        <p>İstek Pusula asistanı tarafından, Ece'nin PS-221 numaralı talebi üzerine hazırlandı.</p>
      </>
    ),
    people: [{ name: "Ece Doğan" }],
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,32rem)]">
      <ApprovalCard {...args} />
    </div>
  ),
} satisfies Meta<typeof ApprovalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Ece Doğan'a Muhasebe klasörüne erişim verilsin mi?" })).toBeInTheDocument();
    await expect(canvas.getByRole("list", { name: "Etkilenenler" })).toHaveTextContent("Ece Doğan");
    await userEvent.type(canvas.getByLabelText("Not"), "Ay sonu kapanışı için.");
    await userEvent.click(canvas.getByRole("button", { name: "Onayla" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Onaylandı");
    await expect(canvas.getByText("Ay sonu kapanışı için.")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Reddet" })).not.toBeInTheDocument();
  },
};

export const Refund: Story = {
  name: "Birden Çok Kişi, Bekleyen Gönderim",
  args: {
    icon: <ReceiptText />,
    title: "Dört müşteriye toplam 2.480 ₺ iade yapılsın mı?",
    description: <p>Ödemesi iki kez çekilen siparişler iade edilir; müşterilere bilgi e-postası gider.</p>,
    people: [{ name: "Selin Başaran" }, { name: "Kerem Arıkan" }, { name: "Onur Tekin" }, { name: "Deniz Aydın" }],
    note: false,
    onDecision: () => new Promise<void>((resolve) => setTimeout(resolve, 600)),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Reddet" }));
    await expect(canvas.getByRole("button", { name: /Onayla/ })).toBeDisabled();
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Reddedildi"), { timeout: 3000 });
  },
};

export const Failure: Story = {
  name: "Gönderim Hatası",
  args: { onDecision: () => Promise.reject(new Error("ağ")) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Onayla" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Karar gönderilemedi");
    await expect(canvas.getByRole("button", { name: "Onayla" })).toBeEnabled();
  },
};

export const Decided: Story = {
  name: "Karar Verilmiş",
  args: { state: "approved", decidedBy: "Ahmet Yılmaz", decidedAt: "14.32" },
};

export const Strip: Story = {
  name: "Konuşma İçinde Şerit",
  render: () => (
    <div className="grid w-[min(100vw-2rem,32rem)] gap-2">
      <ApprovalStrip person={{ name: "Selin Başaran" }} />
      <ApprovalStrip person={{ name: "Kerem Arıkan" }} text="Kerem Arıkan iade onayını bekliyor" state="approved" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Selin Başaran onayını bekliyor")).toBeInTheDocument();
    await userEvent.click(canvas.getAllByRole("button", { name: "Reddet" })[0]!);
    await expect(canvas.getAllByRole("status")[0]).toHaveTextContent("Reddedildi");
  },
};
