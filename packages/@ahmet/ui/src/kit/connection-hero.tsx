// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { MeshGradient } from "./mesh-gradient";
import { cn } from "../utils";

/**
 * Bağlantı başlığı: iki uygulamanın karosu yan yana, aralarında bağlantının
 * DURUMUNU söyleyen üç nokta; arkada yumuşak renk zemini (`mesh-gradient`).
 * Entegrasyon bağlama/yeniden bağlama penceresinin ve entegrasyon ayrıntı
 * sayfasının tepesi.
 *
 * Noktalar süs değil, durum: `idle` sönük, `connecting` soldan sağa sırayla
 * yanar (veri akıyor), `connected` üçü de dolu ve başarı tonunda, `error`
 * ortadaki tehlike tonunda. Hareketi azaltan kullanıcıda sıralı yanma yok,
 * noktalar sabit yarı dolu (durum metni yine okunur).
 *
 * NE ZAMAN DEĞİL: liste satırında entegrasyon durumu (orada rozet), ya da
 * tek uygulamalı başlık (orada yalnız ikon karosu). Renk zemini ekranda bir
 * tane: pencere açıkken arkadaki sayfada ikinci bir renk zemini yoksa.
 *
 * Yöntem referans turundan (2026-11; dil ve davranış, kod ve görsel değil).
 *
 * Erişilebilirlik: başlık `role="img"` + tam cümle ("Pusula ile Kargo,
 * bağlanıyor"); karolar ve noktalar `aria-hidden`. Durum değişimi için
 * çağıran ayrıca canlı bölge ya da bildirim verir.
 *
 * Örnek:
 *   <ConnectionHero from={{ label: "Pusula", icon: <Compass /> }} to={{ label: "Kargo", icon: <Truck /> }} status="connecting" />
 */

type App = { label: string; icon: ReactNode };
type Status = "idle" | "connecting" | "connected" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "bağlı değil",
  connecting: "bağlanıyor",
  connected: "bağlandı",
  error: "bağlantı hatası",
};

const CSS = `
@keyframes ui-conn-dot { 0%, 100% { opacity: .35; transform: scale(.85) } 40% { opacity: 1; transform: scale(1) } }
.ui-conn[data-status="connecting"] .ui-conn-dot { animation: ui-conn-dot 1.2s var(--ease-brand, ease) infinite; }
.ui-conn[data-status="connecting"] .ui-conn-dot:nth-child(2) { animation-delay: .2s; }
.ui-conn[data-status="connecting"] .ui-conn-dot:nth-child(3) { animation-delay: .4s; }
@media (prefers-reduced-motion: reduce) { .ui-conn[data-status="connecting"] .ui-conn-dot { animation: none; opacity: .7; } }
`;

export function ConnectionHero({ from, to, status = "idle", className }: { from: App; to: App; status?: Status; className?: string }) {
  return (
    <MeshGradient tone="primary" intensity="soft" texture="grain" className={cn("rounded-xl", className)}>
      <style href="ui-connection-hero" precedence="default">
        {CSS}
      </style>
      <div role="img" aria-label={`${from.label} ile ${to.label}, ${STATUS_TEXT[status]}`} data-status={status} className="ui-conn relative flex items-center justify-center gap-4 px-6 py-10">
        <Tile>{from.icon}</Tile>
        <span aria-hidden className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "ui-conn-dot size-2 rounded-full ring-1 ring-inset",
                status === "connected" && "bg-success ring-success/30",
                status === "error" && (i === 1 ? "bg-danger ring-danger/30" : "bg-overlay/60 ring-line"),
                (status === "idle" || status === "connecting") && "bg-overlay ring-line",
                status === "idle" && "opacity-50",
              )}
            />
          ))}
        </span>
        <Tile>{to.icon}</Tile>
      </div>
    </MeshGradient>
  );
}

function Tile({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="inline-grid size-16 place-items-center rounded-2xl bg-overlay/80 text-strong shadow-floating ring-1 ring-line backdrop-blur-sm [&_svg]:size-7">
      {children}
    </span>
  );
}
