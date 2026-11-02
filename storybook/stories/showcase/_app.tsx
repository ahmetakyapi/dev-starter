"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Download,
  Inbox,
  Info,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { CloseButton } from "@/components/ui/close-button";
import { CommandPalette, type Command } from "@/components/ui/command-palette";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import type { NotificationItem } from "@/components/ui/notification-center";
import { RouteProgress, startRouteProgress, stopRouteProgress } from "@/components/ui/route-progress";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { ME, OPEN_TICKETS, PERIODS, customer, notifications, type Period } from "./_data";
import { AsistanPage } from "./_asistan";
import { AyarlarPage } from "./_ayarlar";
import { GelenPage } from "./_gelen";
import { GirisPage } from "./_giris";
import { PanoPage } from "./_pano";
import { RaporlarPage } from "./_raporlar";
import { TakvimPage } from "./_takvim";
import { AppContext, PAGES, href, type Page, type Params, type Toast } from "./_ui";
import { cn } from "@/lib/utils";

/** Sayfa geçişinde iskeletin kalma süresi: gezinme göstergesi görünsün, hap çıkmasın (420 ms). */
const LOAD_MS = 360;
const TOAST_MS = 5000;

const ICONS: Record<Page, ReactNode> = {
  pano: <LayoutDashboard />,
  gelen: <Inbox />,
  takvim: <CalendarDays />,
  asistan: <MessageSquare />,
  raporlar: <BarChart3 />,
  ayarlar: <Settings />,
};

const NAV: readonly ShellNavGroup[] = [
  {
    items: (["pano", "gelen", "takvim", "asistan"] as const).map((id) => ({
      href: href(id),
      label: PAGES.find((p) => p.id === id)!.label,
      icon: ICONS[id],
      badge: id === "gelen" ? OPEN_TICKETS.length : undefined,
    })),
  },
  {
    label: "Çalışma Alanı",
    items: (["raporlar", "ayarlar"] as const).map((id) => ({ href: href(id), label: PAGES.find((p) => p.id === id)!.label, icon: ICONS[id] })),
  },
];

const BRAND = {
  name: "Pusula",
  href: href("pano"),
  logo: (
    <span className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
      <Compass className="!size-4" strokeWidth={2} />
    </span>
  ),
};

function PageView({ page }: { page: Page }) {
  switch (page) {
    case "pano":
      return <PanoPage />;
    case "gelen":
      return <GelenPage />;
    case "takvim":
      return <TakvimPage />;
    case "asistan":
      return <AsistanPage />;
    case "raporlar":
      return <RaporlarPage />;
    case "ayarlar":
      return <AyarlarPage />;
  }
}

/** Geçiş sırasında hedef sayfanın iskeleti; kap `aria-busy`. */
function PageLoading({ page }: { page: Page }) {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-6 p-4 sm:p-6">
      <p className="sr-only">{PAGES.find((p) => p.id === page)?.label} yükleniyor</p>
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

function Toasts({ toasts, dismiss }: { toasts: readonly Toast[]; dismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-3 z-40 grid grid-cols-1 justify-items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-overlay p-3.5 pr-2 shadow-floating ring-1 ring-line">
          <Icon icon={t.tone === "success" ? CheckCircle2 : Info} size="md" className={cn("mt-0.5", t.tone === "success" ? "text-success" : "text-primary-ink")} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-strong">{t.title}</p>
            {t.body ? <p className="mt-0.5 text-small text-muted">{t.body}</p> : null}
          </div>
          <CloseButton aria-label="Bildirimi Kapat" size="sm" onClick={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

export type PusulaAppProps = {
  /** Açılıştaki sayfa. */
  initialPage?: Page;
  /** Açılıştaki adres parametreleri: `{ talep: "PSL-1186" }`, `{ sekme: "aktar" }`. */
  initialParams?: Params;
  initialPeriod?: Period;
  /** Oturum kapalı başlar: giriş kartı. */
  signedOut?: boolean;
};

export function PusulaApp({ initialPage = "pano", initialParams = {}, initialPeriod = "ay", signedOut = false }: PusulaAppProps) {
  const [route, setRoute] = useState<{ page: Page; params: Params }>({ page: initialPage, params: initialParams });
  const [pending, setPending] = useState<Page | null>(null);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [items, setItems] = useState<NotificationItem[]>(() => notifications());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [signedIn, setSignedIn] = useState(!signedOut);
  const routeRef = useRef(route);
  routeRef.current = route;
  const timer = useRef<number | null>(null);
  const toastId = useRef(0);

  const navigate = useCallback((page: Page, params: Record<string, string | undefined> = {}) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") clean[k] = v;
    if (timer.current) window.clearTimeout(timer.current);
    // Aynı sayfada parametre değişimi (sıralama, sayfa, ayrıntı) anında.
    if (page === routeRef.current.page) {
      setPending(null);
      setRoute({ page, params: clean });
      // Gezinme göstergesi bağlantı tıklamasında kendiliğinden başlar; aynı sayfada iş anında bitti.
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
    }, LOAD_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
    stopRouteProgress();
  }, []);

  // Uygulamanın bağlantıları `?ekran=…`: tıklama yakalanır, sayfa iç durumla değişir.
  // Yakalama evresinde ve belgede: kabuğun çekmecesi ve açılır menüler de kapsanır.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href^='?']") : null;
      if (!anchor) return;
      const query = new URLSearchParams(anchor.getAttribute("href")!.slice(1));
      const page = query.get("ekran") as Page | null;
      if (!page || !PAGES.some((p) => p.id === page)) return;
      event.preventDefault();
      query.delete("ekran");
      navigate(page, Object.fromEntries(query));
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [navigate]);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      setItems((list) => [
        { id: `t${id}`, title: toast.title, body: toast.body, at: new Date().toISOString(), read: false, icon: toast.tone === "success" ? CheckCircle2 : Info },
        ...list,
      ]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  const markRead = useCallback((ids: string[]) => setItems((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))), []);

  const ctx = useMemo(
    () => ({ page: route.page, params: route.params, navigate, period, setPeriod, notifications: items, markRead, notify }),
    [route, navigate, period, items, markRead, notify],
  );

  const commands: Command[] = useMemo(
    () => [
      ...PAGES.map((p) => ({ id: `git-${p.id}`, label: p.label, group: "Gezinme", icon: ICONS[p.id], onSelect: () => navigate(p.id) })),
      {
        id: "randevu",
        label: "Yeni Randevu Oluştur",
        hint: "Takvim · üç adımlı akış",
        group: "Eylemler",
        icon: <CalendarPlus />,
        keywords: ["toplantı", "görüşme"],
        onSelect: () => {
          navigate("takvim");
          window.setTimeout(() => document.getElementById("randevu")?.scrollIntoView({ block: "start" }), LOAD_MS + 50);
        },
      },
      { id: "acik", label: "Açık Talepleri Göster", hint: `${OPEN_TICKETS.filter((t) => t.status === "Açık").length} talep`, group: "Eylemler", icon: <Inbox />, onSelect: () => navigate("gelen", { durum: "Açık" }) },
      { id: "gecikme", label: "Geciken Siparişlerin Talepleri", group: "Eylemler", icon: <TriangleAlert />, keywords: ["kargo"], onSelect: () => navigate("gelen", { etiket: "Gecikme" }) },
      { id: "asistan", label: "Asistana Sor", group: "Eylemler", icon: <Sparkles />, keywords: ["yapay zekâ", "sohbet"], onSelect: () => navigate("asistan") },
      { id: "disa", label: "Siparişleri Dışa Aktar", hint: "CSV", group: "Eylemler", icon: <Download />, onSelect: () => navigate("raporlar", { sekme: "aktar" }) },
      ...PERIODS.map((p) => ({
        id: `donem-${p.value}`,
        label: `Dönem: ${p.label}`,
        group: "Pano",
        icon: <Timer />,
        keywords: ["hafta", "ay", "yıl", "dönem"],
        onSelect: () => {
          setPeriod(p.value);
          navigate("pano");
        },
      })),
      ...OPEN_TICKETS.map((t) => ({
        id: t.id,
        label: `${t.id} · ${t.subject}`,
        hint: customer(t.customerId).name,
        group: "Açık Talepler",
        keywords: [customer(t.customerId).name, customer(t.customerId).contact],
        onSelect: () => navigate("gelen", { talep: t.id }),
      })),
    ],
    [navigate],
  );

  if (!signedIn) {
    return (
      <GirisPage
        onSignedIn={() => {
          setSignedIn(true);
          setRoute({ page: "pano", params: {} });
        }}
      />
    );
  }

  const loadingPage = pending;
  return (
    <AppContext.Provider value={ctx}>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <AppShell
        brand={BRAND}
        groups={NAV}
        current={href(loadingPage ?? route.page)}
        user={{ name: ME.name, detail: ME.role }}
        userAction={<IconButton icon={LogOut} aria-label="Oturumu Kapat" size="sm" onClick={() => setSignedIn(false)} />}
        searchLabel="Ara ya da git"
        className="[&>aside]:sticky [&>aside]:top-0 [&>aside]:h-dvh [&>aside]:self-start"
      >
        {loadingPage ? <PageLoading page={loadingPage} /> : <PageView key={`${route.page}:${route.params.durum ?? ""}:${route.params.etiket ?? ""}`} page={route.page} />}
      </AppShell>
      <CommandPalette commands={commands} placeholder="Sayfa, talep ya da komut ara" />
      <Toasts toasts={toasts} dismiss={dismiss} />
    </AppContext.Provider>
  );
}
