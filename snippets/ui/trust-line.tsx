import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Güven satırı: birincil eylemin hemen altında, küçük simge ve noktayla
 * ayrılmış kısa güvenceler. Ribbon her indirme düğmesinin altına aynı
 * satırı koyar ("Apple onaylı · Geliştirici kimliğiyle imzalı · Gatekeeper'dan
 * temiz açılır"); tıklamadan hemen önceki "güvenli mi?" sorusunu orada,
 * düğmenin dibinde yanıtlar. Ödeme düğmesinin altında "Ödeme Stripe
 * güvencesinde", kayıtta "Kart gerekmez · 2 dakikada kurulum".
 *
 * KURAL: en çok üç güvence, her biri doğrulanabilir bir olgu ("şifreli
 * bağlantı", "KVKK uyumlu" ancak gerçekten öyleyse). Sıfat değil olgu:
 * "güvenilir" yazma, neden güvenilir olduğunu yaz. Uydurma rozet ve
 * sayı yok (guides/08 → veri dürüstlüğü).
 *
 * Ayraç nokta süstür (`aria-hidden`); ekran okuyucu yerine görünmez virgülü
 * duyar, güvenceler birbirine yapışmaz. `tone="media"` görsel zemin üstü.
 *
 *   <TrustLine items={["Apple onaylı", "İmzalı", "Gatekeeper'dan temiz açılır"]} />
 */

type TrustLineProps = {
  items: readonly ReactNode[];
  /** Baştaki simge; varsayılan kalkan. `null` simgesiz. */
  icon?: ReactNode | null;
  tone?: "default" | "media";
  align?: "center" | "start";
  className?: string;
};

export function TrustLine({ items, icon, tone = "default", align = "center", className }: TrustLineProps) {
  const mark = icon === undefined ? <ShieldCheck /> : icon;
  return (
    <p
      className={cn(
        "flex max-w-md items-start gap-1.5 text-micro leading-relaxed",
        align === "center" ? "mx-auto justify-center text-center" : "justify-start text-left",
        tone === "media" ? "text-on-brand/80" : "text-muted",
        className,
      )}
    >
      {mark ? (
        <span aria-hidden className="mt-0.5 shrink-0 opacity-90 [&_svg]:size-3.5">
          {mark}
        </span>
      ) : null}
      <span>
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 ? (
              <>
                <span aria-hidden> · </span>
                <span className="sr-only">, </span>
              </>
            ) : null}
            {item}
          </span>
        ))}
      </span>
    </p>
  );
}
