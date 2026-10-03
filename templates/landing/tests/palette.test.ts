import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Palet kontrastı ÖLÇÜLÜR, tahmin edilmez.
 *
 * `app/globals.css`teki palet bloklarını okur, WCAG göreli parlaklık
 * formülüyle oranları hesaplar. Yarı saydam değerler (`rgb(... / .1)`)
 * altındaki zemine karıştırılarak ölçülür. Palet değiştirince bu test
 * geçmeden commit atılmaz.
 */

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

type Rgba = [number, number, number, number];

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `blok bulunamadı: ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[match[1]] = match[2].trim();
  return out;
}

function parseColor(value: string): Rgba {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = value.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] ? Number(rgb[4]) : 1];
  throw new Error(`çözülemeyen renk: ${value}`);
}

function over(top: Rgba, base: Rgba): Rgba {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a)).concat(1) as Rgba;
}

function luminance([r, g, b]: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function gradientStops(value: string): Rgba[] {
  return [...value.matchAll(/#[0-9a-f]{6}/gi)].map((m) => parseColor(m[0]));
}

const AA = 4.5;

const light = block(':root,\n:root[data-palette="signature"]');
const dark = { ...light, ...block(':root[data-theme="dark"],\n:root[data-theme="dark"][data-palette="signature"]') };
const system = block(":root");

for (const [name, palette] of [
  ["açık", light],
  ["koyu", dark],
] as const) {
  const resolve = (token: string): Rgba => {
    const raw = palette[token];
    assert.ok(raw, `${token} tanımsız (${name})`);
    const ref = raw.match(/^var\((--[\w-]+)\)$/);
    return parseColor(ref ? palette[ref[1]] : raw);
  };
  const page = resolve("--page-bg");
  const check = (label: string, ratio: number) =>
    assert.ok(ratio >= AA, `${name}: ${label} ${ratio.toFixed(2)}:1 < ${AA}:1`);

  test(`signature ${name}: primary dolgu üstünde on-primary AA`, () => {
    check("on-primary/primary", contrast(resolve("--on-primary"), resolve("--primary")));
  });

  test(`signature ${name}: wash zemin üstünde primary-ink AA`, () => {
    const wash = over(resolve("--primary-wash"), page);
    check("primary-ink/wash", contrast(resolve("--primary-ink"), wash));
  });

  test(`signature ${name}: zemin üstünde gövde ve soluk metin AA`, () => {
    check("text-body/page", contrast(resolve("--text-body"), page));
    check("text-muted/page", contrast(resolve("--text-muted"), page));
    // Panel içi: yarı saydam yüzey zemine karışır.
    check("text-muted/surface", contrast(resolve("--text-muted"), over(resolve("--surface"), page)));
  });
}

test("signature: CTA degradesinin her durağı beyaz metinle AA", () => {
  const onBrand = parseColor(system["--on-brand"]);
  for (const stop of gradientStops(light["--cta-gradient"])) {
    const ratio = contrast(onBrand, stop);
    assert.ok(ratio >= AA, `cta durağı ${ratio.toFixed(2)}:1 < ${AA}:1`);
  }
});
