import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CornerMascot } from "@/components/ui/corner-mascot";

const meta = {
  title: "Bileşenler/Tanıtım/Köşe Maskotu",
  id: "corner-mascot",
  component: CornerMascot,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "420px" },
      description: {
        component:
          "Sağ altta duran, gözleri imleci izleyen ve ara sıra göz kırpan küçük yüz; dokununca kısa bir balon konuşur (`role=\"status\"`). Kişiliği olan tanıtım sayfası için; uygulama içinde, formda ve ödemede kullanma. Göz takibi yalnız ince işaretçide ve hareketi azaltmayanda.",
      },
    },
  },
  args: { messages: ["Merhaba!", "Fiyat aşağıda, tek seferlik.", "Demoyu denedin mi?"] },
  render: (args) => (
    <div className="min-h-[420px] bg-page p-8">
      <p className="max-w-md text-read text-soft">İmleci sayfada gezdir: gözler takip eder. Maskota dokun: konuşur.</p>
      <CornerMascot {...args} />
    </div>
  ),
} satisfies Meta<typeof CornerMascot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Maskota merhaba de" }));
    await expect(await canvas.findByText("Merhaba!")).toBeInTheDocument();
  },
};
