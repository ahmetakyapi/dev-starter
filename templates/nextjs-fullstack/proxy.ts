import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16'da `middleware.ts` yerini `proxy.ts` aldı; dışa aktarılan
 * fonksiyonun adı da `proxy`.
 *
 * VARSAYILAN AÇIK. Yalnızca aşağıdaki öneklere giriş istenir; yeni bir rota
 * eklemek onu kendiliğinden kapatmaz.
 *
 * UCUZ ÖN ELEME. Burada yalnızca oturum çerezinin VARLIĞINA bakılır, imza
 * doğrulanmaz: proxy her istekte çalışır ve veritabanına ya da Auth.js'nin
 * tam yapılandırmasına gitmemeli. Sahte bir çerez buradan geçer ama sayfanın
 * kendisindeki `await auth()` onu durdurur. Asıl kapı orası.
 */

const PROTECTED_PREFIXES = ["/hesap"] as const;

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (signedIn) return NextResponse.next();

  const url = new URL("/api/auth/signin", request.url);
  url.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Statik dosyalar, görsel iyileştirici ve meta dosyaları proxy'ye hiç uğramaz.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image).*)"],
};
