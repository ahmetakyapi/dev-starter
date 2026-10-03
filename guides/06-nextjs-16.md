# 06 — Next.js 16

Eğitim verisindeki Next.js bilgisi büyük ölçüde 14 ve 15'ten. 16'da
bazı şeylerin adı, bazılarının davranışı değişti. Bu sayfadaki her madde
Next'in kendi yükseltme belgesinden doğrulandı
(`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`);
şüphede kaldığında oraya bak, hafızaya güvenme.

Gereksinim: Node ≥ 20.9 (ekosistem `.nvmrc`: 24), TypeScript ≥ 5.1.

---

## 1. `middleware.ts` → `proxy.ts`

```ts
// proxy.ts (kökte)
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/panel", "/hesap"] as const;
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  const hasSession = SESSION_COOKIES.some((n) => request.cookies.has(n));
  if (hasSession) return NextResponse.next();
  const url = new URL("/giris", request.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next|api/auth|.*\\..*).*)"] };
```

- Dosya adı **ve** dışa aktarılan fonksiyon adı `proxy`. `middleware` adı
  kullanımdan kaldırıldı.
- `proxy` **Node çalışma zamanında** koşar ve bu ayarlanamaz; edge yok.
- Yapılandırma bayrakları da yeniden adlandırıldı:
  `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.
- **Proxy bir ön elemedir, yetkilendirme değil.** Yalnızca çerezin VARLIĞINA
  bakar, ucuzdur. Gerçek kontrol sayfada ve her server action'da `auth()`
  ile tekrar yapılır; çerez sahte olabilir.

Varsayılan açık + korunan önek listesi (şablon) ile varsayılan korumalı +
açık izin listesi (ElevenForge) arasındaki seçim: herkese açık sayfası çok
olan üründe ilki, neredeyse her şeyi oturum isteyen üründe ikincisi.

---

## 2. Async API'ler — Senkron Erişim Tamamen Kalktı

15'te geçici olarak senkron da çalışıyordu; 16'da yalnızca `await`:

`cookies()`, `headers()`, `draftMode()`, `params` (layout, page, route,
default, opengraph-image, icon...), `searchParams` (page).

```tsx
✅ export default async function Page({ params }: PageProps<"/blog/[slug]">) {
     const { slug } = await params;
   }
❌ export default function Page({ params }) { const slug = params.slug; }
```

Metadata görsel fonksiyonları da artık Promise alır:

```tsx
// app/blog/[slug]/opengraph-image.tsx
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
}
```

`sitemap`in `generateSitemaps`ten gelen `id`si de Promise.

---

## 3. `PageProps` / `LayoutProps` / `RouteContext` — Önce Build

Global yardımcı tipler rotalardan üretilir ve `.next/types` altına yazılır:

```tsx
export default async function Page(props: PageProps<"/hisse/[symbol]">) { ... }

export async function GET(_req: Request, ctx: RouteContext<"/api/hisse/[symbol]">) {
  const { symbol } = await ctx.params;
}
```

`.next` gitignore'da olduğu için **temiz kopyada tipler yoktur**:

```bash
npm run build        # ya da: npx next typegen
npm run typecheck
```

Sıra ters koşulursa onlarca "Cannot find name 'PageProps'" hatası gelir;
kod sağlamdır (Açılış Zili). CI'da build typecheck'ten önce. Rota tipleri
tuhaflaşırsa önce `rm -rf .next`.

---

## 4. Turbopack Varsayılan

`next dev` ve `next build` artık Turbopack ile çalışır, bayrak gerekmez.

```ts
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: { root: __dirname },   // experimental.turbopack DEĞİL, üst düzey
  poweredByHeader: false,
};
export default config;
```

- `turbopack.root`: üst klasörlerde başka bir kilit dosyası varsa (ev
  dizininde unutulmuş bir `package-lock.json`) Turbopack kökü yanlış
  tahmin eder. Açıkça yaz.
- `next dev` çıktısı `.next/dev` altına gider; dev ve build aynı anda
  koşabilir.
- `next build` artık sayfa başına "First Load JS" boyutu yazmıyor. Paket
  boyutunu ölçmek için ayrı bir analiz gerekir.

---

## 5. ESLint: `next lint` Yok

`next lint` komutu kaldırıldı ve `next build` artık lint çalıştırmaz.
`next.config`teki `eslint` seçeneği de kaldırıldı.

```json
// package.json
"scripts": { "lint": "eslint" }
```

```js
// eslint.config.mjs (flat config)
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
```

- `.eslintrc.json` artık şablona girmez (`mistakes.md` #49 bu yüzden güncellendi).
- Build lint çalıştırmadığı için CI'da `npm run lint` **ayrı bir adımdır**.
- Flat config'te iç içe dizinleri yok saymak için `**/` öneki şart
  (`mistakes.md` #56).

---

## 6. Metadata Dosyaları

| Dosya | Ne üretir |
|-------|-----------|
| `app/icon.svg` | Sekme ikonu (SVG, temaya göre `prefers-color-scheme` içerebilir) |
| `app/apple-icon.tsx` | 180 px ana ekran ikonu |
| `app/opengraph-image.tsx` | Kök OG görseli, `next/og` ile |
| `app/manifest.ts` | PWA künyesi |
| `app/sitemap.ts` | `sitemap.xml` |
| `app/robots.ts` | `robots.txt` |

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV === "production";
  return {
    rules: isProd ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

Tek OG şablonu: ahmetakyapi.com'un `OgFrame`i gibi bir çerçeve bileşeni,
her rotanın `opengraph-image.tsx`i yalnızca başlığı ve künyeyi verir.
Görsel tutarlılığı tek yerden yönetilir.

---

## 7. Önbellek Katmanları

İki ayrı mekanizma, iki ayrı soru:

| | `cache()` (React) | `unstable_cache` (Next) |
|---|---|---|
| Ömür | Tek istek | İstekler arası, `revalidate` kadar |
| Soru | "Aynı istekte iki bileşen aynı veriyi soruyor" | "Bu veri her istekte yeniden çekilmesin" |
| Anahtar | Argümanlar | `keyParts` + argümanlar |

```ts
import { cache } from "react";
import { unstable_cache } from "next/cache";

export const getQuotes = cache(async (key: string) => fetchQuotes(key.split(",")));

const loadHolidays = unstable_cache(
  async () => db.select().from(holidays),
  ["holidays"],
  { revalidate: 86_400 },
);

export async function getHolidays() {
  try {
    return await loadHolidays();
  } catch (error) {
    console.error("holidays", error);   // hata önbelleğin DIŞINDA yakalanır
    return [];
  }
}
```

**Hata önbelleğin dışında yakalanır.** `try/catch` sarılan fonksiyonun içinde
olursa düşen veritabanının boş listesi "başarılı sonuç" olarak bir gün
boyunca saklanır (Açılış Zili).

**`cache()` anahtarı sıralı dize olsun.** İki panel aynı sembolleri farklı
sırada sorarsa iki ayrı istek gider ve aynı hissenin iki farklı yüzdesi yan
yana durabilir. Listeyi sırala, birleştir, dizeyi anahtar yap.

16'daki yeni önbellek API'leri:

- `revalidateTag("posts", "max")` — ikinci argüman (cacheLife profili)
  artık zorunlu; tek argümanlı biçim TypeScript hatası verir.
- `updateTag("user-1")` — yalnızca server action'da; yazdığını hemen
  okuma (read-your-writes).
- `refresh()` — server action içinden istemci yönlendiricisini tazeler.
- `cacheLife`, `cacheTag` — `unstable_` öneki kalktı.

---

## 8. `"use client"` Sınırı Tuzakları

1. **`"use client"` modülden dışa aktarılan DEĞER sunucuda referansa döner.**
   Sabit, renk listesi, ayar nesnesi: sunucu bileşeni gerçek değeri değil
   bir istemci referansını alır; ne derleme ne çalışma zamanı uyarır. Paylaşılan
   sabitler nötr bir modülde (`lib/motion.ts`, `lib/chart-series.ts`).
2. **Sunucu bileşeni istemci sağlayıcıya `children` olarak geçer.** Sağlayıcı
   istemci olabilir, sardığı ağacın çoğu sunucuda kalır. Bütün tabloyu
   istemciye taşıma; yalnızca etkileşimli hücreler istemci.
3. **Sığ adres güncellemesi uçuştaki gezinmeyi öldürür.** Next'in yamalı
   `history.replaceState`i bekleyen bir gezinmeyi sessizce iptal eder: ne
   hata ne yeniden deneme. Adresi sığ güncelleyen bir denetim, gezinme
   sürerken kendini kapatır (Açılış Zili `useRouteNavigating`).
4. **Sığ güncelleme geçmiş girdisini tazelemez.** Geri tuşu önceki durumun
   ağacını geri yükler. Adresten okunan durum **adresten** başlatılır, prop'tan
   değil.
5. **Sayfa içi filtre bağlantıları `scroll={false}`.** App Router her
   gezinmede en üste kaydırır; tablonun ortasında sıralamayı değiştiren
   okuyucu sayfanın başına fırlar.
6. **Kökte `:has()` yok.** `html:has(...)` her DOM değişikliğinde tüm belgenin
   stilini yeniden hesaplatır. Açılış Zili'nde saniyede bir rakam değiştiren
   geri sayım yüzünden 4x yavaş CPU'da yükleme boyunca 126 tam belge hesabı,
   2,1 saniye. Köke bağlı kural gerekiyorsa sayfa `<html>`e öznitelik basar.

---

## 9. `loading.tsx` ve Soft 404

Segmentte `loading.tsx` varsa sayfa bir Suspense sınırının içinde akış
olarak gönderilir; başlıklar ilk baytla birlikte **200** olarak gider. Sonra
sayfa `notFound()` çağırsa bile durum kodu 200 kalır: arama motoru boş bir
"bulunamadı" sayfasını dizine ekler.

✅ Segmentte `loading.tsx` yok; yavaş parça kendi `<Suspense>`inde:

```tsx
export default async function Page(props: PageProps<"/hisse/[symbol]">) {
  const { symbol } = await props.params;
  const company = await getCompany(symbol);
  if (!company) notFound();                      // gerçek 404
  return (
    <>
      <PageHeader title={company.name} />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <PriceChart symbol={symbol} />
      </Suspense>
    </>
  );
}
```

Smoke betiği olmayan bir adresin 404 döndüğünü her koşuda doğrular (08).

---

## 10. React 19 Formları

```tsx
"use client";
import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();            // en yakın <form>un durumu
  return <Button type="submit" disabled={pending}>{pending ? "Kaydediliyor" : "Kaydet"}</Button>;
}

export function NoteForm({ notes }: { notes: Note[] }) {
  const [optimistic, addOptimistic] = useOptimistic(notes, (s, n: Note) => [n, ...s]);
  const [state, action] = useActionState(async (prev: State, data: FormData) => {
    addOptimistic({ id: "tmp", text: String(data.get("text")) });
    return createNote(prev, data);
  }, { ok: true } as State);

  return <form action={action}>...<SubmitButton /></form>;
}
```

- `useFormStatus` **formun içindeki** bir bileşende çağrılır; formu basan
  bileşende çağrılırsa hep `pending: false` döner.
- `useOptimistic` iyimser durumu yalnızca bir geçiş (action) sürerken tutar;
  action bitince gerçek değere döner. Hata olursa ayrıca geri alma gerekmez.
- **Async `startTransition` Promise döndürmeli.** Geçiş, içindeki `await`
  bitene kadar bekleyen sayılsın diye:

```tsx
startTransition(async () => {
  await saveSettings(next);   // await YAZILMAZSA geçiş anında biter
  router.refresh();
});
```

- Hata sınırında `reset()` tek başına yetmez; sunucu verisini de tazele:

```tsx
// app/error.tsx
startTransition(() => { router.refresh(); reset(); });
```

---

## 11. Server Actions Güvenliği

Her `"use server"` fonksiyonu **herkese açık bir POST ucudur.** Arayüzde
düğmesi görünmüyor olması korunduğu anlamına gelmez.

```ts
"use server";
export async function deleteNote(id: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthorized" } as const;   // 1. kimlik
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" } as const;        // 2. girdi
  await db.delete(notes).where(and(eq(notes.id, parsed.data), eq(notes.userId, session.user.id))); // 3. sahiplik
  updateTag(`notes-${session.user.id}`);
  return { ok: true } as const;
}
```

1. Kimlik her action'da yeniden doğrulanır; proxy'ye güvenilmez.
2. Girdi `unknown` kabul edilir, zod ile daraltılır; TypeScript tipi
   istemcinin göndereceğini garanti etmez.
3. Sahiplik sorgunun içinde (`userId` koşulu); "önce oku, sonra kontrol et"
   iki tur ve yarış koşulu.
4. Dönüş değeri istemciye gider: hata ayrıntısı, yığın izi, başka kullanıcının
   verisi dönmez.
5. Hız sınırı giriş, kayıt ve e-posta gönderen her action'da (07).

---

## 12. Diğer 16 Değişiklikleri (Kısaca)

- Paralel rota yuvalarında `default.js` zorunlu; yoksa build kırılır.
- `next/image`: `minimumCacheTTL` varsayılanı 4 saat, `qualities`
  varsayılanı `[75]`, yerel IP'ler varsayılan olarak engelli.
- `scroll-behavior: smooth` artık gezinmede ezilmiyor; eski davranış için
  `<html data-scroll-behavior="smooth">`.
- `reactCompiler: true` kararlı ama varsayılan kapalı; açarsan build süresi uzar.
- React 19.2: `<ViewTransition>`, `useEffectEvent`, `<Activity>`.
- AMP, `serverRuntimeConfig`/`publicRuntimeConfig` kaldırıldı; env kullan.
