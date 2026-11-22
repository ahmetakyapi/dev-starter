import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ayrıntı paneli: listenin YANINDA duran ana-ayrıntı (master-detail)
 * yüzeyi. Soldaki tabloda bir satır seçilince sağda o kaydın özeti: başlık
 * (ikon + ad + alt satır + eylem), altında başlıklı BÖLÜMLER (sağlık
 * puanı, açık iş emirleri, önemli varlıklar). Mülk, satıcı, müşteri,
 * sipariş, cihaz. Fixora mülk ve satıcı ekranlarının sağ panelinden
 * alındı (yapı; kod, ad, veri alınmadı).
 *
 * İKİ PARÇA: `DetailPanel` (kabuk + başlık) ve `DetailSection` (başlıklı
 * bölüm: sayaç + "Tümünü Gör" yuvası). İçerik yuvası serbest: `stat`,
 * `key-value-list`, `factor-list`, `insight-callout`, `bar-list`,
 * `attention-list` buraya konur; panel kendi içeriğini dayatmaz.
 *
 * GÖRÜNÜŞ ("board" dili): gri kuyu üstünde beyaz karo kart, başlık altı
 * saç çizgisi, bölümler arası boşluk (çizgi değil: iç içe çizgi yorar).
 * Genişlik kabın işi; 20-24 rem arası ölçüldü. Uzun içerikte panel KENDİ
 * içinde kaydırılır (`scrollable`, `max-h` kabın işi), sayfa değil.
 *
 * ERİŞİLEBİLİRLİK: kabuk `aside` + başlığıyla adlanır (`headingLevel`,
 * varsayılan 2: sayfa başlığının altında ayrı bir bölge); her bölge
 * `section` + kendi başlığı. Seçili satırla panelin bağı çağıranın işi:
 * satırda `aria-controls` ya da panelde `aria-live="polite"` DEĞİL
 * (her seçimde tüm paneli okutur); odağı panele taşımak yerine
 * `Tab` sırasında listeden hemen sonra gelmesi yeter.
 *
 * BOŞ HAL: kayıt seçilmemişse `emptyText` ("Ayrıntı için bir kayıt seç.")
 * çizilir, boş iskelet değil. Yüklenirken `skeleton.tsx`.
 *
 *   <DetailPanel
 *     icon={<Building2 />} title="Çınar Apartmanı" subtitle="Atatürk Cad. 14, Çankaya"
 *     action={<IconButton label="Aç">…</IconButton>}
 *   >
 *     <DetailSection title="Açık İş Emirleri" count={14} action={<a href="…">Tümünü Gör</a>}>
 *       …
 *     </DetailSection>
 *   </DetailPanel>
 */

export function DetailPanel({
  icon,
  title,
  subtitle,
  action,
  children,
  emptyText,
  headingLevel = 2,
  scrollable = false,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Başlığın sağında: aç oku, menü. */
  action?: ReactNode;
  children?: ReactNode;
  /** Kayıt seçili değilken gövde yerine bu metin. */
  emptyText?: ReactNode;
  headingLevel?: 2 | 3;
  /** Gövde kendi içinde kaydırılır; panel yüksekliğini kap (`max-h`) belirler. */
  scrollable?: boolean;
  className?: string;
}) {
  const H = `h${headingLevel}` as ElementType;
  return (
    <aside
      aria-label={typeof title === "string" ? title : undefined}
      className={cn("flex min-h-0 min-w-0 flex-col rounded-xl bg-overlay shadow-raised", className)}
    >
      <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        {icon ? (
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-body [&_svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <H className="truncate text-read font-semibold text-strong">{title}</H>
          {subtitle ? <p className="truncate text-small text-body">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex flex-col gap-6 px-5 py-5", scrollable && "min-h-0 flex-1 overflow-y-auto")}>
        {emptyText && !children ? <p className="text-base text-body">{emptyText}</p> : children}
      </div>
    </aside>
  );
}

export function DetailSection({
  title,
  count,
  action,
  headingLevel = 3,
  children,
  className,
}: {
  title: ReactNode;
  /** Başlığın yanında sönük sayaç: açık iş sayısı. */
  count?: ReactNode;
  /** "Tümünü Gör" bağlantısı. */
  action?: ReactNode;
  headingLevel?: 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  const H = `h${headingLevel}` as ElementType;
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <H className="flex items-baseline gap-2 text-base font-semibold text-strong">
          {title}
          {count !== undefined ? <span className="text-small font-normal text-body tabular-nums">{count}</span> : null}
        </H>
        {action ? <div className="shrink-0 text-small font-medium text-primary-ink [&_a]:underline [&_a]:underline-offset-4">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
