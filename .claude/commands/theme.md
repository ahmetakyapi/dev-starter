---
description: Projenin paletini ve görsel temasını uygula ya da güncelle (Tailwind v4 @theme, iki katmanlı token)
argument-hint: "signature | verdant | ember | iris | acilis-zili | mimio | ahmetakyapi | keskealsaydim | ramazan-vakitleri"
---

`$ARGUMENTS` paletini ya da referans temasını mevcut projeye uygula. Bu komut
her projeden çağrılabilir; kaynaklar `~/dev-starter/` altında.

**Önce oku:** `~/dev-starter/guides/00-brand-identity.md` (kimlik + palet),
`~/dev-starter/guides/02-design-tokens.md` (token mimarisi),
`~/dev-starter/guides/03-theming.md` (tema sistemi).

## 1. Projenin sürümünü tespit et

```bash
ls tailwind.config.* 2>/dev/null && echo "v3 — config dosyası var" || echo "v4 — token'lar globals.css @theme'de"
grep -E '"(tailwindcss|next-themes|motion|framer-motion)"' package.json
```

- **v4 (yeni tech stack):** `tailwind.config.ts` YOK. Token'lar `app/globals.css`te
  iki katman: ham rol değişkenleri `:root[data-theme]` (+ `[data-palette]`),
  köprü `@theme inline`. Bu komut yalnızca bu katmanları düzenler.
- **v3 (eski proje):** config ve `darkMode: 'class'` vardır. Paleti değiştirmek
  için önce kullanıcıya v4'e yükseltmeyi sor; yükseltme istemiyorsa yalnızca
  `~/dev-starter/knowledge/themes/<proje>.md`deki değerleri mevcut yapıya uygula, mimariyi değiştirme.

## 2a. Palet adı verildiyse (`signature | verdant | ember | iris`)

- `@ahmetakyapi/theme` kuruluysa: `globals.css`te `@import "@ahmetakyapi/theme/theme.css";`
  ve `<html data-palette="$ARGUMENTS">` (şablonda `lib/theme.ts` → `PALETTE`).
- Kurulu değilse: palet bloğunu (`:root[data-palette]`, açık ve koyu) projenin
  `globals.css`ine yaz; değerler `~/dev-starter/packages/@ahmet/theme/theme.css`ten.
- Yalnızca palet token'ları değişir (`--primary` ailesi, `--display-gradient(-tight)`,
  `--brand-gradient`, `--cta-gradient`, zemin/metin eğilimi). Kimlik katmanına dokunma.
  `--cta-gradient` yazılmazsa birincil eylem (`bg-cta`) signature mavisinde kalır;
  `--on-brand` her durağı üstünde ≥ 4,5:1 olmalı (guides/00).

## 2b. Proje teması verildiyse (`acilis-zili`, `mimio` ...)

`~/dev-starter/knowledge/themes/$ARGUMENTS.md` dosyasını oku (DESIGN.md 9 bölüm):
Bölüm 2 renk, 3 tipografi, 4 bileşen, 5 yerleşim, 6 derinlik, 7 yapılacak/yapılmayacak.
Kopyalama: projenin `docs/DESIGN.md`sine **farkı** yaz, token'ları rol adlarıyla
katman 1'e işle.

| Tema | Özet |
|------|------|
| `acilis-zili` | `signature` paletinin kaynağı; tek grotesk aile, ton farkıyla derinlik, glass/glow yok, varsayılan açık |
| `mimio` | Mavi → cyan imza degradesi, üç katmanlı zemin (aurora → grain → cam), varsayılan açık |
| `ahmetakyapi` | Kişisel site; indigo/cyan/emerald, next-themes (eski tech stack) |
| `keskealsaydim` | Finans paneli, emerald + cyan, shadcn HSL (Vite + React) |
| `ramazan-vakitleri` | Yalnız koyu, mor + pembe + mavi, sistem fontu |
| `digynotes` | ARŞİV — proje diskte yok, doğrulanamaz |

## 3. Kurallar

- Hardcoded renk yok; `dark:` varyantı yok (tema token'la döner).
- Açık tema ters çevrilmez, yeniden tasarlanır; her iki temada ekrana bak.
- Kontrastı ölç: `--text-muted` ve `-ink`/`-wash` çiftleri ≥ 4,5:1, oran token yorumuna.
- Degrade yalnızca üç yerde ve tek renk ailesinde (guides/00 § 1).
- Glass opt-in; varsayılan `.surface`.
- `~/dev-starter/knowledge/mistakes.md` #26, #30, #42, #74–#76.

## 4. Doğrula

```bash
npm run build && npm run typecheck && npm run lint
grep -rn --include='*.tsx' -E 'dark:|bg-white|text-(gray|slate)-[0-9]' app components
```

Ardından iki temada ana ekranları aç (390 ve 1280).

Çıktı: uygulanan palet/tema, değişen dosyalar (`globals.css`, `lib/theme.ts`,
`docs/DESIGN.md`), doğrulama komutlarının exit kodları, ölçülen kontrast
oranları ve iki temada bakılan ekranlar. Ekranı ölçmek gerekiyorsa
`design-reviewer` subagent'ı.
