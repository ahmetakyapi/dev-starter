"use client";

import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panoya kopyala. Sonuç İKİ yoldan söylenir: ikon değişir (gören için) ve
 * görünmez bir canlı bölge "Kopyalandı" der (ekran okuyucu için). Yalnızca
 * ikonun değişmesi, ekran okuyucu kullanıcısına hiçbir şey söylemez.
 *
 * Pano izni yoksa (güvensiz bağlam, iframe, reddedilmiş izin) sessizce
 * başarılı görünmez: "Kopyalanamadı" der. Dürüst geri bildirim.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): ikon durum değişince yerinde döner:
 * eski ikon kaybolur, yenisi 0,85'ten ölçeklenip belirir (`key` her durumda
 * yeni öğe, giriş CSS anahtar karesiyle). Metinli düğme beyaz karo; ikon
 * düğme üzerine gelince yumuşak gri.
 *
 * `children` verilirse metinli düğme, verilmezse yalnızca ikon (44 piksel).
 */

/** Onayın ekranda kalma süresi. */
const RESET_AFTER = 1600;

const POP = `@keyframes ui-pop { from { opacity: 0; scale: 0.85; } }`;

type Status = "idle" | "copied" | "failed";

type CopyButtonProps = {
  value: string;
  /** İkon düğmenin adı ve metinli düğmenin varsayılan metni. */
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  children?: ReactNode;
  className?: string;
};

export function CopyButton({
  value,
  label = "Kopyala",
  copiedLabel = "Kopyalandı",
  failedLabel = "Kopyalanamadı",
  children,
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let next: Status = "copied";
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      next = "failed";
    }
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), RESET_AFTER);
  }

  const Glyph = status === "copied" ? Check : status === "failed" ? X : Copy;
  const message = status === "copied" ? copiedLabel : status === "failed" ? failedLabel : "";
  const iconOnly = children === undefined;

  return (
    <>
      <style href="ui-copy-button" precedence="default">
        {POP}
      </style>
      <button
        type="button"
        onClick={copy}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md text-body transition-[background-color,color,scale] duration-150 active:scale-95 [&_svg]:size-4",
          iconOnly ? "min-w-11 hover:bg-surface-raised hover:text-strong pointer-fine:min-h-9 pointer-fine:min-w-9" : "border border-line bg-overlay px-3 text-small font-semibold shadow-raised hover:bg-surface hover:text-strong",
          status === "copied" && "text-success hover:text-success",
          status === "failed" && "text-danger hover:text-danger",
          className,
        )}
      >
        <Glyph key={status} aria-hidden strokeWidth={1.75} className="animate-[ui-pop_200ms_var(--ease-brand)]" />
        {iconOnly ? null : status === "idle" ? children : message}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
