# 07 — Veri, Giriş ve Güvenlik

Depoların bir kısmı herkese açık ve hepsi Vercel'de sunucusuz çalışıyor. Bu
iki gerçek her kararı belirler: kodda sır olmaz, bağlantı havuzu
fonksiyonlar arasında paylaşılmaz, ve "kimse bu uca istek atmaz" diye bir
varsayım yapılmaz.

---

## 1. Neon + Drizzle

```ts
// lib/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: NeonHttpDatabase<typeof schema> | undefined;

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  return drizzle(neon(url), { schema });
}

/** Tembel: modül yüklenirken değil, ilk sorguda bağlanır. */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_t, prop) {
    instance ??= connect();
    return Reflect.get(instance, prop, instance);
  },
});
```

- **`pg` / `pg-pool` yok.** Sunucusuz ortamda her çağrı yeni bağlantı açar,
  havuz tükenir (`mistakes.md` #5). `neon-http` tek HTTP isteğiyle sorgular.
- **Neden tembel:** `DATABASE_URL` olmadan da `next build` ve veritabanısız
  sayfalar çalışsın. Hata yalnızca sorgu anında, açık bir mesajla.
- Etkileşimli işlem (transaction) gerekiyorsa `neon-http` yetmez:
  `drizzle-orm/neon-serverless` + `Pool`, yalnızca o kod yolunda.
- Kimlik bilgisi olmadan yerel geliştirme istiyorsan ElevenForge deseni:
  `DATABASE_URL` yoksa `@electric-sql/pglite` (WASM Postgres, dosyaya yazar).
  Şema aynı, geliştirme ile üretim arasında fark yok.

### Migration Deploy'da Uygulanmaz

```bash
npm run db:generate   # şema değişti → YENİ migration dosyası
npm run db:migrate    # üretim DATABASE_URL'iyle, AYRICA
```

Vercel build'i migration çalıştırmaz. Sonuç: **canlıdaki kod migration'dan
önce yayına inebilir.** Bu yüzden:

✅ Yeni özellik kendi tablosunu alır; okuyan kod tablo yokken sessizce düşer:

```ts
export async function getUserAvatar(userId: string) {
  try {
    const [row] = await db.select().from(userAvatars).where(eq(userAvatars.userId, userId));
    return row ?? null;
  } catch {
    return null;   // tablo henüz yok: varsayılan avatar
  }
}
```

❌ `users` tablosuna sütun eklemek: migration inene kadar her kullanıcı
sorgusu ve giriş kırılır.

Açılış Zili'nde (26 Eylül) profil ikonları "kaydedilemiyor" diye bildirildi;
sebep uygulanmamış bir migration'dı. Migration'ı uygulamak deploy
kontrol listesinin bir maddesidir (08).

- Eski migration dosyası **asla düzenlenmez**; her değişiklik yeni dosya
  (`mistakes.md` #25).
- Drizzle'da geri alma yok; tehlikeli migration'ın ters SQL'ini önceden
  yaz (`mistakes.md` #34).

### Her FK'de `onDelete`

```ts
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
});
```

Yazılmazsa varsayılan `no action`: kullanıcı silinemez ve "hesabımı sil"
düğmesi veritabanı hatası verir. Her ilişki için karar ver: sahibi gidince
çocuk gider mi (`cascade`), boşa mı düşer (`set null`), silme engellenir mi
(`restrict`).

---

## 2. Ortam Değişkenleri: zod

```ts
// lib/env.ts
import { z } from "zod";

const empty = (v: unknown) => (v === "" ? undefined : v);   // boş dize = tanımsız

const server = z.object({
  DATABASE_URL: z.preprocess(empty, z.string().url().optional()),
  AUTH_SECRET: z.preprocess(empty, z.string().min(32).optional()),
  CRON_SECRET: z.preprocess(empty, z.string().min(16).optional()),
});

const client = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(empty, z.string().url().optional()),
});

const skip = process.env.SKIP_ENV_VALIDATION === "1";

export const env = skip
  ? (process.env as unknown as z.infer<typeof server> & z.infer<typeof client>)
  : { ...server.parse(process.env), ...client.parse({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }) };
```

- İstemci değişkenleri **tek tek** okunur: Next yalnızca kaynakta adı geçen
  `NEXT_PUBLIC_*` değerini pakete gömer; `process.env`i bütün olarak
  geçirmek istemcide boş nesne verir.
- Sunucu şeması istemci koduna import edilmez.

---

## 3. next-auth v5

```ts
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/giris" },
  providers: [
    Credentials({
      authorize: async (credentials, request) => {
        if (!rateLimit(await signInKey(request), SIGN_IN_LIMIT, WINDOW_MS).allowed) return null; // 1
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await findUser(parsed.data.identifier);
        if (!user) {
          await compare(parsed.data.password, DUMMY_HASH);   // 2
          return null;
        }
        return (await compare(parsed.data.password, user.passwordHash)) ? toSessionUser(user) : null;
      },
    }),
  ],
});
```

1. **Hız sınırı `authorize` içinde, formda değil.** Auth.js
   `POST /api/auth/callback/credentials` ucunu dışa açar; form action'ındaki
   bir sayaç bu uç çağrılarak atlanır. Sayaç iki yolun da geçtiği tek
   noktada, bcrypt'ten ÖNCE (bcrypt maliyeti tam olarak saldırganın
   tüketmek istediği kaynak). Açılış Zili.
2. **Bulunmayan kullanıcıda sahte hash.** Kullanıcı yoksa hemen dönmek,
   varsa cost 12 bcrypt çalıştırmak: aradaki ~216 ms fark tek istekle
   okunur ve kayıtlı kullanıcı adlarını ele verir (zamanlama orakülü).
   `DUMMY_HASH` sır değildir; rastgele bir dizenin hash'i.
3. **Hesap bazlı kilit yok.** Kullanıcı adına sayaç, o adı bilen herkese
   "istediğin hesabı kilitle" imkânı verir. Sınır IP başına.
4. **Veritabanı hatası "şifre hatalı" değildir.** Sorgu hatasını ayrı bir
   işaretle fırlat; yoksa kullanıcıya "kullanıcı adı veya şifre hatalı"
   denir ve şifresini değiştirmeye çalışır.
5. JWT stratejisi: oturum tablosu yok, her istekte veritabanına gidilmez.
   Yetki değişikliği (rol, silinmiş hesap) bir sonraki doğrulamaya kadar
   gecikir; hassas action'da kullanıcıyı veritabanından yeniden oku.

Tek bir yönetici varsa (kişisel panel) next-auth fazladır: HMAC imzalı bir
çerez yeter (Mimio). Birden çok kullanıcı ve OAuth varsa next-auth.

---

## 4. `checkBearer` — Cron ve Rutin Uçları

```ts
// lib/api-auth.ts
import { timingSafeEqual } from "node:crypto";

export function checkBearer(request: Request, secret: string | undefined) {
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return { ok: true } as const;
    return { ok: false, status: 503, error: "secret-not-configured" } as const;
  }
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return { ok: false, status: 401, error: "unauthorized" } as const;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b)
    ? ({ ok: true } as const)
    : ({ ok: false, status: 401, error: "unauthorized" } as const);
}
```

- **Üretimde sır yoksa 503, açık değil.** Açılış Zili'nin cron ucu
  `if (secret && auth !== ...)` diye yazılmıştı: `CRON_SECRET` tanımsızken
  koşul hiç çalışmıyor, veritabanına yazan uç herkese açık kalıyordu.
- `===` ilk farklı karakterde döner; `timingSafeEqual` sabit sürelidir.

---

## 5. Güvenlik Başlıkları ve CSP Kararı

```ts
// next.config.ts
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};
```

**Tam CSP bilinçli olarak yok.** Next'in satır içi betikleri yüzünden
`script-src` ancak her istekte üretilen bir nonce ile sıkı yazılabilir; nonce
da her sayfayı dinamik yapar. `'unsafe-inline'` içeren yarım bir CSP güvenlik
vaat eder ama sağlamaz. Karar: **ya nonce'lu tam CSP ya hiç** (yalnızca
`frame-ancestors`). ahmetakyapi.com tam CSP taşıyan tek projedir; bir
projeye eklemeden önce onun `next.config`ine bak.

Çerçevelenmesi gereken tek yol varsa (Açılış Zili `/gomulu/*`) istisna
`next.config`te, gerekçesiyle, yalnızca o önek için.

---

## 6. Hız Sınırı ve Sınırları

```ts
// lib/rate-limit.ts — bellek içi
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 } as const;
  }
  b.count += 1;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count) } as const;
}
```

**Sınırlaması yoruma yazılır:** bellek içi sayaç her sunucusuz örnekte
ayrıdır; soğuk başlangıçta sıfırlanır, paralel örnekler arasında
paylaşılmaz. Kaba kuvveti yavaşlatır, durdurmaz. Gerçek koruma gerekiyorsa
Upstash Redis (keskealsaydim) ya da Vercel Firewall kuralı.

---

## 7. Dosya Yükleme

```ts
const ALLOWED = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 2 * 1024 * 1024;

if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) return { ok: false, error: "invalid-file" } as const;
const ext = ALLOWED.get(file.type);
await put(`avatars/${userId}/${crypto.randomUUID()}.${ext}`, file, { access: "public" });
```

- **İzin listesi**, yasak listesi değil. SVG listede yok: içinde betik taşıyabilir.
- Dosya adı istemciden alınmaz; uzantı MIME'dan, ad rastgele.
- `file.type` istemcinin beyanıdır; kritikse ilk baytlara bak (sihirli sayı).
- Vercel görsel optimizasyonu kotalıdır; aşılınca `/_next/image` 402 döner
  ve görseller kırılır. Kullanıcı görselleri yoğunsa `images.unoptimized: true`
  ya da kaynağında boyutlandırılmış dosya.

---

## 8. JSON-LD Kaçışı

```tsx
✅ <script type="application/ld+json"
     dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
❌ <script type="application/ld+json">{JSON.stringify(data)}</script>
```

Veride `</script>` geçen bir başlık (kullanıcı adı, yorum) betik bloğunu
kapatıp sayfaya HTML enjekte eder. `<` kaçışı bunu kapatır (simayahi).

---

## 9. Herkese Açık Depo

- `.env*` gitignore'da, `.env.example` değersiz.
- Gerçek değer taşıyan yerel belge `*.local.md` deseniyle gitignore'da.
- Commit öncesi staged fark taranır: sır, `console.log`, geçici işaret (TODO,
  TMP) var mı? Ekosistemin `hooks/quality-scan.sh`i bunu yapar.
- Sızan bir sır silinerek değil **yenisiyle değiştirilerek** temizlenir; git
  geçmişi kalıcıdır.

---

## Kontrol Listesi

- [ ] `@neondatabase/serverless`, tembel `db`
- [ ] Yeni özellik kendi tablosunda, okuyan kod tablo yokken düşüyor
- [ ] Her FK'de `onDelete`
- [ ] `lib/env.ts` boş dizeyi tanımsız sayıyor
- [ ] Hız sınırı `authorize` içinde, sahte hash bulunmayan kullanıcıda
- [ ] Korunan her uç `checkBearer`, üretimde sır yoksa 503
- [ ] Güvenlik başlıkları, CSP kararı yorumda
- [ ] Yükleme MIME izin listesiyle, JSON-LD `<` kaçışlı
