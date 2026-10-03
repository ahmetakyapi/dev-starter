import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Düğme. `asChild` YOK: bağlantı görünümlü düğme için `ButtonLink`, düğme
 * görünümlü başka bir öğe için `buttonClass()`.
 *
 * `brand` degrade taşır ve ekranda en fazla bir kez kullanılır (degrade
 * disiplini, app/globals.css başı). Geri kalan vurgulu düğmeler `primary`. Tek bir bileşenin iki öğe
 * gibi davranması tip güvenliğini ve erişilebilirliği bulanıklaştırır.
 *
 * DOKUNMA HEDEFİ: dokunmatik işaretçide her boy en az 44px. `sm` yalnızca
 * hassas işaretçide (fare) 36px'e iner.
 */

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[background-color,color,border-color,box-shadow,transform] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const BUTTON_VARIANTS = {
  /* Ekranın TEK birincil eylemi: marka degradesi. Bir ekranda ikinci bir
     `brand` düğme görüyorsan biri `primary` olmalı. */
  brand: "bg-cta text-on-brand shadow-raised hover:brightness-90",
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface-raised text-strong hover:bg-surface-sunken",
  ghost: "text-body hover:bg-primary-wash hover:text-strong",
  danger: "bg-danger-wash text-danger hover:bg-danger hover:text-on-primary",
} as const;

export const BUTTON_SIZES = {
  sm: "min-h-11 px-3 text-small pointer-fine:min-h-9",
  md: "min-h-11 px-4 text-base",
  lg: "min-h-12 px-6 text-read",
  icon: "size-11",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant = "secondary", size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}
