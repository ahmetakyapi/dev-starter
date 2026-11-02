import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check, CreditCard, MousePointerClick, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { RingChart } from "@/components/ui/ring-chart";
import { StageBars } from "@/components/ui/stage-bars";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import { chart, roles } from "../../../packages/@ahmet/theme/tokens";
import { formatRatio, ratioOn } from "./_lib/color";
import { DocPage, Note, PageHero, Section, ThemeLabel, Token } from "./_lib/doc";
import { ThemeScope, type ThemeName } from "./_lib/scope";

/* Grafik serileri: veri rengi, metin değil. Değerler tokens.ts → chart;
   örnek grafikler gerçek snippet bileşenleri (chart-card, stage-bars…). */

const SERIES = [
  { n: 1, cls: "bg-chart-1", name: "Limon", note: "Ana seri: bu dönem, toplam" },
  { n: 2, cls: "bg-chart-2", name: "Mavi", note: "Karşılaştırma: geçen dönem" },
  { n: 3, cls: "bg-chart-3", name: "Leylak", note: "Üçüncü kategori" },
  { n: 4, cls: "bg-chart-4", name: "Pembe", note: "Dördüncü kategori" },
  { n: 5, cls: "bg-chart-5", name: "Sarı", note: "Beşinci kategori" },
  { n: 6, cls: "bg-chart-6", name: "Nane", note: "Altıncı kategori" },
] as const;

const STROKE_TEXT = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5", "fill-chart-6"] as const;

const STAGES = [
  { label: "Ziyaret", value: 11800, icon: <MousePointerClick /> },
  { label: "Kayıt", value: 7900, icon: <UserPlus /> },
  { label: "Aktif", value: 4310 },
  { label: "Ücretli", value: 1240, icon: <CreditCard /> },
];

const WEEK = [
  { label: "Pzt", value: 42 },
  { label: "Sal", value: 58 },
  { label: "Çar", value: 51 },
  { label: "Per", value: 73 },
  { label: "Cum", value: 66 },
  { label: "Cmt", value: 31 },
  { label: "Paz", value: 24 },
];

function Demo({ theme }: { theme: ThemeName }) {
  const id = `huni-${theme}`;
  return (
    <ThemeScope theme={theme} label={theme === "light" ? "Açık tema" : "Koyu tema"} className="rounded-2xl border border-line p-4 sm:p-5">
      <ThemeLabel theme={theme} />
      <div className="mt-4 space-y-3">
        <ChartCard id={id} label={<>Kayıt Hunisi<span className="sr-only">, {theme === "light" ? "açık" : "koyu"} tema</span></>} value="%10,5" change={2.4} changeLabel="geçen aya göre">
          <StageBars title="Kayıt Hunisi" stages={STAGES} />
        </ChartCard>
        <ChartCard
          id={`tarayici-${theme}`}
          label={<>Tarayıcıya Göre Ziyaret<span className="sr-only">, {theme === "light" ? "açık" : "koyu"} tema</span></>}
          value="9.000"
          change={-1.8}
          footer={
            <ChartLegend
              columns={3}
              className="px-1 pb-1"
              items={[
                { label: "Chrome", value: 4870, series: 1 },
                { label: "Safari", value: 2310, series: 2 },
                { label: "Firefox", value: 1020, series: 3 },
                { label: "Edge", value: 540, series: 4 },
                { label: "Samsung", value: 180, series: 5 },
                { label: "Diğer", value: 80, series: 6 },
              ]}
            />
          }
        >
          <RingChart
            title="Tarayıcıya Göre Ziyaret"
            className="max-w-44"
            rings={[
              { label: "Chrome", value: 4870, series: 1 },
              { label: "Safari", value: 2310, series: 2 },
              { label: "Firefox", value: 1020, series: 3 },
              { label: "Edge", value: 540, series: 4 },
            ]}
          />
        </ChartCard>
      </div>
    </ThemeScope>
  );
}

function GrafikRenkleriSayfasi() {
  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Grafik Renkleri"
        title="Pastel, Eşit Parlak, Sırası Sabit"
        lead="Altı seri rengi paletten bağımsız: veri her üründe aynı okunur. Birinci seri hep chart-1. Renk değer yazmaz; değeri yanında text-strong yazar."
      />

      <ol className="mt-12 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-2 sm:grid-cols-3 lg:grid-cols-6">
        {SERIES.map((s) => {
          const key = s.n as 1 | 2 | 3 | 4 | 5 | 6;
          return (
            <li key={s.n} className="rounded-xl bg-overlay p-2 shadow-raised">
              <div aria-hidden className={`flex h-24 items-end rounded-lg p-2.5 ${s.cls}`}>
                <span className="font-mono text-heading font-semibold text-chart-ink">{s.n}</span>
              </div>
              <p className="mt-2.5 px-1 text-base font-semibold text-strong">{s.name}</p>
              <p className="px-1">
                <Token className="text-micro">{s.cls}</Token>
              </p>
              <dl className="mt-2 space-y-0.5 px-1 pb-1 font-mono text-micro">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Açık</dt>
                  <dd className="text-strong">{chart.light[key]}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Koyu</dt>
                  <dd className="text-strong">{chart.dark[key]}</dd>
                </div>
              </dl>
              <p className="px-1 pb-1 text-micro text-muted">{s.note}</p>
            </li>
          );
        })}
      </ol>
      <Note className="mt-3">Yalnız chart-2 temaya göre açılır (koyuda #60a5fa); diğerleri iki temada aynı.</Note>

      <Section
        id="ornek"
        title="Gerçek Grafiklerde"
        description="Kart gri kuyu, lejant beyaz karo, iz üstünde hap çubuk. Aynı bileşenler iki temada yan yana."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo theme="light" />
          <Demo theme="dark" />
        </div>
      </Section>

      <Section
        id="iz"
        title="İz ve Mürekkep"
        description="chart-track çubuğun boş kısmı; chart-ink pastel dolgunun üstündeki ikon ve hap metni, iki temada da koyu."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div className="rounded-2xl bg-surface p-5">
            <div className="space-y-3">
              {[
                { cls: "bg-chart-1", w: "w-[82%]" },
                { cls: "bg-chart-2", w: "w-[54%]" },
                { cls: "bg-chart-3", w: "w-[31%]" },
              ].map((b, i) => (
                <div key={b.cls} className="relative h-7 overflow-hidden rounded-full bg-chart-track" aria-hidden>
                  <div className={`absolute inset-y-0 left-0 flex items-center rounded-full pl-2.5 text-chart-ink ${b.cls} ${b.w}`}>
                    {i === 0 ? <Check className="size-4" /> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Token>bg-chart-track</Token>
              <Token>text-chart-ink</Token>
            </div>
          </div>
          <ChartCard id="haftalik" label="Haftalık Seans" value="345" change={6.1} changeLabel="geçen haftaya göre">
            <TrackBarChart title="Haftalık Seans" data={WEEK} series={2} height="h-40" />
          </ChartCard>
        </div>
      </Section>

      <Section
        id="metin-degil"
        title="Renk Metin Değildir"
        description="Pastel seriler açık zeminde metin kontrastı tutmaz. Değer yanında güçlü metinle yazılır; renk nokta, dolgu ya da rozet zemininde kalır."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <figure className="rounded-2xl bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              {SERIES.slice(0, 4).map((s) => (
                <Badge key={s.n} tone={`chart-${s.n}` as "chart-1"} dot>
                  {["Ödeme", "Kayıt", "Destek", "İade"][s.n - 1]}
                </Badge>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-base">
              <span aria-hidden className="size-2.5 rounded-[3px] bg-chart-1" />
              <span className="text-muted">Bu Yıl</span>
              <span className="font-semibold text-strong tabular-nums">12.480</span>
            </p>
            <figcaption className="mt-4 flex items-center gap-2 text-small text-body">
              <Badge tone="success" shape="rounded">
                <Check aria-hidden className="size-3" /> Doğru
              </Badge>
              Renk zeminde ve noktada, yazı text-strong.
            </figcaption>
          </figure>
          <figure className="rounded-2xl bg-surface p-5">
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {SERIES.map((s) => {
                const key = s.n as 1 | 2 | 3 | 4 | 5 | 6;
                const r = ratioOn(chart.light[key], roles.light.pageBg) ?? 0;
                return (
                  <li key={s.n} className="rounded-lg bg-overlay px-2 py-2 text-center shadow-raised">
                    {/* Kötü örnek bilerek: seri rengiyle yazı. SVG metni, okunan değer altta. */}
                    <svg aria-hidden viewBox="0 0 60 22" className="mx-auto h-6 w-full">
                      <text x="30" y="16" textAnchor="middle" className={`${STROKE_TEXT[s.n - 1]} text-[15px] font-semibold`}>
                        12.480
                      </text>
                    </svg>
                    <span className="mt-1 block text-small font-semibold text-strong tabular-nums">{formatRatio(r)}</span>
                  </li>
                );
              })}
            </ul>
            <figcaption className="mt-4 flex items-center gap-2 text-small text-body">
              <Badge tone="danger" shape="rounded">
                <X aria-hidden className="size-3" /> Yanlış
              </Badge>
              Seri rengiyle yazı: açık zeminde oranlar 4,5'in çok altında.
            </figcaption>
          </figure>
        </div>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Grafik Renkleri",
  id: "chart-colors",
  component: GrafikRenkleriSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "chart-1…6, track ve ink: seri sırası, lejant karosu ve gerçek grafiklerde iki temada görünüş.",
      },
    },
  },
} satisfies Meta<typeof GrafikRenkleriSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Grafik Renkleri" };
