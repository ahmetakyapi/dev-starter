import assert from "node:assert/strict";
import { test } from "node:test";
import { cn } from "../lib/utils";

test("cn: koşullu sınıfları birleştirir", () => {
  assert.equal(cn("px-2", false && "hidden", null, undefined, "py-1"), "px-2 py-1");
});

test("cn: çakışan yardımcıda sonuncu kazanır", () => {
  assert.equal(cn("px-2", "px-4"), "px-4");
});

test("cn: özel punto renk sınıfıyla birlikte KORUNUR", () => {
  // Bu test kırılırsa `TEXT_SIZES` twMerge'e tanıtılmamış demektir.
  assert.equal(cn("text-small", "text-strong"), "text-small text-strong");
  assert.equal(cn("text-read font-semibold", "text-muted"), "text-read font-semibold text-muted");
});

test("cn: iki özel punto çakışınca sonuncu kalır", () => {
  assert.equal(cn("text-small", "text-lead"), "text-lead");
});

test("cn: iki renk çakışınca sonuncu kalır", () => {
  assert.equal(cn("text-strong", "text-muted"), "text-muted");
});
