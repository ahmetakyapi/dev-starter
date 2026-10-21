import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSiteUrlForBuild, parseClientEnv, parseServerEnv } from "../lib/env";

test("env: boş dizgi tanımsız sayılır", () => {
  const env = parseServerEnv({ DATABASE_URL: "", AUTH_SECRET: "   ", CRON_SECRET: "" });
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.AUTH_SECRET, undefined);
  assert.equal(env.CRON_SECRET, undefined);
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "" }).NEXT_PUBLIC_SITE_URL, undefined);
});

test("env: geçersiz adres reddedilir", () => {
  assert.throws(() => parseServerEnv({ DATABASE_URL: "adres-değil" }), /DATABASE_URL/);
  // Veritabanı adresi http(s) değil: site adresinin şema kısıtı ona uygulanmaz.
  assert.doesNotThrow(() => parseServerEnv({ DATABASE_URL: "postgresql://u:p@ornek.neon.tech/db?sslmode=require" }));
});

test("env: site adresi yalnızca http(s)", () => {
  // Şemasız "host:port" zod'da `localhost:` şeması sayılır ve geçerdi.
  assert.throws(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "localhost:3000" }), /NEXT_PUBLIC_SITE_URL/);
  assert.throws(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "ftp://ornek.test" }), /NEXT_PUBLIC_SITE_URL/);
});

test("env: üretim derlemesi site adresi olmadan durur", () => {
  assert.throws(() => assertSiteUrlForBuild({}), /NEXT_PUBLIC_SITE_URL/);
  assert.throws(() => assertSiteUrlForBuild({ NEXT_PUBLIC_SITE_URL: "  " }), /NEXT_PUBLIC_SITE_URL/);
  assert.doesNotThrow(() => assertSiteUrlForBuild({ NEXT_PUBLIC_SITE_URL: "https://ornek.test" }));
  // Vercel'de değişken boşsa üretim alan adı yeter.
  assert.doesNotThrow(() => assertSiteUrlForBuild({ VERCEL_PROJECT_PRODUCTION_URL: "ornek.vercel.app" }));
  assert.doesNotThrow(() => assertSiteUrlForBuild({ SKIP_ENV_VALIDATION: "1" }));
});

test("env: üretimde AUTH_SECRET zorunlu", () => {
  assert.throws(() => parseServerEnv({ NODE_ENV: "production" }), /AUTH_SECRET/);
  assert.doesNotThrow(() => parseServerEnv({ NODE_ENV: "production", AUTH_SECRET: "x" }));
});

test("env: yarım sağlayıcı yapılandırması reddedilir", () => {
  assert.throws(() => parseServerEnv({ AUTH_GITHUB_ID: "id" }), /AUTH_GITHUB_SECRET/);
});

test("env: SKIP_ENV_VALIDATION doğrulamayı atlar ama boş dizgiyi yine ayıklar", () => {
  const env = parseServerEnv({ SKIP_ENV_VALIDATION: "1", NODE_ENV: "production", DATABASE_URL: "" });
  assert.equal(env.NODE_ENV, "production");
  assert.equal(env.DATABASE_URL, undefined);
});
