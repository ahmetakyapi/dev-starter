// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { CircleCheck, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import { useId, type ElementType, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Öneri kutusu: içeriğin İÇİNDE, ilgili kayda bağlı kısa bir değerlendirme ve
 * onu izleyen eylem ("Kazan dairesi 21 gün içinde arızalanabilir: Bakımı
 * 30 Ekim'den önce planla", "Bu fatura neden reddedildi", "Yedi açık boşluğun
 * ortak nedeni var"). Fixora, Clearbill, Noticeline ve Spendix ekranlarında
 * aynı kalıp: başlık, 2-3 cümle, bir ya da iki eylem.
 *
 * FARKI: `banner-alert` bir BÖLÜMÜN durumunu söyler (ödeme bilgisi eksik,
 * eşitleme başarısız) ve sayfanın üstünde durur. Bu kutu bir KAYDIN yanında
 * durur, başlığı gerçek bir başlıktır (`headingLevel`) ve içinde gövde
 * metni ile eylemler vardır. Geçici sonuç `toast`, durduran soru `dialog`.
 *
 * ÜÇ TÜR, ÜÇ ZEMİN: `insight` (varsayılan, primary-wash), `warning`
 * (warning-wash), `success` (success-wash). Zemin tonu ince bir çerçeveyle
 * gelir; kartın tek kenarına renkli şerit YOK (rules/design-tokens → AI-Slop).
 * Başlık ve gövde `text-strong` / `text-body` kalır (renkli gövde metni
 * wash üstünde AA tutmaz); yalnız ikon ve küçük tür etiketi tonu taşır.
 *
 * TÜR ETİKETİ ("Öneri", "Dikkat", "Sonuç") metindir: renk tek işaret değil.
 * Etiketi çağıran değiştirir (`label`); bileşen "yapay zeka" iddiası taşımaz.
 * Önerinin kaynağı bir model ise etiketi çağıran dürüstçe yazar ("Model
 * önerisi"), kural motoruysa "Kural".
 *
 * İKON süstür (`aria-hidden`), `icon` ile değişir. Başlık `h3` varsayılan;
 * sayfanın başlık sırasına uysun diye `headingLevel` (2-6). Kutu `aside` ve
 * başlığıyla adlanır. Eylemler `actions` yuvasında (ikincil buton/bağlantı,
 * en çok iki).
 *
 * Sunucu bileşeni. Kuyu (`bg-surface`) ya da beyaz kart içinde durur;
 * kendisi kart değildir, içine kart konmaz.
 *
 *   <InsightCallout title="Kazan Dairesi Arızası Yaklaşıyor" label="Öneri"
 *     actions={<Button variant="secondary" size="sm">Servis Planla</Button>}>
 *     Kazanın 21 gün içinde arızalanması olası. 30 Ekim'den önce bakım yaptırmak
 *     tahmini ₺6.400'lik acil onarımı önler.
 *   </InsightCallout>
 */

const KINDS = {
  insight: { icon: Sparkles, wash: "bg-primary-wash border-primary/15", ink: "text-primary-ink", label: "Öneri" },
  warning: { icon: TriangleAlert, wash: "bg-warning-wash border-warning/20", ink: "text-warning", label: "Dikkat" },
  success: { icon: CircleCheck, wash: "bg-success-wash border-success/15", ink: "text-success", label: "Sonuç" },
} as const satisfies Record<string, { icon: LucideIcon; wash: string; ink: string; label: string }>;

export type InsightKind = keyof typeof KINDS;

type InsightCalloutProps = {
  title: ReactNode;
  children: ReactNode;
  kind?: InsightKind;
  /** Küçük tür etiketi; verilmezse türün varsayılanı ("Öneri", "Dikkat", "Sonuç"). */
  label?: string;
  icon?: LucideIcon;
  /** Sağda değil gövdenin altında: en çok iki ikincil buton ya da bağlantı. */
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

export function InsightCallout({ title, children, kind = "insight", label, icon, actions, headingLevel = 3, className }: InsightCalloutProps) {
  const tone = KINDS[kind];
  const Icon = icon ?? tone.icon;
  const Heading = `h${headingLevel}` as ElementType;
  const id = useId();
  return (
    <aside aria-labelledby={id} className={cn("grid gap-2 rounded-xl border p-4 text-base text-body", tone.wash, className)}>
      <div className="flex items-center gap-2">
        <Icon aria-hidden className={cn("size-4 shrink-0", tone.ink)} strokeWidth={1.75} />
        <span className={cn("text-small font-medium", tone.ink)}>{label ?? tone.label}</span>
      </div>
      <Heading id={id} className="text-base font-semibold text-strong">
        {title}
      </Heading>
      <div className="text-base leading-relaxed text-body">{children}</div>
      {actions ? <div className="mt-1 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </aside>
  );
}
