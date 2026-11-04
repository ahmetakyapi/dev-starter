"use client";

import { Check, Eye, Flame, Heart, PartyPopper, SmilePlus, ThumbsUp, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Tepkiler: bir mesaja, nota ya da duyuruya tek dokunuşla tepki ("Beğendim
 * 3", "Bakıyorum 1"). Paylaşılan gelen kutusunda ekip, müşteri mesajını
 * okuduğunu ve üstüne aldığını yazmadan söyler.
 *
 * EMOJİ DEĞİL İKON: arayüzde emoji yok (slop kuralı; platforma göre farklı
 * çizilir, tonu kontrol edilemez). Altı sabit tepki lucide ikonuyla, her
 * birinin Türkçe adı var; ad hem ipucu hem ekran okuyucu metni.
 *
 * HAP BİR AÇ-KAPA DÜĞMESİ: `aria-pressed` "senin tepkin var mı"yı söyler,
 * ad sayıyı içerir ("Beğendim: 3 kişi, sen dahil"). Senin tepkin vurgu
 * yıkamasıyla ayrılır (renk tek işaret değil: basılı durum + ad).
 * Sayısı sıfıra inen hap kalkar.
 *
 * EKLE: gülen yüz artısı küçük bir katman açar (Base UI Popover: odak,
 * Escape, odak dönüşü); seçilen tepki eklenir ve katman kapanır.
 *
 * HAREKET: tepki verince ikon bir kez "zıplar" (`scale` 1 → 1,25 → 1),
 * sayı alttan kayarak değişir. İkisi de CSS, hareketi azaltanda yok.
 *
 * Durum çağıranda ya da bileşende: `value` + `onValueChange` (denetimli)
 * veya `defaultValue`. Kalıcılık sunucu eylemiyle.
 *
 *   <Reactions label="Ekip tepkileri" defaultValue={[{ kind: "begen", count: 2, mine: true }]} />
 */

export const REACTION_KINDS = {
  begen: { icon: ThumbsUp, label: "Beğendim" },
  kalp: { icon: Heart, label: "Sevdim" },
  tebrik: { icon: PartyPopper, label: "Tebrikler" },
  ates: { icon: Flame, label: "Harika" },
  goz: { icon: Eye, label: "Bakıyorum" },
  tamam: { icon: Check, label: "Tamam" },
} as const satisfies Record<string, { icon: LucideIcon; label: string }>;

export type ReactionKind = keyof typeof REACTION_KINDS;
export type Reaction = { kind: ReactionKind; count: number; mine?: boolean };

const CSS = `
@keyframes ui-react-pop { 40% { scale: 1.25; } }
@keyframes ui-react-count { from { translate: 0 60%; opacity: 0; } }
.ui-react-pop { animation: ui-react-pop 320ms var(--ease-brand); }
.ui-react-count { animation: ui-react-count 220ms var(--ease-brand); }`;

type ReactionsProps = {
  /** Grubun adı: "Ekip tepkileri". */
  label: string;
  value?: readonly Reaction[];
  defaultValue?: readonly Reaction[];
  onValueChange?: (next: Reaction[]) => void;
  className?: string;
};

export function Reactions({ label, value, defaultValue = [], onValueChange, className }: ReactionsProps) {
  const [inner, setInner] = useState<readonly Reaction[]>(defaultValue);
  const [bumped, setBumped] = useState<ReactionKind | null>(null);
  const list = value ?? inner;

  function commit(next: Reaction[]) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  function toggle(kind: ReactionKind) {
    const current = list.find((r) => r.kind === kind);
    let next: Reaction[];
    if (!current) next = [...list, { kind, count: 1, mine: true }];
    else if (current.mine) next = list.map((r) => (r.kind === kind ? { ...r, count: r.count - 1, mine: false } : r)).filter((r) => r.count > 0);
    else next = list.map((r) => (r.kind === kind ? { ...r, count: r.count + 1, mine: true } : r));
    setBumped(current?.mine ? null : kind);
    commit(next);
  }

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <style href="ui-reactions" precedence="default">
        {CSS}
      </style>
      {list.map((r) => {
        const kind = REACTION_KINDS[r.kind];
        const Glyph = kind.icon;
        return (
          <button
            key={r.kind}
            type="button"
            aria-pressed={Boolean(r.mine)}
            aria-label={`${kind.label}: ${r.count} kişi${r.mine ? ", sen dahil" : ""}`}
            title={kind.label}
            onClick={() => toggle(r.kind)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-small font-semibold tabular-nums transition-[background-color,color,box-shadow,scale] duration-150 active:scale-95",
              r.mine ? "bg-primary-wash text-primary-ink shadow-[inset_0_0_0_1px_var(--primary-soft)]" : "bg-overlay text-body shadow-raised hover:text-strong",
            )}
          >
            <Glyph
              aria-hidden
              key={bumped === r.kind ? `${r.kind}-${r.count}` : r.kind}
              className={cn("size-4", bumped === r.kind && "ui-react-pop")}
              strokeWidth={2}
            />
            <span className="inline-block overflow-hidden">
              <span key={r.count} className={cn("inline-block", bumped === r.kind && "ui-react-count")}>
                {r.count}
              </span>
            </span>
          </button>
        );
      })}
      <Popover>
        <PopoverTrigger
          aria-label="Tepki Ekle"
          title="Tepki Ekle"
          className="inline-grid size-9 place-items-center rounded-full bg-overlay text-muted shadow-raised transition-[color,scale] duration-150 hover:text-strong active:scale-95"
        >
          <SmilePlus aria-hidden className="size-4" strokeWidth={2} />
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-auto p-1.5">
          <div role="group" aria-label="Tepkiler" className="flex gap-0.5">
            {(Object.keys(REACTION_KINDS) as ReactionKind[]).map((k) => {
              const { icon: Glyph, label: name } = REACTION_KINDS[k];
              const mine = list.some((r) => r.kind === k && r.mine);
              return (
                <PopoverClose
                  key={k}
                  aria-label={name}
                  title={name}
                  aria-pressed={mine}
                  onClick={() => {
                    if (!mine) toggle(k);
                  }}
                  className={cn(
                    "inline-grid size-10 place-items-center rounded-lg transition-[background-color,color,scale] duration-150 hover:scale-110 hover:bg-surface-raised",
                    mine ? "text-primary-ink" : "text-body",
                  )}
                >
                  <Glyph aria-hidden className="size-5" strokeWidth={2} />
                </PopoverClose>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
