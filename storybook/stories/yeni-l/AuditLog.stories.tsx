import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { AuditLog, type AuditEntry } from "@/components/ui/audit-log";

const entries: AuditEntry[] = [
  { id: "1", at: "2026-11-21T10:41:00+03:00", when: "21 Kas, 10:41", actor: "Aylin Yıldırım", actorDetail: "Yönetici", action: "tarifeyi güncelledi", target: "T-AG-KONUT", before: "₺3,12 / kWh", after: "₺3,28 / kWh" },
  { id: "2", at: "2026-11-21T10:36:00+03:00", when: "21 Kas, 10:36", actor: "Mert Kaplan", actorDetail: "Tahsilat", action: "ödeme girdi", target: "F-202610-0083", after: "₺6.202,37 · Banka" },
  { id: "3", at: "2026-11-21T10:12:00+03:00", when: "21 Kas, 10:12", actor: "Selin Acar", actorDetail: "Denetçi", action: "tarife değiştirmeyi denedi", target: "T-AG-KONUT", after: "Denetçi rolünde tarife değiştirme yetkisi yok", denied: true },
  { id: "4", at: "2026-11-21T09:50:00+03:00", when: "21 Kas, 09:50", actor: "Aylin Yıldırım", action: "giriş yaptı" },
];

const meta = {
  title: "Bileşenler/Veri/Denetim Kaydı",
  id: "audit-log",
  component: AuditLog,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Hesabın/sistemin değişiklik geçmişi: kim, ne zaman, neyi, ÖNCE → SONRA. Reddedilen deneme renkle değil \"Reddedildi\" metni ve ikonla işaretlenir. Günlük değişmezdir: bileşen yalnız okur; süzgeç ve dışa aktarma `toolbar` yuvasında. Zaman çağıranda (`at` ISO + `when` metin; hidrasyon uyuşmazlığı olmasın). Bir kaydın kendi geçmişi için `timeline`. Kuzeyova portalı Denetim Günlüğü.",
      },
    },
  },
  args: { entries },
  render: (args) => (
    <div className="mx-auto max-w-2xl p-6">
      <AuditLog {...args} />
    </div>
  ),
} satisfies Meta<typeof AuditLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Değişiklik Geçmişi",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("list", { name: "Denetim Günlüğü" })).toBeInTheDocument();
    await expect(canvas.getByText("Reddedildi")).toBeInTheDocument();
    await expect(canvas.getAllByText("Önce:", { exact: false }).length).toBeGreaterThan(0);
  },
};

export const Empty: Story = { name: "Kayıt Yok", args: { entries: [] } };
