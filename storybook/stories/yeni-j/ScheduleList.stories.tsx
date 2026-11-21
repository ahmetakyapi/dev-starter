import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GitBranch, Hash, MessageCircle, NotebookPen } from "lucide-react";
import { expect, within } from "storybook/test";
import { ScheduleList } from "@/components/ui/schedule-list";

const ITEMS = [
  { id: "1", at: "2026-11-18T12:00", time: "12:00", day: "Bugün", title: "Destek sınıflandırma", detail: "Sonra 20:00'ye kadar her saat", color: 4, apps: <MessageCircle /> },
  { id: "2", at: "2026-11-19T08:00", time: "08:00", day: "Per 19", title: "Kayıp riski özeti", detail: "#basari kanalına yazar", color: 3, apps: <Hash /> },
  { id: "3", at: "2026-11-20T16:00", time: "16:00", day: "Cum 20", title: "Sürüm notu taslağı", detail: "Birleşen değişikliklerden Notion'a yazar", color: 5, apps: <><GitBranch /><NotebookPen /></> },
  { id: "4", at: "2026-11-23T09:00", time: "09:00", day: "Pzt 23", title: "Haftalık geri bildirim özeti", detail: "#urun kanalına yazar", color: 2, apps: <Hash /> },
] as const;

const meta = {
  title: "Bileşenler/Veri/Sıradakiler Listesi",
  id: "schedule-list",
  component: ScheduleList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Yaklaşan işlerin zaman sırasıyla dökümü: solda saat ve gün, ince renkli çubuk (aynı iş aynı renk), başlık ve tek satır açıklama, sağda uygulama ikonları. Her saat bir `<time dateTime>`. Geçmiş akış için `timeline`, saat ızgarası için `week-calendar`. Sunucu bileşeni. baobun.studio turundan.",
      },
    },
  },
  args: { items: ITEMS, label: "Sıradakiler" },
  render: (args) => (
    <div className="mx-auto max-w-lg rounded-xl bg-surface p-4">
      <ScheduleList {...args} />
    </div>
  ),
} satisfies Meta<typeof ScheduleList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Sıradakiler",
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Sıradakiler" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    await expect(within(list).getByText("08:00").closest("time")).toHaveAttribute("datetime", "2026-11-19T08:00");
  },
};
