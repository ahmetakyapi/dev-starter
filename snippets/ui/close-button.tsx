import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Kapatma düğmesi: diyalog, uyarı satırı, duyuru hapı, çip. "Küçük ×"
 * ekranın en sık yanlış yapılan öğesi; burada dört şey doğru:
 *
 * 1. DOKUNMA ALANI GÖRSELDEN BÜYÜK. Düğmenin kendisi 44 × 44 piksel
 *    (WCAG 2.5.5), görünen daire 32 (`md`) ya da 28 (`sm`). Fazlası negatif
 *    kenar boşluğuyla taşar: düzende yalnızca görsel kadar yer tutar, parmak
 *    yine 44 piksel bulur. Sağ üst köşeye konduğunda `-m-1.5` hizayı bozmaz.
 * 2. AD TİPTE ZORUNLU. "×" bir ad değil; ekran okuyucu "çarpı düğmesi" der.
 *    Neyi kapattığını söyle: "Duyuruyu Kapat", "Filtreyi Kaldır".
 * 3. ODAK HALKASI DAİRENİN ÇEVRESİNDE. Tarayıcı halkası 44 piksellik
 *    görünmez kutuya çizilse havada asılı bir kare görünürdü; halka
 *    `group-focus-visible` ile içteki daireye taşınır.
 * 4. DURUMLAR: üstüne gelince ton (`bg-surface-raised`), basınca daire 0.92'ye
 *    iner (150 ms, imza eğrisi), devre dışıyken soluk ve tıklanamaz.
 *
 * Sunucu bileşeni: `onClick` istemci bir üstten gelebilir.
 */

const SIZES = {
  /** 28 piksel görsel; satır içi (çip, duyuru hapı). */
  sm: { bleed: "-m-2", dot: "size-7", icon: "size-3.5" },
  /** 32 piksel görsel; diyalog, uyarı satırı başlığı. */
  md: { bleed: "-m-1.5", dot: "size-8", icon: "size-4" },
} as const;

type CloseButtonProps = Omit<ComponentProps<"button">, "aria-label" | "children"> & {
  /** Zorunlu: neyi kapattığını söyler ("Bildirimi Kapat"). */
  "aria-label": string;
  size?: keyof typeof SIZES;
  /** Kapalıyken taşma yok: düğme düzende 44 piksel yer kaplar. */
  bleed?: boolean;
  /** Koyu ya da renkli zemin üstünde (wash satırı) hover tonunu değiştir. */
  tone?: "default" | "onWash";
};

export function CloseButton({
  size = "md",
  bleed = true,
  tone = "default",
  type = "button",
  className,
  ...props
}: CloseButtonProps) {
  const s = SIZES[size];
  return (
    <button
      type={type}
      className={cn(
        "group inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        bleed && s.bleed,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "grid place-items-center rounded-full transition-[background-color,color,transform] duration-150 group-hover:text-strong group-active:scale-[0.92] group-focus-visible:text-strong group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-line-focus",
          tone === "onWash" ? "group-hover:bg-page/70" : "group-hover:bg-surface-raised",
          s.dot,
        )}
      >
        <X className={s.icon} strokeWidth={2} />
      </span>
    </button>
  );
}
