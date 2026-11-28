import { ArrowRight, ChevronRight, SendHorizontal, Sparkles, Truck } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { Wallpaper } from "@/components/ui/wallpaper";
import { WorkflowTrace } from "@/components/ui/workflow-trace";
import { hero, heroScenes, SAMPLE_NOTE } from "@/lib/content";

/**
 * flow: ortalı başlık, altında GÖRSEL PANEL (Çayır sahnesi + üst kenarda nokta
 * matrisi) ve panelin içinde iki çalışan kart: bir talebin iş akışı izi
 * (`WorkflowTrace`, görününce adım adım dolar) ve asistanın konuşması.
 * Ürün "işi kendisi yapıyorsa" (otomasyon, ajan, entegrasyon): okur sonucu
 * değil SÜRECİ görür. Manzara turu (2026-11-28).
 *
 * NEDEN BÖYLE: başlık sade ve ortalı, görsel yük panelde. Panel manzara
 * olduğu için kartlar "ekran görüntüsü" değil sergilenen nesne gibi durur;
 * kartlar cam paspartuda (yarı saydam kenar), manzara kenardan görünür.
 * Telefonda yalnız iş akışı izi kalır, konuşma kartı gizlenir (iki kart
 * yan yana sığmıyor, alt alta panel çok uzuyor).
 *
 * Konuşma kartı süs (`aria-hidden`): giriş kutusu çalışmaz, bilgi iş akışı
 * izinde ve başlıkta. İz `section` + `ol`, sonuç `role="status"`. Veri ÖRNEK
 * (`heroScenes.flow.sample`), panelin köşesinde künye. Başlık (LCP) düz metin.
 */
export function FlowHero() {
  const { badge, trace, chat } = heroScenes.flow;
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-clip">
      <div className="mx-auto grid max-w-4xl justify-items-center px-4 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="inline-flex items-center gap-2 rounded-sm bg-overlay px-3 py-1.5 text-small text-body ring-1 ring-line ring-inset">
          {badge}
          <span aria-hidden className="size-2.5 rounded-[3px] bg-surface ring-1 ring-line" />
        </p>
        <h1 className="mt-6 text-display font-medium text-balance text-strong sm:text-hero">
          {hero.title.map((line) => line.text).join(" ")}
        </h1>
        <p className="mt-6 max-w-2xl text-lead text-body text-pretty">{hero.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={hero.primary.href} className={buttonClass({ variant: "brand", size: "lg" })}>
            {hero.primary.label}
            <ArrowRight aria-hidden />
          </a>
          {hero.secondary ? (
            <a href={hero.secondary.href} className={buttonClass({ variant: "ghost", size: "lg", className: "ring-1 ring-line ring-inset" })}>
              {hero.secondary.label}
              <ChevronRight aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:mt-16 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-xl">
          <Wallpaper scene="meadow" className="scene-dim absolute inset-0 -z-10" />
          <div aria-hidden className="matrix-veil absolute inset-0 -z-10" />
          <span className="absolute top-3 right-3 rounded-full bg-strong/55 px-2.5 py-1 text-micro font-medium text-on-brand backdrop-blur-sm">
            {SAMPLE_NOTE}
          </span>
          <div className="grid gap-4 px-3 py-10 sm:px-8 sm:py-16 md:grid-cols-2 lg:px-24">
            <div className="rounded-xl bg-on-brand/25 p-1.5 ring-1 ring-on-brand/35 backdrop-blur-md ring-inset">
              <WorkflowTrace
                title={trace.title}
                subtitle={trace.subtitle}
                label={trace.label}
                icon={<Truck aria-hidden className="size-4" />}
                steps={trace.steps}
                result={trace.result}
                animate
                headingLevel={2}
                className="h-full"
              />
            </div>
            <div aria-hidden className="hidden rounded-xl bg-on-brand/25 p-1.5 ring-1 ring-on-brand/35 backdrop-blur-md ring-inset md:block">
              <div className="flex h-full flex-col rounded-lg bg-overlay shadow-raised">
                <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
                  <span className="grid size-8 place-items-center rounded-md bg-surface text-primary-ink">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="grid text-left">
                    <span className="text-read font-medium text-strong">{chat.title}</span>
                    <span className="text-small text-muted">{chat.subtitle}</span>
                  </span>
                  <span className="ml-auto size-2 rounded-full bg-success" />
                </div>
                <ul className="grid flex-1 content-start gap-3 p-4 text-left">
                  {chat.messages.map((message) =>
                    message.from === "user" ? (
                      <li key={message.text} className="justify-self-end rounded-lg rounded-br-sm bg-cta px-3.5 py-2.5 text-small text-on-brand shadow-cta">
                        {message.text}
                      </li>
                    ) : (
                      <li key={message.text} className="flex max-w-[88%] items-start gap-2.5">
                        <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary-wash text-primary-ink">
                          <Sparkles className="size-3" />
                        </span>
                        <span className="rounded-lg rounded-tl-sm bg-overlay px-3.5 py-2.5 text-small text-body ring-1 ring-line">{message.text}</span>
                      </li>
                    ),
                  )}
                </ul>
                <div className="m-3 mt-0 flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-small text-muted ring-1 ring-line-soft ring-inset">
                  <Sparkles className="size-3.5" />
                  <span className="truncate">{chat.placeholder}</span>
                  <span className="ml-auto grid size-7 place-items-center rounded-md bg-strong text-page">
                    <SendHorizontal className="size-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
