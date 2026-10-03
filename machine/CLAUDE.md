# Ahmet Akyapı — Global Claude Code Kuralları

Bu dosya tüm projelerde geçerlidir. Proje seviyesindeki CLAUDE.md dosyaları bunu override eder.

---

## Kimlik

Ahmet Akyapı — Full-Stack & AI Developer (web ürünleri + yapay zekâ katmanı: Claude API, ajan arayüzleri).
Kişisel projeler: ahmetakyapi.com, Açılış Zili, Mimio, Keskealsaydım, ElevenForge, simayahi
Ekosistem referansı: `~/dev-starter/`

---

## Temel Tech Stack

Proje konfigürasyonu aksini belirtmediği sürece:

- **Framework**: Next.js 16 (App Router) + React 19.2 — `proxy.ts`, Turbopack
- **Stil**: Tailwind CSS v4 — `@theme inline`, `tailwind.config.ts` YOK, `dark:` yok
- **Animasyon**: `motion` (`motion/react`, LazyMotion + `m.*`) — basit hareket CSS, GSAP değil
- **Tema**: `data-theme` + çerez, sunucuda basılır — next-themes yalnız eski projelerde
- **Veritabanı**: PostgreSQL — Neon serverless tercih edilir
- **ORM**: Drizzle ORM — Prisma değil (unless project uses it already)
- **Auth**: next-auth v5 (JWT); tek yöneticili panelde HMAC çerez yeter
- **Doğrulama**: zod 4 — env, form, Server Action girdisi
- **Deployment**: Vercel
- **Dil**: TypeScript — `strict: true`
- **İkonlar**: lucide-react
- **Paket Yöneticisi**: npm · **Node**: 24 (`.nvmrc`), en az 20.9
- **Lint/Test**: ESLint 9 flat config (`next lint` yok) · `node --test` + tsx

---

## Kod Standartları

### TypeScript
- `as const` — literal type'lar için her zaman kullan
- `unknown` tercih et `any` yerine
- Interface yerine `type` — union/intersection'lar için
- Bağımlılık dizilerini (`useCallback`, `useMemo`, `useEffect`) eksiksiz doldur

### React / Next.js
- `'use client'` — sadece gerçekten gerektiğinde; default Server Component
- Server Component'lere motion/useState koyma; `"use client"` modülden sabit export etme (sunucuda referansa döner)
- `params`, `searchParams`, `cookies()`, `headers()` her zaman `await`
- Temiz kopyada önce `npm run build` (ya da `npx next typegen`), sonra typecheck — `PageProps` tipleri oradan
- Segmentte `loading.tsx` yok (soft 404); yavaş parça kendi `<Suspense>`inde
- `suppressHydrationWarning` — `<html>`de; `mounted` guard yalnız next-themes kullanan eski projelerde
- Three.js ve canvas bileşenleri: `dynamic(() => import(...), { ssr: false })`
- Server Action herkese açık POST ucudur: her birinde `auth()` + zod + sahiplik

### Veritabanı
- Serverless (Vercel) ortamında `pg` kullanma — `@neondatabase/serverless` kullan
- Her foreign key'de `ON DELETE` davranışını belirt
- Her migration sonrası Drizzle tipleri yeniden üret
- Migration deploy'da uygulanmaz → yeni özellik kendi tablosunu alır, tablo yokken sessizce düşer

### Environment Variables
- `.env.example` dosyasını her zaman güncelle (değer olmadan)
- Client erişimi gereken varlar: `NEXT_PUBLIC_` prefix
- Vercel'de env varları deploy öncesi ekle

---

## Görsel Dil

Proje seviyesinde farklı tema belirtilmediği sürece Açılış Zili referans alınır
(`signature` paleti ve token mimarisi oradan). ahmetakyapi.com da Ekim 2026 yenilemesiyle `signature` paletine geçiyor.

### Ortak Tasarım DNA — Kimlik Ortak, Palet Projeye Göre
Projeler tek markanın ürünleri gibi tanınır ama hepsi aynı renkte değildir.
Ayrıntı: `~/dev-starter/guides/00-brand-identity.md`.

**Kimlik (her projede, değişmez):**
- **Token**: iki katman — ham rol değişkenleri `:root[data-theme]`, köprü `@theme inline`; rol adları ortak
- **Derinlik**: gölgeyle değil **ton farkıyla**; tek gerçek gölge açılır katman ve marka karosunda
- **Glass**: opt-in, yalnızca altından içerik geçen öğede; `@supports` korumalı, `prefers-reduced-transparency`de opak. Blur 12–16 px
- **Degrade**: yalnızca üç yerde (kısa display başlık, birincil eylem, marka karosu), tek renk ailesi içinde; veri panelleri ve gövde metni taşımaz
- **Ease**: `[0.22, 1, 0.36, 1]` — CSS'te `--ease-brand`, `@theme`te varsayılan geçiş eğrisi
- **Erişilebilirlik**: kontrast ölçülür (≥ 4,5:1, `-ink` kuralı), 44 px dokunma hedefi, 2 px odak halkası
- **Açık tema** ters çevrilmez, yeniden tasarlanır. **Şablon varsayılanı açık**; portfolyo/oyun koyu

**Palet (`data-palette`):** `signature` varsayılan — Açılış Zili'nin lacivert → mavi
ailesi (açık `#0d74c4`, koyu `#35b8ff`); `verdant` (zümrüt; sağlık/terapi), `ember`
(kehribar; oyun/topluluk), `iris` (mor-indigo; yaratıcı/yapay zekâ). Palet `/kickoff`ta
seçilir. Mevcut projeler kendi temalarıyla kalır.

> **Not:** Mimio (Ağustos 2026, "Deniz" v2) kendi yolunu izler: imza mavi→cyan
> degradesi, üç katmanlı zemin (aurora → grain → cam), varsayılan tema açık.
> Degrade yalnızca üç yerde: birincil eylem, seçili gezinme satırı, marka
> döşemesi. Veri panelleri degrade taşımaz. Bkz. `THEME.md`.

> **Not:** Açılış Zili glass/glow kullanmaz — derinlik gölgeyle değil **ton
> farkıyla** kurulur. Degrade metin (`.display-ink`) ekosistem yasağına
> **belgeli istisnadır**: token'lanmış, `@supports` korumalı, solid fallback'li,
> descender düzeltmeli ve yalnızca kısa display metninde (artık kimlik kuralının
> "üç yer"inden biri). Ayrıca `--ease-brand`
> `--default-transition-timing-function` olarak ayarlı — her geçiş marka
> eğrisini otomatik alır, ayrıca yazmaya gerek yok.

### Proje Tema Referansları
| Proje | Font | Vurgu | Tema Sistemi | Detay |
|-------|------|-------|--------------|-------|
| ahmetakyapi.com | Manrope + IBM Plex Mono | İndigo+Cyan+Emerald | next-themes class | `knowledge/themes/ahmetakyapi.md` |
| Açılış Zili | Schibsted Grotesk (tek aile, değişken 400–900) | Lacivert→mavi tek aile (`#0d74c4` / koyu `#35b8ff`) + yön renkleri (up/down) | Custom `data-theme`, **varsayılan açık** | `knowledge/themes/acilis-zili.md` |
| Mimio | Schibsted Grotesk (başlık) + Plus Jakarta Sans (gövde) + IBM Plex Mono | Mavi→cyan imza degradesi (`#2b62f5`→`#17c2e0`) | Custom `data-theme`, **varsayılan açık** | `knowledge/themes/mimio.md` |
| DigyNotes | Avenir Next (system) | Emerald (`#10b981`) | `html.light` class | `knowledge/themes/digynotes.md` |
| Keskealsaydım | Archivo + IBM Plex Mono | Emerald + Cyan | shadcn HSL vars, açık/koyu tam destek | `knowledge/themes/keskealsaydim.md` |
| Ramazan Vakitleri | System stack | Mor+Pembe+Mavi | Dark only (CSS) | `knowledge/themes/ramazan-vakitleri.md` |

---

## Metin Yazımı

### Başlık büyük harf düzeni — Title Case
Başlıklar, alt başlıklar, düğme etiketleri, sekme adları, kart başlıkları ve
menü satırları **Title Case** yazılır:

- ✅ `Yeni Danışan`, `Seansı Başlat`, `Haftalık Plan`, `Gelişim Eğrisi`
- ❌ `Yeni danışan`, `Seansı başlat`, `Haftalık plan`

**Kapsam dışı** (cümle düzeni korunur):
- Gövde metni ve açıklama satırları — `Skor sütunu son 8 seansın eğilimini gösterir.`
- Veri altındaki mono mikro etiketler — `bağımsızlık 4/5`, `birincil hedef`, `3 gün önce`
- Boş durum cümleleri ve yardım metinleri

**Türkçe tuzağı:** `title()` / `text-transform: capitalize` kullanma —
`i → I` üretir, `İ` değil. Küçük bağlaçlar (`ve`, `ile`, `için`, `de`, `da`)
başta değilse küçük kalır. Kısaltmalar olduğu gibi durur: `CSV`, `AOTA`, `SOAP`.

### Çeviri kokan ifade yok
İngilizceden kelime kelime çevrilmiş, Türkçede tuhaf çağrışım yapan ifade
kullanılmaz — arayüzde de, belgede de, yanıtta da:

- ❌ `çıplak sayı`, `çıplak alan adı` → ✅ `birimsiz sayı`, `kök alan adı`, `yalın`, `süssüz`
- ❌ `olay ateşlenir` → ✅ `olay tetiklenir`, `çalışır`
- ❌ `kutudan çıktığı gibi` → ✅ `varsayılan olarak`
- ❌ her şeye `yüzey` → ✅ ne olduğunu söyle: `kart`, `panel`, `zemin`

## Yasaklı Yaklaşımlar

- CSS-in-JS (styled-components, emotion) — Tailwind yeter
- Class-based React bileşenleri
- `var` — sadece `const`/`let`
- `console.log` commit'e gitmemeli (dev debug dışında)
- Gereksiz `any` kullanımı
- `// @ts-ignore` — gerçek sorunu çöz
- Magic number'lar — named constant kullan
- `eslint-disable` yorum satırı — sorunu düzelt

---

## Dosya Yapısı Tercihleri

```
app/
  (auth)/           # auth route grubu
  api/              # API routes
  [feature]/        # feature route'ları
components/
  ui/               # genel UI bileşenleri
  [feature]/        # feature'a özgü bileşenler
lib/
  db.ts             # tembel Neon bağlantısı
  schema.ts         # Drizzle schema
  env.ts            # zod ile env doğrulama
  theme.ts          # THEME_COOKIE, DEFAULT_THEME, PALETTE ("use client" değil)
  motion.ts         # EASE, DUR, SPRING ("use client" değil)
  utils.ts          # cn() (extendTailwindMerge) + yardımcılar
proxy.ts            # Next 16 — çerez varlığına bakan ön eleme
hooks/              # custom hooks (use*.ts)
types/              # global TypeScript tipleri
```

---

## Commit Mesajı Formatı

```
<tip>: <kısa açıklama>

Tip'ler: feat, fix, style, refactor, docs, chore, perf
Örnek: feat: add dark mode toggle to header
```

**"Commitle" push'u da kapsar.** Ahmet commit istediğinde aynı turda `git push`
de yapılır. "Push edeyim mi?" diye SORMA, onay bekleme — tek kişilik özel
repolarda çalışıyor, arada bekletmek boş bir tur. `main`'e push'un otomatik
Vercel deploy tetiklediği projelerde sonuç canlı dağıtımdır; bunu bilerek
kabul etti, ayrıca uyarma.

Koruma onay sorusu değil, commit ÖNCESİ kontroldür: `git status` ile yalnızca
amaçlanan dosyaların girdiğini doğrula, `typecheck` ve `build` çalıştır.

---

## Öğrenilen Hatalar

Detaylı liste: `~/dev-starter/knowledge/mistakes.md`

Kritik olanlar:
1. Tema çerezden sunucuda → script yok, `mounted` guard yok (next-themes yalnız eski projelerde)
2. Three.js / React Quill → `dynamic(..., { ssr: false })`
3. Serverless DB → `@neondatabase/serverless` (pg değil), tembel `db`
4. motion → `motion/react` + `m.*`, `layoutId` unique, `'use client'` şart; reduced-motion'da `initial={false}` yok
5. Vercel deploy → env ve migration deploy'dan önce
6. Tailwind v4 → `@theme inline`; katmansız CSS utility'yi ezer; özel punto adları `extendTailwindMerge`e kayıtlı
7. Zemin katmanı `position: fixed` pseudo-element (`background-attachment: fixed` değil), grain'de `mix-blend-mode` yok
8. Next 16 → `proxy.ts`, `next lint` yok, typecheck'ten önce build
9. Migration → her zaman yeni dosya, eskiyi değiştirme
10. Hardcoded renk yok → her zaman CSS variable/token; `dark:` yok

---

## Tasarım Skill'leri (taste-skill ailesi)

Kurulu ve tüm oturumlarda açık: `~/.agents/skills/` → `~/.claude/skills/`
(symlink). Kaynak: `npx skills add Leonxlnx/taste-skill`, yalnızca kullanılan
yedisi (`machine/bootstrap.sh` → `TASTE_SKILLS`): `design-taste-frontend`,
`redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`,
`brandkit`, `imagegen-frontend-web`, `imagegen-frontend-mobile`. Depodan ayrıca
`motion-design`. Paketin geri kalanı ve impeccable 3 Ekim 2026'da kaldırıldı.

> **VARSAYILAN — her projede geçerli.** `design-taste-frontend` (taste-skill v2)
> tanıtım sayfası, portfolyo ve pazarlama sayfası içeren **her** frontend işinde
> KOD YAZMADAN ÖNCE çağrılır. "Küçük bir düzeltme" bahanesi yok: skill'in
> denetim listesi (em dash yasağı, eyebrow tavanı, bölüm düzeni tekrarı, sahte
> ekran görüntüsü yasağı, kahraman disiplini) tam da o küçük düzeltmelerde
> ihlal ediliyor. Kullanıcı adını anmasa bile çağır.
>
> **Kapsam dışı (skill §13):** panolar, yoğun ürün arayüzü, yönetim panelleri,
> veri tabloları, çok adımlı formlar. Bu ekranlarda skill'in yalnızca pazarlama
> bölümleri geçerlidir; kalanında proje tema dosyası ve ekosistem kuralları
> yürür. İş bir panoysa bunu açıkça söyle, skill'i zorla uygulama.

**Ne zaman çağır**
| Durum | Skill |
|-------|-------|
| **Her frontend işi — varsayılan** | `design-taste-frontend` |
| Mevcut arayüzü premium'a çekme | `redesign-existing-projects` |
| Marka rehberi, logo sistemi | `brandkit` |
| Görsel referans üretimi (web / mobil) | `imagegen-frontend-web` / `-mobile` |
| Hareket kararı, zamanlama | `motion-design` + `~/dev-starter/guides/04-motion.md` |
| Sade editoryal arayüz | `minimalist-ui` |

**Mevcut projeye girerken — mod tespiti (skill §11.A) ŞART**
Var olan bir sitede skill'in varsayılan dial'ları (8/6/4) KULLANILMAZ. Mod
"Redesign — Preserve"dir: marka token'ları, IA, çapa (`#anchor`) ve kopya sesi
korunur; dial'lar sitenin kendi okumasından çıkarılır. Skill'i greenfield gibi
çalıştırmak marka kimliğini siler.

**Öncelik sırası — çakışma olursa**
1. Proje `THEME.md` ve `knowledge/themes/*` — renk, font, degrade, radius,
   gölge, bileşen dili. Skill bunları **ezmez**.
2. Bu dosyadaki ekosistem kuralları ve `~/dev-starter/guides/` — kimlik, motion, Tailwind v4, token zorunluluğu.
3. Skill'in zanaat kuralları — eyebrow tavanı, kahraman disiplini, sahte
   ekran görüntüsü yasağı, bölüm düzeni tekrarı, CTA tutarlılığı.

**Bilinen çakışmalar**
- Skill'ler GSAP ya da `framer-motion` önerebilir; ekosistem `motion/react`
  (LazyMotion + `m.*`) ve CSS kullanır. Öneriyi bu tech stack'e çevir.
- `high-end-visual-design` kendi font/gölge setini getirir; tema dosyası olan
  projelerde (Mimio, Açılış Zili) çağırma.
- Skill'ler `lucide-react`'i önermez; ekosistem kuralı `lucide-react` der.
  Mevcut projede zaten kuruluysa skill'in kendi istisnası geçerli, lucide kalır.
- Skill em dash'i tümüyle yasaklar. Bu kural **kullanıcıya görünen arayüz
  metni** için geçerlidir; kod yorumları ve dokümanlar kapsam dışı.

---

## Yeni Proje Başlarken

```
/kickoff       — fikirden plana: pazar, yön, palet, MVP (strategist)
/new-project   — şablon seç ve kur (nextjs-fullstack · landing · + agentic-chat)
/theme         — palet ya da görsel tema uygula
/check         — sağlık kontrolü · /deploy — Vercel checklist · /roadmap — sıradaki işler
```

Sırayla izlenecek rehber: `~/dev-starter/guides/` (00 kimlik → 01 ilk gün → 08 yayına çıkış).
Ekosistem: `~/dev-starter/` · Knowledge base: `~/dev-starter/knowledge/`
