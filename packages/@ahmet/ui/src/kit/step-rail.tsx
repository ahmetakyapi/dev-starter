// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ElementType, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Süreç rayı: tanıtım sayfasında "nasıl çalışır" bölümü (Synais "Workflow"
 * bölümünün yapısı). Dikey liste; her adımda yuvarlak ikon karosu, başlık ve
 * tek satır açıklama; karoları kalın bir hap çizgi birleştirir. Tamamlanan
 * kısım `primary` ile dolu, kalan kısım iz.
 *
 * `stepper.tsx` ile FARKI: o, form akışında "neredeyiz" der (yatay, sayılı,
 * tamamlanan adım tik). Bu, ziyaretçiye süreci ANLATIR: ikonlu, geniş, dikey,
 * kaydırdıkça çizgi dolar. Çok adımlı kayıt formu için `stepper`, tanıtım
 * bölümü için burası. 3-6 adımdan fazlası okunmaz.
 *
 * `current`: kaçıncı adıma kadar dolu (sıfırdan; adım sayısı ya da büyüğü
 * verilirse hepsi tamam, her başlığa görünmez "(Tamamlandı)" eklenir).
 * Varsayılan `-1`: hiçbir adım "şu an" değil, hiçbiri dolu değil; süreç
 * ANLATAN bölümde ilk adımı sahte biçimde "burada" göstermez. Adımlar
 * `<ol role="list">`, bulunulan adım `aria-current="step"`; tamam adımların
 * durumu görünmez "Tamamlandı" metniyle de söylenir. `headingLevel`: adım
 * başlıklarının düzeyi (varsayılan 3).
 *
 * İZ KABI `overflow-clip`: `overflow-hidden` kabı kaydırma kabı yapar ve
 * `animation-timeline: view()` sayfayı değil o kabı izlerdi (dolum hiç
 * ilerlemezdi); `clip` kaydırma kabı yaratmaz.
 *
 * `fill="scroll"`: her çizgi parçası görünüme girerken yukarıdan aşağı dolar
 * (CSS `animation-timeline: view()`, JS yok). Desteklemeyen tarayıcıda ve
 * hareketi azaltanda doğrudan dolu. `fill="static"`: hep dolu.
 *
 * `tone="dark"`: TERS yüzeyin (`bg-strong`) üstünde; bölüm zeminini çağıran
 * verir. Açık temada koyu, koyu temada açık bölüm olur; metin `text-page`. `tone="light"` sayfa zemininde.
 *
 *   <StepRail current={2} steps={[{ icon: <Pencil />, title: "Kaydol", description: "Hesabını dakikalar içinde aç." }, …]} />
 */

export type RailStep = { icon: ReactNode; title: ReactNode; description?: ReactNode };

export function StepRail({
  steps,
  current = -1,
  headingLevel = 3,
  tone = "light",
  fill = "scroll",
  doneLabel = "Tamamlandı",
  className,
  ...props
}: {
  steps: readonly RailStep[];
  current?: number;
  headingLevel?: 2 | 3 | 4;
  tone?: "light" | "dark";
  fill?: "scroll" | "static";
  doneLabel?: string;
  "aria-label"?: string;
  className?: string;
}) {
  const dark = tone === "dark";
  const H = `h${headingLevel}` as ElementType;
  return (
    <>
      <style href="ui-step-rail" precedence="default">{`
.ui-rail-fill { transform-origin: top; }
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .ui-rail-scroll { animation: ui-rail-grow linear both; animation-timeline: view(); animation-range: entry 10% cover 45%; }
  }
}
@keyframes ui-rail-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
`}</style>
      <ol role="list" aria-label={props["aria-label"] ?? "Süreç"} className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const done = index < current;
          const here = index === current;
          const last = index === steps.length - 1;
          return (
            <li key={index} aria-current={here ? "step" : undefined} className={cn("relative flex gap-4", !last && "pb-8 sm:pb-10")}>
              {!last ? (
                <span
                  aria-hidden
                  className={cn("absolute top-11 -bottom-0 left-[1.375rem] w-1 -translate-x-1/2 overflow-clip rounded-full", dark ? "bg-page/25" : "bg-chart-track")}
                >
                  {index < current ? (
                    <span className={cn("ui-rail-fill block size-full rounded-full bg-primary", fill === "scroll" && "ui-rail-scroll")} />
                  ) : null}
                </span>
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-5",
                  done || here
                    ? "bg-primary text-on-primary"
                    : dark
                      ? "bg-page text-primary"
                      : "bg-overlay text-muted shadow-raised ring-1 ring-line",
                  here && "ring-4 ring-primary-wash",
                )}
              >
                {step.icon}
              </span>
              <div className="min-w-0 pt-1">
                <H className={cn("text-read font-medium tracking-tight", dark ? "text-page" : "text-strong")}>
                  {step.title}
                  {done ? <span className="sr-only"> ({doneLabel})</span> : null}
                </H>
                {step.description ? (
                  <p className={cn("mt-1 text-base", dark ? "text-page/70" : "text-soft")}>{step.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

