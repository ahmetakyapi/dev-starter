"use client";

import type { ReactNode } from "react";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";

/**
 * Üç pano örneğinin (Otomasyonlar, Ajan Harcamaları, Proje Görünümü) ortak
 * parçaları: kabuk, sayfa başlığı, beyaz kart, "ÖRNEK VERİ" künyesi.
 * Yalnız token; üçü de açık ve koyu temada aynı sınıflarla döner.
 */

/** Kıl halkalı beyaz kart: Pusula'nın kart dili (gölge en hafif). */
export const CARD = "rounded-xl bg-overlay shadow-raised ring-1 ring-line";

/** Veri dürüstlüğü: sahte rakamlar sayfada açıkça örnek diye işaretli (guides/08). */
export function SampleStamp({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-micro tracking-wide text-body", className)}>
      ÖRNEK VERİ
    </span>
  );
}

/** Renk noktası: kenar çubuğundaki otomasyon listesi, lejant. */
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 rounded-full", className)} />;
}

/** Kabuk marka karosu: koyu zemin, ters yüzey metni (iki temada da okunur). */
export function BrandMark({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="inline-grid size-7 place-items-center rounded-lg bg-strong text-page [&_svg]:size-4">
      {children}
    </span>
  );
}

type ShellProps = {
  brand: { name: string; href: string; logo: ReactNode };
  groups: readonly ShellNavGroup[];
  current: string;
  user: { name: string; detail?: string };
  children: ReactNode;
};

/** Kabuk: sayfada tek `main`, kenar çubuğu yapışkan; adresler `#...` (Storybook'ta gezinme yok). */
export function Shell({ brand, groups, current, user, children }: ShellProps) {
  return (
    <AppShell
      brand={brand}
      groups={groups}
      current={current}
      user={user}
      searchLabel="Ara ya da git"
      className="[&>aside]:sticky [&>aside]:top-0 [&>aside]:h-dvh [&>aside]:self-start"
    >
      {children}
    </AppShell>
  );
}

/** Sayfa başlığı: ekmek kırıntısı yok, başlık + bir satır bağlam + sağda eylemler. */
export function PageHead({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end gap-x-6 gap-y-3", className)}>
      <div className="min-w-[min(100%,18rem)] flex-1">
        <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-heading font-semibold tracking-tight text-strong">
          {title}
          {badge}
        </h1>
        {description ? <p className="mt-1 text-base text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Kart bölümü: başlık satırı (ad, not, sağda eylem) + içerik. */
export function Panel({
  id,
  title,
  note,
  actions,
  children,
  className,
  bodyClassName,
}: {
  id: string;
  title: ReactNode;
  note?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn(CARD, "flex min-w-0 flex-col", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-read font-semibold text-strong">
            {title}
          </h2>
          {note ? <p className="mt-0.5 text-small text-muted">{note}</p> : null}
        </div>
        {actions}
      </header>
      <div className={cn("min-w-0 flex-1 px-4 pt-3 pb-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Ölçü şeridi: tek kartta kıl çizgisiyle bölünmüş 4 ölçü (telefonda 2×2). */
export function MetricStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(CARD, "grid grid-cols-2 divide-line-soft max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(2n)]:border-l lg:grid-cols-4 lg:[&>*+*]:border-l [&>*]:border-line-soft", className)}>
      {children}
    </div>
  );
}

/** Sayfa gövdesi: kabuğun içinde ortalanmış, sıkı olmayan boşluklu sütun. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">{children}</div>;
}
