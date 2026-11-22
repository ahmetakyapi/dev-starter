// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { cn } from "../utils";

/**
 * İletişim listesi: bir kişinin ya da firmanın telefon, e-posta, adres ve
 * web adresleri; her satırda TÜR ETİKETİ ("İş", "Kişisel", "Fatura") ve
 * KOPYALA butonu. Müşteri kartı, tedarikçi profili, iş yeri detayı. Brick
 * ve Zain müşteri ekranlarındaki "Contact" bloğundan alındı (yapı).
 *
 * DÖRT TÜR, tek yapı: `phone` (tel: bağlantısı), `email` (mailto:),
 * `address` (düz metin; `href` verilirse harita bağlantısı), `web`
 * (https bağlantısı). Bağlantı HEP türden ÜRETİLİR, çağıranın verdiği ham
 * dizgiden değil: telefondan yalnız rakam ve "+" alınır, e-posta
 * `mailto:`la, web adresi `https://`le başlar (şemasızsa eklenir;
 * `javascript:` gibi bir şema asla bağlantıya girmez, düz metin kalır).
 * Adres `href`i yalnız `http(s)` kabul edilir.
 *
 * KOPYALA: `copy-button.tsx` (ikon değişir + görünmez canlı bölge
 * "Kopyalandı" der; pano izni yoksa "Kopyalanamadı"). Adres için kopyala
 * tek satırlı biçimi kopyalar; satır sonları boşluğa çevrilir.
 *
 * Satır: ikon (süs), değer (bağlantı ya da metin, uzunsa kırılır),
 * sağda etiket, en sonda kopyala. Ekran okuyucu "Telefon, İş: (606) 555-0103"
 * diye okur: tür ve etiket değerin başında `sr-only` önek, görünen etiket
 * sağda süs (`aria-hidden`) olduğu için iki kez okunmaz. Boş liste hiçbir
 * şey çizmez.
 *
 *   <ContactList
 *     title="İletişim"
 *     items={[
 *       { kind: "phone", label: "İş", value: "(606) 555-0103" },
 *       { kind: "email", label: "Kişisel", value: "ada@ornek.com" },
 *       { kind: "address", label: "Fatura", value: "Atatürk Cad. 12, Çankaya, Ankara" },
 *     ]}
 *   />
 */

export type ContactKind = "phone" | "email" | "address" | "web";
export type ContactItem = { kind: ContactKind; value: string; label?: string; href?: string };

const ICON = { phone: Phone, email: Mail, address: MapPin, web: Globe } as const;
const KIND_NAME = { phone: "Telefon", email: "E-posta", address: "Adres", web: "Web adresi" } as const;

/** Güvenli http(s) adresi ya da `null`. Şemasız web adresine `https://` eklenir. */
function safeUrl(input: string, bare: boolean): string | null {
  const text = input.trim();
  if (!text) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text) || !bare ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function linkFor(item: ContactItem): string | null {
  if (item.kind === "phone") {
    const digits = item.value.replace(/[^\d+]/g, "");
    return /\d/.test(digits) ? `tel:${digits}` : null;
  }
  if (item.kind === "email") {
    const mail = item.value.trim();
    return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(mail) ? `mailto:${mail}` : null;
  }
  if (item.kind === "web") return safeUrl(item.value, true);
  return item.href ? safeUrl(item.href, false) : null;
}

export function ContactList({
  items,
  title,
  headingLevel = 3,
  titleAction,
  className,
}: {
  items: readonly ContactItem[];
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  titleAction?: ReactNode;
  className?: string;
}) {
  if (items.length === 0) return null;
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  const list = (
    <ul className="divide-y divide-line-soft">
      {items.map((item, i) => {
        const Glyph = ICON[item.kind];
        const href = linkFor(item);
        const external = item.kind === "web" || (item.kind === "address" && href);
        const body = (
          <>
            <span className="sr-only">
              {KIND_NAME[item.kind]}
              {item.label ? `, ${item.label}` : ""}:{" "}
            </span>
            {item.value}
          </>
        );
        return (
          <li key={i} className="flex min-h-11 items-center gap-3 py-2 pointer-fine:min-h-10">
            <Glyph aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 text-base text-strong break-words">
              {href ? (
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="underline decoration-line-strong underline-offset-4 hover:decoration-current"
                >
                  {body}
                </a>
              ) : (
                body
              )}
            </span>
            {item.label ? (
              <span aria-hidden className="shrink-0 text-small text-body">
                {item.label}
              </span>
            ) : null}
            <CopyButton
              value={item.kind === "address" ? item.value.replace(/\s*\n\s*/g, " ") : item.value}
              label={`${KIND_NAME[item.kind]} kopyala${item.label ? ` (${item.label})` : ""}`}
            />
          </li>
        );
      })}
    </ul>
  );

  if (!title) return <div className={cn("min-w-0", className)}>{list}</div>;
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <H className="text-read font-semibold text-strong">{title}</H>
        {titleAction ? <div className="shrink-0 text-small">{titleAction}</div> : null}
      </div>
      <div className="mt-1">{list}</div>
    </section>
  );
}
