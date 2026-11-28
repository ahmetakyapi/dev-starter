import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PackageX } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Wallpaper } from "@/components/ui/wallpaper";
import { WorkflowTrace } from "@/components/ui/workflow-trace";

const meta = {
  title: "Bileşenler/Yapay Zeka/İş Akışı İzi",
  id: "workflow-trace",
  component: WorkflowTrace,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir otomasyonun ya da ajanın tek iş üzerindeki izi: başlık satırı, mono künye, renkli noktalı dikey adımlar (renk tek işaret değil, adım metni anlamı taşır), sağda zaman ve en altta kıl halkalı sonuç kutusu. `animate` ile görünüme ilk girdiğinde adımlar sırayla belirir, en son sonuç gelir ve `role=\"status\"` bölgesinde duyurulur; hareketi azaltan kullanıcıda her şey baştan yerinde. Sürmekte olan plan için `agent-plan`, tarihli geçmiş için `timeline`. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    icon: <PackageX />,
    title: "Sipariş Gecikmesi Algılandı",
    subtitle: "Sipariş #34532 · 2 dk önce",
    steps: [
      { title: "Gecikme Tespit Edildi", detail: "Kargo iki gündür Kayseri aktarma merkezinde bekliyor", time: "09.42", tone: "danger" },
      { title: "Kargo Firmasıyla Görüşüldü", detail: "Yeni teslim tarihi 30 Kasım olarak alındı", time: "09.43", tone: "warning" },
      { title: "Müşteriye Bilgi Verildi", detail: "Özür notu ve kargo takip bağlantısı gönderildi", time: "09.44", tone: "primary" },
      { title: "Stok ve Muhasebe Güncellendi", detail: "Teslim tarihi iki sisteme de yazıldı", time: "09.46", tone: "chart-3" },
    ],
    result: { title: "Çözüldü", detail: "Bütün sistemler eşitlendi", time: "09.47" },
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,28rem)]">
      <WorkflowTrace {...args} />
    </div>
  ),
} satisfies Meta<typeof WorkflowTrace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Sipariş Gecikmesi Algılandı" })).toBeInTheDocument();
    const list = canvas.getByRole("list");
    await expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    const status = canvas.getByRole("status");
    await expect(status).toHaveTextContent("Çözüldü");
    await expect(status).toHaveAttribute("aria-live", "off");
  },
};

export const Animated: Story = {
  name: "Sırayla Belirir, Manzara Üstünde",
  args: { animate: true },
  render: (args) => (
    <Wallpaper scene="lagoon" className="grid min-h-[40rem] w-[min(100vw-2rem,56rem)] place-items-center rounded-xl p-6">
      <div className="w-full max-w-md">
        <WorkflowTrace {...args} />
      </div>
    </Wallpaper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    // Sonuç metni, kutu göründüğü anda canlı bölgeye yazılır.
    await waitFor(() => expect(status).toHaveTextContent(/Çözüldü\. Bütün sistemler eşitlendi/), { timeout: 4000 });
    await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(4);
  },
};

export const WithoutResult: Story = {
  name: "Sonuçsuz, Künyesiz",
  args: {
    icon: undefined,
    label: null,
    title: "Yeni Bayi Başvurusu",
    subtitle: "Başvuru #1187 · Bugün",
    result: undefined,
    steps: [
      { title: "Başvuru Alındı", time: "14.05", tone: "chart-1" },
      { title: "Vergi Levhası Doğrulandı", detail: "Gelir İdaresi kaydıyla eşleşti", time: "14.06", tone: "chart-2" },
      { title: "Bölge Sorumlusuna Atandı", detail: "Ege bölgesi · Selin Karaca", time: "14.08", tone: "success" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("status")).toBeNull();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
  },
};
