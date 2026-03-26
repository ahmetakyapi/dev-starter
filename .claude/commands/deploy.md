---
description: Vercel deployment checklist ve hazirlik
---

Deploy oncesi kontrol listesini calistir. `agents/deploy-agent.md` protokolunu takip et.

1. **Pre-Build**
   - `npm install` — bagimliliklar guncel mi?
   - `npx tsc --noEmit` — type hatasi var mi?
   - `npm run lint` — lint temiz mi? (varsa)
   - `npm run build` — build geciyor mu?

2. **Environment Variables**
   - `.env.example` oku ve her degisken icin kontrol et
   - Zorunlu degiskenler: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL
   - NEXTAUTH_URL = exact production URL (https://, trailing slash yok)

3. **Database Migration** (varsa)
   - Migration dosyalari olusturulmus mu?
   - Production DB'ye uygulanmis mi?

4. **Vercel Ayarlari**
   - Framework: Next.js
   - Node.js: 20.x
   - Build Command: `npm run build`

Sonucu su formatta raporla:

```
DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━
Pre-Build:     ✅ | ❌
Env Variables: ✅ | ⚠️
DB Migration:  ✅ | ⏭️
Vercel Config: ✅ | ❌
━━━━━━━━━━━━━━━━━━
Deploy Ready: YES | NO
```
