"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cetvel içindekiler: uzun bir akışın (portfolyo, vaka çalışması, uzun
 * yazı) sol kenarında sabit duran ince çizgi cetveli. Her bölüm bir yatay
 * çizgi; dinlenmede neredeyse yok (10 px), okunan bölümün çizgisi uzun ve
 * koyu. İmleç cetvelin üstünde gezinince imlecin altındaki çizgiler çan
 * eğrisiyle uzar, komşular azalarak eşlik eder: "tümsek" imleçle süzülür,
 * satırdan satıra sıçramaz; imleç çıkınca yaylanarak geri çöker.
 *
 * NE ZAMAN DEĞİL: 4'ten az bölüm (gürültü), ayarlar/belge gibi bölüm adının
 * hep görünmesi gereken sayfa (`toc-nav`: yazılı hap), uygulama gezinmesi
 * (`app-shell`). Adlar yalnız balonda görünür; cetvel keşif içindir, tek
 * gezinme yolu olmamalı.
 *
 * NASIL ÇALIŞIR
 * - Satır aralığı 24 px. İmlecin satır cinsinden konumu `y`; her satırın
 *   hedef çekişi `exp(-((i - y) / w)²)`, `w = 0.6 + reach/100 × 2.4`. Çekiş
 *   rAF döngüsünde hedefe yaklaşır (yay); döngü yalnız hareket sürerken
 *   çalışır, değerler doğrudan öğeye yazılır (React yeniden çizmez).
 * - Okunan bölüm `IntersectionObserver` ile (görüş alanının üst %40'ına
 *   giren son bölüm); kaydırma dinleyicisi yok.
 * - Satırın üstüne gelince/odakta balon: "01 · Bölüm adı" + isteğe önizleme.
 * - Tıklama bölüme kaydırır (hareket azaltmada anında), odak bölüme geçer
 *   (`tabIndex=-1` eklenir), adres `#id` olur.
 * - Dar ekranda (< md) cetvel yerine köşede kompakt buton: "01 Hoş geldin"
 *   → açılır liste; dışarı tık ve Escape kapatır, odak butona döner.
 *
 * ERİŞİLEBİLİRLİK: `nav` + `aria-label`; her satır gerçek bağlantı, adı
 * bölüm adı (balon `aria-hidden` görsel kopya). Okunan bölüm
 * `aria-current="location"`. Dar ekran butonunun adı görünen metinden ("01 Hoş geldin", gizli ek ", Bu Sayfada"); `aria-expanded` +
 * `aria-controls`. Hareket azaltmada tümsek anında, yaysız.
 *
 * Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod alınmadı.
 *
 *   <RulerToc sections={[{ id: "giris", label: "Hoş geldin" }, { id: "isler", label: "İşler" }, …]} />
 */

export type RulerSection = { id: string; label: string; preview?: ReactNode };

const ROW = 24;
const BASE = 10;

const CSS = `
.ui-rt-row { height: ${ROW}px; }
.ui-rt-line { width: var(--len, ${BASE}px); height: 1.5px; border-radius: 1px; background: var(--color-line-strong); transition: background-color 200ms ease; }
.ui-rt-row[aria-current] .ui-rt-line { background: var(--color-strong); }
.ui-rt-tip { opacity: 0; translate: -4px 0; pointer-events: none; transition: opacity 160ms ease, translate 220ms var(--ease-brand); }
.ui-rt-row:focus-visible .ui-rt-tip { opacity: 1; translate: 0 0; }
@media (hover: hover) { .ui-rt-row:hover .ui-rt-tip { opacity: 1; translate: 0 0; transition-delay: 60ms; } }
@media (prefers-reduced-motion: reduce) { .ui-rt-tip { transition: opacity 120ms ease; translate: 0 0; } }`;

type RulerTocProps = {
  sections: readonly RulerSection[];
  label?: string;
  /** Tümseğin yayılması, 0-100 (satır cinsinden genişlik). */
  reach?: number;
  /** Çizginin en çok uzaması, px. */
  length?: number;
  /** `fixed`: sol kenarda sabit (sayfa). `inline`: bulunduğu yerde (vitrin, hikaye). */
  placement?: "fixed" | "inline";
  className?: string;
};

const pad = (n: number) => String(n + 1).padStart(2, "0");

export function RulerToc({
  sections,
  label = "Bu Sayfada",
  reach = 50,
  length = 16,
  placement = "fixed",
  className,
}: RulerTocProps) {
  const [active, setActive] = useState(sections[0]?.id);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const mobile = useRef<HTMLDivElement>(null);
  const state = useRef({ y: null as number | null, pull: new Float32Array(sections.length), raf: 0 });
  const activeIdx = Math.max(0, sections.findIndex((s) => s.id === active));

  const draw = useCallback(() => {
    const { pull } = state.current;
    rows.current.forEach((el, i) => {
      if (!el) return;
      const p = Math.max(pull[i] ?? 0, i === activeIdx ? 0.85 : 0);
      el.style.setProperty("--len", `${(BASE + p * length).toFixed(1)}px`);
    });
  }, [activeIdx, length]);

  const run = useCallback(() => {
    const s = state.current;
    if (s.raf) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = 0.6 + (reach / 100) * 2.4;
    const tick = () => {
      let moving = false;
      for (let i = 0; i < s.pull.length; i++) {
        const target = s.y === null ? 0 : Math.exp(-(((i - s.y) / width) ** 2));
        const next = reduce ? target : s.pull[i]! + (target - s.pull[i]!) * 0.2;
        if (Math.abs(target - next) > 0.002) {
          s.pull[i] = next;
          moving = true;
        } else s.pull[i] = target;
      }
      draw();
      s.raf = moving ? requestAnimationFrame(tick) : 0;
    };
    s.raf = requestAnimationFrame(tick);
  }, [draw, reach]);

  useEffect(() => draw(), [draw]);
  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);

  // Okunan bölüm: üst %40'a giren son bölüm.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const pick = () => {
      const line = innerHeight * 0.4;
      let current = els[0]!.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    const io = new IntersectionObserver(pick, { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] });
    els.forEach((el) => io.observe(el));
    pick();
    return () => io.disconnect();
  }, [sections]);

  // Dar ekran listesi: dışarı tık ve Escape.
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!mobile.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    addEventListener("pointerdown", down);
    addEventListener("keydown", key);
    return () => {
      removeEventListener("pointerdown", down);
      removeEventListener("keydown", key);
    };
  }, [open]);

  function go(e: MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
    setOpen(false);
  }

  const fixed = placement === "fixed";
  const current = sections[activeIdx];

  return (
    <>
      <style href="ui-ruler-toc" precedence="default">
        {CSS}
      </style>
      <nav
        aria-label={label}
        className={cn(fixed ? "fixed top-1/2 left-4 z-30 -translate-y-1/2" : "relative", "max-md:hidden", className)}
      >
        <ol
          ref={list}
          className="m-0 list-none p-0 py-3"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const top = list.current!.getBoundingClientRect().top + 12;
            state.current.y = (e.clientY - top) / ROW - 0.5;
            run();
          }}
          onPointerLeave={() => {
            state.current.y = null;
            run();
          }}
        >
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                ref={(el) => {
                  rows.current[i] = el;
                }}
                href={`#${s.id}`}
                onClick={(e) => go(e, s.id)}
                onFocus={() => {
                  state.current.y = i;
                  run();
                }}
                onBlur={() => {
                  state.current.y = null;
                  run();
                }}
                aria-current={s.id === active ? "location" : undefined}
                className="ui-rt-row relative flex w-12 items-center rounded-sm pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
              >
                <span className="ui-rt-line block" aria-hidden />
                <span className="sr-only">{s.label}</span>
                <span
                  aria-hidden
                  className="ui-rt-tip absolute top-1/2 left-[calc(var(--len,10px)+1rem)] z-10 w-max max-w-64 -translate-y-1/2 rounded-lg bg-overlay px-2.5 py-1.5 text-small shadow-floating ring-1 ring-line-soft"
                >
                  <span className="flex items-baseline gap-2 whitespace-nowrap">
                    <span className="font-mono text-micro text-soft tabular-nums">{pad(i)}</span>
                    <span className="font-medium text-strong">{s.label}</span>
                  </span>
                  {s.preview && <span className="mt-1.5 block overflow-hidden rounded-md">{s.preview}</span>}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div ref={mobile} className={cn(fixed ? "fixed bottom-4 left-4 z-30" : "relative", "md:hidden", className)}>
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-overlay px-4 text-small shadow-floating ring-1 ring-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
        >
          <span aria-hidden className="h-px w-3 bg-strong" />
          {/* Ad görünen metinden gelir ("01 Hoş geldin"), ardından gizli bağlam: WCAG 2.5.3. */}
          <span className="font-mono text-micro text-soft tabular-nums">{pad(activeIdx)}</span>{" "}
          <span className="font-medium text-strong">{current?.label}</span>
          <span className="sr-only">, {label}</span>
          <ChevronDown aria-hidden className={cn("size-3.5 text-muted transition-transform", open && "rotate-180")} />
        </button>
        <nav aria-label={label} id={listId} hidden={!open}>
          <ol className="absolute bottom-full left-0 mb-2 grid w-56 list-none gap-0.5 rounded-xl bg-overlay p-1.5 shadow-floating ring-1 ring-line-soft">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => go(e, s.id)}
                  aria-current={s.id === active ? "location" : undefined}
                  className="flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-small text-muted hover:bg-surface aria-[current]:text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
                >
                  <span className="font-mono text-micro text-soft tabular-nums">{pad(i)}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
}
