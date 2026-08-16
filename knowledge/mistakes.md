# Öğrenilen Hatalar — Tekrarlama

Her proje sonrası tespit edilen hatalar buraya eklenir.
Yeni bir projeye başlamadan önce bu dosya okunmalı.

---

## Next.js

### 1. next-themes Hydration Mismatch

**Hata**: `Warning: Text content did not match. Server: "dark" Client: "light"`

**Sebep**: `<html>` tag'ine `suppressHydrationWarning` eklenmemiş

**Çözüm**:

```tsx
// app/layout.tsx
<html lang="tr" suppressHydrationWarning>
```

**Ekstra**: Tema bağımlı UI için `mounted` state bekle:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null  // veya skeleton
```

### 2. Three.js / SSR Çakışması

**Hata**: `ReferenceError: window is not defined` — server-side render sırasında

**Sebep**: Three.js/R3F bileşenleri SSR ile uyumsuz

**Çözüm**:

```tsx
const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { ssr: false })
```

**Kural**: Three.js, canvas, WebGL kullanan tüm bileşenler `dynamic` ile import edilmeli.

### 3. App Router'da `params` await Edilmemesi

**Hata**: Next.js 15'te `params` bir Promise oldu

**Çözüm**:

```tsx
// Next.js 15+
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}
```

### 4. `useSearchParams` Suspense Boundary

**Hata**: `useSearchParams() should be wrapped in a suspense boundary`

**Çözüm**: `useSearchParams` kullanan bileşeni `<Suspense>` ile sar

---

## PostgreSQL / Database

### 5. Serverless'ta pg Pool Sorunu

**Hata**: Vercel'de her request yeni connection açıyor, timeout'lar oluşuyor

**Sebep**: `pg` kütüphanesi serverless için optimize edilmemiş

**Çözüm**: Neon Postgres için `@neondatabase/serverless` kullan:

```ts
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)
```

### 6. Migration Sonrası Tip Uyumsuzluğu

**Hata**: DB'ye kolon eklendi ama TypeScript tipler güncellenmedi

**Çözüm**: Her migration sonrası Drizzle/Prisma ile tip yeniden üret:

```bash
npx drizzle-kit generate && npx drizzle-kit push
# veya
npx prisma generate
```

### 7. `ON DELETE CASCADE` Unutulması

**Hata**: Parent silince orphan kayıtlar kalıyor

**Kural**: Her foreign key tanımında `ON DELETE` davranışını açıkça belirt

---

## Framer Motion

### 8. `layoutId` Key Çakışmaları

**Hata**: Aynı `layoutId`'ye sahip birden fazla element, animasyon bozulması

**Sebep**: Liste öğelerinde unique olmayan `layoutId`

**Çözüm**: `` layoutId={`card-${item.id}`} `` şeklinde unique yap

### 9. `AnimatePresence` mode="wait" Unutulması

**Hata**: Çıkış animasyonu beklenmiyor, yeni eleman üstüne bindirilmiyor

**Çözüm**:

```tsx
<AnimatePresence mode="wait">
  <motion.div key={currentPage} ... />
</AnimatePresence>
```

### 10. Server Component'te Framer Motion

**Hata**: `You're importing a component that needs useState...`

**Çözüm**: Framer Motion kullanan tüm bileşenler `'use client'` direktifi içermeli

---

## TypeScript

### 11. `as const` Olmadan Tuple

**Hata**: `[0.22, 1, 0.36, 1]` tipi `number[]` olarak çıkarılıyor

**Çözüm**:

```ts
const EASE = [0.22, 1, 0.36, 1] as const  // readonly [0.22, 1, 0.36, 1]
```

---

## Vercel / Deployment

### 12. Environment Variable Eksikliği

**Hata**: Build geçiyor, production'da runtime error

**Kural**: Her yeni env var için:

1. `.env.local` — local
2. Vercel dashboard → Settings → Environment Variables
3. `.env.example` dosyasına ekle (değer olmadan)

### 13. `NEXT_PUBLIC_` Prefix Unutulması

**Hata**: Client-side'da env var `undefined`

**Kural**: Client'ta erişilecek env varlar `NEXT_PUBLIC_` ile başlamalı

---

## Genel

### 14. `useCallback`/`useMemo` Bağımlılık Dizisi

**Hata**: Stale closure — eski değerler kullanılıyor

**Kural**: ESLint `exhaustive-deps` uyarılarını asla yoksayma

### 15. Tailwind Dark Mode Sınıf Karışıklığı

**Hata**: `dark:bg-gray-900` çalışmıyor

**Sebep**: `tailwind.config` içinde `darkMode: 'class'` yok veya `<html>` üzerinde `.dark` class eksik

**Çözüm**: next-themes + `darkMode: 'class'` kombinasyonu

---

## Mimio'dan Öğrenilenler (next-themes Alternatifleri)

### 16. next-themes Olmadan FOUC Önleme

**Hata**: `next-themes` kullanmadan dark mode — sayfa ilk açılışta beyaz çakar

**Çözüm**: `<head>` içine inline script ekle:

```html
<script dangerouslySetInnerHTML={{ __html:
  `try{var t=localStorage.getItem('mimio-theme');
   document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');
  }catch(e){}`
}} />
```

**Not**: Bu pattern `suppressHydrationWarning` yerine `data-theme` attribute kullanır. next-themes olmadan hydration mismatch olmaz.

### 17. Tailwind v4: `tailwind.config.ts` Yok

**Hata**: v4 projesinde `tailwind.config.ts` oluşturmaya çalışmak

**Fark**: Tailwind v4'te konfigürasyon `globals.css` içinde `@theme {}` bloğuyla yapılır

```css
@import "tailwindcss";
@theme {
  --color-primary: #6366f1;
}
```

**Kullanım**: `bg-(--color-primary)` syntax'ı — `bg-indigo-500` değil

### 18. `background-attachment: fixed` Mobilde Çalışmaz

**Hata**: `background-attachment: fixed` iOS/Android'de scroll sırasında titreşir

**Çözüm**: Mobil breakpoint'te `scroll`'a döndür:

```css
@media (max-width: 640px) {
  body { background-attachment: scroll; }
}
```

**Not**: DigyNotes ve Keskealsaydım da bu düzeltmeyi yapıyor.

---

## DigyNotes'tan Öğrenilenler

### 19. React Quill SSR Sorunu

**Hata**: `react-quill` Next.js'de SSR ile çalışmaz

**Çözüm**: `dynamic` import ile yükle:

```tsx
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
```

### 20. Prisma Generate Build'de Unutulması

**Hata**: Vercel build'de `PrismaClientInitializationError`

**Sebep**: `prisma generate` build öncesi çalıştırılmadı

**Çözüm**:

```json
{ "scripts": { "build": "prisma generate && next build" } }
```

### 21. Scroll Lock'ta `position: fixed` ile Scroll Pozisyonu Kaybolması

**Hata**: Modal açıldığında body'e `overflow: hidden` + `position: fixed` eklenince sayfa başa atlar

**Çözüm**: `top: var(--scroll-lock-top, 0)` ile scroll pozisyonunu sakla, kapanışta geri yükle:

```ts
document.documentElement.style.setProperty('--scroll-lock-top', `-${window.scrollY}px`)
// Kapatınca:
const scrollY = parseInt(style.getPropertyValue('--scroll-lock-top') || '0')
window.scrollTo(0, -scrollY)
```

---

## Keskealsaydım'dan Öğrenilenler

### 22. Vite Chunk Boyutu Uyarısı (`> 500kB`)

**Hata**: `Some chunks are larger than 500 kB after minification`

**Çözüm**:

1. Route bazlı lazy loading: `const Page = lazy(() => import('./pages/X'))`
2. `vite.config.ts`'de `manualChunks`:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: { vendor: ['react', 'react-dom'] }
    }
  }
}
```

### 23. Go Backend + Frontend Vercel Deploy

**Hata**: Go API + Vite frontend'i Vercel'de nasıl deploy edilir bilinmiyor

**Çözüm**: `vercel.json` ile rewrite kuralları:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Not**: Go için `api/` dizini Vercel Serverless Functions olarak çalışır.

### 24. ESLint Config Dosyası Bulunamadı

**Hata**: `ESLint couldn't find a configuration file`

**Sebep**: Frontend alt dizininde ayrı eslint config gerekiyor

**Çözüm**: `frontend/.eslintrc.cjs` oluştur ve `@typescript-eslint/*` paketlerini kur

### 25. DB Migration'ları Geri Dönük Değiştirme

**Hata**: Var olan migration dosyasını düzenlemek

**Kural**: Migration dosyaları immutable'dır — değişiklik için her zaman yeni migration dosyası oluştur

---

## Genel (Tüm Projelerden)

### 26. Hardcoded Renk Değerleri Kullanmak

**Hata**: `bg-white`, `text-gray-900`, `border-gray-200`, `rgba(255,255,255,0.04)`

**Kural**: Her zaman CSS variable veya Tailwind token kullan

```tsx
// ❌ Yanlış
<div className="bg-white dark:bg-gray-900">
<div style={{ background: "rgba(255,255,255,0.04)" }}>

// ✅ Doğru (Mimio/ahmetakyapi stili)
<div className="bg-(--color-surface)">
<div className="glass">
```

### 27. `font-variant-numeric` Sayı Gösterimlerinde

**Hata**: Rakamlar satır içinde farklı genişliklerde — tablo hizalama bozulur

**Çözüm**:

```css
.number-ticker { font-variant-numeric: tabular-nums; }
```

Finance/istatistik uygulamalarında her sayı gösterimi için.

---

## Landing Template'ten Öğrenilenler

### 28. `postcss.config.js` Eksikliği — Tailwind Utility'leri Çalışmaz

**Hata**: Sayfada dark background var, gradient text çalışıyor ama flex/grid/padding gibi utility class'ları hiç uygulanmıyor

**Sebep**: Next.js, `postcss.config.js` olmadan `tailwind.config.ts`'i otomatik işlemiyor. `@tailwind base/components/utilities` directive'leri tarayıcıya ham olarak gidiyor ve ignore ediliyor. `@layer` içindeki custom CSS ise native CSS Cascade Layers olarak çalışmaya devam ediyor — bu yüzden `.glass`, `.text-gradient` gibi class'lar çalışıyor ama utility class'lar çalışmıyor.

**Çözüm**: Proje kökünde `postcss.config.js` oluştur:

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

**Kural**: Yeni Next.js + Tailwind kurulumlarında `postcss.config.js`'i kontrol et.

### 29. `enableSystem: true` ile Hydration Mismatch

**Hata**: `Error: Text content does not match server-rendered HTML`

**Sebep**: `enableSystem: true` olan ThemeProvider — server "light" render eder, client browser'ın `prefers-color-scheme: dark`'ını detect eder ve temayı değiştirir. `suppressHydrationWarning` `<html>` class mismatch'ini susturur ama React virtual DOM ile client DOM arasındaki theme-dependent renderları susturmaz.

**Çözüm**: `enableSystem` kaldır, `disableTransitionOnChange` ekle:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
```

**Kural**: `enableSystem` sadece SSR'siz (pure client-side) projelerde güvenli.

### 30. Dark-Only Tailwind Renkleri Light Temada Görünmez Olur

**Hata**: Light temaya geçince card başlıkları, badge metinleri, metric değerleri kaybolur

**Sebep**: `text-slate-50`, `text-slate-100` gibi neredeyse-beyaz renkler dark card'larda iyi görünür ama `.glass` bileşeni light modda `rgba(255,255,255,0.84)` background'una döner — bu renklerin üstünde görünmez olurlar.

**Çözüm**: Her text rengi için `dark:` prefix'li alternatif yaz:

```tsx
// ❌ Sadece dark temada çalışır
<h3 className="text-slate-100">
<p className="text-slate-400">

// ✅ Her iki temada da çalışır
<h3 className="text-slate-900 dark:text-slate-100">
<p className="text-slate-600 dark:text-slate-400">
```

**Kural**: Yeni bileşen yazarken mutlaka hem `light` hem `dark` class'larını birlikte tanımla. Sadece `dark:` prefix'li varyant yazmak yetmez.

### 31. Dekoratif UI Mockup'larında Dark-Only Shell Stilleri

**Hata**: Light temaya geçince hero bölümündeki "browser + dashboard" mockup'ı border/shadow olmadan havada asılı görünür; browser bar ve traffic light dots kaybolur

**Sebep**: Browser shell, browser bar ve içindeki elementler `ring-white/[0.06]`, `bg-white/[0.02]`, `border-white/[0.05]` gibi dark background'a göre yazılmış — light temada tamamı şeffaf/görünmez olur

**Çözüm**: Her katman için `dark:` prefix'li çift tanım yaz:

```tsx
{/* Shell */}
<div className="border border-slate-200/80 bg-white/60 shadow-slate-300/50
                dark:border-white/[0.06] dark:bg-transparent dark:shadow-black/50">

{/* Browser bar */}
<div className="border-b border-slate-200/70 bg-slate-100/70
                dark:border-white/[0.05] dark:bg-white/[0.02]">

{/* Address bar */}
<div className="border border-slate-200/80 bg-white/70
                dark:border-white/[0.06] dark:bg-white/[0.04]">
```

**Kural**: `.glass` class'ı zaten light/dark geçişini yönetir ama product screenshot/mockup gibi iç içe dekoratif elementler kendi `dark:` varyantlarını taşımalı. İçerideki dashboard içeriği kasıtlı olarak koyu kalabilir (gerçek ürün UI'ını simüle eder).

### 32. Next.js `.next` Cache — Hydration Mismatch Yanlış Tanı

**Hata**: `Text content did not match. Server: "Pulse" Client: "PROJECT_NAME"` — kod doğru güncellenmiş olmasına rağmen

**Sebep**: `.next` dizinindeki derlenmiş bundle stale kalıyor; hot reload server bundle'ı günceller ama client bundle eski hallini serve etmeye devam edebilir

**Çözüm**:

```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```

Ardından tarayıcıda hard refresh (`Cmd+Shift+R`).

**Kural**: Hydration mismatch'te önce kodu kontrol et, sonra cache'i temizle.

---

## Server Component & Async Context

### 33. Nested Server Component'te Async Context Kaybı

**Hata**: Parent Server Component'teki `await` sonucu child Server Component'e geçemiyor

**Sebep**: Her Server Component kendi async context'inde çalışır, parent'ın scope'unu miras almaz

**Çözüm**: Veriyi prop olarak geç veya ortak data-fetching fonksiyonu kullan:

```tsx
// Parent
export default async function Layout({ children }) {
  const user = await getUser()
  return <Sidebar user={user}>{children}</Sidebar>
}

// Child — kendi fetch'ini yapar (React dedupe eder)
export default async function Page() {
  const user = await getUser() // ayni istek dedupe edilir
}
```

### 34. Drizzle Migration Rollback Yokluğu

**Hata**: Production migration başarısız oldu, geri alınamıyor

**Sebep**: Drizzle ORM'de built-in rollback mekanizması yok

**Çözüm**: Her migration için manuel rollback SQL'i hazırla:

```sql
-- migrations/0005_add_status_column.sql
ALTER TABLE posts ADD COLUMN status text DEFAULT 'draft';

-- migrations/0005_add_status_column.rollback.sql (manuel oluştur)
ALTER TABLE posts DROP COLUMN status;
```

**Kural**: Production migration öncesi rollback planı olmalı. Breaking change'ler iki aşamada yapılmalı (additive → migrate data → remove old).

### 35. Vercel Edge Function Limitleri

**Hata**: Edge Runtime'da `crypto`, `fs`, `path` gibi Node.js API'ları undefined

**Sebep**: Edge Runtime = V8 isolate, tam Node.js değil

**Kural**:
- Edge'de çalışan route'lar: `export const runtime = 'edge'`
- Node.js gerektiren route'lar: `export const runtime = 'nodejs'` (varsayılan)
- Edge limitleri: 128KB bundle, 30s timeout, sınırlı API

### 36. Framer Motion Bundle Size Şişmesi

**Hata**: Client bundle'da Framer Motion ~40KB gzip yer kaplıyor

**Çözüm**: Sadece kullanılan modülleri import et:

```tsx
// ❌ Tüm kütüphane import edilir
import { motion } from 'framer-motion'

// ✅ Tree-shake edilebilir (framer-motion v11+)
import { m, LazyMotion, domAnimation } from 'framer-motion'

// Layout'ta bir kez:
<LazyMotion features={domAnimation}>
  {children}
</LazyMotion>

// Bileşende:
<m.div animate={{ opacity: 1 }} />
```

### 37. npm Workspace Dependency Conflict

**Hata**: `ERESOLVE` — workspace paketleri arasında peer dependency çakışması

**Çözüm**:

```bash
# .npmrc dosyasında
legacy-peer-deps=true
# veya
strict-peer-deps=false
```

**Kural**: Workspace paketlerinde ortak bağımlılıklar (react, next) root package.json'da tanımlanmalı.

## Landing Page / Hero Tasarımı

### 38. Gradient Text Satır Kırılması
**Hata**: `<span className="text-gradient">Çiz, Tahmin Et</span>` gibi gradient text'ler responsive'de garip yerlerde kırılıyor (tek kelime alt satıra düşüyor)
**Çözüm**: Gradient text'i kısa tut veya satır kırılmasını kontrol et:
```tsx
// ❌ Yanlış — kırılma noktası öngörülemez
Arkadaşlarınla <span className="text-gradient">Çiz, Tahmin Et</span> ve Eğlen!

// ✅ Doğru — kırılmayı kontrol et
Çiz, Tahmin Et
<br />
<span className="text-gradient">ve Eğlen!</span>
```

### 39. Avatar/Renk Seçici Düzensiz Layout
**Hata**: 12 renk düğmesi iki satıra bölündüğünde ilk satır input yanında, ikinci satır altında — düzensiz görünüyor
**Çözüm**: Tek satır `overflow-x-auto` ile veya input'tan ayrı bölüm olarak yerleştir:
```tsx
// ✅ Compact single row
<div className="flex items-center gap-1.5 overflow-x-auto py-1">
  {AVATAR_COLORS.map(color => (
    <button className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
  ))}
</div>
```

### 40. Emoji İkon Kullanımı Landing Page'de
**Hata**: Feature kartlarında 🎨 🇹🇷 📱 gibi emoji'ler profesyonel görünmüyor, platform'lar arası tutarsız
**Çözüm**: SVG ikonlar kullan (lucide-react veya inline SVG). Emoji sadece playful/informal bölümlerde:
```tsx
// ❌ Emoji ikon
<div className="text-xl">🎨</div>

// ✅ SVG ikon
<svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path ... />
</svg>
```

### 41. Hero Form Kartı Çok Kalabalık
**Hata**: Hero'da isim + renk + oda kodu + katıl + oluştur hepsi bir glass card'da — çok kalabalık
**Çözüm**: Avatar preview (seçilen renkle) + divider + mantıksal gruplama ile düzenle. Renk seçiciyi küçük tut (w-5 h-5).

---

## Impeccable Denetiminden Öğrenilenler

> 2026-08-16 — `impeccable` detector'ı (59 kural) dev-starter'a uygulandığında
> çıkan 16 bulgunun kök nedenleri. Tarama: `npm run design:detect`

### 42. Degrade Metin Fallback'siz Bırakılırsa Görünmez Olur
> **Not (2026-08-16)**: Bu kayıt başta "degrade metin yasak" diyordu. Yasak
> kaldırıldı — sorun degradenin kendisi değil, fallback'in eksikliğiymiş.

**Hata**: `bg-clip-text` + `-webkit-text-fill-color: transparent` (veya Tailwind'in
`text-transparent`'ı) **koşulsuz** yazılıyordu. `background-clip: text` desteklenmeyen
bir yerde harfin dolgusu şeffaf kalır ama arkasına degrade basılmaz — metin
**tamamen kaybolur**. Üç projede birden bulundu: `ahmetakyapi.com`, `onepiece-hub`,
ve `dev-starter` template'leri.

**Çözüm**: Önce solid renk, kırpma `@supports` içinde:
```css
.display-ink { color: var(--text-strong); }        /* fallback ÖNCE */

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .display-ink {
    background-image: var(--display-gradient);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 0.06em;   /* g, y, ş kırpılmasın */
  }
}
```
Bu deseni `acilis-zili` zaten uyguluyordu — descender düzeltmesi dahil.

**Ayrıca**: Uzun cümleyi degrade span'e koyma, satır kırılması öngörülemez olur
(#23). Kısa vurgu kelimesi ve display metni sorunsuz.

### 43. Token Doğru, Kullanım Sapmış — Degrade Çoğalması
**Hata**: `tokens.ts → gradients.logo` zaten doğru marka rotasını (indigo→blue→cyan)
tanımlıyordu, ama **hiçbir template onu kullanmıyordu**. Bunun yerine her dosyada elle
yazılmış varyantlar birikmişti:

| Yer | Yazılan |
|-----|---------|
| landing/Header | `from-indigo-500 via-violet-500 to-cyan-400` |
| fullstack/Header | `from-indigo-500 via-blue-500 to-cyan-400` |
| Hero/CTA butonu | `from-indigo-600 to-violet-600` |
| Hero sidebar | `from-indigo-500 to-violet-600` |
| Testimonial avatar | 3 ayrı degrade |

Beşi de "marka degradesi" olduğunu sanıyordu; hiçbiri aynı değildi. Üstelik `violet`
marka paletinde **hiç yoktu** — indigo→violet en tanınır AI tell'i.

**Kök neden**: Token tanımlıydı ama *utility olarak açığa çıkarılmamıştı*. Tanımlamak
yetmiyor — `bg-signature` gibi tek satırlık bir kullanım yolu olmazsa herkes elle yazar.

**Çözüm**: `gradients.signature` + `backgroundImage.signature` → `bg-signature`.
Degrade yalnızca 3 yerde: birincil eylem, marka döşemesi, seçili gezinme satırı.
Bkz. `rules/design-tokens.md → Degrade Kuralları`.

### 44. `width`/`height` Animasyonu — Layout Thrash
**Hata**: CustomCursor üç dosyada da `transition: 'width 0.2s, height 0.2s'` kullanıyordu.
Layout property'leri animate etmek her karede reflow tetikler.

**İnce nokta**: Naif düzeltme (transition'ı `transform`'a çevirmek) imleci bozar —
framer-motion konumu da `transform` ile yazdığı için x/y takibi de gecikir ve imleç
fareden geri kalır. Ölçek **iç katmana** alınmalı:
```tsx
// ✅ Dış katman konum (transition yok) — iç katman ölçek
<motion.div style={{ x, y, translateX: '-50%', translateY: '-50%', transition: 'opacity 0.2s' }}>
  <div className="h-8 w-8 transition-transform duration-200"
       style={{ transform: `scale(${isHover ? 1.25 : 1})` }} />
</motion.div>
```

### 45. Detector Kendi Yorumunu Yakalar
**Hata**: `background-clip:text` ifadesini bir CSS *yorumunda* açıklarken detector onu
gerçek kullanım sandı ve bulgu üretti.
**Çözüm**: Yasaklı kalıbı yorumda birebir yazma — tarif et ("metne degrade kırpmak").
Gerçekten gerekiyorsa satır içi istisna: `/* impeccable-disable <rule>: gerekçe */`

### 46. Kural Kağıtta, İhlal Kodda
**Hata**: `uiux-agent.md` "Emoji icon kullanma — lucide-react kullan" diyordu, ama
`templates/nextjs-fullstack/app/page.tsx` emoji ikon kullanıyordu (#40 zaten kayıtlıydı).
Kural yazılmıştı, template'e uygulanmamıştı.
**Çözüm**: Her kural için çalıştırılabilir bir kontrol olmalı. `scripts/health-check.sh`
12. kategori + `hooks/quality-scan.sh` 6. adım bu kuralları commit anında zorlar.

### 47. Impeccable — npm CLI ile Plugin Versiyonu Aynı Değil
**Hata**: Claude Code plugin'i GitHub'dan geliyor ve `4.1.1`; npm'deki `impeccable` CLI ise
`3.6.0`. `"impeccable": "^4.1.1"` yazınca `npm install` → `ETARGET no matching version`.
**Çözüm**: devDependency'yi npm'deki sürüme pinle (`^3.6.0`), plugin'i ayrı güncelle:
```bash
npm view impeccable version          # npm CLI sürümü
claude plugin update impeccable      # plugin sürümü (ayrı kanal)
```

### 48. npm Paketi Kırık Yayınlandı — Entry Point Uyuşmazlığı
**Hata**: `tsup tokens.ts --format esm,cjs --dts` çıktıyı `dist/tokens.*` olarak üretiyordu,
ama `package.json` `main`/`module`/`types`/`exports` alanları `dist/index.*` işaret ediyordu.
Paket npm'e yayınlandı ve 5 ay boyunca import edilemez halde kaldı — build başarılı olduğu
için kimse fark etmedi.
**Çözüm**: Entry'yi isimlendir, ve yayın öncesi `npm pack --dry-run` ile içeriği doğrula:
```jsonc
// ✅ çıktı dist/index.* olur
"build": "tsup --entry.index=tokens.ts --format esm,cjs --dts"
```
```bash
npm pack --dry-run --workspace=packages/@ahmet/theme   # tarball içeriğini listele
```
**Kural**: `npm publish` öncesi `files` listesi ile gerçek build çıktısı birebir eşleşmeli.

**Neden CI yakalamadı**: `ci.yml`'deki doğrulama adımı `dist/tokens.js`'i require
ediyordu — yani build'in *ürettiği* dosyayı. `package.json`'un *işaret ettiği*
`dist/index.js`'e hiç bakmadı. Artefaktı test etmek sözleşmeyi test etmek değildir.
Artık `scripts/verify-package-exports.mjs` manifest'in vaat ettiği her yolu
(`main`, `module`, `types`, `exports`, `files`) kontrol edip giriş noktalarını
gerçekten yüklüyor:
```bash
npm run verify:exports
```

### 56. Flat ESLint Config'te `dist/` İç İçe Dizinleri Kapsamaz
**Hata**: `ignores: ['dist/']` yazıldı, ama flat config'te bu YALNIZCA kök seviyedeki
`dist/`'i eşleştirir. `packages/@ahmet/ui/dist` lint'lendi ve derlenmiş bundle
üzerinden 57 sahte hata üretti (`'window' is not defined`, `'prop' is already defined`).
**Çözüm**: İç içe dizinler için `**/` öneki şart — `'**/dist/**'`.
**Kural**: Flat config'te her ignore kalıbını en az bir iç içe dizinle test et.

### 55. Maskelenmiş CI Adımı = Olmayan CI Adımı
**Hata**: CI'da `npx eslint packages/ snippets/ --max-warnings 0 || true`.
`|| true` yüzünden adım hiçbir koşulda kırmızıya düşemiyordu. Dahası, `eslint` ve
`typescript-eslint` **devDependencies'te hiç yoktu** — `eslint.config.js` onları
import ediyordu ama kurulu değillerdi. Yani lint diye bir şey yoktu; ne yerelde
ne CI'da. health-check ise config dosyasının varlığını görüp ✅ diyordu.
İlk gerçek `npm run lint` koşusu 128 bulgu verdi.
**Çözüm**: `|| true` kaldırıldı, bağımlılıklar eklendi ve **v9'a pinlendi**
(`npx` 10.x çekiyordu; sürüm her koşuda değişince sonuç deterministik olmuyor).
**Kural**: `|| true` taşıyan bir CI adımı dokümantasyondur, kapı değildir.
Bir kapının kapı olduğunu, onu bilerek kırmızıya düşürerek kanıtla.

### 54. `! grep ... || echo "temiz"` Ters Çalışır
**Hata**: CI'ın güvenlik taraması bu idiomu kullanıyordu:
```bash
! grep -rnE '(password|secret|api_key)\s*[:=]\s*"[^"]{8,}' . || echo "No secrets found"
```
Sızıntı **varken** çıktı şu oluyordu:
```
leak.ts:1:const api_key = "SUPERSECRETVALUE123"
No secrets found
exit=0
```
Yani eşleşen satırı basıp hemen ardından "temiz" diyor ve **yeşil geçiyordu**.
Temiz koşuda ise hiçbir şey basmıyordu — "No secrets found" satırının görünmesi
zaten sızıntı işaretiydi, tam tersi okunuyordu.
**Çözüm**: Açık `if` + `exit 1`:
```bash
if grep -rnE '...' .; then echo "❌ secret"; exit 1; fi
echo "✅ temiz"
```
**Kural**: Güvenlik kontrolünü `!` ve `||` ile kurma. Her tarayıcıyı bilinen-kötü
bir fixture ile bir kez kırmızıya düşür — geçtiğini görmek yetmez.

### 53. Template'de `postcss.config.js` Yoksa Tailwind Sessizce Hiç Derlenmez
**Hata**: `templates/nextjs-fullstack`'te `postcss.config.js` hiç var olmamıştı.
`globals.css` `@tailwind` direktiflerini içeriyor, `tailwindcss` devDependency
kurulu — ama PostCSS yapılandırması olmayınca **tek bir utility bile üretilmiyor**.
Proje açılıyor, çalışıyor, sadece tamamen stilsiz.
**Neden fark edilmedi**: `next build`, `tsc --noEmit` ve `next lint` ÜÇÜ DE yeşil
verir. Bu sınıf hata hiçbir derleyici kapısına takılmaz.
(Aynı ders `templates/landing`'de öğrenilmiş — bkz. #28 — ama buraya taşınmamıştı.)
**Çözüm**: Yapısal invaryant — `health-check.sh` artık şunu zorunlu kılıyor:
bir template'in `globals.css`'i `@tailwind` içeriyorsa `postcss.config.*` VAR olmalı.
**Kural**: Derleyicinin göremediği hatayı invaryantla yakala. "Build geçiyor"
bir stil hattının çalıştığının kanıtı değildir.

### 52. Claude Code Hook'ları Girdiyi STDIN'den JSON Alır — `TOOL_INPUT` Diye Bir Şey Yok
**Hata**: `gate-guard.sh` ve `quality-scan.sh` şöyle başlıyordu:
```bash
TOOL_INPUT="${TOOL_INPUT:-}"
if ! echo "$TOOL_INPUT" | grep -qE 'git\s+commit'; then exit 0; fi
```
Claude Code hook'a girdiyi **stdin'den JSON** olarak verir:
`{"tool_name":"Bash","tool_input":{"command":"git commit -m ..."}}`.
`TOOL_INPUT` hiçbir zaman set edilmedi, hep boş geldi, her çağrı ilk satırda
`exit 0` verdi. Yani secret taraması, `.env` kontrolü, `@ts-ignore` ve impeccable
taramaları **5 ay boyunca bir kez bile çalışmadı**.
İkinci hata: `awk -F'|' '{print $NF}'` — markdown tablo satırının son alanı kapanış
borusundan sonraki BOŞ dizedir, `$(NF-1)` olmalı. Hook çalışsaydı bile Gate PASSED
olan story'yi bloklayacaktı.
**Neden fark edilmedi**: `health-check.sh` dosyanın VARLIĞINI test ediyordu
(`[ -f hooks/gate-guard.sh ]` → "✅ mevcut"). 58 başarılı, 0 hata raporluyordu.
**Çözüm**: stdin okuma `hooks/lib/hook-input.sh`'e alındı (jq → python3 fallback).
`scripts/test-hooks.sh` eklendi: gerçek payload verip **exit kodunu** doğrulayan
9 davranış testi. health-check artık bu testi çalıştırıyor.
**Kural**: Bir enforcement katmanını **davranışla** doğrula, varlıkla değil.
Testin geçerli olduğunu, düzeltmeden önce çalıştırıp KIRMIZI gördüğünde bilirsin —
bu suite eski kodda 3/9 başarısız veriyor.

### 51. `npm ci --omit=optional` Build'i Kırar
**Hata**: impeccable puppeteer'ı opsiyonel bağımlılık olarak çekiyor (~150MB Chrome).
CI'da atlamak için `npm ci --omit=optional` denendi — build şu hatayla kırıldı:
```
Error: Cannot find module @rollup/rollup-darwin-arm64
```
**Sebep**: Rollup'ın platforma özel native binary'si de bir `optionalDependency`.
`--omit=optional` onu da atıyor, `tsup --dts` rollup'a dayandığı için build ölüyor.
Aynısı esbuild ve swc için de geçerli — hepsi platform binary'sini optional tutar.
**Çözüm**: Optional'ları toptan atma; sadece asıl ağır olan indirmeyi atla:
```yaml
- run: npm ci
  env:
    PUPPETEER_SKIP_DOWNLOAD: 'true'
```
**Kural**: `--omit=optional` modern JS toolchain'inde neredeyse her zaman yanlıştır —
platform binary'leri optional olarak dağıtılır.

### 49. Template'de Lint Script Var, Config Yok
**Hata**: Her iki şablonda da `"lint": "next lint"` script'i ve `eslint` +
`eslint-config-next` bağımlılıkları vardı, ama **ESLint config dosyası yoktu**.
Sonuç: üretilen her projede `npm run lint` linting yapmak yerine interaktif kurulum
sihirbazına düşüyordu — yani CI'da asılı kalır, yerelde sessizce atlanır.
**Çözüm**: `.eslintrc.json` şablona dahil edilmeli:
```json
{ "extends": "next/core-web-vitals" }
```
**Genel kural**: Bir script `package.json`'da varsa, çalıştığı doğrulanmış olmalı.
Bağımlılığı eklemek yetmez — konfigürasyonu da şablonla birlikte gelmeli.

### 50. Bozuk `eslint-disable` Açıklaması
**Hata**: Açıklama tire ile eklenmişti; ESLint tireden sonrasını **ek kural adı** sandı:
```tsx
// ❌ "static decorative list" ve "order never changes" kural adı sanılır
// eslint-disable-next-line react/no-array-index-key — static decorative list, order never changes
```
İki adet `Definition for rule ... was not found` hatası üretiyordu — yani disable
satırının kendisi lint'i kırıyordu.
**Çözüm**: Açıklama `--` ile ayrılır. Ama repo kuralı "disable yazma, sorunu çöz"
olduğu için doğrusu key'i index'ten kurtarmaktır:
```tsx
// ✅ index'e dayanmayan stabil key — disable'a gerek yok
const track = ['a', 'b'].flatMap((lap) => LOGOS.map((name) => ({ id: `${lap}-${name}`, name })))
{track.map(({ id, name }) => <span key={id}>{name}</span>)}
```

---

*Son güncelleme: 2026-08-16*
*Yeni hata eklemek için bu dosyayı düzenle.*
