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
 */
export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  if (process.env.NODE_ENV !== "production") return;
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  const message = error instanceof Error ? error.message : String(error);
  // Servis bağlanana kadar platform günlüğü (Vercel Logs) kayıt yeridir.
  console.error(
    JSON.stringify({ kind: "request-error", route: context.routePath, routeType: context.routeType, digest, message }),
  );
};
