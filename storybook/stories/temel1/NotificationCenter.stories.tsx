import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarClock, CreditCard, Download } from "lucide-react";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { settle } from "./_settle";
import { Frame } from "../_lib/Frame";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const ITEMS: NotificationItem[] = [
  { id: "1", actor: "Elif Yıldız", title: "Elif Yıldız Q3 raporuna yorum yaptı", body: "“Kasım satırındaki artış kampanyadan mı geliyor?”", at: ago(3), read: false },
  { id: "2", actor: "Mert Aksoy", title: "Mert Aksoy sizi “Bütçe 2027” panosuna ekledi", at: ago(42), read: false },
  { id: "3", icon: Download, title: "Dışa aktarma hazır", body: "Ekim müşteri listesi (2.418 satır) indirilebilir.", at: ago(130), read: false },
  { id: "4", icon: CreditCard, title: "Kasım faturası ödendi", body: "₺1.249,00 · Kurumsal plan", at: ago(60 * 20), read: true },
  { id: "5", actor: "Deniz Kaya", title: "Deniz Kaya “Ürün Yol Haritası” belgesini paylaştı", at: ago(60 * 26), read: true },
  { id: "6", icon: CalendarClock, title: "Deneme süreniz 4 gün sonra bitiyor", at: ago(60 * 24 * 3), read: true },
];

const MANY: NotificationItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i}`,
  actor: ["Elif Yıldız", "Mert Aksoy", "Deniz Kaya"][i % 3],
  title: `${["Elif Yıldız", "Mert Aksoy", "Deniz Kaya"][i % 3]} FTR-2026-${1190 - i} faturasını onayladı`,
  at: ago(15 + i * 90),
  read: false,
}));

const meta = {
  title: "Bileşenler/Katmanlar/Bildirim Merkezi",
  component: NotificationCenter,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Üst çubuktaki zil ve açılır liste: kullanıcının yokluğunda olanlar güne göre gruplanır, zaman “3 dk önce” biçiminde. Zilin adı okunmamış sayısını da söyler; rozet 9'dan sonra “9+”. Okundu bilgisi çağıranda (`items` + `onMarkRead`); anlık sonuç için `toast` kullan.",
      },
    },
  },
  argTypes: { items: { control: "object" } },
  args: { items: ITEMS, onMarkRead: fn(), onOpen: fn() },
  render: function Render(args) {
    const [{ items }, updateArgs] = useArgs<{ items: NotificationItem[] }>();
    return (
      <Frame width="lg" className="min-h-[36rem]">
        <div className="flex items-center justify-between rounded-xl bg-overlay py-2 pr-2 pl-4 shadow-raised">
          <span className="text-base font-semibold text-strong">Pusula</span>
          <NotificationCenter
            {...args}
            items={items}
            onMarkRead={(ids) => {
              updateArgs({ items: items.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)) });
              args.onMarkRead(ids);
            }}
          />
        </div>
      </Frame>
    );
  },
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan (Kapalı)" };

export const TiklayincaAcilir: Story = {
  name: "Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Bildirimler, 3 okunmamış" }));
    const popup = await screen.findByRole("dialog", { name: /Bildirimler/ });
    await waitFor(() => expect(within(popup).getByRole("heading", { name: "Bugün" })).toBeVisible());
    await settle(globals);
  },
};

export const TumunuOkunduIsaretle: Story = {
  name: "Tümünü Okundu İşaretle",
  tags: ["!autodocs"],
  play: async ({ args, canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Bildirimler, 3 okunmamış" }));
    const popup = await screen.findByRole("dialog", { name: /Bildirimler/ });
    await userEvent.click(within(popup).getByRole("button", { name: "Tümünü Okundu İşaretle" }));
    await expect(args.onMarkRead).toHaveBeenCalledWith(["1", "2", "3"]);
    await waitFor(() => expect(within(canvasElement).getByRole("button", { name: "Bildirimler" })).toBeInTheDocument());
    await settle(globals);
  },
};

export const Bos: Story = {
  name: "Boş (Açık)",
  tags: ["!autodocs"],
  args: { items: [] },
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Bildirimler" }));
    const empty = await screen.findByText("Bildirim yok");
    await waitFor(() => expect(empty).toBeVisible());
    await settle(globals);
  },
};

export const DokuzdanFazla: Story = {
  name: "9'dan Fazla Okunmamış",
  args: { items: MANY },
  play: async ({ canvasElement, globals }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Bildirimler, 9+ okunmamış" })).toHaveTextContent("9+");
    await settle(globals);
  },
};
