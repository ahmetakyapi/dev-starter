import assert from "node:assert/strict";
import { test } from "node:test";
import { parseClientEnv, parseServerEnv } from "../lib/env";

test("env: boş dizgi tanımsız sayılır", () => {
  const env = parseServerEnv({ DATABASE_URL: "", AUTH_SECRET: "   ", CRON_SECRET: "" });
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.AUTH_SECRET, undefined);
  assert.equal(env.CRON_SECRET, undefined);
  assert.equal(parseClientEnv({ NEXT_PUBLIC_SITE_URL: "" }).NEXT_PUBLIC_SITE_URL, undefined);
});

test("env: geçersiz adres reddedilir", () => {
  assert.throws(() => parseServerEnv({ DATABASE_URL: "adres-değil" }), /DATABASE_URL/);
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
