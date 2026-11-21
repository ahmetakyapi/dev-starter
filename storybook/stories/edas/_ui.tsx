"use client";

import { Children, createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { cn } from "@/lib/utils";
import {
  type CustomerStatus,
  type InvoiceStatus,
  type MeterStatus,
  type OutageStatus,
  type Period,
  type ReadingStatus,
  type Reconciliation,
  CUSTOMER_STATUS_LABEL,
  INVOICE_STATUS_LABEL,
  METER_STATUS_LABEL,
  READING_STATUS_LABEL,
  RECON_LABEL,
} from "./_data";

/**
 * Edaş Portalı'nın sayfaları arasında paylaşılan durum ve küçük kalıplar.
 *
 * SAYFA SÖZLEŞMESİ: her sayfa `({ params, go }: PageProps)` alır.
 *   - `go(page, params?)` iç gezinme; `params` derin bağlantı:
 *     `go("customers", { id: "C-10001" })`, `go("invoices", { status: "gecikti" })`.
 *   - Sayfa kendi ayrıntı/süzgeç durumunu `params`tan OKUR, değiştirirken yine
 *     `go(aynıSayfa, yeniParams)` çağırır (aynı sayfada anında, geçiş iskeleti yok).
 *   - Gezinme bağlantıları gerçek `<a href="?view=…">`: `href(page, params)`.
 *     Uygulama tıklamayı yakalar ve sayfayı iç durumla değiştirir (Pusula ile aynı).
 *
 * Sayfa kimlikleri İngilizce, küçük harf, ASCII (adres olur).
 */

export type Page =
  | "dashboard"
  | "customers"
  | "register"
  | "meters"
  | "readings"
  | "rawdata"
  | "invoices"
  | "payments"
  | "suppliers"
  | "outages"
  | "reports"
  | "settings"
  | "applications"
  | "stock"
  | "field"
  | "producers"
  | "disputes"
  | "calls"
  | "leaks"
  | "workorders"
  | "grid"
  | "compliance";

export type Params = Readonly<Record<string, string>>;
export type PageProps = { params: Params; go: (page: Page, params?: Record<string, string | undefined>) => void };

export const PAGES: readonly { id: Page; label: string; section: string }[] = [
  { id: "dashboard", label: "Pano", section: "Genel" },
  { id: "customers", label: "Müşteriler", section: "Müşteriler" },
  { id: "register", label: "Müşteri Kaydı", section: "Müşteriler" },
  { id: "meters", label: "Sayaçlar", section: "Ölçüm" },
  { id: "readings", label: "Okumalar", section: "Ölçüm" },
  { id: "rawdata", label: "Ham Veri", section: "Ölçüm" },
  { id: "invoices", label: "Faturalar", section: "Finans" },
  { id: "payments", label: "Ödemeler", section: "Finans" },
  { id: "suppliers", label: "Tedarikçiler", section: "Piyasa" },
  { id: "outages", label: "Arıza ve Kesintiler", section: "Operasyon" },
  { id: "reports", label: "Raporlar", section: "Raporlar" },
  { id: "settings", label: "Ayarlar", section: "Sistem" },
  { id: "applications", label: "Başvurular", section: "Müşteriler" },
  { id: "stock", label: "Sayaç Stok", section: "Ölçüm" },
  { id: "field", label: "Saha Okuma", section: "Ölçüm" },
  { id: "producers", label: "Üreticiler", section: "Ölçüm" },
  { id: "disputes", label: "İtirazlar ve Mahsup", section: "Finans" },
  { id: "calls", label: "Çağrı Merkezi", section: "Operasyon" },
  { id: "leaks", label: "Kaçak Vakaları", section: "Operasyon" },
  { id: "workorders", label: "İş Emirleri", section: "Operasyon" },
  { id: "grid", label: "Şebeke ve Trafo", section: "Operasyon" },
  { id: "compliance", label: "Uyum Merkezi", section: "Sistem" },
];
export const pageInfo = (page: Page) => PAGES.find((p) => p.id === page)!;

export const href = (page: Page, params: Record<string, string | undefined> = {}) => {
  const q = new URLSearchParams({ view: page });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, v);
  return `?${q.toString()}`;
};

export type Toast = { title: string; body?: string; tone: "success" | "info"; undo?: () => void };

export type AppState = {
  page: Page;
  params: Params;
  navigate: PageProps["go"];
  period: Period;
  setPeriod: (period: Period) => void;
  notifications: readonly NotificationItem[];
  markRead: (ids: string[]) => void;
  /** Kısa bildirim (sağ altta) + zil kaydı. */
  notify: (toast: Toast) => void;
};

export const AppContext = createContext<AppState | null>(null);
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Edaş sayfaları <EdasApp> içinde çizilir.");
  return ctx;
}

/**
 * Sayfa başlığı, iki katlı (Pusula/Ingot): üst çubukta ekmek kırıntısı + veri
 * tarihi + zil, altında büyük ad, bir satır bağlam, sağda sayfanın eylemleri.
 * `crumb`: ayrıntı sayfasında son halka ("C-10001 · Ayşe Yılmaz").
 */
export function PageHead({ title, description, actions, crumb }: { title: string; description?: ReactNode; actions?: ReactNode; crumb?: string }) {
  const { page, notifications, markRead } = useApp();
  const info = pageInfo(page);
  const items = [
    { label: "Kuzeyova", href: href("dashboard"), icon: <Zap /> },
    { label: info.section },
    crumb ? { label: title, href: href(page) } : { label: title },
    ...(crumb ? [{ label: crumb }] : []),
  ];
  return (
    <header className="border-b border-line-soft">
      {/* Telefonda tek başlık: üst çubuk (menü, marka, zil, arama) kabuğun kendisinde; bu satır yalnız masaüstünde. */}
      <div className="flex min-h-13 items-center gap-3 border-b border-line-soft px-4 max-lg:hidden sm:px-6">
        <Breadcrumb items={items} className="min-w-0 flex-1" />
        <DemoBadge />
        <span className="hidden items-center gap-1.5 text-small text-muted md:inline-flex">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          Güncellendi · 21 Kas, 10:40
        </span>
        <NotificationCenter items={notifications} onMarkRead={markRead} />
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 px-4 pt-6 pb-5 sm:px-6">
        <div className="min-w-[min(100%,18rem)] flex-1">
          <h1 className="text-heading font-semibold tracking-tight text-strong">{title}</h1>
          {description ? <p className="mt-1 text-base text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Kart: beyaz zemin, kıl halkası, en hafif gölge (Pusula `CARD` ile aynı). */
export const CARD = "rounded-xl bg-overlay p-1.5 shadow-raised ring-1 ring-line [&>.mt-auto>dl>div]:bg-surface [&>.mt-auto>dl>div]:shadow-none";

/** Kart gövdesi: iç dolgu + başlık satırı. Liste/tablo kartları için. */
export function Panel({ title, note, actions, children, className, id }: { title: ReactNode; note?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col rounded-xl bg-overlay shadow-raised ring-1 ring-line", className)}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-soft px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-read font-semibold text-strong">
            {title}
          </h2>
          {note ? <p className="mt-0.5 text-small text-muted">{note}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

/** Yumuşak renk karosu: ölçü ve liste ikonlarının zemini. */
export function IconTile({ children, tone = "primary", className }: { children: ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "neutral"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset [&_svg]:size-4",
        tone === "primary" && "bg-primary-wash text-primary-ink ring-primary/15",
        tone === "success" && "bg-success-wash text-success ring-success/15",
        tone === "warning" && "bg-warning-wash text-warning ring-warning/15",
        tone === "danger" && "bg-danger-wash text-danger ring-danger/15",
        tone === "neutral" && "bg-surface text-body ring-line",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Ölçü şeridi: TEK kartta kıl çizgiyle bölünmüş hücreler (Ingot). Sütun sayısı
 * çocuk sayısından türer (en çok 6; dar ekranda 2): üç hücre altı sütunluk bir
 * şeridin yarısına yığılmaz. Çizgiler hücrelerin iç sağ/alt kenarıdır, iç kap
 * 1 piksel taşırılıp kırpılır: eksik satır ya da son sütunda artık çizgi kalmaz.
 * Hücreler `Metric` (`_kit.tsx`) ya da kendi dolgulu öğeleridir.
 */
export function MetricStrip({ children, className }: { children: ReactNode; className?: string }) {
  const n = Math.max(1, Children.count(children));
  const style = { "--c-lg": n <= 3 ? n : n === 4 ? 2 : 3, "--c-xl": Math.min(n, 6) } as CSSProperties;
  return (
    <div className={cn("overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line", className)}>
      <div className="edas-strip" style={style}>
        {children}
      </div>
    </div>
  );
}

/** Sayfa gövdesi: kenar boşluğu ve dikey ritim. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-5 p-4 sm:p-6", className)}>{children}</div>;
}

/**
 * Eski "ÖRNEK VERİ" alt bilgisi: artık HİÇBİR ŞEY çizmez. Demo olduğu bir kez,
 * gezinti çubuğundaki `DemoBadge`de söylenir; her sayfanın altında tekrarlamak
 * demo kokusunu artırıyordu (UX denetimi). Sayfalar derlenmeye devam etsin diye
 * bileşen duruyor.
 */
export function SampleNote(_props: { className?: string }) {
  return null;
}

/** Demo olduğunu bir kez, gezinti çubuğunda söyler. */
export function DemoBadge() {
  return (
    <Badge tone="neutral" title="Bütün şirket, abone ve tutarlar kurgusaldır; KVKK gereği kimlik alanları maskelidir.">
      Demo · kurgusal veri
    </Badge>
  );
}

/* --- Durum rozetleri: renk + metin (renk tek işaret değil) -------------------- */

export function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const tone = { odendi: "success", kesildi: "neutral", kismi: "warning", gecikti: "danger", itirazli: "primary" } as const;
  return (
    <Badge tone={tone[status]} dot>
      {INVOICE_STATUS_LABEL[status]}
    </Badge>
  );
}
export function MeterBadge({ status }: { status: MeterStatus }) {
  const tone = { okunuyor: "success", "iletisim-yok": "warning", arizali: "danger", mudahale: "danger" } as const;
  return (
    <Badge tone={tone[status]} dot>
      {METER_STATUS_LABEL[status]}
    </Badge>
  );
}
export function CustomerBadge({ status }: { status: CustomerStatus }) {
  const tone = { aktif: "success", kesik: "danger", askida: "warning", kapali: "neutral" } as const;
  return (
    <Badge tone={tone[status]} dot>
      {CUSTOMER_STATUS_LABEL[status]}
    </Badge>
  );
}
export function ReadingBadge({ status }: { status: ReadingStatus }) {
  const tone = { dogrulandi: "success", supheli: "danger", bekliyor: "neutral", duzeltildi: "primary" } as const;
  return (
    <Badge tone={tone[status]} dot>
      {READING_STATUS_LABEL[status]}
    </Badge>
  );
}
export function ReconBadge({ status }: { status: Reconciliation }) {
  const tone = { mutabik: "success", bekliyor: "neutral", farkli: "warning" } as const;
  return (
    <Badge tone={tone[status]} dot>
      {RECON_LABEL[status]}
    </Badge>
  );
}
export function OutageBadge({ status, kind }: { status: OutageStatus; kind: "plansiz" | "planli" }) {
  if (status === "acik") return <Badge tone="danger" dot>Açık Arıza</Badge>;
  if (status === "planlandi") return <Badge tone="primary" dot>Planlı Çalışma</Badge>;
  return <Badge tone={kind === "planli" ? "neutral" : "success"} dot>Giderildi</Badge>;
}
