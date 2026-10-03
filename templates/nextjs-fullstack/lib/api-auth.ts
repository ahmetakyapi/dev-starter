import { timingSafeEqual } from "node:crypto";

/**
 * Bearer belirteci doğrulaması: makineden makineye uçların (cron, webhook,
 * dış rutin) tek kapısı.
 *
 * İki tuzağı kapatır:
 *
 * 1. ZAMAN SIZINTISI. `a === b` ilk farklı karakterde döner; süre doğru
 *    önekin uzunluğunu ele verir. Sabit süreli karşılaştırma bir satır.
 * 2. AÇIK KALMA. `if (secret && auth !== ...)` kalıbı, anahtar tanımsızken
 *    koşulu hiç çalıştırmaz ve uç herkese açılır. Burada üretimde anahtar
 *    yoksa istek 503 ile reddedilir: yanlış yapılandırma sessiz bir açık
 *    kapıya değil görünür bir hataya dönüşür.
 */

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // Uzunluk farkı zaten bir sızıntı değil; timingSafeEqual eşit boy ister.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type AuthOutcome = { ok: true } | { ok: false; status: 401 | 503; error: string };

export function checkBearer(request: Request, secret: string | undefined): AuthOutcome {
  if (!secret) {
    // Geliştirmede anahtarsız çalışmak rahatlık; üretimde açık kapı.
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, status: 503, error: "secret-not-configured" };
  }

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return { ok: false, status: 401, error: "unauthorized" };

  return safeEqual(header.slice("Bearer ".length), secret)
    ? { ok: true }
    : { ok: false, status: 401, error: "unauthorized" };
}

/** Rota içinde tek satırlık kullanım: `const denied = rejectUnauthorized(req, env.CRON_SECRET); if (denied) return denied;` */
export function rejectUnauthorized(request: Request, secret: string | undefined): Response | null {
  const outcome = checkBearer(request, secret);
  if (outcome.ok) return null;
  return Response.json({ error: outcome.error }, { status: outcome.status });
}
