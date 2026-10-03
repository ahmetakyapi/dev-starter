import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBearer } from "../lib/api-auth";
import { rateLimit, resetRateLimits } from "../lib/rate-limit";
import { jsonLd } from "../lib/structured-data";

const request = (authorization?: string) =>
  new Request("https://example.test/api/cron", {
    headers: authorization ? { authorization } : {},
  });

test("checkBearer: doğru anahtar geçer, yanlışı ve eksiği 401", () => {
  assert.deepEqual(checkBearer(request("Bearer s3cret"), "s3cret"), { ok: true });
  assert.equal(checkBearer(request("Bearer yanlis"), "s3cret").ok, false);
  assert.equal(checkBearer(request(), "s3cret").ok, false);
});

test("checkBearer: üretimde anahtar yoksa 503, açık kalmaz", () => {
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    const outcome = checkBearer(request("Bearer herhangi"), undefined);
    assert.deepEqual(outcome, { ok: false, status: 503, error: "secret-not-configured" });
  } finally {
    Object.assign(process.env, { NODE_ENV: previous });
  }
});

test("rateLimit: sınırdan sonra reddeder, pencere dolunca açılır", () => {
  resetRateLimits();
  const now = 1_000;
  assert.equal(rateLimit("k", 2, 100, now).ok, true);
  assert.equal(rateLimit("k", 2, 100, now).ok, true);
  const blocked = rateLimit("k", 2, 100, now + 10);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterMs, 90);
  assert.equal(rateLimit("k", 2, 100, now + 100).ok, true);
});

test("jsonLd: '<' kaçırılır, script erken kapanamaz", () => {
  const out = jsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(out.includes("<"), false);
  assert.deepEqual(JSON.parse(out), { name: "</script><script>alert(1)</script>" });
});
