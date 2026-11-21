import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { StatusList } from "@/components/ui/status-list";

const meta = {
  title: "Bileşenler/Veri/Sistem Durumu",
  id: "status-list",
  component: StatusList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Ürün bileşenlerinin durumu. Genel durum başlıkta, bileşenlerden türer (hepsi çalışıyorsa \"Tüm sistemler çalışıyor\", değilse en kötü durumun sayısı). Durum renk + metin: Çalışıyor, Yavaş, Kesinti, Bakımda. Statik metin, canlı bölge değil. MailPulse yardım merkezinden (yapı).",
      },
    },
  },
  args: {
    title: "Sistem Durumu",
    items: [
      { id: "g", label: "Gönderim", status: "operational" },
      { id: "w", label: "Web Sitesi ve Formlar", status: "operational" },
      { id: "a", label: "API", status: "operational" },
      { id: "o", label: "Ödemeler", status: "operational" },
    ],
    incident: "Son olay 3 Ara · 18 dakikada çözüldü",
  },
  render: (args) => (
    <div className="mx-auto grid max-w-3xl gap-8 p-6 sm:grid-cols-2">
      <StatusList {...args} />
      <StatusList
        {...args}
        items={[
          { id: "g", label: "Gönderim", status: "degraded" },
          { id: "w", label: "Web Sitesi ve Formlar", status: "operational" },
          { id: "a", label: "API", status: "outage" },
          { id: "o", label: "Ödemeler", status: "maintenance" },
        ]}
        incident="Son olay bugün · inceleniyor"
      />
    </div>
  ),
} satisfies Meta<typeof StatusList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Çalışıyor ve Kesinti",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Tüm sistemler çalışıyor")).toBeInTheDocument();
    await expect(canvas.getByText("1 bileşende kesinti")).toBeInTheDocument();
    await expect(canvas.getAllByText("Çalışıyor").length).toBeGreaterThan(2);
  },
};
