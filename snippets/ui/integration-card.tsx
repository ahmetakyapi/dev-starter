"use client";

import { ArrowRight } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Entegrasyon kartı: bağlanabilir bir uygulamanın ızgaradaki karosu
 * (muhasebe, kargo, takvim, mesajlaşma). MailPulse'un entegrasyonlar
 * sayfasındaki kart yapısından alındı (yalnız yapı; kod, ad, logo yok).
 *
 * İKİ HAL, TEK SORU ("bağlı mı?"):
 *   Bağlı     → sağ üstte yeşil noktalı "Bağlı" hapı; altta son eşitleme
 *               zamanı ve ANINDA etki eden anahtar (eşitlemeyi aç/kapa).
 *   Bağlı değil → sağ üstte "Bağla" butonu; altta kurulum maliyeti
 *               ("Ücretsiz · 2 dk kurulum") ve süs oku.
 *
 * NE ZAMAN DEĞİL: kart bir sayfaya götürüyorsa bağlantı olsun, burada
 * eylem iki ayrı öğe. Kartın TAMAMI tıklanmaz: bağla butonu ile anahtar
 * ayrı, odaklanabilir iki hedef; iç içe etkileşimli öğe yok.
 * `article`dır; başlığı `h3` (ızgaranın üstünde `h2` olmalı).
 *
 * `menu` yuvası: kebab menü (`dropdown-menu`) ya da `icon-button`; Bağlı
 * hapının yanında durur. `icon`: uygulama karosunun içi (marka ikonu
 * çağıranın işi; burada yalnız token'lı çerçeve). `lastSync` hazır metin:
 * göreli zaman sunucu ile istemcide farklı çıkar, biçimi çağıran verir.
 *
 * Erişilebilirlik: anahtarın adı "<uygulama>: eşitleme" (görünmez etiket);
 * bağla butonunun adı varsayılan etiketle "<uygulama> uygulamasını bağla",
 * özel `connectLabel` ile "<etiket>: <uygulama>" (görünen metin adın içinde
 * kalır, WCAG 2.5.3); durum hapında metin. Anahtar `onToggle` verilirse
 * KONTROLLÜ (`syncing` doğruluk kaynağı), verilmezse `syncing` yalnız
 * başlangıç değeridir ve anahtar kendi durumunu tutar. `headingLevel`:
 * kart başlığı düzeyi (varsayılan 3).
 *
 *   <IntegrationGrid>
 *     <IntegrationCard name="Kargo" category="Lojistik" description="…" icon={<Truck />} connected lastSync="4 dk önce eşitlendi" syncing onToggle={setSync} />
 *   </IntegrationGrid>
 */

type IntegrationCardProps = {
  name: string;
  category: string;
  description: ReactNode;
  /** Uygulama karosunun içi. */
  icon: ReactNode;
  connected?: boolean;
  /** Bağlıyken altta görünen metin: "4 dk önce eşitlendi". */
  lastSync?: ReactNode;
  /** Bağlı değilken altta görünen metin. */
  setup?: ReactNode;
  /** Eşitleme anahtarının durumu (bağlıyken). */
  syncing?: boolean;
  onToggle?: (next: boolean) => void;
  onConnect?: () => void;
  /** Sağ üstte durumun yanında: kebab menü. */
  menu?: ReactNode;
  connectLabel?: string;
  /** Kart başlığı düzeyi, 2-4. Varsayılan 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

export function IntegrationCard({
  name,
  category,
  description,
  icon,
  connected = false,
  lastSync,
  setup = "Ücretsiz · 2 dk kurulum",
  syncing = true,
  onToggle,
  onConnect,
  menu,
  connectLabel = "Bağla",
  headingLevel = 3,
  className,
}: IntegrationCardProps) {
  const H = `h${headingLevel}` as ElementType;
  return (
    <article className={cn("flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-overlay p-4 shadow-raised", className)}>
      <header className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-strong [&_svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <H className="truncate text-read font-semibold text-strong">{name}</H>
          <p className="truncate text-small text-muted">{category}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {connected ? (
            <Badge tone="success" dot>
              Bağlı
            </Badge>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              aria-label={connectLabel === "Bağla" ? `${name} uygulamasını bağla` : `${connectLabel}: ${name}`}
              className="inline-flex h-11 items-center rounded-md border border-line-strong bg-overlay px-3 text-small font-semibold text-strong shadow-raised transition-colors hover:bg-surface sm:h-9"
            >
              {connectLabel}
            </button>
          )}
          {menu}
        </div>
      </header>

      <p className="line-clamp-2 text-small leading-relaxed text-body">{description}</p>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-small text-muted">
        {connected ? (
          <>
            <span className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-muted" />
              <span className="truncate">{lastSync}</span>
            </span>
            <Switch
              placement="start"
              label={<span className="sr-only">{name}: eşitleme</span>}
              {...(onToggle ? { checked: syncing } : { defaultChecked: syncing })}
              onChange={(event) => onToggle?.(event.currentTarget.checked)}
              className="min-h-11 shrink-0 py-0"
            />
          </>
        ) : (
          <>
            <span className="truncate">{setup}</span>
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </>
        )}
      </footer>
    </article>
  );
}

/** Üç sütun, tablette iki, telefonda bir. */
export function IntegrationGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
