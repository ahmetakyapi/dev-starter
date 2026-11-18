import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Compass, Truck } from "lucide-react";
import { ConnectionHero } from "@/components/ui/connection-hero";
import { Cell, Gallery } from "../_lib/Frame";

const FROM = { label: "Pusula", icon: <Compass /> };
const TO = { label: "Kargo", icon: <Truck /> };

const meta = {
  title: "Bileşenler/Pazarlama/Bağlantı Başlığı",
  id: "connection-hero",
  component: ConnectionHero,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "İki uygulamanın karosu ve aralarında bağlantının durumunu söyleyen üç nokta; arkada yumuşak renk zemini. Noktalar süs değil: bağlı değil (sönük), bağlanıyor (sırayla yanar), bağlandı (başarı tonu), hata (ortadaki tehlike tonu). Hareketi azaltanda sıralı yanma yok. Pusula: Bildirimler → Yeniden Bağla.",
      },
    },
  },
  args: { from: FROM, to: TO, status: "idle" },
  argTypes: { status: { control: "inline-radio", options: ["idle", "connecting", "connected", "error"] } },
  render: (args) => (
    <div className="mx-auto max-w-xl p-6">
      <ConnectionHero {...args} />
    </div>
  ),
} satisfies Meta<typeof ConnectionHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Bağlı Değil",
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "Pusula ile Kargo, bağlı değil" })).toBeInTheDocument();
  },
};

export const AllStates: Story = {
  name: "Bütün Durumlar",
  render: () => (
    <Gallery cols={2}>
      {(["idle", "connecting", "connected", "error"] as const).map((s) => (
        <Cell key={s} label={s}>
          <ConnectionHero from={FROM} to={TO} status={s} />
        </Cell>
      ))}
    </Gallery>
  ),
};
