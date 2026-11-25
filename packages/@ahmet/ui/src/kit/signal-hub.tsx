// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Sinyal göbeği: ortada ürünün işareti, ondan aşağı dirsekli çizgilerle
 * bağlanan 2-3 çalışma kartı (ajan, proje, servis), çevresinde süzülen
 * "yapıldı" çipleri. Yapay zeka ürününün "arka planda ne yapıyor" sorusunu
 * tek bakışta yanıtlar: kim çalışıyor, ne kadar ilerledi, ne bitti.
 *
 * Referans turu 25 Kasım 2026: Veridical (ortada logo karosu, altta
 * "Project Phoenix · Active" kartları, çevrede "Created 2 research
 * summaries" çipleri), Xenora (akış düğümleri arası "Success" çizgileri).
 * Yalnız yapı.
 *
 * `nodes`: 2-3 kart. Her kartta ad, durum metni, ilerleme (0-1, parçalı
 * çubuk) ve alt satır. `done`: bitmiş işler (en çok dört), geniş ekranda
 * iki yanda süzülür, telefonda kartların altında liste olur.
 * Çizgiler görünüme girince bir kez çizilir (`pathLength`); hareketi
 * azaltan kullanıcıda baştan çizili, çipler durağan.
 *
 * ERİŞİLEBİLİRLİK: çizgiler ve göbek süs (`aria-hidden`); kartlar `ul`,
 * ilerleme metinle de söylenir ("4 adımın 1'i"). Bitmiş işler ayrı liste
 * ("Tamamlananlar"). Veri ÖRNEK ise çağıran öyle etiketler.
 */

export interface SignalNode {
  id: string;
  name: string;
  status: string;
  /** 0-1 arası. */
  progress: number;
  /** Parça sayısı (çubuk kaç dilim). */
  segments?: number;
  detail: string;
  icon?: ReactNode;
}

export interface SignalHubProps {
  mark: ReactNode;
  nodes: SignalNode[];
  done?: string[];
  label: string;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function Bar({ value, segments = 4 }: { value: number; segments?: number }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn("h-1 flex-1 rounded-full", i < filled ? "bg-strong" : "bg-line-strong")} />
      ))}
    </span>
  );
}

export function SignalHub({ mark, nodes, done = [], label, className }: SignalHubProps) {
  const reduce = useReducedMotion();
  const n = Math.min(3, nodes.length);
  const cx = (i: number) => ((i + 0.5) / n) * 100;
  const draw = (i: number) =>
    reduce
      ? {}
      : { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true, amount: 0.6 }, transition: { duration: 0.9, ease: EASE, delay: 0.15 + i * 0.12 } };
  const sides = [done.slice(0, Math.ceil(done.length / 2)), done.slice(Math.ceil(done.length / 2))];
  const chip = (text: string, k: string, i: number) => (
    <m.li
      key={k}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.6 + i * 0.1 }}
      className="flex w-max max-w-full items-center gap-2 rounded-full bg-overlay py-1.5 pr-4 pl-1.5 text-read text-strong shadow-raised ring-1 ring-inset ring-line-soft"
    >
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-strong text-page">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {text}
    </m.li>
  );
  return (
    <section aria-label={label} className={cn("relative mx-auto grid w-full max-w-5xl justify-items-center", className)}>
      <span aria-hidden className="grid size-20 place-items-center rounded-2xl bg-overlay text-strong shadow-floating ring-1 ring-inset ring-line-soft [&_svg]:size-9">
        {mark}
      </span>
      <span aria-hidden className="h-10 w-px bg-line-strong sm:hidden" />
      <svg aria-hidden className="hidden h-20 w-full max-w-3xl sm:block" viewBox="0 0 100 40" preserveAspectRatio="none" fill="none">
        {Array.from({ length: n }, (_, i) => {
          const x = cx(i);
          const dir = x < 50 ? -1 : x > 50 ? 1 : 0;
          const d = dir === 0 ? "M50 0 V40" : `M50 0 V18 Q50 20 ${50 + dir * 2} 20 H${x - dir * 2} Q${x} 20 ${x} 22 V40`;
          return <m.path key={i} d={d} className="stroke-line-strong" strokeWidth="1.5" vectorEffect="non-scaling-stroke" {...draw(i)} />;
        })}
      </svg>
      <ul role="list" className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:[grid-template-columns:var(--hub-cols)]" style={{ "--hub-cols": `repeat(${n}, minmax(0, 1fr))` } as CSSProperties}>
        {nodes.slice(0, n).map((node) => {
          const seg = node.segments ?? 4;
          const filled = Math.round(Math.max(0, Math.min(1, node.progress)) * seg);
          return (
            <li key={node.id} className="grid min-w-0 gap-3 rounded-2xl bg-overlay p-4 shadow-raised ring-1 ring-inset ring-line-soft">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-title font-medium text-strong">
                  {node.icon ? <span aria-hidden className="shrink-0 [&_svg]:size-5">{node.icon}</span> : null}
                  <span className="truncate">{node.name}</span>
                </span>
                <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-small text-body">{node.status}</span>
              </div>
              <Bar value={node.progress} segments={seg} />
              <p className="text-small text-muted">
                <span className="sr-only">{`${seg} adımın ${filled}'i. `}</span>
                {node.detail}
              </p>
            </li>
          );
        })}
      </ul>
      {done.length ? (
        <>
          {/* Geniş ekran: iki yanda süzülen çipler. Telefon: kartların altında liste. */}
          <ul role="list" aria-label="Tamamlananlar" className="mt-8 grid justify-items-center gap-3 lg:hidden">
            {done.map((d, i) => chip(d, `m-${i}`, i))}
          </ul>
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            {sides.map((list, s) => (
              <ul key={s} className={cn("absolute top-[18%] grid gap-24", s === 0 ? "left-0 justify-items-start" : "right-0 justify-items-end")}>
                {list.map((d, i) => (
                  <m.li
                    key={d}
                    animate={reduce ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: s * 1.4 + i }}
                    className={cn(i % 2 === 1 && (s === 0 ? "ml-14" : "mr-14"))}
                  >
                    <ul>{chip(d, `w-${s}-${i}`, i + s)}</ul>
                  </m.li>
                ))}
              </ul>
            ))}
          </div>
          <ul role="list" aria-label="Tamamlananlar" className="sr-only max-lg:hidden">
            {done.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
