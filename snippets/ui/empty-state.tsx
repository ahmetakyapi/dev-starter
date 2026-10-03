import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Boş durum, üç biçim. Şablonun `components/ui/EmptyState.tsx`ünün
 * genişletilmiş hâli; aynı dil, aynı sınıflar.
 *
 * `variant="icon"` (varsayılan): panel içinde, ikonlu kutu. "Henüz Kayıt
 * Yok" + ne yapılacağını söyleyen bir cümle + tek eylem.
 * `variant="scene"`: SAYFA düzeyinde boşluk (arama sonucu yok, ilk kurulum,
 * 404). `scene` yuvasına bir çizim gelir: SVG, canvas sahnesi ya da
 * marka işareti. Sahne dekoratiftir (`aria-hidden`); anlam başlıkta.
 * `variant="inline"`: tek satırlık, kutusuz. Panel içindeki küçük listeler
 * için ("Bu hafta etkinlik yok."). Panel içine sahne konmaz: dar bir
 * kutuda çizim, boşluğun kendisinden büyük bir olay olur.
 *
 * Başlık Title Case; `hint` cümle düzeninde ve bir sonraki adımı söyler
 * ("İlk kaydı eklediğinde burada listelenecek."), suçlamaz ("Hiç kaydınız
 * yok!" değil).
 */

type EmptyStateProps = {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  scene?: ReactNode;
  variant?: "icon" | "scene" | "inline";
  /** Başlığın düzeyi: sayfa düzeyinde boş durum h1 ya da h2 olabilir. */
  as?: "p" | "h2" | "h3";
  className?: string;
};

export function EmptyState({ title, hint, action, icon, scene, variant = "icon", as: Title = "p", className }: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3", className)}>
        <p className="text-base text-muted">
          <span className="font-medium text-body">{title}</span>
          {hint ? <> {hint}</> : null}
        </p>
        {action}
      </div>
    );
  }

  const isScene = variant === "scene";
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isScene ? "px-4 py-16 sm:py-24" : "rounded-md border border-dashed border-line-strong bg-surface-sunken px-6 py-10",
        className,
      )}
    >
      {isScene && scene ? (
        <div aria-hidden className="mb-6 w-full max-w-60">
          {scene}
        </div>
      ) : icon ? (
        <div aria-hidden className="mb-4 grid size-11 place-items-center rounded-full bg-primary-wash text-primary-ink [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <Title className={cn("font-semibold text-strong", isScene ? "text-heading" : "text-read")}>{title}</Title>
      {hint ? <p className={cn("mt-2 max-w-sm text-muted", isScene ? "text-read" : "text-base")}>{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
