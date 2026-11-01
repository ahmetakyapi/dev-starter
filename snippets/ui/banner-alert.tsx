import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CloseButton } from "@/components/ui/close-button";
import { cn } from "@/lib/utils";

/**
 * Sayfa içi uyarı satırı: bir BÖLÜMÜN durumu (ödeme bilgisi eksik, deneme
 * süresi bitiyor, senkron başarısız). Geçici sonuç bildirimi değil (o
 * `toast`), kullanıcıyı durduran soru değil (o `dialog`).
 *
 * TON ZEMİNLE KURULUR, ŞERİTLE DEĞİL. Kartın tek kenarına renkli şerit
 * (`border-l-4`) yapay zekâ çıktısının en tanınır izi (rules/design-tokens
 * → AI-Slop). Burada tonu `*-wash` zemin, dört yanda aynı tonun çok
 * soluk kıl çizgisi ve ikon rengi taşır; başlık ve metin `text-strong` /
 * `text-body` kalır (renkli gövde metni wash üstünde AA tutmaz).
 *
 * İKON TONA GÖRE DEĞİŞİR: renk tek işaret değil. Bilgi `Info`, başarı
 * `CircleCheck`, uyarı `TriangleAlert`, hata `CircleAlert`.
 *
 * DUYURU: sayfayla birlikte gelen satır SESSİZ olmalı (ekran okuyucu
 * sayfayı okurken onu bulur). Sonradan beliren satır `announce` alır: hata
 * ve uyarı `role="alert"` (hemen okunur), diğerleri `role="status"`
 * (sırası gelince). Canlı bölge DOM'a içeriğiyle birlikte girerse bazı
 * okuyucular kaçırır; kritik durumda kabı önceden boş bas.
 *
 * Eylem en fazla iki: `actions` (ikincil karo düğme ya da bağlantı).
 * Kapatılabilir satır `onDismiss` alır; × düğmesi `close-button.tsx`.
 *
 * Sunucu bileşeni. Kuyu (`bg-surface`) içinde ya da sayfa zemininde durur;
 * kendisi kart değil, içine kart konmaz.
 */

const TONES = {
  info: { icon: Info, wash: "bg-primary-wash border-primary/15", ink: "text-primary-ink", label: "Bilgi" },
  success: { icon: CircleCheck, wash: "bg-success-wash border-success/15", ink: "text-success", label: "Başarılı" },
  warning: { icon: TriangleAlert, wash: "bg-warning-wash border-warning/20", ink: "text-warning", label: "Uyarı" },
  danger: { icon: CircleAlert, wash: "bg-danger-wash border-danger/15", ink: "text-danger", label: "Hata" },
} as const satisfies Record<string, { icon: LucideIcon; wash: string; ink: string; label: string }>;

type BannerAlertProps = {
  tone?: keyof typeof TONES;
  title: ReactNode;
  description?: ReactNode;
  /** Sağda (dar ekranda altta) eylemler. */
  actions?: ReactNode;
  /** Sonradan beliren satır ekran okuyucuya söylensin mi? */
  announce?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
  icon?: LucideIcon;
  className?: string;
};

export function BannerAlert({
  tone = "info",
  title,
  description,
  actions,
  announce = false,
  onDismiss,
  dismissLabel = "Uyarıyı Kapat",
  icon,
  className,
}: BannerAlertProps) {
  const t = TONES[tone];
  const Glyph = icon ?? t.icon;
  const role = announce ? (tone === "danger" || tone === "warning" ? "alert" : "status") : undefined;

  /* Izgara: telefonda ikon | metin | ×, eylemler metnin altında; geniş
     ekranda eylemler × düğmesinden önce aynı satırda. */
  return (
    <div
      role={role}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 rounded-lg border p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:p-4",
        t.wash,
        className,
      )}
    >
      <Glyph aria-hidden className={cn("col-start-1 row-start-1 mt-0.5 size-[1.125rem]", t.ink)} strokeWidth={2} />
      <div className="col-start-2 row-start-1">
        <p className="text-base font-semibold text-strong">
          <span className="sr-only">{t.label}: </span>
          {title}
        </p>
        {description ? <div className="mt-0.5 text-base text-body">{description}</div> : null}
      </div>
      {actions ? (
        <div className="col-span-2 col-start-2 row-start-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:self-center">
          {actions}
        </div>
      ) : null}
      {onDismiss ? (
        <CloseButton
          aria-label={dismissLabel}
          size="sm"
          tone="onWash"
          onClick={onDismiss}
          className="col-start-3 row-start-1 sm:col-start-4 sm:self-center"
        />
      ) : null}
    </div>
  );
}
