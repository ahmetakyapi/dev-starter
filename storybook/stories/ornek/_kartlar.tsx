"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ArtMat } from "@/components/ui/art-mat";
import { Orb, OrbCarousel } from "@/components/ui/orb";
import { Eyebrow } from "@/components/ui/section-heading";
import { Spinner } from "@/components/ui/spinner";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ThinkingOrb } from "@/components/ui/thinking-orb";
import { Wallpaper } from "@/components/ui/wallpaper";
import { cn } from "@/lib/utils";

/**
 * Kart vitrini (25 Kasım 2026): yapay zeka ve araştırma ürünlerinin tanıtım
 * kartları. Referans: "Bigger Picture / Frontier meets reality / Impact" telefon
 * kartları ve KODOR kart seti (oyuk ızgara + parlak küre, "Thinking…" kartı,
 * cam "Ask anything" kutusu, zirve kartı). Yalnız yapı; fotoğraf yerine
 * `art-mat` (smear, wash) ve `wallpaper`, 3D küre yerine `orb`. Markalar
 * kurgusal (Kuzey Lab, Aster), sayılar ÖRNEK.
 */

const CARD = "relative isolate flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-overlay shadow-raised ring-1 ring-inset ring-line-soft";
const INK_BTN = "inline-flex h-11 items-center justify-center rounded-xl bg-strong px-5 text-base font-medium text-page outline-none transition-[translate] hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";

/** Köşe ayraçları: boş alanı "kadraj" gibi çerçeveler (kartın odak nesnesi içinde durur). */
function Brackets({ children }: { children: ReactNode }) {
  const c = "absolute size-5 border-line-strong";
  return (
    <div className="relative grid place-items-center py-8">
      <span aria-hidden className={cn(c, "top-0 left-0 border-t border-l")} />
      <span aria-hidden className={cn(c, "right-0 bottom-0 border-r border-b")} />
      {children}
    </div>
  );
}

/* 1 — Büyük Resim: kadrajda dönen dünya, ince eylem, altta smear dokusu. */
export function BigPictureCard() {
  return (
    <article className={cn(CARD, "min-h-[38rem]")}>
      <div className="grid gap-6 p-6">
        <h3 className="text-title text-body">
          Büyük Resmi <b className="font-semibold text-strong">Gör</b>
        </h3>
        <Brackets>
          <Orb variant="globe" size={150} />
        </Brackets>
        <p className="max-w-[34ch] text-read text-muted">Önde gelen yapay zeka araştırmalarına ekibimiz ve ortaklarımızla birlikte katıl.</p>
        <a href="#fiyat" className={INK_BTN}>
          Devamını Oku
        </a>
      </div>
      <ArtMat variant="smear" pad="sm" className="mt-auto h-48 rounded-none sm:rounded-none" />
    </article>
  );
}

/* 2 — Numaralı künye + küre şeridi: ortadaki net, yandakiler bulanık ve kesik. */
const ORBS = [
  { id: "a", label: "Görsel veri", colors: ["var(--primary)", "var(--accent-warm)", "var(--primary-soft)"] },
  { id: "b", label: "Model", colors: ["var(--text-muted)", "var(--primary-soft)", "var(--page-bg)", "var(--primary)"] },
  { id: "c", label: "Dünya", variant: "globe" as const },
  { id: "d", label: "Ses", colors: ["var(--primary-hover)", "var(--primary-soft)", "var(--text-muted)"] },
];

export function FrontierCard() {
  const [value, setValue] = useState("b");
  return (
    <article className={cn(CARD, "min-h-[38rem]")}>
      <div className="p-6">
        <Eyebrow index="01" line="none" upper={false} className="font-sans text-base tracking-normal text-strong">
          Sınır Gerçekle Buluşuyor
        </Eyebrow>
      </div>
      <OrbCarousel label="Araştırma alanları" items={ORBS} value={value} onSelect={setValue} size={112} className="my-auto" />
      <div className="grid gap-4 p-6">
        <p className="text-read text-strong">Ekibimiz Kuzey Lab, Aster ve Pusula gibi şirketlerin kurulmasına yardım etti.</p>
        <p className="text-base text-muted">Görsel veriyi anlamanın güçlü bir yolunu kuruyoruz; yapay zekanın neler yapabileceğine dair ortak bir görüşümüz var.</p>
        <span className="w-fit rounded-md bg-primary-wash px-2.5 py-1 text-small font-medium text-primary-ink">Önde Gelen Kurumlar Güveniyor</span>
      </div>
    </article>
  );
}

/* 3 — Etki: üstte tam genişlik sahne, altında eylem ve sayı sütunu. */
export function ImpactCard() {
  return (
    <article className={cn(CARD, "min-h-[38rem]")}>
      <div className="p-6">
        <Eyebrow index="03" line="none" upper={false} className="font-sans text-base tracking-normal text-strong">
          Etki
        </Eyebrow>
      </div>
      <div className="relative aspect-square w-full">
        <Wallpaper scene="alpine" className="absolute inset-0 size-full" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-6">
        <div className="grid content-start gap-3">
          <p className="text-base text-strong">
            <span className="text-muted">Güç kaynağı</span> KUZEY LAB
          </p>
          <a href="#fiyat" className={cn(INK_BTN, "h-9 w-fit rounded-lg px-4 text-small")}>
            Keşfet
          </a>
        </div>
        <dl className="grid gap-1.5 text-right">
          {[
            ["1,3 mr", "işlenen kare"],
            ["12 mn", "etiket"],
            ["1,5 sn", "ortalama yanıt"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-mono text-small text-strong tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-auto px-6 pb-6 text-small text-muted">Gerçeklik için çalışıyoruz. Sayılar örnektir.</p>
    </article>
  );
}

/* 4 — Oyuk ızgara + parlak küre: kareler büyük yarıçaplı, aralarında ince ışık; metin iki tonlu. */
export function NotchGridCard() {
  const tiles = Array.from({ length: 16 }, (_, i) => i);
  return (
    <article className={cn(CARD, "min-h-[30rem] bg-surface")}>
      <div aria-hidden className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-[3px] p-[3px]">
        {tiles.map((i) => (
          <span
            key={i}
            className={cn(
              "bg-overlay/70",
              // Köşe yarıçapları dama gibi değişir: kareler birbirine oyulmuş gibi okunur.
              i % 3 === 0 ? "rounded-[2.5rem_0.5rem_2.5rem_0.5rem]" : i % 3 === 1 ? "rounded-[0.5rem_2.5rem_0.5rem_2.5rem]" : "rounded-[1.5rem]",
            )}
          />
        ))}
      </div>
      <div className="relative grid flex-1 grid-rows-[1fr_auto] p-8">
        <div className="grid content-center justify-items-start gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <p className="max-w-[24ch] text-title text-strong">
            <span className="text-muted">Geleneksel toplu işleri iyileştirmek</span> 5 kata varan hız getirdi.
          </p>
          <Orb size={128} shadow colors={["var(--danger)", "var(--accent-warm)", "var(--primary-soft)", "var(--primary-hover)"]} />
        </div>
        <p className="grid gap-0.5 text-small text-muted">
          Altyapı
          <span className="flex items-center gap-1.5 text-read font-bold tracking-tight text-strong">
            <Sparkles aria-hidden className="size-4" />
            KUZEY LAB
          </span>
        </p>
      </div>
    </article>
  );
}

/* 5 — Düşünüyor kartı: koyu başlık, içinde beyaz iş kartı, altta düşünen küre ve parıltılı metin. */
export function ThinkingCard() {
  return (
    <article className={cn(CARD, "bg-[color-mix(in_srgb,var(--primary-hover)_55%,var(--text-strong))] p-1.5")}>
      <div className="grid gap-1 px-5 pt-4 pb-5">
        <p className="flex items-center gap-2 text-base font-medium text-on-brand">
          <Sparkles aria-hidden className="size-4" />
          Hamilton Simülasyonu
        </p>
        <p className="text-small text-[color-mix(in_srgb,var(--on-brand)_75%,transparent)]">Simülasyon kuyruğunu yapay zeka araçlarıyla çalıştır; sonuç dakikalar içinde gelir.</p>
      </div>
      <div className="grid min-h-44 content-between gap-6 rounded-[1.3rem] bg-overlay p-5">
        <p className="flex items-center gap-2 text-base text-strong">
          <Spinner size="sm" label={null} />
          Kuantum Optimizasyonu
        </p>
        <p className="flex items-center gap-2.5 text-read">
          <ThinkingOrb state="thinking" size={26} label="Asistan düşünüyor" />
          <TextShimmer className="text-muted">Düşünüyor…</TextShimmer>
        </p>
      </div>
    </article>
  );
}

/* 6 — Cam soru kutusu: koyu, akışkan dokunun üstünde buzlu cam giriş. */
export function AskCard() {
  return (
    <article className={cn(CARD, "min-h-56 bg-strong")}>
      <ArtMat variant="smear" pad="lg" className="absolute inset-0 rounded-none opacity-80 sm:rounded-none" />
      <span aria-hidden className="absolute inset-0 bg-[color-mix(in_srgb,var(--text-strong)_45%,transparent)]" />
      <form className="relative m-auto flex w-[min(100%-2.5rem,22rem)] items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--on-brand)_16%,transparent)] py-1.5 pr-1.5 pl-5 ring-1 ring-inset ring-[color-mix(in_srgb,var(--on-brand)_30%,transparent)] backdrop-blur-md" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="kart-sor" className="sr-only">
          Asistana sor
        </label>
        <input id="kart-sor" placeholder="Bir şey sor…" className="min-w-0 flex-1 bg-transparent text-read text-on-brand outline-none placeholder:text-[color-mix(in_srgb,var(--on-brand)_70%,transparent)]" />
        <button type="submit" aria-label="Gönder" className="grid size-9 place-items-center rounded-full bg-on-brand text-strong outline-none focus-visible:ring-2 focus-visible:ring-line-focus">
          <ArrowUp aria-hidden className="size-4" />
        </button>
      </form>
    </article>
  );
}

/* 7 — Zirve kartı: başlık + küçük küre, büyük sahne panelinde dünya, altta solan metin. */
export function SummitCard() {
  return (
    <article className={cn(CARD, "min-h-[30rem] bg-surface p-1.5")}>
      <div className="flex items-start justify-between p-5">
        <p className="text-read leading-tight font-medium text-strong">
          KUZEY LAB
          <span className="block text-body">Zirve 2026</span>
        </p>
        <Orb size={34} />
      </div>
      <ArtMat variant="wash" pad="sm" className="grid aspect-[4/3] place-items-center" contentClassName="grid place-items-center">
        <Orb variant="globe" size={170} />
      </ArtMat>
      <p className="relative mt-auto p-5 text-small text-body [mask-image:linear-gradient(currentColor_55%,transparent)]">
        2026 Zirvesi kuantum çağının başlangıcını işaret ediyor. Doğadaki ilk ışığın büyüleyici niteliklerinden ilham alarak marka görsellerini bu dönüşüm yolculuğunu simgeleyecek biçimde yeniden kurduk. Üretken bir tasarım dili yıl boyunca gelişti.
      </p>
    </article>
  );
}

export function CardShowcase() {
  return (
    <div className="min-h-dvh bg-page px-5 py-14 text-body sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-14">
        <section aria-labelledby="kartlar-1" className="grid gap-6">
          <h2 id="kartlar-1" className="font-display text-heading font-semibold tracking-tight text-strong">
            Araştırma Kartları
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            <BigPictureCard />
            <FrontierCard />
            <ImpactCard />
          </div>
        </section>
        <section aria-labelledby="kartlar-2" className="grid gap-6">
          <h2 id="kartlar-2" className="font-display text-heading font-semibold tracking-tight text-strong">
            Ürün Kartları
          </h2>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <NotchGridCard />
            <div className="grid gap-5">
              <ThinkingCard />
              <AskCard />
            </div>
            <SummitCard />
          </div>
        </section>
      </div>
    </div>
  );
}
