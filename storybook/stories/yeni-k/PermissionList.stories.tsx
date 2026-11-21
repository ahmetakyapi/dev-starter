import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PermissionList } from "@/components/ui/permission-list";

const meta = {
  title: "Bileşenler/Form Girişleri/İzin Listesi",
  id: "permission-list",
  component: PermissionList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bağlantı penceresinde \"Uygulama şunları yapabilecek\" dökümü. Her satırda onay ikonu, izin metni ve erişim türü; tür renkle değil metinle söylenir (\"Okur\" / \"Yazar\"). Alttaki güvence satırı yalnız doğruysa yazılır. MailPulse bağlantı penceresinden (yalnız yapı).",
      },
    },
  },
  args: {
    title: "Kargo şunları yapabilecek",
    items: [
      { id: "1", text: "Siparişleri ve adresleri okur", access: "read" },
      { id: "2", text: "Takip numarasını talebe yazar", access: "write" },
      { id: "3", text: "Teslim güncellemelerini alır", access: "read" },
    ],
    footnote: "OAuth ile güvenli bağlanır; izni istediğin an kaldırabilirsin.",
  },
  render: (args) => (
    <div className="mx-auto max-w-sm p-6">
      <PermissionList {...args} />
    </div>
  ),
} satisfies Meta<typeof PermissionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Bağlantı İzinleri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByText("Yazar")).toBeInTheDocument();
  },
};
