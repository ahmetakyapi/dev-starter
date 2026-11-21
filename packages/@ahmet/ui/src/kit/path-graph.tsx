// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Kritik yol grafiği: işler aşama aşama (sütun) dizilir, her iş kendinden
 * ÖNCEKİ işlere bağlanır; teslim tarihini belirleyen zincir (kritik yol)
 * kalın ve `danger` tonunda, boşluğu olan bağlantılar ince gridir. "Bu iş
 * kayarsa çıkış tarihi kayar mı?" sorusunu tablodan değil şekilden okutur.
 *
 * NE ZAMAN: bağımlılığı olan 6–15 iş ve bir teslim tarihi (lansman, sürüm,
 * kapanış). Bağımlılığı olmayan iş listesi `task-list`/`kanban-board`;
 * tarih ekseni gerekiyorsa `week-calendar`. 20 işten fazlası okunmaz:
 * bölüp özetle.
 *
 * DÜZEN SABİT: sütun ve satır ölçüleri sabit piksel (`COL`, `ROW`), bağlantı
 * yolları bu ölçülerden HESAPLANIR; ölçüm, `ResizeObserver` ya da istemci
 * kodu yok, sunucuda ve tarayıcıda aynı çizilir (hidrasyon uyuşmazlığı olmaz).
 * Telefonda tuval yatay kayar: kaydırma bölgesi klavyeyle odaklanır (oklar,
 * halka içeride) ve kaydırılabilecek yönde kenar solar (CSS kaydırma
 * zaman çizelgesi; destek yoksa ipucu da yok, içerik yine kayar).
 * İş kimlikleri BENZERSİZ olmalı (yineleneni ilki kazanır, öbürü çizilmez);
 * bilinmeyen bir `after` kimliği sessizce atlanır.
 *
 * ERİŞİLEBİLİRLİK: çizim `aria-hidden`; aynı bilgi `sr-only` sıralı listede:
 * her iş "Ad, bilgi, kritik yolda, engelli, şunlardan sonra: …" diye okunur.
 * Kritik ve engelli durumu rengin yanında düğümde METİN rozetiyle de
 * yazılır ("Kritik", "Engelli"). Renk tek işaret değil. `title`/`meta`
 * düğüm olabilir (`ReactNode`); bu durumda ekran okuyucu metni için `sr`
 * ver ("Ödeme servisi, 2 gün"), yoksa düğümün metni okunmaz.
 *
 * Veri örneği ÖRNEK'tir; kişi/marka yok. `start` ("Bugün") ve `goal`
 * (çıkış) isteğe bağlıdır; `after` boş olan iş `start`a, `goal.after`
 * listesindeki işler hedefe bağlanır.
 *
 *   <PathGraph
 *     label="Sürüm Yolu"
 *     start={{ title: "Bugün", meta: "20 Kas" }}
 *     columns={[{ id: "yap", label: "Yap", nodes: [{ id: "a", title: "Ödeme servisi", meta: "2g · 25 Kas", critical: true, after: [] }] }]}
 *     goal={{ title: "Çıkış", meta: "8 Ara", after: ["a"] }}
 *   />
 */

export type PathNode = {
  id: string;
  title: ReactNode;
  /** Alt satır: "2g · 23 Kas". */
  meta?: ReactNode;
  /** Ekran okuyucu için düz metin: "Ödeme servisi, 2 gün". `title`/`meta` düğümse şart. */
  sr?: string;
  /** Düğümün solunda küçük slot (avatar, ikon). Süs ise `aria-hidden` çağıranda. */
  leading?: ReactNode;
  /** Teslim tarihini belirleyen zincirde. */
  critical?: boolean;
  /** Dışarıdaki bir şey bekliyor. */
  blocked?: boolean;
  /** Önceki işlerin kimlikleri; boş ise başlangıca bağlanır. */
  after: readonly string[];
};

export type PathColumn = { id: string; label: ReactNode; nodes: readonly PathNode[] };

export type PathEnd = { title: ReactNode; meta?: ReactNode; note?: ReactNode; sr?: string; after?: readonly string[] };

/** Düz metne çevrilebilen (dizgi ya da sayı) içerik; düğüm ise boş döner. */
const plain = (x: ReactNode): string => (typeof x === "string" || typeof x === "number" ? String(x) : "");
/** "Ad, bilgi" biçimi: boş parçalar virgül bırakmaz. */
const say = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(", ");

type PathGraphProps = {
  /** Grafiğin adı (kaydırma bölgesi ve liste için). */
  label: string;
  columns: readonly PathColumn[];
  start?: PathEnd;
  goal?: PathEnd & { after: readonly string[] };
  /** Lejantı gizle (kart başlığında zaten anlatılıyorsa). */
  hideLegend?: boolean;
  className?: string;
};

/*
 * Kenar solması: yalnız kaydırılabilecek yönde (CSS kaydırma zaman çizelgesi).
 * Kaydırma yoksa zaman çizelgesi etkisiz, değişkenler 0, maske tam opak.
 * Desteklemeyen tarayıcıda hiç uygulanmaz.
 */
const SCROLL_FADE_CSS = `
@property --sf-l { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --sf-r { syntax: "<length>"; inherits: false; initial-value: 0px; }
@keyframes ui-sf { 0% { --sf-l: 0px; --sf-r: 2rem; } 6% { --sf-l: 2rem; } 94% { --sf-r: 2rem; } 100% { --sf-l: 2rem; --sf-r: 0px; } }
@supports (animation-timeline: scroll()) {
  .ui-scroll-fade {
    -webkit-mask-image: linear-gradient(to right, transparent, black var(--sf-l), black calc(100% - var(--sf-r)), transparent);
    mask-image: linear-gradient(to right, transparent, black var(--sf-l), black calc(100% - var(--sf-r)), transparent);
    animation: ui-sf linear both;
    animation-timeline: scroll(self inline);
  }
}`;

const COL = 232; // sütun genişliği
const NODE_W = 172;
const ROW = 72; // satır
const NODE_H = 52;
const HEAD = 40; // aşama başlığı
const PAD = 16;

type Placed = { id: string; x: number; y: number; critical: boolean; node?: PathNode; kind: "start" | "goal" | "node" };

export function PathGraph({ label, columns, start, goal, hideLegend = false, className }: PathGraphProps) {
  const cols: { key: string; label: ReactNode; count?: number; items: Placed[] }[] = [];
  if (start) cols.push({ key: "__start", label: "", items: [] });
  for (const c of columns) cols.push({ key: c.id, label: c.label, count: c.nodes.length, items: [] });
  if (goal) cols.push({ key: "__goal", label: "", items: [] });

  const rows = Math.max(1, ...columns.map((c) => c.nodes.length));
  const bodyH = rows * ROW;
  const width = cols.length * COL;
  const height = HEAD + bodyH + PAD;

  const placed = new Map<string, Placed>();
  const place = (p: Placed, colIndex: number, index: number, count: number) => {
    if (placed.has(p.id)) return; // yinelenen kimlik: ilki kazanır
    const offset = (bodyH - count * ROW) / 2;
    p.x = colIndex * COL + (COL - NODE_W) / 2;
    p.y = HEAD + offset + index * ROW + (ROW - NODE_H) / 2;
    placed.set(p.id, p);
    cols[colIndex].items.push(p);
  };

  const offsetCol = start ? 1 : 0;
  columns.forEach((c, ci) =>
    c.nodes.forEach((n, i) => place({ id: n.id, x: 0, y: 0, critical: !!n.critical, node: n, kind: "node" }, ci + offsetCol, i, c.nodes.length)),
  );
  if (start) place({ id: "__start", x: 0, y: 0, critical: true, kind: "start" }, 0, 0, 1);
  if (goal) place({ id: "__goal", x: 0, y: 0, critical: true, kind: "goal" }, cols.length - 1, 0, 1);

  type Edge = { from: Placed; to: Placed; critical: boolean };
  const edges: Edge[] = [];
  const link = (toId: string, fromIds: readonly string[]) => {
    const to = placed.get(toId);
    if (!to) return;
    const sources = fromIds.length === 0 && start ? ["__start"] : fromIds;
    for (const id of sources) {
      const from = placed.get(id);
      if (from) edges.push({ from, to, critical: from.critical && to.critical });
    }
  };
  columns.forEach((c) => c.nodes.forEach((n) => link(n.id, n.after)));
  if (goal) link("__goal", goal.after);
  edges.sort((a, b) => Number(a.critical) - Number(b.critical));

  const path = ({ from, to }: Edge) => {
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    return `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
  };

  const nameOf = (id: string): string => {
    if (id === "__start") return "Başlangıç";
    const node = placed.get(id)?.node;
    return node?.sr || plain(node?.title) || "bir iş";
  };

  return (
    <figure className={cn("w-full", className)}>
      {hideLegend ? null : (
        <div aria-hidden className="mb-3 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-micro text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-danger" /> Kritik yol
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-5 bg-line-strong" /> Boşluğu var
          </span>
          <span className="flex items-center gap-1.5">
            <span className="path-graph-hatch size-3 rounded-[2px] border border-warning" /> Engelli
          </span>
        </div>
      )}

      <div
        role="region"
        aria-label={`${label}, yatay kaydırılır`}
        tabIndex={0}
        className="ui-scroll-fade overflow-x-auto rounded-lg focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-none focus-visible:ring-inset"
      >
        <div aria-hidden className="relative" style={{ width, height, minWidth: width }}>
          {cols.map((c, i) => (
            <div
              key={c.key}
              className={cn("absolute top-0 bottom-0", i > 0 && "border-l border-dashed border-line")}
              style={{ left: i * COL, width: COL }}
            >
              {c.label ? (
                <p className="flex items-center justify-center gap-1.5 pt-2 text-micro font-medium tracking-wide text-muted">
                  {c.label}
                  {c.count !== undefined ? (
                    <span className="rounded-sm bg-surface px-1 tabular-nums">{c.count}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          ))}

          <svg width={width} height={height} className="absolute inset-0" fill="none">
            {edges.map((e, i) => (
              <path
                key={i}
                d={path(e)}
                className={e.critical ? "stroke-danger" : "stroke-line-strong"}
                strokeWidth={e.critical ? 2 : 1}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {[...placed.values()].map((p) => {
            const n = p.node;
            const isGoal = p.kind === "goal";
            const isStart = p.kind === "start";
            const content = isStart ? start! : isGoal ? goal! : null;
            return (
              <div
                key={p.id}
                className={cn(
                  "absolute flex items-center gap-2 rounded-lg border bg-overlay px-2.5 shadow-raised",
                  p.critical && !isStart ? "border-danger" : "border-line",
                  n?.blocked && "path-graph-hatch border-warning",
                  isGoal && "bg-danger-wash",
                  isStart && "bg-surface shadow-none",
                )}
                style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
              >
                {n?.leading ? <span className="shrink-0">{n.leading}</span> : null}
                {n?.critical || n?.blocked ? (
                  <span
                    className={cn(
                      "absolute -top-2 right-2 rounded-sm px-1 text-micro leading-4 font-medium",
                      n.blocked ? "bg-warning-wash text-warning" : "bg-danger-wash text-danger",
                    )}
                  >
                    {n.blocked ? "Engelli" : "Kritik"}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium text-strong">{content ? content.title : n?.title}</span>
                  <span className="block truncate font-mono text-micro text-muted">{content ? content.meta : n?.meta}</span>
                </span>
              </div>
            );
          })}
          {start?.note ? (
            <p
              className="absolute rounded-sm bg-danger-wash px-1.5 py-0.5 font-mono text-micro text-danger"
              style={{ left: placed.get("__start")!.x, top: placed.get("__start")!.y + NODE_H + 6 }}
            >
              {start.note}
            </p>
          ) : null}
        </div>
      </div>

      {/* Asıl içerik: sıralı liste. Kritik ve engelli durum metinle. */}
      <ol role="list" className="sr-only" aria-label={label}>
        {start ? (
          <li>Başlangıç: {start.sr ?? say(plain(start.title), plain(start.meta), plain(start.note))}.</li>
        ) : null}
        {columns.map((c) => (
          <li key={c.id}>
            {c.label}:
            <ul role="list">
              {c.nodes.map((n) => (
                <li key={n.id}>
                  {say(n.sr ?? say(plain(n.title), plain(n.meta)), n.critical ? "kritik yolda" : "boşluğu var", n.blocked ? "engelli" : undefined)}.{" "}
                  {n.after.length ? `Şunlardan sonra: ${n.after.map(nameOf).join(", ")}.` : "Başlangıçtan sonra."}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {goal ? (
          <li>
            Hedef: {goal.sr ?? say(plain(goal.title), plain(goal.meta), plain(goal.note))}. Şunlardan sonra: {goal.after.map(nameOf).join(", ")}.
          </li>
        ) : null}
      </ol>

      <style href="ui-scroll-fade" precedence="default">{SCROLL_FADE_CSS}</style>
      <style href="ui-path-graph" precedence="default">{`
        .path-graph-hatch{background-image:repeating-linear-gradient(135deg,var(--warning-wash) 0 4px,transparent 4px 8px)}
        .path-graph-hatch.border-warning{background-color:var(--overlay)}
      `}</style>
    </figure>
  );
}
