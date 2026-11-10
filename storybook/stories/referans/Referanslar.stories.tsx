import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import source from "../../../knowledge/references.md?raw";
import { coverOf, hostOf } from "./_covers";
import { parseReferences, type Cell, type RefCard } from "./_parse";

/**
 * Referans Arşivi sayfası. Veri `knowledge/references.md`ten derleme
 * anında okunur (kopya yok): `## ` başlıkları kategori, tablo satırları kart.
 *
 * SAHNE (Apple ürün atlıkarıncası mantığı): etkin kart ortada ve tam boy,
 * komşular iki yanda küçülmüş ve soluk görünür; sıradakinin varlığı her an
 * belli. Ölçek ve opaklık KAYDIRMAYA BAĞLI CSS ile (`animation-timeline:
 * view(inline)`): JavaScript her karede hesaplamaz, parmak/iz paneliyle
 * kaydırırken de birebir izler. Desteklemeyen tarayıcıda kartlar düz durur,
 * hareketi azaltanda da (aşağıdaki @media).
 *
 * KAYDIRMA tarayıcının: yatay `scroll-snap` (merkeze oturur), yan boşluk
 * ilk ve son kartı ortaya getirecek kadar. Oklar, klavye (← → Home End) ve
 * noktalar `scrollTo` ile; etkin kart `IntersectionObserver` ile bulunur
 * (kaydırma dinleyicisi yok). Sayaç "02 / 07" gizli canlı bölgeyle
 * okunur, yalnız düğme ya da klavyeyle değiştiğinde.
 *
 * KART: üstte tarayıcı çerçevesinde sitenin kendi paylaşım görseli
 * (`_covers.ts`, bağlantıyla); yoksa baş harfli kapak. Altta ad, tek satır
 * "Kısaca", tarih ve durum. Ayrıntı arşivde kalır: sayfa sade.
 */

const { sections, reviewed } = parseReferences(source);

const SHORT: Record<string, string> = {
  "Tasarım Dili İncelenen Siteler": "Siteler",
  "Bölüm Galerileri (`/reference`)": "Galeriler",
  "Değerlendirilip Alınmayanlar": "Elenenler",
  "Skill ve Kural Kaynakları": "Kaynaklar",
  "Teknik Belge ve Protokoller": "Belgeler",
  "Kendi Projelerimiz (İç Referans)": "Projelerimiz",
};

const SERIES = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

const CSS = `
.ref-stage { scrollbar-width: none; padding-inline: calc(50% - var(--card) / 2); }
.ref-stage::-webkit-scrollbar { display: none; }
@supports (animation-timeline: view()) {
  .ref-card, .ref-dim { animation-timing-function: linear; animation-fill-mode: both; animation-timeline: view(inline); animation-range: cover 0% cover 100%; }
  .ref-card { animation-name: ref-scale; }
  .ref-dim { animation-name: ref-dim; }
}
/* Yalnız kapak söner, METİN DEĞİL: soluk metin AA'nın altına düşerdi (axe).
   Yan kart küçülür ve görseli geri çekilir; adı ve özeti okunur kalır. */
@keyframes ref-scale { 0%, 100% { scale: 0.86; } 38%, 62% { scale: 1; } }
@keyframes ref-dim { 0%, 100% { opacity: 0.4; } 38%, 62% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ref-card, .ref-dim { animation: none; } }`;

type View = { id: string; name: string; href?: string; short: string; date?: string; status?: string };

const find = (card: RefCard, pattern: RegExp) => card.cells.find((c) => pattern.test(c.header));
const firstLink = (cells: Cell[]) => {
  for (const c of cells) for (const p of c.parts) if (p.kind === "link") return p;
  return undefined;
};

function view(card: RefCard): View {
  const [first] = card.cells;
  const short = find(card, /^kısaca$/i)?.plain ?? "";
  // Galeride ilk sütun bölüm adı ("Üst menü"): kartın adı galerinin kendisi.
  const gallery = /^bölüm$/i.test(first.header);
  const ownLink = first.parts.find((p) => p.kind === "link");
  const link = gallery ? firstLink(card.cells.slice(1)) : (ownLink ?? firstLink(card.cells.filter((c) => !/nerede|görsel hafıza/i.test(c.header))));
  const name = gallery ? (link?.text ?? first.plain) : (ownLink?.text ?? first.plain);
  return {
    id: card.id,
    name,
    href: link && link.kind === "link" ? link.href : undefined,
    short: gallery ? `${first.plain} · ${short}` : short,
    date: find(card, /^tarih$/i)?.plain,
    status: find(card, /^durum$/i)?.plain.split(/[;(]/)[0].trim(),
  };
}

function statusTone(text: string) {
  if (/kullanımda/i.test(text)) return "success" as const;
  if (/reddetti|kaldırıldı|denendi/i.test(text)) return "warning" as const;
  return "neutral" as const;
}

function monogram(name: string) {
  const clean = name.replace(/^www\./, "");
  const words = clean.split(/[\s./—-]+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : clean.slice(0, 2)).toLocaleUpperCase("tr-TR");
}

function seriesOf(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SERIES[h % SERIES.length];
}

function Cover({ v }: { v: View }) {
  const src = coverOf(v.href);
  const [failed, setFailed] = useState(false);
  const host = hostOf(v.href);
  return (
    <div className="overflow-hidden rounded-xl bg-surface-sunken shadow-raised">
      <div aria-hidden className="flex h-8 items-center gap-1.5 border-b border-line-soft bg-overlay px-3">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        {host ? <span className="mx-auto max-w-[60%] truncate rounded-full bg-surface-raised px-2.5 py-0.5 font-mono text-micro text-body">{host}</span> : null}
      </div>
      <div className="ref-dim relative aspect-[1.91/1]">
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className={cn("absolute inset-0 grid place-items-center", seriesOf(v.name))}>
            <span className="text-display font-semibold text-chart-ink">{monogram(v.name)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ v, index, total }: { v: View; index: number; total: number }) {
  return (
    <article
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}: ${v.name}`}
      className="ref-card group relative flex w-(--card) shrink-0 flex-col gap-5 rounded-2xl bg-overlay p-3 shadow-floating transition-shadow duration-300 hover:shadow-modal sm:p-4"
    >
      <Cover v={v} />
      <div className="grid gap-3 px-2 pb-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-title font-semibold text-strong">
            {v.href ? (
              <a
                href={v.href}
                target="_blank"
                rel="noreferrer"
                className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-line-focus"
              >
                {v.name}
                <span className="sr-only"> (yeni sekmede açılır)</span>
              </a>
            ) : (
              v.name
            )}
          </h2>
          {v.href ? (
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-raised text-muted transition-[background-color,color,translate] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-strong group-hover:text-page"
            >
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </span>
          ) : null}
        </div>
        {v.short ? <p className="text-read text-body">{v.short}</p> : null}
        {v.date || v.status ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {v.date ? <Badge>{v.date}</Badge> : null}
            {v.status ? (
              <Badge tone={statusTone(v.status)} dot>
                {v.status}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Stage({ label, cards }: { label: string; cards: View[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState(false);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    // Gözlemci yalnız TETİKLER; etkin kart merkeze en yakın olandır. Eşikle
    // seçmek (%75 görünen) kenarda dörtte üçü giren komşuyu da etkin sayıyordu.
    const nearest = () => {
      const mid = root.getBoundingClientRect().left + root.clientWidth / 2;
      let best = 0;
      let gap = Infinity;
      root.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < gap) {
          gap = d;
          best = Number(el.dataset.index);
        }
      });
      setActive(best);
    };
    const io = new IntersectionObserver(nearest, { root, threshold: [0, 0.25, 0.5, 0.75, 1] });
    root.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cards]);

  const go = useCallback(
    (i: number) => {
      const root = scroller.current;
      const target = root?.querySelector<HTMLElement>(`[data-index="${Math.max(0, Math.min(cards.length - 1, i))}"]`);
      if (!root || !target) return;
      setAnnounce(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.scrollTo({ left: target.offsetLeft - (root.clientWidth - target.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    },
    [cards.length],
  );

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: cards.length - 1 };
    if (map[event.key] === undefined) return;
    event.preventDefault();
    go(map[event.key]);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const arrow =
    "absolute top-[40%] z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-overlay text-strong shadow-floating transition-[opacity,scale] duration-200 hover:scale-105 active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-0 md:grid";

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative grid gap-4">
      <div
        ref={scroller}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={() => setAnnounce(false)}
        aria-label={`${label}: kartlar arasında sol ve sağ okla gezin`}
        className="ref-stage flex snap-x snap-mandatory gap-5 overflow-x-auto py-8 outline-offset-4 [--card:min(34rem,84vw)] focus-visible:outline-2 focus-visible:outline-line-focus"
      >
        {cards.map((v, i) => (
          <div key={v.id} data-index={i} className="flex shrink-0 snap-center">
            <Card v={v} index={i} total={cards.length} />
          </div>
        ))}
      </div>
      <button type="button" aria-label="Önceki" aria-disabled={active === 0} onClick={() => go(active - 1)} className={cn(arrow, "left-4 lg:left-10")}>
        <ChevronLeft className="size-5" strokeWidth={2} />
      </button>
      <button type="button" aria-label="Sonraki" aria-disabled={active === cards.length - 1} onClick={() => go(active + 1)} className={cn(arrow, "right-4 lg:right-10")}>
        <ChevronRight className="size-5" strokeWidth={2} />
      </button>
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center" role="group" aria-label="Kart Seç">
          {cards.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={`${i + 1}. kart: ${v.name}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
              className="group grid h-8 w-6 place-items-center"
            >
              <span className={cn("block h-1.5 rounded-full transition-[width,background-color] duration-300", i === active ? "w-5 bg-strong" : "w-1.5 bg-line-strong group-hover:bg-muted")} />
            </button>
          ))}
        </div>
        <span className="font-mono text-small text-muted tabular-nums">
          {pad(active + 1)} / {pad(cards.length)}
        </span>
      </div>
      <span aria-live="polite" className="sr-only">
        {announce ? `${active + 1} / ${cards.length}: ${cards[active]?.name}` : ""}
      </span>
    </section>
  );
}

function Archive() {
  const [current, setCurrent] = useState(sections[0]?.id ?? "");
  const section = sections.find((s) => s.id === current) ?? sections[0];
  const total = sections.reduce((n, s) => n + s.cards.length, 0);
  const label = SHORT[section.title] ?? section.title;

  return (
    <main className="grid min-h-dvh content-start gap-10 overflow-x-clip py-14 sm:py-20">
      <style href="ref-stage" precedence="default">
        {CSS}
      </style>
      <header className="mx-auto grid max-w-2xl justify-items-center gap-4 px-4 text-center">
        <span className="rounded-full bg-overlay px-3 py-1 text-small font-medium text-body shadow-raised">Bilgi Tabanı · {total} Kaynak</span>
        <h1 className="text-hero font-semibold">Referans Arşivi</h1>
        <p className="text-lead text-body">İncelediğimiz siteler, uyarladığımız kaynaklar ve bilerek almadıklarımız.</p>
      </header>

      {/* Grid + min-w-0: telefonda şerit kendi içinde kayar. `flex justify-center`
          taşan şeridi iki yandan keserdi ve soldaki seçenekler erişilemezdi. */}
      <div className="grid px-4">
        <SegmentedControl
          className="mx-auto min-w-0"
          aria-label="Referans Türü"
          value={current}
          onValueChange={setCurrent}
          options={sections.map((s) => ({
            value: s.id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {SHORT[s.title] ?? s.title}
                <span className="text-micro text-muted tabular-nums">{s.cards.length}</span>
              </span>
            ),
          }))}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={section.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: DUR.base, ease: EASE }}
        >
          <Stage label={label} cards={section.cards.map(view)} />
        </m.div>
      </AnimatePresence>

      <p className="px-4 text-center text-small text-muted">
        Ayrıntılar <code className="font-mono text-strong">knowledge/references.md</code>
        {reviewed ? ` · Son gözden geçirme ${reviewed}` : ""}
      </p>
    </main>
  );
}

const meta = {
  title: "Örnek Tasarım/Referans Arşivi",
  id: "references",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Ekosisteme bir şey kazandırmış her dış kaynak, ortalanmış bir kart sahnesinde: etkin kart ortada, komşular iki yanda soluk. Veri `knowledge/references.md`ten derleme anında okunur; arşive eklenen satır buraya kendiliğinden düşer.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Referans Arşivi",
  render: () => <Archive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Referans Arşivi" })).toBeVisible();
    await expect(await canvas.findByRole("link", { name: /bencho\.dev/ })).toHaveAttribute("href", "https://bencho.dev/");
    // Sayaç toplamı kart sayısından gelir; yeni referans eklenince test bayatlamasın.
    await expect(canvas.getByText(/^01 \/ \d{2}$/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Sonraki" }));
    await waitFor(() => expect(canvas.getByText(/^02 \/ \d{2}$/)).toBeVisible(), { timeout: 3000 });
    await userEvent.click(canvas.getByRole("radio", { name: /Galeriler/ }));
    await expect(await canvas.findByRole("link", { name: /navbar\.gallery/ })).toBeVisible();
  },
};
