"use client";

import { Avatar as Base } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";

/**
 * Avatar: görsel, yüklenemezse baş harfler.
 *
 * Base UI Avatar görselin yüklenip yüklenmediğini izler ve yalnızca
 * yüklendiyse gösterir; kırık görsel ikonu hiç çıkmaz. Yükleme sürerken ve
 * hata olursa baş harf yedeği durur, ikisi aynı kutuda: sayfa zıplamaz.
 * (Ayrıca `next/image` gerektirmeden `<img>` basar; uzak avatar adresleri
 * için `remotePatterns`a joker host yazmak `/_next/image`ı herkese açık bir
 * görsel vekiline çevirirdi.)
 *
 * BAŞ HARFLER TÜRKÇE BÜYÜK HARFLE: `toLocaleUpperCase("tr-TR")`. "ilker"
 * → "İ", "ışık" → "I". `toUpperCase()` "ilker"den "I" üretir.
 *
 * `alt`: avatar bir adın YANINDA duruyorsa (liste satırı) görsel süstür,
 * `alt=""` doğru; ad yalnızca avatarda ise `alt={ad}`.
 */

const SIZES = { sm: "size-8 text-micro", md: "size-10 text-small", lg: "size-14 text-read" } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts.at(-1)![0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toLocaleUpperCase("tr-TR");
}

type AvatarProps = {
  name: string;
  src?: string | null;
  /** Varsayılan boş: avatar genellikle adın yanında durur. */
  alt?: string;
  size?: keyof typeof SIZES;
  className?: string;
};

export function Avatar({ name, src, alt = "", size = "md", className }: AvatarProps) {
  return (
    <Base.Root
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-wash font-semibold text-primary-ink select-none",
        SIZES[size],
        className,
      )}
    >
      {src ? <Base.Image src={src} alt={alt} className="size-full object-cover" /> : null}
      <Base.Fallback aria-hidden={alt === "" ? true : undefined}>{initials(name)}</Base.Fallback>
    </Base.Root>
  );
}
