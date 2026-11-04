import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Badge } from "@/components/ui/badge";
import { Carousel } from "@/components/ui/carousel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import source from "../../../knowledge/references.md?raw";
import { inline, parseReferences, type Inline, type RefCard } from "./_parse";

/**
 * Referans Arşivi sayfası. Veri `knowledge/references.md`ten derleme
 * anında okunur (kopya yok): `## ` başlıkları kategori, tablo satırları kart.
 * Arşive yeni satır eklenince sayfa da güncellenir.
 *
 * DÜZEN: kategori seçici (bölümlü denetim, sayılı) → yan yana kaydırılan
 * kartlar (`Carousel`: scroll-snap, oklar, klavye, canlı bölge). Kategori
 * değişince ray soluklaşarak yer değiştirir (opaklık + 8 px, `DUR.base`);
 * hareketi azaltanda yalnız soluklaşma (MotionConfig).
 *
 * KART: renkli baş harf karosu (seri rengi addan türer, iki kart aynı
 * renkte olabilir; anlam taşımaz), ad bağlantı, tarih ve durum hap,
 * "ne aldık" gövde metni, geri kalan sütunlar etiketli satırlar.
 */

const { sections, reviewed } = parseReferences(source);

/** Sekmede kısa ad; başlık kartın üstünde tam yazılır. */
const SHORT: Record<string, string> = {
  "Tasarım Dili İncelenen Siteler": "Siteler",
  "Bölüm Galerileri (`/reference`)": "Galeriler",
  "Değerlendirilip Alınmayanlar": "Elenenler",
  "Skill ve Kural Kaynakları": "Kaynaklar",
  "Teknik Belge ve Protokoller": "Belgeler",
  "Kendi Projelerimiz (İç Referans)": "Projelerimiz",
};

const BODY = /^(ne aldık|neden|ne için)$/i;
const SERIES = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"] as const;

function Rich({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.kind === "link" ? (
          <a key={i} href={p.href} target="_blank" rel="noreferrer" className="font-medium text-primary-ink underline decoration-line-strong underline-offset-2 hover:decoration-current">
            {p.text}
          </a>
        ) : p.kind === "code" ? (
          <code key={i} className="rounded-sm bg-surface-raised px-1 py-px font-mono text-small text-strong">
            {p.text}
          </code>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function statusTone(text: string) {
  if (/kullanımda/i.test(text)) return "success" as const;
  if (/reddetti|kaldırıldı/i.test(text)) return "warning" as const;
  return "neutral" as const;
}

function monogram(name: string) {
  const clean = name.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const words = clean.split(/[\s./—-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : clean.slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR");
}

function seriesOf(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SERIES[h % SERIES.length];
}

function ReferenceCard({ card }: { card: RefCard }) {
  const titleCell = card.cells.find((c) => c.parts.some((p) => p.kind === "link")) ?? card.cells[0];
  const link = titleCell.parts.find((p) => p.kind === "link");
  const name = link?.text ?? titleCell.plain;
  const date = card.cells.find((c) => /^tarih$/i.test(c.header));
  const status = card.cells.find((c) => /^durum$/i.test(c.header));
  // Gövdesi olmayan tabloda (galeriler, projeler) başlık dışındaki ilk dolu
  // sütun gövdeye çıkar: kart boş bir kutu gibi durmasın.
  const body =
    card.cells.find((c) => BODY.test(c.header)) ??
    card.cells.find((c) => c !== titleCell && c !== date && c !== status && c.plain && c.plain !== "—");
  const rest = card.cells.filter((c) => c !== titleCell && c !== date && c !== status && c !== body && c.plain && c.plain !== "—");

  const titleText: ReactNode = link ? (
    <a href={link.href} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-1 text-title font-semibold text-strong focus-visible:outline-offset-4">
      <span className="underline decoration-transparent underline-offset-4 transition-colors group-hover/link:decoration-line-strong">{name}</span>
      <ArrowUpRight aria-hidden className="size-4 text-muted transition-[translate,color] duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:text-strong" strokeWidth={2} />
      <span className="sr-only">(yeni sekmede açılır)</span>
    </a>
  ) : (
    <span className="text-title font-semibold text-strong">{name}</span>
  );

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl bg-overlay p-5 shadow-raised">
      <header className="flex items-start gap-3">
        <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-small font-bold text-chart-ink", seriesOf(name))}>
          {monogram(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="leading-tight">{titleText}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {date?.plain ? <Badge>{date.plain}</Badge> : null}
            {status?.plain ? (
              <Badge tone={statusTone(status.plain)} dot>
                {status.plain.split(/[;(]/)[0].trim()}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>
      {body ? (
        <div className="grid gap-1">
          {BODY.test(body.header) ? null : <span className="text-micro font-semibold text-muted">{body.header}</span>}
          <p className={cn("line-clamp-6 text-body", BODY.test(body.header) ? "text-base" : "text-lead text-strong")}>
            <Rich parts={body.parts} />
          </p>
        </div>
      ) : null}
      {rest.length ? (
        <dl className="mt-auto grid gap-2.5 border-t border-line-soft pt-3">
          {rest.map((c) => (
            <div key={c.header} className="grid gap-0.5">
              <dt className="text-micro font-semibold text-muted">{c.header}</dt>
              <dd className="line-clamp-3 text-small text-body">
                <Rich parts={c.parts} />
              </dd>
            </div>
          ))}
          {status && status.plain.length > 24 ? (
            <div className="grid gap-0.5">
              <dt className="text-micro font-semibold text-muted">Durum</dt>
              <dd className="line-clamp-3 text-small text-body">
                <Rich parts={status.parts} />
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </article>
  );
}

function Archive() {
  const [current, setCurrent] = useState(sections[0]?.id ?? "");
  const section = sections.find((s) => s.id === current) ?? sections[0];
  const total = sections.reduce((n, s) => n + s.cards.length, 0);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-8 sm:py-14">
      <header className="grid max-w-2xl gap-3">
        <p className="text-small font-medium text-muted">dev-starter · Bilgi Tabanı</p>
        <h1 className="text-hero font-semibold">Referans Arşivi</h1>
        <p className="text-lead text-body">
          Ekosisteme bir şey kazandırmış {total} kaynak: incelediğimiz siteler, uyarladığımız depolar, bilerek almadıklarımız. Her kartta ne aldığımız ve
          kararın nerede yazılı olduğu.
        </p>
        <p className="text-small text-muted">
          Kaynak <code className="font-mono text-strong">knowledge/references.md</code>
          {reviewed ? ` · Son gözden geçirme ${reviewed}` : ""}
        </p>
      </header>

      <SegmentedControl
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

      <AnimatePresence mode="wait" initial={false}>
        <m.section
          key={section.id}
          aria-labelledby={`baslik-${section.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: DUR.base, ease: EASE }}
          className="grid gap-4"
        >
          <div className="grid max-w-3xl gap-1.5">
            <h2 id={`baslik-${section.id}`} className="text-heading font-semibold">
              {section.title.replace(/\s*\(`[^`]+`\)/, "")}
            </h2>
            {section.intro ? (
              <p className="line-clamp-3 text-base text-body">
                <Rich parts={inline(section.intro.replace(/\*\*/g, ""))} />
              </p>
            ) : null}
          </div>
          <div className="edge-lit rounded-2xl bg-surface p-3 sm:p-4">
            <Carousel label={SHORT[section.title] ?? section.title} slides={section.cards.map((card) => <ReferenceCard key={card.id} card={card} />)} />
          </div>
        </m.section>
      </AnimatePresence>
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
          "Ekosisteme bir şey kazandırmış her dış kaynak: incelenen siteler, bölüm galerileri, elenenler, skill ve kod kaynakları, teknik belgeler, kendi projelerimiz. Veri `knowledge/references.md`ten derleme anında okunur; arşive eklenen satır buraya kendiliğinden düşer.",
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
    // İlk kategori siteler: Bencho kartı ve bağlantısı.
    await expect(await canvas.findByRole("link", { name: /bencho\.dev/ })).toHaveAttribute("href", "https://bencho.dev/");
    // Kategori değişince ray yenilenir.
    await userEvent.click(canvas.getByRole("radio", { name: /Galeriler/ }));
    await expect(await canvas.findByRole("link", { name: /navbar\.gallery/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("radio", { name: /Elenenler/ }));
    await expect(await canvas.findByText(/scrolltide\.co/)).toBeVisible();
  },
};
