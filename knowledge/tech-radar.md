# Teknoloji Radarı — İhtiyaç → Seçim

`strategist` ajanı ve `/kickoff` buradan önerir. Amaç: aynı ihtiyaca her
projede başka bir kütüphaneyle cevap verip ekosistemi dağıtmamak.

**Okuma:** Her satırda bir **varsayılan** var. Ondan sapmak serbest, ama
sapmanın gerekçesi projenin `docs/KICKOFF.md` → "Teknoloji Kararları"
bölümüne yazılır. Fiyatlar, ücretsiz kotalar ve sürümler değişir: ajan bir
satırı önermeden önce güncel durumu web'den teyit eder, bu dosyayı kesin
kaynak saymaz.

Halkalar:
- **Benimse:** ekosistemde en az bir canlı projede denendi, varsayılan.
- **Dene:** mantıklı, ama henüz bizde canlıda yok. İlk kullanan proje
  dersini `mistakes.md` / `patterns.md`'ye yazar.
- **Bekle:** bilinçli olarak seçmiyoruz; gerekçesi satırda.

Son gözden geçirme: 2026-10-03

---

## Çekirdek (her projede)

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Framework | Next.js 16 App Router | Benimse | Tamamen statik, JS'siz bir sayfa için Astro düşünülebilir; ama ekosistem tek framework'te kalınca bilgi birikiyor. |
| Dil | TypeScript `strict` | Benimse | — |
| Stil | Tailwind CSS v4 (`@theme`) | Benimse | CSS-in-JS yok. |
| Hareket | `motion` (`motion/react`, LazyMotion) | Benimse | Basit giriş ve hover'lar CSS'te kalır. GSAP yalnızca zaman çizelgesi/scroll sahnesi ağır bir tanıtım sayfasında, bilinçli seçimle. |
| İkon | lucide-react | Benimse | Projede başka bir set kuruluysa (Açılış Zili: Phosphor) o kalır, karıştırılmaz. |
| Veritabanı | Neon Postgres (serverless) | Benimse | Kimlik bilgisi olmadan yerel geliştirme için PGlite yedeği (ElevenForge deseni). |
| ORM | Drizzle | Benimse | Prisma yalnızca zaten kullanan projede. |
| Doğrulama | zod 4 | Benimse | Env, form, API gövdesi, aynı şema. |
| Barındırma | Vercel | Benimse | Uzun süren iş, WebSocket sunucusu ya da kalıcı disk gerekiyorsa VPS/Fly/Railway (Açılış Zili VPS'te). |
| Paket yöneticisi | npm | Benimse | — |

## Kimlik ve Kullanıcı

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Kullanıcı hesabı | next-auth v5 (Auth.js), JWT | Benimse | Rate limit `authorize` içinde, bulunmayan kullanıcıda sahte hash. |
| Tek yönetici paneli | HMAC imzalı çerez (kütüphanesiz) | Benimse | Portfolyo ve Mimio böyle. Kullanıcı tablosu gerekmiyorsa next-auth fazlalık. |
| Sosyal giriş | Auth.js sağlayıcıları (Google, GitHub) | Benimse | Türkiye'deki geniş kitle için Google yeterli; Apple yalnızca iOS uygulaması varsa. |
| Hazır kimlik servisi | Clerk | Bekle | Hızlı ama kullanıcı başı ücret ve veri dışarıda; ekosistem Auth.js'te birikiyor. |

## Veri ve Arka Plan

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Zamanlanmış iş | Vercel Cron → korumalı API ucu (`checkBearer`) | Benimse | Uç 503 döner, secret yoksa açık kalmaz. |
| Uzun / adımlı iş | Inngest ya da Trigger.dev | Dene | Vercel fonksiyon süresini aşan işler, tekrar denemeli akışlar. |
| Önbellek | React `cache()` + `unstable_cache` | Benimse | Hata önbelleğin DIŞINDA yakalanır. Dağıtık önbellek gerekirse Upstash Redis. |
| Dağıtık rate limit | Upstash Ratelimit | Dene | Bellek içi sınır serverless'ta örnek başınadır; gerçek koruma gerekiyorsa bu. |
| Dosya yükleme | Vercel Blob | Benimse | MIME allowlist, SVG reddi, sunucuda yeniden boyutlandırma (sharp, webp). |
| Arama (küçük veri) | Postgres `ILIKE` + `pg_trgm` | Benimse | Birkaç bin satıra kadar ayrı servis gereksiz. |
| Arama (büyük / anlık) | Meilisearch ya da Typesense | Dene | Yazım hatası toleransı ve facet gerektiğinde. |
| Gerçek zamanlı | Socket.io (VPS) ya da Ably / Pusher (serverless) | Benimse / Dene | Dungeon Mates socket.io kullanıyor. Vercel'de kalıcı WebSocket yok, yönetilen servis gerekir. |

## İletişim

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| İşlem e-postası | Resend + React Email | Dene | Doğrulama, şifre sıfırlama, bildirim. |
| Bülten / toplu e-posta | Resend Broadcasts ya da Buttondown | Dene | KVKK açık rıza metni şart. |
| Push bildirim | Web Push (VAPID) | Dene | PWA yüklü değilse iOS'ta çalışmaz; beklentiyi buna göre kur. |

## Para

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Türkiye'de ödeme | iyzico | Dene | TL, taksit, yerel kart. Stripe Türkiye'deki şirkete doğrudan hesap açmıyor; güncel durumu teyit et. |
| Yurt dışı ödeme / abonelik | Stripe | Dene | Yurt dışı şirket ya da Stripe Atlas gerekir. |
| Vergi dahil satış (yurt dışı) | Lemon Squeezy ya da Paddle | Dene | Satıcı kayıtlı (MoR) olur, KDV yükünü alır. |

## Yapay Zekâ

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Metin üretimi / analiz | Claude API (`@anthropic-ai/sdk`) | Benimse | Açılış Zili'nde canlı. Model kimliği ve fiyat için `claude-api` skill'ini yükle, ezberden yazma. |
| Sohbet arayüzü / akış | Vercel AI SDK ya da doğrudan SDK akışı | Dene | Tek sağlayıcıysa doğrudan SDK yeter. |
| Ajan arayüzü (araç çağrısı UI'ı) | AG-UI + CopilotKit (`templates/agentic-chat`) | Dene | Kurallar `rules/agentic-ui.md`. |
| Vektör arama | pgvector (Neon) | Dene | Ayrı vektör veritabanı ancak milyonlarca kayıtta. |
| Yapay zekâ çıktısını yayımlamak | Önce doğrulama şeması, sonra yazma | Benimse | Açılış Zili `lib/content-write.ts`: tek yazma yolu, sürüm fotoğrafı. |

## İçerik, SEO, Ölçüm

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Blog / rehber | Depoda TS ya da MDX dosyası | Benimse | Yazar tek kişiyse CMS gereksiz. Birden fazla editör varsa veritabanı + panel (Açılış Zili mercek). |
| Başsız CMS | Sanity ya da Payload | Bekle | Müşteri kendi içeriğini girecekse yeniden değerlendir. |
| Çok dil | Kendi sözlüğümüz (`const en: typeof tr`) | Benimse | Eksik anahtar derlemeyi kırar. next-intl yalnızca çoğul/tarih kuralları ağırsa. |
| OG görseli | `opengraph-image.tsx` + tek `OgFrame` şablonu | Benimse | Satori CSS değişkeni çözmez, sabit palet. |
| Analitik | Vercel Analytics | Benimse | Çerezsiz; KVKK banner'ı gerekmez. Ürün analitiği (huni, kohort) gerekiyorsa PostHog. |
| Hata izleme | `instrumentation.ts` → `onRequestError` | Benimse | Trafik büyüyünce Sentry. |
| Uptime | Better Stack ya da UptimeRobot | Dene | Ücretsiz katman yeter. |

## Arayüz Parçaları

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Erişilebilir primitive (dialog, popover, menü) | Radix UI ya da Base UI | Dene | Kendi dialog'umuzu yazmak yerine; stil yine token'la. |
| Grafik | Kendi SVG'miz → karmaşıksa Recharts, finansalsa lightweight-charts | Benimse | Açılış Zili lightweight-charts. |
| Tablo | Kendi tablomuz → çok ağırsa TanStack Table | Benimse | — |
| Tarih seçici | react-day-picker | Benimse | — |
| Harita | MapLibre GL | Dene | Mapbox lisansı ücretli. |
| 3B | React Three Fiber v9 (React 19) | Dene | `dynamic(..., { ssr: false })`; mobilde fallback zorunlu. |

## Mobil

| İhtiyaç | Varsayılan | Halka | Not / ne zaman değil |
|---|---|---|---|
| Kurulabilir uygulama | PWA (manifest + maskable ikon) | Benimse | Mağaza gerekmiyorsa yeter. |
| Mağaza uygulaması | Expo (React Native) | Dene | Kodun bir kısmı paylaşılır, arayüz ayrı yazılır. |
