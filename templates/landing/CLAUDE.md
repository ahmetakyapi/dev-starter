# PROJECT_NAME — Landing Page Kuralları

> Bu dosyayı projeye özgü bilgilerle doldur.

---

## Proje Özeti

PROJECT_DESCRIPTION

## Teknik Stack

- **Framework**: Next.js 14 App Router
- **Stil**: Tailwind CSS 3 (`darkMode: 'class'`)
- **Animasyon**: Framer Motion
- **3D Arka Plan**: Three.js (`@react-three/fiber`) — SSR:false ile yüklenir
- **Deployment**: Vercel

## Ekosistem Referansları

- Tema: `~/dev-starter/knowledge/themes/ahmetakyapi.md`
- Hatalar: `~/dev-starter/knowledge/mistakes.md`
- Desenler: `~/dev-starter/knowledge/patterns.md`

## Kritik Kurallar

- `SceneBackground` → `dynamic(() => import(...), { ssr: false })` — Three.js SSR sorununu önler
- `ThemeProvider` + `suppressHydrationWarning` → `<html>` üzerinde zorunlu
- `mounted` guard → `resolvedTheme` sunucu tarafında `undefined` döner
- Renkler CSS değişkeni ile — hardcoded renk yasak

## Proje Kararları

- [ ] Hangi bölümler aktif? (Hero / Features / Pricing / CTA / Blog)
- [ ] Three.js arka plan tutulacak mı?
- [ ] Analytics eklenecek mi?

## Özel Kurallar

---

## Kurulum

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Deployment

```bash
/deploy   # Vercel checklist
```
