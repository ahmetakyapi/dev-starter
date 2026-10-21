import type { Instrumentation } from "next";

/**
 * Yakalanmamış her sunucu hatası (sayfa çizimi, rota ucu, sunucu eylemi)
 * buraya düşer; `notFound()` ve `redirect()` gibi akış denetimleri düşmez.
 *
 * Kullanıcının hata ekranında gördüğü kimlik (`digest`) burada da var: bir
 * hata izleme servisine (Sentry, Axiom, kendi tablon) gönderirken onu
 * anahtar yap ki ekrandan bildirilen hata kayıtta bulunabilsin.
 *
 * Adres değil ROTA ŞABLONU yazılır (`context.routePath`): sorgu dizesi
 * kişisel veri taşıyabilir. İstek başlıkları da kayda girmez.
 *
 * NOT: Next kendi günlüğüne hatanın tamamını yine basar. Bu satır bir hata
 * izleme servisine gidecek kaydın biçimidir; platform günlüğünü kişisel
 * veriden arındırmak günlük aktarımında (log drain) yapılır.
 */

/**
 * Drizzle başarısız sorguyu `Failed query: <sql>\nparams: <değerler>` mesajıyla
 * sarar (`DrizzleQueryError`; `name` alanı "Error" kalır, bu yüzden alanlara
 * bakılır). Parametreler kişisel veri taşır (e-posta, not metni): mesaj yerine
 * asıl nedenin kodu ve mesajı yazılır, satır değeri taşıyan Postgres `detail`
 * alanı yazılmaz. Veritabanı olmayan projede bu dal hiç çalışmaz; sonradan
 * eklenince koruma hazır.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if ("query" in error && "params" in error) {
    const cause = error.cause as { code?: unknown; message?: unknown } | undefined;
    const code = typeof cause?.code === "string" ? ` [${cause.code}]` : "";
    const reason = typeof cause?.message === "string" ? `: ${cause.message}` : "";
    return `db query failed${code}${reason}`;
  }
  return error.message;
}

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  if (process.env.NODE_ENV !== "production") return;
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  const message = describe(error);
  // Servis bağlanana kadar platform günlüğü (Vercel Logs) kayıt yeridir.
  console.error(
    JSON.stringify({ kind: "request-error", route: context.routePath, routeType: context.routeType, digest, message }),
  );
};
