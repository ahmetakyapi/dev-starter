import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSiteUrlForBuild, parseClientEnv, parseServerEnv } from "../lib/env";

test("env: boş dizgi tanımsız sayılır", () => {
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "" }).NEXT_PUBLIC_SITE_URL, undefined);
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "   " }).NEXT_PUBLIC_SITE_URL, undefined);
});

test("env: geçersiz site adresi reddedilir", () => {
  assert.throws(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "adres-değil" }), /NEXT_PUBLIC_SITE_URL/);
  assert.doesNotThrow(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "https://ornek.test" }));
  assert.doesNotThrow(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }));
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

test("env: NODE_ENV varsayılanı development", () => {
  assert.equal(parseServerEnv({}).NODE_ENV, "development");
});

test("env: SKIP_ENV_VALIDATION doğrulamayı atlar ama boş dizgiyi yine ayıklar", () => {
  const client = parseClientEnv({ SKIP_ENV_VALIDATION: "1", NEXT_PUBLIC_SITE_URL: "" });
  assert.equal(client.NEXT_PUBLIC_SITE_URL, undefined);
  assert.equal(parseServerEnv({ SKIP_ENV_VALIDATION: "1", NODE_ENV: "production" }).NODE_ENV, "production");
});
