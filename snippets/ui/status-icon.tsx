"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Durum ikonu + durum seçici: iş, talep ya da görev durumunu ŞEKİLLE söyler.
 * Ön İnceleme kesik çizgili daire, Yapılacak boş halka, Sürüyor yarıya dolmuş
 * daire, Engelli halka içinde duraklat, Tamamlandı dolu daire + tik, İptal
 * halka içinde çapraz çizgi. Renk ikinci işaret: renk körü kullanıcı da
 * durumu şekilden okur (`badge`deki nokta bunu yapamaz).
 *
 * Ne zaman: listede satır başı durum (talep, görev, sipariş adımı), başlık
 * yanında kayıt durumu, `phase-checklist` satırları. Ne zaman DEĞİL: sistem
 * sağlığı (`status-list`), sayılı özet (`badge` + sayı), ikiden az durumlu
 * aç/kapa (`switch`).
 *
 * Nasıl çalışır: tek SVG, bütün parçalar hep DOM'da; durum değişince CSS
 * geçişiyle dolum yayı dolar, tik çizilir, duraklat çubukları belirir
 * (280 ms, `--ease-brand`). Hareket azaltmada geçiş yok. `StatusIcon`
 * kanca kullanmaz; sunucu bileşeninden de çağrılabilir (dosya seçici için
 * `"use client"` taşır).
 *
 * `StatusPicker`: gri hap tetikleyici (ikon + ad + ok), açılınca altı durumlu
 * liste. Klavye: ↑ ↓ Home End gezinir, Enter/Boşluk seçer, Escape kapatır
 * ve odak tetikleyiciye döner, harfe basınca o harfle başlayan duruma atlar
 * (tr-TR küçük harf). Dış tıklama kapatır. Base UI yok: kitte kalır.
 *
 * Erişilebilirlik: `label` verilirse ikon `role="img"` + ad ("Durum:
 * Engelli"); verilmezse `aria-hidden` (adı yanındaki metin taşır).
 * Seçicinin tetikleyicisi "Durum: Sürüyor" diye okunur, liste `listbox`,
 * öğeler `option` + `aria-selected`, etkin öğe `aria-activedescendant`.
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod
 * alınmadı.
 *
 *   <StatusIcon status="blocked" label="Durum: Engelli" />
 *   <StatusPicker value={status} onValueChange={setStatus} />
 */

export const STATUSES = ["triage", "todo", "progress", "blocked", "done", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  triage: "Ön İnceleme",
  todo: "Yapılacak",
  progress: "Sürüyor",
  blocked: "Engelli",
  done: "Tamamlandı",
  cancelled: "İptal",
};

const TONE: Record<Status, string> = {
  triage: "text-soft",
  todo: "text-primary",
  progress: "text-warning",
  blocked: "text-danger",
  done: "text-success",
  cancelled: "text-soft",
};

/* Dolum dairesi: r 2.75, kalınlık 5.5 → çevre 17.28; yarısı dolu = 8.64. */
const FILL_C = 17.28;
const CHECK_LEN = 8;

const CSS = `
.ui-si * { transition: stroke-dashoffset 280ms var(--ease-brand), opacity 200ms ease, fill-opacity 200ms ease, stroke-dasharray 280ms var(--ease-brand); }
@media (prefers-reduced-motion: reduce) { .ui-si * { transition: none !important; } }
.ui-sp-list { animation: ui-sp-in 200ms var(--ease-brand) both; }
@keyframes ui-sp-in { from { opacity: 0; translate: 0 -4px; scale: .98; } }
@media (prefers-reduced-motion: reduce) { .ui-sp-list { animation: none; } }`;

type StatusIconProps = {
  status: Status;
  /** Verilirse `role="img"` + ad; yoksa ikon süs (`aria-hidden`). */
  label?: string;
  size?: number;
  className?: string;
};

/**
 * Durum metni (Sakin Akış): pastel hap yerine ŞEKİL + metin. Liste sütunlarında
 * (fatura, sayaç, abone durumu) uzun liste renge boğulmaz; renk yalnız ikonda,
 * sorun (`danger`) metni koyu ve orta ağırlıkta. `tone` anlamdan şekil seçer
 * (başarı → tik, uyarı → yarım, sorun → duraklat, birincil → halka, nötr → kesik);
 * belirli bir şekil gerekiyorsa `status` ile ver.
 *
 *   <StatusText tone="danger">6 Gecikme</StatusText>
 */
export type StatusTone = "success" | "neutral" | "warning" | "danger" | "primary";
const TONE_SHAPE: Record<StatusTone, Status> = { success: "done", neutral: "triage", warning: "progress", danger: "blocked", primary: "todo" };

export function StatusText({ tone = "neutral", status, children, className }: { tone?: StatusTone; status?: Status; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-small whitespace-nowrap", tone === "danger" ? "font-medium text-strong" : "text-body", className)}>
      <StatusIcon status={status ?? TONE_SHAPE[tone]} size={14} />
      {children}
    </span>
  );
}

export function StatusIcon({ status, label, size = 16, className }: StatusIconProps) {
  const fill = status === "done" ? FILL_C : status === "progress" ? FILL_C / 2 : 0;
  return (
    <>
    <style href="ui-status-icon" precedence="default">
      {CSS}
    </style>
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      className={cn("ui-si shrink-0", TONE[status], className)}
      data-status={status}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/* Dış halka: Ön İncelemede kesik, Tamamlandıda dolu. */}
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={status === "triage" ? "2.2 2.2" : "40 0"}
        fill="currentColor"
        fillOpacity={status === "done" ? 1 : 0}
      />
      {/* Dolum: saat 12'den saat yönünde (Sürüyor yarım, Tamamlandı tam). */}
      <circle
        cx="8"
        cy="8"
        r="2.75"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeDasharray={FILL_C}
        strokeDashoffset={FILL_C - fill}
        transform="rotate(-90 8 8)"
        opacity={fill > 0 && status !== "done" ? 1 : 0}
      />
      {/* Duraklat çubukları (Engelli). */}
      <g opacity={status === "blocked" ? 1 : 0} fill="currentColor">
        <rect x="5.9" y="5.2" width="1.5" height="5.6" rx="0.6" />
        <rect x="8.6" y="5.2" width="1.5" height="5.6" rx="0.6" />
      </g>
      {/* Tik (Tamamlandı): sayfa renginde çizilerek gelir. */}
      <path
        d="M5.2 8.2 7.1 10 10.8 6.2"
        stroke="var(--color-page)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LEN}
        strokeDashoffset={status === "done" ? 0 : CHECK_LEN}
      />
      {/* Çapraz çizgi (İptal). */}
      <path d="M5.4 10.6 10.6 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={CHECK_LEN} strokeDashoffset={status === "cancelled" ? 0 : CHECK_LEN} />
    </svg>
    </>
  );
}

type StatusPickerProps = {
  value: Status;
  onValueChange: (next: Status) => void;
  /** Gösterilecek durumlar ve sırası (varsayılan altısı). */
  statuses?: readonly Status[];
  /** Etiket öneki: "Durum" → tetikleyicinin adı "Durum: Sürüyor". */
  label?: string;
  labels?: Partial<Record<Status, string>>;
  disabled?: boolean;
  className?: string;
};

export function StatusPicker({ value, onValueChange, statuses = STATUSES, label = "Durum", labels, disabled, className }: StatusPickerProps) {
  const name = (s: Status) => labels?.[s] ?? STATUS_LABEL[s];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, statuses.indexOf(value)));
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function show() {
    setActive(Math.max(0, statuses.indexOf(value)));
    setOpen(true);
  }

  function close(focus = true) {
    setOpen(false);
    if (focus) trigger.current?.focus();
  }

  function pick(s: Status) {
    onValueChange(s);
    close();
  }

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      show();
    }
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    const last = statuses.length - 1;
    if (e.key === "ArrowDown") setActive((i) => (i >= last ? 0 : i + 1));
    else if (e.key === "ArrowUp") setActive((i) => (i <= 0 ? last : i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(statuses[active]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") close(false);
    else if (e.key.length === 1) {
      const ch = e.key.toLocaleLowerCase("tr-TR");
      const start = active + 1;
      const order = [...statuses.slice(start), ...statuses.slice(0, start)];
      const hit = order.find((s) => name(s).toLocaleLowerCase("tr-TR").startsWith(ch));
      if (hit) setActive(statuses.indexOf(hit));
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={root} className={cn("relative inline-block", className)}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${name(value)}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className="inline-flex h-7 items-center gap-1.5 rounded-[10px] bg-surface px-2 text-small text-strong transition-colors duration-150 hover:bg-surface-sunken active:scale-[0.98] disabled:opacity-50 pointer-coarse:h-11"
      >
        <StatusIcon status={value} size={14} />
        <span>{name(value)}</span>
        <ChevronDown aria-hidden className="size-3.5 text-soft" />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${statuses[active]}`}
          onKeyDown={onListKey}
          className="ui-sp-list absolute top-full left-0 z-50 mt-1.5 grid min-w-44 gap-0.5 rounded-xl bg-overlay p-1 shadow-floating ring-1 ring-line outline-none"
        >
          {statuses.map((s, i) => (
            <li
              key={s}
              id={`${id}-${s}`}
              role="option"
              aria-selected={s === value}
              onPointerMove={() => setActive(i)}
              onClick={() => pick(s)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-small text-strong select-none pointer-coarse:min-h-11",
                i === active && "bg-surface",
              )}
            >
              <StatusIcon status={s} size={14} />
              <span className="flex-1">{name(s)}</span>
              {s === value && <Check aria-hidden className="size-3.5 text-muted" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
