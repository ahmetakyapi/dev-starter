# Changelog

Tum onemli degisiklikler bu dosyada belgelenir.
Format: [Keep a Changelog](https://keepachangelog.com/) + [Semantic Versioning](https://semver.org/)

---

## [Yayınlanmamış]

### Kapsamli Denetim — 2026-08-17

14 agent'lik bir denetim ekosistemin tamamini taradi; 79 bulgu dogrulama
asamasindan gecti. Cikan tema: **kontrollerin cogu kendi konusunu test
etmiyordu.** Uc guvenlik agi ayni anda kirikti ve ucu de yesil rapor veriyordu.

#### Duzeltmeler (Fixed) — kirik olanlar

- **@ahmetakyapi/ui npm'de App Router'da kirikti**: tsup bundle ederken
  kaynaktaki `'use client'` direktifini dusuruyordu. Yayindaki 2.1.0 bir Server
  Component'ten import edilince kiriliyordu. `tsup.config.ts` + banner eklendi;
  `verify:exports` artik dist'in ILK satirini kontrol ediyor (negatif test
  edildi: banner'siz exit 1, banner'la exit 0)
- **gate-guard.sh ve quality-scan.sh 5 aydir no-op'tu**: girdiyi `TOOL_INPUT`
  environment variable'indan okuyorlardi; Claude Code STDIN'den JSON veriyor.
  Secret taramasi, `.env` kontrolu, `@ts-ignore` ve impeccable taramalarinin
  hicbiri bir kez bile calismadi. Ikinci hata: `awk '{print $NF}'` markdown
  tablosunun bos son alanini okuyordu (`$(NF-1)` olmali) — hook calissaydi bile
  Gate PASSED olan story'yi bloklayacakti. Ikisi de duzeltildi
- **CI'in guvenlik taramasi ters calisiyordu**: `! grep ... || echo "temiz"`
  idiomu sizinti VARKEN hem eslesen satiri basip hem "No secrets found" yazip
  exit 0 veriyordu. Fixture ile repro edildi ve acik `if`/`exit 1`'e cevrildi
- **templates/nextjs-fullstack'te postcss.config.js hic yoktu**: Tailwind tek
  bir utility bile uretmiyordu — bu sablondan uretilen her proje tamamen
  stilsiz aciliyordu. `build`, `tsc` ve `lint` ucu de yesil veriyordu
- **ESLint hic calismamisti**: bagimliliklar kurulu degildi (config onlari
  import ediyordu), CI adimi `|| true` ile maskeliydi, health-check yine de ✅
  diyordu. Ilk gercek kosu 128 bulgu verdi — tamami `no-undef` false-positive'i
  oldugu icin dogru duzeltme config'teydi. Ayrica flat config'te `ignores:
  ['dist/']` ic ice `dist`'i kapsamiyordu (`**/dist/**` olmali)
- **knowledge/patterns.md iki calismaz kod ornegi dagitiyordu**: next-auth v5
  route handler'i (`handlers as GET` — tum objeyi handler saniyor; canli
  acilis-zili dosyasindan dogrulandi) ve cursor pagination (cursor siralanmayan
  UUID sutununda, yon ters — SESSIZ bozulur, ilk sayfa dogru gorunur)
- **templates/nextjs-fullstack/.gitignore migration'lari yok sayiyordu**
  (`drizzle/`) — `immutable-architecture` §3'un tam ziddi
- **@ahmetakyapi/theme imleci kosulsuz gizliyordu** (`cursor: none !important`):
  paketi yalnizca token icin kuran tuketicide bile imlec kayboluyordu ve
  `!important` yuzunden geri alinamiyordu. Artik `data-custom-cursor` kancasina
  bagli

#### Eklenenler (Added)

- **`scripts/test-hooks.sh`** — hook'larin 9 davranis testi. Gercek Claude Code
  payload'i verip exit kodunu dogrular. Eski kodda 3/9 basarisiz veriyor, yeni
  kodda 9/9 geciyor. health-check artik varlik degil davranis test ediyor
- **Test altyapisi** — vitest + `tests/contract.test.ts` (11 assertion).
  `bugfix-protocol.md`'nin TDD zorunlulugu ve Gate Pass 4'un `npm test`'i
  ilk kez icra edilebilir. Imza ease egrisi, `cn()` merge sirasi ve degrade
  token'i artik sessizce degisemez
- **`prefers-reduced-motion` destegi** — ekosistemde 34 framer-motion dosyasi
  vardi ve hicbirinde yoktu. Paket CSS'i, iki sablon, CustomCursor, useMagnetic
  ve useCardTilt kapsandi
- **health-check'e yapisal invaryant**: `@tailwind` kullanan bir sablonda
  `postcss.config.*` ZORUNLU. Derleyicinin goremedigi hata sinifini yakalar
- **`.claude/agents/gate.md` ve `deploy.md`** — ilk gercek Claude Code
  subagent'lari (ince sarmalayici; rol tanimi `agents/` altinda tek kaynak)
- **`.claude/settings.json`** — hook'lar artik paylasilan/versiyonlanan
  dosyada; `settings.local.json` gitignore'landi (icindeki olu Windows yolu
  `C:\Old Projects\...` silindi)
- Iki sablona `error.tsx` + `not-found.tsx`, guvenlik basliklari
  (`poweredByHeader: false`, nosniff, Referrer-Policy, X-Frame-Options,
  Permissions-Policy), `.nvmrc`, kok `engines: node >=22.18`
- `mistakes.md` #52–#56, tema dosyalarina `Kaynak: <yol> — <tarih>` satiri

#### Degistirilenler (Changed)

- **`~/dev-starter` symlink olusturuldu** — 39 referans (agent dosyalari, her
  iki sablonun CLAUDE.md'si, global CLAUDE.md) var olmayan bir yola isaret
  ediyordu. Tek symlink, sifir dosya degisikligi
- **commit-conventions.md gercege uyduruldu**: "Turkce degil, Ingilizce" kurali
  kaldirildi. Ekosistemin referans projesi `acilis-zili`'nin 50 commit'inin
  48'i Turkce ve iyi yazilmis. Yeni kural: tip/scope Ingilizce, description
  proje dilinde. *Iyi yapilmis isi degistirmeye zorlayan kural, yanlis kuraldir*
- **"auth tam uygulama" iddiasi kaldirildi** — sablonda next-auth, auth.ts,
  middleware.ts ve adapter tablolari yok. README, CLAUDE.md ve new-project.md
  durustlestirildi; `.env.example` karsiligi olmayan degiskenleri artik
  "kurulu degil" basligi altinda tutuyor
- **design-tokens.md kendi kendisiyle celisiyordu**: `rgba()` CRITICAL ihlal
  sayiliyordu ama ayni dosya rgba'li multi-layer shadow oneriyordu. Alfa
  kanalli golge katmanlari istisnaya alindi
- `AGENT_PROTOCOL.md` artik SDK subagent'i oldugunu iddia etmiyor; birebir
  yinelenen SDK blogu silindi
- `uiux-agent.md`: detector bulgulari AI-Slop tablosuyla "ayni liste" degil,
  6 satir vs 59 kural — alt kume oldugu yazildi
- `deploy-agent.md` + `release-maintenance.md`: `NEXTAUTH_SECRET`/`URL` (v4)
  → `AUTH_SECRET`/`AUTH_URL` (v5)
- Tema listeleri guncellendi: `acilis-zili` eklendi, Mimio duzeltildi
  (`#0c1620` → canli deger `#050b16`), `digynotes` **arsiv** olarak isaretlendi
  (proje diskte yok), `e2e-polish.md` `prisma/seed.ts` → `scripts/seed.ts`
- 7 slash komutuna `argument-hint` eklendi

#### Olcum

- `bash scripts/health-check.sh` → **61 basarili, 0 uyari, 0 hata**
- `bash scripts/test-hooks.sh` → 9/9 (eski kodda 3 basarisiz)
- `npm test` → 11/11 · `npm run lint` → temiz · `npm run typecheck` → temiz
- `node scripts/verify-package-exports.mjs` → tum girisler dogrulandi
- `npm run design:detect` → 0 bulgu

### Degistirilenler (Changed)

- **Degrade yasagi KALDIRILDI**. 2.1.0'da eklenen "degrade metin yasak" ve
  "degrade yalnizca 3 yerde" kurallari geri alindi. Uygulamada fazla kati
  cikti: `acilis-zili`, `onepiece-hub` ve `ahmetakyapi.com` ucu de degradeyi
  kasitli ve dogru kullaniyordu; kural onlari kotulestirecekti.

  Yerine iki bagalayici madde: **(1)** tekrar eden degrade token'dan gelir,
  **(2)** degrade metin solid fallback tasir (`@supports` + `color`). Violet de
  yasak degil artik — palete eklenmeli ya da sizinti oldugu kabul edilmeli.
  Ayrimi sayiya degil **token tanimina** bakarak yap.

- **Agent dosyalari bastan gozden gecirildi** — hepsi dogrulama yapmaya zorluyor.
  Onceki hallerinde her sey duz yazi kontrol listesiydi; agent kodu okuyup
  "kontrol ettim" diyebiliyordu. Gate'in 6 pass'i artik komut calistiriyor,
  FE/BE/UI/DP'ye teslim oncesi dogrulama blogu eklendi, BA kanitsiz teslimati
  geri ceviriyor.

- **Teknoloji referansi gercek olculere gore duzeltildi**: ekosistem Next 15 /
  React 19 / Tailwind v4'te degil — cogunluk hala **14 / 18 / v3**, yalnizca iki
  proje 16 / 19 / v4'te. Repo tablosu 5 projeden 12'ye cikarildi.

### Eklenenler (Added)

- `scripts/audit-project.sh` — bir projeyi 8 standarda karsi denetler
- `knowledge/live-projects-audit.md` — 12 canli projenin durumu
- `knowledge/themes/acilis-zili.md` — 6. tema dosyasi
- `AGENT_PROTOCOL.md → Dogrulama Disiplini` — bu oturumda yanlis cikan alti
  iddianin kaydi ve "kontrolun kendisini de kontrol et" kurali

### Duzeltmeler (Fixed)

- **@ahmetakyapi/theme@2.1.0 ve @ahmetakyapi/ui@2.1.0 npm'de yayinlandi.**
  1.0.0 Mart'tan beri import edilemiyordu; temiz dizinde kurulup dogrulandi
- `onepiece-hub` (PR #3), `ahmetakyapi.com` (PR #1), `ramazan-vakitleri` (PR #2)

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
- **`scripts/verify-package-exports.mjs`**: Manifest'in vaat ettigi her yolu
  (`main`, `module`, `types`, `exports`, `files`) kontrol eder ve giris noktalarini
  gercekten yukler. `npm run verify:exports` — CI'a da eklendi
- **mistakes.md #42-50**: Impeccable denetimi, npm yayin hazirligi ve sablon
  dogrulamasindan cikan 9 yeni kayit

### Duzeltmeler (Fixed)

- **CI paketin sozlesmesini dogrulamiyordu**: `Verify exports` adimi build'in urettigi
  `dist/tokens.js`'i require ediyordu — `package.json`'un isaret ettigi `dist/index.js`'e
  hic bakmadi. Kirik paketin 5 ay fark edilmemesinin sebebi buydu. Adim artik
  `verify:exports` script'ini calistiriyor. CI ayrica Node 20 → 22 (impeccable engines)
  ve `PUPPETEER_SKIP_DOWNLOAD` ile Chrome indirmesini atliyor
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
