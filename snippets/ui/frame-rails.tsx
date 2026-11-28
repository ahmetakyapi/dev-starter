import { Children, isValidElement, useId, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Çizgili çerçeve: kahramanı ve bölümleri cetvel çizgileriyle çevreleyen
 * sergi düzeni. İçeriğin iki yanında tam boy dikey kıl çizgi, isteğe üstte
 * ve altta sayfa kenarına dek uzanan yatay çizgi, kesişimlerde küçük artı
 * işareti. Altında `RuledRow`: hücreleri kıl çizgiyle bölünmüş yatay şerit
 * (logo / entegrasyon satırı: "Kullandığın Araçlarla Çalışır" + eşit
 * hücreler + "Bütün Entegrasyonlar"). Tanıtım ve ürün sayfasının iskeleti.
 * Manzara turundan (2026-11-28, yalnız davranış ve yapı).
 *
 * NE ZAMAN DEĞİL: uygulama ekranı, form, veri paneli (çizgiler okumayı
 * böler). Bölüm arkasına desen için `pattern-bg`; tek ayırıcı için
 * `divider`. Bütün sayfada tek çerçeve dili: bölümlerin hepsi aynı
 * `width`i kullanır, yoksa raylar bölümden bölüme kayar.
 *
 * NASIL:
 *   - `FrameRails`: dış kap tam genişlik; içteki kap `width` (Tailwind
 *     `max-w-*` sınıfı) ile ortalanır ve iki yanında `border-line` ray
 *     taşır. `top` / `bottom` yatay çizgiyi açar, `marks` kesişimlere artı
 *     koyar. Ardışık bölümlerde yalnız ilkine `top` ver; sonrakiler `bottom`
 *     ile çizgiyi paylaşır (çift çizgi olmasın).
 *   - `RuledRow`: `gap-px` + kap `bg-line` + hücreler `bg-page` tekniği:
 *     çizgi hücreler arasındaki 1 piksellik boşluktur, hiçbir hücre kenarlık
 *     taşımaz, bu yüzden hangi sütun sayısında olursa olsun çizgi tektir.
 *     Telefonda 2 sütun: etiket iki sütunu kaplar; hücre sayısı tekse
 *     boş kalan yere zemin renginde dolgu girer (yoksa boşluk çizgi
 *     renginde blok olurdu). Hücre zemini sayfa değilse `RuledRow`a
 *     `cellBg` ver.
 *   - `RuledCell`: tek hücre; `href` verilirse bağlantı olur.
 *
 * ERİŞİLEBİLİRLİK: raylar, yatay çizgiler, artılar ve dolgu `aria-hidden`.
 * Şeritteki hücreler `ul role="list"` (Safari `contents` ile liste rolünü
 * düşürmesin diye açık rol), etiket listenin adıdır (`aria-labelledby`).
 * Bağlantı hücresi ≥ 44 piksel. Hepsi sunucu bileşeni, hareket yok.
 *
 *   <FrameRails top bottom marks width="max-w-6xl">
 *     <Hero />
 *   </FrameRails>
 *   <FrameRails bottom marks>
 *     <RuledRow label="Kullandığın Araçlarla Çalışır">
 *       <RuledCell icon={<Truck />}>Kargoya</RuledCell>
 *       <RuledCell href="/entegrasyonlar">Bütün Entegrasyonlar</RuledCell>
 *     </RuledRow>
 *   </FrameRails>
 */

type FrameRailsProps = {
  children: ReactNode;
  /** İç kabın genişlik sınıfı: `max-w-5xl`, `max-w-6xl`, `max-w-7xl`. */
  width?: string;
  /** Üstte sayfa kenarına uzanan yatay çizgi. */
  top?: boolean;
  /** Altta sayfa kenarına uzanan yatay çizgi. */
  bottom?: boolean;
  /** Yatay çizgiyle rayların kesişiminde artı işareti. */
  marks?: boolean;
  as?: ElementType;
  className?: string;
  /** İç kap (raylı alan) sınıfı: dolgu burada verilir. */
  innerClassName?: string;
};

function Mark({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2", className)}>
      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-line-strong" />
      <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-line-strong" />
    </span>
  );
}

export function FrameRails({
  children,
  width = "max-w-6xl",
  top = false,
  bottom = false,
  marks = false,
  as: Tag = "div",
  className,
  innerClassName,
}: FrameRailsProps) {
  return (
    <Tag className={cn("relative px-4 sm:px-6", className)}>
      {top ? <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" /> : null}
      {bottom ? <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line" /> : null}
      <div className={cn("relative mx-auto w-full border-x border-line", width, innerClassName)}>
        {children}
        {marks && top ? (
          <>
            <Mark className="top-0 left-0" />
            <Mark className="top-0 left-full" />
          </>
        ) : null}
        {marks && bottom ? (
          <>
            <Mark className="top-full left-0" />
            <Mark className="top-full left-full" />
          </>
        ) : null}
      </div>
    </Tag>
  );
}

type RuledCellProps = {
  children: ReactNode;
  /** Kelime işaretinin solundaki ikon (süs). */
  icon?: ReactNode;
  /** Verilirse hücre bağlantıdır ("Bütün Entegrasyonlar"). */
  href?: string;
  className?: string;
};

export function RuledCell({ children, icon, href, className }: RuledCellProps) {
  const inner = (
    <>
      {icon ? <span aria-hidden className="shrink-0 text-muted [&_svg]:size-5">{icon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
    </>
  );
  const base = "flex min-h-20 items-center justify-center gap-2 px-4 text-base font-medium";
  return (
    <li className={cn("min-w-0 bg-[var(--rr-cell)]", className)}>
      {href ? (
        <a
          href={href}
          className={cn(base, "h-full text-strong underline-offset-4 transition-colors hover:bg-surface hover:underline")}
        >
          {inner}
        </a>
      ) : (
        <div className={cn(base, "h-full text-body")}>{inner}</div>
      )}
    </li>
  );
}

type RuledRowProps = {
  /** İlk hücredeki etiket: listenin de adıdır. */
  label?: ReactNode;
  /** `RuledCell` öğeleri. */
  children: ReactNode;
  /** Şeridin üst ve alt kenarı: çerçevenin yatay çizgisiyle çakışıyorsa `none`. */
  edges?: "y" | "top" | "bottom" | "none";
  /** Hücre zemini (CSS rengi); varsayılan sayfa zemini. */
  cellBg?: string;
  className?: string;
};

const EDGES = { y: "border-y border-line", top: "border-t border-line", bottom: "border-b border-line", none: "" } as const;

export function RuledRow({ label, children, edges = "y", cellBg = "var(--color-page)", className }: RuledRowProps) {
  const cells = Children.toArray(children).filter(isValidElement);
  const count = cells.length;
  // Telefonda 2 sütun: etiket satırı tam kaplar, hücre sayısı tekse son boşluğa dolgu.
  const needsFiller = count % 2 === 1;
  const labelId = useId();

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px bg-line sm:[grid-template-columns:var(--rr-cols)]",
        EDGES[edges],
        className,
      )}
      style={
        {
          "--rr-cols": `${label ? "minmax(0,1.4fr) " : ""}repeat(${count}, minmax(0, 1fr))`,
          "--rr-cell": cellBg,
        } as CSSProperties
      }
    >
      {label ? (
        <p
          id={labelId}
          className="col-span-2 flex min-h-16 items-center bg-[var(--rr-cell)] px-4 text-small text-muted sm:col-span-1 sm:min-h-20"
        >
          {label}
        </p>
      ) : null}
      <ul role="list" aria-labelledby={label ? labelId : undefined} className="contents">
        {cells}
        {needsFiller ? <li aria-hidden className="bg-[var(--rr-cell)] sm:hidden" /> : null}
      </ul>
    </div>
  );
}

