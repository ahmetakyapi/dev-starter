import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_THEME, THEMES, isTheme } from "../lib/theme";

test("isTheme: yalnızca bilinen temalar", () => {
  for (const theme of THEMES) assert.equal(isTheme(theme), true);
  for (const value of ["", "Dark", "system", undefined, null, 1, {}]) assert.equal(isTheme(value), false);
});

test("varsayılan tema listede", () => {
  assert.equal(isTheme(DEFAULT_THEME), true);
});
