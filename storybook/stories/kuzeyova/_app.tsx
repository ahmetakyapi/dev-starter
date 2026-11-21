"use client";

import "./kuzeyova.css";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Gauge,
  Headset,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Radio,
  Receipt,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { CommandPalette, openCommandPalette } from "@/components/ui/command-palette";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { NotificationCenter } from "@/components/ui/notification-center";
import { IconButton } from "@/components/ui/icon-button";
import { RouteProgress, startRouteProgress, stopRouteProgress } from "@/components/ui/route-progress";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/toast";
import type { NotificationItem } from "@/components/ui/notification-center";
import { ME, type Period } from "./_data";
import { markNotificationsRead, pushNotification, useNotifications } from "./_store";
import { useBadges, type Badges } from "./_selectors";
import { ROLES, setViewAs, useCan, useRole, useSession, currentUser } from "./_permissions";
import { Forbidden } from "./_kit";
import { useSearchCommands } from "./_search";
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
import { BasvurularPage } from "./_basvurular";
import { KacakPage } from "./_kacak";
import { StokPage } from "./_stok";
import { CagriPage } from "./_cagri";
import { SebekePage } from "./_sebeke";
import { UreticilerPage } from "./_ureticiler";
import { ItirazlarPage } from "./_itirazlar";
import { IsEmirleriPage } from "./_isemirleri";
import { SahaPage } from "./_saha";
import { UyumPage } from "./_uyum";

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
  applications: <ClipboardList />,
  stock: <Boxes />,
  field: <Smartphone />,
  producers: <Sun />,
  disputes: <Scale />,
  calls: <Headset />,
  leaks: <ShieldAlert />,
  workorders: <Wrench />,
  grid: <Network />,
  compliance: <ShieldCheck />,
};

/** Telefonda alt sekme çubuğu: dördü sayfa, beşincisi "Menü" (çekmece). */
const BOTTOM: readonly Page[] = ["dashboard", "customers", "readings", "outages"];

const SHORTCUTS: readonly (readonly [readonly string[], string])[] = [
  [["⌘", "K"], "Komut Paleti: Müşteri, Sayaç, Sayfa Ara"],
  [["g", "p"], "Panoya Git"],
  [["g", "m"], "Müşteriler"],
  [["g", "s"], "Sayaçlar"],
  [["g", "o"], "Okumalar"],
  [["g", "f"], "Faturalar"],
  [["g", "d"], "Ödemeler"],
  [["g", "a"], "Arıza ve Kesintiler"],
  [["j", "k"], "Listede Sonraki / Önceki Satır"],
  [["/"], "Ara (Sayfada Arama Yoksa Komut Paleti)"],
  [["?"], "Bu Yardım"],
];

const GROUPS: readonly { label: string; pages: readonly Page[] }[] = [
  { label: "Genel", pages: ["dashboard"] },
  { label: "Müşteriler", pages: ["customers", "applications", "register"] },
  { label: "Ölçüm", pages: ["meters", "stock", "readings", "field", "rawdata", "producers"] },
  { label: "Finans", pages: ["invoices", "payments", "disputes"] },
  { label: "Operasyon", pages: ["outages", "calls", "leaks", "workorders", "grid"] },
  { label: "Piyasa", pages: ["suppliers"] },
  { label: "Raporlar", pages: ["reports"] },
  { label: "Sistem", pages: ["compliance", "settings"] },
];

/** Rozetler CANLI: tek depodan (`_selectors.ts`); bir işlem yapılınca anında değişir. */
const badgeOf = (b: Badges): Partial<Record<Page, number>> => ({
  readings: b.readings,
  invoices: b.invoices,
  outages: b.outages,
  calls: b.calls,
  leaks: b.leaks,
  applications: b.applications,
  disputes: b.disputes,
  compliance: b.compliance,
  workorders: b.workorders,
});

const navGroups = (b: Badges): readonly ShellNavGroup[] => {
  const map = badgeOf(b);
  return GROUPS.map((g) => ({
    label: g.label,
    items: g.pages.map((id) => ({ href: href(id), label: pageInfo(id).label, icon: ICONS[id], badge: map[id] || undefined })),
  }));
};

const BRAND = {
  name: "Kuzeyova",
  href: href("dashboard"),
  logo: (
    <span className="kz-mark inline-grid size-7 place-items-center rounded-lg">
      <Zap className="!size-4" strokeWidth={2.25} />
    </span>
  ),
};

/** Sayfa düzeyinde yetki: izni olmayan rol `Forbidden` görür (Ayarlar: yönetici ya da denetçi). */
function Guarded({ page, children }: { page: Page; children: ReactNode }) {
  const hamveri = useCan("hamveri");
  const musteri = useCan("musteri");
  const kullanici = useCan("kullanici");
  const role = useRole();
  if (page === "rawdata" && !hamveri) return <Forbidden what="Ham Veri" permission="Ham Veri Görüntüleme" />;
  if (page === "register" && !musteri) return <Forbidden what="Müşteri Kaydı" permission="Müşteri Kaydı ve Düzenleme" />;
  if (page === "settings" && !kullanici && role !== "denetci") return <Forbidden what="Ayarlar" permission="Kullanıcı ve Rol Yönetimi" />;
  return <>{children}</>;
}

function PageView({ page, params, go }: { page: Page; params: Params; go: (page: Page, params?: Record<string, string | undefined>) => void }) {
  return (
    <Guarded page={page}>
      <PageSwitch page={page} params={params} go={go} />
    </Guarded>
  );
}

function PageSwitch({ page, params, go }: { page: Page; params: Params; go: (page: Page, params?: Record<string, string | undefined>) => void }) {
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
    case "applications":
      return <BasvurularPage {...props} />;
    case "stock":
      return <StokPage {...props} />;
    case "field":
      return <SahaPage {...props} />;
    case "producers":
      return <UreticilerPage {...props} />;
    case "disputes":
      return <ItirazlarPage {...props} />;
    case "calls":
      return <CagriPage {...props} />;
    case "leaks":
      return <KacakPage {...props} />;
    case "workorders":
      return <IsEmirleriPage {...props} />;
    case "grid":
      return <SebekePage {...props} />;
    case "compliance":
      return <UyumPage {...props} />;
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

export type KuzeyovaAppProps = {
  /** Açılıştaki sayfa. */
  initialPage?: Page;
  /** Açılıştaki derin bağlantı: `{ id: "C-10001" }`, `{ status: "gecikti" }`. */
  initialParams?: Params;
  initialPeriod?: Period;
};

const NOTICE_ICONS: Record<string, typeof Zap> = { n1: Zap, n2: Gauge, n3: Radio };

/* --- Adres: gerçek geri tuşu, yenileme ve derin bağlantı -----------------------
 * Storybook iframe'inin KENDİ adresi kullanılır (`window.parent` değil). Storybook
 * zaten `id` ve `viewMode` kullandığı için bizim parametreler `e_` önekiyle yazılır;
 * `e_story` hangi hikayeye ait olduğunu söyler (hikaye değişince eski adres yok sayılır):
 * `?id=portal--overview&viewMode=story&e_story=portal--overview&e_view=customers&e_id=C-10001`. */
const PREFIX = "e_";

function readRoute(): { page: Page; params: Params } | null {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search);
    const page = q.get(`${PREFIX}view`) as Page | null;
    if (!page || !PAGES.some((p) => p.id === page)) return null;
    // Başka bir hikayeden kalan adres parametresi bu hikayeyi etkilemesin.
    if (q.get(`${PREFIX}story`) !== q.get("id")) return null;
    const params: Record<string, string> = {};
    q.forEach((v, k) => {
      if (k.startsWith(PREFIX) && k !== `${PREFIX}view` && k !== `${PREFIX}story`) params[k.slice(PREFIX.length)] = v;
    });
    return { page, params };
  } catch {
    return null;
  }
}

function writeRoute(page: Page, params: Record<string, string>, replace: boolean) {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of [...q.keys()]) if (k.startsWith(PREFIX)) q.delete(k);
    q.set(`${PREFIX}view`, page);
    q.set(`${PREFIX}story`, q.get("id") ?? "");
    for (const [k, v] of Object.entries(params)) q.set(`${PREFIX}${k}`, v);
    const url = `${window.location.pathname}?${q.toString()}`;
    if (url === `${window.location.pathname}${window.location.search}`) return;
    if (replace) window.history.replaceState({ kuzeyova: true }, "", url);
    else window.history.pushState({ kuzeyova: true }, "", url);
  } catch {
    /* iframe kısıtlıysa adres güncellenmez; gezinme yine çalışır */
  }
}

export function KuzeyovaApp({ initialPage = "dashboard", initialParams = {}, initialPeriod = "3" }: KuzeyovaAppProps) {
  const [route, setRoute] = useState<{ page: Page; params: Params }>(() => readRoute() ?? { page: initialPage, params: initialParams });
  const [pending, setPending] = useState<Page | null>(null);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const stored = useNotifications();
  const badgeCounts = useBadges();
  const session = useSession();
  const [signedIn, setSignedIn] = useState(true);
  const routeRef = useRef(route);
  routeRef.current = route;
  const timer = useRef<number | null>(null);
  const [help, setHelp] = useState(false);
  const armedAt = useRef(0);

  const navigate = useCallback((page: Page, params: Record<string, string | undefined> = {}) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") clean[k] = v;
    if (timer.current) window.clearTimeout(timer.current);
    // Aynı sayfada parametre değişimi (sıralama, süzgeç, ayrıntı) anında.
    if (page === routeRef.current.page) {
      setPending(null);
      // Ayrıntı açılıp kapanırsa yeni geçmiş girdisi, süzgeç yazımı yalnız adresi günceller.
      writeRoute(page, clean, (routeRef.current.params.id ?? "") === (clean.id ?? ""));
      setRoute({ page, params: clean });
      stopRouteProgress();
      return;
    }
    startRouteProgress();
    setPending(page);
    timer.current = window.setTimeout(() => {
      writeRoute(page, clean, false);
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

  // Tarayıcı geri/ileri: adresten yeniden oku.
  useEffect(() => {
    const onPop = () => {
      if (timer.current) window.clearTimeout(timer.current);
      setPending(null);
      stopRouteProgress();
      setRoute(readRoute() ?? { page: initialPage, params: initialParams });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Klavye: `g` + harf gezinme, `?` yardım, `/` (sayfada arama yoksa) komut paleti.
  useEffect(() => {
    const go: Record<string, Page> = { p: "dashboard", m: "customers", s: "meters", o: "readings", f: "invoices", d: "payments", a: "outages", h: "rawdata" };
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const t = event.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "?") {
        event.preventDefault();
        setHelp(true);
        return;
      }
      if (event.key === "/" && !document.querySelector("[role='search']")) {
        event.preventDefault();
        openCommandPalette();
        return;
      }
      if (armedAt.current && Date.now() - armedAt.current < 1000 && go[event.key]) {
        event.preventDefault();
        armedAt.current = 0;
        navigate(go[event.key]);
        return;
      }
      armedAt.current = event.key === "g" ? Date.now() : 0;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const notify = useCallback((notice: Toast) => {
    const options = { description: notice.body };
    if (notice.undo) toast.undo(notice.title, notice.undo, options);
    else if (notice.tone === "success") toast.success(notice.title, options);
    else toast.info(notice.title, options);
    pushNotification(notice.title, notice.body, notice.tone === "success" ? "success" : "info");
  }, []);

  const notices: NotificationItem[] = useMemo(
    () => stored.map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.at, read: n.read, icon: NOTICE_ICONS[n.id] ?? (n.tone === "success" ? CheckCircle2 : Info) })),
    [stored],
  );
  const markRead = useCallback((ids: string[]) => markNotificationsRead(ids), []);
  const nav = useMemo(() => navGroups(badgeCounts), [badgeCounts]);

  const ctx = useMemo(
    () => ({ page: route.page, params: route.params, navigate, period, setPeriod, notifications: notices, markRead, notify }),
    [route, navigate, period, notices, markRead, notify],
  );

  /* Genel arama: sayfalar + müşteri, sayaç, fatura, arıza, iş emri, çağrı, başvuru, vaka, itiraz (`_search.tsx`). */
  const { commands, emptyCommands } = useSearchCommands({ navigate, setPeriod, badges: badgeCounts, pages: PAGES, icons: ICONS });

  if (!signedIn) {
    return (
      <div data-product="kuzeyova" className="grid min-h-dvh place-items-center bg-page p-6">
        <div className="max-w-sm text-center">
          <span className="kz-mark mx-auto inline-grid size-10 place-items-center rounded-xl">
            <Zap className="size-5" />
          </span>
          <h1 className="mt-4 text-heading font-semibold text-strong">Oturum Kapandı</h1>
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
      <div data-product="kuzeyova" className="contents">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <AppShell
          brand={BRAND}
          groups={nav}
          current={href(loadingPage ?? route.page)}
          user={{ name: currentUser().name, detail: session.viewAs ? `${ROLES.find((r) => r.id === session.viewAs)?.label} olarak görüntüleniyor` : ME.role }}
          userAction={
            <DropdownMenu>
              <DropdownMenuTrigger render={<IconButton icon={UserCog} aria-label="Hesap ve Rol" size="sm" />} />
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Şu Rol Olarak Gör</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={session.viewAs ?? "kendi"} onValueChange={(v) => setViewAs(v === "kendi" ? null : (v as (typeof ROLES)[number]["id"]))}>
                    <DropdownMenuRadioItem value="kendi">Kendi rolüm</DropdownMenuRadioItem>
                    {ROLES.map((r) => (
                      <DropdownMenuRadioItem key={r.id} value={r.id}>
                        {r.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<LogOut />} onClick={() => setSignedIn(false)}>
                  Oturumu Kapat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          mobileActions={<NotificationCenter items={notices} onMarkRead={markRead} />}
          bottomBar={({ openMenu }) => (
            <nav aria-label="Alt Gezinme" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-overlay pb-[env(safe-area-inset-bottom)] lg:hidden">
              {BOTTOM.map((id) => {
                const on = (loadingPage ?? route.page) === id;
                return (
                  <a key={id} href={href(id)} aria-current={on ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-micro font-medium outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset [&_svg]:size-5", on ? "text-strong" : "text-muted")}>
                    {ICONS[id]}
                    {pageInfo(id).label.split(" ")[0]}
                  </a>
                );
              })}
              <button type="button" onClick={openMenu} aria-haspopup="dialog" className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-micro font-medium text-muted outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset [&_svg]:size-5">
                <Menu aria-hidden />
                Menü
              </button>
            </nav>
          )}
          searchLabel="Ara"
          className="kz-shell [&>aside]:sticky [&>aside]:top-0 [&>aside]:h-dvh [&>aside]:self-start"
        >
          {loadingPage ? (
            <PageLoading page={loadingPage} />
          ) : (
            <PageView key={`${route.page}:${route.params.id ?? ""}`} page={route.page} params={route.params} go={navigate} />
          )}
        </AppShell>
        <CommandPalette commands={commands} emptyCommands={emptyCommands} maxResults={60} placeholder="Müşteri, sayaç, sayfa ya da komut ara" />
        <Dialog open={help} onOpenChange={setHelp} title="Klavye Kısayolları" description="Metin alanında yazarken kısayollar çalışmaz." size="sm">
          <dl className="grid gap-2.5 text-base text-body">
            {SHORTCUTS.map(([keys, what]) => (
              <div key={what} className="flex items-center justify-between gap-4">
                <dt>{what}</dt>
                <dd className="flex gap-1">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog>
        <Toaster />
      </div>
    </AppContext.Provider>
  );
}
