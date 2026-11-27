// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Send } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { AnimatedIcon, type IconMotion } from "./animated-icon";
import { cn } from "../utils";

/**
 * Profil açılışı: kişisel sitenin, ekip/yazar sayfasının ya da bir ürün
 * kapağının sakin girişi. Dar bir sütunda (≈34rem, sayfada ortalı, metin sola
 * yaslı) yukarıdan aşağı: 64 px yumuşak köşeli avatar, ad (sade, orta
 * ağırlık; dev başlık DEĞİL), "Güncellendi 22 Kas 2026" tazelik satırı,
 * eylem satırı (koyu hap CTA + yalnız ikonlu bağlantılar) ve kısa biyografi.
 *
 * NE ZAMAN DEĞİL: ürün satan tanıtım sayfası kahramanı (iddia ve görsel
 * ister: `components/heroes`), uygulama içi kullanıcı kartı (`hover-card`
 * `ProfilePreview`), yorum/gönderi başlığı (`note-card`).
 *
 * NASIL ÇALIŞIR
 * - Açılış yalnız CSS: avatar, tazelik, eylemler ve biyografi 60 ms arayla
 *   buğudan gelir (blur 2 px, 6 px, 480 ms, `--ease-brand`). Ad HİÇ
 *   gizlenmez (LCP öğesi). JavaScript'siz de son durum görünür (`both`).
 * - Her ikon anlamına uygun oynar (`animated-icon`): sosyal ağ zıplar
 *   (`bounce`), kod deposu döner (`spin`), yazı kıpırdar (`wiggle`); e-posta
 *   ikonu "gönderilir": sağ üste uçup sol alttan geri gelir.
 * - Üstüne gelince/odakta küçük balon ikonun adını söyler (CSS; Base UI
 *   yok, kit uyumlu). `email` verilirse gönder ikonu bağlantı değil buton:
 *   tıklanınca adresi panoya kopyalar, balon 1,6 sn "Panoya kopyalandı" olur.
 *
 * ERİŞİLEBİLİRLİK: ad `h1` (ya da `titleAs`); tarih `<time dateTime>`.
 * İkon bağlantılarının adı `aria-label`; balon aynı metnin görünür hali
 * (`aria-hidden`). Kopyalama sonucu `role="status"` canlı bölgede, hata da
 * söylenir. Dokunma hedefi ≥ 44 px (görsel 32). Hover yalnız ince işaretçide;
 * hareket azaltmada açılış ve ikon hareketi yok.
 *
 * Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod alınmadı.
 *
 *   <ProfileIntro
 *     name="Deniz Aydın"
 *     updated="2026-11-22"
 *     cta={{ label: "Görüşme Planla", href: "/iletisim" }}
 *     links={[{ label: "Kod Deposu", href: "…", icon: CodeXml, motion: "spin" }]}
 *     email="deniz@ornek.com"
 *   >
 *     <p>İstanbul'da doğdum; ürün tasarımı yapıyorum.</p>
 *   </ProfileIntro>
 */

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

export type ProfileLink = {
  /** Erişilebilir ad ve balon metni ("Kod Deposu", "@deniz sosyal ağda"). */
  label: string;
  href: string;
  icon: IconComp;
  /** İkonun anlamına uygun hareket; varsayılan `bounce`. */
  motion?: IconMotion | "none";
  /** Yeni sekmede aç (dış bağlantı). Varsayılan: `http` ile başlıyorsa evet. */
  external?: boolean;
  /** Çerçeveden çıkan iç bağlantı (`_top`: Storybook, gömülü önizleme). `external` önceliklidir. */
  target?: "_self" | "_top" | "_parent";
};

type ProfileIntroProps = {
  name: string;
  /** Avatar yuvası: `<img>` ya da ikon. Yoksa adın baş harfleri. */
  avatar?: ReactNode;
  /** Son güncelleme (ISO metin ya da Date). */
  updated?: string | Date;
  updatedLabel?: string;
  cta?: { label: string; href?: string; onClick?: () => void; target?: "_self" | "_top" | "_parent" };
  links?: readonly ProfileLink[];
  /** Verilirse sonda kopyalanan e-posta butonu. */
  email?: string;
  copyLabel?: string;
  copiedLabel?: string;
  titleAs?: "h1" | "h2";
  /** Biyografi paragrafları. */
  children?: ReactNode;
  className?: string;
};

const CSS = `
@keyframes ui-pi-in { from { opacity: 0; translate: 0 6px; filter: blur(2px); } }
@keyframes ui-pi-send {
  0% { translate: 0 0; opacity: 1; animation-timing-function: cubic-bezier(.55,0,.75,.3); }
  45% { translate: 12px -12px; opacity: 0; }
  50% { translate: -12px 12px; opacity: 0; animation-timing-function: cubic-bezier(.16,1,.3,1); }
  100% { translate: 0 0; opacity: 1; }
}
.ui-pi-step { animation: ui-pi-in 480ms var(--ease-brand) both; animation-delay: calc(var(--i, 0) * 60ms + 80ms); }
.ui-pi-tip {
  position: absolute; left: 50%; bottom: calc(100% + 2px); translate: -50% 4px;
  opacity: 0; pointer-events: none; white-space: nowrap;
  transition: opacity 160ms ease, translate 200ms var(--ease-brand);
}
@media (hover: hover) {
  .ui-pi-icon:hover .ui-pi-tip { opacity: 1; translate: -50% 0; transition-delay: 120ms; }
  .ui-pi-icon:hover .ui-pi-send { animation: ui-pi-send 700ms both; }
}
.ui-pi-icon:focus-visible .ui-pi-tip, .ui-pi-icon[data-copied] .ui-pi-tip { opacity: 1; translate: -50% 0; }
.ui-pi-icon:focus-visible .ui-pi-send { animation: ui-pi-send 700ms both; }
@media (prefers-reduced-motion: reduce) {
  .ui-pi-step, .ui-pi-send { animation: none !important; }
  .ui-pi-tip { transition: opacity 120ms ease; translate: -50% 0; }
}`;

const ICON_HIT =
  "ui-pi-icon group relative inline-grid size-11 place-items-center rounded-full text-muted transition-colors hover:text-strong focus-visible:text-strong focus-visible:outline-none before:absolute before:inset-1.5 before:rounded-full before:transition-colors hover:before:bg-surface focus-visible:before:ring-2 focus-visible:before:ring-line-focus";
const TIP = "ui-pi-tip z-10 rounded-md bg-strong px-2 py-1 text-micro font-medium text-page shadow-floating";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase("tr-TR"))
    .join("");
}

function step(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

export function ProfileIntro({
  name,
  avatar,
  updated,
  updatedLabel = "Güncellendi",
  cta,
  links = [],
  email,
  copyLabel,
  copiedLabel = "Panoya kopyalandı",
  titleAs: Title = "h1",
  children,
  className,
}: ProfileIntroProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const date = updated ? (typeof updated === "string" ? new Date(updated) : updated) : null;
  const dateText = date
    ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(date)
    : null;

  async function copy() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 1600);
  }

  const copyName = copyLabel ?? (email ? `E-postayı kopyala: ${email}` : "");
  const tipText = status === "copied" ? copiedLabel : status === "error" ? "Kopyalanamadı" : copyName;
  const ctaClass =
    "inline-flex min-h-8 items-center rounded-full bg-strong px-3.5 text-small font-medium text-page transition-[scale,opacity] hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page";

  return (
    <header className={cn("mx-auto w-full max-w-[34rem] text-left", className)}>
      <style href="ui-profile-intro" precedence="default">
        {CSS}
      </style>
      <div
        className="ui-pi-step grid size-16 place-items-center overflow-hidden rounded-[1.125rem] bg-surface text-title font-medium text-strong ring-1 ring-line-soft [&>img]:size-full [&>img]:object-cover"
        style={step(0)}
        aria-hidden={avatar ? undefined : true}
      >
        {avatar ?? initials(name)}
      </div>

      <Title className="mt-4 text-lead font-medium tracking-[-0.01em] text-strong">{name}</Title>
      {dateText && (
        <p className="ui-pi-step mt-0.5 text-small text-soft" style={step(1)}>
          {updatedLabel} <time dateTime={date!.toISOString().slice(0, 10)}>{dateText}</time>
        </p>
      )}

      {(cta || links.length > 0 || email) && (
        <div className="ui-pi-step mt-3 -ml-0.5 flex flex-wrap items-center gap-x-0.5" style={step(2)}>
          {cta &&
            (cta.href ? (
              <a href={cta.href} target={cta.target} onClick={cta.onClick} className={cn(ctaClass, "mr-2")}>
                {cta.label}
              </a>
            ) : (
              <button type="button" onClick={cta.onClick} className={cn(ctaClass, "mr-2")}>
                {cta.label}
              </button>
            ))}
          {links.map((l) => {
            const external = l.external ?? /^https?:/.test(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-label={l.label}
                className={ICON_HIT}
                {...(external ? { target: "_blank", rel: "noreferrer" } : l.target ? { target: l.target } : {})}
              >
                <span className="relative">
                  {l.motion === "none" ? (
                    <l.icon aria-hidden size={16} strokeWidth={1.8} />
                  ) : (
                    <AnimatedIcon icon={l.icon} motion={l.motion ?? "bounce"} size={16} strokeWidth={1.8} />
                  )}
                </span>
                <span aria-hidden className={TIP}>
                  {l.label}
                </span>
              </a>
            );
          })}
          {email && (
            <button
              type="button"
              onClick={copy}
              aria-label={tipText}
              data-copied={status !== "idle" ? "" : undefined}
              className={ICON_HIT}
            >
              <span className="relative">
                <Send aria-hidden size={16} strokeWidth={1.8} className="ui-pi-send" />
              </span>
              <span aria-hidden className={TIP}>
                {tipText}
              </span>
            </button>
          )}
          <span role="status" className="sr-only">
            {status === "copied" ? copiedLabel : status === "error" ? "E-posta kopyalanamadı" : ""}
          </span>
        </div>
      )}

      {children && (
        <div
          className="ui-pi-step mt-6 grid gap-5 text-base leading-relaxed text-pretty text-body [&_p]:m-0"
          style={step(3)}
        >
          {children}
        </div>
      )}
    </header>
  );
}
