/**
 * Bellek içi, en iyi çaba hız sınırı.
 *
 * SINIRI: Vercel'de her sunucusuz örneğin kendi haritası var ve örnek
 * soğuyunca harita sıfırlanır. Yani bu bir GARANTİ değil, bir fren: "düğmeye
 * basılı tutma" ve döngüdeki basit betik vakalarını keser, Redis bağımlılığı
 * eklemeden. Tam olarak bir kez olması gereken işler (ödeme, ödül) veritabanı
 * düzeyinde koşullu UPDATE ile korunur; gerçek dağıtık sınır gerekiyorsa
 * Upstash gibi paylaşılan bir depoya taşı, imza aynı kalsın.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Uzun yaşayan bir örnekte harita sınırsız büyümesin. */
const SWEEP_THRESHOLD = 5_000;

function sweep(now: number): void {
  if (buckets.size < SWEEP_THRESHOLD) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
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
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/** İstemci IP'si; Vercel `x-forwarded-for`un ilk değerini gerçek istemci yapar. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

/** Yalnızca testler için: kovaları boşaltır. */
export function resetRateLimits(): void {
  buckets.clear();
}
