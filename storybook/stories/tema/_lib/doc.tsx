import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vitrin sayfası iskeleti: Storybook'un varsayılan docs stili yerine
 * ekosistemin kendi tipografisi ve yüzeyleri. Bütün Tema sayfaları ve Giriş
 * bunlarla kurulur ki tek elden çıkmış gibi dursun.
 */

export function DocPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="min-h-dvh w-full bg-page text-body">
      <div className={cn("mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 sm:py-20", className)}>{children}</div>
    </main>
  );
}

/** Sayfa başı: künye, büyük sıkı başlık, kısa giriş. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      <p className="font-mono text-small text-muted">{eyebrow}</p>
      <h1 className="mt-4 text-display font-semibold tracking-[-0.035em] text-strong sm:text-[3.5rem] sm:leading-[1.02]">
        {title}
      </h1>
      {lead ? <p className="mt-5 max-w-2xl text-lead text-body">{lead}</p> : null}
      {children}
    </header>
  );
}

/** Bölüm: kıl çizgisiyle ayrılır, başlık + bir iki cümle açıklama. */
export function Section({
  id,
  title,
  description,
  children,
  aside,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-baslik` : undefined} className="mt-16 border-t border-line pt-10 sm:mt-24 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id={id ? `${id}-baslik` : undefined} className="text-heading font-semibold tracking-[-0.025em] text-strong">
            {title}
          </h2>
          {description ? <p className="mt-2 text-read text-body">{description}</p> : null}
        </div>
        {aside}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Satır içi sınıf / değişken adı. */
export function Token({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={cn("rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-small text-strong", className)}>
      {children}
    </code>
  );
}

/** Küçük, sessiz açıklama satırı. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-small text-muted", className)}>{children}</p>;
}

/** Kod bloğu: kuyu zemini, mono. */
export function CodeBlock({ children, className, label }: { children: string; className?: string; label?: string }) {
  return (
    <pre
      aria-label={label}
      className={cn("overflow-x-auto rounded-lg bg-surface-sunken p-4 font-mono text-small leading-relaxed text-strong", className)}
      tabIndex={0}
    >
      <code>{children}</code>
    </pre>
  );
}

/** İki tema yan yana: başlık çubuğu + iki panel. */
export function ThemeLabel({ theme }: { theme: "light" | "dark" }) {
  return (
    <span className="inline-flex items-center gap-2 text-small font-medium text-muted">
      {theme === "light" ? <Sun aria-hidden className="size-3.5" /> : <Moon aria-hidden className="size-3.5" />}
      {theme === "light" ? "Açık Tema" : "Koyu Tema"}
    </span>
  );
}

/** Storybook içinde başka sayfaya bağlantı (iframe'den üst pencereye). */
export function storyHref(id: string) {
  return `./?path=/story/${id}`;
}
