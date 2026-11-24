import { Layers } from "lucide-react";
import { footer } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

/*
 * Alt bilgi: düzenli sütunlar (marka + açıklama, sonra başlıklı bağlantı
 * grupları) ve telif satırı.
 *
 * Kabı dolduran dev KELİME İŞARETİ ve büyük veda cümlesi bilerek YOK
 * (knowledge/decisions.md → "Alt Bilgide Kelime İşareti Yok", Kasım 2026):
 * ad zaten yukarıda okunuyor; tekrar ekran boyu süs, şablon kokusu verir.
 */
export function SiteFooter() {
  // Sayfa statik (`○`): yıl DERLEMEDE basılır, yılbaşından sonraki ilk
  // deploy'a kadar eski yıl görünür. İstemcide hesaplamak hidrasyon farkı demek.
  const year = new Date().getFullYear();
  const groups = [...footer.columns, { title: footer.legalTitle, links: footer.links }];
  return (
    <footer className="border-t border-line-soft pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-8 place-items-center rounded-sm bg-brand text-on-brand [&_svg]:size-4">
              <Layers />
            </span>
            <span className="text-read font-semibold text-strong">{SITE_NAME}</span>
          </span>
          <p className="mt-4 max-w-sm text-base text-soft">{footer.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-small font-semibold text-strong">{group.title}</h2>
              <ul className="mt-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-base text-body transition-colors hover:text-strong pointer-fine:min-h-8"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-4 text-small text-muted sm:px-6">
        © {year} {SITE_NAME}
      </p>
    </footer>
  );
}
