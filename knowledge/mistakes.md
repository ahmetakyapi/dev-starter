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

---

*Son güncelleme: 2026-03-25*
*Yeni hata eklemek için bu dosyayı düzenle.*
