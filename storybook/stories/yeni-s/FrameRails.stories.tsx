import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, CreditCard, Inbox, MessagesSquare, Truck } from "lucide-react";
import { expect, within } from "storybook/test";
import { FrameRails, RuledCell, RuledRow } from "@/components/ui/frame-rails";

function Tools() {
  return (
    <RuledRow label="Kullandığın Araçlarla Çalışır" edges="none">
      <RuledCell icon={<Truck />}>Kargoya</RuledCell>
      <RuledCell icon={<BookOpen />}>Defter</RuledCell>
      <RuledCell icon={<Inbox />}>Not Kutusu</RuledCell>
      <RuledCell icon={<MessagesSquare />}>Sohbet</RuledCell>
      <RuledCell icon={<CreditCard />}>Ödeme</RuledCell>
      <RuledCell href="#entegrasyonlar">Bütün Entegrasyonlar</RuledCell>
    </RuledRow>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Çizgili Çerçeve",
  id: "frame-rails",
  component: FrameRails,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Kahramanı ve bölümleri cetvel çizgileriyle çevreleyen sergi düzeni: içeriğin iki yanında tam boy kıl ray, isteğe sayfa kenarına uzanan üst/alt çizgi ve kesişimlerde artı (`marks`). `RuledRow` hücreleri `gap-px` + `bg-line` tekniğiyle böler: çizgi hücreler arasındaki boşluktur, çift çizgi olmaz; telefonda 2 sütuna döner, tek kalan hücrenin yanına zemin renginde dolgu girer. Hepsi sunucu bileşeni, süs çizgiler `aria-hidden`. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: { children: null, top: true, bottom: true, marks: true, width: "max-w-5xl" },
  render: (args) => (
    <div className="bg-page py-10">
      <FrameRails {...args}>
        <div className="px-6 py-16 text-center sm:px-12 sm:py-24">
          <h1 className="font-display text-display font-semibold text-strong sm:text-hero">Siparişler Kendi Kendine Yürüsün</h1>
          <p className="mx-auto mt-4 max-w-xl text-lead text-body">
            Gecikmeyi algılar, müşteriye haber verir, stok ve muhasebeyi eşitler. Sen yalnız sonucu görürsün.
          </p>
        </div>
      </FrameRails>
      <FrameRails bottom marks width={args.width}>
        <Tools />
      </FrameRails>
    </div>
  ),
} satisfies Meta<typeof FrameRails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Siparişler Kendi Kendine Yürüsün" })).toBeInTheDocument();
    const tools = canvas.getByRole("list", { name: "Kullandığın Araçlarla Çalışır" });
    await expect(within(tools).getAllByRole("listitem")).toHaveLength(6);
    await expect(within(tools).getByRole("link", { name: "Bütün Entegrasyonlar" })).toHaveAttribute("href", "#entegrasyonlar");
  },
};

export const RowOnly: Story = {
  name: "Yalnız Şerit, Tek Sayıda Hücre",
  render: () => (
    <div className="bg-page py-10">
      <FrameRails top bottom marks width="max-w-4xl">
        <RuledRow label="Kullandığın Araçlarla Çalışır" edges="none">
          <RuledCell icon={<Truck />}>Kargoya</RuledCell>
          <RuledCell icon={<BookOpen />}>Defter</RuledCell>
          <RuledCell icon={<CreditCard />}>Ödeme</RuledCell>
        </RuledRow>
      </FrameRails>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Telefondaki dolgu hücresi aria-hidden: liste üç öğe sayar.
    const tools = canvas.getByRole("list", { name: "Kullandığın Araçlarla Çalışır" });
    await expect(within(tools).getAllByRole("listitem")).toHaveLength(3);
  },
};
