import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Avatar } from "@/components/ui/avatar";
import { PhaseChecklist, type PhaseGroup } from "@/components/ui/phase-checklist";

const who = (name: string) => <Avatar name={name} size="sm" className="size-5 text-[0.5rem]" />;

const GROUPS: PhaseGroup[] = [
  {
    id: "once",
    title: "İlk Günden Önce",
    items: [
      { id: "laptop", title: "Dizüstü bilgisayarı gönder", kind: "form", state: "locked", assignee: who("Kerem Arıkan") },
      { id: "bordro", title: "Bordro ve yan haklar kaydı", kind: "flow", state: "locked", waitingOn: { label: "Dizüstü bilgisayarı gönder" }, assignee: who("Selin Başaran") },
    ],
  },
  {
    id: "ilk-gun",
    title: "İlk Gün",
    items: [
      { id: "rehber", title: "Rehberle tanış", kind: "scheduled", state: "locked", unlocksAt: "2026-11-28", assignee: who("Ece Doğan") },
      { id: "kanallar", title: "Ekip kanallarına katıl", kind: "manual", state: "locked", waitingOn: { label: "Rehberle tanış" }, assignee: who("Onur Tekin") },
      { id: "guvenlik", title: "Güvenlik ve BT ilkelerini imzala", kind: "flow", state: "locked", unlocksAt: "2026-11-28", assignee: who("Kerem Arıkan") },
    ],
  },
  {
    id: "ilk-hafta",
    title: "İlk Hafta",
    items: [
      { id: "masraf", title: "Masraf profilini kur", kind: "manual", state: "locked", waitingOn: { label: "Bordro ve yan haklar kaydı" }, assignee: who("Selin Başaran") },
      { id: "ilk-talep", title: "İlk talebi birlikte yanıtla", kind: "scheduled", state: "locked", unlocksAt: "2026-12-02", assignee: who("Ece Doğan") },
    ],
  },
];

const meta = {
  title: "Bileşenler/Verimlilik/Aşamalı Kontrol Listesi",
  id: "phase-checklist",
  component: PhaseChecklist,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bağımlılıkla açılan işler: aşamalar düğüm çizelgesiyle bağlı, sayaç \"1/3\". İş Kilitli (\"↳ Bekliyor: X\" ya da açılış tarihi), Hazır (açık birincil zemin + Tamamla) ya da Tamamlandı. Tamamlanınca sıradaki iş Hazır olur, biten aşama katlanır ve sıradaki açılır; her değişim canlı bölgede okunur. `autoplay` tanıtım için kendiliğinden ilerler, Durdur butonuyla durur; hareket azaltmada kapalı. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { label: "İşe Başlama", groups: GROUPS },
  render: (args) => (
    <div className="w-[min(100vw-2rem,36rem)]">
      <PhaseChecklist {...args} />
    </div>
  ),
} satisfies Meta<typeof PhaseChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "Tamamla: Dizüstü bilgisayarı gönder" });
    await userEvent.click(first);
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Dizüstü bilgisayarı gönder tamamlandı, 1/2"));
    await userEvent.click(canvas.getByRole("button", { name: "Tamamla: Bordro ve yan haklar kaydı" }));
    // Aşama bitti: katlanır, sıradaki aşama açılır ve ilk işi Hazır olur.
    await waitFor(() => expect(canvas.getByRole("button", { name: /İlk Günden Önce/ })).toHaveAttribute("aria-expanded", "false"));
    await expect(canvas.getByRole("button", { name: /^İlk Gün\b/ })).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("button", { name: "Tamamla: Rehberle tanış" })).toBeInTheDocument();
  },
};

export const Autoplay: Story = {
  name: "Kendiliğinden İlerleyen",
  args: { autoplay: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pause = canvas.queryByRole("button", { name: "Durdur" });
    // Hareket azaltmada otomatik oynatma ve buton yok.
    if (!pause) return;
    await userEvent.click(pause);
    await expect(canvas.getByRole("button", { name: "Oynat" })).toHaveAttribute("aria-pressed", "true");
  },
};
