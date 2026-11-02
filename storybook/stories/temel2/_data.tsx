import { Badge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/data-table";

/* temel2 hikâyelerinin ortak, gerçekçi Türkçe verisi (vitrin ile aynı dünya). */

export type Order = {
  id: string;
  customer: string;
  city: string;
  total: number;
  change: number;
  status: "done" | "pending" | "late";
};

export const ORDERS: Order[] = [
  { id: "SP-2041", customer: "Elif Karaca", city: "İzmir", total: 4820, change: 12.4, status: "done" },
  { id: "SP-2042", customer: "Mert Aydın", city: "Ankara", total: 1260, change: -3.1, status: "pending" },
  { id: "SP-2043", customer: "Zeynep Öztürk", city: "Bursa", total: 9375, change: 28.6, status: "done" },
  { id: "SP-2044", customer: "Can Yıldız", city: "Trabzon", total: 640, change: -14.2, status: "late" },
  { id: "SP-2045", customer: "İlker Şahin", city: "Eskişehir", total: 3150, change: 4.8, status: "done" },
  { id: "SP-2046", customer: "Ece Koç", city: "Antalya", total: 2290, change: 0.6, status: "pending" },
];

export const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
export const signedPercent = (n: number) => `${n > 0 ? "+" : n < 0 ? "\u2212" : ""}%${pct.format(Math.abs(n))}`;

const STATUS = {
  done: (
    <Badge tone="success" dot>
      Tamamlandı
    </Badge>
  ),
  pending: (
    <Badge tone="warning" dot>
      Bekliyor
    </Badge>
  ),
  late: (
    <Badge tone="danger" dot>
      Gecikti
    </Badge>
  ),
} as const;

export const ORDER_COLUMNS: Column<Order>[] = [
  { key: "customer", header: "Müşteri", sortable: true, sortValue: (r) => r.customer },
  { key: "city", header: "Şehir", sortable: true, sortValue: (r) => r.city },
  { key: "status", header: "Durum", render: (r) => STATUS[r.status] },
  {
    key: "total",
    header: "Tutar",
    numeric: true,
    sortable: true,
    sortValue: (r) => r.total,
    render: (r) => money.format(r.total),
  },
];

/** Karşılaştırma çubuklu sütunlar: tutar (nötr ölçek) ve değişim (işaretli). */
export const BAR_COLUMNS: Column<Order>[] = [
  ORDER_COLUMNS[0],
  ORDER_COLUMNS[1],
  { ...ORDER_COLUMNS[3], bar: { value: (r) => r.total } },
  {
    key: "change",
    header: "Aylık Değişim",
    numeric: true,
    sortable: true,
    sortValue: (r) => r.change,
    render: (r) => signedPercent(r.change),
    bar: { value: (r) => r.change, tone: "signal" },
  },
];

export const CITIES = [
  "Adana",
  "Ankara",
  "Antalya",
  "Bursa",
  "Diyarbakır",
  "Eskişehir",
  "Iğdır",
  "İstanbul",
  "İzmir",
  "Kayseri",
  "Trabzon",
  "Van",
].map((c) => ({ value: c.toLocaleLowerCase("tr-TR"), label: c }));

export const TEAM = [
  { name: "Ayşe Demir" },
  { name: "Mert Aydın" },
  { name: "İlker Şahin" },
  { name: "Zeynep Öztürk" },
  { name: "Can Yıldız" },
  { name: "Ece Koç" },
  { name: "Burak Ural" },
];
