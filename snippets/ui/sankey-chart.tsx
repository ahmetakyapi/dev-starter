"use client";

import { m, useInView, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";

/**
 * Sankey (akış) grafiği: soldaki kaynaklardan sağdaki hedeflere akan
 * miktar; bant kalınlığı değerle orantılı. "Ziyaretçi nereden geldi, nereye
 * vardı" (Arama → Kayıt), bütçe dağılımı gibi İKİ KATMANLI dağılımlar için.
 * Üç ve üstü katman bu bileşenin işi değil (düzen tek sütun çifti).
 *
 * RENK KAYNAKTAN GELİR: her bant kaynağının `--chart-*` renginde, yarı
 * saydam (`fill-chart-N/35`); hedef düğümler nötr. Göz bandı geriye doğru
 * izleyip "bu kayıtların çoğu aramadan" diye okur. Hedef etiketinde pay:
 * "Kayıt · %22" (toplama göre).
 *
 * YALITIM: bir düğümün ya da bandın üstüne gelince yalnızca ona bağlı
 * akışlar kalır, gerisi geri çekilir; alttaki satır seçili akışı sayıyla
 * yazar. Dokunmatikte etikete DOKUNMAK yalıtımı sabitler (`aria-pressed`),
 * ikinci dokunuş bırakır: fareyle gezinmenin dokunmatik karşılığı.
 *
 * DÜZEN SAF BİR FONKSİYONDA (`sankeyLayout`): bileşenden bağımsız test
 * edilir. Ölçek iki yanın SIĞDIĞI en küçük oran; bantlar kaynakta hedef
 * sırasına, hedefte kaynak sırasına dizilir, böylece kesişme en aza iner.
 *
 * ÇİZİM: bantlar esneyen bir SVG'de (`preserveAspectRatio="none"`, yalnızca
 * dolgu var, çizgi yok, esneme bozmaz); düğüm çubukları ve etiketler HTML,
 * yüzde konumla aynı yere oturur. Telefonda etiket sütunları daralır, ad
 * kısalırsa `truncate`; ad 10-12 harfi geçmesin.
 *
 * Hareket: ekrana girince bantlar soldan sağa AKAR (kırpma dikdörtgeni
 * `scaleX`), düğümler belirir. Hareketi azaltan kullanıcıda süre 0.
 * Erişilebilirlik: her akış `sr-only` tabloda; etiketler düğme, odakla da
 * yalıtır; seçili akışın satırı canlı bölge.
 */

type SourceNode = { id: string; label: string; series: Series };
type TargetNode = { id: string; label: string };
type Link = { source: string; target: string; value: number };

type Rect = { y0: number; y1: number; value: number };

const FILL = ["fill-chart-1/40", "fill-chart-2/40", "fill-chart-3/40", "fill-chart-4/40", "fill-chart-5/40", "fill-chart-6/40"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const W = 400;
const H = 300;

/**
 * İki sütunlu sankey düzeni. Birimler soyut (`height` yükseklik, `gap`
 * düğüm arası); sonuç y koordinatları ve bant yolları. Saf; test edilebilir.
 */
export function sankeyLayout(
  input: { sources: readonly { id: string }[]; targets: readonly { id: string }[]; links: readonly Link[] },
  { width = W, height = H, gap = 14 }: { width?: number; height?: number; gap?: number } = {},
) {
  const { sources, targets } = input;
  const links = input.links.filter((l) => l.value > 0);
  const total = links.reduce((a, l) => a + l.value, 0) || 1;
  const sum = (key: "source" | "target", id: string) => links.filter((l) => l[key] === id).reduce((a, l) => a + l.value, 0);
  const scale = Math.min((height - gap * (sources.length - 1)) / total, (height - gap * (targets.length - 1)) / total);

  const column = (nodes: readonly { id: string }[], key: "source" | "target") => {
    const values = nodes.map((n) => sum(key, n.id));
    const extent = values.reduce((a, v) => a + v * scale, 0) + gap * (nodes.length - 1);
    let y = (height - extent) / 2;
    return values.map((value) => {
      const rect: Rect = { y0: y, y1: y + value * scale, value };
      y = rect.y1 + gap;
      return rect;
    });
  };
  const sourceRects = column(sources, "source");
  const targetRects = column(targets, "target");

  const sIndex = new Map(sources.map((s, i) => [s.id, i]));
  const tIndex = new Map(targets.map((t, i) => [t.id, i]));
  const sCursor = sourceRects.map((r) => r.y0);
  const tCursor = targetRects.map((r) => r.y0);

  // Kaynak tarafında hedef sırasıyla, hedef tarafında kaynak sırasıyla diz.
  const bySource = [...links].sort((a, b) => sIndex.get(a.source)! - sIndex.get(b.source)! || tIndex.get(a.target)! - tIndex.get(b.target)!);
  const yAtSource = new Map<Link, number>();
  for (const l of bySource) {
    const i = sIndex.get(l.source)!;
    yAtSource.set(l, sCursor[i]);
    sCursor[i] += l.value * scale;
  }
  const byTarget = [...links].sort((a, b) => tIndex.get(a.target)! - tIndex.get(b.target)! || sIndex.get(a.source)! - sIndex.get(b.source)!);
  const yAtTarget = new Map<Link, number>();
  for (const l of byTarget) {
    const i = tIndex.get(l.target)!;
    yAtTarget.set(l, tCursor[i]);
    tCursor[i] += l.value * scale;
  }

  const f = (v: number) => Math.round(v * 100) / 100;
  const mid = width / 2;
  const bands = links.map((l) => {
    const s0 = yAtSource.get(l)!;
    const t0 = yAtTarget.get(l)!;
    const h = l.value * scale;
    const d = `M0,${f(s0)}C${mid},${f(s0)},${mid},${f(t0)},${width},${f(t0)}L${width},${f(t0 + h)}C${mid},${f(t0 + h)},${mid},${f(s0 + h)},0,${f(s0 + h)}Z`;
    return { ...l, d, source: l.source, target: l.target };
  });

  return { sources: sourceRects, targets: targetRects, bands, total };
}

type Focus = { kind: "source" | "target"; id: string } | { kind: "link"; index: number } | null;

const number = new Intl.NumberFormat("tr-TR");
const pct = (v: number, total: number) => `%${Math.round((v / total) * 100)}`;

export function SankeyChart({
  sources,
  targets,
  links,
  title,
  unit = "kişi",
  height = "h-72",
  className,
}: {
  sources: readonly SourceNode[];
  targets: readonly TargetNode[];
  links: readonly Link[];
  /** Grafiğin ve tablonun adı: "Kaynağa Göre Dönüşüm". */
  title: string;
  /** Alt satırda değerin ardına: "kişi", "₺". */
  unit?: string;
  /** Çizim yüksekliği: Tailwind sınıfı. */
  height?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  // Gözlemci kapta: `<defs>` içindeki kırpma dikdörtgeni boyutsuz, onu gözlemlemek güvenilmez.
  const frame = useRef<HTMLElement>(null);
  // Hareket azaltmada görünür olmayı BEKLEME: son hal hemen çizilir. Yoksa
  // ekran dışındaki grafik baskıda, tam sayfa görüntüde ve kaydırmadan önce boş kalır.
  const seen = useInView(frame, { once: true, amount: 0.3 }) || reduce === true;
  const clip = `sankey-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const layout = sankeyLayout({ sources, targets, links });
  const [hover, setHover] = useState<Focus>(null);
  const [pinned, setPinned] = useState<Focus>(null);
  const focus = hover ?? pinned;

  const tone = new Map(sources.map((s) => [s.id, s.series]));
  const label = new Map([...sources, ...targets].map((n) => [n.id, n.label]));

  const linkOn = (b: (typeof layout.bands)[number], i: number) =>
    !focus ||
    (focus.kind === "link" ? focus.index === i : focus.kind === "source" ? b.source === focus.id : b.target === focus.id);
  const nodeOn = (kind: "source" | "target", id: string) =>
    !focus ||
    (focus.kind === kind && focus.id === id) ||
    layout.bands.some((b, i) => linkOn(b, i) && b[kind] === id && (focus.kind !== kind || focus.id === id));

  let caption = `Toplam ${number.format(layout.total)} ${unit}`;
  if (focus?.kind === "link") {
    const b = layout.bands[focus.index];
    caption = `${label.get(b.source)} → ${label.get(b.target)} · ${number.format(b.value)} ${unit} · ${pct(b.value, layout.total)}`;
  } else if (focus) {
    const rects = focus.kind === "source" ? layout.sources : layout.targets;
    const list = focus.kind === "source" ? sources : targets;
    const r = rects[list.findIndex((n) => n.id === focus.id)];
    if (r) caption = `${label.get(focus.id)} · ${number.format(r.value)} ${unit} · ${pct(r.value, layout.total)}`;
  }

  const key = (f: Focus) => (!f ? "" : f.kind === "link" ? `link:${f.index}` : `${f.kind}:${f.id}`);
  const toggle = (next: Focus) => setPinned((p) => (key(p) === key(next) ? null : next));
  const isPinned = (kind: "source" | "target", id: string) => pinned?.kind === kind && pinned.id === id;

  const nodeBar = (r: Rect, i: number, side: "source" | "target", id: string, series?: Series) => (
    <m.span
      key={id}
      className={cn(
        "absolute w-2 rounded-full transition-opacity duration-200",
        side === "source" ? "right-0" : "left-0",
        series ? SERIES_BG[series - 1] : "bg-line-strong",
        !nodeOn(side, id) && "opacity-25",
      )}
      style={{ top: `${(r.y0 / H) * 100}%`, height: `${Math.max(((r.y1 - r.y0) / H) * 100, 0.8)}%`, originY: 0.5 }}
      initial={{ scaleY: 0 }}
      animate={seen ? { scaleY: 1 } : undefined}
      transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : (side === "source" ? 0 : 0.7) + i * 0.05, ease: EASE }}
    />
  );

  const nodeLabel = (r: Rect, side: "source" | "target", node: { id: string; label: string }) => (
    <button
      key={node.id}
      type="button"
      aria-pressed={isPinned(side, node.id)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover({ kind: side, id: node.id })}
      onPointerLeave={() => setHover(null)}
      onFocus={() => setHover({ kind: side, id: node.id })}
      onBlur={() => setHover(null)}
      onClick={() => toggle({ kind: side, id: node.id })}
      className={cn(
        "absolute flex min-h-11 w-full -translate-y-1/2 flex-col justify-center rounded-sm transition-opacity duration-200 pointer-fine:min-h-8",
        side === "source" ? "right-0 items-end pr-4 text-right" : "left-0 items-start pl-4 text-left",
        !nodeOn(side, node.id) && "opacity-40",
      )}
      style={{ top: `${(((r.y0 + r.y1) / 2) / H) * 100}%` }}
    >
      {side === "target" ? (
        <span className="text-small leading-tight">
          <span className="font-medium text-strong">{node.label}</span>
          {/* Dar sütunda pay alt satıra iner; ayraç yalnızca aynı satırdayken */}
          <span className="block text-muted tabular-nums sm:inline">
            <span className="hidden sm:inline"> · </span>
            {pct(r.value, layout.total)}
          </span>
        </span>
      ) : (
        <>
          <span className="max-w-full truncate text-small font-medium text-strong">{node.label}</span>
          <span className="text-micro text-muted tabular-nums">{number.format(r.value)}</span>
        </>
      )}
    </button>
  );

  return (
    <figure ref={frame} className={cn("w-full", className)}>
      <div className="sr-only">
        {/* sr-only kap DIŞTA: <table> width: 1px'i yok sayar, uzun etiketle sayfayı yana taşırır. */}
        <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Kaynak</th>
            <th scope="col">Hedef</th>
            <th scope="col">Değer</th>
          </tr>
        </thead>
        <tbody>
          {layout.bands.map((b, i) => (
            <tr key={i}>
              <th scope="row">{label.get(b.source)}</th>
              <td>{label.get(b.target)}</td>
              <td>
                {number.format(b.value)} {unit} ({pct(b.value, layout.total)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className={cn("flex", height)}>
        <div className="relative w-22 shrink-0 sm:w-32">
          {layout.sources.map((r, i) => nodeBar(r, i, "source", sources[i].id, sources[i].series))}
          {layout.sources.map((r, i) => nodeLabel(r, "source", sources[i]))}
        </div>

        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mx-1 block h-full min-w-0 flex-1">
          <defs>
            <clipPath id={clip}>
              <m.rect
                x={0}
                y={0}
                width={W}
                height={H}
                style={{ originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={seen ? { scaleX: 1 } : undefined}
                transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.2, ease: EASE }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            {layout.bands.map((b, i) => (
              <path
                key={i}
                d={b.d}
                onPointerEnter={() => setHover({ kind: "link", index: i })}
                onPointerLeave={() => setHover(null)}
                onPointerUp={(e) => e.pointerType !== "mouse" && toggle({ kind: "link", index: i })}
                className={cn(
                  FILL[(tone.get(b.source) ?? 1) - 1],
                  "cursor-default transition-opacity duration-200",
                  !linkOn(b, i) && "opacity-15",
                )}
              />
            ))}
          </g>
        </svg>

        <div className="relative w-22 shrink-0 sm:w-32">
          {layout.targets.map((r, i) => nodeBar(r, i, "target", targets[i].id))}
          {layout.targets.map((r, i) => nodeLabel(r, "target", targets[i]))}
        </div>
      </div>

      <p aria-live="polite" className="mt-4 min-h-5 text-center text-small text-muted tabular-nums">
        {caption}
      </p>
    </figure>
  );
}
