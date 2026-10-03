import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Panel: sayfanın temel yüzeyi. Derinlik GÖLGEYLE DEĞİL ton farkı + tek
 * piksellik çizgiyle; cam efekti burada yok (gerekiyorsa `glass` sınıfı).
 *
 * Her panelin bir başlığı olur (`PanelHeader`, h2). Başlıksız panelin nerede
 * başladığı yalnızca çizgiden anlaşılır; ekran okuyucu ise hiç anlamaz.
 *
 * `min-w-0` ŞART: ızgara öğesinin varsayılanı `min-width: auto` ve iz,
 * içerideki `truncate`/`nowrap` satırın KESİLMEMİŞ genişliğine göre
 * boyutlanıyordu. Ölçüldü: 390 piksel ekranda her panel 461 piksel çıktı ve
 * sağdan taştı; kökteki `overflow-x: clip` taşmayı gizlediği için
 * `scrollWidth` ölçümü bunu göstermedi.
 */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("surface min-w-0 rounded-lg p-5 sm:p-6", className)} {...props} />;
}

type PanelHeaderProps = {
  title: ReactNode;
  /** Başlığın altında tek satırlık künye ya da açıklama. */
  meta?: ReactNode;
  /** Sağda tek denetim (düğme, bağlantı). */
  action?: ReactNode;
  className?: string;
};

export function PanelHeader({ title, meta, action, className }: PanelHeaderProps) {
  return (
    <header className={cn("mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <h2 className="text-title font-semibold">{title}</h2>
        {meta ? <p className="mt-1 text-small text-muted">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
