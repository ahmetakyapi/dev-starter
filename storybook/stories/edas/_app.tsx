"use client";

import "./edas.css";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Database,
  Gauge,
  Info,
  LayoutDashboard,
  LogOut,
  Radio,
  Receipt,
  Settings,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { CommandPalette, type Command } from "@/components/ui/command-palette";
import { IconButton } from "@/components/ui/icon-button";
import { RouteProgress, startRouteProgress, stopRouteProgress } from "@/components/ui/route-progress";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/toast";
import type { NotificationItem } from "@/components/ui/notification-center";
import {
  CUSTOMERS,
  FLAGGED_READINGS,
  CURRENT_PERIOD,
  ME,
  METERS,
  NOTICES,
  OPEN_OUTAGES,
  OVERDUE_INVOICES,
  PERIODS,
  customer,
  type Period,
} from "./_data";
import { AppContext, PAGES, href, pageInfo, type Page, type Params, type Toast } from "./_ui";
import { PanoPage } from "./_pano";
import { MusterilerPage } from "./_musteriler";
import { KayitPage } from "./_kayit";
import { SayaclarPage } from "./_sayaclar";
import { OkumalarPage } from "./_okumalar";
import { HamVeriPage } from "./_hamveri";
import { FaturalarPage } from "./_faturalar";
import { OdemelerPage } from "./_odemeler";
import { TedarikcilerPage } from "./_tedarikciler";
import { ArizaPage } from "./_ariza";
import { RaporlarPage } from "./_raporlar";
import { AyarlarPage } from "./_ayarlar";

/** Sayfa geçişinde iskeletin kalma süresi: gezinme göstergesi görünsün, hap çıkmasın (420 ms). */
const LOAD_MS = 360;

const ICONS: Record<Page, ReactNode> = {
  dashboard: <LayoutDashboard />,
  customers: <Users />,
  register: <UserPlus />,
  meters: <Gauge />,
  readings: <BookOpenCheck />,
  rawdata: <Database />,
  invoices: <Receipt />,
  payments: <Wallet />,
  suppliers: <Building2 />,
  outages: <Zap />,
  reports: <BarChart3 />,
  settings: <Settings />,
};

const GROUPS: readonly { label: string; pages: readonly Page[] }[] = [
  { label: "Genel", pages: ["dashboard"] },
  { label: "Müşteriler", pages: ["customers", "register"] },
  { label: "Ölçüm", pages: ["meters", "readings", "rawdata"] },
  { label: "Finans", pages: ["invoices", "payments"] },
  { label: "Piyasa", pages: ["suppliers"] },
  { label: "Operasyon", pages: ["outages", "reports"] },
  { label: "Sistem", pages: ["settings"] },
];

const BADGES: Partial<Record<Page, number>> = {
  readings: FLAGGED_READINGS.filter((r) => r.period === CURRENT_PERIOD).length,
  invoices: OVERDUE_INVOICES.length,
  outages: OPEN_OUTAGES.length,
};

const navGroups = (): readonly ShellNavGroup[] =>
  GROUPS.map((g) => ({
    label: g.label,
    items: g.pages.map((id) => ({ href: href(id), label: pageInfo(id).label, icon: ICONS[id], badge: BADGES[id] })),
  }));

const BRAND = {
  name: "Kuzeyova",
  href: href("dashboard"),
  logo: (
    <span className="edas-mark inline-grid size-7 place-items-center rounded-lg">
      <Zap className="!size-4" strokeWidth={2.25} />
    </span>
  ),
};

function PageView({ page, params, go }: { page: Page; params: Params; go: (page: Page, params?: Record<string, string | undefined>) => void }) {
  const props = { params, go };
  switch (page) {
    case "dashboard":
      return <PanoPage {...props} />;
    case "customers":
      return <MusterilerPage {...props} />;
    case "register":
      return <KayitPage {...props} />;
    case "meters":
      return <SayaclarPage {...props} />;
    case "readings":
      return <OkumalarPage {...props} />;
    case "rawdata":
      return <HamVeriPage {...props} />;
    case "invoices":
      return <FaturalarPage {...props} />;
    case "payments":
      return <OdemelerPage {...props} />;
    case "suppliers":
      return <TedarikcilerPage {...props} />;
    case "outages":
      return <ArizaPage {...props} />;
    case "reports":
      return <RaporlarPage {...props} />;
    case "settings":
      return <AyarlarPage {...props} />;
  }
}

/** Geçiş sırasında hedef sayfanın iskeleti; kap `aria-busy`. */
function PageLoading({ page }: { page: Page }) {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-6 p-4 sm:p-6">
      <p className="sr-only">{pageInfo(page).label} yükleniyor</p>
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={2} action={false} />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export type EdasAppProps = {
  /** Açılıştaki sayfa. */
  initialPage?: Page;
  /** Açılıştaki derin bağlantı: `{ id: "C-10001" }`, `{ status: "gecikti" }`. */
  initialParams?: Params;
  initialPeriod?: Period;
};

const NOTICE_ICONS = { zap: Zap, gauge: Gauge, radio: Radio } as const;

export function EdasApp({ initialPage = "dashboard", initialParams = {}, initialPeriod = "3" }: EdasAppProps) {
  const [route, setRoute] = useState<{ page: Page; params: Params }>({ page: initialPage, params: initialParams });
  const [pending, setPending] = useState<Page | null>(null);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [notices, setNotices] = useState<NotificationItem[]>(() =>
    NOTICES.map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.at, read: false, icon: NOTICE_ICONS[n.icon] })),
  );
  const [signedIn, setSignedIn] = useState(true);
  const routeRef = useRef(route);
  routeRef.current = route;
  const timer = useRef<number | null>(null);
  const noticeId = useRef(0);

  const navigate = useCallback((page: Page, params: Record<string, string | undefined> = {}) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") clean[k] = v;
    if (timer.current) window.clearTimeout(timer.current);
    // Aynı sayfada parametre değişimi (sıralama, süzgeç, ayrıntı) anında.
    if (page === routeRef.current.page) {
      setPending(null);
      setRoute({ page, params: clean });
      stopRouteProgress();
      return;
    }
    startRouteProgress();
    setPending(page);
    timer.current = window.setTimeout(() => {
      setRoute({ page, params: clean });
      setPending(null);
      stopRouteProgress();
      window.scrollTo({ top: 0 });
      document.getElementById("icerik")?.scrollTo({ top: 0 });
    }, LOAD_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      stopRouteProgress();
    },
    [],
  );

  // Uygulamanın bağlantıları `?view=…`: tıklama yakalanır, sayfa iç durumla değişir.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href^='?']") : null;
      if (!anchor) return;
      const query = new URLSearchParams(anchor.getAttribute("href")!.slice(1));
      const page = query.get("view") as Page | null;
      if (!page || !PAGES.some((p) => p.id === page)) return;
      event.preventDefault();
      query.delete("view");
      navigate(page, Object.fromEntries(query));
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [navigate]);

  const notify = useCallback((notice: Toast) => {
    const id = ++noticeId.current;
    const options = { description: notice.body };
    if (notice.undo) toast.undo(notice.title, notice.undo, options);
    else if (notice.tone === "success") toast.success(notice.title, options);
    else toast.info(notice.title, options);
    setNotices((list) => [
      { id: `t${id}`, title: notice.title, body: notice.body, at: new Date(2026, 10, 21, 10, 40 + id), read: false, icon: notice.tone === "success" ? CheckCircle2 : Info },
      ...list,
    ]);
  }, []);

  const markRead = useCallback((ids: string[]) => setNotices((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))), []);
  const nav = useMemo(navGroups, []);

  const ctx = useMemo(
    () => ({ page: route.page, params: route.params, navigate, period, setPeriod, notifications: notices, markRead, notify }),
    [route, navigate, period, notices, markRead, notify],
  );

  const commands: Command[] = useMemo(
    () => [
      ...PAGES.map((p) => ({ id: `git-${p.id}`, label: p.label, group: "Gezinme", icon: ICONS[p.id], onSelect: () => navigate(p.id) })),
      { id: "yeni-musteri", label: "Yeni Müşteri Kaydet", hint: "Müşteri Kaydı", group: "Eylemler", icon: <UserPlus />, keywords: ["abone", "kayıt", "yeni"], onSelect: () => navigate("register") },
      { id: "geciken", label: "Geciken Faturaları Göster", hint: `${OVERDUE_INVOICES.length} fatura`, group: "Eylemler", icon: <Receipt />, keywords: ["borç", "vadesi geçen"], onSelect: () => navigate("invoices", { status: "gecikti" }) },
      { id: "supheli", label: "Şüpheli Okumaları İncele", hint: `${FLAGGED_READINGS.filter((r) => r.period === CURRENT_PERIOD).length} okuma`, group: "Eylemler", icon: <BookOpenCheck />, keywords: ["anomali", "endeks"], onSelect: () => navigate("readings", { status: "supheli" }) },
      { id: "acik-ariza", label: "Açık Arızaları Göster", hint: `${OPEN_OUTAGES.length} kayıt`, group: "Eylemler", icon: <Zap />, keywords: ["kesinti", "elektrik"], onSelect: () => navigate("outages", { status: "acik" }) },
      ...PERIODS.map((p) => ({ id: `donem-${p.value}`, label: `Dönem: ${p.label}`, group: "Pano", icon: <BarChart3 />, keywords: ["ay", "dönem"], onSelect: () => { setPeriod(p.value); navigate("dashboard"); } })),
      ...CUSTOMERS.map((c) => ({
        id: c.id,
        label: `${c.id} · ${c.name}`,
        hint: `Tesisat ${c.installation} · ${c.district}`,
        group: "Müşteriler",
        keywords: [c.installation, c.district],
        onSelect: () => navigate("customers", { id: c.id }),
      })),
      ...METERS.map((m) => ({
        id: m.id,
        label: `${m.serial}`,
        hint: `${customer(m.customerId).name} · ${m.id}`,
        group: "Sayaçlar",
        keywords: [m.id, customer(m.customerId).installation],
        onSelect: () => navigate("meters", { id: m.id }),
      })),
    ],
    [navigate],
  );

  if (!signedIn) {
    return (
      <div data-product="edas" className="grid min-h-dvh place-items-center bg-page p-6">
        <div className="max-w-sm text-center">
          <span className="edas-mark mx-auto inline-grid size-10 place-items-center rounded-xl">
            <Zap className="size-5" />
          </span>
          <h1 className="mt-4 text-heading font-semibold text-strong">Oturum kapandı</h1>
          <p className="mt-1 text-base text-muted">Örnek portal: oturum açma ekranı yok. Devam etmek için aşağıdan geri dön.</p>
          <button type="button" onClick={() => setSignedIn(true)} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-base font-semibold text-on-primary">
            Portala dön
          </button>
        </div>
      </div>
    );
  }

  const loadingPage = pending;
  return (
    <AppContext.Provider value={ctx}>
      <div data-product="edas" className="contents">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <AppShell
          brand={BRAND}
          groups={nav}
          current={href(loadingPage ?? route.page)}
          user={{ name: ME.name, detail: ME.role }}
          userAction={<IconButton icon={LogOut} aria-label="Oturumu Kapat" size="sm" onClick={() => setSignedIn(false)} />}
          searchLabel="Müşteri ya da sayaç ara"
          className="edas-shell [&>aside]:sticky [&>aside]:top-0 [&>aside]:h-dvh [&>aside]:self-start"
        >
          {loadingPage ? (
            <PageLoading page={loadingPage} />
          ) : (
            <PageView key={`${route.page}:${route.params.id ?? ""}`} page={route.page} params={route.params} go={navigate} />
          )}
        </AppShell>
        <CommandPalette commands={commands} maxResults={60} placeholder="Müşteri, sayaç, sayfa ya da komut ara" />
        <Toaster />
      </div>
    </AppContext.Provider>
  );
}
