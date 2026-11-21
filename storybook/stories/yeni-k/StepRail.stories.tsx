import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditCard, Link2, PencilLine, Repeat, Search } from "lucide-react";
import { expect, within } from "storybook/test";
import { StepRail } from "@/components/ui/step-rail";
import { Frame } from "../_lib/Frame";

const STEPS = [
  { icon: <PencilLine />, title: "Kaydol", description: "Hesabını dakikalar içinde aç." },
  { icon: <Link2 />, title: "Hesapları Bağla", description: "Hesaplarını güvenle bağla." },
  { icon: <Search />, title: "İncele", description: "Ayrıntılı özet ve grafiklere eriş." },
  { icon: <CreditCard />, title: "Öde", description: "Ödemeni gönder ya da al." },
  { icon: <Repeat />, title: "Düzenle", description: "Araçlarla kararlarını iyileştir." },
];

const meta = {
  title: "Bileşenler/Tanıtım/Süreç Rayı",
  id: "step-rail",
  component: StepRail,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Tanıtım sayfasında \"nasıl çalışır\" anlatımı: ikonlu yuvarlak karolar, kalın hap çizgi; tamamlanan kısım vurgu renginde dolu, kalan kısım iz. Kaydırdıkça çizgi parça parça dolar (CSS `animation-timeline`, JS yok; hareketi azaltanda doğrudan dolu). Form akışı için `Stepper`, süreci anlatmak için burası. Synais referans turundan (yalnız yapı).",
      },
    },
  },
  args: { steps: STEPS, current: 2, tone: "light", fill: "static" },
  argTypes: { tone: { control: "inline-radio", options: ["light", "dark"] }, fill: { control: "inline-radio", options: ["scroll", "static"] } },
  render: (args) => (
    <Frame width="md">
      <div className={args.tone === "dark" ? "rounded-xl bg-strong p-6 sm:p-8" : "p-2"}>
        <StepRail {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof StepRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Açık Zemin",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(5);
    await expect(canvas.getByRole("heading", { name: "İncele" }).closest("li")).toHaveAttribute("aria-current", "step");
    await expect(canvas.getAllByText("(Tamamlandı)", { exact: false, selector: ".sr-only" }).length).toBeGreaterThan(0);
  },
};

export const Dark: Story = { name: "Koyu Bölüm", args: { tone: "dark", current: 1 } };
