import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RotateCcw } from "lucide-react";
import { m, useReducedMotion, type Transition } from "motion/react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { DUR, EASE, SPRING, STAGGER } from "@/lib/motion";
import { expect, userEvent, within } from "storybook/test";
import { DocPage, Note, PageHero, Section, Token } from "./_lib/doc";

/* Değerler lib/motion.ts'ten (EASE, DUR, SPRING, STAGGER); CSS karşılığı
   globals.css `--ease-brand`. Eğri ve yay çizimleri bu sayılardan hesaplanır. */

/* --- Matematik ------------------------------------------------------------ */

const [X1, Y1, X2, Y2] = EASE;

function bez(u: number, p1: number, p2: number) {
  const v = 1 - u;
  return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
}

/** Zamanın t kesrinde ilerleme (cubic-bezier, ikiye bölmeyle). */
function ease(t: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, X1, X2) < t) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, Y1, Y2);
}

/** Yayın birim adım yanıtı (yarı örtük Euler). */
function springCurve({ stiffness, damping, mass = 1 }: { stiffness: number; damping: number; mass?: number }, seconds = 1.2) {
  const dt = 1 / 240;
  let x = 0;
  let v = 0;
  const out: number[] = [];
  for (let t = 0; t <= seconds; t += dt) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    out.push(x);
  }
  return out;
}

/* --- Parçalar -------------------------------------------------------------- */

function Replay({ onClick, label = "Tekrar Oynat" }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      <RotateCcw /> {label}
    </Button>
  );
}

/** Ray: top soldan sağa kayar. `x` yüzdesi öğenin KENDİ genişliğine göre. */
function Rail({ run, transition, tone = "bg-primary", label }: { run: number; transition: Transition; tone?: string; label: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
      <span className="text-small text-muted">{label}</span>
      <div className="relative h-9 overflow-hidden rounded-full bg-overlay shadow-raised">
        <div className="absolute inset-y-0 left-1 w-[calc(100%-2.5rem)]">
          <m.div key={run} className="h-full w-full" initial={{ x: "0%" }} animate={{ x: "100%" }} transition={transition}>
            <span aria-hidden className={`absolute top-1 left-0 size-7 rounded-full shadow-raised ${tone}`} />
          </m.div>
        </div>
      </div>
    </div>
  );
}

function CurvePlot() {
  const S = 200;
  const P = 28;
  const pt = (x: number, y: number) => `${P + x * S} ${P + (1 - y) * S}`;
  const curve = `M ${pt(0, 0)} C ${pt(X1, Y1)} ${pt(X2, Y2)} ${pt(1, 1)}`;
  return (
    <svg viewBox={`0 0 ${S + P * 2} ${S + P * 2}`} role="img" className="w-full max-w-80">
      <title>İmza eğrisi: cubic-bezier(0.22, 1, 0.36, 1). Hızlı başlar, uzun ve yumuşak yavaşlar.</title>
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g} className="stroke-line-soft">
          <line x1={P + g * S} y1={P} x2={P + g * S} y2={P + S} />
          <line x1={P} y1={P + g * S} x2={P + S} y2={P + g * S} />
        </g>
      ))}
      <rect x={P} y={P} width={S} height={S} className="fill-none stroke-line" />
      <path d={`M ${pt(0, 0)} L ${pt(1, 1)}`} className="stroke-line-strong" strokeDasharray="4 4" fill="none" />
      <line x1={P} y1={P + S} x2={P + X1 * S} y2={P + (1 - Y1) * S} className="stroke-muted" strokeWidth={1} />
      <line x1={P + S} y1={P} x2={P + X2 * S} y2={P + (1 - Y2) * S} className="stroke-muted" strokeWidth={1} />
      <path d={curve} className="stroke-primary" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={P + X1 * S} cy={P + (1 - Y1) * S} r={5} className="fill-page stroke-strong" strokeWidth={1.5} />
      <circle cx={P + X2 * S} cy={P + (1 - Y2) * S} r={5} className="fill-page stroke-strong" strokeWidth={1.5} />
      <text x={P + X1 * S} y={P - 10} textAnchor="middle" className="fill-muted font-mono text-[9px]">
        0.22, 1
      </text>
      <text x={P + X2 * S + 6} y={P - 10} textAnchor="start" className="fill-muted font-mono text-[9px]">
        0.36, 1
      </text>
      <text x={P + S / 2} y={P + S + 20} textAnchor="middle" className="fill-muted text-[10px]">
        zaman
      </text>
      <text x={12} y={P + S / 2} textAnchor="middle" transform={`rotate(-90 12 ${P + S / 2})`} className="fill-muted text-[10px]">
        ilerleme
      </text>
    </svg>
  );
}

/** Eşit zaman aralıklarında nesnenin yeri: hareket durduğunda da eğri okunur. */
function Frames() {
  const frames = Array.from({ length: 11 }, (_, i) => ease(i / 10));
  return (
    <div className="relative h-10 rounded-full bg-overlay shadow-raised" aria-hidden>
      <div className="absolute inset-y-0 left-2 right-2">
        {frames.map((p, i) => (
          <span
            key={i}
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${p * 100}%`, opacity: 0.25 + (i / 10) * 0.75 }}
          />
        ))}
      </div>
    </div>
  );
}

function SpringPlot() {
  const W = 300;
  const H = 150;
  const P = 16;
  const lines = [
    { name: "snappy", data: springCurve(SPRING.snappy), cls: "stroke-primary" },
    { name: "soft", data: springCurve(SPRING.soft), cls: "stroke-chart-3" },
  ];
  const max = 1.15;
  const toPath = (d: number[]) =>
    d.map((v, i) => `${i ? "L" : "M"} ${(P + (i / (d.length - 1)) * (W - 2 * P)).toFixed(1)} ${(H - P - (v / max) * (H - 2 * P)).toFixed(1)}`).join(" ");
  const target = H - P - (1 / max) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="w-full">
      <title>Yay yanıtı, 1,2 saniye: snappy hedefe hızlı varır, soft daha geç ve yumuşak oturur.</title>
      <line x1={P} x2={W - P} y1={target} y2={target} className="stroke-line-strong" strokeDasharray="4 4" />
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} className="stroke-line" />
      {lines.map((l) => (
        <path key={l.name} d={toPath(l.data)} className={l.cls} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      ))}
      <text x={W - P} y={target - 6} textAnchor="end" className="fill-muted text-[9px]">
        hedef
      </text>
    </svg>
  );
}

const DURATIONS: { key: keyof typeof DUR; use: string }[] = [
  { key: "fast", use: "Üzerine gelme, basma, renk" },
  { key: "base", use: "Açılır menü, sekme, anahtar" },
  { key: "slow", use: "Giriş, kart, Reveal" },
  { key: "page", use: "Sayfa geçişi, tema" },
];

const STAGGER_ITEMS = ["Gelir", "Gider", "Kâr", "Nakit", "Alacak", "Stok"];

function HareketSayfasi() {
  const reduce = useReducedMotion();
  const [curveRun, setCurveRun] = useState(0);
  const [durRun, setDurRun] = useState(0);
  const [springRun, setSpringRun] = useState(0);
  const [staggerRun, setStaggerRun] = useState(0);
  const ms = (s: number) => `${Math.round(s * 1000)} ms`;

  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Hareket"
        title="Tek eğri, dört süre, iki yay."
        lead="Hareket bir şeyin nereden gelip nereye gittiğini anlatır, süs değildir. Her geçiş aynı imza eğrisini kullanır: hızlı başlar, uzun ve sakin yavaşlar."
      >
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge tone={reduce ? "warning" : "success"} dot>
            {reduce ? "Hareket azaltılmış: dönüşümler kapalı" : "Hareket tam"}
          </Badge>
          <span className="text-small text-muted">İşletim sisteminin tercihi, canlı okunur.</span>
        </div>
      </PageHero>

      <Section
        id="egri"
        title="İmza Eğrisi"
        description={
          <>
            <Token>cubic-bezier(0.22, 1, 0.36, 1)</Token> · JS'te <Token>EASE</Token>, CSS'te <Token>--ease-brand</Token>. Her{" "}
            <Token>transition-*</Token> sınıfı onu kendiliğinden alır.
          </>
        }
        aside={<Replay onClick={() => setCurveRun((n) => n + 1)} />}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="grid place-items-center rounded-2xl bg-surface p-6">
            <CurvePlot />
          </div>
          <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 sm:p-6">
            <div className="space-y-3">
              <Rail run={curveRun} label="İmza" transition={{ duration: 1.2, ease: EASE }} />
              <Rail run={curveRun} label="Doğrusal" tone="bg-muted" transition={{ duration: 1.2, ease: "linear" }} />
            </div>
            <div>
              <p className="mb-2 text-small font-medium text-strong">Eşit zaman aralığında konum</p>
              <Frames />
              <Note className="mt-2">
                On bir kare, her biri sürenin onda biri. İlk üç kare yolun yarısından fazlasını alır; kalanı varışı yumuşatır.
              </Note>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="sure"
        title="Süre Ölçeği"
        description={
          <>
            <Token>DUR</Token>: küçük ve sık olan kısa, büyük ve seyrek olan uzun. 600 ms üstü bekletir.
          </>
        }
        aside={<Replay onClick={() => setDurRun((n) => n + 1)} />}
      >
        <ul className="space-y-2 rounded-2xl bg-surface p-2">
          {DURATIONS.map(({ key, use }) => (
            <li key={key} className="grid gap-3 rounded-xl bg-overlay p-4 shadow-raised md:grid-cols-[12rem_1fr] md:items-center">
              <div>
                <p className="flex items-baseline gap-2">
                  <Token>DUR.{key}</Token>
                  <span className="text-title font-semibold text-strong tabular-nums">{ms(DUR[key])}</span>
                </p>
                <p className="mt-1 text-small text-muted">{use}</p>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 rounded-full bg-chart-track" aria-hidden>
                  <div className="h-full rounded-full bg-primary-soft" style={{ width: `${(DUR[key] / DUR.page) * 100}%` }} />
                </div>
                <div className="relative h-7 overflow-hidden" aria-hidden>
                  <div className="absolute inset-y-0 left-0 w-[calc(100%-1.75rem)]">
                    <m.div key={durRun} className="h-full w-full" initial={{ x: "0%" }} animate={{ x: "100%" }} transition={{ duration: DUR[key], ease: EASE }}>
                      <span className="absolute top-0 left-0 size-7 rounded-lg bg-primary shadow-raised" />
                    </m.div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="yay"
        title="Yaylar"
        description="Doğrudan elle sürülen şey (sürükleme, anahtar, seçim karosu) süreyle değil yayla hareket eder: kesilirse kaldığı hızdan devam eder."
        aside={<Replay onClick={() => setSpringRun((n) => n + 1)} />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-surface p-5 sm:p-6">
            <SpringPlot />
            <div className="mt-3 flex flex-wrap gap-4 text-small">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-5 rounded-full bg-primary" /> <Token>SPRING.snappy</Token>
                <span className="text-muted">500 / 40</span>
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-5 rounded-full bg-chart-3" /> <Token>SPRING.soft</Token>
                <span className="text-muted">120 / 22 · kütle 0,8</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-2xl bg-surface p-5 sm:p-6">
            <Rail run={springRun} label="snappy" transition={SPRING.snappy} />
            <Rail run={springRun} label="soft" tone="bg-chart-3" transition={SPRING.soft} />
            <Note>snappy: seçim göstergesi, anahtar, basma. soft: kart, büyük yüzey, mıknatıs.</Note>
          </div>
        </div>
      </Section>

      <Section
        id="stagger"
        title="Sıralı Giriş"
        description={
          <>
            <Token>STAGGER</Token> = {ms(STAGGER)}. Liste öğeleri tek tek değil dalga halinde gelir; altı öğeden sonrası beklenmez, birlikte girer.
          </>
        }
        aside={<Replay onClick={() => setStaggerRun((n) => n + 1)} />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <m.ul
            key={staggerRun}
            className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER } } }}
          >
            {STAGGER_ITEMS.map((label, i) => (
              <m.li
                key={label}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } } }}
                className="rounded-xl bg-overlay p-3 shadow-raised"
              >
                <p className="text-small text-muted">{label}</p>
                <p className="mt-1 text-title font-semibold text-strong tabular-nums">{[48, 31, 17, 22, 9, 64][i]}</p>
              </m.li>
            ))}
          </m.ul>
          <div className="rounded-2xl bg-surface p-5" aria-hidden>
            <p className="mb-3 text-small font-medium text-strong">Zaman çizelgesi</p>
            <div className="space-y-1.5">
              {STAGGER_ITEMS.map((label, i) => {
                const total = STAGGER * 5 + DUR.slow;
                return (
                  <div key={label} className="relative h-5 rounded-full bg-chart-track">
                    <div
                      className="absolute inset-y-0 rounded-full bg-primary-soft"
                      style={{ left: `${((i * STAGGER) / total) * 100}%`, width: `${(DUR.slow / total) * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-micro text-muted">
              <span>0</span>
              <span>{ms(STAGGER * 5 + DUR.slow)}</span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="azalt"
        title="Hareketi Azalt"
        description="Kullanıcı işletim sisteminde hareketi azalttıysa ekran yine çalışır, yalnızca yer değiştirme durur."
      >
        <ul className="grid gap-2 rounded-2xl bg-surface p-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Motion", d: "MotionConfig reducedMotion=\"user\": dönüşüm ve düzen animasyonu kapanır, opaklık kalır." },
            { t: "CSS", d: "Bütün animasyon ve geçiş süreleri 0,01 ms'ye iner; döngüler bir kez." },
            { t: "Kaydırma", d: ".scroll-reveal kapanır; öğe baştan görünür durur." },
            { t: "Tuzak", d: "initial={false} yazma: sunucu HTML'i opacity 0 gelir, içerik hiç görünmez." },
          ].map((item) => (
            <li key={item.t} className="rounded-xl bg-overlay p-4 shadow-raised">
              <p className="text-base font-semibold text-strong">{item.t}</p>
              <p className="mt-1.5 text-small text-body">{item.d}</p>
            </li>
          ))}
        </ul>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Hareket",
  component: HareketSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "İmza eğrisi çizimi ve kayan nesne, süre ölçeği, snappy/soft yaylar, sıralı giriş ve hareketi azaltınca ne olduğu. Değerler lib/motion.ts.",
      },
    },
  },
} satisfies Meta<typeof HareketSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hareket: Story = {
  name: "Hareket",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button", { name: /Tekrar Oynat/ });
    await expect(buttons).toHaveLength(4);
    await userEvent.click(buttons[0]);
    await expect(canvas.getByRole("img", { name: /İmza eğrisi/ })).toBeInTheDocument();
  },
};
