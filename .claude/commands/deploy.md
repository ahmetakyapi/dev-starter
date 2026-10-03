---
description: Vercel yayın kontrol listesi ve hazırlık (Next 16 projeleri)
argument-hint: "[ortam]"
---

Deploy oncesi kontrol listesini calistir. Rol tanimi:
`~/dev-starter/agents/deploy-agent.md`; ayrintili liste:
`~/dev-starter/guides/08-quality-and-ship.md` § 7-8. Bu komut her projeden
cagrilabilir.

1. **Pre-Build** (sira onemli)
   - `npm ci` ya da `npm install` — kilit dosyasi guncel mi?
   - `npm run build` — Next 16'da once build (rota tipleri uretilir)
   - `npm run typecheck` — exit kodunu goster
   - `npm run lint` — `next build` lint calistirmaz, ayri adim
   - `npm test` (varsa)

2. **Environment Variables**
   - `.env.example` oku, her degiskeni `vercel env ls` ile karsilastir
   - Tipik zorunlular: `DATABASE_URL`, `AUTH_SECRET` (next-auth v5; `NEXTAUTH_SECRET` degil)
   - `NEXT_PUBLIC_SITE_URL` (yoksa `VERCEL_PROJECT_PRODUCTION_URL`), varsa `CRON_SECRET`
     (uretimde yoksa korumali uc bilerek 503 doner)
   - `NEXT_PUBLIC_*` build aninda gomulur: degisirse yeniden build
   - Onizleme ortamina uretim veritabani verilmez (Neon dali)

3. **Database Migration** (varsa)
   - Migration deploy'da UYGULANMAZ. Yeni migration varsa uretim `DATABASE_URL`iyle
     `npm run db:migrate` deploy'dan ONCE
   - Yeni ozellik tablo yokken sessizce dusuyor mu (kendi tablosu)?

4. **Vercel Ayarlari**
   - Framework: Next.js · Build: `npm run build`
   - Node.js: `.nvmrc` ile ayni (24.x; Next 16 en az 20.9)
   - Fonksiyon bolgesi veritabaniyla ayni (Neon eu-central-1 → `fra1`)

5. **Commit oncesi**
   - `git status` yalnizca amaclanan dosyalar
   - Staged fark sir, `console.log`, gecici isaret (TODO/TMP/`.tmp-`) icermiyor

6. **Deploy sonrasi**
   - `/api/health` 200, olmayan adres 404 (soft 404 degil)
   - Ana akis bir kez elle; Vercel Logs ilk bes dakika temiz

Sonucu su formatta raporla:

```
DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━
Pre-Build:     ✅ | ❌
Env Variables: ✅ | ⚠️
DB Migration:  ✅ | ⏭️ | ❌ (uygulanmamis)
Vercel Config: ✅ | ❌
━━━━━━━━━━━━━━━━━━
Deploy Ready: YES | NO
```

Kullanici onayi olmadan production'a deploy etme.
