/**
 * Bellek içi, en iyi çaba hız sınırı.
 *
 * SINIRI: Vercel'de her sunucusuz örneğin kendi haritası var ve örnek
 * soğuyunca harita sıfırlanır. Yani bu bir GARANTİ değil, bir fren: "düğmeye
 * basılı tutma" ve döngüdeki basit script vakalarını keser, Redis bağımlılığı
 * eklemeden. Tam olarak bir kez olması gereken işler (ödeme, ödül) veritabanı
 * düzeyinde koşullu UPDATE ile korunur; gerçek dağıtık sınır gerekiyorsa
 * Upstash gibi paylaşılan bir depoya taşı, imza aynı kalsın.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Uzun yaşayan bir örnekte harita sınırsız büyümesin, süpürme de her istekte
 * bütün haritayı gezmesin. Pencere içinde binlerce farklı anahtar gelirse
 * (sahte XFF) hiçbir kovanın süresi dolmamıştır: her istekte tam tarama hem
 * hiçbir şey silmez hem de olay döngüsünü anahtar sayısıyla orantılı yakar.
 * Bu yüzden süresi dolanlar en fazla saniyede bir taranır ve tavan aşılınca
 * EN ESKİ kova düşer (Map ekleme sırasını korur, ilk anahtar en eskisi).
 * Bedeli: anahtar seli sırasında eski bir kova erken sıfırlanabilir; bu
 * zaten bir fren, garanti değil.
 */
const SWEEP_THRESHOLD = 5_000;
const SWEEP_INTERVAL_MS = 1_000;
const MAX_BUCKETS = 10_000;
let nextSweepAt = 0;

function sweep(now: number): void {
  if (buckets.size >= SWEEP_THRESHOLD && now >= nextSweepAt) {
    nextSweepAt = now + SWEEP_INTERVAL_MS;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    // Sil, sonra ekle: yenilenen kova sıranın sonuna geçer; tavan önce gerçekten eskiyi düşürür.
    buckets.delete(key);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/**
 * İstemci IP'si; Vercel `x-forwarded-for`un ilk değerini gerçek istemci yapar.
 *
 * VERCEL DIŞINDA BU BAŞLIK SAHTELENEBİLİR: `next start`a doğrudan ya da
 * başlığı yeniden yazmayan bir vekil arkasında saldırgan her istekte farklı
 * bir XFF göndererek IP tabanlı sınırı aşar (ve her sahte IP yeni kova açar).
 * Kendi sunucunda ya vekilin XFF'i yeniden yazdığını doğrula ya da oturum
 * varsa sınır anahtarını IP yerine kullanıcı kimliğiyle kur
 * (`rateLimit(\`x:${userId}\`, ...)`; örnek: nextjs-fullstack şablonundaki
 * `app/akis/actions.ts`).
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

/** Yalnızca testler için: kovaları ve süpürme saatini sıfırlar. */
export function resetRateLimits(): void {
  buckets.clear();
  nextSweepAt = 0;
}
