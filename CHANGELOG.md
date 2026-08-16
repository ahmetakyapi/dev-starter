# Changelog

Tum onemli degisiklikler bu dosyada belgelenir.
Format: [Keep a Changelog](https://keepachangelog.com/) + [Semantic Versioning](https://semver.org/)

---

## [2.1.0] — 2026-08-16

### Eklenenler (Added)

- **Impeccable entegrasyonu**: Tasarim sozlugu Claude Code plugin'i olarak kuruldu
  (`impeccable@impeccable`, 23 komut). `.impeccable/config.json` ile proje ayarlari
- **Imza degradesi token'i**: `gradients.signature` + `bg-signature` utility —
  ekosistemin TEK renk degradesi (indigo→blue→cyan)
- **Degrade Disiplini kurali**: `rules/design-tokens.md` — degrade yalnizca 3 yerde
  (birincil eylem, marka dosemesi, secili gezinme satiri)
- **AI-Slop Yasaklari**: `rules/design-tokens.md` — detector'in yakaladigi 6 kalip
- **Impeccable sozlugu**: `agents/uiux-agent.md` — 11 komutluk tasarim dili + cakisma kurali
- **Tasarim taramasi**: `npm run design:detect` / `design:detect:json` / `npm run health`
- **health-check 12. kategori**: config kontrolu, token disi degrade taramasi,
  violet sizintisi taramasi, detector calistirma
- **quality-scan 6. adim**: commit aninda staged UI dosyalarinda slop taramasi
- **LICENSE**: MIT — kok dizin + her iki pakette
- **ESLint yapilandirmasi**: Her iki sablona `.eslintrc.json` eklendi
  (`next/core-web-vitals` + no-console / no-var / prefer-const)
- **DESIGN.template.md iki katmanli oldu**: Resmi DESIGN.md spec'inin YAML frontmatter
  token semasi (impeccable ve DESIGN.md-uyumlu araclarin okudugu katman) + mevcut
  9 bolumluk gorsel hafiza formati. Ikisi arasinda esleme tablosu eklendi ki
  `/impeccable document` ciktisi format catismasi yaratmasin
- **Ekosistem geneli Do's and Don'ts**: DESIGN sablonunun 7. bolumune proje bazinda
  tartisilmayan 6 kural eklendi (degrade disiplini, violet yasagi, layout animasyonu, emoji)
- **health-check template kontrolu**: Lint script'i olan sablonda ESLint config var mi
- **mistakes.md #42-50**: Impeccable denetimi, npm yayin hazirligi ve sablon
  dogrulamasindan cikan 9 yeni kayit

### Duzeltmeler (Fixed)

- **@ahmetakyapi/theme paketi kirikti**: build `dist/tokens.*` uretiyordu ama
  `package.json` `dist/index.*` isaret ediyordu — paket npm'den import edilemiyordu
  (yayindaki 1.0.0 Mart'tan beri bu hatayla duruyor). Build entry `--entry.index` ile duzeltildi
- **Degrade metin kaldirildi**: `.text-gradient` / `.text-gradient-warm` utility'leri ve
  `bg-clip-text` kullanimlari → solid `.text-accent`
- **CustomCursor layout thrash**: `width`/`height` animasyonu → `transform: scale()`
  (3 dosyada; olcek ic katmana alindi ki imlec konum takibi gecikmesin)
- **Emoji ikonlar**: `nextjs-fullstack` sablonunda emoji → `lucide-react`
  (repo kendi kuralini ihlal ediyordu)
- **Testimonial avatarlari**: 3 ayri degrade → solid marka renkleri, WCAG AA kontrastiyla
- **Sablonlarda lint calismiyordu**: `"lint": "next lint"` script'i ve eslint bagimliliklari
  vardi ama config dosyasi yoktu — `npm run lint` interaktif kurulum sihirbazina dusuyordu
- **Bozuk `eslint-disable` direktifi**: `Logos.tsx`'te aciklama tire ile eklenmis, ESLint
  tireden sonrasini kural adi sanip 2 hata uretiyordu. Key artik index'e dayanmiyor,
  disable satirina gerek kalmadi
- **Isik modu kontrasti**: `nextjs-fullstack` sablonunda baslik ve kart metinleri sabit
  `text-slate-100` idi — `enableSystem` acik oldugu icin isik modunda gorunmez oluyordu

### Degistirilenler (Changed)

- **Violet/purple temizligi**: Marka paleti indigo·blue·cyan·emerald·sky olarak netlesti.
  5 farkli elle yazilmis "marka degradesi" tek `bg-signature` token'ina indirildi
- **@ahmetakyapi/theme + ui**: 2.1.0 — npm yayin metadata'si eklendi
  (license, repository, homepage, bugs, keywords, publishConfig, sideEffects, prepublishOnly)
- **@ahmetakyapi/ui**: `@ahmetakyapi/theme` bagimliligi `*` → `^2.1.0`

### Olcum

- Impeccable detector: **16 bulgu → 0**
- Ekosistem health check: **57 basarili, 0 uyari, 0 hata**
- Her iki sablon: `tsc --noEmit` temiz, `next lint` temiz, `next build` basarili
- `bg-signature` ve `.text-accent` uretilen CSS'te dogrulandi (light + dark)

### Bekleyen

- `knowledge/themes/*.md` (5 dosya) henuz YAML frontmatter token katmanini tasimiyor.
  Bunlar canli projeleri belgeliyor; token degerleri tahmin edilemez, her tema kendi
  projesinden dogrulanarak eklenmeli
- npm yayini: `@ahmetakyapi/theme@2.1.0` ve `@ahmetakyapi/ui@2.1.0` hazir, yayinlanmadi

---

## [2.0.0] — 2026-03-25

### Eklenenler (Added)

- **Agent Sistemi**: 7 agent dosyasi (BA, UI, FE, BE, Gate, Deploy + AGENT_PROTOCOL)
- **Gate Agent**: 6-pass kalite kontrolu (Requirements, Compliance, Security, Tests, Performance, UI) + auto-fix
- **Kural Dosyalari**: 7 kural (immutable-architecture, design-tokens, commit-conventions, bugfix-protocol, dev-cycle, routemap-discipline, context-curation)
- **Faz Dosyalari**: Planning (P1-P6), E2E & Polish (E0-E5), Release & Maintenance
- **Enforcement Hook'lari**: gate-guard.sh, quality-scan.sh, routemap-sync.sh — Claude Code'a entegre
- **Skill Komutlari**: /check, /review-ui, /deploy, /snippet, /theme, /new-project, /release
- **Snippet'ler**: modal, drawer, form, skeleton, toast, confirm (mevcut 4'e ek olarak)
- **Ecosystem Health Check**: scripts/health-check.sh — 11 kategori, otomatik dogrulama
- **CI/CD**: TypeScript kontrolu, guvenlik taramasi, design token kontrolu, ecosystem health check
- **Doc Template'leri**: ROUTEMAP, PRODUCT, ARCHITECTURE, SCREENS sablonlari
- **ESLint + Prettier**: Root seviye yapilandirma
- **EditorConfig**: Tuketici IDE tutarliligi

### Degistirilenler (Changed)

- **Button bilesen**: Hardcoded renkler (`bg-indigo-600`) → semantic token (`bg-ahmet-indigo`)
- **Button bilesen**: Dark/light mode parity eklendi
- **CLAUDE.md**: Tam ekosistem dokumantasyonu ile yeniden yazildi
- **AGENT_PROTOCOL.md**: Lifecycle fazlari, enforcement hook'lari, context curation eklendi
- **CI workflow**: Build-only → quality checks + ecosystem health
- **knowledge/patterns.md**: Error handling, form submission, middleware auth, pagination, file upload, image optimization desenleri eklendi
- **knowledge/mistakes.md**: 32 → 37 hata kaydi (async context, migration rollback, edge limits, framer bundle, npm workspace)

### Duzeltilen (Fixed)

- Button bileseninde design token ihlali (rules/design-tokens.md)
- Ghost ve outline varyantlarinda dark/light mode eksikligi

---

## [1.0.0] — 2026-03-20

### Eklenenler (Added)

- Monorepo yapisi (npm workspaces)
- `@ahmetakyapi/theme` paketi — CSS tokenlari, Tailwind preset, animasyon degerleri
- `@ahmetakyapi/ui` paketi — GlassCard, Button, Chip, CustomCursor + hooks + variants
- Proje sablonlari: nextjs-fullstack, landing
- Snippet'ler: animated-number, infinite-scroll, og-image, search-bar
- Knowledge base: mistakes.md (32 hata), patterns.md, 5 tema dosyasi
- BA ve UI/UX agent dosyalari
- Temel CI pipeline (build + export verify)
