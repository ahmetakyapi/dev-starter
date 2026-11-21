import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bot, Calendar, Mail, Search, Sparkles } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { FocusStack } from "@/components/ui/focus-stack";
import { Frame } from "../_lib/Frame";

const ITEMS = [
  { id: "satis", icon: <Sparkles />, title: "Satış Ajanı", subtitle: "Aday araştırma ve ilk mesaj" },
  { id: "destek", icon: <Mail />, title: "Destek Ajanı", subtitle: "Gelen talepleri sınıflar" },
  { id: "toplanti", icon: <Calendar />, title: "Toplantı Ajanı", subtitle: "Notları ve görevleri çıkarır" },
  { id: "fatura", icon: <Bot />, title: "Fatura Ajanı", subtitle: "Siparişle eşleştirir, onaya yollar" },
  { id: "arastirma", icon: <Search />, title: "Araştırma Ajanı", subtitle: "Rakip fiyatlarını izler" },
  { id: "haber", icon: <Mail />, title: "Haber Ajanı", subtitle: "Haftalık özeti gönderir" },
];

const meta = {
  title: "Bileşenler/Tanıtım/Odak Yığını",
  id: "focus-stack",
  component: FocusStack,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Dikey listede aynı anda biri odakta: ortadaki büyük ve net, uzaklaştıkça küçülür, solar, bulanıklaşır. Kendiliğinden döner (en az 4 öğe); üzerine gelince, odaktayken ya da bir ok tuşuna basınca durur, hareketi azaltanda hiç dönmez. ↑ ↓ Home End gezer, görünen komşuya tıklamak onu odağa getirir. Dönüş ekran okuyucuya bildirilmez; görünmeyen öğeler `aria-hidden`. Forge kahramanı referans turundan.",
      },
    },
  },
  args: { items: ITEMS, label: "Ajanlar", interval: 0 },
  render: (args) => (
    <Frame width="sm">
      <FocusStack {...args} />
    </Frame>
  ),
} satisfies Meta<typeof FocusStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Ajan Yığını",
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "Ajanlar" });
    region.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvasElement.querySelector("li[aria-current]")).toHaveTextContent("Destek Ajanı");
    await userEvent.keyboard("{End}");
    await expect(canvasElement.querySelector("li[aria-current]")).toHaveTextContent("Haber Ajanı");
  },
};

export const Auto: Story = {
  name: "Kendiliğinden Dönen",
  args: { interval: 2600 },
};
