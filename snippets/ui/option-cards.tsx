"use client";

import { Lock } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Seçenek kartları: birbirini dışlayan 2-5 yoldan biri, HER YOLUN sonucu
 * kartın içinde yazılı ("Tedarikçiden düzeltme iste: Hazır bir mesaj ve
 * güvenli bağlantı gönderilir"). Çözüm yolu seçimi, ret nedeni, plan
 * seçimi, teslimat yöntemi. Seçenek kısa bir etiketse `radio-group.tsx`;
 * çok seçenek ya da arama gerekiyorsa `select.tsx`.
 *
 * GERÇEK RADYO GRUBU: her kart bir `<input type="radio">` (aynı `name`)
 * sarar, kapsayıcı `fieldset` + `legend`. Ok tuşları, Home/End, odak ve
 * form gönderimi tarayıcıdan gelir; ekran okuyucu "Tedarikçiden Düzeltme
 * İste, radyo butonu, 3 seçenekten 1." der. Seçili kart koyu çerçeve +
 * dolu nokta: renk tek işaret değil (nokta şekil).
 *
 * KİLİTLİ SEÇENEK (`locked: { reason }`): seçilemez ama GİZLENMEZ; kullanıcı
 * neden olmadığını görür ("Mevcut değil: yalnız tedarikçi değiştirebilir").
 * Radyo `disabled` (ok tuşları atlar), neden hem kartta kilit simgesiyle
 * yazılı hem `aria-describedby` ile okunur. Gerekçesiz kilit yok: neden
 * zorunlu alan.
 *
 * ÖNERİLEN (`badge`): kartın başlığında küçük rozet ("Önerilen"); seçimi
 * önceden yapmak çağıranın işi (`value`).
 *
 * Denetimli ya da denetimsiz: `value` + `onValueChange` verilirse denetimli,
 * yoksa `defaultValue` ile içte durur. Dokunma hedefi kartın tamamı (≥ 64 px).
 *
 *   <OptionCards legend="Nasıl Çözmek İstiyorsun?" name="cozum" value={v} onValueChange={setV}
 *     options={[
 *       { value: "iste", title: "Tedarikçiden Düzeltme İste", description: "Hazır mesaj ve güvenli bağlantı gider.", badge: "Önerilen" },
 *       { value: "burada", title: "Burada Düzelt", description: "Düzeltip yeniden gönder.", locked: { reason: "Mevcut değil: yalnız tedarikçi değiştirebilir." } },
 *       { value: "reddet", title: "Faturayı Reddet", description: "Tedarikçi yeni fatura keser." },
 *     ]} />
 */

export type OptionCard = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  /** Başlığın yanında küçük rozet: "Önerilen". */
  badge?: string;
  /** Seçilemez; neden zorunlu. */
  locked?: { reason: string };
};

type OptionCardsProps = {
  options: readonly OptionCard[];
  legend: ReactNode;
  /** Radyo grubunun adı (form alanı); verilmezse otomatik. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  hideLegend?: boolean;
  className?: string;
};

export function OptionCards({ options, legend, name, value, defaultValue, onValueChange, hideLegend = false, className }: OptionCardsProps) {
  const base = useId();
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const group = name ?? `${base}-opt`;

  function choose(next: string) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  return (
    <fieldset className={cn("grid min-w-0 gap-2.5", className)}>
      <legend className={cn("mb-1", hideLegend ? "sr-only" : "text-base font-semibold text-strong")}>{legend}</legend>
      {options.map((option, index) => {
        const id = `${base}-${index}`;
        const locked = Boolean(option.locked);
        return (
          <label
            key={option.value}
            className={cn(
              "group/card relative grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 rounded-xl border bg-overlay p-4 transition-[border-color,background-color,box-shadow] duration-150",
              locked
                ? "cursor-not-allowed border-line-soft bg-surface text-muted"
                : "cursor-pointer border-line shadow-raised hover:border-line-strong has-checked:border-strong has-checked:bg-surface",
              "has-focus-visible:ring-2 has-focus-visible:ring-line-focus has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-page",
            )}
          >
            <input
              type="radio"
              name={group}
              value={option.value}
              checked={current === option.value}
              onChange={() => choose(option.value)}
              disabled={locked}
              aria-labelledby={`${id}-t`}
              aria-describedby={[option.description ? `${id}-d` : null, locked ? `${id}-r` : null].filter(Boolean).join(" ") || undefined}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "col-start-1 row-span-2 mt-0.5 grid size-5 place-items-center rounded-full border bg-overlay transition-colors",
                locked ? "border-line" : "border-line-strong group-has-checked/card:border-strong",
              )}
            >
              <span className="size-2.5 scale-0 rounded-full bg-strong transition-transform duration-150 group-has-checked/card:scale-100 motion-reduce:transition-none" />
            </span>
            <span id={`${id}-t`} className={cn("col-start-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium", locked ? "text-muted" : "text-strong")}>
              {option.title}
              {option.badge ? <span className="rounded-full bg-primary-wash px-2 py-0.5 text-micro font-medium text-primary-ink">{option.badge}</span> : null}
            </span>
            {locked ? <Lock aria-hidden className="col-start-3 row-start-1 mt-0.5 size-4 text-muted" strokeWidth={1.75} /> : null}
            {option.description ? (
              <span id={`${id}-d`} className="col-start-2 col-end-4 text-small text-muted">
                {option.description}
              </span>
            ) : null}
            {option.locked ? (
              <span id={`${id}-r`} className="col-start-2 col-end-4 mt-1 text-small text-body">
                {option.locked.reason}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
