import assert from "node:assert/strict";
import { test } from "node:test";
import * as content from "../lib/content";

/**
 * İçerik sözleşmesi. `lib/content.ts` yeni bir projede elle yeniden
 * yazılan TEK dosya; yazım ve yapı kuralları burada makineyle korunur.
 */

/** İçerikteki bütün dizgiler (ikon bileşenleri hariç). */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) strings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) strings(item, out);
  return out;
}

const all = strings(content);

test("içerik: uzun tire ve aralık tiresi yok", () => {
  const offenders = all.filter((text) => /[—–]/.test(text));
  assert.deepEqual(offenders, []);
});

test("içerik: hero varyantı katalogda", () => {
  assert.equal(content.isHeroVariant(content.hero.variant), true);
  assert.equal(content.isHeroVariant("yok"), false);
});

test("içerik: bento hero 3 ile 5 hücre arası", () => {
  assert.ok(content.hero.bento.length >= 3 && content.hero.bento.length <= 5);
});

test("içerik: başlık satırlarından en fazla biri mürekkepli", () => {
  const inked = content.hero.title.filter((line) => "ink" in line && line.ink);
  assert.ok(inked.length <= 1, "degrade yalnızca kısa bir satırda");
});

test("içerik: aynı etiket aynı adrese gider (tek niyet, tek etiket)", () => {
  const links = [
    content.nav.cta,
    content.hero.primary,
    content.finalCta.primary,
    ...content.pricing.plans.map((plan) => plan.cta),
    content.pricing.enterprise.cta,
  ];
  const byLabel = new Map<string, string>();
  for (const link of links) {
    const known = byLabel.get(link.label);
    if (known) assert.equal(link.href, known, `"${link.label}" iki farklı adrese gidiyor`);
    byLabel.set(link.label, link.href);
  }
  assert.equal(content.hero.primary.label, content.nav.cta.label);
  assert.equal(content.finalCta.primary.label, content.nav.cta.label);
});

test("içerik: menü çapaları benzersiz ve # ile başlıyor", () => {
  const hrefs = content.nav.links.map((link) => link.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const href of hrefs) assert.match(href, /^#[a-z]+$/);
});

test("içerik: alıntılar kısa (en fazla 160 karakter)", () => {
  for (const item of content.testimonials.items) assert.ok(item.quote.length <= 160, item.name);
});

test("içerik: hero tarihi geçerli ISO günü", () => {
  assert.match(content.hero.stats.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(content.hero.stats.asOf)));
});
