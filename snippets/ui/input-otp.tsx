"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { Fragment, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tek kullanımlık kod (SMS, e-posta, doğrulayıcı uygulaması): sabit
 * uzunlukta, yalnızca rakam. Parola ya da serbest metin için DEĞİL.
 *
 * Base UI `@base-ui/react/otp-field` (1.8): yazınca sonraki kutuya geçer,
 * Backspace geri döner, yapıştırılan "482 913" boşluğu atılıp kutulara
 * dağılır, oklar kutular arasında gezer, ilk kutu
 * `autocomplete="one-time-code"` taşır (iOS/Android SMS önerisi), formda tek
 * gizli giriş gönderilir. Tek sekme durağı: Tab grubun içine bir kez girer.
 *
 * NEDEN ORTADA ARA: altı hane 3 + 3 öbekte okunur ve SMS'teki kodla göz
 * kolayca karşılaştırır. Ayraç `aria-hidden`; ekran okuyucu her kutuyu
 * "Hane 2 / 6" diye adlandırır (ilk kutunun adı etiketten).
 *
 * Kod tamamlanınca `onComplete` bir kez çalışır; doğrulama isteği orada.
 * Hata gelince `error` verin: kutular `danger` kenarlık alır, metin
 * `aria-describedby` ile gruba bağlanır.
 *
 *   <InputOTP label="Doğrulama Kodu" hint="Telefonuna gelen 6 haneli kod."
 *     onComplete={(code) => verify(code)} />
 */

type InputOTPProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  length?: number;
  /** Ortadaki ayracın konumu; `0` ayraçsız. Varsayılan uzunluğun yarısı. */
  groupAt?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  autoSubmit?: boolean;
  className?: string;
};

export function InputOTP({
  label,
  hint,
  error,
  length = 6,
  groupAt,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  name,
  disabled,
  autoSubmit,
  className,
}: InputOTPProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const split = groupAt ?? Math.floor(length / 2);

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-strong">
        {label}
      </label>
      <OTPField.Root
        id={id}
        length={length}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next) => onValueChange(next) : undefined}
        onValueComplete={onComplete ? (next) => onComplete(next) : undefined}
        name={name}
        disabled={disabled}
        autoSubmit={autoSubmit}
        aria-describedby={describedBy}
        className="flex w-fit max-w-full items-center gap-1.5 data-disabled:opacity-50 sm:gap-2"
      >
        {Array.from({ length }, (_, index) => (
          <Fragment key={index}>
            {split > 0 && index === split ? (
              <span aria-hidden className="h-0.5 w-2.5 shrink-0 rounded-full bg-line-strong" />
            ) : null}
            <OTPField.Input
              aria-label={index === 0 ? undefined : `Hane ${index + 1} / ${length}`}
              aria-invalid={error ? true : undefined}
              className={cn(
                "h-12 w-10 min-w-0 rounded-md border border-line-strong bg-surface-sunken text-center text-title font-semibold text-strong tabular-nums caret-primary sm:w-11",
                "transition-[background-color,border-color,box-shadow,scale] duration-150 outline-none",
                "hover:border-primary-soft focus:border-line-focus focus:bg-overlay focus:shadow-raised focus:outline-2 focus:outline-offset-0 focus:outline-line-focus",
                "data-filled:border-line data-filled:bg-overlay data-filled:shadow-raised",
                "motion-safe:data-filled:animate-[otp-pop_180ms_var(--ease-brand)]",
                error && "border-danger data-filled:border-danger",
              )}
            />
          </Fragment>
        ))}
      </OTPField.Root>
      {/* Hane dolunca 0.9'dan yerine oturur, sıfırdan büyümez. `href` +
          `precedence`: React 19 kuralı <head>e taşır ve tekilleştirir. */}
      <style href="input-otp-pop" precedence="default">{`@keyframes otp-pop{from{scale:.9}}`}</style>
      {hint && !error ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
