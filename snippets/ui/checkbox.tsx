import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Onay kutusu: kaydet düğmesine bağlı ya da çoklu seçim. Anında etki eden
 * ayar için `switch.tsx`.
 *
 * YEREL GİRİŞ, `appearance-none` ile çizilmiş: JavaScript'siz çalışır,
 * formla gönderilir, sunucu bileşeninde çizilir, tarayıcının `:checked`,
 * `:indeterminate`, `:disabled`, `:focus-visible` durumları doğrudan stil
 * olur. İşaret bir SVG maskesi değil, `checked:` durumunda beliren ikon;
 * renk token'dan.
 *
 * Belirsiz durum (`indeterminate`) yalnızca DOM özelliği, HTML özniteliği
 * yok: gerekiyorsa istemci bileşeninde `ref` ile `el.indeterminate = true`.
 *
 * Kutu 18 piksel ama dokunma hedefi etiketin tamamı (en az 44 piksel).
 * Etiketsiz kullanma; tablo satırı seçimi gibi görünür etiketin olmadığı
 * yerde `aria-label` ver.
 */

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
};

export function Checkbox({ label, hint, className, disabled, ...props }: CheckboxProps) {
  const box = (
    <span className="relative grid size-[1.125rem] shrink-0 place-items-center">
      <input
        type="checkbox"
        disabled={disabled}
        className={cn(
          "peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[0.3125rem] border border-line-strong bg-surface transition-colors",
          "checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary",
          "hover:border-primary-soft disabled:cursor-not-allowed",
          !label && className,
        )}
        {...props}
      />
      {/* İşaretler girişin ÜSTÜNDE ama tıklamayı geçirir. */}
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none relative hidden size-3 text-on-primary peer-checked:block peer-indeterminate:hidden">
        <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none relative hidden size-3 text-on-primary peer-indeterminate:block">
        <path d="M4 8h8" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      </svg>
    </span>
  );

  if (!label) return box;

  return (
    <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-2.5", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="mt-[0.1875rem]">{box}</span>
      <span className="min-w-0">
        <span className="block text-base font-medium text-strong">{label}</span>
        {hint ? <span className="mt-0.5 block text-small text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
