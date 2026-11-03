"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Etiket girişi: serbest ya da önerili çoklu değer (konu etiketleri,
 * beceriler, alıcı e-postaları). Seçenekler kapalı ve sayılıysa
 * `combobox.tsx` (çoklu) daha doğru: kullanıcı yeni değer uyduramaz.
 *
 * Klavye: Enter ya da virgül ekler, yapıştırılan "tasarım, ürün, veri"
 * üçe bölünür. Boş alanda Backspace İLK basışta son çipi işaretler,
 * İKİNCİ basışta siler: tek tuşla yanlışlıkla çip kaybetmek, yazdığını
 * silerken sık olur. Öneri listesi açıksa ↑/↓ gezer, Enter seçer, Escape
 * kapatır (combobox + listbox, `aria-activedescendant`; odak alanda kalır).
 *
 * Aynı etiket iki kez eklenmez; karşılaştırma `tr-TR` küçük harfle
 * ("İstanbul" = "istanbul"). Ekleme ve silme gizli canlı bölgede okunur.
 * Formda her etiket ayrı gizli giriş (`name` tekrarlı): sunucuda
 * `formData.getAll(name)`.
 *
 * Çip beyaz karo, 0.9'dan büyüyerek gelir (hareket azaltanda yalnız solar).
 * Kapatma düğmesi dokunmatikte 32 px; asıl dokunmatik yol çipin kendisi
 * değil Backspace olmadığı için düğme her çipte görünür durur.
 *
 *   <TagInput label="Beceriler" suggestions={["Figma", "React", "Kullanıcı Araştırması"]}
 *     defaultValue={["Figma"]} name="beceri" />
 */

type TagInputProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (tags: string[]) => void;
  suggestions?: readonly string[];
  maxTags?: number;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
};

const fold = (text: string) => text.trim().toLocaleLowerCase("tr-TR");

export function TagInput({
  label,
  hint,
  error,
  value,
  defaultValue = [],
  onValueChange,
  suggestions = [],
  maxTags,
  placeholder = "Yaz ve Enter'a bas",
  name,
  disabled,
  className,
}: TagInputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const listId = `${id}-list`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const reduce = useReducedMotion();

  const [inner, setInner] = useState<string[]>([...defaultValue]);
  const tags = value ? [...value] : inner;
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const full = maxTags !== undefined && tags.length >= maxTags;
  const taken = new Set(tags.map(fold));
  const matches = suggestions
    .filter((item) => !taken.has(fold(item)) && fold(item).includes(fold(draft)))
    .slice(0, 6);
  const showList = open && !full && matches.length > 0;

  function update(next: string[]) {
    if (!value) setInner(next);
    onValueChange?.(next);
  }

  function add(raw: readonly string[]) {
    const next = [...tags];
    const added: string[] = [];
    for (const item of raw) {
      const text = item.trim();
      if (!text || next.some((tag) => fold(tag) === fold(text))) continue;
      if (maxTags !== undefined && next.length >= maxTags) break;
      next.push(text);
      added.push(text);
    }
    if (added.length) {
      update(next);
      setMessage(`${added.join(", ")} eklendi`);
    }
    setDraft("");
    setActive(-1);
  }

  function remove(index: number) {
    const tag = tags[index];
    update(tags.filter((_, i) => i !== index));
    setArmed(false);
    setMessage(`${tag} kaldırıldı`);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (showList ? (i + 1) % matches.length : 0));
    } else if (event.key === "ArrowUp" && showList) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (event.key === "Escape" && showList) {
      event.preventDefault();
      setOpen(false);
    } else if ((event.key === "Enter" || event.key === ",") && !event.nativeEvent.isComposing) {
      // Öneri yalnız oklarla seçildiyse alınır; yoksa yazılan metin eklenir
      // ("Re" yazıp Enter'a basan "React"e zorlanmaz).
      const pick = event.key === "Enter" && showList && active >= 0 ? matches[active] : null;
      if (!pick && !draft.trim()) return;
      event.preventDefault();
      add([pick ?? draft]);
    } else if (event.key === "Backspace" && draft === "" && tags.length) {
      event.preventDefault();
      if (armed) remove(tags.length - 1);
      else setArmed(true);
    } else {
      setArmed(false);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!/[,\n]/.test(text)) return;
    event.preventDefault();
    add(text.split(/[,\n]/));
  }

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-strong">
        {label}
      </label>
      <div className="relative">
        <div
          onClick={() => inputRef.current?.focus()}
          className={cn(
            "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-surface-sunken shadow-well px-1.5 py-1.5 transition-[color,background-color,border-color,box-shadow]",
            "hover:border-primary-soft has-[input:focus-visible]:border-line-focus has-[input:focus-visible]:shadow-focus has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-line-focus",
            error && "border-danger",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {/* `contents` Safari'de liste rolünü siler; `role` geri verir. */}
          <ul role="list" aria-label="Eklenen etiketler" className="contents">
            <AnimatePresence initial={false}>
              {tags.map((tag, index) => {
                const marked = armed && index === tags.length - 1;
                return (
                  <m.li
                    key={fold(tag)}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.9, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className={cn(
                      "flex h-8 items-center gap-0.5 rounded-full border bg-overlay pr-0.5 pl-3 text-small font-semibold text-strong shadow-raised transition-colors",
                      marked ? "border-line-focus bg-primary-wash text-primary-ink" : "border-line",
                    )}
                  >
                    {tag}
                    {name ? <input type="hidden" name={name} value={tag} /> : null}
                    <button
                      type="button"
                      aria-label={`${tag} etiketini kaldır`}
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(index);
                      }}
                      className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-6"
                    >
                      <X aria-hidden className="size-3.5" strokeWidth={2.25} />
                    </button>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            autoComplete="off"
            enterKeyHint="enter"
            disabled={disabled}
            value={draft}
            placeholder={full ? `En fazla ${maxTags} etiket` : tags.length ? "Ekle…" : placeholder}
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
              setActive(-1);
              setArmed(false);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setArmed(false);
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            className="h-8 min-w-24 flex-1 bg-transparent px-1.5 text-base text-strong outline-none placeholder:text-muted"
          />
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Öneriler"
          hidden={!showList}
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-60 overflow-auto rounded-lg border border-line-strong bg-overlay p-1 shadow-modal"
        >
          {matches.map((item, index) => (
            <li
              key={item}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // Tıklama alanın odağını kaybetmeden seçsin.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add([item])}
              onMouseMove={() => setActive(index)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center rounded-sm px-2.5 text-base text-strong pointer-fine:min-h-9",
                index === active && "bg-surface-raised",
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <span role="status" className="sr-only">
        {message}
      </span>
      {hint && !error ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
