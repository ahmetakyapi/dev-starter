"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

/*
 * Canlı önizlemenin köprüsü: yalnız önizleme rotasında, sayfanın içinde çizilir. Düzenleyiciyle
 * aynı kökenden postMessage ile konuşur (rules/live-preview.md):
 *   gelen  lp:refresh  taslak değişti: sayfa tam yüklenmeden yeniden çizilir, kaydırma yerinde
 *          lp:theme    açık/koyu tema (data-theme)
 *          lp:vars     CSS değişkenleri: yazı tipi, punto, renk; sunucuya gitmeden anında
 *          lp:focus    düzenlenen bölüme kay, çerçevesini tut (lp:blur bırakır)
 *   giden  lp:ready, lp:rendered (yeniden çizim bitti), lp:select (tıklanan bölüm),
 *          lp:paint (zemin ve yazı rengi; panel önizlemeyi ancak bundan sonra gösterir),
 *          lp:boxes (üzerine gelinen ve düzenlenen bölümün kutusu: çerçeveyi panel çizer)
 * Bölümler sayfada data-edit="<alan-grubu>" ile işaretlenir; başka sayfanın metnini taşıyan
 * bölüm (ör. sayfa sonu) data-edit-page="<sayfa>" alır. Önizlemede tıklamak gezinmez, form
 * göndermez: tıklanan bölüm panelde açılır.
 * rootClassName: yalnız önizlemede yüklenen yazı tipi seçeneklerinin next/font sınıfları. Köke
 * eklenir; lp:vars de köke yazıldığı için var(--font-opt-*) orada çözülür (README § 6).
 */

export type PreviewLabels = Record<string, { title: string; sections: Record<string, string> }>;

export type PreviewBox = { section: string; page: string; label: string; x: number; y: number; w: number; h: number; r: number };

type Incoming =
  | { type: "lp:refresh" }
  | { type: "lp:theme"; theme: "light" | "dark" }
  | { type: "lp:vars"; vars: Record<string, string> }
  | { type: "lp:focus"; section: string; page?: string }
  | { type: "lp:blur" };

const SCROLL_GAP = 24;
// Açılış hareketleri bir kez oynar; sonra yazdıkça eklenen öğe beklemeden görünür (README § 5)
const SETTLE_MS = 1800;
const CUSTOM_PROPERTY = /^--[a-z0-9-]+$/i;

/** labels JSON olarak gelir: yeniden çizimde nesne kimliği değişse de etki yeniden kurulmaz. */
type Props = { page: string; labels: string; focus?: string; rootClassName?: string };

export function PreviewBridge({ page, labels: labelsJson, focus, rootClassName }: Props) {
  const router = useRouter();
  const [rendering, startRendering] = useTransition();

  useEffect(() => {
    if (!rendering) post({ type: "lp:rendered" });
  }, [rendering]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.preview = "";
    const rootClasses = rootClassName?.split(/\s+/).filter(Boolean) ?? [];
    root.classList.add(...rootClasses);
    const labels = JSON.parse(labelsJson) as PreviewLabels;
    const appliedVars = new Set<string>();

    const ownerOf = (el: HTMLElement) => el.dataset.editPage ?? page;
    const labelOf = (section: string, owner: string) => {
      const name = labels[owner]?.sections[section] ?? section;
      return owner === page ? name : `${labels[owner]?.title ?? owner} · ${name}`;
    };
    const find = (section: string, owner: string) =>
      [...document.querySelectorAll<HTMLElement>(`[data-edit="${CSS.escape(section)}"]`)].find((el) => ownerOf(el) === owner) ?? null;

    const boxOf = (el: HTMLElement | null): PreviewBox | null => {
      if (!el?.isConnected) return null;
      const rect = el.getBoundingClientRect();
      const section = el.dataset.edit ?? "";
      const owner = ownerOf(el);
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      return { section, page: owner, label: labelOf(section, owner), x: rect.left, y: rect.top, w: rect.width, h: rect.height, r };
    };

    // Telefonun durum çubuğu sayfanın zeminini ve yazı rengini alır
    const paint = () => {
      const style = getComputedStyle(document.body);
      post({ type: "lp:paint", bg: style.backgroundColor, ink: style.color });
    };

    let hovered: HTMLElement | null = null;
    let focused: { section: string; page: string } | null = focus ? { section: focus, page } : null;
    let frame = 0;
    const report = () => {
      frame = 0;
      post({ type: "lp:boxes", hover: boxOf(hovered), focus: focused ? boxOf(find(focused.section, focused.page)) : null });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(report);
    };

    const scrollToSection = (el: HTMLElement, instant = false) => {
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_GAP;
      window.scrollTo({ top: Math.max(0, top), behavior: instant ? "instant" : "smooth" });
    };

    const onMessage = (event: MessageEvent<Incoming>) => {
      if (event.origin !== window.location.origin || typeof event.data !== "object" || event.data === null) return;
      const msg = event.data;
      if (msg.type === "lp:refresh") startRendering(() => router.refresh());
      else if (msg.type === "lp:theme") {
        root.dataset.theme = msg.theme;
        root.style.colorScheme = msg.theme;
        paint();
        schedule();
      } else if (msg.type === "lp:vars") {
        // Yalnız özel değişken: önizleme bir stil enjeksiyon kapısına dönmez
        for (const name of appliedVars) if (!(name in msg.vars)) root.style.removeProperty(name);
        appliedVars.clear();
        for (const [name, value] of Object.entries(msg.vars)) {
          if (!CUSTOM_PROPERTY.test(name) || typeof value !== "string") continue;
          root.style.setProperty(name, value);
          appliedVars.add(name);
        }
        paint();
        schedule();
      } else if (msg.type === "lp:focus") {
        const owner = msg.page ?? page;
        const el = find(msg.section, owner);
        const same = focused?.section === msg.section && focused.page === owner;
        focused = { section: msg.section, page: owner };
        // Aynı bölümde alandan alana geçerken sayfa yerinde kalır
        if (el && !same) scrollToSection(el);
        schedule();
      } else if (msg.type === "lp:blur") {
        focused = null;
        schedule();
      }
    };

    const sectionAt = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>("[data-edit]") : null);
    const onOver = (event: PointerEvent) => {
      const el = sectionAt(event.target);
      if (el !== hovered) {
        hovered = el;
        schedule();
      }
    };
    const onLeave = () => {
      hovered = null;
      schedule();
    };
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const el = sectionAt(event.target);
      if (!el) return;
      focused = { section: el.dataset.edit ?? "", page: ownerOf(el) };
      post({ type: "lp:select", section: focused.section, page: focused.page });
      schedule();
    };
    const block = (event: Event) => event.preventDefault();

    // Yeniden çizimden, yazı tipi değişiminden ya da görsel yüklenmesinden sonra kutular taşınır
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    document.fonts?.addEventListener("loadingdone", schedule);

    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", block, true);
    document.addEventListener("auxclick", block, true);

    const initial = focus ? find(focus, page) : null;
    const start = requestAnimationFrame(() => {
      if (initial) scrollToSection(initial, true);
      post({ type: "lp:ready", href: window.location.pathname + window.location.search });
      schedule();
    });
    const settle = window.setTimeout(() => (root.dataset.previewSettled = ""), SETTLE_MS);

    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
      resize.disconnect();
      document.fonts?.removeEventListener("loadingdone", schedule);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", block, true);
      document.removeEventListener("auxclick", block, true);
      for (const name of appliedVars) root.style.removeProperty(name);
      root.classList.remove(...rootClasses);
      delete root.dataset.preview;
      delete root.dataset.previewSettled;
    };
  }, [page, labelsJson, focus, rootClassName, router]);

  return null;
}

function post(message: Record<string, unknown>) {
  if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
}
