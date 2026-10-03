import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Anahtar: ANINDA etki eden aç/kapa ayarı ("Bildirimler", "Koyu Tema").
 * Kaydet düğmesine bağlı bir seçimse `checkbox.tsx`: kullanıcı anahtarın
 * çevrildiği anda bir şey olmasını bekler.
 *
 * YEREL GİRİŞ: `<input type="checkbox" role="switch">`. JavaScript'siz
 * çalışır, formla birlikte gönderilir (`name`, `value`), sunucu eylemine
 * doğrudan bağlanır ve sunucu bileşeninde çizilebilir. Ekran okuyucu
 * "anahtar, açık" der. Giriş görünmez ama ERİŞİLEBİLİR (`sr-only`, `hidden`
 * değil); görünen ray onun `peer` durumunu izler.
 *
 * Dokunma hedefi etiketin tamamı (en az 44 piksel yükseklik); rayın kendisi
 * küçük kalabilir.
 */

type SwitchProps = Omit<ComponentProps<"input">, "type" | "role" | "size"> & {
  label: ReactNode;
  /** Etiketin altında cümle düzeninde açıklama. */
  hint?: ReactNode;
  /** Ray solda mı sağda mı. Ayar listelerinde sağda, satır içinde solda. */
  placement?: "start" | "end";
};

export function Switch({ label, hint, placement = "end", className, disabled, ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center gap-3 py-1.5",
        placement === "end" && "justify-between",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input type="checkbox" role="switch" disabled={disabled} className="peer sr-only" {...props} />
      <span className={cn("min-w-0", placement === "start" && "order-2")}>
        <span className="block text-base font-medium text-strong">{label}</span>
        {hint ? <span className="mt-0.5 block text-small text-muted">{hint}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-line-strong bg-surface-raised transition-colors",
          // Kapalıyken soluk başparmak, açıkken `on-primary`: iki temada da rayından ayrışır.
          "after:ml-0.5 after:size-[1.125rem] after:rounded-full after:bg-muted after:shadow-raised after:transition-[translate,background-color]",
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:after:translate-x-4 peer-checked:after:bg-on-primary",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-line-focus peer-focus-visible:outline-solid",
          placement === "start" && "order-1",
        )}
      />
    </label>
  );
}
