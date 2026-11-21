"use client";

import type { ElementType, ReactNode } from "react";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Kaldıraç kartı: "şunu yaparsam sonuç şu olur" senaryolarının tek parçası
 * ("Emek maliyetini tahminde tut · +1,5 puan · aylık 27,6 bin ₺"). Anahtar
 * senaryoya dahil eder; etki değeri büyük ve tek bakışta okunur, altındaki
 * çubuk o kaldıracın hedef açığının ne kadarını kapattığını gösterir.
 * `forecast-chart.tsx` ile birlikte kullanılır: anahtarlar açıldıkça grafikteki
 * "değişikliklerle" yolu yükselir (marj tahmini, bütçe, kapasite planı).
 *
 * KAPALI mı AÇIK mı İKİ İŞARET: etki değeri renk değiştirir (kapalıda nötr,
 * açıkta `success`) VE çubuk desen değiştirir (kapalıda ÇİZGİLİ, "henüz
 * uygulanmadı"; açıkta dolu). Renk körlüğünde ve gri baskıda da ayrışır;
 * ekran okuyucu durumu anahtarın rolünden ("anahtar, açık") ve çubuğun
 * `aria-valuetext` metninden duyar.
 *
 * NE ZAMAN DEĞİL: tek başına bir ayar ("bildirimleri aç") için `switch.tsx`;
 * etkisi sayıyla söylenemeyen seçim için `radio-group.tsx`. Kart bir etki
 * taşır: etkisiz anahtarı kartlamak gürültüdür. En çok 4-6 kaldıraç
 * (`LeverGrid`); fazlası liste olur.
 *
 * Başlık gerçek bir başlık (`headingLevel`, varsayılan 3): sayfanın başlık
 * sırası bozulmasın, sayfa `h2` bölümündeyse 3 kalır, diyalogda 2 ver.
 * Anahtarın adı başlıktır (`aria-labelledby`), açıklaması etki değeridir
 * (`aria-describedby`): "Emek Maliyetini Tahminde Tut, anahtar, kapalı, artı
 * bir buçuk puan". Anahtar kartta ayrı bir odak durağıdır; kartın kendisi
 * tıklanmaz (iç içe etkileşim yok). İkon süstür (`aria-hidden`), küçük çizgi
 * ikon: renkli ikon karosu yok.
 *
 * Çizgili çubuk deseni token'dan (`color-mix` + `--text-muted`), hex yok;
 * CSS `<style href="ui-lever-card">`. Çubuk dolgusu hareketi azaltanda
 * geçişsiz.
 *
 *   <LeverGrid label="Marj Kaldıraçları">
 *     <LeverCard
 *       title="Emek Maliyetini Tahminde Tut"
 *       effect="+1,5 puan"
 *       effectNote="aylık 27,6 bin ₺"
 *       progress={0.62}
 *       checked={on}
 *       onCheckedChange={setOn}
 *       description="Montaj 7,8 saatte biter, acil işler teklife sadık kalır."
 *       icon={<Clock />}
 *     />
 *   </LeverGrid>
 */

const CSS = `
.ui-lever-hatch {
  background-image: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--text-muted) 70%, transparent) 0 2px,
    transparent 2px 5px
  );
}
`;

type LeverCardProps = {
  title: ReactNode;
  /** Büyük etki değeri: "+1,5 puan". Metin olarak ver (biçim çağıranda). */
  effect: ReactNode;
  /** Etkinin yanındaki küçük not: "aylık 27,6 bin ₺". */
  effectNote?: ReactNode;
  /** Hedef açığının kapanan payı, 0 ile 1 arası. */
  progress: number;
  /** Çubuğun adı (ekran okuyucu): "Hedef açığına katkı". */
  progressLabel?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Tek cümle açıklama, cümle düzeninde. */
  description?: ReactNode;
  /** Küçük çizgi ikon (lucide). Süstür. */
  icon?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  disabled?: boolean;
  className?: string;
};

export function LeverCard({
  title,
  effect,
  effectNote,
  progress,
  progressLabel = "Hedef açığına katkı",
  checked,
  onCheckedChange,
  description,
  icon,
  headingLevel = 3,
  disabled,
  className,
}: LeverCardProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as ElementType;
  const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const pct = Math.round(ratio * 100);
  const valueText = `${progressLabel}: yüzde ${pct}, ${checked ? "uygulanıyor" : "henüz uygulanmadı"}`;

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl bg-overlay p-5 shadow-raised ring-1 transition-[box-shadow] duration-200",
        checked ? "ring-success/30" : "ring-line",
        className,
      )}
    >
      <style href="ui-lever-card" precedence="default">
        {CSS}
      </style>

      <div className="flex items-center justify-between gap-3">
        {icon ? (
          <span aria-hidden className={cn("shrink-0 transition-colors duration-200 [&_svg]:size-5", checked ? "text-success" : "text-muted")}>
            {icon}
          </span>
        ) : (
          <span />
        )}
        <Switch
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-effect`}
          label={<span className="sr-only">{title}</span>}
          placement="end"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          className="w-auto shrink-0"
        />
      </div>

      <Heading id={`${id}-title`} className="text-read font-medium text-strong">
        {title}
      </Heading>

      <p id={`${id}-effect`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn("text-heading font-semibold tracking-tight tabular-nums transition-colors duration-200", checked ? "text-success" : "text-strong")}>
          {effect}
        </span>
        {effectNote ? <span className="text-small text-muted">{effectNote}</span> : null}
        <span className="sr-only">{checked ? "Açık" : "Kapalı"}</span>
      </p>

      <div
        role="meter"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText}
        className="h-1.5 w-full overflow-hidden rounded-full bg-chart-track"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-brand)] motion-reduce:transition-none",
            checked ? "bg-success" : "ui-lever-hatch",
          )}
          style={{ width: `${Math.max(pct, ratio > 0 ? 2 : 0)}%` }}
        />
      </div>

      {description ? <p className="text-small text-muted">{description}</p> : null}
    </article>
  );
}

/** Dört karolu satır: telefonda tek, orta ekranda iki, geniş ekranda dört sütun. */
export function LeverGrid({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
