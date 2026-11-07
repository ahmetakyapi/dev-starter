import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, Compass, Folder, Inbox, ListChecks, Mail, Music, NotebookPen } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Dock, type DockItem } from "@/components/ui/dock";
import { Frame } from "../_lib/Frame";

const ITEMS: DockItem[] = [
  { id: "dosyalar", label: "Dosyalar", icon: <Folder className="text-body" />, active: true },
  { id: "tarayici", label: "Tarayıcı", icon: <Compass className="text-body" />, active: true },
  { id: "gelen", label: "Gelen Kutusu", icon: <Inbox className="text-body" /> },
  { id: "takvim", label: "Takvim", icon: <CalendarDays className="text-body" /> },
  { id: "gorevler", label: "Görevler", icon: <ListChecks className="text-body" />, active: true },
  { id: "notlar", label: "Notlar", icon: <NotebookPen className="text-body" /> },
  { id: "posta", label: "Posta", icon: <Mail className="text-body" /> },
  { id: "muzik", label: "Müzik", icon: <Music className="text-body" /> },
];

function Interactive() {
  const [active, setActive] = useState("gelen");
  return (
    <div className="grid justify-items-center gap-4">
      <Dock label="Uygulamalar" items={ITEMS.map((i) => ({ ...i, active: i.id === active }))} onSelect={setActive} />
      <p className="text-small text-muted" aria-live="polite">
        Açık: {ITEMS.find((i) => i.id === active)?.label}
      </p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Uygulama Rafı",
  id: "dock",
  component: Dock,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Altta cam rafta simgeler: üzerine gelinen yükselir, komşuları da biraz (yalnız CSS, `:has()`). Açık uygulamanın altında nokta. `onSelect` yoksa süs (`aria-hidden`), varsa simgeler gerçek düğme ve raf `toolbar`. Büyüme yalnız ince işaretçide ve hareketi azaltmayanda.",
      },
    },
  },
  args: { items: ITEMS },
  render: (args) => (
    <Frame width="lg">
      <Dock {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Dock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Süs (Maket)" };

export const Selectable: Story = {
  name: "Seçilebilir",
  render: () => (
    <Frame width="lg">
      <Interactive />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Takvim" }));
    await expect(canvas.getByText("Açık: Takvim")).toBeInTheDocument();
  },
};
