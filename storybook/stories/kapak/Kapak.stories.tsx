import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { useGlobals } from "storybook/preview-api";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BookCover } from "@/components/ui/book-cover";
import { BorderBeam } from "@/components/ui/border-beam";
import { Dial } from "@/components/ui/dial";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { PatternBackground } from "@/components/ui/pattern-bg";
import { SlotText } from "@/components/ui/slot-text";
import { Terminal } from "@/components/ui/terminal";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ThinkingOrb } from "@/components/ui/thinking-orb";
import { cn } from "@/lib/utils";
import { palettes } from "../../../packages/@ahmet/theme/tokens";
import { PALETTES } from "../../.storybook/palettes";
import uiPackage from "../../../packages/@ahmet/ui/package.json";
import { KIT_COUNT, STORY_COUNT, TOTAL } from "../amiral/_kapsam";

/**
 * Kapak: kataloğun ilk ekranı. Kompozisyondaki her parça gerçek snippet
 * bileşeni (sahte ekran görüntüsü yok); palet karoları araç çubuğundaki
 * Palet globalini değiştirir, sayfa, sidebar ve belge birlikte döner.
 * Sayılar elle yazılmaz: bileşen ve hikâye sayısı kaynak dosyalardan.
 */

/** Storybook içinde gezinme: tuval iframe, bağlantı üst pencerede açılır. */
const to = (id: string) => `./?path=/story/${id}`;

function Hero({ palette }: { palette: string }) {
  const title = PALETTES.find((p) => p.value === palette)?.title ?? "Signature";
  return (
    <section aria-labelledby="kapak-baslik" className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <div className="grid justify-items-start gap-6">
        <p className="font-mono text-small text-muted">
          board · {TOTAL} bileşen · {PALETTES.length} palet
        </p>
        <h1
          id="kapak-baslik"
          className="display-ink pb-1 font-display text-[clamp(2.75rem,6.4vw,5.25rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance"
        >
          Tek Kimlik, On Palet
        </h1>
        <p className="max-w-[46ch] text-lead text-body">
          Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar. Her parça{" "}
          <MarkAnnotate type="underline" delay={600}>
            token&apos;dan
          </MarkAnnotate>{" "}
          çizilir, paletle birlikte döner.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={to("showcase--all-in-one")}
            target="_top"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-cta px-6 text-base font-semibold text-on-brand shadow-cta transition-[translate] duration-200 hover:-translate-y-px"
          >
            Bileşenleri Gez
            <ArrowRight aria-hidden className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5" />
          </a>
          <a
            href={to("pattern-library--overview")}
            target="_top"
            className="inline-flex min-h-12 items-center rounded-full bg-overlay px-6 text-base font-semibold text-strong shadow-raised"
          >
            Desen Kütüphanesi
          </a>
        </div>
      </div>

      {/* Örnek: bekleyen asistan, çalışan kart ve bir kadran; desen zeminde. */}
      <div className="relative isolate grid min-h-[420px] place-items-center overflow-hidden rounded-[2rem] bg-surface edge-lit p-6 sm:min-h-[480px]">
        <PatternBackground pattern="rings" size={34} fade="center" glow="bloom" tone="primary" intensity={0.4} />
        <div className="grid justify-items-center gap-4">
          <ThinkingOrb state="thinking" size={176} label="Asistan düşünüyor" />
          <p className="font-mono text-small text-muted">
            palet: <SlotText text={title} className="text-primary-ink" live />
          </p>
        </div>
        <BorderBeam className="mt-6 w-full max-w-60 rounded-xl bg-overlay p-3.5 shadow-floating sm:absolute sm:top-7 sm:left-7 sm:mt-0">
          <p className="text-micro text-muted">Asistan</p>
          <TextShimmer className="mt-0.5 text-small">Palet uygulanıyor…</TextShimmer>
        </BorderBeam>
        <div className="mt-4 rounded-2xl bg-overlay p-3 shadow-floating sm:absolute sm:right-7 sm:bottom-7 sm:mt-0">
          <Dial label="Yoğunluk" min={0} max={10} defaultValue={4} size={104} />
        </div>
      </div>
    </section>
  );
}

function PaletteStrip({ palette, onPick }: { palette: string; onPick: (value: string) => void }) {
  return (
    <section aria-labelledby="kapak-palet" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="kapak-palet" className="font-display text-heading font-bold tracking-tight text-strong">
          Paleti Seç, Katalog Dönsün
        </h2>
        <p className="max-w-[60ch] text-base text-body">Karoya bas: tuval, sidebar ve belge aynı anda o paletle çizilir. Araç çubuğundaki Palet ile aynı ayar.</p>
      </div>
      <div role="radiogroup" aria-label="Palet" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PALETTES.map((p) => {
          const on = p.value === palette;
          const tile = palettes[p.value].light.brandGradient;
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(p.value)}
              className={cn(
                "group grid min-h-11 gap-3 rounded-2xl bg-overlay p-2.5 text-left shadow-raised transition-[translate] duration-200 hover:-translate-y-0.5",
                on && "ring-2 ring-primary",
              )}
            >
              {/* Marka karosu: degradenin izinli üç yerinden biri. */}
              <span aria-hidden className="relative block aspect-[5/3] rounded-xl" style={{ backgroundImage: tile }}>
                {on ? (
                  <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-overlay text-strong">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : null}
              </span>
              <span className="px-1 pb-0.5 text-small font-medium text-strong">{p.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Figures() {
  const items: [string, string][] = [
    [String(TOTAL), "bileşen, hepsi kopyalanabilir"],
    [String(STORY_COUNT), "hikâye, açık ve koyu"],
    [String(PALETTES.length), "palet, tek token mimarisi"],
    [String(KIT_COUNT), "bileşen npm paketinde"],
  ];
  return (
    <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
      {items.map(([n, label], i) => (
        <div key={label} className={cn("grid gap-1 px-1 py-7 sm:px-6", i % 2 === 1 && "border-l border-line", i === 2 && "lg:border-l")}>
          <dt className="order-2 text-small text-muted">{label}</dt>
          <dd className="order-1 font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-none font-semibold tracking-[-0.04em] text-strong tabular-nums">
            {n}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Shelf() {
  const books: { id: string; title: string; subtitle: string; mark: string; tone: "primary" | "ink" | "paper" }[] = [
    { id: "start--overview", title: "Başlangıç", subtitle: "Manifesto ve token'lar", mark: "01", tone: "paper" },
    { id: "showcase--all-in-one", title: "Her Şey Bir Arada", subtitle: "Bütün kütüphane tek sayfada", mark: "02", tone: "primary" },
    { id: "pattern-library--overview", title: "Desen Kütüphanesi", subtitle: "35 zemin, kopyala ve kullan", mark: "03", tone: "ink" },
    { id: "demo-app--overview", title: "Pusula Paneli", subtitle: "Aynı parçalarla bir uygulama", mark: "04", tone: "paper" },
  ];
  return (
    <section aria-labelledby="kapak-raf" className="grid gap-8">
      <h2 id="kapak-raf" className="font-display text-heading font-bold tracking-tight text-strong">
        Nereden Başlamalı
      </h2>
      <ul className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 py-4 lg:grid-cols-4">
        {books.map((b) => (
          <li key={b.id}>
            <a href={to(b.id)} target="_top" className="block rounded-md">
              <BookCover title={b.title} subtitle={b.subtitle} mark={b.mark} author="dev-starter" tone={b.tone} width={164} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Install() {
  return (
    <section aria-labelledby="kapak-kur" className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div className="grid gap-3">
        <h2 id="kapak-kur" className="font-display text-heading font-bold tracking-tight text-strong">
          İki Yoldan Projeye Al
        </h2>
        <p className="max-w-[48ch] text-base text-body">
          Kaynağı kopyala (bileşen senin olur, bağımlılıklarıyla gelir) ya da paketi kur. Her bileşenin belgesinde kendi komutu var.
        </p>
      </div>
      <Terminal
        title="~/yeni-proje"
        lines={[
          { kind: "comment", text: "kaynak olarak, bağımlılıklarıyla" },
          { kind: "command", text: "node ~/dev-starter/scripts/add-ui.mjs . terminal dial" },
          { kind: "output", text: "+ terminal.tsx, dial.tsx, copy-button.tsx, digit-roll.tsx", tone: "success" },
          { kind: "comment", text: "ya da paket olarak" },
          { kind: "command", text: "npm i @ahmetakyapi/ui @ahmetakyapi/theme" },
          { kind: "output", text: `+ @ahmetakyapi/ui@${uiPackage.version}`, tone: "success" },
        ]}
      />
    </section>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page text-body">
      <div className="mx-auto grid max-w-6xl gap-20 px-5 pt-10 pb-24 sm:px-8 lg:gap-28 lg:pt-14">{children}</div>
    </div>
  );
}

const meta = {
  title: "Kapak",
  id: "cover",
  parameters: { layout: "fullscreen", docs: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Kapak",
  render: function Render() {
    const [globals, updateGlobals] = useGlobals();
    const palette = String(globals.palette ?? "signature");
    return (
      <Frame>
        <Hero palette={palette} />
        <PaletteStrip palette={palette} onPick={(value) => updateGlobals({ palette: value })} />
        <Figures />
        <Shelf />
        <Install />
      </Frame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Tek Kimlik, On Palet");
    await userEvent.click(canvas.getByRole("radio", { name: /Yeşim/ }));
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement.dataset.palette).toBe("jade"));
    await userEvent.click(canvas.getByRole("radio", { name: /Signature/ }));
  },
};
