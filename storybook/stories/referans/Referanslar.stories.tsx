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
 * SAHNE (Apple mağaza rafı mantığı): şerit sayfanın içerik hizasından
 * başlar, masaüstünde üç kart birden görünür, sağda bir sonrakinin kenarı
 * kesilir: "devamı var". **Değişti (2026-11-11):** eskiden ilk kart ekranın
 * ortasına oturtuluyordu; geniş ekranda solda yarım ekranlık boşluk kalıyor,
 * şerit "sağdan başlıyor" gibi duruyordu (kullanıcı geri bildirimi). Kenara
 * giren kartın yalnız KAPAĞI söner (kaydırmaya bağlı CSS, `animation-timeline:
 * view(inline)`, `entry`/`exit` aralığı); desteklemeyen tarayıcıda ve hareketi
 * azaltanda kartlar düz durur.
 *
 * KAYDIRMA tarayıcının: yatay `scroll-snap` (kart başı içerik hizasına
 * oturur, `scroll-padding`). Oklar, klavye (← → Home End) ve noktalar
 * `scrollTo` ile; baştaki kart ve şeridin sona gelip gelmediği
 * `IntersectionObserver` ile bulunur (kaydırma dinleyicisi yok). Sayaç
 * "02 / 07" gizli canlı bölgeyle okunur, yalnız düğme ya da klavyeyle
 * değiştiğinde.
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
/* İçerik hizası: başlığın 72rem kabıyla aynı sol kenar; dar ekranda 1rem. */
.ref-shelf { --gutter: max(1rem, calc((100% - 72rem) / 2)); }
.ref-stage { scrollbar-width: none; padding-inline: var(--gutter); scroll-padding-inline: var(--gutter); }
.ref-stage::-webkit-scrollbar { display: none; }
@supports (animation-timeline: view()) {
  .ref-dim { animation: ref-dim linear both; animation-timeline: view(inline); animation-range: entry 0% exit 100%; }
}
/* Yalnız kapak söner, METİN DEĞİL: soluk metin AA'nın altına düşerdi (axe). */
@keyframes ref-dim { 0% { opacity: 0.35; } 12%, 88% { opacity: 1; } 100% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) { .ref-dim { animation: none; } }`;

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
  // Elenenler satırı "site → ne (uzun liste)": kart adı parantezden öncesi;
  // listenin tamamı arşivde kalır, kartta iki satırı geçmez.
  const name = gallery ? (link?.text ?? first.plain) : (ownLink?.text ?? first.plain.split(" (")[0]);
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
  // Elenen satır "site → ne": çubukta site, kapakta elenen şeyin baş harfleri.
  // Hepsi aynı sitenin harflerini ("SC") taşıyınca kapak hiçbir şey söylemiyordu.
  const [site, subject] = v.name.includes(" → ") ? v.name.split(" → ") : [undefined, undefined];
  const host = hostOf(v.href) ?? site;
  const mark = subject ?? v.name;
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
          <div className={cn("absolute inset-0 grid place-items-center", seriesOf(mark))}>
            <span className="text-display font-semibold text-chart-ink">{monogram(mark)}</span>
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
          <h2 className="line-clamp-2 min-w-0 text-title font-semibold text-strong">
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
  const [edges, setEdges] = useState({ start: true, end: cards.length <= 1 });
  const [announce, setAnnounce] = useState(false);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-index]")];
    // Gözlemci yalnız TETİKLER: baştaki kart, sol iç kenara (içerik hizası) en yakın olandır.
    const update = () => {
      const left = root.getBoundingClientRect().left + parseFloat(getComputedStyle(root).paddingLeft);
      const right = root.getBoundingClientRect().right;
      let best = 0;
      let gap = Infinity;
      items.forEach((el) => {
        const d = Math.abs(el.getBoundingClientRect().left - left);
        if (d < gap) {
          gap = d;
          best = Number(el.dataset.index);
        }
      });
      setActive(best);
      const first = items[0]?.getBoundingClientRect();
      const last = items.at(-1)?.getBoundingClientRect();
      setEdges({ start: !first || first.left >= left - 2, end: !last || last.right <= right + 2 });
    };
    const io = new IntersectionObserver(update, { root, threshold: [0, 0.25, 0.5, 0.75, 0.98, 1] });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cards]);

  const go = useCallback(
    (i: number) => {
      const root = scroller.current;
      const target = root?.querySelector<HTMLElement>(`[data-index="${Math.max(0, Math.min(cards.length - 1, i))}"]`);
      if (!root || !target) return;
      setAnnounce(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.scrollTo({ left: target.offsetLeft - parseFloat(getComputedStyle(root).paddingLeft), behavior: reduce ? "auto" : "smooth" });
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
    "grid size-11 place-items-center rounded-full bg-overlay text-strong shadow-raised ring-1 ring-line-soft transition-[opacity,scale,box-shadow] duration-200 hover:shadow-floating active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-35";

  return (
    <section aria-roledescription="carousel" aria-label={label} className="ref-shelf relative grid gap-2">
      <div
        ref={scroller}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={() => setAnnounce(false)}
        aria-label={`${label}: kartlar arasında sol ve sağ okla gezin`}
        className="ref-stage flex snap-x snap-mandatory gap-5 overflow-x-auto py-6 outline-offset-4 [--card:min(22rem,84vw)] focus-visible:outline-2 focus-visible:outline-line-focus"
      >
        {cards.map((v, i) => (
          <div key={v.id} data-index={i} className="flex shrink-0 snap-start">
            <Card v={v} index={i} total={cards.length} />
          </div>
        ))}
      </div>
      {/* Denetim satırı şeritle aynı hizada: solda noktalar ve sayaç, sağda oklar (kartların üstüne binmez). */}
      <div className="flex items-center justify-between gap-4 px-(--gutter)">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden items-center sm:flex" role="group" aria-label="Kart Seç">
            {cards.map((v, i) => (
              <button
                key={v.id}
                type="button"
                aria-label={`${i + 1}. kart: ${v.name}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
                className="group grid h-8 w-5 place-items-center"
              >
                <span className={cn("block h-1.5 rounded-full transition-[width,background-color] duration-300", i === active ? "w-4 bg-strong" : "w-1.5 bg-line-strong group-hover:bg-muted")} />
              </button>
            ))}
          </div>
          <span className="font-mono text-small text-muted tabular-nums">
            {pad(active + 1)} / {pad(cards.length)}
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Önceki" aria-disabled={edges.start} onClick={() => go(active - 1)} className={arrow}>
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <button type="button" aria-label="Sonraki" aria-disabled={edges.end} onClick={() => go(active + 1)} className={arrow}>
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>
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
          "Ekosisteme bir şey kazandırmış her dış kaynak, içerik hizasından başlayan bir kart rafında: masaüstünde üç kart birden, sağda sıradakinin kenarı. Veri `knowledge/references.md`ten derleme anında okunur; arşive eklenen satır buraya kendiliğinden düşer.",
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
