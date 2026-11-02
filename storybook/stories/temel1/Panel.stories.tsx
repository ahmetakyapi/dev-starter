import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight } from "lucide-react";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const INVOICES = [
  { id: "FTR-2026-1184", customer: "Acme Lojistik", amount: "₺18.420,00", status: "Ödendi" },
  { id: "FTR-2026-1183", customer: "Deniz Yazılım", amount: "₺6.250,00", status: "Bekliyor" },
  { id: "FTR-2026-1179", customer: "Kuzey Mimarlık", amount: "₺12.900,00", status: "Ödendi" },
];

function InvoiceList() {
  return (
    <ul className="divide-y divide-line-soft">
      {INVOICES.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-strong">{row.customer}</p>
            <p className="font-mono text-small text-muted">{row.id}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-semibold text-strong tabular-nums">{row.amount}</p>
            <p className="text-small text-muted">{row.status}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const meta = {
  title: "Bileşenler/Temel/Panel",
  id: "panel",
  component: Panel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfanın temel yüzeyi: derinlik gölgeyle değil ton farkı ve tek piksellik çizgiyle kurulur. Her panelin bir `PanelHeader` başlığı (h2) olur; başlıksız panelin nerede başladığını ekran okuyucu anlamaz.",
      },
    },
  },
  render: (args) => (
    <Frame width="lg">
      <Panel {...args} />
    </Frame>
  ),
  args: {
    children: (
      <>
        <PanelHeader
          title="Son Faturalar"
          meta="Ekim 2026 · 3 Kayıt"
          action={
            <ButtonLink href="/faturalar" variant="ghost" size="sm">
              Tümü
              <ArrowUpRight aria-hidden />
            </ButtonLink>
          }
        />
        <InvoiceList />
      </>
    ),
  },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const TitleOnly: Story = {
  name: "Yalnızca Başlık",
  args: {
    children: (
      <>
        <PanelHeader title="Ekip Notları" />
        <p className="text-base text-body">Cuma toplantısında kasım bütçesi ve yeni müşteri sözleşmeleri konuşulacak.</p>
      </>
    ),
  },
};

export const LongTitle: Story = {
  name: "Uzun Başlık ve Eylem",
  args: {
    children: (
      <>
        <PanelHeader
          title="Bölgelere Göre Üçüncü Çeyrek Satış ve Tahsilat Özeti"
          meta="Son Güncelleme 2 Saat Önce · Muhasebe Ekibi"
          action={
            <Button variant="secondary" size="sm">
              Dışa Aktar
            </Button>
          }
        />
        <InvoiceList />
      </>
    ),
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Başlık + Künye + Eylem" className="block">
        <Panel>
          <PanelHeader title="Son Faturalar" meta="Ekim 2026" action={<Button variant="ghost" size="sm">Tümü</Button>} />
          <InvoiceList />
        </Panel>
      </Cell>
      <Cell label="Yalnızca Başlık" className="block">
        <Panel>
          <PanelHeader title="Ekip Notları" />
          <p className="text-base text-body">Cuma toplantısında kasım bütçesi konuşulacak.</p>
        </Panel>
      </Cell>
      <Cell label="Sayı Kartı" className="block">
        <Panel>
          <PanelHeader title="Aylık Gelir" meta="Geçen Aya Göre" />
          <p className="text-display font-bold text-strong tabular-nums">₺284.150</p>
          <p className="mt-1 text-small text-success">%12,4 artış</p>
        </Panel>
      </Cell>
      <Cell label="Cam Yüzey (glass)" className="block">
        <Panel className="glass">
          <PanelHeader title="Canlı Ziyaretçi" meta="Son 5 Dakika" />
          <p className="text-display font-bold text-strong tabular-nums">142</p>
        </Panel>
      </Cell>
    </Gallery>
  ),
};
