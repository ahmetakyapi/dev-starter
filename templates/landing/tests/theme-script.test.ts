import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { DEFAULT_THEME, THEME_COLOR, THEME_SCRIPT } from "../lib/theme";

/**
 * `<head>`deki tema betiği bir dizgi: tip denetimi onu görmez, bozulursa
 * yalnızca ilk karede yanlış tema olarak ortaya çıkar. Sahte bir belgede
 * koşturulur: `<html>` özniteliği ve head'in başına eklenen theme-color
 * meta'sı. Sunucunun metasına dokunulmaz (lib/theme.ts → THEME_SCRIPT).
 */
function run(cookie: string) {
  const prepended: { name?: string; content?: string }[] = [];
  const document = {
    cookie,
    documentElement: { dataset: {} as Record<string, string> },
    createElement: () => ({}) as { name?: string; content?: string },
    head: { prepend: (el: { name?: string; content?: string }) => prepended.push(el) },
  };
  runInNewContext(THEME_SCRIPT, { document });
  return { theme: document.documentElement.dataset.theme, metas: prepended };
}

test("THEME_SCRIPT: çerezdeki temayı yazar, çubuk rengi için kendi metasını başa ekler", () => {
  assert.deepEqual(run("a=1; theme=dark; b=2"), {
    theme: "dark",
    metas: [{ name: "theme-color", content: THEME_COLOR.dark }],
  });
});

test("THEME_SCRIPT: çerez yoksa ya da bilinmiyorsa varsayılan, meta eklenmez", () => {
  for (const cookie of ["", "theme=system", "theme=darkish", "xtheme=dark", `theme=${DEFAULT_THEME}`]) {
    const out = run(cookie);
    assert.equal(out.theme, DEFAULT_THEME, cookie);
    // Varsayılanın rengini sunucunun statik viewport metası zaten basar.
    assert.deepEqual(out.metas, [], cookie);
  }
});
