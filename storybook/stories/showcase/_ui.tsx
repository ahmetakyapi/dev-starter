"use client";

import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { LayoutGrid } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import type { BoardColumn, Period } from "./_data";
import type { FeedItem } from "./_bildirim";
import { cn } from "@/lib/utils";

/**
 * Pusula'nın sayfaları arasında paylaşılan durum ve iki küçük kalıp.
 * Gezinme adresi `?view=<sayfa>&...` biçiminde (İngilizce, küçük harf, ASCII: `?view=inbox&tag=gecikme&ticket=PSL-1186&page=2`): kabuğun bağlantıları gerçek
 * `<a href>`; uygulama tıklamayı yakalayıp sayfayı iç durumla değiştirir
 * (Storybook'ta adres çubuğu yok, ama bağlantı semantiği ve klavye doğru kalır).
 */

export type Page = "dashboard" | "inbox" | "tasks" | "calendar" | "assistant" | "reports" | "notifications" | "settings";
export type Params = Readonly<Record<string, string>>;

export const PAGES: readonly { id: Page; label: string }[] = [
  { id: "dashboard", label: "Pano" },
  { id: "inbox", label: "Gelen Kutusu" },
  { id: "tasks", label: "Görevler" },
  { id: "calendar", label: "Takvim" },
  { id: "assistant", label: "Asistan" },
  { id: "reports", label: "Raporlar" },
  { id: "notifications", label: "Bildirimler" },
  { id: "settings", label: "Ayarlar" },
];

/**
 * Adres parçası: küçük harf, ASCII, tireli ("Web Mağaza" → "web-magaza").
 * Türkçe harf adreste yüzde kaçışına döner (`%C3%96deme`); paylaşılan
 * bağlantı okunmaz olur. Değer adreste slug, ekranda asıl ad.
 */
export const slug = (text: string) =>
  text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[ch]!)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Slug'ı listedeki asıl ada çevirir; tanınmayan değer `undefined` (adres elle bozulmuşsa). */
export const fromSlug = <T extends string>(list: readonly T[], value: string | undefined) =>
  value ? list.find((item) => slug(item) === value) : undefined;

export const href = (page: Page, params: Record<string, string | undefined> = {}) => {
  const q = new URLSearchParams({ view: page });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, v);
  return `?${q.toString()}`;
};

export type Toast = {
  id: number;
  title: string;
  body?: string;
  tone: "success" | "info";
  /** Verilirse bildirimde "Geri Al" butonu (silme, arşivleme). */
  undo?: () => void;
};

type AppState = {
  page: Page;
  params: Params;
  navigate: (page: Page, params?: Record<string, string | undefined>) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  /** Zil kutusunun satırları: `feed`ten türer (ayrı liste yok). */
  notifications: readonly NotificationItem[];
  markRead: (ids: string[]) => void;
  /** Tek bildirim kaydı: Bildirimler sayfası, zil ve kenar çubuğu rozeti. */
  feed: readonly FeedItem[];
  setFeed: Dispatch<SetStateAction<FeedItem[]>>;
  snoozed: readonly FeedItem[];
  setSnoozed: Dispatch<SetStateAction<FeedItem[]>>;
  /** Kısa bildirim (sağ altta, `toast`) + bildirim merkezine kayıt. */
  notify: (toast: Omit<Toast, "id">) => void;
  /** Ekip panosu: Görevler sayfası, kenar çubuğu rozeti ve başlık aynı durumdan okur; sayfadan çıkınca kaybolmaz. */
  board: readonly BoardColumn[];
  setBoard: Dispatch<SetStateAction<readonly BoardColumn[]>>;
};

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Pusula sayfaları <PusulaApp> içinde çizilir.");
  return ctx;
}

/** Sayfanın kenar çubuğundaki grubu: üst çubuktaki ekmek kırıntısının orta halkası. */
export const SECTION_OF: Record<Page, string> = {
  dashboard: "Genel",
  inbox: "Genel",
  tasks: "Genel",
  calendar: "Genel",
  assistant: "Genel",
  reports: "Yönetim",
  notifications: "Yönetim",
  settings: "Yönetim",
};

/**
 * Sayfa başlığı, iki katlı (Ingot turu):
 *   1. Üst çubuk: ekmek kırıntısı (Pusula › grup › sayfa [› alt]), sağda
 *      verinin güncellendiği an ve zil. Kullanıcı nerede olduğunu her sayfada aynı
 *      yerden okur.
 *   2. Başlık bloğu: büyük ad, bir satır bağlam, sağda sayfanın eylemleri.
 *      Birincil eylem varsa tek `Button` (Sakin Akış: pusula.css onu koyu hapa çevirir); diğerleri
 *      `secondary`. Koyu mürekkep hap (eski `INK`) kaldırıldı: Pano mavi,
 *      Takvim siyah butonla iki farklı "birincil" dili konuşuyordu.
 */
export function PageBar({
  title,
  description,
  actions,
  crumb,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Sayfa adından sonra gelen alt halka ("Çalışma Alanı"). */
  crumb?: string;
}) {
  const { page, notifications, markRead } = useApp();
  const items = [
    { label: "Pusula", href: href("dashboard"), icon: <LayoutGrid /> },
    { label: SECTION_OF[page] },
    crumb ? { label: title, href: href(page) } : { label: title },
    ...(crumb ? [{ label: crumb }] : []),
  ];
  return (
    <header className="border-b border-line-soft bg-page">
      <div className="flex min-h-13 items-center gap-3 border-b border-line-soft px-4 sm:px-6">
        <Breadcrumb items={items} className="min-w-0 flex-1" />
        {/* Verinin tarihi, "canlı" iddiası değil: örnek veri 2 Kasım 10.24'te
            donmuş bir kesit. Sürekli yanıp sönen nokta olmayan bir akışı vaat ederdi. */}
        <span className="hidden items-center gap-1.5 text-small text-muted md:inline-flex">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          Güncellendi · 2 Kas, 10:24
        </span>
        <NotificationCenter items={notifications} onMarkRead={markRead} />
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 px-4 pt-6 pb-5 sm:px-6">
        {/* En az 18rem: telefonda eylemler başlığı sıkıştırmaz, alt satıra iner. */}
        <div className="min-w-[min(100%,18rem)] flex-1">
          <h1 className="text-heading font-medium tracking-[-0.025em] text-strong">{title}</h1>
          {description ? <p className="mt-1 text-base text-soft">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/**
 * Pusula kartı (Sakin Akış, 27 Kasım 2026): gri kuyu zemininde beyaz karo,
 * gölge yerine kıl halka, 16 px köşe. Lejant karoları kartın içinde gri çipe
 * döner (gölgesiz).
 */
export const CARD =
  "rounded-2xl bg-overlay p-1.5 ring-1 ring-line-soft [&>.mt-auto>dl>div]:bg-surface [&>.mt-auto>dl>div]:shadow-none";

/** Yumuşak renk karosu: ölçü, rapor ve kategori ikonlarının zemini. */
export function IconTile({ children, tone = "primary", className }: { children: ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "neutral"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset [&_svg]:size-4",
        tone === "primary" && "bg-primary-wash text-primary-ink ring-primary/15",
        tone === "success" && "bg-success-wash text-success ring-success/15",
        tone === "warning" && "bg-warning-wash text-warning ring-warning/15",
        tone === "danger" && "bg-danger-wash text-danger ring-danger/15",
        tone === "neutral" && "bg-surface text-body ring-line",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Bölüm başlığı: sayfa içindeki gruplar ("Satış", "Destek"). */
export function SectionTitle({ id, title, note, className }: { id: string; title: string; note?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1", className)}>
      {/* scroll-mt: bölüm gezintisi (TocNav) yapışkan; başlık onun altında kalmasın. */}
      <h2 id={id} className="scroll-mt-24 text-title font-medium tracking-[-0.02em] text-strong">
        {title}
      </h2>
      {note ? <p className="text-small text-soft">{note}</p> : null}
    </div>
  );
}

/** Ayar grupları, form kartları: beyaz kart + kıl halkası (eskiden gri kuyu; Ingot turu). */
export function Well({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("flex h-full flex-col rounded-2xl bg-overlay p-4 ring-1 ring-line-soft sm:p-5", className)}>
      {children}
    </section>
  );
}

export function WellTitle({ id, children, hint }: { id: string; children: ReactNode; hint?: ReactNode }) {
  return (
    // Sakin Akış: başlık ile gövde arasında çizgi yok; ayrım boşluk ve tonla.
    <div className="mb-4">
      <h2 id={id} className="scroll-mt-24 text-read font-medium tracking-[-0.01em] text-strong">
        {children}
      </h2>
      {hint ? <p className="mt-0.5 text-small text-soft">{hint}</p> : null}
    </div>
  );
}
