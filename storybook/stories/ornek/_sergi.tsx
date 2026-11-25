"use client";

import { ArrowRight, Box, CreditCard, Globe2, Layers3, MapPinned, PencilRuler, Ruler, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { AppWindow } from "@/components/ui/app-window";
import { ArtMat } from "@/components/ui/art-mat";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { HeadMark } from "@/components/ui/head-mark";
import { Eyebrow } from "@/components/ui/section-heading";
import { Sparkline } from "@/components/ui/sparkline";
import { StackedBarChart } from "@/components/ui/stacked-bar-chart";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";

/**
 * Sergi turu kahramanları (25 Kasım 2026). Üç düzen, üçü de ürünü dokulu
 * bir zeminin (`art-mat`) üstünde sergiler; başlık iki tonlu ve sakin.
 * Referanslar: Synaps (Sergi), Lasso (Boya Katmanı), Grain (Daralan Bant).
 * Yalnız yapı ve davranış; markalar kurgusal, sayılar ÖRNEK, görsel yok
 * (doku token'dan SVG).
 */

const INK_BTN =
  "inline-flex h-11 items-center gap-2 rounded-full bg-strong px-5 text-base font-medium text-page shadow-raised outline-none transition-[translate,box-shadow] hover:-translate-y-px hover:shadow-floating focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";
const GHOST_BTN =
  "inline-flex h-11 items-center gap-2 rounded-full bg-surface px-5 text-base font-medium text-strong ring-1 ring-inset ring-line outline-none hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";

function Nav({ brand, links, cta, center = false }: { brand: string; links: string[]; cta: string; center?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-6 py-6">
      <a href="#ozellikler" className="flex items-center gap-2 text-read font-bold tracking-tight text-strong outline-none focus-visible:ring-2 focus-visible:ring-line-focus">
        <span aria-hidden className="grid size-7 place-items-center rounded-md bg-strong text-page">
          <Sparkles className="size-4" />
        </span>
        {brand}
      </a>
      <nav aria-label="Ana menü" className={cn("hidden gap-7 text-base text-body md:flex", center && "absolute left-1/2 -translate-x-1/2")}>
        {links.map((l) => (
          <a key={l} href="#ozellikler" className="outline-none hover:text-strong focus-visible:ring-2 focus-visible:ring-line-focus">
            {l}
          </a>
        ))}
      </nav>
      <a href="#fiyat" className="text-base font-medium text-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focus">
        {cta}
      </a>
    </header>
  );
}

/** Plan çizimi: ızgara üstünde odalar; ürün penceresinin içi. Süs, metni okunur. */
function PlanCanvas() {
  const rooms = [
    { x: 6, y: 10, w: 34, h: 38, label: "Mutfak · 32 m²" },
    { x: 40, y: 10, w: 26, h: 38, label: "Toplantı · 18 m²" },
    { x: 66, y: 10, w: 28, h: 62, label: "Açık Ofis · 54 m²" },
    { x: 6, y: 48, w: 60, h: 24, label: "Giriş · 49 m²" },
  ];
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-surface">
      <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 100 80" preserveAspectRatio="none">
        <defs>
          <pattern id="sergi-plan-grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M4 0H0V4" fill="none" className="stroke-line" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100" height="80" fill="url(#sergi-plan-grid)" />
        {rooms.map((r) => (
          <rect key={r.label} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" className="stroke-strong" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        ))}
        <rect x="6" y="10" width="88" height="62" fill="none" className="stroke-primary" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {rooms.map((r) => (
        <span key={r.label} className="absolute font-mono text-micro text-muted" style={{ left: `${r.x + 2}%`, top: `${(r.y / 80) * 100 + 4}%` }}>
          {r.label}
        </span>
      ))}
      <span className="absolute top-3 left-3 rounded-md bg-overlay px-2 py-1 text-small text-strong shadow-raised">Zemin Kat</span>
    </div>
  );
}

function Tool({ icon, active }: { icon: ReactNode; active?: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-8 place-items-center rounded-md [&_svg]:size-4", active ? "bg-strong text-page" : "text-muted")}>
      {icon}
    </span>
  );
}

/* 1 — Sergi (Synaps) ------------------------------------------------------- */

export function ExhibitHero() {
  return (
    <section className="relative isolate overflow-x-clip">
      <div className="relative mx-auto max-w-6xl px-6">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-2 hidden border-l border-dashed border-line-strong lg:block" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-2 hidden border-r border-dashed border-line-strong lg:block" />
        <Nav brand="Taslak" links={["Ürün", "Çözümler", "Fiyat", "Kaynaklar"]} cta="Giriş Yap" />
        <div className="grid gap-12 pt-14 pb-14 lg:pt-20">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-strong">
            <HeadMark variant="highlight" icon={<MapPinned />}>
              Arsadan
            </HeadMark>{" "}
            <span className="text-[color-mix(in_srgb,currentColor_52%,transparent)]">Sunuma Hazır Projeye</span>
          </h1>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
            <div className="grid gap-6">
              <div className="grid max-w-[52ch] gap-2">
                <p className="text-title font-medium text-strong">Mimarlar için Tasarım ve Çizim Yazılımı</p>
                <p className="text-lead text-pretty text-body">Bir plan, bir arsa ya da kısa bir tarifle başla. Düzenlenebilir bir yapı kurulur; bir kez değiştir, bütün plan, kesit ve görünüşler izler.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#fiyat" className={INK_BTN}>
                  Ücretsiz Dene
                </a>
                <a href="#ozellikler" className={GHOST_BTN}>
                  Nasıl Çalışır
                </a>
              </div>
              <p className="text-small text-muted">7 gün ücretsiz, istediğin an bırak.</p>
            </div>
            <dl className="grid grid-cols-3 gap-6 lg:justify-self-end">
              {[
                [<Globe2 key="g" />, "43", "Ülke"],
                [<Box key="b" />, "118 B", "Proje"],
                [<Users key="u" />, "8.214", "Mimar"],
              ].map(([icon, value, label]) => (
                <div key={label as string} className="grid gap-2">
                  <span aria-hidden className="text-muted [&_svg]:size-5 [&_svg]:stroke-[1.5]">{icon}</span>
                  <dt className="order-3 font-mono text-small tracking-[0.12em] text-muted">{(label as string).toLocaleUpperCase("tr-TR")} (ÖRNEK)</dt>
                  <dd className="order-2 font-mono text-read text-strong tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <ArtMat variant="grid" edge="torn" crop pad="lg" className="h-[26rem] sm:h-[34rem]" contentClassName="max-w-5xl">
          <AppWindow title="Taslak · Kat Planı" icon={<PencilRuler className="size-3.5" />} focused>
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[13rem_2.5rem_minmax(0,1fr)]">
              <div className="hidden content-start gap-3 rounded-lg bg-surface p-3 sm:grid">
                <p className="text-small font-medium text-strong">Yapı</p>
                <div className="grid grid-cols-2 gap-2 text-small">
                  <span className="rounded-md bg-overlay px-2 py-1.5 tabular-nums shadow-raised">27,07 m</span>
                  <span className="rounded-md bg-overlay px-2 py-1.5 tabular-nums shadow-raised">31,57 m</span>
                </div>
                <p className="mt-2 text-small font-medium text-strong">Kesitler</p>
                {["Kesit A-A", "Kesit C-C", "Görünüş 01"].map((s) => (
                  <span key={s} className="rounded-md bg-overlay px-2 py-1.5 text-small shadow-raised">{s}</span>
                ))}
              </div>
              <div className="grid content-start gap-1 rounded-lg bg-surface p-1">
                <Tool icon={<ArrowRight />} active />
                <Tool icon={<MapPinned />} />
                <Tool icon={<Ruler />} />
                <Tool icon={<Layers3 />} />
              </div>
              <PlanCanvas />
            </div>
          </AppWindow>
        </ArtMat>
      </div>
    </section>
  );
}

/* 2 — Boya Katmanı (Lasso) ------------------------------------------------- */

export function StrataHero() {
  return (
    <section className="relative isolate overflow-x-clip">
      <div className="mx-auto max-w-6xl px-6">
        <Nav brand="Kement" links={["Platform", "Ödemeler", "Yönlendirme", "Fiyat"]} cta="Başla" center />
        <div className="mx-auto grid max-w-4xl justify-items-center gap-5 pt-16 pb-14 text-center">
          <h1 className="font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] font-medium tracking-[-0.045em] text-balance text-strong">
            Dijital Ticaretin <HeadMark icon={<CreditCard />}>Yeni</HeadMark> <em className="font-normal italic">Sınırı</em>
          </h1>
          <p className="text-lead text-body">Tek ödeme ekranı, her kanal.</p>
          <a href="#fiyat" className="inline-flex h-11 items-center rounded-full bg-cta px-6 text-base font-medium text-on-brand shadow-cta outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2">
            Hemen Başla
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <ArtMat variant="strata" tone="earth" edge="torn" pad="md">
          <AppWindow title="Sağlayıcıya Göre Satış (ÖRNEK)" icon={<CreditCard className="size-3.5" />}>
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-small text-muted">Dönüşüm</p>
                    <p className="font-display text-display font-medium tracking-[-0.03em] text-strong tabular-nums">%7,35</p>
                  </div>
                  <Badge tone="success">+%2,65</Badge>
                </div>
                <StackedBarChart
                  title="Gün ve sağlayıcıya göre satış, örnek veri"
                  height="h-48"
                  series={[{ name: "Kart", color: 1 }, { name: "Cüzdan", color: 3 }]}
                  data={[
                    { label: "12 Nis", values: [5, 3] },
                    { label: "13 Nis", values: [3, 2] },
                    { label: "14 Nis", values: [8, 4] },
                    { label: "15 Nis", values: [6, 4] },
                    { label: "16 Nis", values: [4, 2] },
                    { label: "17 Nis", values: [7, 3] },
                  ]}
                />
              </div>
              <BarList
                title="Ürüne Göre"
                items={[
                  { label: "Kaktüs Tişört", value: 1342 },
                  { label: "Kapüşonlu", value: 1200 },
                  { label: "Kot Ceket", value: 1022 },
                  { label: "Termos", value: 456 },
                ]}
              />
            </div>
          </AppWindow>
        </ArtMat>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-12">
        <p className="max-w-[24ch] text-read text-muted">Yüzlerce platformun güvendiği ödeme altyapısı (ÖRNEK)</p>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-3 text-title text-soft" aria-label="Örnek ödeme yöntemleri">
          {["Kartlı", "Cüzdan", "Havale", "Taksit", "Kripto"].map((m) => (
            <li key={m} className="font-semibold tracking-tight">{m}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 3 — Daralan Bant (Grain) ------------------------------------------------- */

export function BandHero() {
  return (
    <section className="relative isolate overflow-x-clip pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <Nav brand="Başak" links={["Ürünler", "Kaynaklar", "Uyum"]} cta="Ekiple Konuş" />
        <div className="grid gap-8 pt-16 pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-4">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.04em] text-strong">
              <span className="block">Modern Ödemeler için</span>
              <span className="block text-[color-mix(in_srgb,currentColor_55%,transparent)]">Kurulmuş Altyapı</span>
            </h1>
            <p className="max-w-[46ch] text-read text-body">Hız ve sadelik için tasarlandı; küresel ticaretin yeni kuşağı için.</p>
          </div>
          <form className="flex w-full max-w-md items-center gap-2 rounded-full bg-surface p-1.5 ring-1 ring-inset ring-line" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="band-mail" className="sr-only">İş e-postan</label>
            <input id="band-mail" type="email" placeholder="İş e-postan" className="min-w-0 flex-1 bg-transparent px-3 text-base text-strong outline-none placeholder:text-muted" />
            <button type="submit" className="inline-flex h-10 shrink-0 items-center rounded-full bg-strong px-4 text-base font-medium text-page outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2">
              Demo İste
            </button>
          </form>
        </div>
      </div>
      <ArtMat variant="strata" tone="earth" pad="lg" scrollInset bleed={0.07} className="mx-auto max-w-6xl" contentClassName="grid gap-4 py-6 sm:grid-cols-3 sm:items-center">
        <div className="rounded-xl bg-overlay/90 p-4 shadow-floating backdrop-blur">
          <Stat label="Gelen Bakiye" value="₺18.400" change={4.2} changeLabel="bu hafta" />
          <Sparkline values={[6, 9, 8, 11, 10, 14, 16]} title="Bakiye eğrisi, örnek" width={220} height={36} className="mt-3" />
        </div>
        <div className="rounded-xl bg-overlay p-5 shadow-modal sm:-my-6">
          <p className="text-small text-muted">Ödeme Gönder</p>
          <p className="mt-1 font-display text-display font-medium tracking-[-0.03em] text-strong tabular-nums">13.550,14</p>
          <p className="mt-3 text-small text-muted">Alıcı Alır</p>
          <p className="text-title font-medium text-strong tabular-nums">250.000,00 ₺</p>
          <a href="#fiyat" className="mt-4 flex h-10 items-center justify-center rounded-lg bg-strong text-base font-medium text-page outline-none focus-visible:ring-2 focus-visible:ring-line-focus">
            Onayla ve Gönder
          </a>
        </div>
        <div className="rounded-xl bg-overlay/90 p-4 shadow-floating backdrop-blur">
          <p className="text-small font-medium text-strong">Son Ödemeler</p>
          <ul className="mt-3 grid gap-2 text-small">
            {[
              ["Tedarikçi A.Ş.", "Bekliyor", "warning"],
              ["Lojistik Ltd.", "Tamam", "success"],
              ["Ajans Ortak", "Tamam", "success"],
            ].map(([n, s, t]) => (
              <li key={n} className="flex items-center justify-between gap-2">
                <span className="truncate text-body">{n}</span>
                <Badge tone={t as "warning" | "success"}>{s}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </ArtMat>
      <div className="mx-auto mt-24 grid max-w-6xl gap-10 px-6">
        <Eyebrow>Neden Başak</Eyebrow>
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.035em] text-strong">
          <span className="block">İşin Küresel</span>
          <span className="block text-[color-mix(in_srgb,currentColor_55%,transparent)]">Ödemen de Öyle Olsun</span>
        </h2>
      </div>
    </section>
  );
}
