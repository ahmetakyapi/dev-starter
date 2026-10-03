import assert from "node:assert/strict";
import { test } from "node:test";
import { rateLimit, resetRateLimits } from "../lib/rate-limit";
import { jsonLd } from "../lib/structured-data";

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
