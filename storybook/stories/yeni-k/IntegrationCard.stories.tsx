import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, Mail, MessageSquare, Truck, Wallet } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { IntegrationCard, IntegrationGrid } from "@/components/ui/integration-card";

const APPS = [
  { id: "kargo", name: "Kargo", category: "Lojistik", description: "Siparişi kargo firmasına iletir, takip numarasını talebe yazar.", icon: <Truck />, connected: true, lastSync: "4 dk önce eşitlendi" },
  { id: "muhasebe", name: "Muhasebe", category: "Finans", description: "Faturaları ve tahsilatları muhasebe defterine aktarır.", icon: <Wallet />, connected: true, lastSync: "1 sa önce eşitlendi" },
  { id: "takvim", name: "Takvim", category: "Planlama", description: "Randevuları ve teslim tarihlerini ekip takvimine yansıtır.", icon: <CalendarDays />, connected: false },
  { id: "eposta", name: "E-Posta", category: "İletişim", description: "Gelen kutusundaki yanıtları taleplerle eşleştirir.", icon: <Mail />, connected: false, setup: "Ücretsiz · 3 dk kurulum" },
  { id: "mesaj", name: "Mesajlaşma", category: "İletişim", description: "Yeni talepleri ekip kanalına bildirir, kanaldan yanıtlanır.", icon: <MessageSquare />, connected: false },
];

function Demo() {
  const [connected, setConnected] = useState<Record<string, boolean>>(Object.fromEntries(APPS.map((a) => [a.id, a.connected])));
  const [sync, setSync] = useState<Record<string, boolean>>({ kargo: true, muhasebe: true });
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="mb-3 text-read font-semibold text-strong">Entegrasyonlar</h2>
      <IntegrationGrid>
        {APPS.map((a) => (
          <IntegrationCard
            key={a.id}
            {...a}
            connected={connected[a.id]}
            lastSync={a.lastSync ?? "Az önce eşitlendi"}
            syncing={sync[a.id] ?? true}
            onToggle={(v) => setSync((s) => ({ ...s, [a.id]: v }))}
            onConnect={() => setConnected((c) => ({ ...c, [a.id]: true }))}
          />
        ))}
      </IntegrationGrid>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Veri/Entegrasyon Kartı",
  id: "integration-card",
  component: IntegrationCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bağlanabilir uygulamanın ızgara karosu. Bağlıysa yeşil \"Bağlı\" hapı, son eşitleme zamanı ve anında etki eden anahtar; değilse \"Bağla\" butonu ve kurulum maliyeti. Kartın tamamı tıklanmaz: bağla butonu ile anahtar ayrı iki hedef. Kebab menü `menu` yuvasında. MailPulse entegrasyonlar sayfasından (yalnız yapı).",
      },
    },
  },
  args: { name: "Kargo", category: "Lojistik", description: "Siparişi kargo firmasına iletir.", icon: <Truck />, connected: true, lastSync: "4 dk önce eşitlendi" },
  render: () => <Demo />,
} satisfies Meta<typeof IntegrationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Entegrasyon Izgarası",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Kargo: eşitleme" });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Takvim uygulamasını bağla" }));
    await expect(canvas.getByRole("switch", { name: "Takvim: eşitleme" })).toBeInTheDocument();
  },
};
