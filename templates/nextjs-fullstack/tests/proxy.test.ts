import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const visit = (path: string, cookie?: string) =>
  proxy(new NextRequest(`https://ornek.test${path}`, { headers: cookie ? { cookie } : {} }));

test("proxy: korunmayan rota çerezsiz geçer", () => {
  assert.equal(visit("/").status, 200);
});

test("proxy: korunan rota çerezsiz girişe yönlenir, dönüş adresi korunur", () => {
  const response = visit("/hesap?sekme=profil");
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location") ?? "");
  assert.equal(location.pathname, "/api/auth/signin");
  assert.equal(location.searchParams.get("callbackUrl"), "/hesap?sekme=profil");
});

test("proxy: tam adlı ve parçalı (büyük JWT) oturum çerezi geçer", () => {
  assert.equal(visit("/hesap", "authjs.session-token=a").status, 200);
  assert.equal(visit("/hesap", "__Secure-authjs.session-token.0=a; __Secure-authjs.session-token.1=b").status, 200);
  assert.equal(visit("/hesap/ayarlar", "authjs.session-token.0=a").status, 200);
});

test("proxy: benzer adlı başka çerez oturum sayılmaz", () => {
  assert.equal(visit("/hesap", "authjs.session-tokenx=a").status, 307);
  assert.equal(visit("/hesap", "authjs.csrf-token=a").status, 307);
});
