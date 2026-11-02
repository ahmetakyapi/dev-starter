import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type MouseEvent } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { DataTable, sortRows, type SortDir, type SortState } from "@/components/ui/data-table";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { BAR_COLUMNS, ORDERS, ORDER_COLUMNS, type Order } from "./_data";

const OrderTable = DataTable<Order>;
const sortHref = (key: string, dir: SortDir) => `?sort=${key}&dir=${dir}`;

const meta = {
  title: "Bileşenler/Veri/Veri Tablosu",
  component: OrderTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sunucu bileşeni veri tablosu: sıralama adreste (`?sort=&dir=`), dar ekranda kap yatay kayar ve ilk sütun yapışkan kalır. Sayılar sağa yaslı ve `tabular-nums`; karşılaştırma çubuğu (`bar`) yalnızca karşılaştırılabilir ölçülerde verilir. Yükleniyor, hata ve boş durumları tablonun yerini tutar, sayfa zıplamaz.",
      },
    },
  },
  args: {
    caption: "Son Siparişler",
    columns: ORDER_COLUMNS,
    rows: ORDERS,
    rowKey: (r: Order) => r.id,
    sortHref,
    density: "comfortable",
    stickyFirst: true,
    on: "surface",
    minWidth: "34rem",
    state: "ready",
    loadingRows: 5,
  },
  argTypes: {
    density: { control: "inline-radio", options: ["compact", "comfortable"] },
    on: { control: "inline-radio", options: ["page", "surface"] },
    state: { control: "inline-radio", options: ["ready", "loading", "error"] },
    columns: { control: false },
    rows: { control: false },
  },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="xl">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof OrderTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

/* Sıralama adreste; Storybook'ta adres değişmediği için tıklama burada
   yakalanır ve aynı `?sort=&dir=` bağlantısı duruma çevrilir. */
function SortableDemo() {
  const [sort, setSort] = useState<SortState>({ key: "total", dir: "desc" });
  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    event.preventDefault();
    const params = new URLSearchParams(link.getAttribute("href")?.split("?")[1]);
    const key = params.get("sort");
    const dir = params.get("dir");
    if (key && (dir === "asc" || dir === "desc")) setSort({ key, dir });
  }
  return (
    <div onClickCapture={onClickCapture}>
      <DataTable
        caption="Son Siparişler"
        columns={ORDER_COLUMNS}
        rows={sortRows(ORDERS, ORDER_COLUMNS, sort)}
        rowKey={(r) => r.id}
        sort={sort}
        sortHref={sortHref}
        minWidth="34rem"
      />
    </div>
  );
}

export const Siralama: Story = {
  name: "Sıralama",
  render: () => <SortableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const total = canvas.getByRole("columnheader", { name: /Tutar/ });
    await expect(total).toHaveAttribute("aria-sort", "descending");
    const customer = canvas.getByRole("columnheader", { name: /Müşteri/ });
    await userEvent.click(within(customer).getByRole("link"));
    await expect(customer).toHaveAttribute("aria-sort", "descending");
    await expect(total).not.toHaveAttribute("aria-sort");
    await userEvent.click(within(customer).getByRole("link"));
    await expect(customer).toHaveAttribute("aria-sort", "ascending");
    const firstRow = canvas.getAllByRole("row")[1];
    await expect(within(firstRow).getByRole("rowheader")).toHaveTextContent("Can Yıldız");
  },
};

export const KarsilastirmaCubugu: Story = {
  name: "Karşılaştırma Çubuğu",
  args: { columns: BAR_COLUMNS as typeof ORDER_COLUMNS, caption: "Şube Cirosu", sort: { key: "total", dir: "desc" }, rows: sortRows(ORDERS, BAR_COLUMNS, { key: "total", dir: "desc" }) },
  parameters: {
    docs: {
      description: {
        story:
          "Tutar sütununda nötr ölçek çubuğu; değişim sütununda eksi değer olduğu için sıfır ortada ve renk yalnızca işaretten gelir (`tone: \"signal\"`).",
      },
    },
  },
};

export const Bos: Story = {
  name: "Boş",
  args: { rows: [], empty: "Bu aralıkta sipariş yok. Tarih aralığını genişletmeyi dene." },
};

export const Yukleniyor: Story = { name: "Yükleniyor", args: { state: "loading" } };

export const Hata: Story = {
  name: "Hata",
  args: {
    state: "error",
    error: "Siparişler alınamadı. Bağlantını kontrol edip tekrar dene.",
    errorAction: (
      <Button variant="secondary" size="sm">
        Tekrar Dene
      </Button>
    ),
  },
};

export const Sik: Story = { name: "Sık Yerleşim", args: { density: "compact" } };

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Rahat (varsayılan)" className="place-items-stretch">
        <DataTable caption="Rahat" columns={ORDER_COLUMNS} rows={ORDERS.slice(0, 3)} rowKey={(r) => r.id} minWidth="30rem" />
      </Cell>
      <Cell label="Sık" className="place-items-stretch">
        <DataTable caption="Sık" density="compact" columns={ORDER_COLUMNS} rows={ORDERS.slice(0, 3)} rowKey={(r) => r.id} minWidth="30rem" />
      </Cell>
      <Cell label="Yükleniyor" className="place-items-stretch">
        <DataTable caption="Yükleniyor" state="loading" loadingRows={3} columns={ORDER_COLUMNS} rows={[]} rowKey={(r) => r.id} minWidth="30rem" />
      </Cell>
      <Cell label="Boş" className="place-items-stretch">
        <DataTable caption="Boş" columns={ORDER_COLUMNS} rows={[]} rowKey={(r) => r.id} minWidth="30rem" />
      </Cell>
    </Gallery>
  ),
};
