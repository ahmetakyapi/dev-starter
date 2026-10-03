import assert from "node:assert/strict";
import { test } from "node:test";
import { parseClientEnv, parseServerEnv } from "../lib/env";

test("env: boş dizgi tanımsız sayılır", () => {
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "" }).NEXT_PUBLIC_SITE_URL, undefined);
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "   " }).NEXT_PUBLIC_SITE_URL, undefined);
});

test("env: geçersiz site adresi reddedilir", () => {
  assert.throws(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "adres-değil" }), /NEXT_PUBLIC_SITE_URL/);
  assert.doesNotThrow(() => parseClientEnv({ NEXT_PUBLIC_SITE_URL: "https://ornek.test" }));
});

test("env: NODE_ENV varsayılanı development", () => {
  assert.equal(parseServerEnv({}).NODE_ENV, "development");
});

test("env: SKIP_ENV_VALIDATION doğrulamayı atlar ama boş dizgiyi yine ayıklar", () => {
  const client = parseClientEnv({ SKIP_ENV_VALIDATION: "1", NEXT_PUBLIC_SITE_URL: "" });
  assert.equal(client.NEXT_PUBLIC_SITE_URL, undefined);
  assert.equal(parseServerEnv({ SKIP_ENV_VALIDATION: "1", NODE_ENV: "production" }).NODE_ENV, "production");
});
