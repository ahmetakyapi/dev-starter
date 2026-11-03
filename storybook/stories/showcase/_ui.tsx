"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import type { Period } from "./_data";
import { cn } from "@/lib/utils";

/**
 * Pusula'nın sayfaları arasında paylaşılan durum ve iki küçük kalıp.
 * Gezinme adresi `?view=<sayfa>&...` biçiminde (İngilizce, küçük harf, ASCII: `?view=inbox&tag=gecikme&ticket=PSL-1186&page=2`): kabuğun bağlantıları gerçek
 * `<a href>`; uygulama tıklamayı yakalayıp sayfayı iç durumla değiştirir
 * (Storybook'ta adres çubuğu yok, ama bağlantı semantiği ve klavye doğru kalır).
 */

export type Page = "dashboard" | "inbox" | "tasks" | "calendar" | "assistant" | "reports" | "settings";
export type Params = Readonly<Record<string, string>>;

export const PAGES: readonly { id: Page; label: string }[] = [
  { id: "dashboard", label: "Pano" },
  { id: "inbox", label: "Gelen Kutusu" },
  { id: "tasks", label: "Görevler" },
  { id: "calendar", label: "Takvim" },
  { id: "assistant", label: "Asistan" },
  { id: "reports", label: "Raporlar" },
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
  /** Verilirse bildirimde "Geri Al" düğmesi (silme, arşivleme). */
  undo?: () => void;
};

type AppState = {
  page: Page;
  params: Params;
  navigate: (page: Page, params?: Record<string, string | undefined>) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  notifications: readonly NotificationItem[];
  markRead: (ids: string[]) => void;
  /** Kısa bildirim (sağ altta, `toast`) + bildirim merkezine kayıt. */
  notify: (toast: Omit<Toast, "id">) => void;
};

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Pusula sayfaları <PusulaApp> içinde çizilir.");
  return ctx;
}

/** Sayfa başlığı: solda ad + bir satır bağlam, sağda sayfanın eylemleri ve zil. */
export function PageBar({
  title,
  description,
  actions,
  above,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  above?: ReactNode;
}) {
  const { notifications, markRead } = useApp();
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line-soft px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        {above}
        <h1 className="text-title font-semibold tracking-tight text-strong">{title}</h1>
        {description ? <p className="mt-0.5 text-small text-muted">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <NotificationCenter items={notifications} onMarkRead={markRead} />
      </div>
    </header>
  );
}

/** Bölüm başlığı: sayfa içindeki gruplar ("Satış", "Destek"). */
export function SectionTitle({ id, title, note, className }: { id: string; title: string; note?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1", className)}>
      <h2 id={id} className="text-base font-semibold text-strong">
        {title}
      </h2>
      {note ? <p className="text-small text-muted">{note}</p> : null}
    </div>
  );
}

/** Beyaz içerik karosunun içindeki gri kuyu: ayar grupları, form kartları. */
export function Well({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("flex h-full flex-col rounded-xl bg-surface p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}

export function WellTitle({ id, children, hint }: { id: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="text-base font-semibold text-strong">
        {children}
      </h2>
      {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
    </div>
  );
}
