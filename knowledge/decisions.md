# Mimari Kararlar

Her teknoloji seçiminin gerekçesi. Yeni bir projede alternatif önermeden önce bu dosyayı oku.

---

## Framework — Next.js 14+ (App Router)

**Tercih edildi:** Next.js 14+ App Router
**Alternatifler:** Remix, Vite+React, Astro, SvelteKit

**Gerekçe:**
- Vercel ile birinci sınıf entegrasyon (sıfır config deploy)
- Server Component'ler → daha az client JS, daha iyi ilk yükleme
- App Router → layout nesting, parallel routes, intercepting routes
- `next/image`, `next/font`, `next/og` built-in optimizasyonlar
- Edge runtime desteği (middleware, API routes) — *16'da proxy yalnız Node, bkz. aşağı*
- Geniş ekosistem → next-auth, next-themes, @vercel/og

**Ne zaman değişir:** Sadece içerik ağırlıklı site → Astro. Full SPA → Vite.

### Değişti (2026-10-03) — Next.js 16

**Önceki karar:** Next.js 14+. **Yeni karar:** Next.js ^16.3 + React 19.2,
şablonların hepsi bu sürümde.

**Neden değişti:** Açılış Zili (16.3) ve ElevenForge (16.2) bir yıldır 16'da
canlı; şablonlar 14'te kaldığı için her yeni proje ilk gün yükseltme
yapıyordu. 16'nın getirdikleri doğrudan kullanılıyor: `proxy.ts`, global
`PageProps`/`RouteContext` tipleri, varsayılan Turbopack, `updateTag` /
`refresh`. Bedeli: `next lint` yok (ESLint CLI + flat config), senkron
`params`/`cookies()` tamamen kalktı, `middleware` adı kullanımdan kalktı ve
proxy edge'de çalışmıyor. Ayrıntı: `guides/06-nextjs-16.md`.

Eski projeler (14/15) toplu yükseltilmez; dokunulduğunda yükseltilir.

---

## ORM — Drizzle ORM

**Tercih edildi:** Drizzle ORM
**Alternatifler:** Prisma, Kysely, raw SQL

**Gerekçe:**
- TypeScript-first — schema = tip tanımı, ayrı tip üretimi yok
- Serverless uyumlu — Neon HTTP driver ile sorunsuz çalışır
- SQL'e yakın söz dizimi — magic yok, ne ürettiğini biliyorsun
- Hafif bundle — Prisma client'ın aksine runtime'da şişirmiyor
- Migration workflow sade: `generate` → `migrate`

**Ne zaman değişir:** Çok karmaşık ilişkiler / raw SQL ihtiyacı arttıkça Kysely düşünülebilir.

---

## Veritabanı — Neon Postgres (Serverless)

**Tercih edildi:** Neon (`@neondatabase/serverless`)
**Alternatifler:** Supabase, PlanetScale, Railway, Vercel Postgres

**Gerekçe:**
- Serverless-first bağlantı modeli — Vercel'de connection pool sorunu yok
- HTTP üzerinden sorgu → soğuk başlatma cezası minimumd
- `@neondatabase/serverless` paketi Vercel Edge Runtime ile uyumlu
- Ücretsiz tier geliştirme için yeterli
- Branch özelliği → staging DB'si kolayca

**Kritik not:** `pg` veya `pg-pool` KULLANMA. Serverless ortamda her request yeni connection açar, timeout'a yol açar. → `mistakes.md #5`

---

## Animasyon — Framer Motion

**Tercih edildi:** Framer Motion
**Alternatifler:** GSAP, React Spring, CSS transitions, Motion One

**Gerekçe:**
- React-native — `motion.div` ile doğrudan JSX
- Declarative variants sistemi → stagger, orchestration kolaylığı
- `AnimatePresence` → mount/unmount animasyonları
- `useSpring`, `useMotionValue` → fizik tabanlı interaktif animasyon
- Layout animation → `layoutId` ile shared element transitions
- Lisans sorunu yok (GSAP'ın aksine)

**Temel sabit:** `EASE = [0.22, 1, 0.36, 1]` — tüm projelerde bu ease eğrisi.

### Değişti (2026-10-03) — `motion` paketi, LazyMotion, basit şey CSS

**Önceki karar:** Framer Motion (`framer-motion` paketi), her bileşende `motion.div`.
**Yeni karar:** `motion` ^13 (`motion/react`), `LazyMotion features={domAnimation} strict`
+ `m.*`, `MotionConfig reducedMotion="user"`. Basit hareket (hover, giriş,
kaydırmaya bağlı belirme) **CSS ile**; kütüphane yalnızca orkestrasyon, jest,
`layoutId`, değere bağlı kaydırma için.

**Neden değişti:**
- Kütüphanenin asıl adı artık `motion`; `framer-motion` aynı ekibin eski
  paket adı. Belgeler ve yeni API'ler `motion/react` üzerinden. Açılış Zili 13'te.
- `motion.div` tüm özellikleri her bileşenle indiriyordu (`mistakes.md` #36);
  `strict` LazyMotion yanlış kullanımı çalışma anında yakalıyor.
- ahmetakyapi.com bütün reveal'lerini kütüphanesiz (`animation-timeline: view()`)
  yapıyor ve en hızlı açılan proje; ElevenForge da CSS keyframe ağırlıklı.
  Kütüphane her hareket için gerekli değil.

Sabitler `lib/motion.ts`te (`EASE`, `DUR`, `SPRING`, `STAGGER`), `"use client"`
olmadan. Ayrıntı: `guides/04-motion.md`.

---

## Auth — next-auth v5

**Tercih edildi:** next-auth v5 (Auth.js)
**Alternatifler:** Clerk, Supabase Auth, Lucia, custom JWT

**Gerekçe:**
- Ücretsiz, self-hosted → kullanıcı verisi üçüncü tarafa gitmiyor
- App Router için sıfırdan yazılmış (v5)
- Provider desteği geniş: GitHub, Google, Discord, email, credentials
- Drizzle adapter mevcut
- Middleware ile route koruma kolaylığı

**Ne zaman değişir:** Hızlı prototip / enterprise SSO → Clerk. Multi-tenant → Clerk Organizations.

---

## Stil — Tailwind CSS v3

**Tercih edildi:** Tailwind CSS 3 (`darkMode: 'class'`)
**Alternatifler:** CSS Modules, styled-components, Stitches, UnoCSS, Tailwind v4

**Gerekçe:**
- Utility-first → tasarım sistemi tokenlara doğrudan map edilir
- Purge ile minimal production bundle
- `darkMode: 'class'` → next-themes ile mükemmel uyum
- JIT → her değer dinamik olarak üretilir
- Geniş IDE desteği (IntelliSense)

**Tailwind v4 notu:** v4, `tailwind.config.ts` yerine `globals.css` içinde `@theme {}` bloğu kullanır. Mimio bu pattern'i kullanıyor. Yeni projeler için henüz v3 tercih ediliyor — ekosistem (özellikle plugin'ler) tam olgunlaşmadı.

### Değişti (2026-10-03) — Tailwind v4, iki katmanlı token

**Önceki karar:** Tailwind v3, `darkMode: 'class'`, `tailwind.config.ts` +
preset. **Yeni karar:** Tailwind ^4 + `@tailwindcss/postcss`, config dosyası
yok. Token'lar iki katman: ham rol değişkenleri `:root[data-theme]` içinde,
Tailwind köprüsü `@theme inline` içinde. `dark:` varyantı kullanılmaz.

**Neden değişti:** "Plugin'ler olgunlaşmadı" gerekçesi geçerliliğini yitirdi:
Açılış Zili, Mimio ve ElevenForge v4'te ve hiçbiri v3'e özgü bir plugine
ihtiyaç duymadı. Asıl kazanç tema: `@theme inline` `var()` referansını
koruduğu için tema yalnızca katman 1 yeniden tanımlanarak döner, her satıra
`dark:` eşi yazmak gerekmez ve üçüncü bir tema (yüksek kontrast) tek blokla
eklenir. `@ahmetakyapi/theme` 3.0.0 ile v4 için `theme.css` getiriyor
(`@import "@ahmetakyapi/theme/theme.css";`). Ayrıntı: `guides/02-design-tokens.md`.

---

## Deployment — Vercel

**Tercih edildi:** Vercel
**Alternatifler:** Netlify, Railway, Fly.io, AWS, Render

**Gerekçe:**
- Next.js'in birinci sınıf deploy platformu
- Edge Network → global CDN, düşük latency
- Preview deployments → her PR'a otomatik URL
- Analytics, Speed Insights built-in
- Serverless Functions → API routes otomatik ölçeklenir
- Domain yönetimi ve SSL otomatik

---

## Paket Yöneticisi — npm

**Tercih edildi:** npm (workspaces)
**Alternatifler:** pnpm, yarn, bun

**Gerekçe:**
- Herhangi bir ortamda ek kurulum gerektirmez
- npm workspaces → monorepo yönetimi yeterince iyi
- Bun henüz production'da tam olgun değil

---

## Tema Sistemi — next-themes

**Tercih edildi:** next-themes (`attribute: 'class'`)
**Alternatifler:** Custom ThemeProvider, CSS media query, data-theme attribute

**Gerekçe:**
- Hydration mismatch'i otomatik çözer (`suppressHydrationWarning` ile)
- SSR-safe: server'da tema bilinmeden render, client'ta sync
- System preference desteği
- `resolvedTheme` hook'u ile anlık tema değeri

**Kritik:** `mounted` guard olmadan `resolvedTheme` sunucuda `undefined` döner. → `mistakes.md #1`

### Değişti (2026-10-03) — `data-theme` + çerez + sunucuda çizim

**Önceki karar:** next-themes (`attribute: 'class'`).
**Yeni karar:** tema `theme` çerezinde; kök layout `cookies()` ile okuyup
`<html data-theme>` olarak basar, istemci DOM'u anında değiştirip çerezi bir
server action ile yazar. next-themes yalnızca onu zaten kullanan eski
projelerde (ahmetakyapi.com) kalır.

**Neden değişti:**
- İlk kare HTML'de doğru; satır içi script yok, FOUC yok, `mounted` guard yok.
- `themeColor` ve OG görseli ürünün temasını sunucuda bilir. next-themes ile
  işletim sistemi koyu, ürün açık varsayılanlıyken tarayıcı çubuğu yanlış
  renkte kalıyordu (Açılış Zili).
- Açılış Zili ve Mimio kendi sistemlerine geçmişti; ekosistem varsayılanı
  gerçek projelerin gerisinde kalmıştı.

**Bedel (bilerek kabul):** kök layout çerez okuduğu için dinamik.

**Varsayılan tema projeye göre:** gündüz kullanılan araç/veri ürünü açık
(Açılış Zili, Mimio), portfolyo/oyun koyu. Ayrıntı: `guides/03-theming.md`.

### Değişti (2026-10-20) — tema çerezi istemcide yazılır

**Önceki karar:** istemci DOM'u değiştirir, çerezi bir server action
(`app/actions/theme.ts`) "arkadan" yazar.
**Yeni karar:** çerezi ThemeToggle `document.cookie` ile yazar ve
`meta[name=theme-color]`ı kendisi günceller; tema için server action yok.
`lib/theme.ts` iki taraftan okunan sabitler + `isTheme` (next/headers YOK),
çerezi okuyan `getTheme()` `lib/theme.server.ts`te.

**Neden değişti:**
- Varsayım yanlıştı: Next 16'da action içinde `cookies().set()` isteği
  "veri değişti" sayar. Yanıt bütün sayfayı sunucuda yeniden çizer
  (`x-action-revalidated: 1`, sayfadaki sorgular dahil) ve istemci bütün ön
  yükleme önbelleğini boşaltır. Şablonda ölçüldü: her tıklama bir POST ve
  ana sayfanın tam RSC'si. Kozmetik bir tıklamanın bedeli değil.
- `lib/theme.ts` `next/headers` içe aktardığı için istemci ondan değer
  alamıyordu; düğme tema ayrıştırmayı elle kopyalıyordu (üçüncü tema
  sessizce "light"a düşerdi).
- Çerez gizli değil, `httpOnly` gerekmez; sunucu onu bir sonraki istekte
  okur. FOUC'suz ilk kare kararı aynen duruyor.

**Bedel:** tarayıcı çubuğunun rengi elle güncelleniyor; tıklamadan önce
önbelleğe alınmış bir sayfa başı geri gelirse çubuk kısa süre eski renkte
kalabilir, sonraki sunucu çizimi düzeltir.

### Değişti (2026-10-20) — landing şablonu statik + çerez script'i

**Önceki karar:** iki şablon da temayı kök layout'ta `cookies()` ile okur;
`landing` dahil satır içi script yok.
**Yeni karar:** `landing` `<html data-theme={DEFAULT_THEME}>` basar;
`<head>`deki `THEME_SCRIPT` (`lib/theme.ts`) ilk boyamadan önce çerezdeki
temayı ve `theme-color`ı yazar. Viewport statik, tema için server action
yok. `nextjs-fullstack` çerezi sunucuda okumaya devam eder.

**Neden değişti:**
- Vitrinin içeriği her ziyaretçiye aynı; `cookies()` her rotayı dinamik
  (`ƒ`) yapıp CDN önbelleğini kapatıyordu. Şablonda ölçüldü: `ƒ /` → `○ /`,
  `/` yanıtı `no-store` → `s-maxage=31536000` (`guides/03-theming.md` § 2b,
  `mistakes.md` #93).
- Oturumlu üründe sayfa zaten dinamik; orada script'in kazandıracağı bir şey
  yok, ilk karenin sunucudan doğru gelmesi daha değerli.

**Bedel:** satır içi script geri geldi; tam CSP açılırsa `script-src` onun
hash'ini ister ("Güvenlik Başlıkları" kararı). JavaScript kapalıyken
çerezdeki tema uygulanmaz, varsayılan tema görünür.

---

## Palet — Varsayılan Renk Ailesi

**Önceki karar (örtük, ahmetakyapi.com'dan):** koyu zemin `#04070d`, köşelerde
indigo/emerald/cyan radial gradient üçlüsü, glass kartlar.

### Değişti (2026-10-03) — Lacivert → Mavi Tek Aile

**Yeni karar — kimlik ortak, palet projeye göre:** token mimarisi, ton
farkıyla derinlik, degrade disiplini, tipografi ve hareket kuralları her
projede aynı (kimlik); renk ailesi `data-palette` ile seçilir. Varsayılan
palet `signature`, Açılış Zili'nin mavi ailesi: açık `--primary #0d74c4`, koyu `#35b8ff`; zemin açıkta `#f7f9fb`,
koyuda `#070d16`; sıcak ikincil vurgu `--accent-warm` seyrek. Değerlerin
tamamı `guides/02-design-tokens.md` § 1.

- Degrade yalnızca üç yerde: kısa display başlık (`.display-ink`, `@supports`
  korumalı, solid fallback, descender payı), birincil eylem, marka karosu.
  Veri gösteren paneller ve gövde metni degrade taşımaz.
- Derinlik gölgeyle değil ton farkıyla; glass opt-in.
- Şablon varsayılanı açık tema (`DEFAULT_THEME = "light"`); ürün sorusuna
  göre değişir.
- `.app-bg` isteğe bağlı: köşelerde `--primary`nin çok düşük opaklıklı radial'ı.
- Alternatif paletler aynı kurallarla: `verdant` (zümrüt; sağlık/terapi),
  `ember` (kehribar; oyun/topluluk), `iris` (mor-indigo; yaratıcı/yapay zekâ).
  Değerler kontrast ölçülerek üretilir, uydurulmaz.

**Neden değişti:** kullanıcı kararı. Açılış Zili'nin tek aileden kurulan
paleti ekosistemin en okunaklı ve en tutarlı sonucunu verdi: iki temada
ölçülmüş kontrast, tek vurgu, degrade disiplini. Ama her projenin aynı
renkte olması istenmedi: "uygun projeler o renkte olsun, mantık ve görsel
kimlik benzer olsun". Ayrım bu yüzden kimlik/palet olarak yapıldı.

**Kapsam:** yalnızca yeni projelerin varsayılanı. Mevcut projeler
(Mimio, Keskealsaydım, ahmetakyapi.com, Ramazan Vakitleri) kendi temalarıyla
kalır; `knowledge/themes/*.md` onların kaynağıdır.

---

## Kart Zemini — Glass Opt-In, Varsayılan Ton Farkı (2026-10-03)

**Önceki karar (örtük):** her kartta `.glass` (`backdrop-filter: blur(16px)`).
**Yeni karar:** varsayılan kart zemini `.surface` (ton farkı + hairline). `.glass`
yalnızca altından içerik geçen öğede (yapışkan başlık, aurora üstündeki
kahraman), `@supports` korumalı, `prefers-reduced-transparency` altında opak.
Blur 12–16 px.

**Neden:** düz zemin üstündeki bulanıklık görünmez, yalnızca GPU maliyeti ve
kontrast belirsizliği ekler. Açılış Zili hiç glass kullanmıyor ve ekosistemin
en okunaklı projesi.

---

## Güvenlik Başlıkları — Tam CSP Ya Hiç (2026-10-03)

**Karar:** şablonlarda nosniff, Referrer-Policy, Permissions-Policy, HSTS,
`X-Frame-Options: DENY` + `frame-ancestors 'none'`. Tam `script-src` CSP yok.

**Neden:** Next'in satır içi script'leri yüzünden sıkı CSP yalnızca istek
başına nonce ile mümkün, o da her sayfayı dinamik yapar. `'unsafe-inline'`
taşıyan yarım CSP koruma vaat eder ama sağlamaz. Nonce'un bedeli kabul
edilen projede (ahmetakyapi.com) tam CSP yazılır.

---

## Auth Kapsamı (2026-10-03)

next-auth v5 (JWT) çok kullanıcılı ve OAuth'lu projelerde. Tek yöneticili
kişisel panelde HMAC imzalı çerez oturumu yeterli (Mimio); next-auth'un
getirdiği karmaşıklık orada karşılığını vermiyor.

## Agentic UI — AÇIK KARAR (benimsenmedi)

**Tercih edildi:** Henüz yok — bu bir karar değil, karar için hazırlık
**Alternatifler:** AG-UI + CopilotKit · Vercel AI SDK (`useChat` + tool calling) · doğrudan sağlayıcı SDK'sı · hiç girmemek

**Bağlam:** Manfred Steyer'in *Agentic UI with Angular* kitabı (Ağustos 2026)
okundu ve çıkarılabilir desenler `knowledge/patterns.md → Agentic UI` ile
`rules/agentic-ui.md` altına işlendi. Kod yazılmadı.

**Kararı bekleten dört soru:**

1. **Vercel süre limiti.** Agent run'ları saniyelerden dakikalara sürebiliyor.
   Next.js Route Handler SSE stream'leyebilir ama serverless fonksiyonun bir
   maksimum süresi var. `maxDuration` ve hesap limiti **ölçülmeden** protokol
   seçimi yapılamaz — yoksa protokolün faydası değil, deploy sorunu tartışılır.
2. **AG-UI mı, AI SDK mı?** AG-UI'ın vaadi sunucu bağımsızlığı: agent
   framework'ünü değiştirdiğinde istemci değişmez. Bu vaat ancak **birden fazla
   sunucu implementasyonu ihtimali varsa** değer taşır. Tek bir Next.js
   backend'i için Vercel AI SDK daha az katman olabilir.
3. **Hangi proje?** En düşük riskli giriş noktası **belgeden veri çıkarma**:
   chat yok, agent döngüsü yok, protokol yok. Bir vision çağrısı, bir Zod
   şeması, bir form ön doldurma ve **insan onayı**. Adayları: DigyNotes'ta
   not/görsel içe aktarma, keskealsaydim'de portföy ekran görüntüsü içe aktarma.
4. **CopilotKit lisans katmanı (2026-10-20).** 1.69.2, `selfManagedAgents`
   için "Enterprise Intelligence" uyarısı basar ve üretimde
   `publicLicenseKey` ister. Paket MIT, bugün hiçbir şey kilitlenmiyor; ama
   yayından önce seçilmeli: lisans anahtarı, `runtimeUrl` + CopilotRuntime ya
   da CopilotKit'in React katmanı olmadan `@ag-ui/client`.
   → `templates/agentic-chat/README.md` → Lisans notu

**Not (2026-10-03):** `templates/agentic-chat` overlay'i ve `/agentic` komutu
POC için hazır; karar hâlâ açık.

**Karar verilirse güncellenecek:** bu bölüm + `rules/agentic-ui.md`nin başındaki
"benimsenmedi" notu + `CLAUDE.md` tech stack.

**Ne zaman değişir:** Yukarıdaki 1. soru bir POC ile ölçüldüğünde.

---

## Orkestrasyon Modeli — Kayıtlı Subagent + Ana Oturum Orkestratörü (2026-10-14)

**Tercih edildi:** Ana oturum (BA rolü) orkestratör; uygulayıcılar
(`frontend`, `backend`, `qa`, `researcher` + mevcut 5) kayıtlı subagent.
Dağıtım **Görev Tanımı** ile, dönüş **referansla** (dosya + üç satır özet),
durum ROUTEMAP'te (dosya tabanlı paylaşılan bellek).
**Alternatifler:** her rolü subagent yapmak; hiçbirini yapmayıp tek oturum;
harici orkestrasyon çatısı (claude-flow tarzı SQLite hive-mind).

**Gerekçe:**
- Anthropic'in orchestrator-worker deseni: lider bağlamı tutar, işçiler kendi
  penceresinde çalışır, yoğunlaştırılmış sonuç döndürür
- BA/UI/AG ana oturumda kalır: karar rolleri bağlamın TAMAMINI görmeli;
  uygulayıcılar görmemeli (context curation zaten bunu istiyordu)
- Dosya tabanlı durum (ROUTEMAP + docs/gate + docs/research) session resume
  ve compaction'a dayanıklı; SQLite'lı dış çatıya gerek bırakmıyor
- Gate'in Write yetkisizliği KORUNDU ve gerekçeye bağlandı: denetleyen,
  denetlediği kaydı değiştirmez; PASSED'i ROUTEMAP'e ana oturum işler

**Ne zaman değişir:** Paralel dalgalar pratikte 3-4 subagent sınırını
zorlarsa ya da görev tanımı/teslim disiplini elle taşınamaz hale gelirse — o zaman
durum deposu yapılandırılmış dosyaya (JSON) taşınır.

**Bilinçli ertelenenler (2026-10-14):** şablonlara Playwright E2E iskeleti,
auth dikey dilimi (giriş sayfası + korunan rota), `scripts/seed.ts`, e-posta
katmanı (Resend), Upstash rate-limit adaptörü, Lighthouse CI. Hepsi şablon
KODU değiştirir ve `verify:*` zinciriyle (npm install + build + test)
doğrulanmadan girmez — "kanıtsız değişiklik yok" kuralı şablonlar için de
geçerli. Sırası gelince `/evolve` listesinden tek tek, doğrulanarak.

**Ertelenenlere ek (2026-10-15, güvenlik review'u):** şablon sertleştirme
adayları — `trustHost: true`un üretimde Host başlığına güveni,
`x-forwarded-for`dan okunan istemci IP'sinin rate-limit anahtarı olması,
şablon CI workflow'larına açık `permissions` bloğu, bootstrap'taki `npx -y
skills` tedarik zinciri pin'i. Hook'ların her Bash çağrısında fork edilmesi
(performans) da burada. Aynı kural: şablon/altyapı değişikliği doğrulanarak,
`/evolve` sırasından.

> **Girdi (2026-10-15):** bu beş madde aynı gün doğrulanarak kapandı —
> CI `permissions` + `persist-credentials` üç workflow'da, bootstrap pin'i,
> trustHost/XFF kod içi karar kaydı + `AUTH_URL`; hook fork maliyeti ölçüldü
> (~17 ms/çağrı, iş yok). Ayrıntı CHANGELOG → "ikinci geçiş". Liste tarihçe
> olarak kalıyor.

---

*Yeni bir teknoloji benimsendiğinde bu dosya güncellenir. Eski karar silinmez;
altına "Değişti (tarih)" başlığıyla yenisi ve gerekçesi yazılır.*

*Son güncelleme: 2026-10-20*

---

## AI Slop Taraması — Dış Skill'den Seçerek Uyarlama (2026-10-26)

**Kaynak:** [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills)
(`landing-page-design`, `design-to-motion`; MIT). Metin kopyalanmadı, kurallar
bizim token, punto ve hareket sistemimize çevrildi.

**Alındı:**
- **Ölçülebilir kalıplar → `scripts/slop-scan.sh`** (davranış testi
  `test-slop-scan.sh`; CI, health-check, audit-project § 11, Gate Pass 6,
  `/review-ui`): tek taraflı vurgu şeridi, ölü bağlantı, `alert()`,
  `transition-all`, `font-black`, yer tutucu metin, pazarlama dolgusu,
  gökkuşağı degrade, emoji, `scale(0)`, keyfi punto, sevimli mesaj, şüpheli
  yuvarlak sayı, Material ikonları. Kural yazılı kaldıkça uygulanmıyordu;
  hook'larda olduğu gibi (`mistakes.md` #52) davranışla doğrulanır.
- **İç içe radius formülü** (`iç = dış − boşluk`, boşluk < 32 px) →
  `guides/02` § 4; göz kararı "bir basamak küçült"ün yerine.
- **Görsel hikâyesi** (bento kartının görseli işini oynar, tasarımda başlar
  ve biter, ekran dışında durur) → `guides/04` § 14.
- **Örnek içerik gerçekçiliği ve sistem mesajı** → `guides/05` § 7.

**Bilerek alınmadı (bizim kuralımız kalır):**

| Onların kuralı | Neden almadık |
|----------------|---------------|
| Sentence case başlık ve düğme | Türkçe arayüzde Title Case kimlik değişmezi (00 § 1, #7) |
| Inter/Roboto yasağı, Geist/Manrope/Poppins listesi | Aile seçimi `snippets/fonts` preset'leriyle ve ürünle yapılır; tek bir yasaklı ad listesi ürün kararını ezmez |
| İtalik tamamen yasak | Editoryal preset'lerde (Instrument Serif) kasıtlı vurgu |
| Kahraman başlığında beyaz → gri degrade | Bizde display degradesi tek renk ailesinden, palet token'ı (`--display-gradient`) |
| Sabit koyu zemin listesi (#181818…) | Zemin palet ve tema token'ından; açık tema yeniden tasarlanır |
| Arka planda degrade hiç yok | `.app-bg` köşe ışıması kasıtlı ve tek; kural "üç yer + tek aile" |
| Her sayfada zorunlu "kelime kelime aydınlanan slogan" bölümü | Zorunlu bölüm, kendisi şablon izi olur; desen kataloğunda (04 § 13) seçenek olarak kalabilir |
| Metinde hiç kısa çizgi (-) yok | Türkçede "E-posta", "Wi-Fi" gibi yazımlarda zorunlu; bizde yasak yalnızca em dash |
| Sabit 4 px'lik aralık tablosu dışına çıkmama | Tailwind'in 4 px ızgarası zaten aynı işi görüyor (02 § 4) |

**Ne zaman değişir:** Tarayıcı bir projede sürekli `slop-ok` ile
susturuluyorsa kural yanlıştır: desen daraltılır ya da kaldırılır, kayıt
buraya "Değişti" alt başlığıyla düşer.
