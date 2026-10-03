import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { emailSchema, formToObject, validate } from "../lib/validation";

const schema = z.object({ name: z.string().min(2, "kısa"), email: emailSchema });

test("validate: geçerli girdi temizlenmiş veriyle döner", () => {
  const result = validate(schema, { name: "Ada", email: "  ADA@Example.com " });
  assert.deepEqual(result, { ok: true, data: { name: "Ada", email: "ada@example.com" } });
});

test("validate: alan başına ilk hata", () => {
  const result = validate(schema, { name: "A", email: "olmaz" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.fieldErrors.name, "kısa");
  assert.equal(result.fieldErrors.email, "Geçerli bir e-posta gir.");
  assert.equal(result.error, "kısa");
});

test("validate: nesne olmayan girdi çökmeden reddedilir", () => {
  const result = validate(schema, "dize");
  assert.equal(result.ok, false);
});

test("formToObject: dize alanları alır", () => {
  const form = new FormData();
  form.set("name", "Ada");
  form.set("email", "ada@example.com");
  assert.deepEqual(formToObject(form), { name: "Ada", email: "ada@example.com" });
});
