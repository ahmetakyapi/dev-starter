---
description: Projenin paletini ve görsel temasını uygula ya da güncelle (Tailwind v4 @theme, iki katmanlı token)
argument-hint: "signature | verdant | ember | iris | acilis-zili | mimio | ahmetakyapi | keskealsaydim | ramazan-vakitleri"
---

`$ARGUMENTS` paletini ya da referans temasini mevcut projeye uygula. Bu komut
her projeden cagrilabilir; kaynaklar `~/dev-starter/` altinda.

**Once oku:** `~/dev-starter/guides/00-brand-identity.md` (kimlik + palet),
`~/dev-starter/guides/02-design-tokens.md` (token mimarisi),
`~/dev-starter/guides/03-theming.md` (tema sistemi).

## 1. Projenin surumunu tespit et

```bash
ls tailwind.config.* 2>/dev/null && echo "v3 — config dosyasi var" || echo "v4 — token'lar globals.css @theme'de"
grep -E '"(tailwindcss|next-themes|motion|framer-motion)"' package.json
```

- **v4 (yeni tech stack):** `tailwind.config.ts` YOK. Token'lar `app/globals.css`te
  iki katman: ham rol degiskenleri `:root[data-theme]` (+ `[data-palette]`),
  kopru `@theme inline`. Bu komut yalnizca bu katmanlari duzenler.
- **v3 (eski proje):** config ve `darkMode: 'class'` vardir. Paleti degistirmek
  icin once kullaniciya v4'e yukseltmeyi sor; yukseltme istemiyorsa yalnizca
  `~/dev-starter/knowledge/themes/<proje>.md`deki degerleri mevcut yapiya uygula, mimariyi degistirme.

## 2a. Palet adi verildiyse (`signature | verdant | ember | iris`)

- `@ahmetakyapi/theme` kuruluysa: `globals.css`te `@import "@ahmetakyapi/theme/theme.css";`
  ve `<html data-palette="$ARGUMENTS">` (sablonda `lib/theme.ts` → `PALETTE`).
- Kurulu degilse: palet blogunu (`:root[data-palette]`, acik ve koyu) projenin
  `globals.css`ine yaz; degerler `~/dev-starter/packages/@ahmet/theme/theme.css`ten.
- Yalnizca palet token'lari degisir (`--primary` ailesi, `--display-gradient(-tight)`,
  `--brand-gradient`, zemin/metin egilimi). Kimlik katmanina dokunma.

## 2b. Proje temasi verildiyse (`acilis-zili`, `mimio` ...)

`~/dev-starter/knowledge/themes/$ARGUMENTS.md` dosyasini oku (DESIGN.md 9 bolum):
Bolum 2 renk, 3 tipografi, 4 bilesen, 5 yerlesim, 6 derinlik, 7 yapilacak/yapilmayacak.
Kopyalama: projenin `docs/DESIGN.md`sine **farki** yaz, token'lari rol adlariyla
katman 1'e isle.

| Tema | Ozet |
|------|------|
| `acilis-zili` | `signature` paletinin kaynagi; tek grotesk aile, ton farkiyla derinlik, glass/glow yok, varsayilan acik |
| `mimio` | Mavi → cyan imza degradesi, uc katmanli zemin (aurora → grain → cam), varsayilan acik |
| `ahmetakyapi` | Kisisel site; indigo/cyan/emerald, next-themes (eski tech stack) |
| `keskealsaydim` | Finans paneli, emerald + cyan, shadcn HSL (Vite + React) |
| `ramazan-vakitleri` | Yalniz koyu, mor + pembe + mavi, sistem fontu |
| `digynotes` | ARSIV — proje diskte yok, dogrulanamaz |

## 3. Kurallar

- Hardcoded renk yok; `dark:` varyanti yok (tema token'la doner).
- Acik tema ters cevrilmez, yeniden tasarlanir; her iki temada ekrana bak.
- Kontrasti olc: `--text-muted` ve `-ink`/`-wash` ciftleri ≥ 4,5:1, oran token yorumuna.
- Degrade yalnizca uc yerde ve tek renk ailesinde (guides/00 § 1).
- Glass opt-in; varsayilan `.surface`.
- `~/dev-starter/knowledge/mistakes.md` #26, #30, #42, #74–#76.

## 4. Dogrula

```bash
npm run build && npm run typecheck && npm run lint
grep -rn --include='*.tsx' -E 'dark:|bg-white|text-(gray|slate)-[0-9]' app components
```

Ardindan iki temada ana ekranlari ac (390 ve 1280).
