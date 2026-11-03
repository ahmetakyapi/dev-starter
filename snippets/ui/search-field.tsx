"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Arama alanı: liste süzme, tablo içi arama, üst çubukta site araması.
 * Yazdıkça GECİKMELİ `onSearch` (varsayılan 250 ms), istek sürerken dönen
 * gösterge, temizle düğmesi ve sayfa geneli kısayol ("/" ya da ⌘K).
 * Sonuçları açılır listede seçtirmek gerekiyorsa `combobox.tsx`; komut
 * çalıştırmak içinse `command-palette.tsx`. Sıradan metin için `input.tsx`.
 *
 * GECİKME NEDEN: her tuşta istek atmak sunucuyu yorar, sonuçları da
 * titretir. `onValueChange` her tuşta (alanın kendisi için), `onSearch`
 * yazma durunca ve Enter'da HEMEN gelir. Boşluklar kırpılır; aynı sorgu
 * iki kez gönderilmez.
 *
 * KISAYOL: `shortcut="/"` (GitHub, YouTube alışkanlığı) metin alanında
 * yazarken tetiklenmez; `"mod+k"` Mac'te ⌘K, diğerlerinde Ctrl+K gösterir
 * ve her yerde çalışır. İpucu yalnız ince işaretçide görünür (dokunmatikte
 * klavye yok); kısayol `aria-keyshortcuts` ile ekran okuyucuya da söylenir.
 * Sayfada ⌘K komut paleti varsa buraya "/" ver, ikisi çakışmasın.
 *
 * ESCAPE: değer varsa temizler, boşsa odağı bırakır. Yükleniyorken kısayol
 * ipucunun yerinde dönen gösterge; durum ve sonuç sayısı (`resultCount`)
 * sabit bir canlı bölgede ("12 sonuç"), tuş başına değil sonuç gelince.
 *
 * TÜRKÇE ARAMA: `toLowerCase()` "İstanbul"u "i̇stanbul" (noktalı i + birleşen
 * nokta) yapar ve "istanbul" ile eşleşmez; "IŞIK" da "işik" olur.
 * `normalizeTr` `tr-TR` yerel ayarıyla küçültür; `fold: true` ç/ğ/ı/ö/ş/ü'yü
 * düz harfe indirger ("cankaya" → "Çankaya" bulunur). Uzunluk değişmez,
 * bu yüzden `HighlightMatch` eşleşmeyi doğru yerde boyar.
 * Bu dosya "use client": yardımcılar sunucu bileşeninden çağrılacaksa
 * (sunucuda süzme) onları `lib/tr-search.ts`e taşı; istemci modülünden
 * dışa aktarılan fonksiyon sunucuda gerçek değer olarak gelmez.
 *
 *   <SearchField label="Müşteri Ara" shortcut="/" loading={isPending}
 *     resultCount={rows.length} onSearch={(q) => startTransition(() => setQuery(q))} />
 */

const FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Türkçe kurallarıyla küçültür; `fold` ile aksanları da düzler. Uzunluk korunur. */
export function normalizeTr(text: string, { fold = false }: { fold?: boolean } = {}) {
  const lower = text.toLocaleLowerCase("tr-TR");
  return fold ? lower.replace(/[çğıöşüâîû]/g, (char) => FOLD[char] ?? char) : lower;
}

/** Büyük/küçük harf (ve istenirse aksan) duyarsız "içeriyor mu". */
export function matchesTr(text: string, query: string, options?: { fold?: boolean }) {
  const q = normalizeTr(query.trim(), options);
  return q === "" || normalizeTr(text, options).includes(q);
}

/** Metni eşleşen ve eşleşmeyen parçalara böler (ilk eşleşme değil, hepsi). */
export function splitMatchTr(text: string, query: string, options?: { fold?: boolean }) {
  const q = normalizeTr(query.trim(), options);
  if (!q) return [{ text, match: false }];
  const haystack = normalizeTr(text, options);
  const parts: { text: string; match: boolean }[] = [];
  let from = 0;
  for (let at = haystack.indexOf(q); at !== -1; at = haystack.indexOf(q, at + q.length)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + q.length), match: true });
    from = at + q.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}

/** Sonuç satırında eşleşen parçayı vurgular (`<mark>`, wash zemin). */
export function HighlightMatch({ text, query, fold }: { text: string; query: string; fold?: boolean }) {
  return (
    <>
      {splitMatchTr(text, query, { fold }).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-[0.25rem] bg-primary-wash text-strong">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

/* Mac mi? Sunucuda bilinmez: ilk çizim "Ctrl", istemcide düzelir (hidrasyon uyumlu). */
const subscribeNoop = () => () => {};
function useIsMac() {
  return useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

const SIZES = {
  sm: { box: "h-11 pointer-fine:h-9 px-2.5 gap-2", text: "text-small" },
  md: { box: "h-11 pointer-fine:h-10 px-3 gap-2", text: "text-base" },
} as const;

type SearchFieldProps = {
  /** Alanın adı; görünmez, ekran okuyucu okur. */
  label?: string;
  /** Etiketi göster (form içinde). */
  showLabel?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  /** Her tuşta. */
  onValueChange?: (value: string) => void;
  /** Yazma durunca (ve Enter'da) kırpılmış sorgu. */
  onSearch?: (query: string) => void;
  /** Milisaniye. */
  debounce?: number;
  loading?: boolean;
  /** Verilirse yükleme bitince canlı bölgede "N sonuç" okunur. */
  resultCount?: number;
  shortcut?: "/" | "mod+k" | null;
  size?: keyof typeof SIZES;
  /** Kabı `role="search"` işaret noktası yap (sayfanın ana araması). */
  landmark?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
  /** Alanın altında yardım metni. */
  hint?: ReactNode;
};

export function SearchField({
  label = "Ara",
  showLabel = false,
  placeholder = "Ara",
  value,
  defaultValue = "",
  onValueChange,
  onSearch,
  debounce = 250,
  loading = false,
  resultCount,
  shortcut = "/",
  size = "md",
  landmark = false,
  name,
  disabled,
  className,
  hint,
}: SearchFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(defaultValue.trim());
  const onSearchRef = useRef(onSearch);
  const [inner, setInner] = useState(defaultValue);
  const current = value === undefined ? inner : value;
  const isMac = useIsMac();
  const s = SIZES[size];

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Sayfa geneli kısayol.
  useEffect(() => {
    if (!shortcut || disabled) return;
    function onKey(event: KeyboardEvent) {
      const input = ref.current;
      if (!input || event.defaultPrevented) return;
      const hit =
        shortcut === "/"
          ? event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)
          : event.key.toLocaleLowerCase("tr-TR") === "k" && (event.metaKey || event.ctrlKey) && !event.altKey;
      if (!hit) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, disabled]);

  function send(next: string, now = false) {
    if (timer.current) clearTimeout(timer.current);
    const query = next.trim();
    const fire = () => {
      if (query === lastSent.current) return;
      lastSent.current = query;
      onSearchRef.current?.(query);
    };
    if (now || debounce <= 0) fire();
    else timer.current = setTimeout(fire, debounce);
  }

  function update(next: string, now = false) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
    send(next, now);
  }

  const keys = shortcut === "/" ? ["/"] : shortcut === "mod+k" ? [isMac ? "⌘" : "Ctrl", "K"] : [];
  const ariaShortcut = shortcut === "/" ? "/" : shortcut === "mod+k" ? "Meta+K Control+K" : undefined;
  const status = loading ? "Aranıyor" : resultCount === undefined || !current.trim() ? "" : resultCount === 0 ? "Sonuç bulunamadı" : `${resultCount.toLocaleString("tr-TR")} sonuç`;

  return (
    <div role={landmark ? "search" : undefined} aria-label={landmark ? label : undefined} className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-small font-semibold text-strong", !showLabel && "sr-only")}>
        {label}
      </label>
      <div
        onPointerDown={(event) => {
          if (event.target === ref.current || (event.target as HTMLElement).closest("button")) return;
          event.preventDefault();
          ref.current?.focus();
        }}
        className={cn(
          "flex w-full min-w-0 cursor-text items-center rounded-md border border-line-strong bg-surface-sunken shadow-well transition-[color,background-color,border-color,box-shadow]",
          "hover:border-primary-soft has-[input:focus-visible]:border-line-focus has-[input:focus-visible]:shadow-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-line-focus",
          s.box,
          disabled && "cursor-not-allowed opacity-50 hover:border-line-strong",
        )}
      >
        <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={2.25} />
        <input
          ref={ref}
          id={id}
          type="search"
          name={name}
          value={current}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-keyshortcuts={ariaShortcut}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => update(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              send(current, true);
            } else if (event.key === "Escape") {
              if (current) {
                event.preventDefault();
                update("", true);
              } else {
                ref.current?.blur();
              }
            }
          }}
          className={cn(
            s.text,
            "h-full min-w-0 flex-1 bg-transparent text-strong outline-none placeholder:text-muted disabled:cursor-not-allowed",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          )}
        />
        {loading ? <Spinner size="sm" tone="muted" label={null} /> : null}
        {current ? (
          <button
            type="button"
            aria-label="Aramayı Temizle"
            disabled={disabled}
            onClick={() => {
              update("", true);
              ref.current?.focus();
            }}
            className="relative grid size-7 shrink-0 place-items-center rounded-sm text-muted transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-overlay hover:text-strong focus-visible:outline-offset-0 pointer-fine:before:hidden"
          >
            <X aria-hidden className="size-4" strokeWidth={2.25} />
          </button>
        ) : keys.length && !loading ? (
          <span aria-hidden className="hidden shrink-0 items-center gap-1 pointer-fine:inline-flex">
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}
