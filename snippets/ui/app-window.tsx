import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Masaüstü uygulama penceresi maketi: üç pencere düğmeli başlık çubuğu ve
 * gövde. Ürünü ekran görüntüsü yerine CANLI parçalarla anlatmak için
 * (Ribbon'ın bento kartlarında her özellik, içinde gerçek simgeler olan
 * küçük pencerelerle çizilmiş). Ekran görüntüsü bayatlar ve temayla dönmez;
 * maket token'la çizilir, iki temada da doğru, metni seçilebilir.
 *
 * DURUMLAR:
 *   - `focused`: odaktaki pencere, birincil renkte iki piksel halka. Bir
 *     sahnede TEK pencere odakta (Ribbon'daki mavi çerçeve).
 *   - `ghost`: henüz açılmamış, gelecek pencere. Kesik çizgili çerçeve,
 *     soluk içerik ("yeni pencere buraya açılır").
 *   - `tone="inverse"`: ters zemin (açık temada koyu). Her iki temada koyu
 *     kalması gereken terminal için `terminal.tsx` var.
 *
 * Pencere düğmeleri süstür (`aria-hidden`); maket bir resimdir. Bütün
 * sahneyi `role="img"` + `aria-label` ile tek cümleyle anlat ya da yanındaki
 * metin anlatıyorsa sahneyi `aria-hidden` yap. Düğmeler durum renklerinden
 * (danger, warning, success): paletle döner, sabit kırmızı-sarı-yeşil yok.
 *
 *   <AppWindow title="Notlar" icon={<NotebookPen />} focused className="w-56">
 *     <div className="p-3 text-small text-soft">Pazartesi toplantısı…</div>
 *   </AppWindow>
 */

type AppWindowProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Başlık çubuğundaki ad. */
  title?: ReactNode;
  /** Başlığın solunda küçük simge (lucide ya da uygulama simgesi). */
  icon?: ReactNode;
  focused?: boolean;
  ghost?: boolean;
  tone?: "default" | "inverse";
  /** Başlık çubuğunun sağı: sekme, arama, paylaş düğmesi maketi. */
  actions?: ReactNode;
};

export function AppWindow({ title, icon, focused, ghost, tone = "default", actions, className, children, ...props }: AppWindowProps) {
  const inverse = tone === "inverse";
  return (
    <div
      data-focused={focused || undefined}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl transition-shadow duration-300",
        inverse ? "bg-strong text-page" : "bg-overlay text-body",
        ghost
          ? "border border-dashed border-line-strong opacity-70 shadow-none"
          : focused
            ? "shadow-floating ring-2 ring-primary"
            : "shadow-raised ring-1 ring-line",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-7 shrink-0 items-center gap-2 border-b px-2.5",
          inverse ? "border-page/10" : "border-line-soft bg-surface",
        )}
      >
        <span aria-hidden className="flex gap-1">
          <span className={cn("size-2 rounded-full", ghost ? "bg-line-strong" : "bg-danger")} />
          <span className={cn("size-2 rounded-full", ghost ? "bg-line-strong" : "bg-warning")} />
          <span className={cn("size-2 rounded-full", ghost ? "bg-line-strong" : "bg-success")} />
        </span>
        {title ? (
          <span
            className={cn(
              "flex min-w-0 items-center gap-1.5 truncate text-micro font-medium [&_svg]:size-3 [&_svg]:shrink-0",
              inverse ? "text-page/70" : "text-muted",
            )}
          >
            {icon}
            <span className="truncate">{title}</span>
          </span>
        ) : null}
        {actions ? <span className="ml-auto flex items-center gap-1">{actions}</span> : null}
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Pencere şeridi: pencereleri yan yana, ekranın dışına taşarak dizer
 * (Ribbon'ın "küçültmek yerine kaydır" fikri). Taşan pencere kenarda solar,
 * böylece sahnenin devam ettiği anlaşılır. Kaydırılabilir DEĞİL, maket.
 */
export function WindowStrip({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] *:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
