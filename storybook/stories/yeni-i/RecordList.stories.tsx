import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Building2, Home, Hotel } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RecordList, type RecordItem } from "@/components/ui/record-list";

const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const Tile = ({ children }: { children: React.ReactNode }) => (
  <span className="grid size-11 place-items-center rounded-lg bg-surface text-muted ring-1 ring-line [&_svg]:size-5">{children}</span>
);

/** Kurgusal satış kayıtları. Numaralar Pusula'nınkilerle çakışmaz (SP-29xx): aynı numara orada başka ürün ve durumla geçiyordu. */
const ROWS = [
  { id: "SP-2914", title: "Lavanta Spa · Peştemal Seti", sub: "Antalya · 60 adet", total: 7480, date: "29 Eki", status: "Teslim Edildi", tone: "success", owner: "Mert Aksoy", buyer: "Deniz Uçar", icon: <Hotel /> },
  { id: "SP-2921", title: "Çınar Kafe Zinciri · Havlu", sub: "Ankara · 120 adet", total: 9120, date: "31 Eki", status: "Kargoda", tone: "primary", owner: "Selin Arslan", buyer: "Gizem Sarı", icon: <Building2 /> },
  { id: "SP-2933", title: "Atlas Konaklama · Bornoz", sub: "İstanbul · 90 adet", total: 16540, date: "1 Kas", status: "Gecikti", tone: "danger", owner: "Mert Aksoy", buyer: "Seda Kılıç", icon: <Home /> },
] as const;

function Demo({ label }: { label: string }) {
  const [opened, setOpened] = useState<string | null>(null);
  const items: RecordItem[] = ROWS.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: (
      <>
        <span className="font-mono text-micro">{r.id}</span> · {r.sub}
      </>
    ),
    leading: <Tile>{r.icon}</Tile>,
    value: tl.format(r.total),
    meta: `Sipariş ${r.date}`,
    status: <Badge tone={r.tone} dot>{r.status}</Badge>,
    people: [
      { role: "Temsilci", name: r.owner, avatar: <Avatar name={r.owner} size="sm" /> },
      { role: "Alıcı", name: r.buyer },
    ],
    onSelect: () => setOpened(r.id),
  }));
  return (
    <div className="mx-auto max-w-md p-4">
      <div className="overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line">
        <RecordList label={label} items={items} />
      </div>
      <p aria-live="polite" className="mt-3 px-1 text-small text-muted">
        {opened ? `${opened} açıldı` : "Bir karta dokun."}
      </p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Veri/Kayıt Listesi",
  id: "record-list",
  component: RecordList,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Tablonun telefondaki hali: her satır üç katlı bir kart (ne · ne zaman ve hangi durumda · kim). `data-table` geniş ekranda kalır, bu liste dar ekranda onun yerine geçer (`max-md:hidden` / `md:hidden`). Ana eylem başlık; kartın tamamı ona genişletilmiş tıklama alanı, ekran okuyucu satır başına tek eylem duyar. Sunucu bileşeni. Assetora turundan (davranış alındı, kod değil). Pusula: Gelen Kutusu telefonda.",
      },
    },
  },
  args: { label: "Siparişler", items: [] },
  render: (args) => <Demo label={args.label} />,
} satisfies Meta<typeof RecordList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Satış Kayıtları",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("list", { name: "Siparişler" }).querySelectorAll("li")).toHaveLength(3);
    await userEvent.click(canvas.getByRole("button", { name: /Atlas Konaklama/ }));
    await canvas.findByText("SP-2933 açıldı");
  },
};
