import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Eyebrow, SectionHeading } from "@/components/ui/section-heading";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Tanıtım/Bölüm Başlığı",
  id: "section-heading",
  component: SectionHeading,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Mono büyük harf künye + uzayan kesik çizgi, altında iki tonlu başlık (güçlü iddia, soluk bağlam), isteğe bağlı yanda açıklama. `layout`: `stack`, `split` (açıklama sağda), `center`. Künye sayfada en çok iki bölümde; Türkçe büyük harf `tr-TR` ile. Synaps, Finance ve Veridical referans turundan (yalnız yapı).",
      },
    },
  },
  args: {
    eyebrow: "Nasıl Çalışır",
    title: "Elindekiyle Başla",
    soft: "Gerisini Sistem Kursun",
    description: "Bir taslak, bir çizim ya da tek cümlelik bir istek yeter. Düzenlenebilir ilk sürüm dakikalar içinde hazır.",
    layout: "stack",
    size: "section",
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["stack", "split", "center"] },
    size: { control: "inline-radio", options: ["section", "hero"] },
  },
  render: (args) => (
    <Frame width="xl">
      <SectionHeading {...args} />
    </Frame>
  ),
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Elindekiyle Başla");
    // Türkçe büyük harf: i → İ.
    await expect(canvas.getByText("NASIL ÇALIŞIR")).toBeInTheDocument();
  },
};

export const Split: Story = {
  name: "Yanda Açıklama",
  args: { layout: "split", eyebrow: "Neden Biz", title: "Neden Bizi", soft: "Seçmelisin", description: "Kurulum yok, eğitim yok. Ekibin bugün kullandığı araçlara bağlanır, ilk haftada iş yükünü hafifletir." },
};

export const Center: Story = {
  name: "Ortalı",
  args: { layout: "center", eyebrow: "Özellikler", title: "Güçlü Özellikler", soft: "Sade Bir Arayüzde", description: undefined },
};

export const Hero: Story = {
  name: "Kahraman Boyu",
  args: { size: "hero", as: "h1", eyebrow: undefined, title: "Tasarım ve Çizim", soft: "Tek Bir Yerde", description: "Taslaktan sunuma hazır projeye. Bir kez değiştir, bütün görünümler izlesin." },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { level: 1 })).toBeInTheDocument();
  },
};

export const Eyebrows: Story = {
  name: "Künye Çizgisi",
  render: () => (
    <Frame width="xl">
      <div className="grid gap-8">
        <Eyebrow>Nasıl Çalışır</Eyebrow>
        <Eyebrow line="both">İki Yana</Eyebrow>
        <Eyebrow line="none">Çizgisiz</Eyebrow>
      </div>
    </Frame>
  ),
};
