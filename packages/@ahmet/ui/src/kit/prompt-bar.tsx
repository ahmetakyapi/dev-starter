// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Niyet çubuğu: kahramanın ortasında yüzen hap. Arama ikonu, tek satır
 * giriş, isteğe bağlı küçük seçim hapı ("2 Misafir"), koyu gönder hapı;
 * gönderin altından kısa bir vurgu yayı uzanır. Altında kapsam çipleri:
 * açık olan dolu ve "×" taşır, kapalılar soluk ve "+". Konaklama, etkinlik,
 * iş ilanı, yapay zeka planlayıcısı: ziyaretçinin ilk cümlesi sayfanın
 * birincil eylemiyken.
 *
 * NE ZAMAN DEĞİL: çok satırlı sohbet girişi (`chat-composer`), sayfa
 * içinde süzme (`search-bar`, `filter-sheet`), birden çok zorunlu alanlı
 * rezervasyon formu (tarih, kişi, oda: gerçek form). Kapsam çipleri yön
 * verir, filtre paneli değildir: üç-beş tane.
 *
 * NASIL: `<form role="search">`; Enter gönderir. `onSubmit` verilirse
 * istemcide çağrılır; verilmezse form YEREL olarak `action` adresine gider
 * (`name`, `selectName`, açık kapsamlar gizli `scopesName` alanları): sunucu
 * bileşeninden yalnız düz veriyle kurulabilir. Giriş boşken gönder
 * butonu devre dışı KALMAZ (devre dışı buton neden basılmadığını söylemez):
 * basınca odağı girişe verir, `onSubmit` çağrılmaz. Seçim hapı yerel
 * `<select>` (telefonda sistem seçicisi açılır). Yay SVG çizgisidir:
 * çubukta odak varken ya da gönderin üstüne gelince çizilerek uzar
 * (`stroke-dashoffset`); hareketi azaltan kullanıcıda tam boyda sabit durur.
 * Telefonda gönder etiketi görsel olarak gizlenir, ikon kalır; ad korunur.
 *
 * ERİŞİLEBİLİRLİK: giriş ve seçim görünmez etiketli. Kapsam çipleri
 * `aria-pressed` toggle butonları, `role="group"` + ad; ikonlar
 * `aria-hidden`. Yay süs (`aria-hidden`). Dokunmatik hedefler ≥ 44 piksel.
 *
 * Manzara turundan (tanıtım sitesi kahraman çubuğu; yalnız davranış ve yapı).
 *
 *   <PromptBar
 *     placeholder="Nereye gitmek istersin?"
 *     select={{ label: "Misafir", options: [{ value: "1", label: "1 Misafir" }, { value: "2", label: "2 Misafir" }], defaultValue: "2" }}
 *     scopes={[{ value: "otel", label: "Oteller", icon: <BedDouble /> }, { value: "ucus", label: "Uçuşlar" }]}
 *     defaultScopes={["otel"]}
 *     onSubmit={({ text, scopes, select }) => plan(text, scopes, select)}
 *   />
 */

const CSS = `
.ui-prompt-arc path { stroke-dasharray: 1; stroke-dashoffset: 0.55; transition: stroke-dashoffset 0.6s var(--ease-brand); }
.ui-prompt:focus-within .ui-prompt-arc path, .ui-prompt-send:hover .ui-prompt-arc path { stroke-dashoffset: 0; }
@media (prefers-reduced-motion: reduce) { .ui-prompt-arc path { transition: none; stroke-dashoffset: 0; } }`;

export type PromptScope = { value: string; label: string; icon?: ReactNode };

export type PromptSelect = {
  /** Ekran okuyucu adı ("Misafir sayısı"). */
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
};

export type PromptSubmit = { text: string; scopes: string[]; select?: string };

type PromptBarProps = {
  /** İstemci gönderimi. Verilmezse form yerel olarak `action` adresine gider. */
  onSubmit?: (value: PromptSubmit) => void;
  /** `onSubmit` yokken formun gideceği adres (sunucu bileşeninden düz veri). */
  action?: string;
  method?: "get" | "post";
  /** Yerel gönderimde alan adları: giriş, seçim, kapsam (her açık kapsam bir değer). */
  name?: string;
  selectName?: string;
  scopesName?: string;
  placeholder?: string;
  /** Girişin ekran okuyucu adı. */
  label?: string;
  /** Arama bölgesinin adı (`form role="search"`). */
  formLabel?: string;
  submitLabel?: string;
  /** Gönder ikonunun yerine; varsayılan ok. */
  submitIcon?: ReactNode;
  scopes?: readonly PromptScope[];
  defaultScopes?: readonly string[];
  /** Kapsam grubunun ekran okuyucu adı. */
  scopesLabel?: string;
  select?: PromptSelect;
  className?: string;
};

export function PromptBar({
  onSubmit,
  action,
  method = "get",
  name = "q",
  selectName = "secim",
  scopesName = "kapsam",
  placeholder = "Ne yapmak istediğini yaz",
  label = "İstek",
  formLabel = "Niyet",
  submitLabel = "Planla",
  submitIcon,
  scopes = [],
  defaultScopes = [],
  scopesLabel = "Kapsam",
  select,
  className,
}: PromptBarProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [active, setActive] = useState<string[]>(() => [...defaultScopes]);
  const [choice, setChoice] = useState(select?.defaultValue ?? select?.options[0]?.value);

  function submit(event: FormEvent) {
    const value = text.trim();
    if (!value) {
      event.preventDefault();
      input.current?.focus();
      return;
    }
    // Callback yoksa tarayıcı formu `action` adresine kendisi gönderir.
    if (!onSubmit) return;
    event.preventDefault();
    // Kapsam sırası çağıranın verdiği sırada kalsın, tıklama sırasında değil.
    onSubmit({ text: value, scopes: scopes.map((s) => s.value).filter((v) => active.includes(v)), select: choice });
  }

  function toggle(value: string) {
    setActive((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));
  }

  return (
    <form role="search" aria-label={formLabel} onSubmit={submit} action={onSubmit ? undefined : action} method={onSubmit ? undefined : method} className={cn("ui-prompt flex flex-col items-center gap-4", className)}>
      <style href="ui-prompt-bar" precedence="default">
        {CSS}
      </style>

      <div className="flex w-full items-center gap-1 rounded-full bg-overlay p-1.5 pl-4 shadow-floating ring-1 ring-line-soft transition-shadow focus-within:ring-2 focus-within:ring-line-focus">
        <Search aria-hidden className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
        <label htmlFor={`${id}-input`} className="sr-only">
          {label}
        </label>
        <input
          ref={input}
          id={`${id}-input`}
          name={name}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-read text-strong outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />

        {select ? (
          <>
            <label htmlFor={`${id}-select`} className="sr-only">
              {select.label}
            </label>
            <select
              id={`${id}-select`}
              name={selectName}
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className="min-h-11 shrink-0 cursor-pointer appearance-none rounded-full bg-surface px-3.5 text-base font-medium text-strong ring-1 ring-line-soft transition-colors outline-none hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-line-focus max-sm:max-w-28 pointer-fine:min-h-9"
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <span className="ui-prompt-send relative shrink-0">
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-strong px-3 text-base font-medium text-page transition-[opacity,translate] hover:opacity-90 active:translate-y-px sm:px-5 [&_svg]:size-4"
          >
            {submitIcon ?? <ArrowRight aria-hidden strokeWidth={2} />}
            <span className="sr-only sm:not-sr-only">{submitLabel}</span>
          </button>
          {/* Vurgu yayı: butonun altından sola ve aşağı kıvrılan kısa çizgi. */}
          <svg
            aria-hidden
            viewBox="0 0 120 40"
            fill="none"
            className="ui-prompt-arc pointer-events-none absolute top-full right-3 mt-1 h-8 w-24 text-primary"
          >
            <path d="M112 2 C 100 26, 60 36, 6 30" pathLength={1} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        </span>
      </div>

      {scopes
        .filter((scope) => active.includes(scope.value))
        .map((scope) => (
          <input key={scope.value} type="hidden" name={scopesName} value={scope.value} />
        ))}

      {scopes.length > 0 ? (
        <div role="group" aria-label={scopesLabel} className="flex flex-wrap justify-center gap-2">
          {scopes.map((scope) => {
            const on = active.includes(scope.value);
            return (
              <button
                key={scope.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(scope.value)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-base font-medium transition-colors pointer-fine:min-h-9 [&_svg]:size-4 [&_svg]:shrink-0",
                  on ? "bg-strong text-page" : "bg-overlay text-muted ring-1 ring-line-soft hover:text-strong",
                )}
              >
                {scope.icon ? <span aria-hidden className="inline-flex">{scope.icon}</span> : null}
                {scope.label}
                {on ? <X aria-hidden strokeWidth={2} /> : <Plus aria-hidden strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      ) : null}
    </form>
  );
}
