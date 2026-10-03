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
 * `children` verilirse metinli düğme, verilmezse yalnızca ikon (44 piksel).
 */

/** Onayın ekranda kalma süresi. */
const RESET_AFTER = 1600;

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
      <button
        type="button"
        onClick={copy}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md text-body transition-colors hover:bg-primary-wash hover:text-strong [&_svg]:size-4",
          iconOnly ? "min-w-11" : "border border-line px-3 text-small font-semibold",
          status === "copied" && "text-success hover:text-success",
          status === "failed" && "text-danger hover:text-danger",
          className,
        )}
      >
        <Glyph aria-hidden strokeWidth={1.75} />
        {iconOnly ? null : status === "idle" ? children : message}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
