import { CalendarClock, Inbox, Megaphone } from "lucide-react";
import type { ReactNode } from "react";
import { AppWindow } from "@/components/ui/app-window";
import { Badge } from "@/components/ui/badge";

/**
 * Sakin Akış turunun ortak sahneleri: çalışma kartlarının içinde ekran
 * görüntüsü ya da video yerine katalogdaki bileşenlerle çizilmiş küçük
 * ekranlar (Kıyı Kahve kurgusu). Palet ve temayla döner.
 */

function Booking() {
  return (
    <div className="grid w-full max-w-md gap-2 rounded-xl bg-overlay p-3 shadow-raised ring-1 ring-line">
      <p className="text-small text-muted">Rezervasyon Bağlantıları</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["15", "Kısa Tadım"],
          ["30", "Tanışma"],
          ["60", "Kavrum Atölyesi"],
        ].map(([min, name]) => (
          <div key={name} className="grid gap-2 rounded-lg bg-surface p-2.5">
            <span className="text-title leading-none text-strong tabular-nums">
              {min} <span className="text-small text-muted">dk</span>
            </span>
            <span className="truncate border-l-2 border-primary pl-1.5 text-small text-strong">{name}</span>
            <span className="text-micro text-soft">Hafta içi · 09-17</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tickets() {
  return (
    <AppWindow title="Kıyı Kahve · Talepler" icon={<Inbox className="size-3.5" />} className="w-full max-w-md">
      <ul className="grid gap-1 p-2.5 text-small">
        {[
          ["KK-104", "Öğütücü ayarı kaydı", "warning", "Bekliyor"],
          ["KK-105", "Şube stok aktarımı", "success", "Çözüldü"],
          ["KK-106", "Fiş yazıcısı çevrimdışı", "danger", "Acil"],
        ].map(([id, title, tone, label]) => (
          <li key={id} className="flex items-center gap-2 rounded-md px-2 py-1.5 odd:bg-surface">
            <span className="font-mono text-micro text-soft">{id}</span>
            <span className="min-w-0 flex-1 truncate text-strong">{title}</span>
            <Badge tone={tone as "warning" | "success" | "danger"}>{label}</Badge>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}

function Broadcast() {
  return (
    <div className="grid w-full max-w-sm gap-2 rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line">
      <span className="flex items-center gap-2 text-small text-muted">
        <Megaphone aria-hidden className="size-3.5" /> Duyuru
      </span>
      <p className="text-body font-medium text-strong">Cumartesi kavrumhane bakımda</p>
      <p className="text-small text-muted">Siparişler pazartesi sabahı sırayla kavrulur; şubeler stoklarını cuma akşamı tamamlasın.</p>
    </div>
  );
}

function Schedule() {
  return (
    <div className="grid w-full max-w-xs gap-1.5 rounded-xl bg-overlay p-3 shadow-raised ring-1 ring-line">
      <span className="flex items-center gap-2 text-small text-muted">
        <CalendarClock aria-hidden className="size-3.5" /> Bugün
      </span>
      {["08.30 Kavrum · Lot 44", "11.00 Tadım · Alsancak", "15.30 Sevkiyat"].map((row) => (
        <span key={row} className="rounded-md bg-surface px-2 py-1.5 text-small text-strong">
          {row}
        </span>
      ))}
    </div>
  );
}

export type Work = {
  id: string;
  title: string;
  description: string;
  meta: readonly string[];
  ratio: number;
  tags: { project: string; kind: string };
  scene: () => ReactNode;
};

export const WORKS: readonly Work[] = [
  { id: "booking", title: "Rezervasyon Bağlantıları", description: "Üç süreli tadım randevusu, tek bağlantı.", meta: ["2026", "Ürün"], ratio: 16 / 10, tags: { project: "kiyi", kind: "urun" }, scene: Booking },
  { id: "tickets", title: "Şube Talepleri", description: "Kavrumhaneye gelen arıza ve stok talepleri.", meta: ["2026", "Ürün"], ratio: 4 / 3, tags: { project: "kiyi", kind: "urun" }, scene: Tickets },
  { id: "broadcast", title: "Şube Duyurusu", description: "Bütün şubelere giden tek bir not.", meta: ["2025", "İçerik"], ratio: 1, tags: { project: "liman", kind: "icerik" }, scene: Broadcast },
  { id: "schedule", title: "Günün Akışı", description: "Kavrum, tadım ve sevkiyat tek sütunda.", meta: ["2025", "Ürün"], ratio: 3 / 4, tags: { project: "liman", kind: "urun" }, scene: Schedule },
  { id: "booking-2", title: "Atölye Kaydı", description: "Kavrum atölyesine kontenjanlı kayıt.", meta: ["2024", "Marka"], ratio: 16 / 9, tags: { project: "kiyi", kind: "marka" }, scene: Booking },
  { id: "tickets-2", title: "Arıza Takibi", description: "Ekipman arızası, sorumlu ve süre.", meta: ["2024", "Ürün"], ratio: 5 / 4, tags: { project: "liman", kind: "urun" }, scene: Tickets },
];

export const FILTERS = [
  { key: "project", label: "Proje", options: [{ value: "kiyi", label: "Kıyı Kahve" }, { value: "liman", label: "Liman Fırın" }] },
  { key: "kind", label: "Tür", options: [{ value: "urun", label: "Ürün" }, { value: "icerik", label: "İçerik" }, { value: "marka", label: "Marka" }] },
] as const;
