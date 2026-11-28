import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { DocExtract } from "@/components/ui/doc-extract";
import { Wallpaper } from "@/components/ui/wallpaper";

const meta = {
  title: "Bileşenler/Yapay Zeka/Belge Çıkarma",
  id: "doc-extract",
  component: DocExtract,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Yapay zekanın yapılandırılmamış belgeyi veriye çevirdiği an: solda soluk belge iskeleti, sağda koyu çerçeveli \"Çıkarılan Alanlar\" kartı, aralarında dirsekli ince çizgi. `animate` ile görünüme ilk girdiğinde belgede tarama çizgisi bir kez iner, eşleşen satır vurgulanır, alan değerleri sırayla belirir ve durum \"Okunuyor\"dan \"Hazır\"a döner. Belge iskeleti `aria-hidden`, alanlar `dl`. Telefonda alt alta. Gerçek kayıt için `key-value-list`. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    title: "Fatura Pdf",
    fields: [
      { label: "Tedarikçi", value: "Yörük Ambalaj Ltd." },
      { label: "Fatura No", value: "YA-2026-0418" },
      { label: "Tarih", value: "21 Kasım 2026" },
      { label: "Tutar", value: "18.420,00 ₺" },
    ],
    status: { label: "Hazır", tone: "success" },
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,40rem)]">
      <DocExtract {...args} />
    </div>
  ),
} satisfies Meta<typeof DocExtract>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Çıkarılan Alanlar" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("term")).toHaveLength(4);
    await expect(canvas.getAllByRole("definition")[3]).toHaveTextContent("18.420,00 ₺");
    await expect(canvas.getByRole("status")).toHaveTextContent("Hazır");
  },
};

export const Animated: Story = {
  name: "Taranır, Manzara Üstünde",
  args: { animate: true },
  render: (args) => (
    <Wallpaper scene="dunes" className="grid min-h-[32rem] w-[min(100vw-2rem,56rem)] place-items-center rounded-xl p-6">
      <div className="w-full max-w-2xl">
        <DocExtract {...args} />
      </div>
    </Wallpaper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(status).toHaveTextContent("Hazır"), { timeout: 4000 });
  },
};

export const Narrow: Story = {
  name: "Dar Kap, Beş Alan",
  args: {
    title: "İrsaliye Pdf",
    heading: "Okunan Alanlar",
    fields: [
      { label: "Gönderen", value: "Defne Tekstil" },
      { label: "İrsaliye No", value: "IR-55210" },
      { label: "Sevk Tarihi", value: "27 Kasım 2026" },
      { label: "Koli", value: "14" },
      { label: "Durum", value: "Eksik İmza" },
    ],
    status: { label: "Kontrol Bekliyor", tone: "warning" },
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,22rem)]">
      <DocExtract {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Okunan Alanlar" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("term")).toHaveLength(5);
  },
};
