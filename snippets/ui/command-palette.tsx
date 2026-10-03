"use client";

import { ArrowRight, Search } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Komut paleti (⌘K / Ctrl+K). Yerel `<dialog>` üstünde bir combobox:
 * giriş alanı `role="combobox"`, liste `role="listbox"`, etkin satır
 * `aria-activedescendant` ile söylenir. Odak HEP girişte kalır; ok tuşları
 * odağı değil etkin satırı taşır, böylece yazmaya devam edilebilir.
 *
 * Diyalog yerel: odak tuzağı ve Escape tarayıcıdan, odak kapanınca açan
 * öğeye döner. Başlıktaki bir düğmeden açmak için `openCommandPalette()`.
 *
 * Komutlar veri: `onSelect` içinde ne yapılacağını çağıran bilir
 * (`router.push`, tema değişimi). Palet gezinmeyi kendisi yapmaz, bu yüzden
 * herhangi bir yönlendiriciye bağlı değil.
 *
 * Arama Türkçe küçük harfle karşılaştırır (`toLocaleLowerCase("tr-TR")`):
 * "İ" aranınca "i", "I" aranınca "ı" bulunur. `keywords` eş anlamlılar
 * içindir ("tema" → "görünüm").
 */

export type Command = {
  id: string;
  label: string;
  /** Satırın altında cümle düzeninde kısa açıklama. */
  hint?: string;
  /** Grup başlığı: "Gezinme", "Ayarlar". */
  group: string;
  icon?: ReactNode;
  /** Görsel ipucu: ["G", "H"]. Kısayolun kendisini ayrıca bağla. */
  shortcut?: readonly string[];
  keywords?: readonly string[];
  onSelect: () => void;
};

const OPEN_EVENT = "command-palette:open";

/** Paleti ağacın herhangi bir yerinden aç (başlıktaki arama düğmesi). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const fold = (value: string) => value.toLocaleLowerCase("tr-TR");

type CommandPaletteProps = {
  commands: readonly Command[];
  placeholder?: string;
  emptyText?: string;
  /** Diyaloğun ekran okuyucu adı. */
  label?: string;
};

export function CommandPalette({
  commands,
  placeholder = "Komut ya da sayfa ara",
  emptyText = "Eşleşen komut yok.",
  label = "Komut Paleti",
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return commands;
    return commands.filter((command) =>
      [command.label, command.hint ?? "", command.group, ...(command.keywords ?? [])].some((text) => fold(text).includes(q)),
    );
  }, [commands, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const command of results) map.set(command.group, [...(map.get(command.group) ?? []), command]);
    return [...map.entries()];
  }, [results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!node.open) node.showModal();
    input.current?.focus();
    return () => {
      node.close();
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, [open]);

  // Etkin satır görünür alanın dışına düşmesin.
  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  function run(command: Command | undefined) {
    if (!command) return;
    close();
    command.onSelect();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = results.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index >= last ? 0 : index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? last : index - 1));
    } else if (event.key === "Home" && event.ctrlKey) {
      setActive(0);
    } else if (event.key === "End" && event.ctrlKey) {
      setActive(last);
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
    }
  }

  const activeId = results.length ? `${listId}-${active}` : undefined;

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className={cn(
        "mx-auto mt-[12dvh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-line-strong bg-overlay p-0 text-body shadow-modal",
        "opacity-0 transition-[opacity,display,overlay] transition-discrete duration-150 open:opacity-100 starting:open:opacity-0",
        "backdrop:bg-scrim",
      )}
    >
      <div className="flex items-center gap-3 border-b border-line-soft px-4">
        <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="min-h-14 min-w-0 flex-1 bg-transparent text-read text-strong outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded-[0.3125rem] border border-line-strong px-1.5 font-mono text-micro text-muted pointer-fine:inline">Esc</kbd>
      </div>

      <div id={listId} role="listbox" aria-label={label} className="max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain p-1.5">
        {results.length === 0 ? (
          <p className="px-3 py-8 text-center text-base text-muted">{emptyText}</p>
        ) : (
          groups.map(([group, items]) => (
            <div key={group} role="group" aria-label={group}>
              <p aria-hidden className="px-2.5 pt-2.5 pb-1 text-micro font-semibold text-muted">
                {group}
              </p>
              {items.map((command) => {
                const index = results.indexOf(command);
                const selected = index === active;
                return (
                  <div
                    key={command.id}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => run(command)}
                    onPointerMove={() => setActive(index)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 [&_svg]:size-4 [&_svg]:shrink-0",
                      selected ? "bg-primary-wash text-strong" : "text-body",
                    )}
                  >
                    {command.icon ? (
                      <span aria-hidden className={selected ? "text-primary-ink" : "text-muted"}>
                        {command.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{command.label}</span>
                      {command.hint ? <span className="block truncate text-small text-muted">{command.hint}</span> : null}
                    </span>
                    {command.shortcut ? (
                      <span aria-hidden className="hidden gap-1 pointer-fine:flex">
                        {command.shortcut.map((key) => (
                          <kbd key={key} className="rounded-[0.3125rem] border border-line-strong px-1.5 font-mono text-micro text-muted">
                            {key}
                          </kbd>
                        ))}
                      </span>
                    ) : null}
                    {selected ? <ArrowRight aria-hidden className="text-primary-ink" strokeWidth={1.75} /> : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <p aria-hidden className="hidden gap-4 border-t border-line-soft px-4 py-2 font-mono text-micro text-muted pointer-fine:flex">
        <span>↑↓ Seç</span>
        <span>↵ Aç</span>
        <span>Esc Kapat</span>
      </p>
    </dialog>
  );
}
