"use client";

import { Check, Search, UserPlus } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Kişi seçici: talebe, göreve ya da karta kişi ata. Tetikleyici seçilenlerin
 * avatar yığını (boşken kesik çizgili "Ekle" halkası); açılan katmanda arama
 * ve kişi listesi. `multiple` (varsayılan) izleyenler/ekip için, tekli mod
 * "Atanan" gibi tek sahipli alan için: seçim katmanı kapatır.
 *
 * KLAVYE: katman açılınca odak arama alanında kalır, liste
 * `aria-activedescendant` ile gezilir (↑ ↓, Home, End); Enter seçer ya da
 * bırakır, Escape kapatır ve odağı tetikleyiciye verir (Base UI Popover).
 * Liste `role="listbox"` + `aria-multiselectable`, satır `role="option"` +
 * `aria-selected`: ekran okuyucu "seçili" der, onay işareti yalnız görsel.
 *
 * ARAMA TÜRKÇE: "ilker" "İlker"i, "ozturk" "Öztürk"ü bulur (harf düzleme).
 * Eşleşme ad ve ayrıntıda (rol, e-posta) aranır.
 *
 * TETİKLEYİCİNİN ADI DURUMU SÖYLER: "İzleyenler: Can Demir, Mert Aksoy";
 * boşken "İzleyenler: kimse yok". Görünen yığın `aria-hidden`.
 *
 * Durum çağıranda (`value` + `onValueChange`); kalıcılık sunucu eylemiyle.
 *
 *   <AssigneePicker label="İzleyenler" people={team} value={ids} onValueChange={setIds} />
 *   <AssigneePicker label="Atanan" multiple={false} people={team} value={[owner]} onValueChange={([id]) => setOwner(id)} />
 */

export type Person = { id: string; name: string; /** Rol ya da e-posta: listede adın altında. */ detail?: string };

type AssigneePickerProps = {
  /** Alanın adı: "İzleyenler", "Atanan". */
  label: string;
  people: readonly Person[];
  value: readonly string[];
  onValueChange: (ids: string[]) => void;
  multiple?: boolean;
  /** Yığında en çok kaç avatar; fazlası "+N". */
  max?: number;
  className?: string;
};

const fold = (text: string) =>
  text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[ch]!);

export function AssigneePicker({ label, people, value, onValueChange, multiple = true, max = 3, className }: AssigneePickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = people.filter((p) => value.includes(p.id));
  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? people.filter((p) => fold(`${p.name} ${p.detail ?? ""}`).includes(q)) : people;
  }, [people, query]);

  function toggle(person: Person) {
    if (!multiple) {
      onValueChange([person.id]);
      setOpen(false);
      return;
    }
    onValueChange(value.includes(person.id) ? value.filter((v) => v !== person.id) : people.filter((p) => p.id === person.id || value.includes(p.id)).map((p) => p.id));
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    const last = results.length - 1;
    const next =
      event.key === "ArrowDown" ? Math.min(last, active + 1)
      : event.key === "ArrowUp" ? Math.max(0, active - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next !== null) {
      event.preventDefault();
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      toggle(results[active]);
    }
  }

  const spoken = selected.length ? selected.map((p) => p.name).join(", ") : "kimse yok";
  const shown = selected.slice(0, max);
  const extra = selected.length - shown.length;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger
        aria-label={`${label}: ${spoken}`}
        className={cn(
          "group inline-flex min-h-11 items-center rounded-full py-1 pr-1 pl-1 transition-[background-color] duration-150 hover:bg-surface-raised pointer-fine:min-h-9",
          className,
        )}
      >
        <span aria-hidden className="flex items-center">
          {shown.map((p, i) => (
            // İlk avatar en üstte: soldan okunan sırada baş harfler kesilmez.
            <span key={p.id} className={cn("relative inline-flex rounded-full", i > 0 && "-ml-1.5")} style={{ zIndex: shown.length - i }}>
              <Avatar name={p.name} size="sm" className="ring-2 ring-page" />
            </span>
          ))}
          {extra > 0 ? (
            <span className="relative -ml-1.5 inline-grid size-8 place-items-center rounded-full bg-overlay shadow-raised text-micro font-semibold text-strong ring-2 ring-page tabular-nums">
              +{extra}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-grid size-8 place-items-center rounded-full border border-dashed border-line-strong text-muted transition-colors group-hover:border-primary-soft group-hover:text-strong",
              selected.length > 0 && "ml-1",
            )}
          >
            <UserPlus className="size-4" strokeWidth={1.75} />
          </span>
          {selected.length === 0 ? <span className="mr-2 ml-2 text-base text-muted">Ekle</span> : null}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(18rem,var(--available-width))] p-2">
        <div className="flex items-center gap-2 rounded-md bg-surface-sunken px-2.5 shadow-well">
          <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={2} />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded
            aria-controls={`${id}-list`}
            aria-activedescendant={results[active] ? `${id}-${results[active].id}` : undefined}
            aria-label={`${label} için kişi ara`}
            placeholder="Kişi ara"
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-strong outline-none placeholder:text-muted"
          />
        </div>
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          className="mt-2 grid max-h-64 gap-0.5 overflow-y-auto"
        >
          {results.length === 0 ? (
            <li role="presentation" className="px-3 py-6 text-center text-small text-muted">
              Eşleşen kişi yok.
            </li>
          ) : (
            results.map((p, index) => {
              const isSelected = value.includes(p.id);
              return (
                <li
                  key={p.id}
                  id={`${id}-${p.id}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5",
                    index === active && "bg-surface-raised",
                  )}
                >
                  <Avatar name={p.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-strong">{p.name}</span>
                    {p.detail ? <span className="block truncate text-small text-muted">{p.detail}</span> : null}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full transition-[background-color,scale] duration-150",
                      isSelected ? "scale-100 bg-primary text-on-primary" : "scale-90 bg-transparent text-transparent",
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
