import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditCard, Lock } from "lucide-react";
import { TrustLine } from "@/components/ui/trust-line";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { Media } from "./_media";

const meta = {
  title: "Bileşenler/Tanıtım/Güven Satırı",
  id: "trust-line",
  component: TrustLine,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Birincil eylemin hemen altında simge ve noktayla ayrılmış kısa güvenceler: tıklamadan önceki \"güvenli mi?\" sorusunu düğmenin dibinde yanıtlar. En çok üç, her biri doğrulanabilir olgu; sıfat değil. Ayraç `aria-hidden`, ekran okuyucu görünmez virgül duyar.",
      },
    },
  },
  args: { items: ["Apple onaylı", "Geliştirici kimliğiyle imzalı", "Gatekeeper'dan temiz açılır"] },
  render: (args) => (
    <Frame>
      <div className="grid justify-items-center gap-3">
        <span className="rounded-full bg-cta px-5 py-2.5 text-base font-medium text-on-brand shadow-cta">Mac İçin İndir</span>
        <TrustLine {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof TrustLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "İndirme Düğmesi Altında" };

export const Variants: Story = {
  name: "Kullanımlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="ödeme">
        <TrustLine icon={<Lock />} items={["Ödeme Stripe güvencesinde", "İade 14 gün"]} />
      </Cell>
      <Cell label="kayıt">
        <TrustLine icon={<CreditCard />} items={["Kart gerekmez", "2 dakikada kurulum"]} />
      </Cell>
      <Cell label='tone="media"'>
        <Media className="min-h-32 w-full p-4">
          <TrustLine tone="media" items={["Kart gerekmez", "İstediğin an iptal"]} />
        </Media>
      </Cell>
    </Gallery>
  ),
};
