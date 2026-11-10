// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Menu, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DUR, EASE } from "../variants";
import { cn } from "../utils";

/**
 * Yuvaya oturan menü: sayfanın başında üstten boşluklu, tam yuvarlak beyaz
 * bir hap; kaydırınca yukarı kayıp ekranın üst kenarına YAPIŞIR, üst köşeleri
 * düzleşir, alt köşeler yuvarlak kalır ve gölgesi derinleşir (Ribbon). Cam
 * değil, opak: arkasından geçen fotoğraf ya da koyu demo okunurluğu bozmaz.
 *
 * Şablondaki `SiteHeader`dan farkı: o sayfanın başında zeminle bir, kaydırınca
 * cam hapa TOPLANIR. Bu baştan haptır ve kaydırınca kenara OTURUR. Görsel
 * zeminli kahramanda (fotoğraf, çizim) bu; düz zeminde `SiteHeader`.
 *
 * GEÇİŞ: yalnız `margin-top`, köşe yarıçapı, iç boşluk ve gölge, 300 ms
 * `--ease-brand` (her şeyi canlandıran geçiş değil). Kaydırma `useSyncExternalStore`
 * ile okunur ve anlık görüntü BOOLE: bileşen yalnız eşik geçilince yeniden
 * çizilir, sayfa ortasında yenilenince de ilk karede doğru durumdadır
 * (efekt içinde setState yok). Hareketi azaltan kullanıcıda anında.
 *
 * TELEFON: bağlantılar menü düğmesinin altında açılan panelde. Esc kapatır
 * ve odağı düğmeye döndürür; panelden Tab ile çıkınca kapanır.
 *
 *   <DockingNav
 *     brand={<a href="/" className="font-bold text-strong">Ribbon</a>}
 *     links={[{ href: "#fiyat", label: "Fiyat" }, { href: "#sss", label: "SSS" }]}
 *     action={<a href="/indir" className="… bg-cta text-on-brand">İndir</a>}
 *   />
 */

type NavLink = { href: string; label: string };

type DockingNavProps = {
  brand: ReactNode;
  links: readonly NavLink[];
  /** Sağdaki birincil eylem (tek). */
  action?: ReactNode;
  /** Kaç piksel kaydırınca yuvaya otursun. */
  threshold?: number;
  label?: string;
  className?: string;
};

const onScroll = (notify: () => void) => {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
};

export function DockingNav({ brand, links, action, threshold = 24, label = "Ana menü", className }: DockingNavProps) {
  const reduce = useReducedMotion();
  const docked = useSyncExternalStore(onScroll, () => window.scrollY > threshold, () => false);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const inside = panel.current?.contains(document.activeElement);
      setOpen(false);
      if (inside) button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const attached = docked || open;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-40 flex justify-center">
      <div className="pointer-events-auto relative mx-4 max-w-full sm:mx-6">
        <nav
          aria-label={label}
          data-docked={attached || undefined}
          className={cn(
            "flex items-center bg-overlay text-strong",
            !reduce && "transition-[margin,border-radius,padding,box-shadow] duration-300 ease-[var(--ease-brand)]",
            attached
              ? "mt-0 gap-3.5 rounded-t-none rounded-b-[1.375rem] py-2.5 pr-2.5 pl-3.5 shadow-floating ring-1 ring-line-soft"
              : "mt-5 gap-3 rounded-full p-2 shadow-raised ring-1 ring-line-soft",
            className,
          )}
        >
          <div className="flex shrink-0 items-center pl-1">{brand}</div>
          <ul className="hidden items-center md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-9 items-center rounded-full px-2.5 text-small text-soft transition-colors hover:bg-surface hover:text-strong"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {action ? <div className="ml-auto shrink-0 md:ml-0">{action}</div> : null}
          <button
            ref={button}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className={cn(
              "inline-grid size-11 shrink-0 place-items-center rounded-full text-soft hover:bg-surface hover:text-strong md:hidden [&_svg]:size-5",
              !action && "ml-auto",
            )}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </nav>

        <AnimatePresence>
          {open ? (
            <m.div
              ref={panel}
              id={panelId}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (next && !event.currentTarget.contains(next) && next !== button.current) setOpen(false);
              }}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="absolute inset-x-0 top-full mt-2 rounded-2xl bg-overlay p-2 shadow-modal ring-1 ring-line md:hidden"
            >
              <ul>
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center rounded-xl px-3 text-read font-medium text-strong hover:bg-surface"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
