import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "@/lib/env";

/**
 * Auth.js v5. Oturum JWT'de; veritabanı bağdaştırıcısı YOK, bilerek: giriş
 * yapan kullanıcıyı `users` tablosuna yazmak gerekiyorsa `callbacks.signIn`
 * içinde upsert et ya da `@auth/drizzle-adapter` ekle (o zaman şemaya
 * accounts/sessions tabloları da girer).
 *
 * SAĞLAYICILAR ENV'DEN. Anahtarı tanımlı olmayan sağlayıcı listeye hiç
 * girmez; yarım tanımlıysa `lib/env.ts` açılışta söyler. Yeni sağlayıcı:
 * import et, aşağıdaki listeye aynı koşulla ekle, `.env.example`e yaz.
 *
 * YENİ SAĞLAYICI EKLERKEN E-POSTA TUZAĞI: uygulama kullanıcıyı e-postayla
 * eşler (`lib/feed.ts` → currentFeedUser). GitHub doğrulanmış birincil
 * e-postayı döndürür; e-postayı DOĞRULAMADAN veren bir sağlayıcı (bazı OAuth
 * sağlayıcıları, credentials) eklenirse saldırgan başkasının adresiyle hesap
 * açıp onun satırlarına oturur. Böyle bir sağlayıcıda `callbacks.signIn`
 * içinde `profile.email_verified !== true` ise girişi REDDET.
 *
 * Kimlik doğrulamanın asıl kapısı burası (`auth()`); `proxy.ts` yalnızca
 * çerezin varlığına bakan ucuz bir ön elemedir.
 */

const providers: NextAuthConfig["providers"] = [];

if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub({ clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET }));
}

/** Oturum ömrü: 30 gün, aktif kullanımda günde bir kayarak yenilenir. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const SESSION_UPDATE_AGE = 60 * 60 * 24;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE, updateAge: SESSION_UPDATE_AGE },
  // Host başlığına güven: callback/çerez adresleri istekteki Host'tan kurulur.
  // Vercel'de güvenli (platform başlığı sabitler). KENDİ SUNUCUNDA iki şart:
  // ya vekil (nginx/Caddy) Host/X-Forwarded-Host'u sabitlediği doğrulanır ya
  // da AUTH_URL env'i tanımlanır (.env.example) — yoksa saldırgan Host: evil
  // ile OAuth callback'ini kendi alanına kurabilir.
  trustHost: true,
});
