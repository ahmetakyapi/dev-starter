/**
 * Şablonların isteğe bağlı palet dosyasını (`app/palettes.css`) tek kaynaktan,
 * `packages/@ahmet/theme/tokens.ts` → `palettes`ten üretir. Elle düzenleme:
 * değerler tokens.ts'te değişir, bu betik yeniden koşar
 * (`node scripts/build-template-palettes.mjs`). tests/contract.test.ts iki
 * dosyanın ayrışmadığını denetler.
 *
 * Şablonun `globals.css`i yalnızca `signature`ı taşır (varsayılan, sıfır ek
 * CSS). Palet değiştirici (`snippets/ui/palette-switcher.tsx`) kullanan ya
 * da signature dışı palet seçen proje bu dosyayı globals.css'te içe aktarır.
 */
import { writeFileSync } from 'node:fs'
import { palettes } from '../packages/@ahmet/theme/tokens.ts'

const map = {
  primary: '--primary', primaryHover: '--primary-hover', primarySoft: '--primary-soft',
  primaryWash: '--primary-wash', primaryInk: '--primary-ink', onPrimary: '--on-primary',
  displayGradient: '--display-gradient', displayGradientTight: '--display-gradient-tight',
  brandGradient: '--brand-gradient', ctaGradient: '--cta-gradient',
}
const block = (sel, values) =>
  `${sel} {\n${Object.entries(map).map(([k, v]) => `  ${v}: ${values[k]};`).join('\n')}\n}\n`

let css = `/* ==========================================================================
   PALETLER (isteğe bağlı) — ÜRETİLDİ, elle düzenleme.
   Kaynak: packages/@ahmet/theme/tokens.ts → palettes
   Üreten: node ~/dev-starter/scripts/build-template-palettes.mjs

   Kullanım (app/globals.css, \`@import "tailwindcss";\` satırının hemen altı):
     @import "./palettes.css";
   ve <html data-palette="cobalt">. Nötr sistem (zemin, metin, çizgi)
   paletten bağımsız: burada yalnızca vurgu ailesi ve degradeler var.

   Özgüllük: açık blok (0,2,0), koyu blok (0,3,0). Koyu blok açık bloğun
   bütün değişkenlerini yeniden yazar; koyu temada açık palet kalmaz.
   ========================================================================== */
`
for (const [name, p] of Object.entries(palettes)) {
  if (name === 'signature') continue // globals.css'te, varsayılan
  css += `\n/* ${name} */\n` + block(`:root[data-palette="${name}"]`, p.light) + '\n' + block(`:root[data-theme="dark"][data-palette="${name}"]`, p.dark)
}
for (const t of ['landing', 'nextjs-fullstack']) writeFileSync(new URL(`../templates/${t}/app/palettes.css`, import.meta.url), css)
console.log('palettes.css yazıldı:', Object.keys(palettes).length - 1, 'palet')
