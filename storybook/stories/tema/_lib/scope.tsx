import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * İKİ TEMA AYNI ANDA, iframe'siz.
 *
 * Paletler ve temalar `:root[data-theme][data-palette]` seçicili: alt öğeye
 * `data-theme="dark"` vermek işe yaramaz. Ama sınıflar (`bg-page`,
 * `text-strong`, `bg-cta`) `@theme inline` sayesinde doğrudan `var(--page-bg)`
 * okur; değişkenleri bir alt ağaçta yeniden tanımlamak o ağacı o temaya çevirir.
 *
 * Değerleri ELLE yazmıyoruz: sayfaya yüklenmiş gerçek stil sayfasından
 * (globals.css + palettes.css, CSSOM) okuyup alt ağaca basıyoruz. Böylece
 * burada görünen, projede görünenin ta kendisi; ayrı bir kopya yok.
 *
 * Türeyen değişkenler (`--line-focus: var(--primary)`) de kopyalanır: özel
 * özellik kökte çözülüp ÇÖZÜLMÜŞ haliyle miras kalır, yeniden bildirilmezse
 * kapsamın içinde kökün rengini taşırdı.
 */

export type ThemeName = "light" | "dark";

const norm = (selector: string) => selector.replace(/["'\s]/g, "");

function styleRules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) out.push(rule);
      else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* başka kökenli sayfa (Google Fonts): okunamaz, atla */
    }
  }
  return out;
}

function varsFor(rules: CSSStyleRule[], selector: string, into: Record<string, string>) {
  for (const rule of rules) {
    const list = rule.selectorText.split(",").map(norm);
    if (!list.includes(selector)) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const name = rule.style[i];
      if (name.startsWith("--")) into[name] = rule.style.getPropertyValue(name).trim();
    }
  }
}

const cache = new Map<string, Record<string, string>>();

/** Bir tema + palet için bütün kök değişkenleri (açık taban + koyu üst yazım). */
export function readThemeVars(theme: ThemeName, palette = "signature"): Record<string, string> {
  const key = `${theme}:${palette}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === "undefined") return {};
  const rules = styleRules();
  const vars: Record<string, string> = {};
  varsFor(rules, ":root", vars);
  varsFor(rules, `:root[data-palette=${palette}]`, vars);
  if (theme === "dark") {
    varsFor(rules, ":root[data-theme=dark]", vars);
    varsFor(rules, `:root[data-theme=dark][data-palette=${palette}]`, vars);
  }
  // Boş sonuç önbelleğe girmez: stil sayfası henüz gelmemiş olabilir.
  if (vars["--page-bg"]) cache.set(key, vars);
  return vars;
}

/** `var(--x)` zincirini aynı değişken kümesinde çözer (yalnızca düz başvuru). */
export function resolveVar(vars: Record<string, string>, name: string, depth = 0): string {
  const raw = vars[name] ?? "";
  const m = raw.match(/^var\((--[\w-]+)\)$/);
  if (m && depth < 6) return resolveVar(vars, m[1], depth + 1);
  return raw;
}

export function useThemeVars(theme: ThemeName, palette = "signature") {
  const [vars, setVars] = useState(() => readThemeVars(theme, palette));
  useEffect(() => {
    const next = readThemeVars(theme, palette);
    setVars(next);
    if (next["--page-bg"]) return;
    const id = window.setTimeout(() => setVars(readThemeVars(theme, palette)), 300);
    return () => window.clearTimeout(id);
  }, [theme, palette]);
  return vars;
}

/** Alt ağacı verilen temaya (ve palete) çevirir; zemini ve metin rengini de basar. */
export function ThemeScope({
  theme,
  palette = "signature",
  className,
  children,
  label,
}: {
  theme: ThemeName;
  palette?: string;
  className?: string;
  children: ReactNode;
  /** Ekran okuyucu ve göz için: "Açık tema". */
  label?: string;
}) {
  const vars = useThemeVars(theme, palette);
  const style = { ...vars, colorScheme: theme } as CSSProperties;
  return (
    <div
      style={style}
      data-scope-theme={theme}
      aria-label={label}
      role={label ? "group" : undefined}
      className={cn("bg-page text-body", className)}
    >
      {children}
    </div>
  );
}

/* --- Toolbar'ın canlı değeri: <html data-theme / data-palette> ------------- */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
  return () => observer.disconnect();
}

export function useRootAttr(name: "theme" | "palette", fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset[name] ?? fallback,
    () => fallback,
  );
}

/** Kökteki bir değişkenin şu anki (toolbar'a göre) değeri. */
export function useRootVar(name: string) {
  const theme = useRootAttr("theme", "light");
  const palette = useRootAttr("palette", "signature");
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name, theme, palette]);
  return value;
}
