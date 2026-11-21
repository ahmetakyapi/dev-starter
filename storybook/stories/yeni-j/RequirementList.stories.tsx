import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hash, Mail, Receipt } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { RequirementList, type Requirement } from "@/components/ui/requirement-list";

const START: Requirement[] = [
  { id: "mail", name: "E-posta", icon: <Mail />, status: "connected" },
  { id: "muhasebe", name: "Muhasebe", icon: <Receipt />, status: "connected" },
  { id: "kanal", name: "Ekip Sohbeti", icon: <Hash />, status: "missing" },
];

function Demo() {
  const [items, setItems] = useState(START);
  return (
    <div className="mx-auto max-w-sm rounded-xl bg-overlay p-4">
      <RequirementList items={items} onConnect={(id) => setItems((list) => list.map((i) => (i.id === id ? { ...i, status: "connected" } : i)))} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Seçim/Gerekenler Listesi",
  id: "requirement-list",
  component: RequirementList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir şablonun çalışması için bağlı olması gereken uygulamalar: bağlıysa yeşil \"Bağlı\" hapı, değilse \"Bağla\" butonu. Eksik sayısı başlığın altında metinle söylenir (\"1 bağlantı eksik\"), canlı bölge değil. Durum rengi tek işaret değil: yazı ve onay işareti. Axon turundan.",
      },
    },
  },
  args: { items: START },
  render: () => <Demo />,
} satisfies Meta<typeof RequirementList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Şablon Gerekenleri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1 bağlantı eksik")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Ekip Sohbeti uygulamasını bağla" }));
    await expect(canvas.getByText("Hepsi bağlı")).toBeInTheDocument();
  },
};
