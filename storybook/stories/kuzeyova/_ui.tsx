"use client";

import { Children, createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Search, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { openCommandPalette } from "@/components/ui/command-palette";
import { Kbd } from "@/components/ui/kbd";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { StatusIcon, type Status } from "@/components/ui/status-icon";
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
import { detailCrumb } from "./_crumb";

/**
 * Portal'ının sayfaları arasında paylaşılan durum ve küçük kalıplar.
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
  { id: "customers", label: "Aboneler", section: "Abonelik" },
  { id: "register", label: "Abone Kaydı", section: "Abonelik" },
  { id: "meters", label: "Sayaçlar", section: "Ölçüm" },
  { id: "readings", label: "Okumalar", section: "Ölçüm" },
  { id: "rawdata", label: "Ham Veri", section: "Ölçüm" },
  { id: "invoices", label: "Faturalar", section: "Finans" },
  { id: "payments", label: "Ödemeler", section: "Finans" },
  { id: "suppliers", label: "Tedarikçiler", section: "Piyasa" },
  { id: "outages", label: "Arıza ve Kesintiler", section: "Operasyon" },
  { id: "reports", label: "Raporlar", section: "Analiz" },
  { id: "settings", label: "Ayarlar", section: "Sistem" },
  { id: "applications", label: "Başvurular", section: "Abonelik" },
  { id: "stock", label: "Envanter", section: "Ölçüm" },
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
  if (!ctx) throw new Error("Portal sayfaları <KuzeyovaApp> içinde çizilir.");
  return ctx;
}

/**
 * Genel arama: üst çubukta input görünümlü buton. Tıklanınca ya da `/` ve ⌘K ile
 * komut paleti açılır (abone, sayaç, fatura, arıza, iş emri, çağrı, başvuru, vaka).
 * Bilerek `role="search"` taşımaz: `/` kısayolu sayfadaki bir arama alanı varsa onu
 * kullanır, yoksa paleti açar; bu buton o denetimi kandırmasın.
 */
export function GlobalSearchField({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={cn(
        "flex h-9 min-w-0 items-center gap-2 rounded-md border border-line bg-surface px-3 text-base text-muted transition-colors hover:border-line-strong hover:text-strong focus-visible:border-primary [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      <Search aria-hidden strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-start">Abone, Sayaç, Fatura Ara</span>
      <span aria-hidden className="hidden items-center gap-1 xl:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

/**
 * Sayfa başlığı, iki katlı (Pusula/Ingot): üst çubukta ekmek kırıntısı (sol), genel
 * arama (orta) ve durum + zil (sağ); altında büyük ad, bir satır bağlam, sağda sayfanın
 * eylemleri. Kırıntının son halkası (ayrıntı) `crumb` verilmezse yönlendirmedeki
 * `id`'den depodan çözülür: "Aboneler › Arslan Mobilya". Telefonda üst çubuk
 * kabuktadır; ayrıntı sayfasında yalnız "‹ Aboneler" geri bağlantısı görünür.
 */
export function PageHead({ title, description, actions, crumb, greeting }: { title: string; description?: ReactNode; actions?: ReactNode; crumb?: string; greeting?: ReactNode }) {
  const { page, params, notifications, markRead } = useApp();
  const info = pageInfo(page);
  const detail = crumb ?? detailCrumb(page, params);
  const listLabel = info.label;
  const items = [
    { label: "Kuzeyova", href: href("dashboard"), icon: <Zap /> },
    { label: info.section },
    detail ? { label: listLabel, href: href(page) } : { label: title },
    ...(detail ? [{ label: detail }] : []),
  ];
  return (
    <header className="border-b border-line-soft bg-page">
      {/* Telefonda tek başlık: üst çubuk (menü, marka, zil, arama) kabuğun kendisinde; bu satır yalnız masaüstünde. */}
      <div className="grid min-h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b border-line-soft px-4 max-lg:hidden sm:px-6">
        <Breadcrumb items={items} className="min-w-0 overflow-hidden whitespace-nowrap [&_ol]:flex-nowrap" />
        <GlobalSearchField className="w-72 xl:w-[26rem]" />
        <div className="flex min-w-0 items-center justify-end gap-3">
          <DemoBadge />
          <span className="hidden items-center gap-1.5 whitespace-nowrap text-small text-muted 2xl:inline-flex">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Güncellendi · 21 Kas, 10:40
          </span>
          <NotificationCenter items={notifications} onMarkRead={markRead} />
        </div>
      </div>
      {detail ? <Breadcrumb items={items} className="px-4 pt-2 sm:px-6 lg:hidden" /> : null}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 px-4 pt-6 pb-5 sm:px-6">
        <div className="min-w-[min(100%,18rem)] flex-1">
          {/* Karşılama (yalnız Pano): kişiye ve güne seslenen tek satır, başlığın üstünde sakin. */}
          {greeting ? <p className="mb-1 text-base text-muted">{greeting}</p> : null}
          <h1 className="text-heading font-medium tracking-[-0.025em] text-strong">{title}</h1>
          {description ? <p className="mt-1 text-base text-soft">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Kart (Sakin Akış, 27 Kasım 2026): gri kuyu zemininde beyaz karo, gölge yerine kıl halka, 16 px köşe. */
export const CARD = "rounded-2xl bg-overlay p-1.5 ring-1 ring-line-soft [&>.mt-auto>dl>div]:bg-surface [&>.mt-auto>dl>div]:shadow-none";

/** Kart gövdesi: iç dolgu + başlık satırı. Liste/tablo kartları için. */
export function Panel({ title, note, actions, children, className, id }: { title: ReactNode; note?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col rounded-2xl bg-overlay ring-1 ring-line-soft", className)}>
      {/* Sakin Akış: başlık ile gövde arasında çizgi yok; ayrım boşluk ve tonla. */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 pb-2 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-read font-medium tracking-[-0.01em] text-strong">
            {title}
          </h2>
          {note ? <p className="mt-0.5 text-small text-soft">{note}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

/** Yumuşak renk karosu: ölçü ve liste ikonlarının zemini. */
export function IconTile({ children, tone = "primary", className }: { children: ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "neutral"; className?: string }) {
  // Sakin Akış: karo nötr (gri kuyu + kıl halka), renk yalnız ikonda; renkli büyük alan yok.
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-lg bg-surface ring-1 ring-line-soft ring-inset [&_svg]:size-4",
        tone === "primary" && "text-primary-ink",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "danger" && "text-danger",
        tone === "neutral" && "text-body",
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
    <div className={cn("overflow-hidden rounded-2xl bg-overlay ring-1 ring-line-soft", className)}>
      <div className="kz-strip" style={style}>
        {children}
      </div>
    </div>
  );
}

/** Sayfa gövdesi: kenar boşluğu ve dikey ritim. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  // kz-enter: sayfa açılınca içerik 480 ms'de buğudan gelir (Sakin Akış sekme girişi).
  return <div className={cn("kz-enter grid grid-cols-1 gap-5 p-4 sm:p-6", className)}>{children}</div>;
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
      Demo · Kurgusal Veri
    </Badge>
  );
}

/* --- Durum: ikon şekli + metin (Sakin Akış, 27 Kasım 2026) ----------------------
   Pastel hap yerine `status-icon` şekli: şekil durumu söyler (renk körlüğüne dayanıklı),
   renk ikinci işaret ve YALNIZ ikonda; metin nötr (sorun durumunda koyu ve orta ağırlık).
   Satırda tek bakışta "ne durumda" okunur; aynı durumdaki uzun liste kırmızıya boğulmaz. */
type Tone = "success" | "neutral" | "warning" | "danger" | "primary";
const SHAPE: Record<Tone, Status> = { success: "done", neutral: "triage", warning: "progress", danger: "blocked", primary: "todo" };
export function StatusText({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-small whitespace-nowrap", tone === "danger" ? "font-medium text-strong" : "text-body", className)}>
      <StatusIcon status={SHAPE[tone]} size={14} />
      {children}
    </span>
  );
}

export function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const tone = { odendi: "success", kesildi: "neutral", kismi: "warning", gecikti: "danger", itirazli: "primary" } as const;
  return <StatusText tone={tone[status]}>{INVOICE_STATUS_LABEL[status]}</StatusText>;
}
export function MeterBadge({ status }: { status: MeterStatus }) {
  const tone = { okunuyor: "success", "iletisim-yok": "warning", arizali: "danger", mudahale: "danger" } as const;
  return <StatusText tone={tone[status]}>{METER_STATUS_LABEL[status]}</StatusText>;
}
export function CustomerBadge({ status }: { status: CustomerStatus }) {
  const tone = { aktif: "success", kesik: "danger", askida: "warning", kapali: "neutral" } as const;
  return <StatusText tone={tone[status]}>{CUSTOMER_STATUS_LABEL[status]}</StatusText>;
}
export function ReadingBadge({ status }: { status: ReadingStatus }) {
  const tone = { dogrulandi: "success", supheli: "danger", bekliyor: "neutral", duzeltildi: "primary" } as const;
  return <StatusText tone={tone[status]}>{READING_STATUS_LABEL[status]}</StatusText>;
}
export function ReconBadge({ status }: { status: Reconciliation }) {
  const tone = { mutabik: "success", bekliyor: "neutral", farkli: "warning" } as const;
  return <StatusText tone={tone[status]}>{RECON_LABEL[status]}</StatusText>;
}
export function OutageBadge({ status, kind }: { status: OutageStatus; kind: "plansiz" | "planli" }) {
  if (status === "acik") return <StatusText tone="danger">Açık Arıza</StatusText>;
  if (status === "planlandi") return <StatusText tone="primary">Planlı Çalışma</StatusText>;
  return <StatusText tone={kind === "planli" ? "neutral" : "success"}>Giderildi</StatusText>;
}
