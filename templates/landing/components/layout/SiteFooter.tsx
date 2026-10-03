import { Layers } from "lucide-react";
import { footer } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line-soft pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-8 place-items-center rounded-sm bg-brand text-on-brand [&_svg]:size-4">
              <Layers />
            </span>
            <span className="text-read font-bold text-strong">{SITE_NAME}</span>
          </span>
          <p className="mt-3 text-base text-soft">{footer.tagline}</p>
        </div>
        <nav aria-label="Alt bilgi">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {footer.links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="inline-flex min-h-11 items-center text-base text-body transition-colors hover:text-strong">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl px-4 text-small text-muted sm:px-6">
        © {year} {SITE_NAME}
      </p>
    </footer>
  );
}
