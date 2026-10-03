import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  /** Üst künye: kısa, tek satır. Her sayfada olması gerekmez. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Tek cümlelik açıklama. */
  description?: ReactNode;
  /** Sağda ekranın tek denetimi (varsa). */
  action?: ReactNode;
  /** Başlığı degrade mürekkeple çizer. Yalnızca kısa başlıkta (bir-üç kelime). */
  ink?: boolean;
  className?: string;
};

/** Sayfa başlığı: sayfanın tek h1'i. Sırası her ekranda aynı. */
export function PageHeader({ eyebrow, title, description, action, ink = false, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="mb-3 font-mono text-small text-primary-ink">{eyebrow}</p> : null}
        <h1 className={cn("text-display font-bold sm:text-hero", ink && "display-ink")}>{title}</h1>
        {description ? <p className="mt-4 text-lead text-soft">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
