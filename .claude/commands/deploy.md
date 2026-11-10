---
description: Vercel yayın kontrol listesi ve hazırlık (Next 16 projeleri)
argument-hint: "[ortam]"
disable-model-invocation: true
---

Deploy öncesi kontrol listesini çalıştır. Rol tanımı:
`~/dev-starter/agents/deploy-agent.md`; ayrıntılı liste:
`~/dev-starter/guides/08-quality-and-ship.md` § 7-8. Bu komut her projeden
çağrılabilir.

1. **Pre-Build** (sıra önemli)
   - `npm ci` ya da `npm install` — kilit dosyası güncel mi?
   - `npm run build` — Next 16'da önce build (rota tipleri üretilir)
   - `npm run typecheck` — exit kodunu göster
   - `npm run lint` — `next build` lint çalıştırmaz, ayrı adım
   - `npm test` (varsa)

2. **Environment Variables**
   - `.env.example` oku, her değişkeni `vercel env ls` ile karşılaştır
   - Tipik zorunlular: `DATABASE_URL`, `AUTH_SECRET` (next-auth v5; `NEXTAUTH_SECRET` değil)
   - `NEXT_PUBLIC_SITE_URL` (yoksa `VERCEL_PROJECT_PRODUCTION_URL`), varsa `CRON_SECRET`
     (üretimde yoksa korumalı uç bilerek 503 döner)
   - `NEXT_PUBLIC_*` build anında gömülür: değişirse yeniden build
   - Önizleme ortamına üretim veritabanı verilmez (Neon dalı)

3. **Database Migration** (varsa)
   - Migration deploy'da UYGULANMAZ. Yeni migration varsa üretim `DATABASE_URL`iyle
     `npm run db:migrate` deploy'dan ÖNCE
   - Yeni özellik tablo yokken sessizce düşüyor mu (kendi tablosu)?

4. **Vercel Ayarları**
   - Framework: Next.js · Build: `npm run build`
   - Node.js: `.nvmrc` ile aynı (24.x; Next 16 en az 20.9)
   - Fonksiyon bölgesi veritabanıyla aynı (Neon eu-central-1 → `fra1`)

5. **Commit öncesi**
   - `git status` yalnızca amaçlanan dosyalar
   - Staged fark sır, `console.log`, geçici işaret (TODO/TMP/`.tmp-`) içermiyor

6. **Deploy sonrası**
   - `/api/health` 200, olmayan adres 404 (soft 404 değil)
   - Ana akış bir kez elle; Vercel Logs ilk beş dakika temiz

Sonucu şu formatta raporla:

```
DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━
Pre-Build:     ✅ | ❌
Env Variables: ✅ | ⚠️
DB Migration:  ✅ | ⏭️ | ❌ (uygulanmamış)
Vercel Config: ✅ | ❌
━━━━━━━━━━━━━━━━━━
Deploy Ready: YES | NO
```

**Onay sınırı.** Bu komut hazırlığı denetler; `vercel --prod`, üretim
veritabanında `npm run db:migrate`, `npm publish` ve zorla push kullanıcının
AÇIK onayı olmadan çalıştırılmaz (ilk ve son ikisini ayarlar ayrıca sorar:
`permissions.ask`). Kullanıcının "commitle" dediği düz `git push` bu kuralın
dışındadır; `main`e push'un Vercel'de üretim deploy'u tetiklediği projede
bu, bilerek verilmiş onaydır (`~/.claude/CLAUDE.md` → Commit ve Push). O
yüzden 1-5. adımlar push'tan ÖNCE biter.

`vercel` CLI ya da oturumu yoksa (bulut oturumu): 2. adımı "çalıştırılamadı"
diye raporla ve `.env.example`daki değişken adlarını kullanıcının Vercel
panelinde karşılaştırması için listele; değer yazma. Deploy sonrası adımı
`curl -s -o /dev/null -w '%{http_code}' https://<alan>/api/health` ile yap.
