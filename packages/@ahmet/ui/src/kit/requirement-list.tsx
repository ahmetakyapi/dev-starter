// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Gerekenler listesi: bir şablonun ya da akışın çalışması için bağlı olması
 * gereken uygulamalar. Her satır uygulama karosu, ad ve durum: bağlıysa
 * yeşil "Bağlı" hapı, değilse "Bağla" butonu. Axon'un şablon penceresindeki
 * "Requires" bloğunun davranışı; kod alınmadı.
 *
 * NE ZAMAN DEĞİL: tek bağlantının ayrıntısı ve kimlik doğrulama akışı
 * `connection-hero` penceresinde; kanal tercihleri `channel-matrix`.
 *
 * Eksik varsa başlığın altındaki özet satırı bunu metinle söyler ("1
 * bağlantı eksik"), canlı bölge değil: liste açıldığında ekran okuyucu
 * bir kez okur. Hepsi bağlıysa "Hepsi bağlı". Durum rengi tek işaret
 * değil: "Bağlı" yazısı ve onay işareti. `onConnect(id)` bağlamayı başlatır;
 * butonun adı uygulamayı söyler ("Slack'i bağla").
 *
 *   <RequirementList items={[{ id: "slack", name: "Slack", icon: <SlackMark />, status: "missing" }]}
 *     onConnect={(id) => startOAuth(id)} />
 */

export type Requirement = {
  id: string;
  name: string;
  /** Uygulama karosunun içi (süs). */
  icon: ReactNode;
  status: "connected" | "missing";
};

export function RequirementList({
  items,
  onConnect,
  title = "Gerekenler",
  className,
}: {
  items: readonly Requirement[];
  onConnect?: (id: string) => void;
  title?: string;
  className?: string;
}) {
  const missing = items.filter((i) => i.status === "missing").length;
  return (
    <section className={className}>
      <h3 className="text-small font-medium text-muted">{title}</h3>
      <p className="sr-only">{missing > 0 ? `${missing} bağlantı eksik` : "Hepsi bağlı"}</p>
      <ul className="mt-2 divide-y divide-line-soft">
        {items.map((item) => (
          <li key={item.id} className="flex min-h-14 items-center gap-3 py-2">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-overlay shadow-raised [&_svg]:size-5"
            >
              {item.icon}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-medium text-strong">{item.name}</span>
            {item.status === "connected" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-wash px-2.5 py-1 text-small font-medium text-success">
                <Check aria-hidden className="size-3.5" />
                Bağlı
              </span>
            ) : (
              <button
                type="button"
                aria-label={`${item.name} bağla`}
                onClick={() => onConnect?.(item.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md border border-line-strong bg-overlay px-3.5 text-small font-medium text-strong shadow-raised",
                  "transition-colors hover:bg-surface pointer-fine:min-h-9",
                )}
              >
                Bağla
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
