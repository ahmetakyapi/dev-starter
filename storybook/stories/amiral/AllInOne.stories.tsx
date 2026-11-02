import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight, Blocks as BlocksIcon, ChartArea, Compass, LayoutGrid, Palette, Rocket, SwatchBook } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { buttonClass } from "@/components/ui/Button";
import { CommandPalette, type Command } from "@/components/ui/command-palette";
import { CopyButton } from "@/components/ui/copy-button";
import { Meter } from "@/components/ui/meter";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { RouteProgress } from "@/components/ui/route-progress";
import { cn } from "@/lib/utils";
import { BRAND, GROUPS, GROUP_OF } from "./_data";
import { Blocks } from "./_bloklar";
import { GALLERY_GROUPS } from "./_galeri";
import { Dashboard } from "./_grafikler";
import { Hero } from "./_kahraman";
import { COVERED, STORY_COUNT, SNIPPETS, TOTAL, UNGROUPED, USED, anchorOf, inGroup } from "./_kapsam";
import { PALETTE_COUNT, PALETTE_LABELS, PaletteCards, ThemeCompare } from "./_tema";
import { GroupHead, Reveal, SectionHead } from "./_ui";

/* Storybook içi bağlantılar: İngilizce kimlikler (ana oturumun adlandırması). */
const story = (id: string) => `./?path=/story/${id}`;
const PUSULA = story("showcase-pusula-dashboard--app");
const GETTING_STARTED = story("getting-started--getting-started");
const GALLERY = story("gallery--overview");

const count = (group: (typeof GROUPS)[number]["id"]) => Object.values(GROUP_OF).filter((g) => g === group).length;

const GALLERY_COUNT = GROUPS.filter((g) => g.section === "bilesenler").reduce((n, g) => n + count(g.id), 0);

const NAV = [
  { href: "#bilesenler", label: "Bileşenler" },
  { href: "#grafikler", label: "Grafikler" },
  { href: "#bloklar", label: "Bloklar" },
  { href: "#tema", label: "Tema" },
  { href: "#kurulum", label: "Kurulum" },
] as const;

const go = (hash: string) => () => document.querySelector(hash)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

const COMMANDS: Command[] = [
  ...NAV.map((n, i) => ({
    id: n.href,
    label: `${n.label} Bölümüne Git`,
    group: "Bölümler",
    icon: [<LayoutGrid key="0" />, <ChartArea key="1" />, <BlocksIcon key="2" />, <Palette key="3" />, <Rocket key="4" />][i],
    onSelect: go(n.href),
  })),
  ...Object.entries(PALETTE_LABELS).map(([id, label]) => ({
    id: `palet-${id}`,
    label: `Palet: ${label}`,
    group: "Paletler",
    icon: <SwatchBook />,
    keywords: [id, "renk"],
    onSelect: () => {
      document.documentElement.dataset.palette = id;
    },
  })),
];

const STEPS = [
  { t: "Şablonu Aç", d: "Next 16 + Tailwind v4 + motion; token'lar, tema ve hook'lar hazır gelir.", code: "/new-project kiyi-kahve" },
  { t: "Bileşeni Al", d: "Paket değil kaynak: dosya components/ui altına kopyalanır, senin olur.", code: "/snippet chart-card\n# ya da\ncp ~/dev-starter/snippets/ui/chart-card.tsx components/ui/" },
  { t: "Paleti Seç", d: "html'e tek öznitelik; açık ve koyu tema kendiliğinden döner.", code: '<html data-palette="jade" data-theme="light">' },
];

/* --- Parçalar ------------------------------------------------------------ */

function TopBar() {
  return (
    <div className="sticky top-0 z-30 border-b border-line-soft bg-page/85 backdrop-blur-md">
      <nav aria-label="Sayfa Bölümleri" className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <a href="#ust" className="flex items-center gap-2 text-base font-semibold text-strong">
          <span aria-hidden className="size-5 rounded-md bg-brand" />
          dev-starter
        </a>
        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="rounded-full px-3 py-1.5 text-small font-medium text-body transition-colors hover:bg-surface-raised hover:text-strong">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#kapsam" className="ml-auto rounded-full bg-success-wash px-2.5 py-1 text-small font-semibold text-success tabular-nums md:ml-2">
          {COVERED}/{TOTAL}
          <span className="sr-only"> bileşen bu sayfada</span>
        </a>
      </nav>
    </div>
  );
}

function Numbers() {
  const items = [
    { value: TOTAL, label: "bileşen", note: "snippets/ui, kopyala-yapıştır kaynak" },
    { value: count("grafik"), label: "grafik", note: "kart kabıyla, bağımlılıksız SVG" },
    { value: count("blok"), label: "blok", note: "kabuk, sohbet, giriş, ayarlar" },
    { value: PALETTE_COUNT, label: "palet", note: "tek öznitelikle değişir" },
    { value: 2, label: "tema", note: "açık ve koyu, her ikisinde AA" },
    { value: STORY_COUNT, label: "hikâye", note: "bu katalogda, kaynaktan sayıldı" },
  ];
  return (
    <section aria-labelledby="sayilar" className="mt-24 sm:mt-32">
      <h2 id="sayilar" className="sr-only">
        Sayılarla Katalog
      </h2>
      <dl className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col rounded-xl bg-overlay p-5 shadow-raised">
            <dt className="order-2 mt-1 text-base font-semibold text-strong">{it.label}</dt>
            <dd className="order-1 text-[clamp(2.25rem,4vw,3rem)] leading-none font-semibold tracking-[-0.04em] text-strong tabular-nums">{it.value}</dd>
            <dd className="order-3 mt-1 text-small text-muted">{it.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Section({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-baslik`} className={cn("mt-28 scroll-mt-16 sm:mt-40", className)}>
      {children}
    </section>
  );
}

function GroupJump() {
  return (
    <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Gruplar">
      {GROUPS.filter((g) => g.section === "bilesenler").map((g) => (
        <li key={g.id}>
          <a
            href={`#grup-${g.id}`}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-overlay px-3.5 text-small font-medium text-strong shadow-raised transition-[border-color] hover:border-line-strong"
          >
            {g.title}
            <span className="text-muted tabular-nums">{count(g.id)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Coverage() {
  const groups = [...GROUPS.map((g) => ({ id: g.id as string, title: g.title, names: inGroup(g.id) })), ...(UNGROUPED.length ? [{ id: "grupsuz", title: "Grupsuz", names: UNGROUPED }] : [])];
  return (
    <>
      <div className="grid gap-4 rounded-2xl bg-surface p-5 sm:grid-cols-[1fr_18rem] sm:items-end sm:p-7">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-[clamp(3rem,7vw,4.5rem)] leading-none font-semibold tracking-[-0.05em] text-strong tabular-nums">
            {COVERED}/{TOTAL}
          </span>
          <span className="text-read text-body">bileşen bu sayfanın kaynağında içe aktarılıyor</span>
        </p>
        <Meter
          label="Kapsam"
          value={COVERED}
          max={TOTAL}
          valueText={`${COVERED} / ${TOTAL}`}
          inverted
          thresholds={{ warn: 0.001, danger: 0.1 }}
          statusText={{ warn: "Eksik Var", danger: "Çok Eksik" }}
        />
      </div>
      <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map((g) => (
          <div key={g.id}>
            <h3 className="flex items-baseline justify-between border-b border-line pb-2 text-base font-semibold text-strong">
              {g.title}
              <span className="font-mono text-micro font-normal text-muted tabular-nums">{g.names.length}</span>
            </h3>
            <ul className="mt-2 grid gap-0.5">
              {g.names.map((name) => {
                const used = USED.includes(name);
                return (
                  <li key={name}>
                    <a
                      href={anchorOf(name)}
                      className={cn(
                        "flex min-h-8 items-center gap-2 rounded-md px-1.5 font-mono text-small transition-colors hover:bg-surface-raised",
                        used ? "text-body hover:text-strong" : "text-danger",
                      )}
                    >
                      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", used ? "bg-success" : "bg-danger")} />
                      {name}
                      {used ? null : <span className="sr-only"> (bu sayfada yok)</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function Install() {
  return (
    <>
      <ol className="grid gap-4 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.t} className="flex min-w-0 flex-col rounded-2xl bg-surface p-2">
            <div className="px-4 pt-4 pb-5">
              <p className="font-mono text-small text-muted tabular-nums">0{i + 1}</p>
              <p className="mt-5 text-title font-semibold tracking-[-0.02em] text-strong">{s.t}</p>
              <p className="mt-1.5 text-base text-body">{s.d}</p>
            </div>
            <div className="relative mt-auto rounded-xl bg-overlay shadow-raised">
              <pre className="overflow-x-auto p-4 pr-12 font-mono text-small leading-relaxed text-strong" tabIndex={0} aria-label={`Adım ${i + 1} kodu`}>
                <code>{s.code}</code>
              </pre>
              <div className="absolute top-0 right-0">
                <CopyButton value={s.code} label={`Adım ${i + 1} kodunu kopyala`} className="size-11" />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { href: PUSULA, icon: <Compass />, t: "Pusula Paneli'ni Aç", d: `Aynı ${TOTAL} bileşen, gezilebilen gerçek bir uygulamada.` },
          { href: GALLERY, icon: <LayoutGrid />, t: "Vitrine Geç", d: "Grup grup vitrin sayfaları, her bileşen ayrı kuyuda." },
          { href: GETTING_STARTED, icon: <Rocket />, t: "Başlangıç", d: "Board dilinin dört ilkesi ve token sayfaları." },
        ].map((l) => (
          <li key={l.t}>
            <a href={l.href} target="_top" className="group flex h-full items-start gap-4 rounded-2xl border border-line p-5 transition-colors hover:bg-surface">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-overlay text-strong shadow-raised [&_svg]:size-4">
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-strong">{l.t}</span>
                <span className="mt-1 block text-small text-body">{l.d}</span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-strong" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/* --- Sayfa --------------------------------------------------------------- */

function AllInOnePage() {
  return (
    <div id="ust" className="min-h-dvh w-full bg-page text-body">
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <TopBar />
      <main className="mx-auto max-w-7xl px-5 pt-14 pb-40 sm:px-8 sm:pt-24">
        <Hero covered={COVERED} total={TOTAL} pusulaHref={PUSULA} />
        <Numbers />

        <Section id="bilesenler">
          <SectionHead
            id="bilesenler-baslik"
            index="01"
            eyebrow="Bileşenler"
            title={
              <>
                {GALLERY_COUNT} parça, <span className="text-muted">hepsi canlı.</span>
              </>
            }
            lead="Her biri kendi kuyusunda, gerçek veriyle ve tıklanabilir: menüler açılır, takvim oklarla gezilir, pencere odak tuzağıyla gelir."
          />
          <GroupJump />
          <div className="mt-14 grid gap-20">
            {GALLERY_GROUPS.map(({ id, Group }) => {
              const g = GROUPS.find((x) => x.id === id)!;
              return (
                <section key={id} id={`grup-${id}`} aria-labelledby={`grup-${id}-baslik`} className="grid scroll-mt-20 gap-8">
                  <GroupHead id={`grup-${id}-baslik`} title={g.title} count={count(g.id)} note={g.note} />
                  <Reveal>
                    <Group />
                  </Reveal>
                </section>
              );
            })}
          </div>
        </Section>

        <Section id="grafikler">
          <SectionHead
            id="grafikler-baslik"
            index="02"
            eyebrow="Grafikler"
            title={
              <>
                {count("grafik")} grafik, <span className="text-muted">tek bir pano.</span>
              </>
            }
            lead="Kanal payı akışın kaynaklarıyla, huninin son aşaması ısı haritasının Ekim toplamıyla, abonelik halkası abone sayısıyla aynı. Hiçbir toplam elle yazılmadı."
          />
          <Reveal className="mt-10">
            <div id="b-chart-card" className="scroll-mt-20">
              <Dashboard />
            </div>
          </Reveal>
        </Section>

        <Section id="bloklar">
          <SectionHead
            id="bloklar-baslik"
            index="03"
            eyebrow="Bloklar"
            title={
              <>
                Parçalar birleşince, <span className="text-muted">ürün olur.</span>
              </>
            }
            lead="Uygulama kabuğunun içinde yapay zekâ asistanı planını adım adım yürütür; yaz ve gönder, cevap gelir. Giriş kartı ile ayarlar penceresi aynı dilde."
          />
          <Reveal className="mt-10">
            <Blocks />
          </Reveal>
        </Section>

        <Section id="tema">
          <SectionHead
            id="tema-baslik"
            index="04"
            eyebrow="Tema"
            title={
              <>
                On palet, <span className="display-ink">iki tema.</span>
              </>
            }
            lead="Sistem renkleri nötr kalır; palet yalnızca birincil eylemi, marka karosunu ve kısa başlığı boyar. Bir karta dokun: bütün sayfa o paletle döner."
          />
          <div className="mt-10">
            <PaletteCards />
          </div>
          <p id="b-palette-switcher" className="mt-4 scroll-mt-20 text-small text-muted">
            Aynı seçim ekranın altında yüzen palet hapında da (<code className="font-mono">palette-switcher</code>); yanındaki anahtar açık ve koyu temayı değiştirir.
          </p>
          <div className="mt-14">
            <ThemeCompare />
          </div>
        </Section>

        <Section id="kapsam">
          <SectionHead
            id="kapsam-baslik"
            index="05"
            eyebrow="Kapsam"
            title={
              <>
                Sayılan, <span className="text-muted">sayılmayan değil.</span>
              </>
            }
            lead={`Liste snippets/ui klasöründen (${SNIPPETS.length} dosya) ve bu sayfanın kaynak dosyalarındaki içe aktarımlardan derleme anında çıkar. Bir ada dokun, kuyusuna gidersin.`}
          />
          <div className="mt-10">
            <Coverage />
          </div>
        </Section>

        <Section id="kurulum">
          <SectionHead
            id="kurulum-baslik"
            index="06"
            eyebrow="Kurulum"
            title={
              <>
                Üç adımda <span className="text-muted">senin projende.</span>
              </>
            }
          />
          <div className="mt-10">
            <Install />
          </div>
        </Section>

        <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-small text-muted">
          <span>dev-starter · board dili · 2 Kasım 2026</span>
          <span>Örnek veri: {BRAND.name}, {BRAND.city}</span>
          <a href="#ust" className={buttonClass({ variant: "ghost", size: "sm" })}>
            Başa Dön
          </a>
        </footer>
      </main>
      <CommandPalette commands={COMMANDS} placeholder="Bölüm ya da palet ara" />
      <PaletteSwitcher initialPalette="signature" initialTheme="light" />
    </div>
  );
}

/* --- Hikâye --------------------------------------------------------------- */

const meta = {
  title: "Örnek Tasarım/Her Şey Bir Arada",
  id: "showcase-all-in-one",
  component: AllInOnePage,
  // Tam ekran vitrin sayfası: otomatik belge sayfası işe yaramaz ve kök adreste
  // ilk açılan kayıt olurdu. Ziyaretçi doğrudan sayfanın kendisini görür.
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Kataloğun vitrin yüzü: 73 bileşenin hepsi tek uzun sayfada, tek bir kurgunun (Kıyı Kahve, İzmir) tutarlı verisiyle. Kahraman kompozisyonu, sayılar, grup grup canlı bileşen galerisi, on bir grafiklik pano, bloklar, on palet ve iki tema, kapsam dizini ve kurulum. Kapsam rozeti derleme anında `import.meta.glob` ile ölçülür.",
      },
    },
  },
} satisfies Meta<typeof AllInOnePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllInOne: Story = {
  name: "Her Şey Bir Arada",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = document.documentElement;
    const before = root.dataset.palette ?? "signature";
    // 1. Kapsam tam: kaynaktan ölçülen oran.
    await expect(COVERED).toBe(TOTAL);
    await expect(canvas.getAllByText(`${COVERED}/${TOTAL}`).length).toBeGreaterThan(0);
    // 2. Palet kartı <html data-palette>ı değiştirir, alttaki hap aynı seçimi gösterir.
    const cards = within(canvas.getByRole("list", { name: "Paletler" }));
    await userEvent.click(cards.getByRole("button", { name: /Yakut/ }));
    await waitFor(() => expect(root.dataset.palette).toBe("ruby"));
    await expect(cards.getByRole("button", { name: /Yakut/ })).toHaveAttribute("aria-pressed", "true");
    // 3. Geri al: toolbar'daki seçim neyse o.
    root.dataset.palette = before;
    window.scrollTo({ top: 0 });
    await waitFor(() => expect(cards.getByRole("button", { name: new RegExp(PALETTE_LABELS[before as keyof typeof PALETTE_LABELS] ?? "Signature") })).toHaveAttribute("aria-pressed", "true"));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
