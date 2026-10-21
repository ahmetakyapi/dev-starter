import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** Title Case başlık: "Henüz Kayıt Yok". */
  title: ReactNode;
  /** Başlığın etiketi. Sayfanın tek içeriğiyse (404) `h1`: sayfa başlıksız kalmasın. */
  titleAs?: "p" | "h1" | "h2" | "h3";
  /** Cümle düzeninde yardım metni: ne olacağını ya da ne yapılacağını söyler. */
  hint?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, titleAs: Title = "p", hint, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-md border border-dashed border-line-strong bg-surface-sunken px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 grid size-11 place-items-center rounded-full bg-primary-wash text-primary-ink [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <Title className="text-read font-semibold text-strong">{title}</Title>
      {hint ? <p className="mt-2 max-w-sm text-base text-muted">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
