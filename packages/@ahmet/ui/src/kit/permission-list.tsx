// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * İzin listesi: bir uygulamayı bağlama penceresinde "<Uygulama> şunları
 * yapabilecek" dökümü. Kullanıcı OAuth onayından önce neye izin verdiğini
 * satır satır okur. MailPulse'un bağlantı penceresinden alındı (yalnız yapı).
 *
 * Her satır: onay ikonu + izin metni + erişim türü. `access` rozeti renkle
 * değil METİNLE söyler: "Okur" sönük, "Yazar" vurgulu çerçeveli; yazma
 * izni okumadan daha dikkat çekmeli ama renk tek işaret değil.
 *
 * KURAL: izin metni gerçekte istenen kapsamla birebir olsun ("müşterileri
 * okur", "fatura oluşturur"); iyimser özet yazma. En çok 5-6 satır; uzunsa
 * kapsamı grupla. Alttaki `footnote` güvence satırıdır ("OAuth ile güvenli
 * bağlanır"), yalnız doğruysa.
 *
 * Sunucu bileşeni, `ul`: ekran okuyucu "3 öğeden 1" der. İkon süs.
 *
 *   <PermissionList title="Kargo şunları yapabilecek" items={[{ id: "r", text: "Siparişleri okur", access: "read" }]} footnote="OAuth ile güvenli" />
 */

export type Permission = {
  id: string;
  text: ReactNode;
  access?: "read" | "write";
};

const ACCESS = {
  read: { label: "Okur", cls: "border-line text-muted" },
  write: { label: "Yazar", cls: "border-primary/40 bg-primary-wash text-primary-ink" },
} as const;

export function PermissionList({
  title,
  items,
  footnote,
  className,
}: {
  title: ReactNode;
  items: readonly Permission[];
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <h3 className="text-micro font-semibold tracking-wide text-muted">{title}</h3>
      <ul className="mt-2 divide-y divide-line-soft">
        {items.map((item) => {
          const access = item.access ? ACCESS[item.access] : null;
          return (
            <li key={item.id} className="flex items-center gap-2.5 py-2 text-small text-body">
              <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-success-wash text-success [&_svg]:size-3">
                <Check strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">{item.text}</span>
              {access ? (
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-micro font-medium", access.cls)}>
                  {access.label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {footnote ? <p className="mt-3 text-micro text-muted">{footnote}</p> : null}
    </section>
  );
}
