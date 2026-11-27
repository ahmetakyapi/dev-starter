import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { STATUSES, STATUS_LABEL, StatusIcon, StatusPicker, type Status } from "@/components/ui/status-icon";

const TICKETS: { id: string; title: string; status: Status }[] = [
  { id: "PS-210", title: "Fatura adresi güncellenmiyor", status: "triage" },
  { id: "PS-211", title: "Ekip daveti ulaşmadı", status: "todo" },
  { id: "PS-212", title: "Ödeme iki kez çekildi", status: "progress" },
  { id: "PS-213", title: "İade onayı muhasebede", status: "blocked" },
  { id: "PS-214", title: "Kargo takip bağlantısı", status: "done" },
  { id: "PS-215", title: "Yinelenen kayıt", status: "cancelled" },
];

function Picker() {
  const [value, setValue] = useState<Status>("progress");
  return (
    <div className="grid min-h-72 content-start justify-items-start gap-3">
      <StatusPicker value={value} onValueChange={setValue} />
      <p className="text-small text-muted">
        Seçili: <span className="text-strong">{STATUS_LABEL[value]}</span>
      </p>
    </div>
  );
}

function List() {
  return (
    <ul className="grid w-[min(100%,26rem)] overflow-hidden rounded-xl bg-overlay ring-1 ring-line">
      {TICKETS.map((t) => (
        <li key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-small">
          <StatusIcon status={t.status} label={`Durum: ${STATUS_LABEL[t.status]}`} />
          <span className="font-mono text-micro text-soft">{t.id}</span>
          <span className="min-w-0 flex-1 truncate text-strong">{t.title}</span>
        </li>
      ))}
    </ul>
  );
}

const meta = {
  title: "Bileşenler/Veri/Durum İkonu",
  id: "status-icon",
  component: StatusIcon,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "İş ya da talep durumunu ŞEKİLLE söyleyen ikon: Ön İnceleme kesik daire, Yapılacak halka, Sürüyor yarım dolu, Engelli duraklat, Tamamlandı tik, İptal çapraz. Renk ikinci işaret (renk körlüğüne dayanıklı). Durum değişince yay dolar, tik çizilir (280 ms; hareket azaltmada anında). `StatusPicker`: gri hap tetikleyici + klavyeyle gezilen liste. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { status: "progress", label: "Durum: Sürüyor" },
  argTypes: { status: { control: "inline-radio", options: STATUSES } },
  render: (args) => <StatusIcon {...args} size={24} />,
} satisfies Meta<typeof StatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "Durum: Sürüyor" })).toBeInTheDocument();
  },
};

export const InList: Story = {
  name: "Talep Listesinde",
  render: () => <List />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("img")).toHaveLength(6);
    await expect(canvas.getByRole("img", { name: "Durum: Engelli" })).toBeInTheDocument();
  },
};

export const Selector: Story = {
  name: "Durum Seçici",
  render: () => <Picker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Durum: Sürüyor" });
    await userEvent.click(trigger);
    const list = await canvas.findByRole("listbox", { name: "Durum" });
    await waitFor(() => expect(list).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Durum: Engelli" })).toHaveFocus());
    // Harfle atlama: "t" → Tamamlandı.
    await userEvent.keyboard("{ArrowDown}");
    await canvas.findByRole("listbox");
    await userEvent.keyboard("t{Enter}");
    await expect(canvas.getByRole("button", { name: "Durum: Tamamlandı" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Durum: Tamamlandı" }));
    await canvas.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("listbox")).not.toBeInTheDocument());
  },
};
