"use client";

import { Eye, EyeOff, X, type LucideIcon } from "lucide-react";
import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Metin girişi: ad, e-posta, tutar, alan adı, şifre. Şablonun `Field`ıyla
 * aynı düzen (etiket → alan → yardım ya da hata, `aria-describedby` bağı);
 * `Field` çıplak alan, bu dosya alanın içine bir şey koymak gerektiğinde:
 * ikon, önek/sonek (₺, .com), temizle düğmesi, şifre göster/gizle.
 * Çok satır için `textarea.tsx`, kesin sayı için `number-field.tsx`, arama
 * için `search-field.tsx` (kısayol, gecikmeli arama).
 *
 * GÖRÜNEN KUTU `div`, ODAK `input`: önek, ikon ve düğmeler kutunun içinde
 * dursun diye çerçeve kapta; odak halkası `has-[input:focus-visible]` ile
 * kaba çizilir. İkon süs (`aria-hidden`); önek/sonek görünür metin ama
 * alanın ADINA girmez: "₺" görsel ipucu, anlamı etiket taşımalı ("Tutar
 * (₺)"). Ekran okuyucuya ayrıca söylenmesi gerekirse `hint` kullan.
 *
 * TEMİZLE: değer varken görünür, alanı boşaltıp odağı geri verir. Değer
 * yerel ayarlayıcıyla yazılıp `input` olayı tetiklenir; böylece React'in
 * `onChange`i hem denetimli hem denetimsiz kullanımda çalışır (ayrı bir
 * `onClear` gerekmez, istenirse var).
 *
 * ŞİFRE: `type="password"` verilince göz düğmesi kendiliğinden gelir;
 * `aria-pressed` + sabit ad ("Şifreyi Göster"): durum adda değil basılı
 * bilgisinde, ekran okuyucu "basılı / basılı değil" der. Göster/gizle
 * odağı alandan almaz (`onMouseDown` engellenir), imleç yerinde kalır.
 *
 * BOY: `sm` 36, `md` 40, `lg` 48 px; dokunmatikte sm ve md de 44 px
 * (`pointer-fine:` ile masaüstünde küçülür). İç düğmeler dokunmatikte
 * 44 px'lik görünmez alana sahip, görselleri 28 px.
 *
 * DURUMLAR: `disabled` soluk ve tıklanmaz; `readOnly` kuyu zemini kalkar,
 * kıl çizgi kalır (seçilebilir, kopyalanabilir, odaklanır); `error` kırmızı
 * kenar + `aria-invalid`, yardım metninin yerini hata alır.
 *
 *   <Input label="Tutar" prefix="₺" inputMode="decimal" placeholder="0,00" />
 *   <Input label="Alan Adı" suffix=".com" leadingIcon={Globe} clearable />
 *   <Input label="Şifre" type="password" autoComplete="current-password" />
 */

const SIZES = {
  sm: { box: "h-11 pointer-fine:h-9 gap-2 px-2.5", text: "text-small", icon: "size-4" },
  md: { box: "h-11 pointer-fine:h-10 gap-2 px-3", text: "text-base", icon: "size-4" },
  lg: { box: "h-12 gap-2.5 px-3.5", text: "text-base", icon: "size-5" },
} as const;

type InputProps = Omit<ComponentProps<"input">, "id" | "size" | "prefix"> & {
  label: ReactNode;
  /** Etiketi gözden gizle, ekran okuyucuda kalsın (tablo içi filtre gibi). */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string;
  size?: keyof typeof SIZES;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  /** Alanın içinde, değerden önce sabit metin: "₺", "https://". */
  prefix?: ReactNode;
  /** Değerden sonra sabit metin: ".com", "kg", "gün". */
  suffix?: ReactNode;
  /** Değer varken × düğmesi. */
  clearable?: boolean;
  onClear?: () => void;
  /** Dış kabın sınıfı; `inputClassName` alanın kendisi. */
  className?: string;
  inputClassName?: string;
};

function clearNative(input: HTMLInputElement) {
  // React değeri kendi kopyasında izler: doğrudan `input.value = ""` onChange'i
  // tetiklemez. Prototipteki ayarlayıcı + `input` olayı, kullanıcı silmiş gibi davranır.
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const innerButton =
  "relative grid size-7 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-overlay hover:text-strong focus-visible:outline-offset-0 before:absolute before:-inset-2 before:content-[''] pointer-fine:before:hidden";

export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  size = "md",
  leadingIcon: Leading,
  trailingIcon: Trailing,
  prefix,
  suffix,
  clearable = false,
  onClear,
  type = "text",
  value,
  defaultValue,
  onChange,
  disabled,
  readOnly,
  className,
  inputClassName,
  ...props
}: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const ref = useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [innerFilled, setInnerFilled] = useState(() => String(defaultValue ?? "").length > 0);
  const filled = value === undefined ? innerFilled : String(value).length > 0;

  const isPassword = type === "password";
  const s = SIZES[size];
  const showClear = clearable && filled && !disabled && !readOnly;

  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-small font-semibold text-strong", hideLabel && "sr-only")}>
        {label}
      </label>
      <div
        // Kabın herhangi bir yerine tıklamak alana odaklar (önek, ikon dahil).
        onPointerDown={(event) => {
          if (event.target === ref.current || (event.target as HTMLElement).closest("button")) return;
          event.preventDefault();
          ref.current?.focus();
        }}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          "flex w-full min-w-0 cursor-text items-center rounded-md border border-line-strong bg-surface-sunken transition-colors",
          "hover:border-primary-soft has-[input:focus-visible]:border-line-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-line-focus",
          s.box,
          readOnly && "bg-transparent hover:border-line-strong",
          error && "border-danger hover:border-danger",
          disabled && "cursor-not-allowed opacity-50 hover:border-line-strong",
        )}
      >
        {Leading ? <Leading aria-hidden className={cn(s.icon, "shrink-0 text-muted")} strokeWidth={2} /> : null}
        {prefix ? <span className={cn(s.text, "shrink-0 font-medium text-muted select-none")}>{prefix}</span> : null}
        <input
          ref={ref}
          id={id}
          type={isPassword && revealed ? "text" : type}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            setInnerFilled(event.target.value.length > 0);
            onChange?.(event);
          }}
          className={cn(
            s.text,
            "h-full min-w-0 flex-1 bg-transparent text-strong outline-none placeholder:text-muted disabled:cursor-not-allowed",
            // Tarayıcının kendi temizle/göz düğmeleri bizimkilerle çakışmasın.
            "[&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:appearance-none",
            inputClassName,
          )}
          {...props}
        />
        {suffix ? <span className={cn(s.text, "shrink-0 font-medium text-muted select-none")}>{suffix}</span> : null}
        {showClear ? (
          <button
            type="button"
            aria-label="Temizle"
            onClick={() => {
              const input = ref.current;
              if (!input) return;
              clearNative(input);
              input.focus();
              onClear?.();
            }}
            className={innerButton}
          >
            <X aria-hidden className="size-4" strokeWidth={2.25} />
          </button>
        ) : null}
        {isPassword ? (
          <button
            type="button"
            aria-label="Şifreyi Göster"
            aria-pressed={revealed}
            aria-controls={id}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setRevealed((open) => !open)}
            className={cn(innerButton, "-mr-1 disabled:pointer-events-none")}
          >
            {revealed ? (
              <EyeOff aria-hidden className="size-4" strokeWidth={2} />
            ) : (
              <Eye aria-hidden className="size-4" strokeWidth={2} />
            )}
          </button>
        ) : null}
        {Trailing && !isPassword ? <Trailing aria-hidden className={cn(s.icon, "shrink-0 text-muted")} strokeWidth={2} /> : null}
      </div>
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
