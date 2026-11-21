"use client";

import {
  BarChart3,
  BookOpen,
  Calculator,
  CalendarDays,
  CreditCard,
  FileSpreadsheet,
  Globe,
  Mail,
  MessageSquare,
  Table2,
  Truck,
  Video,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";

/**
 * Üç uygulama örnek sayfasının ortak parçaları (Şablon Galerisi, Entegrasyonlar,
 * Yardım Merkezi): kabuk, sayfa başlığı ve KURGUSAL uygulama ikonları.
 * Marka, logo ve metin gerçek üründen alınmadı; uygulama adları uydurma
 * (Kargo, Muhasebe, Takvim…), ikonlar lucide. Her sayfada "ÖRNEK VERİ" künyesi.
 */

/** Kurgusal uygulamalar: ad → ikon. Gerçek marka yok. */
export const APPS = {
  posta: { name: "Posta", icon: Mail },
  kargo: { name: "Kargo", icon: Truck },
  muhasebe: { name: "Muhasebe", icon: Calculator },
  takvim: { name: "Takvim", icon: CalendarDays },
  sohbet: { name: "Sohbet", icon: MessageSquare },
  tablo: { name: "Tablo", icon: Table2 },
  odeme: { name: "Ödeme", icon: CreditCard },
  site: { name: "Site", icon: Globe },
  analiz: { name: "Analiz", icon: BarChart3 },
  rapor: { name: "Rapor", icon: FileSpreadsheet },
  webhook: { name: "Webhook", icon: Webhook },
  notlar: { name: "Notlar", icon: BookOpen },
  video: { name: "Video", icon: Video },
} as const satisfies Record<string, { name: string; icon: LucideIcon }>;

export type AppId = keyof typeof APPS;

export function AppGlyph({ id }: { id: AppId }) {
  const Icon = APPS[id].icon;
  return <Icon strokeWidth={1.75} />;
}

/** Süs olan küçük uygulama karosu (adı yanında metinle de yazılmalı). */
export function AppTile({ id, className }: { id: AppId; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md border border-line bg-overlay text-strong shadow-raised [&_svg]:size-4",
        className,
      )}
    >
      <AppGlyph id={id} />
    </span>
  );
}

/** Örnek veri künyesi: sayfadaki sayılar ve adlar uydurma. */
export function SampleNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-micro font-medium tracking-wide text-muted", className)}>
      ÖRNEK VERİ · kurgusal ürün, uydurma adlar ve sayılar
    </p>
  );
}

export function SampleShell({
  brand,
  logo,
  nav,
  current,
  user,
  crumbs,
  children,
}: {
  brand: string;
  logo: ReactNode;
  nav: readonly ShellNavGroup[];
  current: string;
  user: { name: string; detail: string };
  /** Üst çubuktaki yol: "Çalışma Alanı › Şablonlar". */
  crumbs: readonly string[];
  children: ReactNode;
}) {
  return (
    <AppShell
      brand={{
        name: brand,
        href: current,
        logo: <span className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand [&_svg]:size-4">{logo}</span>,
      }}
      groups={nav}
      current={current}
      user={user}
    >
      <div className="flex min-h-full min-w-0 flex-col">
        <nav aria-label="Yol" className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line-soft px-4 text-small text-muted sm:px-6">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden>/</span> : null}
              <span {...(i === crumbs.length - 1 ? { "aria-current": "page" as const, className: "font-medium text-strong" } : {})}>{crumb}</span>
            </span>
          ))}
        </nav>
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
      </div>
    </AppShell>
  );
}

/** Sayfa başlığı: h1 + tek satır bağlam solda, eylemler sağda. */
export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-title font-semibold tracking-tight text-strong">{title}</h1>
        {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
