import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Kendi punto adlarımız (`app/globals.css` → `--text-*`).
 *
 * twMerge'e TANITILMAK ZORUNDA. Birleştirici `text-sm` gibi kendi bildiği
 * adları punto sayar; tanımadığı `text-small`ı ise RENK sanar. Renk
 * token'larımız da aynı önekle yazıldığı için (`text-strong`, `text-muted`)
 * ikisi tek gruba düşer ve sonuncusu kazanır:
 *
 *     cn("text-small", "text-strong")  →  "text-strong"   (punto sessizce gider)
 *
 * Renkler listede YOK, olmamalı: tanınmayan `text-*` zaten renk sayılıyor.
 * Ölçeğe yeni bir basamak eklersen buraya da ekle; testi `tests/utils.test.ts`.
 */
export const TEXT_SIZES = [
  "micro",
  "small",
  "base",
  "read",
  "lead",
  "title",
  "heading",
  "display",
  "hero",
] as const;

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: [...TEXT_SIZES] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
