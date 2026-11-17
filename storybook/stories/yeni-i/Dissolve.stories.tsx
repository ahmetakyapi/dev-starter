import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Trash2 } from "lucide-react";
import { dissolveOut } from "@/components/ui/dissolve";

const START = [
  { id: "a", title: "Kargo bağlantısı hız sınırı uyarıları", meta: "Sistem · 2 sa önce" },
  { id: "b", title: "Haftalık özet: 28 sipariş, ₺307.300 ciro", meta: "Özet · Pazartesi 09.00" },
  { id: "c", title: "Selin Arslan bir randevu ekledi", meta: "Takvim · Dün 16.20" },
];

function Demo() {
  const [items, setItems] = useState(START);
  const [said, setSaid] = useState("");
  return (
    <div className="mx-auto max-w-lg p-6">
      <ul className="grid gap-1 rounded-xl bg-overlay p-2 shadow-raised ring-1 ring-line">
        {items.map((it) => (
          <li key={it.id} data-row={it.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base text-strong">{it.title}</span>
              <span className="block text-small text-muted">{it.meta}</span>
            </span>
            <button
              type="button"
              aria-label={`Kaldır: ${it.title}`}
              onClick={async (e) => {
                const row = e.currentTarget.closest("li") as HTMLElement;
                await dissolveOut(row);
                setItems((list) => list.filter((x) => x.id !== it.id));
                setSaid(`${it.title} kaldırıldı`);
              }}
              className="inline-grid size-9 place-items-center rounded-md text-muted hover:bg-danger-wash hover:text-danger [&_svg]:size-4"
            >
              <Trash2 aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-3 text-small text-muted">
        {said || "Bir satırı kaldır."}
      </p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Hareket ve Doku/Dağılarak Çıkış",
  id: "dissolve",
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Onaylanmış bir kaldırmada öğe tanecik tanecik dağılır, sonra listeden çıkar: kaldırmanın gerçekten olduğunu gözle söyler. Gerçek öğeye SVG gürültü maskesi uygulanır (kanvasa yeniden çizim yok, her bileşenle çalışır); hareketi azaltanda 150 ms solma. `dissolveOut(el)` ya da `useDissolve()`. Pusula: Bildirimler → Bu Konuyu Sessize Al.",
      },
    },
  },
  render: () => <Demo />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Satır Kaldırma",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Kaldır: Haftalık özet/ }));
    // Satır listeden çıkar (duyuru metni adı taşıdığı için satır sayısıyla denetlenir).
    await waitFor(() => expect(canvasElement.querySelectorAll("li[data-row]")).toHaveLength(2), { timeout: 3000 });
    await expect(canvas.getByText(/kaldırıldı/)).toBeInTheDocument();
  },
};
