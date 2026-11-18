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
  alamıyordu; buton tema ayrıştırmayı elle kopyalıyordu (üçüncü tema
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

> **Değişti (2026-11-08):** wrapper deseni korundu; bootstrap kullanıcı
> ayarına `Read(~/dev-starter/**)` ekliyor, wrapper'lar rol dosyasını ilk
> turda paralel okuyor, frontmatter'a `model`/`color`/`disallowedTools`
> geldi. Gerekçe: aşağıda "Bağlam Dosyaları".

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

*Son güncelleme: 2026-11-08*

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
| Sentence case başlık ve buton | Türkçe arayüzde Title Case kimlik değişmezi (00 § 1, #7) |
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

---

## Canlı Önizleme Zorunlu (2026-10-27)

**Karar:** Sitede görünen bir şeyi (metin, görsel, sıra, yazı tipi, punto,
renk) düzenleyen her yönetim paneli ekranının yanında sitenin kendisi durur:
masaüstü + telefon, açık + koyu, yazdıkça güncellenir; yazı tipi ve punto
anında. Kural `rules/live-preview.md`, kit `snippets/live-preview/`, Gate Pass 6
denetler, P4 planlar.

**Neden:** Geo Tour panelinde önizleme geldikten sonra "kaydet → siteye git →
bak → geri dön" döngüsü bitti; düzenleyen kişi telefonda satırın nasıl
kırıldığını, koyu temada görselin nasıl durduğunu yazarken görüyor. Her
projede sıfırdan yazılırsa sahte bir önizleme bileşenine kayıyor ve siteden
ayrışıyor; tek kaynak kit bunu önler.

**Alternatifler:** (1) Formun içinde siteyi taklit eden önizleme bileşeni:
siteden ayrışır, reddedildi. (2) "Önizle" butonuyla yeni sekmede taslak
sayfası: yazarken göremez, telefon ve koyu tema ayrı iş, reddedildi.
(3) Draft Mode (`draftMode()`) + iframe: çerez tüm siteyi taslağa açar ve
oturuma özel değil; kitteki `?oturum=` + ayrı tablo daha dar.

**Ne zaman değişir:** Bir projede içerik bir başlık CMS'te (Sanity, Payload)
duruyorsa onun kendi canlı önizlemesi kullanılır; değişmezler (gerçek sayfa,
iki cihaz, iki tema, anında font) aynı kalır.

## Board Görsel Dili — Nötr Sistem, Parlak Paletler, Grafik Token'ları (2026-11-01)

**Karar:** boardui.com'un görsel dilinden ÖĞRENİLDİ, kodu alınmadı.
Ekosistemin sistem katmanı nötr griye geçti, altı parlak palet ve altı
grafik rengi eklendi, `board` font preseti (Inter + JetBrains Mono) geldi.

**Neden:** eski sistem grileri mavi tonluydu (`#f7f9fb`, `#54677c`): her
palet mavinin içinde duruyordu ve "her şey mavi" hissi buradan geliyordu.
Nötr griyle renk yalnızca paletten ve veriden gelir; yeşim ya da pembe bir
ürün de kendi rengini temiz taşır.

**Ne alındı (dil, değer değil):** saf beyaz zemin + gri kuyu kart + beyaz
karo; kısa, katmanlı gölge; yukarıdan aşağı tek aile CTA degradesi ve üst
kenar ışığı; pastel ve eşit parlaklıkta grafik serileri; iz (track) üstünde
çubuk; fareyle seri yalıtımı.

**Lisans:** boardui'nin ücretsiz katmanı MIT, grafikler ve şablonlar ücretli
"BoardUI License". Kendi stack'i (react-aria-components, Remix Icon) bizimkiyle
(Base UI, lucide) aynı değil; doğrudan kurmak ikinci bir bileşen sistemi
getirirdi. Ücretli grafiklerin kodu görülmedi; `chart-card`, `stage-bars`,
`track-bar-chart`, `ring-chart` sıfırdan, kendi token'larımızla yazıldı.

**Değişmeyen:** `signature` varsayılan palet ve değerleri, durum renkleri,
degrade disiplini (üç yer, tek aile), punto ölçeği, imza eğrisi.

**Etkisi:** `@ahmetakyapi/theme` kullanan proje yükseltince zemin `#f7f9fb`
→ `#ffffff` (koyu `#070d16` → `#0c0c0d`) olur. `@ahmetakyapi/ui` `Button`
`primary` artık `bg-cta` (degrade) + `shadow-cta`; yeni `soft` varyantı.

## İşçilik Turu — Gölge Merdiveni, Işıklı Kenar, Kuyu (2026-11-03)

**Karar:** ui.wensity.com'un derinlik dilinden ÖĞRENİLDİ, kodu alınmadı.
Sitenin hesaplanmış stilleri (tarayıcıda `getComputedStyle`) ölçüldü;
değerler kendi token'larımıza uyarlandı. Board dili (kuyu + karo, nötr
sistem, degrade disiplini) DEĞİŞMEDİ; yalnızca derinliğin işçiliği arttı.

**Ne alındı (dil, değer değil):**

- **Gölge merdiveni:** her basamak katmanlı ve negatif yayılmalı (kıl
  kenar + içeri çekilmiş yumuşak düşüş); koyuda üst kenarda ışık çizgisi
  ve %4'lük beyaz halka. `raised` açıkta da %3,5'lik halka taşır: beyaz
  karo beyaz sayfada ayrışır.
- **Basılabilir buton:** üstte ışık, altta gölge çizgisi, dış kıl halka ve
  dolgunun kendi renginde (`color-mix`, `--primary`) kısa düşüş. Gri gölge
  dolguyu kirli gösterir; renkli düşüş butonu zemine bağlar.
- **Kuyu ve odak halesi:** giriş alanları ve bölümlü denetim rayı içe
  oyulur (`shadow-well`); odakta 2 px çizginin yanına vurgunun %18'iyle
  4 px hale (`shadow-focus`). Çizgi WCAG'i tutar, hale yalnızca yumuşatır.
- **Üstten ışıklı kenar (`edge-lit`):** vitrin kartı, panel, landing
  panosu, özellik kartı, fiyat, SSS ve kapanış kuyusu. Koyuda düz çizgi
  yerine yukarıdan sönen kenar.
- **Sıkı display:** harf aralığı punto basamağıyla gelir (hero −0.035em).

**Alınmayan:** kırmızı marka, WebGL sıvı metal buton, imleci izleyen
etiket ve reklam alanları (bizim paletimiz ve "nedeni tek cümleyle
yazılamayan hareket eklenmez" kuralı). Açık temada `#fafafa` zemin:
board dilinin saf beyaz sayfa + gri kuyu ayrımını bozardı.

**Etkisi:** token adları aynı, değerler değişti; mevcut proje `globals.css`
sistem bloklarını şablondan alınca bütün bileşenler yeni derinliği alır.
Yeni sınıflar (`shadow-well`, `shadow-focus`, `edge-lit`) yükseltilmemiş
projede derlenmez; `scripts/add-ui.mjs` eksik token'ı uyarır.

## Uyarı Tonu Tek Aile, Dolgu İki Temada Aynı (2026-11-03)

**Karar:** `--warning` açıkta `#825a0a` → `#965600`, koyuda `#d3a04a` →
`#ff9f0a`; yeni `--warning-fill: #ff9f0a` + `--on-warning-fill: #1f1300`
iki temada AYNI.

**Neden:** eski çift iki ayrı renk gibi okunuyordu: açıkta 40° zeytinimsi
kahverengi, koyuda soluk altın; tam genişlikte wash zeminle birleşince
"kirli turuncu" şerit. Apple'ın sistem turuncusu gibi canlı ton DOLGU
olarak her iki temada aynı kalır; metin gerektiğinde temaya göre koyulaşır
ama aynı hue ailesinde (34-36°). AA değişmedi: açık 5,79 sayfa, 4,72 kart +
wash; dolgu üstü mürekkep 9,6:1 (`tests/palette.test.ts`, `contract.test.ts`).

**Etkisi:** Pano'nun gecikme şeridi yerine `_gecikme.tsx` kartı (nötr kuyu,
tek renk noktası, sipariş başına yolculuk çizgisi). `banner-alert` warning
tonu yeni renkleri kendiliğinden alır.

## Bencho Turu — Kota Kartı, Kişi Seçici, Basılı Tut Onayı (2026-11-04)

**Karar:** bencho.dev'in mikro etkileşim kataloğundan üç desen alındı (kod
değil, davranış). Görsel dili zaten board diliyle aynı (gri kuyu + beyaz
karo, hap çipler); yeni olan ETKİLEŞİM.

- **SegmentedMeter `lg`** ("Context meter"): büyük rakam, ayrık kalın
  bölümler, lejant hapına gelince bölüm öne çıkar ve rakam ona döner.
- **AssigneePicker** ("Assignees"): avatar yığını tetikleyici, Türkçe
  aramalı listbox. Pusula talep detayında Atanan ve İzleyenler.
- **HoldButton** ("Slide to confirm" yerine): kaydırma yerine basılı tutma,
  çünkü klavyede doğal karşılığı var (Boşluk basılı) ve WCAG 2.5.1 yol
  hareketi istemez. Yalnız geri alınabilir eylemde.

**Devamı (aynı gün):** `reactions` (Emoji reactions, ikonla), `time-scrubber`
(Time scrubber), `signature-pad` (Signature pad, "Yazarak" yoluyla). Label
input ve Create menu alınmadı: `input` ve `dropdown-menu` zaten karşılıyor.

**Alınmayan:** ses efektleri (Sounds), göz takibi, sapan, jöle kaydırıcı
gibi "oyuncak" etkileşimler; nedeni tek cümleyle yazılamıyor
(`guides/04-motion.md`). Tepki emojileri: arayüzde emoji yasak (slop).

**Yan bulgu:** `dialog` ve `sheet` alt çubuğundaki `sm:[&>*]:w-auto` ikon
butonun `size-11` genişliğini eziyordu; yanına `flex-1` buton gelince 20
piksele düşüyordu (Pusula talep çekmecesi, "Bana Ata"). Kural yalnız
telefonda tam genişlik (`max-sm:[&>*]:w-full`) oldu.

## Bencho Turu — Sakin Sayı, Nesne Kahraman, Küçük Kesin Etkileşim (2026-11-04)

**Karar:** bencho.dev'in mikro etkileşim dilinden ÖĞRENİLDİ; kod, metin,
renk ve görsel alınmadı (freemium, `design-references.md` → "Bilinçli
Olarak Dışarıda"). Üç bileşen kendi token'larımızla yazıldı ya da
genişletildi: `tick-ruler` ve `digit-roll`. Aynı gün açılan `SegmentedMeter
size="lg"` kota kartını karşıladığı için ikinci bir "display" boyu
eklenmedi (bir iş için iki boy kütüphaneyi bulandırır).

**Ne alındı (dil, değer değil):**

- **Sakin sayı:** büyük değer 500 ağırlık ve sıkı aralık (`text-display
  font-medium tracking-tight`), birim ya da "/ 200 B" küçük ve sönük
  (`text-muted`). Kalın sayı bağırır; ince ve büyük sayı kendinden emin
  okunur, birim sayıyla yarışmaz.
- **Nesne kahraman:** tek beyaz nesne yumuşak kuyunun ortasında
  (`bg-overlay shadow-raised` karo, `bg-surface` kuyu). Board dilimiz
  zaten buydu; bencho bunun etkileşimli tek nesneyle de çalıştığını
  gösterdi: vitrin hücresi bir "örnek" değil, kendisi denenen nesne.
- **Küçük kesin etkileşim:** basınca 0.97, bırakınca yayla oturma, değer
  değişince yalnız değişen rakamın yuvarlanması. Her biri bir şeyi söyler
  (basıldı, yerine oturdu, şu basamak değişti); süs değil geri bildirim.

**Alınmayan:** ses (isteğe bağlı bile: çoğu çalışma ortamında sessiz,
açılınca rahatsız eder), 3B nesneler ve noktalı küre (nedeni tek cümleyle
yazılamayan hareket), reklam/sponsor kartları, İngilizce "of" eki.

**Etkisi:** `rolling-number` (yüklemede) ve
`animated-number` (ara değerden sayan) yerinde; üç sayının işi
`guides/10` § "Bencho Turu"nda ayrıldı.

## EasyUI Turu — Toplu İşlem, Bölünmüş Buton, Tur, İçindekiler (2026-11-04)

**Karar:** easyui.site'nin 132 bileşenlik kataloğu kütüphanemizle tek tek
karşılaştırıldı; çoğunun karşılığı zaten var. Karşılığı OLMAYAN ve iş
ekranında değer üreten dört desen sıfırdan, kendi token'larımızla yazıldı
(kod alınmadı): `selection-bar`, `split-button`, `product-tour`, `toc-nav`.

**Yan bulgu (kabuk):** `app-shell` kökü `min-h-dvh`, içerik karosu her boyda
`overflow-y-auto` idi: karo hiç kaymıyor ama kaydırma kabı olduğu için
içerideki `sticky` öğeler yapışmıyordu ve uzun sayfada kenar çubuğu
kayboluyordu. Masaüstünde kabuk `lg:h-dvh`, karo `lg:overflow-y-auto`;
telefonda pencere kayar. Bölüm gezintisinde `scrollIntoView` ile şeridi
kaydırmak sayfanın yumuşak kaydırmasını kesiyordu; şerit yalnız yatayda
`scrollTo` ile kayar.

**Alınmayan:** gösteri efektleri (Dynamic island, Glitch, Meteors, Rocket
popper) ve taşan diyalog açılışı (Settle modal): taşma yalnız küçük tek
öğenin geri bildiriminde.

**Örnek veri:** Pusula'nın kurgusal firması "Kervan Tekstil" kaldırıldı;
çalışma alanının adı doğrudan Pusula, adresler `pusula.app` (sahibinin
isteği).

## Secki Turu — Hareket ve Doku, Yapay Zekâ Bileşenleri, Paket Kiti, Storybook Kabuğu (2026-11-06)

**Karar:** secki.dev'in 332 bağlantısı tarandı; bileşen, hareket, desen ve
skill kaynaklarından kütüphanemizde karşılığı olmayan 17 desen sıfırdan,
token'larımızla yazıldı (kod alınmadı). İki yeni grup:

- **Hareket ve Doku** (13): `border-beam`, `slot-text`, `scramble-text`,
  `animated-icon`, `morph-icon`, `pixel-loader`, `terminal`, `dial`,
  `book-cover`, `pattern-bg`, `halftone-image`, `mark-annotate`,
  `expandable-card`.
- **Yapay Zekâ** (4): `thinking-orb`, `tool-call`, `reasoning`,
  `stream-text`. Ajan arayüzünde "model ne yaptı"yı gösteren eksik parçalar
  (`rules/agentic-ui.md`: şeffaflık).

Her hareket bir şey söyler (çalışıyor, değişti, burası önemli), hareket
azaltmada durur ve bilgi durağan bir kanalda da kalır. Işık ve desen tek renk
ailesi; desen zemini bölüm arkasında, veri panelinde değil.

**Desen kütüphanesi (patterncraft.fun'dan):** kullanıcı arayüzünü beğendi.
Alınan deneyim (kategori, arama, Önizle ile bütün sayfaya uygula, Kopyala,
favoriler); onların 250+ sabit renkli deseni yerine 35 token'lı birleşim:
10 palet × 2 temada kendiliğinden doğru.

**Paket kiti:** `@ahmetakyapi/ui` 3.1.0 artık 86 bileşen taşır.
`scripts/build-ui-package.mjs` snippet'lerden ÜRETİR (tek kaynak
`snippets/ui`); `next/*` ya da Base UI isteyen 32 bileşen pakette yok, onlar
`add-ui` ile kopyalanır (paket Next'e ve headless kütüphaneye bağlanmaz).
`verify:kit` CI'da bayatlığı yakalar. `lucide-react` peer bağımlılık oldu.

**Storybook kabuğu:** yönetici teması `tokens.ts`ten (elle hex kopyası
bitti), araç çubuğundaki Tema ve Palet'i izler: sidebar seçimi, marka karosu,
odak halkası ve belge sayfası paletle döner (incelenen hiçbir Storybook bunu
yapmıyordu). Seçili satır dolu mavi blok değil, yıkama + mürekkep + 2 px
çizgi (ton farkı). Display rolü Schibsted Grotesk (amiral projenin ailesi);
gövde Inter, kod JetBrains Mono kalır (board kararına ekleme). Yeni "Kapak":
canlı palet karoları, gerçek bileşenlerden örnek sahne, raf ve kurulum.

**Alınmayan / karar bekleyen:** ses (`ui-sound` yazıldı, iki eski kararla
çeliştiği için çıkarıldı; kullanıcıya soruldu), WebGL süsleri, Lenis.
Dış skill'lerin bizden ayrıldığı beş nokta `guides/04` § 15 "Açık kararlar"da.

## cinecode — MP4 Filmleri Dış Kitle, Sayfa İçi Film motion-film'le (2026-11-07)

**Karar:** Teslimi bir dosya olan her film (kısa film, tanıtım ve reklam,
müzik videosu, çekim kurgusu) `sarpstar/cinecode` skill'iyle yapılır.
`motion-film` sayfanın içinde oynayan filmlerin (Açılış Zili mürekkep
sahneleri, bekleme filmleri) ve iki kitin ortak sayılarının kaynağı kalır.

**Neden:** cinecode bizim video yarımızın yapmadığını uçtan uca yürütüyor:
onaylı adımlar (senaryo, stil karesi, animatik, taslak), katmanlı ses ve
−14 LUFS master, lisans kaydı, bağlam bütçesi. Aynısını `motion-film`e
yazmak ikinci, bayatlayacak bir kaynak açardı.

**Nasıl kurulur:** vendor edilmedi (depo 30 MB, 11 MB'lık tanıtım GIF'i;
kitin kendi güncelleme yolu git). anatomy gibi SABİT commit: skill her araç
çağrısında koşan bir koruma kancası taşıyor, HEAD içeriği denetlenmeden
talimat olmaz. bootstrap'te anatomy ile ortak `pinned_skill` fonksiyonu;
health-check `CINECODE_REF`'i denetler.

**Marka filmleri:** projenin film kimliği belgesiyle başlar (Açılış Zili
`docs/film-kimligi.md`); cinecode'un "varsayılan font/palet yok, kartta
gerekçesi olsun" kuralına gerekçeyi o belge verir. Mod ve kapılar değişmez.

## Bağlam Dosyaları — Kısa CLAUDE.md, Yol Kapsamlı Kurallar, Wrapper İzni (2026-11-08)

**Karar:** Her oturumda yüklenen dosyalar (kök `CLAUDE.md`, global
`machine/CLAUDE.md` = `~/.claude/CLAUDE.md`, iki Next şablonunun
`CLAUDE.md`si) ~200 satırın altına indi. Yalnız belirli dosyalara ait
kurallar `paths:` frontmatter'lı kural dosyalarına taşındı; eşleşen dosya
okununca yüklenirler. Uzun harita ve örnekler `docs/ECOSYSTEM.md`de
(otomatik yüklenmez). Hiçbir kural silinmedi; her taşınan bölüm yeni
yerinde bir "nereden geldi" notu taşır.

**Neden:** Claude Code'un güncel resmî önerisi (code.claude.com/docs, 8
Kasım 2026'da doğrulandı): CLAUDE.md dosya başına ~200 satır; uzun dosya
bağlamı yer ve uyumu düşürür. `@path` içe aktarma bağlamı AZALTMAZ
(başlangıçta yüklenir), bu yüzden kullanılmadı. Global dosya 17 KB'tı ve
Açılış Zili'nden bir CSS düzeltmesine kadar HER projede, HER işte
yükleniyordu; React/Next, veritabanı ve görsel dil ayrıntısı backend ya da
belge işinde boşa bağlam yiyordu. Kök dosya kendi tavanını (520) da
aşmıştı (526).

**Ölçüm (satır / bayt):** kök `CLAUDE.md` 526 → 169; `machine/CLAUDE.md`
324 / 17,3 KB → 183 / 9,0 KB; `templates/landing/CLAUDE.md` 228 → 160;
`templates/nextjs-fullstack/CLAUDE.md` 213 → 135. health-check tavanı dört
dosyada 200.

**Taşınanlar (eski → yeni):**

| Eski yer | Yeni yer | Yüklenme |
|---|---|---|
| `machine/CLAUDE.md` → Kod Standartları → React / Next.js | `machine/rules/nextjs-react.md` | `*.tsx`, `app/`, `components/`, `hooks/`, `proxy.ts` |
| `machine/CLAUDE.md` → Dosya Yapısı Tercihleri | `machine/rules/nextjs-react.md` | aynı |
| `machine/CLAUDE.md` → Öğrenilen Hatalar 1, 2, 4, 6, 7, 8 | `machine/rules/nextjs-react.md` (numaralar korundu) | aynı |
| `machine/CLAUDE.md` → Veritabanı, Environment Variables, Hatalar 3, 5, 9 | `machine/rules/data-env.md` | `lib/db*`, şema, migration, `.env.example`, API, action |
| `machine/CLAUDE.md` → Görsel Dil (DNA, palet, notlar, tema tablosu), Hata 10 | `machine/rules/visual-language.md` | `*.css`, `*.tsx`, `THEME.md`, tema belgeleri |
| `machine/CLAUDE.md` → Tasarım Skill'leri (tablo, mod tespiti, öncelik, çakışmalar) | `machine/rules/design-skills.md` | `*.css`, `*.tsx`, `app/`, `components/` |
| `machine/CLAUDE.md` → Yönetim Paneli — Canlı Önizleme | `machine/rules/admin-live-preview.md` | `admin/`, `panel/`, `yonetim/` |
| kök `CLAUDE.md` → Ekosistem Yapısı (tam ağaç), Proje Yaşam Döngüsü (faz ayrıntısı), Hızlı Başlangıç | `docs/ECOSYSTEM.md` | elle okunur |
| kök `CLAUDE.md` → Enforcement Hook'ları (tablo, entegrasyon) | `.claude/rules/hooks.md` | `hooks/`, ayarlar, `test-hooks.sh` |
| kök `CLAUDE.md` → Ecosystem Health Check, verify:agentic, anatomy, cinecode, AI Slop, Canlı Proje Denetimi | `.claude/rules/verification.md` | `scripts/`, bootstrap, `package.json`, CI |
| kök `CLAUDE.md` → Açık kararlar | bu dosya → "Açık Kararlar" (aşağıda) | elle okunur |
| kök `CLAUDE.md` → Kayıtlı Subagent tablosu, Context Curation, komut tablosunun Dosya sütunu | `.claude/rules/orchestration.md` | `.claude/`, `agents/`, `machine/`, `rules/`, `phases/` |
| kök `CLAUDE.md` → Paket Kullanımı | `.claude/rules/packages.md` | `packages/`, `snippets/`, `storybook/`, `templates/` |
| şablon `CLAUDE.md` → Kimlik ortak/palet + Token kuralları (tema satırı hariç) | `templates/*/.claude/rules/tokens.md` (iki şablonda bayt bayt aynı) | `*.tsx`, `*.css` |
| şablon `CLAUDE.md` → Hareket kuralları | `templates/*/.claude/rules/motion.md` (ortak) | `*.tsx`, `lib/motion.ts`, `hooks/` |
| şablon `CLAUDE.md` → Açıklayıcı figür (ayrıntı) | `templates/*/.claude/rules/figures.md` (ortak) | `components/iso/`, `components/figures/` |
| landing `CLAUDE.md` → Parçacık sahnesi (R3F) | `templates/landing/.claude/rules/scene.md` | `components/scene/`, `components/heroes/` |
| fullstack `CLAUDE.md` → AI akışı (`/akis`) | `templates/nextjs-fullstack/.claude/rules/feed.md` | `app/akis/`, `components/feed/`, `lib/feed*.ts` |

Global dosyada KALAN her projeye ait kurallar: kimlik, tech stack,
TypeScript, üç kritik kural özeti (Server Action, migration, canlı
önizleme), Title Case ve çeviri kokan ifade (yanıtlarda da geçerli),
yasaklı yaklaşımlar, commit + push + yazar kuralı, `design-taste-frontend`
VARSAYILAN kuralı (tek paragraf), cmux önerisi, yeni proje komutları.

**`machine/rules/` nasıl yüklenir:** `bootstrap.sh` klasörü tek symlink'le
`~/.claude/rules/dev-starter/`e bağlar (Claude Code `~/.claude/rules/`
altını özyinelemeli tarar; kullanıcının kendi kural dosyaları yanında
kalır, yeni kural bootstrap'sız gelir). Bulut oturumunda bootstrap
koşmadığı için tıpkı global CLAUDE.md gibi bu kurallar da orada yoktur —
değişen bir şey yok.

**Wrapper'ın rol dosyasını okuması — seçilen: izin, seçilmeyen: derleme.**
Wrapper'lar rol tanımını `~/dev-starter/agents/...` mutlak yolundan okur;
başka projeden çağrılan subagent için bu yol çalışma dizini dışındadır ve
izin kuralı yoksa ilk `Read` izin istemine/redde düşüp bir tur yakar.
İki çözüm tartıldı:
- *Rol içeriğini wrapper'a derleyen üretim adımı* (health-check
  tutarlılığı denetler): rol okuma turunu kaldırır, ama rol dosyaları da
  `rules/`, `guides/`, `knowledge/`a okuma listesi veriyor — izin YİNE
  gerekiyor. Üstüne ikinci kaynak, üretim betiği ve `--check` bakımı.
- *Kullanıcı ayarına `Read(~/dev-starter/**)`* — SEÇİLDİ. Tek kaynak
  bozulmaz, rol dosyası ve okuma listesindeki her dosya aynı kuralla açılır.
  `bootstrap.sh` yalnız bu kuralı ekler (depo başka yerdeyse gerçek yolu da),
  dosyayı önce yedekler, geçersiz JSON'a dokunmaz. Read kuralları Grep ve
  Glob'a da uygulanır. Kalan tur maliyeti tek: wrapper gövdesi rol dosyası
  ve okuma listesini İLK turda, paralel `Read` ile açtırır.

**Wrapper frontmatter'ı:** dokuzuna `model: inherit` ve `color`; kod yazmayan
dört role (`gate`, `deploy`, `design-reviewer`, `researcher`)
`disallowedTools` ile Edit/NotebookEdit (gate ve deploy'da Write da) açıkça
kapalı; açıklamalar "ne zaman"ı söyler, otomatik devir istenenlerde
"PROAKTİF kullan" (gate, qa, design-reviewer, researcher). `isolation:
worktree` frontmatter'a konmadı: paralel dalgada orkestratör çağrı başına
seçiyor. health-check frontmatter'ı denetler (name = dosya adı, açıklama,
model).

**Hook'lar:** iki commit hook'una handler düzeyinde `"if": "Bash(git *)"`.
`Bash(git commit*)` seçilmedi (lib'in tanıdığı ve testlediği `git -C yol
commit`, `git -c k=v commit` kaçardı). Bilinen ve kabul edilen boşluk: `env
git commit`, `command git commit`, `/usr/bin/git commit` alt komut adı `git`
olmadığı için filtrede kalır (`if` "best-effort"tur; sert sınır izin
sistemi). Kancalar zaten exit 2 ile engelliyordu (exit 1 engellemez);
doğrulandı. `Edit|Write` matcher'ı tam ad listesi, NotebookEdit'i bilerek
yakalamaz. SessionStart'a `if` konmaz (araç olayı değil, hook hiç koşmaz).

**Sır dosyaları:** proje ve şablon ayarlarına `permissions.deny`:
`Read(**/.env)`, `Read(**/.env.local)`, `Read(**/.env.*.local)`,
`Read(**/.env.production)`. `Read(./.env*)` SEÇİLMEDİ: `.env.example`ı da
kapatır, şablon ve `/new-project` onu okuyup düzenliyor. Bash kuralları metin
eşler, güvenlik sınırı değildir; `cat .env.local` bununla kapanmaz — asıl
koruma `quality-scan` (commit) ve `.gitignore`. `.claudeignore` etkisiz,
kullanılmadı.

### Komut mu Skill mi — Değerlendirme (toplu taşıma YOK)

`.claude/commands/*.md` hâlâ çalışıyor ve skill listesinde açıklamasıyla
görünüyor (model çağırabilir); yeni iş için resmî öneri skill. Toplu
taşıma yapılmadı: bootstrap komutları tek tek `~/.claude/commands/`a
bağlıyor, health-check `COMMANDS` listesi, kök CLAUDE.md tablosu ve README
sayacı (`.claude/commands` sayısı, "Komut") aynı evreni sayıyor; taşıma
dördünü birden değiştirir ve kazanç ancak skill'e özgü bir alan
(yan dosya, `context: fork`, `paths`, `allowed-tools`) gerektiğinde gerçek.

Bu turda yapılan tek komut değişikliği: geri alınması zor yan etkili
`/deploy` ve `/release`e `disable-model-invocation: true` (model kendi
kararıyla çağıramaz). `/new-project` bilerek açık: `/kickoff` onaydan sonra
akışı ona devrediyor.

**Ölçüt:** komut skill olur, eğer (1) 150 satırı aşıp yan dosyaya bölünmek
istiyorsa, (2) betik/şablon taşıyorsa, (3) açıklamasından otomatik
tetiklenmesi gerçekten isteniyorsa ya da (4) `paths`/`context: fork` gibi
skill alanına ihtiyaç duyuyorsa.

**Aday sırası:** 1) `/new-project` (184 satır, bash adımları; şablon/overlay
seçimi ve doğrulama yan dosyaya), 2) `/reference` (104 satır, galeri
kataloğu yan dosya olarak skill'in yanına), 3) `/agentic` (karar ağacı,
`paths: lib/agent/**` gibi bir kapsamla kendiliğinden yüklenebilir).
Kalanlar komut kalır: kısa, kullanıcının bilinçli tetiklediği akışlar
(`/status`, `/story`, `/gate` — rapor ve ROUTEMAP yazımı ana oturumda
olduğundan `context: fork` uygun değil — `/fix`, `/retro` …).

**Taşıma reçetesi (tek tek, doğrulanarak):** `machine/skills/<ad>/SKILL.md`
(< 500 satır; frontmatter `name`, `description` + `when_to_use`, gerekiyorsa
`disable-model-invocation`, `allowed-tools`; ayrıntı yan dosyada) — bootstrap
`machine/skills/*`i zaten bağlıyor; komut dosyası silinir; health-check'e
`SKILLS` listesi, README sayacına skill sayısı, kök CLAUDE.md tablosunda
dosya notu; `bash scripts/health-check.sh` + `npm run readme:assets`.

**Ne zaman değişir:** Claude Code komut desteğini kaldırır ya da skill'e
özgü bir alan bir komut için gerçekten gerekirse — o komut tek başına taşınır.

### Değişti (2026-11-08) — Orkestrasyon Modeli: wrapper izni

"Orkestrasyon Modeli" kararındaki ince wrapper deseni KORUNDU; eklenen tek
şey okuma izni (`Read(~/dev-starter/**)`, bootstrap) ve wrapper gövdesinin
ilk turda paralel okuma talimatı. Gerekçe yukarıda.

## Açık Kararlar

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Ecosystem Health Check" bölümünün
> sonundaydı; karar listesi olduğu için buraya taşındı.

1. ~~**Referans çelişkisi**~~ → ✅ 2026-10-03: ekosistemin görsel referansı
   artık Açılış Zili (`signature` paleti, token mimarisi). ahmetakyapi.com
   kendi eski paletinde kalır, dokunuldukça `signature`a yaklaşır.
2. ~~**`gradient-text` yasağı fazla katı**~~ → ✅ 2026-08-16, yasak kaldırıldı;
   2026-10-03'te yeni projeler için "üç yer + tek aile" kimlik kuralı geldi.
3. **Palet istisnaları**: `onepiece-hub` ✅ çözüldü. `ramazan-vakitleri`
   (mor+pembe+mavi) `iris`e yakın; hâlâ açık.
## Ribbon Turu — Tanıtım Bileşenleri (2026-11-07)

**Karar:** meetribbon.app (Mac pencere yöneticisi) bölüm bölüm tarandı
(Playwright: 1440 ve 390 piksel ekran görüntüleri, hesaplanmış stiller, DOM,
etkileşimler). Kütüphanede karşılığı olmayan sekiz desen sıfırdan, token'la
yazıldı ve yeni **Tanıtım** grubunu kurdu: `liquid-glass`, `blur-in`,
`hand-callout`, `app-window` (+ `WindowStrip`), `dock`, `docking-nav`,
`corner-mascot`, `trust-line`. Hepsi pakete girdi (kit 86 → 94).

**Zaten vardı, alınmadı:** cam hapa toplanan başlık (`SiteHeader`), iki
sütunlu SSS (`Faq`), tuş kapağı (`kbd`), kalem vurgusu (`mark-annotate`),
Instrument Sans + Instrument Serif eşi (`editorial` preset: Ribbon'ın gövdesi
de Instrument Sans).

**Sitenin asıl dersi (desen değil, strateji):**

- **Deneme yerine canlı demo.** Ücretsiz deneme yok; bütün kısayollar
  sayfadaki sahte masaüstünde denenir ("satın almadan önce burada dene").
  Ürün maketi ekran görüntüsü değil, token'la çizilmiş, temayla dönen
  parçalar (`app-window`, `dock`). Pusula Tanıtım Sayfası bunu gösterir:
  dock'tan seçilen pencere şeritte odağa gelir.
- **Güvenceyi tıklamanın dibine koy.** Her indirme butonunun altında aynı
  güven satırı. "Güvenli mi?" sorusu SSS'ye kadar beklemez (`trust-line`).
- **Tek oyunbaz öğe.** Ciddi bir araç sitesinde sıcaklık tek yerden gelir:
  maskot ve el yazısı not. Sayfada bir maskot, bir-iki not; fazlası oyuncak.
- **Karşılaştırma SEO'su.** Alt bilgide "Ribbon vs yabai/AeroSpace…" ve
  rehber sütunları: arama trafiği rakip adıyla gelir. Kendi ürünlerimizde
  sitemap'e karşılaştırma ve rehber sayfaları planlanabilir (`guides/11`
  SEO açılışı).

**Teknik kararlar:**

- `blur-in` CSS animasyonu: kahraman başlığı çoğu zaman LCP; hidrasyonu
  bekleyen Motion girişi başlığı JS inene kadar gizlerdi. Reveal'in "LCP
  öğesi sarılmaz" kuralı korunur, bu tek istisna JS'siz.
- `liquid-glass` üç katman: kenar (iç gölgeler, token'dan), buğu (her
  tarayıcı), bükülme (`backdrop-filter: url(#svg)`, yalnız Chromium).
  Desteklemeyen tarayıcı bildirimi atlar, buton sadeleşir ama kırılmaz.
  `prefers-reduced-transparency`de opak.
- `docking-nav` kaydırmayı `useSyncExternalStore` ile boole okur: yalnız
  eşikte çizim, sayfa ortasında yenilenince ilk karede doğru, efektte
  setState yok (React Compiler lint kuralı).
- `dock` büyümesi yalnız CSS (`:has()` ile komşular); ölçüm yok.
- `handFont` (Caveat) preset'lerin parçası değil, isteğe bağlı yükleyici:
  tanımlı her next/font yükleyicisi sayfaya bağlanır (fonts.ts ölçümü).
- `app-window` ve maskotta pencere butonları durum token'larından (danger,
  warning, success); sabit kırmızı-sarı-yeşil yok, paletle döner.

**Alınmayan:** varlıklar ve marka (piksel sanatı kahraman, suluboya kapanış,
Apple logosu, maskot çizimi, rozetler), sistem serif'i, ham sky/zinc paleti,
kıtlık sayacı ("10 kişiden 10'u kaldı": doğrulanamayan aciliyet, veri
dürüstlüğü). Ayrıntı `references.md` → Değerlendirilip Alınmayanlar.

## Offscreen Turu — Duvar Kâğıtları, Süzülen Sütunlar, Duyuru Destesi (2026-11-07)

**Karar:** offscreen.wtf (duvar kâğıdı galerisi) ilk `/harvest` turuyla
tarandı. Tıklanan noktadan daire açılan tema geçişi (`theme-toggle`) ve kumlu
doku (`pattern-bg` → noise) bizde vardı. Üç yeni bileşen: `drift-columns`
(zıt yönde süzülen sütunlar, yalnız CSS), `notice-deck` (köşede dönen duyuru
destesi; sitedeki sponsor kartının duyuru karşılığı), `wallpaper`.

**Duvar kâğıtları:** sitedeki görseller sanatçıların eseri, alınmadı. İlk
sürüm altı sahneyi paletin tonunu beyaz/siyahla karıştırarak çiziyordu;
kullanıcı "güzel durmuyor" dedi (haklıydı: oklab karışımı bulanık ve
kahverengiye çalan sahneler veriyordu). **Değişti (2026-11-07):** sekiz
illüstrasyon sahnesi, elle seçilmiş renk setleriyle (`token-ok-file`
gerekçeli istisna: arayüz rengi değil resim rengi) ve gerçek işçilikle:
katman başına ışık degradesi, katmanlar arası sis, güneşte geniş hale, kumda
aydınlık/gölge yüzü ve sırt çizgisi, düzensiz kayalık zirveler, kutup
ışığında yüzlerce dikey huzme, ipek çizgileri, kâğıt kesiminde gölge.
`downloadWallpaper()` Retina masaüstü (2880×1800) ve telefon (1290×2796)
PNG'si üretir. Ders: illüstrasyonda token disiplini güzelliği öldürür;
sınır arayüz ile resim arasında çizilir.

**Erişilebilirlik kararı:** iki bileşen de kendiliğinden hareket eder; WCAG
2.2.2 gereği üzerine gelme ve odak durdurur, hareketi azaltan kullanıcıda
hiç oynamaz, kendiliğinden değişen içerik ekran okuyucuya duyurulmaz.

**Alınmayan:** açılış yükleyicisi (içeriği geciktirir), reklam/sponsor
yerleri, Cormorant Garamond + Anton eşi (serif vurgu `editorial` presetiyle).

## Scrolltide Turu — Renk Zemini, Biçim Değiştiren Menü, Kavisli Galeri, Kurallı Şifre (2026-11-11)

**Karar:** scrolltide.co (kaydırma odaklı site promptları ve bileşen
kütüphanesi; 2026-10-16'da ücretli olduğu için bölüm galerisine
ALINMAMIŞTI) `/harvest` ile tarandı. Galeri kararı değişmedi: sitenin
prompt'u, kodu, videosu kopyalanmaz. Alınan yalnız dört davranış; hepsi
token'la sıfırdan yazıldı:

- `mesh-gradient`: "Motion behind everything" rafının (24 gradyan, 5
  yarım ton, 4 sarmal, alev) CSS karşılığı. Onlar shader + MP4; biz dört
  bulanık leke + `transform`. Kimlik kuralı 5 gereği renk TEK aile
  (`primary` ya da `neutral`), raflarındaki çok renkli "Neon/Candy"
  karışımları alınmadı. Görünümden çıkınca durur (guides/04 → Ortam).
  İlk sürüm tam doygun lekelerle "kötü duruyor" dendi (haklıydı: koyu
  temada birincil renk açık, açık temada koyu; başlık ve gri güven satırı
  zeminle çatışıyordu). **Değişti (2026-11-11):** varsayılan `soft` (lekeler
  zeminle karışık) + daha geniş örtü; başlık ≥ 7,8:1, küçük metin `text-body`
  ile ≥ 4,7:1 (piksel piksel ölçüldü). Tam doygun `intensity="vivid"`.
- `morph-nav`: tek kabuğun paneller arasında esnemesi. Kabuğun eni/boyu
  canlanan TEK öğe; içerik mutlak konumlu olduğu için akış yeniden
  dizilmez (Base UI NavigationMenu aynı yolu kullanır). "Yalnız bileşimci"
  kuralına bilinçli, dosyada yazılı istisna.
- `arc-carousel`: Arc Wave/Flow Tunnel'ın WebGL'siz hâli. Ders: aynı öğede
  `rotate` + `scale` uzak `transform-origin`den ölçekler, kart yaydan
  düşer; dönüş dış, küçülme iç katmanda (ölçümle bulundu: kart altı 615 px
  → 475 px, sahne 491 px).
- `password-field`: Turtle Password'ün özü (her kural görünür ilerleme),
  kaplumbağasız. Varsayılan kurallar uzunluğu öne alır (NIST 800-63B).

**Strateji dersleri:** (1) Kütüphane sayfası türlere göre raflanmış
(bileşen, bölüm, ekran, zemin), her rafın kendi filtre çipi ve "Hepsini
Gör (95)" bağlantısı var; Storybook kapağımızın kapı kartlarıyla aynı
fikir. (2) Katalog kartında hareketli önizleme yalnız üzerine gelince
oynar, durağan kapak her zaman var (LCP). (3) "No AI tells" konumlanması:
ürün doğrudan AI kokusunu reddederek satıyor; bizim `slop-scan`imizin
pazardaki karşılığı. (4) Açılışta abonelik penceresi ve kıtlık sayacı
içeriği örtüyor: yapma (references → Değerlendirilip Alınmayanlar).

**Zaten vardı:** tema anahtarı (`theme-toggle`), basılı tut (`hold-button`),
sıvı cam (`liquid-glass`), cetvel seçici (Tuner ↔ `tick-ruler`), sekme
(Glass Tabs ↔ `tabs` well), sohbet kutusu (`chat-composer`), adım listesi
(`HowItWorks`), dosya ağacı (`tree-view`), yarım ton (`halftone-image`).

## Ajan Katmanı — Onay Sınırı, Depoya Özgü Komutlar, Terminal Commit'leri (2026-11-10)

**Karar 1 — "Commitle = push" ile "onaysız deploy yok" çatışmaz.** Onay
kuralı AÇIKÇA çalıştırılan geri alınması zor komutlar içindir: `vercel --prod`,
`npm publish`, üretim veritabanında migration, `git push --force`. Bunlar proje
ve şablon ayarlarında `permissions.ask` ile her modda sorulur. Kullanıcının
"commitle" dediği düz push o onayın kendisidir (`main` push'u deploy tetiklese
bile) ve listede yoktur.
*Alternatif:* düz push'u da sormak — reddedildi (sahibin açık tercihi: "SORMA").
*Ne zaman değişir:* depoya ikinci bir kişi girerse ya da üretim verisi olan bir
projede push'tan kaynaklı bir kaza yaşanırsa `main`e push da `ask`e alınır.

**Karar 2 — Yalnız dev-starter'da anlamlı komutlar global bağlanmaz.**
`/harvest` ve `/evolve` `REPO_ONLY_COMMANDS`ta; proje kapsamında yüklü kalır.
*Alternatif:* ikisini `.claude/skills/`e taşımak — "toplu taşıma yok" kararı ve
dört sayacın (COMMANDS, CLAUDE.md tablosu, README, bootstrap) birlikte değişmesi
yüzünden seçilmedi; liste tek satır.

**Karar 3 — `~/dev-starter` yoksa şablon hook'ları commit'i BLOKLAMAZ, SÖYLER.**
SessionStart yolu sınar ve "KAPALI" uyarısını bağlama basar.
*Alternatif:* `onFailure: "block"` ya da exit 2 — `if: Bash(git *)` filtresiyle
her git komutunu durdurur, bulut oturumu hiç commit atamazdı.
*Ne zaman değişir:* bulut ortamının kurulum betiği depoyu `~/dev-starter`a
klonlamaya başlarsa engelleme yeniden değerlendirilir.

**Karar 4 — Terminal commit'leri için kopya değil köprü.**
`hooks/git-pre-commit.sh --install` `.git/hooks/pre-commit`e ince bir köprü
yazar; aynı iki script koşar. husky/`core.hooksPath` seçilmedi: şablona
bağımlılık ve versiyonlanan ikinci bir kanca dizini getirirdi.
*Sınır:* `--no-verify` atlar; mesaj biçimi o aşamada bilinmez.

**Karar 5 — Subagent slash komutu çağırmaz; rol dosyası komutu doğrudan yazar.**
Açık `tools` listesi `Skill`i ve MCP araçlarını dışarıda bırakır (resmî belge).
Wrapper'lara `Skill` eklemek yerine rol dosyalarındaki "Kullandığı Skills"
tabloları kaldırıldı: komutlar orkestrasyon adımıdır, subagent'a verilirse iç
içe dağıtım başlar. MCP gereken tek rol (`design-reviewer`) sunucuyu adıyla sayar.

**Karar 6 — `hotfix` commit tipi değildir.** Tip listesi üç yerde aynıdır
(kural tablosu, global CLAUDE.md, `quality-scan` → `CC_TYPES`) ve health-check
eşitliği denetler.

## Kapak ve README Yüzü (2026-11-10)

- Kapağın konusu kimliktir, pano değil: Her Şey Bir Arada zaten ürün panosunu
  gösteriyor; kapak token sistemini çalışırken gösterir (rol renkleri, ölçülen
  kontrast, tema anahtarı).
- Kapakta sayı ve oran elle yazılmaz: kontrast render anında `tokens.ts`ten
  ölçülür, desen sayısı `PATTERN_PRESETS`ten gelir.
- Marka işareti (degrade karo + kısalan üç çubuk) sidebar, kapak künyesi ve
  README'de aynıdır.
- Sayfa niteliğindeki hikâyede eklenti paneli kapanır; yalnız biz kapattıysak
  geri açılır.
- Play fonksiyonu sayfayı kaydırmaz ve ziyaretçinin globalini değiştirip
  bırakmaz.
- README görselleri palet sayısından bağımsız çizilir (beşli sıralar, numune
  yelpazesi).
- Kapakta yeni Tanıtım bileşenleri bilerek yok (yığılma olurdu); Pusula
  Tanıtım Sayfası'nda sergileniyorlar.

## Sorgu Komutu — `/grill` (2026-11-15)

**Karar:** Kodlamadan önce planı sorguya çeken görüşme döngüsü ayrı bir komut
(`/grill`) olarak eklendi. Matt Pocock'un `grilling` skill'inin yöntemi
alındı (MIT): karar ağacı, her turda yalnız sınırdaki kararlar, her soruda
önerilen cevap, bilgiyi ajan arar, kararı kullanıcı verir. Eksik olan buydu:
`dev-cycle` VALIDATE bir kontrol listesiydi, BA rolü kapsamı sorguluyordu
ama gizli bağımlılığı (çağrı sırası, yan etki) koddan bulup soran bir döngü
yoktu.
*Alternatifler:* (1) skill'i olduğu gibi kurmak — İngilizce, akışımıza
(story, ROUTEMAP, Teknik Notlar) bağlı değil, reddedildi; (2) skill olarak
`machine/skills/`e yazmak — yan dosya/betik gerektirmiyor, "Komut mu Skill
mi" ölçütüne göre komut; (3) her işte otomatik koşturmak — küçük işleri
uzatır, yalnız ORTA/BÜYÜK'te önerilir.
*Ne zaman değişir:* `/story` akışında kullanıcı onu çoğunlukla geçiyorsa
öneri kaldırılır; hep kullanılıyorsa VALIDATE'in zorunlu adımı olur.

## Ingot Turu — Pusula'nın Kendi Ürün Kimliği (2026-11-16)

**Karar:** Pusula (Storybook'taki örnek uygulama) board dilinin "beyaz karo
içinde gri kuyu" katmanını bırakıp kendi ürün kimliğine geçti; ölçü ve
yöntem ingotui.com önizlemelerinden (dil, kod değil). Kataloğun genel
token'ları ve `snippets/ui` bileşenleri DEĞİŞMEDİ; kimlik ürün kökünde
(`[data-product="pusula"]`, `storybook/stories/showcase/pusula.css`) ve
Pusula'nın ortak parçalarında (`_ui.tsx`) yaşıyor:

- **Grafik paleti paletten türer:** seri 1 vurgu, 2 vurgunun yıkanmışı
  (önceki dönem), 3 mürekkep (nötr), 4-6 yardımcı. Genel dizi (limon, mavi,
  mor, pembe) on iki grafik yan yana gelince renk kataloğu gibi okunuyordu.
  Palet değişince grafikler de döner.
- **Mürekkep buton (`INK`):** sayfa başlığındaki birincil eylem (Takvim →
  Randevu Oluştur) koyu degrade hap; logo karosu da aynı mürekkep.
  Panodaki gecikme kartının "Talepleri Gör" butonu sahibinin isteğiyle
  paletin mavi birincil butonu kaldı (2026-11-16): uyarı kartındaki tek
  eylem renkli olunca daha çok çağırıyor.
- **İki katlı sayfa başlığı:** ekmek kırıntısı (Pusula › Genel/Yönetim ›
  sayfa) + verinin güncellendiği an + zil; altında büyük başlık, tek satır bağlam,
  sağda eylemler. Kenar çubuğu grupları "Genel" ve "Yönetim".
- **Kart:** beyaz zemin + kıl halkası + en hafif gölge (`CARD`, `Well`);
  kartın içindeki panel gri ve gölgesiz (gömük), kart içinde kart yok.
- **Ölçü şeridi:** dört ölçü tek kartın kıl çizgiyle bölünmüş hücreleri,
  altta kesik çizgiyle ayrılmış eğilim ve bir satır anlam ("Hedefin %91'i").
- **Gelen Kutusu:** filtre çubuğu, tablo (gri başlık satırı) ve sayfalama tek
  kartta; talep numaraları eşaralıklı.
- **Raporlar:** özet kartlarındaki süs ızgara yerine payı gösteren nokta-çubuk
  ölçek ve ne ölçtüğünü yazan çip.

*Alternatifler:* (1) `--chart-*` ve kart dilini genel token'larda değiştirmek —
bütün kataloğu ve şablonları etkiler, board dili ekosistemin varsayılanı
kalsın diye reddedildi; (2) Ingot'un turuncu vurgusunu ve Geist fontunu almak —
kimlik taklidi olur, palet ve Inter kaldı.
*Ne zaman değişir:* Bu dil başka bir projede de tutarsa `CARD`/`INK`/ölçü
şeridi `snippets/ui`ye bileşen olarak taşınır (`/harvest` adım 3).

### Değişti (2026-11-17) — Mürekkep buton kalktı

Sahibi: "sol menü ve ekranlar tutarlı değil". Pano'da birincil eylem mavi
(`Talepleri Gör`, sahibinin isteği), Takvim'de siyah mürekkep hapı: aynı
uygulamada iki ayrı "birincil" dili. Sayfa eylemi artık her ekranda paletin
mavi `Button`ı, ikinciller `secondary` (Pano'nun "Tanıtım Turu" da hayaletten
ikincile geçti). `.pusula-ink` yalnız marka karosunda kaldı; `INK` sabiti silindi.

## Assetora Turu — Dönem Bantları, Kayıt Listesi, Filtre Çekmecesi, Tarih Filtresi (2026-11-16)

**Karar:** assetora.vercel.app'ten (tek sayfalık gayrimenkul paneli) dört
davranış alındı, hepsi token'la sıfırdan yazıldı:
`area-chart` → `bands` (kalıcı işaretli dönemler), `record-list` (tablonun
telefondaki kart hali), `filter-sheet` (sonuç sayılı filtre çekmecesi),
`date-range-presets` (hazır aralık + özel aralık tek kutuda). Pusula'da
Pano ciro grafiği (en iyi/en zayıf gün) ve Gelen Kutusu'nda (Geldi filtresi,
telefonda kart listesi ve filtre çekmecesi) gerçek veriyle çalışıyorlar.

- **Bant ayrı grafik değil `area-chart`ın özelliği:** ayrı dosya aynı
  çizimin ikinci kopyası olurdu.
- **Tarih filtresinde tek tetikleyici:** kaynakta hazır menü ve takvim iki
  ayrı butondu; ikisi aynı değeri değiştirdiği için "hangisi geçerli?"
  sorusu doğuyordu.
- **Filtre çekmecesinde seçim anında uygulanır,** ana buton yalnız kapatır;
  sayı gerçek kalır ("0" iken "Uyan Talep Yok").

*Alınmayanlar:* grafik çizgileri (kaynakta veri değil, tasarım aracından
dışa aktarılmış sabit SVG — veri dürüstlüğü), kenar çubuğu genişliğinin
animasyonu (`app-shell` bilerek yapmıyor), degradeli kabartma anahtar
(degrade disiplini).
*Strateji dersi:* kaynakta iki paralel token sistemi var ve koyu tema
tanımlı ama bağlı değil; örnek veride 2023 tarih seçicisi 2026 satışlarının
yanında. İkisi de "tek kaynak" ve tutarlı örnek veri kararlarımızı doğruluyor.
*Ne zaman değişir:* `record-list` + `filter-sheet` ikilisi üç projede aynı
kurulursa `data-table`a hazır "telefon modu" olarak birleşir.

## Storybook Kenar Çubuğu — Üç Bölüm, Anlamlı İkonlar, Türkçe Kabuk (2026-11-16)

**Karar:** Kenar çubuğu üç bölüme ayrıldı ve her bölüm küçük, soluk, Title
Case bir etiket taşıyor: **Başla** (Kapak, Başlangıç, Vitrin) · **Kütüphane**
(Tema, Bileşenler, Grafikler, Bloklar) · **Uygulamada** (Ekranlar, Örnek
Tasarım). Sıra `preview.tsx → storySort`, etiketler `manager-head.html`.

- Üst düzey dokuz öğenin her biri anlamını söyleyen tek çizgi ikon taşıyor
  (lucide, uygulamayla aynı aile; CSS maskesi, rengi paletle döner).
  Storybook'un düğüm türüne göre verdiği yer imi / klasör / ızgara karışıklığı
  kalktı; açma oku olmayan sayfalar ikon sütununa hizalandı.
- Bileşenler alt grupları temelden karmaşığa sıralı (Temel → … → Yapay Zekâ);
  önceden dosya sırasıyla rastgeleydi.
- Kabuk Türkçe: marka alt satırı "Görsel Katalog" (Inter; eşaralıklı küçük
  harf kod gibi okunuyordu), belge sayfaları "Belge" (yalnız görünen ad,
  adres `…--docs` kalır: README bağlantıları ve İngilizce adres denetimi
  bozulmaz), arama "Ara".
- Başlangıç sayfası Kapak'ın hemen altında; önceden Örnek Tasarım'ın
  arkasında kalıyordu.

*Bilinen sınır:* seçiciler Storybook'un resmi API'si değil (`data-item-id`,
`.sidebar-item`); SB yükseltmesinden sonra kenar çubuğu gözle denetlenir.
Yeni bir üst düzey bölüm eklenirse ikonu ve sırası iki dosyaya birden yazılır.

## Bildirimler Sayfası ve Kanal Tablosu (2026-11-16)

**Karar:** Pusula'ya zil kutusundan ayrı bir **Bildirimler** sayfası
(Yönetim grubunda) eklendi; yöntem Axon referansından (dil ve davranış).
Sekmeli (Tümü · Bahsedenler · Onaylar · Sistem) ve gün gün gruplu akış;
satırda işin kendisi (Onayla, Teklifi Aç, Yanıtla, Yeniden Bağla), ⋯
menüsünde okunma, erteleme, sessize alma; sağda Teslimat ve Ertelenenler;
Tercihler yan panelde (`sheet` → `icon`, `footerStart`) yeni `channel-matrix`
ile olay × kanal tablosu.

- **Sayılar uydurma değil:** onay isteği Ayarlar'daki %12 indirim sınırını
  aşan teklif, sistem uyarısı geciken sipariş sayısı, dosya alanı
  `WORKSPACE.storage`, haftalık özet panonun son 7 günü.
- **Tercih paneli taslakla çalışır:** Vazgeç ve kapatma taslağı atar,
  yalnız Kaydet uygular; Teslimat kartı kaydedileni gösterir. (İlk sürümde
  Vazgeç değişikliği bırakıyordu; play testi yeniden açıp denetliyor.)
- **Sütun kutusu üç durumlu,** kilitli satırı (Güvenlik) etkilemez.

### Değişti (2026-11-16) — Tek bildirim kaydı

İlk sürümde zil kutusu ve bu sayfa ayrı listeler tutuyordu (birinde
okunan ötekinde okunmamış görünüyordu). Kayıt uygulama düzeyine taşındı
(`_app.tsx` → `feed`): zil kutusu `toBell()` ile ondan türer, kenar çubuğu
rozeti canlı okunmamış sayısını gösterir, işlem bildirimleri ("Randevu
Oluşturuldu") da akışa düşer, ertelenenler sayfa değişince kaybolmaz. Eski
`notifications()` örnek verisi kaldırıldı. Play testi "Tümünü Okundu Say"
sonrası zilin sıfırlandığını denetliyor.

## Pusula Koyu Tema — Katman Merdiveni (2026-11-17)

**Karar:** Pusula'nın koyu temasına Solid Glass referansındaki katman
merdiveni alındı (ölçülen hedef: sayfa #0d0d0d → kart #1d1d1d → kart içi
#313131, kenar #2b2b2b). Yalnız ürün kökünde (`pusula.css`,
`[data-product="pusula"]`); kataloğun genel koyu teması değişmedi.

- Dört basamak: kabuk `#0c0c0d` (sayfa rengi) → içerik karosu `#121214`
  (`--pusula-tile`) → kart `#1c1c1e` (`--overlay`) → kart içi `#29292b`
  (`--surface`, beyazın %6'sı). Önceden kart ile içerik karosu aynı renkti,
  kartlar yalnız çizgiyle ayrışıyordu.
- Kenar çizgisi %8 → %10 beyaz (koyu zeminde erimesin).
- **Soluk metin `#8a8a8a` → `#949496`:** açılan kart içi zeminde 4,21:1'e
  düşüyordu (küçük metinde AA 4,5). Yeni değer karo 6,18 · kart 5,62 ·
  kart içi 4,80.
- Giriş alanları ve sekme yuvaları bilerek gömük kaldı (`--surface-sunken`):
  açılırsa seçili sekmenin karosu yuvadan koyu düşer, seçim tersine okunur.
- Referanstan ALINMAYAN: tamamen gri grafik (vurgu bilgisini siler),
  çok büyük köşe yarıçapları (yoğun ekranda yer kaplar), eşik altı soluk metin.

*Ne zaman değişir:* bu merdiven bir projede daha tutarsa genel koyu
temaya (`globals.css` → `--overlay`, `--surface`, `--line`) taşınır; o
zaman bütün kataloğun kontrastı yeniden ölçülür.

## Takvim — Kart Görünümü ve Bugün Paneli (2026-11-17)

**Karar:** `week-calendar` geriye uyumlu `variant="card"` aldı; Pusula
Takvim sayfası referanstaki düzene geçti: solda **Bugün** paneli (aralık
seçen ay takvimi, Yapılacaklar / Etkinlikler sekmeleri), sağda kart
görünümlü iş haftası; ikisi tek kartta.

- **Kart süreyle zenginleşir, eşikler piksel ölçüsüyle:** başlık + saat
  (≈52 px) → iki satır başlık (≈76) → ikon (≈108) → katılımcılar (≈140) →
  tam genişlikte "Görüşmeye Katıl" (≈172); daha kısa kartta eylem sağ üstte
  ikon butonu. Çakışan dar şeritte yalnız başlık ve saat. Başlık ve saat
  `shrink-0`: sabit boylu dikey düzende iki satıra kırpılan başlık sıfıra
  büzülüyordu (ilk denemede kartlar başlıksız göründü).
- **Tüm Gün satırı uydurma etkinlik değil:** Pusula'da "Son Tarih"
  etiketiyle ekip panosundaki bitmemiş işlerin son tarihleri (Görevler ile
  aynı kayıt). Yapılacaklar Ahmet'in görev listesinden, son tarihe göre
  gruplu (Bugün · Bu Hafta · Daha Sonra · Planlanmamış); grup açılır/kapanır,
  "+" ile o gruba iş eklenir.
- **İş haftası (`weekdaysOnly`):** hafta sonu boş; beş sütun kartları
  okunur genişliğe çıkarır. Izgara 09–17, saat 112 px.
- Emoji yerine tür ikonu (lucide; Görüşme, Teslimat, Numune, İç Toplantı).

## Hizalama Kuralı (2026-11-17)

**Karar:** Alt alta tekrar eden satırlarda aynı türden öğe (rozet, durum,
çip, sayı, eylem) her satırda aynı sütunda durur; kural
`rules/design-tokens.md` → "Hizalama Kuralı", ölçüm
`storybook/scripts/check-alignment.mjs` (`npm run check:align`).

İlk taramanın bulduğu ve düzeltilenler: Pano gecikme kartı "+N Gün"
(34 px kayma → rozet kendi sütununda), Görevler son tarih çipi (16 px →
öncelik çipi `min-w-18`, `task-list.tsx`), Gelen Kutusu telefon kart listesi
durum rozeti (59 px → öncelik rozeti `min-w-18`).

*Ölçüm dersleri:* (1) Denetim ilk sürümde sayfa hiç çizilmediğinde de
"hizalı" diyordu; artık h1 yoksa HATA. (2) Sınıf adına göre gruplamak farklı
sütunlardaki aynı renkli rozetleri karıştırıyordu; gruplama yapısal yola
göre. (3) Serbest etiket akışı (aynı biçimde çipler art arda) muaf. Betik
eski hatayı geri koyunca yakaladığı doğrulandı.

## Paylaşım, Bağlantı Başlığı, Tik Ölçek (2026-11-17)

**Karar:** Dört referanstan üçü uygulandı (dil ve davranış):

- **`share-panel`** (yeni): bağlantı + kopyala, kitle düzeyinde erişim
  satırları (ekip / bağlantıya sahip herkes) aç/kapa; satırın tamamı
  anahtarın etiketi. Pusula Raporlar → Hazır Raporlar → Paylaş: önizleme
  kartı gömük sahnede, erişim rapor başına tutulur.
- **`connection-hero`** (yeni): iki uygulama karosu, aralarında DURUM
  söyleyen üç nokta (bağlı değil / bağlanıyor / bağlandı / hata), arkada
  `mesh-gradient`. Pusula Bildirimler → "Yeniden Bağla" artık önce izinleri
  gösteren pencere açar, sonra bağlar.
- **`meter` → `look="ticks"`, `series`:** ince (4 px sabit) sık tikler;
  kategori kırılımı. Pusula: Ayarlar → Dosya Alanı (kategoriye göre), Raporlar
  → Ekip Yükü. İlk sürümde tikler alanı bölüşüp 8 px'e kalınlaşıyordu.

*Alınmayan:* plan ve fiyat kartları — tanıtım şablonunda zaten var
(`PricingPlans`); referanstaki çizim maskotlar alınmadı (görsel kopyalanmaz).

## Dissolve, Allo, x6sense Turu + Gecikme Kartı (2026-11-17)

**Alınanlar (dil ve davranış, kod değil):**
- **`dissolve`** (yeni): onaylanmış kaldırmada öğe tanecik tanecik dağılır.
  Kaynak (dissolve.rselmi.com) her bileşeni kanvasa elle yeniden çiziyordu;
  genellenemez. Bizde gerçek öğeye `feTurbulence` → alfa maskesi, eşik
  zamanla kayar; hareket azaltmada ve filtre desteklenmezse solma.
  Pusula: Bildirimler → Bu Konuyu Sessize Al.
- **`quick-poll`** (yeni, Allo): sonuç oy verince görünür (sürü etkisi
  yok), kendi seçimine yeniden basmak geri alır; `aria-pressed` butonlar.
  Pusula: Görevler → Ekip Kararı (panodaki fiyat listesi işine bağlı,
  seçenekler %12 indirim sınırıyla tutarlı).
- **`date-calendar` → `markedDates`** (Allo): etkinlik günü noktası.
- **`chat-composer` → `look="halo"`** (x6sense): boş başlangıç ekranında
  hale çerçevesi; degrade kenar yerine düz ton (degrade disiplini).

**Alınmayanlar:** tutar tuş takımı, kayan vitrin rafı, etiket anahtarı,
seçilebilir avatar grubu (Pusula'da yeri yok ya da küçük getiri); kayan
yazma kutusu, medya karosu, bölüm kartı (x6sense: Pusula'nın işi değil);
ember/vortex/goo gibi dekoratif tanecik efektleri, ses, çizimler, yazı
tipleri (amacı tek cümleyle söylenemeyen hareket, varlık kopyalama).

**Gecikme kartı (sahibinin isteği):** "3" başlığın üstünde tek başına
duruyordu; artık başlık ne olduğunu söylüyor ("Teslim Tarihi Geçen
Siparişler"), sayı birimiyle aynı satırda ("3 sipariş"), altında en uzun
gecikme ve bekleyen tutar. Satır düzeni ekran değil KART genişliğine göre
(container query): 1024 px'te müşteri adı kayboluyor, "+N Gün" iki satıra
kırılıyordu. Rozetler 1440/1280/1024/768/390'da ölçüyle aynı hizada.

## Katalog Haritası, Kenar Çubuğu ve Pusula Tutarlılığı (2026-11-17)

**Bağlam:** Sahibi: "sol menü ve ekranlar tutarlı değil, bazı fonksiyonlar
saçma duruyor, ilk ekranda her şeyin olduğu güzel bir ekranda karşılayalım,
mavi heroda butonlar çok kötü duruyor, kullanımı kolay değil".

**Karar:**
- **Kenar çubuğu:** "Örnek Tasarım" klasörü kalktı; her öğe kendi adıyla üst
  düzeyde. Başla (Kapak, Başlangıç, Vitrin, Her Şey Bir Arada) · Kütüphane
  (Tema, Bileşenler, Grafikler, Bloklar, Desenler) · Uygulamada (Pusula,
  Ekranlar, Arşiv: Bileşen Kapsamı + Referanslar). Adresler (`id`) değişmedi;
  yalnız başlıklar taşındı, eski bağlantılar çalışır. Yanlış raftaki sekiz
  bileşen yerine taşındı (Avatar, Rozet, Ayırıcı → Temel; Bölmeli Seçici,
  Aç-Kapa Grubu → Seçim; Dosya Bırakma → Form; Kod Bloğu → Veri; Duyuru →
  Geri Bildirim). Açılış sayfası üst bölüm varyantları Türkçe adlandı.
  Geliştirme sunucusundaki "+" (yeni hikâye) ve "Show modified stories"
  gizlendi: kataloğu gezen kişiye anlamsız.
- **Kapak = katalog haritası:** ilk ekranın sağ yarısı kenar çubuğunun üç
  bölümü ve on bir kapısı; her satır ne içerdiğini ve kaç parça olduğunu
  söyler. Sayılar ve bağlantılar hikâye dosyalarından sayılır
  (`stories/kapak/_harita.ts`; 779 hikâye adresinin hepsi Storybook'un
  kuralıyla doğru türetildi). Solda kabuğun aramasını açan arama kutusu.
  Altında on üç bileşen rafı (ad, sayı, içindeki ilk parçalar). Numune föyü
  palet bölümüne indi; dört sayaç kalktı (harita aynı bilgiyi veriyor).
- **Pusula tanıtım kahramanı:** zemin degrade ya da `bg-primary` değil,
  koyulaştırılmış birincil (`.pusula-hero`, 10 palette iki temada beyaz ≥
  5,5:1 ölçüldü); birincil eylem beyaz hap, ikincil "Demoyu Gör" gerçekten
  demoya iner. Basılmayan plan hapı kalktı, yerine demoya inen cam duyuru
  bağlantısı. Sabit duyuru destesi bölüm başlığının yanına (başlığa
  biniyordu). `mistakes.md #121`.
- **Görevler:** pano kartına basınca hiçbir şey olmuyordu; `kanban-board` →
  `onCardOpen` (5 piksel eşiğin altındaki tık ve Enter; Boşluk taşımada
  kalır). Pusula'da ayrıntı paneli: sorumlu, son tarih, etiketler; oradan
  sonraki kolona taşı ya da tamamla. "Yaklaşan Son Tarihler" satırları da
  aynı paneli açar.
- **Odak halkası:** play'in son tıkladığı öğe odakta kalıyordu (kenar
  çubuğunda "Pano" halkalı açılıyordu); `settle` açık pencere dışındaki
  odağı bırakır.
- **Her Şey Bir Arada:** son turlarda eklenen 12 bileşen bu sayfaya hiç
  girmemişti, kapsam testi 129/141'de kırıktı (`mistakes.md #120`);
  `amiral/_ekler.tsx`te kendi gruplarına kuyu olarak girdi.

**Denetim:** her Pusula sayfasında bütün buton ve bağlantılara tek tek
basıldı, etkisi olmayan arandı; gerçek ölü öğe yalnız kanban kartıydı (geri
kalan işaretler zaten seçili seçenek ya da aynı sayfaya bağlantı).

**Alternatifler:** Pusula'nın 15 hikâyesini sayfa klasörlerine bölmek
(derinlik bir tık artar, reddedildi); kapakta hikâye listesini çalışma
anında `index.json`dan okumak (ilk çizimde sayılar boş gelip zıplar;
derleme anında ham metinden sayım seçildi).

### Giriş Ekranı: Şifresiz, İki Sütun (2026-11-17)

Sahibi: "Giriş Yap gerçekten giriş gibi çalışıp şifre kaydetmeyi soruyor; burası
için gerek yok, giriş ekranı en iyi seviyeye gelsin". Pusula girişi artık iki
şifresiz yol: bu cihazda kayıtlı hesap (Avatar + ad + e-posta, tek dokunuş) ve
e-postaya giriş bağlantısı (`auth-card` → `method="link"`, kütüphaneye eklendi:
`sentTo`, `sentNote`, `sentAction`; panel başlığı odak alır, "Başka Adres
Kullan" forma döner). Geniş ekranda sağda ürünün renkli paneli
(`.pusula-hero`): bugün bekleyen talep sayısı, en acil üç talep, müşteri
şeridi; şeridin "Durdur" butonu renkli zeminde okunur hale getirildi.
"Şifreli Bağlantı Kuruldu" büyük harf mono künyesi kalktı (`mistakes.md #115`
dili). `mistakes.md #122`.

### Tasarım Denetimi Turu (2026-11-17)

`design-reviewer` 13 hikâyeyi 3 genişlik × 2 temada ölçtü (78 ekran;
`docs/review/storybook-2026-11-17.md`, sonunda bulgu bulgu durum). Kararlar:
- **Ara genişlik (1024) bir kırılım:** Pusula'da yan paneller (Gelen
  Kutusu'nun klasör ağacı, Takvim'in Bugün paneli) yalnız `xl`de yanda; daha
  darda ağaç araç çubuğunda seçici, Bugün paneli haftanın üstünde iki sütun.
  Kanal sütunu 1280 altında kapalı başlar (Görünüm menüsünden açılır).
- **Paylaşılan durum uygulamada:** ekip panosu (`board`) uygulama bağlamına
  taşındı; rozet, başlık ve pano tek sayı, sayfa değişince iş kaybolmaz.
- **Bekleme soldurmaz:** yüklenen buton `opacity` ile solunca beyaz metin
  2,2:1'e iniyordu; `auth-card` beklemede tam opak, örnekler `aria-busy`.
- **Renkli zemindeki hap beyaz dolgulu:** yarı saydam beyaz hap mavi zemini
  açıp metni 3,5:1'e düşürüyordu.
- **Dokunma hedefi kalıbı:** `min-h-11 pointer-fine:min-h-9` (ya da
  `size-11 pointer-fine:size-8`); bu turda Pusula sayfaları ve `toc-nav`.
  Kalan bileşenler raporda "Açık".

## Tanıtım Sayfası, Paylaşım Önizlemesi, Terimler, Huni (2026-11-18)

**Bağlam:** Sahibi: "Kapak'a Tanıtım diyelim, çok daha gösterişli ve premium
olsun; palet bölümünde sağ sol dengesi yok; WhatsApp/X önizlemeleri; butona
düğme demek kesinlikle yasak; grafik renkleri mantıklı mı; web hunisini
bilemedim; referanslarda görseli olmayanlara görsel".

**Karar:**
- **Tanıtım (eski Kapak):** adres aynı (`cover--overview`). İlk ekran ortalı
  başlık + eylemler + arama, altında GERÇEK bileşenlerden çalışan kolaj
  (sahte ekran görüntüsü yok). Harita kendi bölümünde üç eşit sütun; raflar
  15 (Grafikler ve Bloklar eklendi: üçlü ızgarada son satır tek kalmıyordu);
  "Dört Sayfada Katalog" haritayı tekrarladığı için kalktı. Palet bölümü iki
  eşit sütun, aynı çerçeve ve boy; "seçili" etiketi panelin başlığında.
- **Paylaşım önizlemesi:** `manager-head.html`de Open Graph + X kartı (mutlak
  adres), `public/og.png` (1200 × 630) Tanıtım kolajından `npm run og` ile
  üretilir (`scripts/build-og.mjs`); iOS ikonu; derleme sonrası başlık
  "dev-starter · Görsel Katalog" (`scripts/seo-head.mjs`).
- **Yazılım Türkçesi:** "düğme" yerine **buton** (393 dosya, ek uyumuyla),
  "süzgeç" yerine **filtre**, "simge" yerine **ikon**. `guides/05` § 6
  tablosu; `slop-scan.sh` "düğme"yi YÜKSEK bulgu sayar.
- **Grafik renk anlamı:** seri 1 = bu dönem / ana ölçü, seri 2 = önceki
  dönem (paletin yıkanmış tonu), kanal renkleri `CHANNEL_SERIES`ten her
  grafikte aynı. Memnuniyet grafiğinde "Bu Dönem" 2, "Önceki Dönem" turuncu
  idi; düzeldi. Aynı ölçünün adımları (huni, aşama çubukları) TEK renk:
  her aşamaya ayrı renk kategori gibi okunuyordu.
- **Huni:** her sütunun üstünde aşama adı ve değeri, altında bir önceki
  adıma göre dönüşüm (→ %28); bir önceki aşamanın soluk izi kaybı gösterir;
  lejant varsayılan kapalı. Pusula'da kart adı "Web Mağaza Hunisi ·
  Ziyaretten Siparişe" (eski "Mağaza Dönüşümü" neyi ölçtüğünü söylemiyordu).
- **Referanslar:** görseli olmayan kart baş harf yerine sitenin / GitHub
  deposunun paylaşım görseli, kendi projelerimizde ahmetakyapi.com ekran
  görüntüsü; hiçbiri yoksa bölümüne göre kapak (ikon, desen, ad). Başlıkta
  arşivin kendi kapaklarından mozaik; Şerit / Izgara görünümü.

**Alternatifler:** paylaşım görselini elle çizmek (bayatlar; kolajdan
üretmek seçildi); huniyi logaritmik ölçekle çizmek (küçük aşamayı büyütür,
yanıltır; doğrusal + en az %6 + yazılı sayı kaldı).

### Metin Denetimi, Kurgu Adları, Menü (2026-11-18)

Sahibi: "Kavurmaya Al yemek gibi duruyor; şirket isimleri tutarlı, kurumsal
olsun; komik ya da başka anlam getiren şeyleri düzeltelim; sol menünün düzeni
en iyi mi?". `content-editor` 779 hikâyeyi taradı (59 bulgu,
`docs/review/metin-denetimi-2026-11-18.md`); hepsi uygulandı.
- **Kahve kurgusu (Kıyı Kahve):** tek başına "kavurma" yemek gibi okunuyordu;
  "kavrum" da gündelik değil. Paketlerde gerçekten geçen terimler: kavrulma
  derecesi / tarihi, kavurucu (makine ve ekip), **lot** (bir seferde
  kavrulan çekirdek; "parti" eğlence ya da siyaset çağrışımı yapıyordu).
  Marka her yerde "Kıyı Kahve", alan adı kiyikahve.com.tr; tedarikçi ve
  müşteri listeleri ayrıldı.
- **Pusula:** ürün ile onu kullanan şirket ayrıldı. Ürün **Pusula**
  (`PRODUCT`), şirket **Lidya Tekstil A.Ş.** (Denizli, otel ve mağazalara
  ev tekstili); e-postalar `@lidyatekstil.com.tr`, çalışma alanı
  `lidya.pusula.app`. Talep numaraları her yerde `PSL-…`.
- **Ad havuzu:** "Atlas" yalnız Pusula'nın müşterisinde; asistan modeli
  "Fable 4"; Acme → Ata Lojistik; gerçek banka adı (Garanti BBVA) hata
  senaryosundan çıktı. Aynı kurguda bir kişi iki soyadla geçmez, ekip
  üyesi kendi şirketine müşteri olmaz.
- **Birebir çeviri kokanlar:** kod dondurma → Kod Kilidi, kıl çizgi → ince
  çizgi, yıkama → zemin, bilet → talep, senkron → eşitleme, Hale → Işık
  Halkası, Bento Izgara → Bento Düzeni, "Kişisine Atandı" → "Atandı: …".
- **Menü:** Bileşenler'deki "Tanıtım" rafı en üstteki Tanıtım sayfasıyla
  aynı adı taşıyordu → **Pazarlama**. Başla'da amiral "Her Şey Bir Arada",
  "Vitrin"den önce.
  - **Değişti (2026-11-18):** raf adı yeniden **Tanıtım**. Sahibi "Pazarlama"yı
    sevmedi; raf ziyaretçiye ürünü tanıtan açılış sayfası parçalarını tutuyor,
    "Tanıtım" işi daha doğru söylüyor. Ad çakışması bölüm yoluyla ayrılıyor
    (Başla/Tanıtım sayfa, Bileşenler/Tanıtım raf).
- **Seçim çubuğu:** siyah ters ada → beyaz yükselen ada (gölge + çerçeve),
  yıkıcı eylem açık zeminde koyu kırmızı. Siyah dolgu ekranın en ağır öğesi
  oluyordu (#115 ile aynı itiraz).

