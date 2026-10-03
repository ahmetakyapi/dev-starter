import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marka halkası: ekranın ortasında, bekleyişi ürünün kendi işaretine bağlayan
 * yükleme göstergesi. Spinner satır içindir; bu, sayfa ya da kart düzeyinde
 * bekleme (gezinme kartı, ilk yükleme, uzun süren eylem).
 *
 * Halka YÜZDE GÖSTERMEZ. Ne kadar kaldığını bilmediğimiz bir şeyi ilerleme
 * gibi çizmek veri dürüstlüğüyle çelişir; döngü yalnızca "çalışıyor" der.
 *
 * DÖNGÜ YALNIZCA BEKLEMEDE. Görünüme giren süslemeler bir kez oynar ve
 * oturur; bu bileşen ise beklemenin kendisi olduğu için döner. Hareketi
 * azaltan kullanıcıda halka çeyrek yay olarak SABİT durur (titreşmez,
 * nefes almaz) ve ortadaki karo yerinde kalır.
 *
 * Ortadaki kare marka karosu (`bg-brand`): degradenin izinli üç yerinden
 * biri. Logon varsa `children` ile onu ver.
 *
 * Anahtar kareler bileşenle birlikte gelir (`<style href precedence>`, React
 * 19): React aynı `href`i sayfada bir kez basar, globals.css'e dokunmak
 * gerekmez.
 */

const SIZES = { sm: 32, md: 48, lg: 72 } as const;

const KEYFRAMES = `
@keyframes lm-spin { to { transform: rotate(360deg) } }
@keyframes lm-dash {
  0% { stroke-dasharray: 1 150; stroke-dashoffset: 0 }
  50% { stroke-dasharray: 90 150; stroke-dashoffset: -35 }
  100% { stroke-dasharray: 90 150; stroke-dashoffset: -124 }
}
@keyframes lm-breathe { 50% { transform: scale(0.9) } }
`;

type LoadingMarkProps = {
  size?: keyof typeof SIZES;
  /** Ekran okuyucu metni ve (görünür) alt yazı. */
  label?: string;
  /** Alt yazıyı ekranda da göster. Kapalıyken yalnızca ekran okuyucu duyar. */
  showLabel?: boolean;
  /** Ortadaki karonun içi: logo ya da baş harf. */
  children?: ReactNode;
  className?: string;
};

export function LoadingMark({ size = "md", label = "Yükleniyor", showLabel = false, children, className }: LoadingMarkProps) {
  const px = SIZES[size];
  return (
    <div role="status" className={cn("inline-flex flex-col items-center gap-3", className)}>
      <style href="ui-loading-mark" precedence="default">
        {KEYFRAMES}
      </style>
      <span className="relative grid place-items-center" style={{ width: px, height: px }} aria-hidden>
        <svg
          viewBox="0 0 50 50"
          width={px}
          height={px}
          className="absolute inset-0 animate-[lm-spin_1.6s_linear_infinite] motion-reduce:animate-none"
        >
          <circle cx="25" cy="25" r="20" fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="32 150"
            className="animate-[lm-dash_1.4s_var(--ease-brand)_infinite] motion-reduce:animate-none"
          />
        </svg>
        <span
          className="grid place-items-center rounded-sm bg-brand text-micro font-bold text-on-brand animate-[lm-breathe_1.4s_var(--ease-brand)_infinite] motion-reduce:animate-none"
          style={{ width: px * 0.36, height: px * 0.36 }}
        >
          {children}
        </span>
      </span>
      <span className={showLabel ? "text-small font-medium text-muted" : "sr-only"}>{label}</span>
    </div>
  );
}
