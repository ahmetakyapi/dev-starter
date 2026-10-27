"use client";

import { ArrowUpRight, BatteryFull, Laptop, LoaderCircle, Lock, Maximize2, Moon, MousePointerClick, PencilLine, RotateCw, Signal, Smartphone, Sun, Wifi, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore, type Ref } from "react";
import type { PreviewBox } from "./preview-bridge";

/*
 * Canlı önizleme (rules/live-preview.md): sitenin GERÇEK sayfası, panelde yazılan taslakla,
 * gerçek ölçülü bir tarayıcı penceresinde (1440 × 900) ya da telefonda (390 × 844). Ekran
 * gerçek boyunda çizilir ve bulunduğu yere sığacak kadar küçültülür: düzen gerçek ekrandaki
 * gibi kalır. Cihaz ve tema tarayıcıda hatırlanır. Bölümün üzerine gelince çerçevesi ve adı
 * görünür; tıklayınca o bölümün alanları panelde açılır (onSelect).
 * Stiller: live-preview.css (token'lardan).
 */

export type SitePreviewHandle = {
  /** İçerik taslağı yazıldı: önizleme yeniden çizilsin */
  refresh: () => void;
  /** Görünüm değişkenleri (yazı tipi, punto): beklemeden uygulanır */
  vars: (vars: Record<string, string>) => void;
  /** Düzenlenen bölüme kay, çerçevesini tut */
  focus: (section: string, page?: string) => void;
  /** Tam ekran önizlemeyi aç (dar ekranda kaydet çubuğundaki "Önizle" düğmesinden) */
  expand: () => void;
};

export type PreviewView = {
  id: string;
  label: string;
  /** Önizleme rotasının adresi (previewSrc) */
  src: string;
  /** Sitedeki karşılığı (Sitede Aç) */
  href: string;
};

export type PreviewStatus = "live" | "draft" | "saving" | "invalid";

type Device = "desktop" | "mobile";
type Theme = "light" | "dark";
type Prefs = { device: Device; theme: Theme };

const DEVICES = {
  desktop: { label: "Masaüstü", width: 1440, height: 900, icon: Laptop },
  mobile: { label: "Telefon", width: 390, height: 844, icon: Smartphone },
} as const;
const BROWSER_BAR = 38;
const BEZEL = 9;
const PHONE_RADIUS = 54;
const SCREEN_RADIUS = 46;
// Yan sütunda masaüstü penceresi sütunun boyunu doldurur: ekranın en az bu kadarı görünür
const MIN_DESKTOP_H = 760;
// Telefonun durum çubuğu (saat, ada): sayfa onun altından başlar
const PHONE_STATUS = 47;
const RENDER_TIMEOUT_MS = 8000;
const WIDE_QUERY = "(min-width: 1280px)";

/* Tercihler: localStorage'da, yoksa (gizli pencere) bellekte */
const PREFS_KEY = "live-preview";
const DEFAULT_PREFS = '{"device":"desktop","theme":"light"}';
const prefListeners = new Set<() => void>();
let prefMemory = DEFAULT_PREFS;

function readPrefs() {
  try {
    return localStorage.getItem(PREFS_KEY) ?? prefMemory;
  } catch {
    return prefMemory;
  }
}
function subscribePrefs(listener: () => void) {
  prefListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    prefListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function parsePrefs(raw: string): Prefs {
  try {
    const value = JSON.parse(raw) as Partial<Prefs>;
    return { device: value.device === "mobile" ? "mobile" : "desktop", theme: value.theme === "dark" ? "dark" : "light" };
  } catch {
    return { device: "desktop", theme: "light" };
  }
}
function usePrefs(): [Prefs, (next: Partial<Prefs>) => void] {
  const raw = useSyncExternalStore(subscribePrefs, readPrefs, () => DEFAULT_PREFS);
  const prefs = useMemo(() => parsePrefs(raw), [raw]);
  const update = useCallback(
    (next: Partial<Prefs>) => {
      prefMemory = JSON.stringify({ ...prefs, ...next });
      try {
        localStorage.setItem(PREFS_KEY, prefMemory);
      } catch {
        // Gizli pencere: bellekteki değer yeter
      }
      prefListeners.forEach((listener) => listener());
    },
    [prefs],
  );
  return [prefs, update];
}

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
const useHost = () => useSyncExternalStore(noop, () => window.location.host, () => "");
function subscribeWide(listener: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => false);

type Boxes = { hover: PreviewBox | null; focus: PreviewBox | null };
type Props = {
  ref?: Ref<SitePreviewHandle>;
  views: PreviewView[];
  status: PreviewStatus;
  /** Yüklenirken ekranda bulanık duran görsel (kaydın kapağı) */
  cover?: string;
  /** Önizlemede tıklanan bölüm */
  onSelect?: (section: string, page: string) => void;
  hint?: string;
};

export function SitePreview({ ref, views, status, cover, onSelect, hint }: Props) {
  const [prefs, setPrefs] = usePrefs();
  const [viewId, setViewId] = useState(views[0]?.id);
  const view = views.find((v) => v.id === viewId) ?? views[0];
  const [readyHref, setReadyHref] = useState<string | null>(null);
  // Tema uygulandıktan sonra görünür: önizleme yanlış temada bir an bile görünmesin
  const [shownHref, setShownHref] = useState<string | null>(null);
  const wide = useWide();
  const [rendering, setRendering] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [boxes, setBoxes] = useState<Boxes>({ hover: null, focus: null });
  const [paint, setPaint] = useState<{ bg: string; ink: string } | null>(null);
  const mounted = useMounted();
  const host = useHost();

  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Çerçeve hazır değilken gelenler: hazır olunca gönderilir (vars yeniden yüklemede de korunur)
  const pending = useRef({ refresh: false, focus: null as { section: string; page?: string } | null, vars: {} as Record<string, string> });
  const renderTimer = useRef(0);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const ready = readyHref === view.src;

  const post = useCallback((message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const startRender = useCallback(() => {
    setRendering(true);
    window.clearTimeout(renderTimer.current);
    // Köprüden "bitti" haberi gelmezse durum göstergesi takılı kalmasın
    renderTimer.current = window.setTimeout(() => setRendering(false), RENDER_TIMEOUT_MS);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      refresh() {
        if (!ready) {
          pending.current.refresh = true;
          return;
        }
        startRender();
        post({ type: "lp:refresh" });
      },
      vars(vars) {
        pending.current.vars = vars;
        if (ready) post({ type: "lp:vars", vars });
      },
      focus(section, page) {
        pending.current.focus = { section, page };
        if (ready) post({ type: "lp:focus", section, page });
      },
      expand() {
        setExpanded(true);
      },
    }),
    [ready, post, startRender],
  );

  // Köprüden gelenler: yalnız kendi çerçevemizden
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const msg = event.data as { type?: string; href?: string; section?: string; page?: string; bg?: string; ink?: string } & Partial<Boxes>;
      if (msg.type === "lp:ready" && msg.href) {
        setReadyHref(msg.href);
      } else if (msg.type === "lp:rendered") {
        window.clearTimeout(renderTimer.current);
        setRendering(false);
      } else if (msg.type === "lp:boxes") {
        setBoxes({ hover: msg.hover ?? null, focus: msg.focus ?? null });
      } else if (msg.type === "lp:paint" && msg.bg && msg.ink) {
        setPaint({ bg: msg.bg, ink: msg.ink });
        setShownHref(frameRef.current?.getAttribute("src") ?? null);
      } else if (msg.type === "lp:select" && msg.section && msg.page) {
        setExpanded(false);
        onSelectRef.current?.(msg.section, msg.page);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Hazır olunca: görünüm değişkenleri, tema, bekleyen odak ve yenileme (sıra önemli: tema
  // en son paint üretir, panel önizlemeyi doğru yazı tipi ve temayla açar)
  useEffect(() => {
    if (!ready) return;
    post({ type: "lp:vars", vars: pending.current.vars });
    post({ type: "lp:theme", theme: prefs.theme });
  }, [ready, prefs.theme, post]);

  useEffect(() => {
    if (!ready) return;
    const { focus, refresh } = pending.current;
    if (focus) post({ type: "lp:focus", section: focus.section, page: focus.page });
    if (refresh) {
      pending.current.refresh = false;
      post({ type: "lp:refresh" });
    }
  }, [ready, post]);

  useEffect(() => () => window.clearTimeout(renderTimer.current), []);

  // Sahnenin ölçüsü: ekran buna göre küçülür
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Büyütülmüş görünüm: Esc kapatır, odak kapatma düğmesinde başlar ve geri döner
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();
    const expandButton = expandRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      expandButton?.focus({ preventScroll: true });
    };
  }, [expanded]);

  const device = DEVICES[prefs.device];
  const isMobile = prefs.device === "mobile";
  const layout = useMemo(() => {
    if (!stage.w) return null;
    if (isMobile) {
      const scale = Math.min(1, (stage.h - BEZEL * 2) / device.height, (stage.w - BEZEL * 2) / device.width);
      return { scale, width: device.width, height: device.height - PHONE_STATUS, top: PHONE_STATUS * scale };
    }
    const scale = Math.min(1, stage.w / device.width);
    // Dar düzende gerçek oranlı pencere; yan sütunda ve büyütünce sahneyi doldurur
    if (!expanded && !wide) return { scale, width: device.width, height: device.height, top: 0 };
    const height = Math.max(MIN_DESKTOP_H, (stage.h - BROWSER_BAR) / scale);
    return { scale, width: expanded ? stage.w / scale : device.width, height, top: 0 };
  }, [stage, isMobile, expanded, wide, device]);

  const resetFrame = () => {
    setReadyHref(null);
    setShownHref(null);
    setBoxes({ hover: null, focus: null });
  };
  const selectView = (id: string) => {
    if (id === viewId) return;
    setViewId(id);
    resetFrame();
  };
  const reload = () => {
    resetFrame();
    frameRef.current?.contentWindow?.location.reload();
  };

  const busy = status === "saving" || rendering;
  const badge = busy
    ? { tone: "busy", text: "Güncelleniyor" }
    : status === "invalid"
      ? { tone: "error", text: "Hatalı Alan Var" }
      : status === "draft"
        ? { tone: "draft", text: "Kaydedilmemiş" }
        : { tone: "live", text: "Yayındaki Hâli" };

  const screen = layout ? { w: layout.width * layout.scale, h: layout.height * layout.scale + layout.top } : null;
  const path = view.href === "/" ? "" : view.href;
  const shown = ready && shownHref === view.src;

  return (
    <section className="lp-root" data-expanded={expanded || undefined} aria-label="Canlı önizleme">
      <div className="lp-toolbar">
        <div className="flex shrink-0 items-center gap-2.5">
          <p className="lp-eyebrow">{expanded ? "Önizleme" : "Canlı Önizleme"}</p>
          <span className="lp-status" data-state={badge.tone} role="status">
            {badge.tone === "busy" ? <LoaderCircle aria-hidden className="lp-spin" /> : <span aria-hidden className="lp-dot" />}
            {badge.text}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="lp-seg" role="group" aria-label="Cihaz">
            {(Object.keys(DEVICES) as Device[]).map((key) => {
              const Icon = DEVICES[key].icon;
              return (
                <button key={key} type="button" aria-pressed={prefs.device === key} aria-label={DEVICES[key].label} title={DEVICES[key].label} onClick={() => setPrefs({ device: key })}>
                  <Icon aria-hidden />
                </button>
              );
            })}
          </div>
          <div className="lp-seg" role="group" aria-label="Tema">
            <button type="button" aria-pressed={prefs.theme === "light"} aria-label="Açık Tema" title="Açık Tema" onClick={() => setPrefs({ theme: "light" })}>
              <Sun aria-hidden />
            </button>
            <button type="button" aria-pressed={prefs.theme === "dark"} aria-label="Koyu Tema" title="Koyu Tema" onClick={() => setPrefs({ theme: "dark" })}>
              <Moon aria-hidden />
            </button>
          </div>
          <button type="button" onClick={reload} aria-label="Önizlemeyi Yeniden Yükle" title="Yeniden Yükle" className="lp-icon">
            <RotateCw aria-hidden />
          </button>
          {expanded ? (
            <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label="Küçült" title="Küçült (Esc)" className="lp-icon lp-close">
              <X aria-hidden />
            </button>
          ) : (
            <button ref={expandRef} type="button" onClick={() => setExpanded(true)} aria-label="Büyüt" title="Büyüt" className="lp-icon">
              <Maximize2 aria-hidden />
            </button>
          )}
        </div>
      </div>

      {views.length > 1 ? (
        <div role="tablist" aria-label="Önizlenen sayfa" className="lp-views">
          {views.map((v) => (
            <button key={v.id} type="button" role="tab" aria-selected={v.id === view.id} onClick={() => selectView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={stageRef} className="lp-stage" data-device={prefs.device} data-theme-preview={prefs.theme} data-fill={(wide && !expanded) || undefined}>
        {mounted && layout && screen ? (
          <div
            className={isMobile ? "lp-phone" : "lp-browser"}
            style={
              isMobile
                ? { width: screen.w + BEZEL * 2, height: screen.h + BEZEL * 2, padding: BEZEL, borderRadius: PHONE_RADIUS * layout.scale + BEZEL }
                : { width: screen.w }
            }
          >
            {isMobile ? null : (
              <div className="lp-bar" style={{ height: BROWSER_BAR }}>
                <span aria-hidden className="lp-lights">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="lp-url">
                  <Lock aria-hidden />
                  <span className="truncate">
                    {host}
                    <span className="text-muted">{path}</span>
                  </span>
                </span>
                <a href={view.href} target="_blank" rel="noreferrer" className="lp-open" title="Sitede Aç">
                  <span className="sr-only">Sitede Aç</span>
                  <ArrowUpRight aria-hidden />
                </a>
              </div>
            )}
            <div className="lp-screen" style={{ width: screen.w, height: screen.h, borderRadius: isMobile ? SCREEN_RADIUS * layout.scale : undefined }}>
              {isMobile ? (
                <div aria-hidden className="lp-statusbar" style={{ height: layout.top, background: paint?.bg, color: paint?.ink, fontSize: 15 * layout.scale, paddingInline: 30 * layout.scale }}>
                  <span>9:41</span>
                  <span className="lp-statusbar-icons" style={{ gap: 5 * layout.scale }}>
                    <Signal style={{ width: 16 * layout.scale, height: 16 * layout.scale }} />
                    <Wifi style={{ width: 16 * layout.scale, height: 16 * layout.scale }} />
                    <BatteryFull style={{ width: 22 * layout.scale, height: 22 * layout.scale }} />
                  </span>
                </div>
              ) : null}
              <iframe
                ref={frameRef}
                src={view.src}
                title={`${view.label} önizlemesi`}
                data-ready={shown || undefined}
                style={{ top: layout.top, width: layout.width, height: layout.height, transform: `scale(${layout.scale})` }}
              />
              {/* Yüklenirken: kaydın görseli bulanık, üstünde sakin bir not */}
              <div className="lp-loading" data-hidden={shown || undefined} aria-hidden={ready}>
                {cover ? <Image src={cover} alt="" fill sizes="40vw" className="object-cover" /> : null}
                <span className="lp-loading-note">
                  <LoaderCircle aria-hidden className="lp-spin" />
                  Önizleme Hazırlanıyor
                </span>
              </div>
              {ready ? <Overlay boxes={boxes} scale={layout.scale} top={layout.top} height={layout.height * layout.scale} /> : null}
              {isMobile ? (
                <>
                  <span aria-hidden className="lp-island" style={{ width: 118 * layout.scale, height: 34 * layout.scale, top: 11 * layout.scale }} />
                  <span aria-hidden className="lp-home" style={{ width: 134 * layout.scale, height: Math.max(3, 5 * layout.scale), bottom: 8 * layout.scale }} />
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="lp-placeholder" aria-hidden />
        )}
      </div>

      <p className="lp-hint">
        <MousePointerClick aria-hidden />
        {hint ?? "Önizlemede bir bölüme tıkla, alanları açılsın. Yazdıkça güncellenir; Kaydet'e basınca sitede yayınlanır."}
        {isMobile ? (
          <a href={view.href} target="_blank" rel="noreferrer" className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-strong hover:underline">
            Sitede Aç
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        ) : null}
      </p>
    </section>
  );
}

/** Üzerine gelinen ve düzenlenen bölümün çerçevesi: panel ölçeğinde çizilir, adı okunaklı kalır. */
function Overlay({ boxes, scale, top, height }: { boxes: Boxes; scale: number; top: number; height: number }) {
  const same = boxes.hover && boxes.focus && boxes.hover.section === boxes.focus.section && boxes.hover.page === boxes.focus.page;
  return (
    <div className="lp-overlay" aria-hidden style={{ top, height }}>
      {boxes.focus ? <Frame box={boxes.focus} scale={scale} height={height} kind="focus" /> : null}
      {boxes.hover && !same ? <Frame box={boxes.hover} scale={scale} height={height} kind="hover" /> : null}
    </div>
  );
}

const CHIP_GAP = 10;
const CHIP_H = 30;
const CHIP_LIFT = 6;

function Frame({ box, scale, height, kind }: { box: PreviewBox; scale: number; height: number; kind: "hover" | "focus" }) {
  const top = box.y * scale;
  const h = box.h * scale;
  if (top > height || top + h < 0) return null;
  // Ad etiketi içeriği örtmez: bölümün üst kenarının üstünde, yer yoksa alt kenarının altında,
  // o da yoksa (ekranı dolduran bölüm) içeride, görünen üst kenara yapışık
  const above = top - CHIP_H - CHIP_LIFT;
  const below = top + h + CHIP_LIFT;
  const outside = above >= CHIP_LIFT ? above : below + CHIP_H <= height - CHIP_LIFT ? below : null;
  const chipTop = outside ?? Math.min(Math.max(top, 0) + CHIP_GAP, Math.max(CHIP_GAP, top + h - CHIP_H - CHIP_GAP));
  return (
    <>
      <span className="lp-frame" data-kind={kind} style={{ left: box.x * scale, top, width: box.w * scale, height: h, borderRadius: box.r * scale }} />
      <span className="lp-chip" data-kind={kind} style={{ left: Math.max(box.x * scale, 0) + (outside === null ? CHIP_GAP : 0), top: chipTop }}>
        {kind === "focus" ? <PencilLine aria-hidden /> : <MousePointerClick aria-hidden />}
        <span className="truncate">{box.label}</span>
      </span>
    </>
  );
}
