import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Uygulama rafı (dock): altta yuvarlak cam rafta simgeler. Üzerine gelinen
 * simge yükselip büyür, KOMŞULARI da biraz (yalnız CSS, `:has()` ile;
 * ölçüm ve JavaScript yok). Açık uygulamanın altında nokta. Ürün maketinde
 * masaüstü sahnesini tamamlar (`app-window.tsx` ile) ya da tanıtım
 * sayfasında "hangi araçlarla çalışır" satırı olur.
 *
 * İki kip:
 *   - `onSelect` YOK: süs. Raf `aria-hidden`, simgeler `span`.
 *   - `onSelect` VAR: her simge gerçek düğme, adı `label`; raf `role="toolbar"`.
 *     Ok tuşu gezintisi yok (sekme sırası yeterli, en çok sekiz simge).
 *
 * Büyüme yalnız ince işaretçide (`pointer-fine`) ve hareketi azaltmayanda;
 * dokunmatikte basınca küçük bir çöküş yeter. Simge boyutu `size` ile
 * (`md` telefonda `sm`e iner: sekiz simge 390 pikselde sığsın);
 * simgenin kendisi (uygulama logosu, `<img>` ya da lucide) çağırandan.
 *
 *   <Dock items={[{ id: "notlar", label: "Notlar", icon: <img src="/i/notlar.png" alt="" />, active: true }]} />
 */

export type DockItem = { id: string; label: string; icon: ReactNode; active?: boolean };

type DockProps = {
  items: readonly DockItem[];
  onSelect?: (id: string) => void;
  /** Rafın erişilebilir adı (yalnız `onSelect` varken okunur). */
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

const CSS = `
.ui-dock-item > .ui-dock-icon { transition: transform 200ms var(--ease-brand); transform-origin: bottom center; }
@media (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .ui-dock-item:hover > .ui-dock-icon { transform: translateY(-8px) scale(1.18); }
  .ui-dock-item:hover + .ui-dock-item > .ui-dock-icon,
  .ui-dock-item:has(+ .ui-dock-item:hover) > .ui-dock-icon { transform: translateY(-3px) scale(1.07); }
}
.ui-dock-item:active > .ui-dock-icon { transform: scale(0.94); }`;

export function Dock({ items, onSelect, label = "Uygulamalar", size = "md", className }: DockProps) {
  const icon = size === "sm" ? "size-8" : "size-8 sm:size-11";
  const interactive = Boolean(onSelect);
  return (
    <div
      role={interactive ? "toolbar" : undefined}
      aria-label={interactive ? label : undefined}
      aria-hidden={interactive ? undefined : true}
      className={cn(
        "inline-flex max-w-full items-end gap-0.5 rounded-2xl bg-overlay/70 p-1 sm:gap-1 sm:p-1.5 shadow-floating ring-1 ring-line backdrop-blur-md",
        className,
      )}
    >
      <style href="ui-dock" precedence="default">
        {CSS}
      </style>
      {items.map((item) => {
        const inner = (
          <>
            <span className={cn("ui-dock-icon grid place-items-center [&>img]:size-full [&>img]:object-contain [&>svg]:size-1/2", icon)}>
              {item.icon}
            </span>
            <span aria-hidden className={cn("mt-0.5 size-1 rounded-full", item.active ? "bg-strong/70" : "bg-transparent")} />
          </>
        );
        return interactive ? (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.active ? `${item.label} (açık)` : item.label}
            onClick={() => onSelect?.(item.id)}
            className="ui-dock-item flex flex-col items-center rounded-lg px-0.5 pt-0.5"
          >
            {inner}
          </button>
        ) : (
          <span key={item.id} className="ui-dock-item flex flex-col items-center px-0.5 pt-0.5">
            {inner}
          </span>
        );
      })}
    </div>
  );
}
