import { ArrowRight, Bell, CalendarCheck, ChartPie, Inbox, MessageCircle, Repeat, Truck } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { DeviceFrame, DeviceRow } from "@/components/ui/device-frame";
import { GlossArc, GlossTile } from "@/components/ui/gloss-tile";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero, heroScenes, SAMPLE_NOTE } from "@/lib/content";

const ARC = [
  { icon: Inbox, tone: "chart-1" },
  { icon: CalendarCheck, tone: "chart-2" },
  { icon: Truck, tone: "chart-3" },
  { icon: Repeat, tone: "chart-4" },
  { icon: Bell, tone: "chart-5" },
  { icon: MessageCircle, tone: "chart-6" },
] as const;

/**
 * devices: koyu gece sahnesi (temayla dönmez), ortalı künye + başlık + iki
 * eylem, altında yan yana üç telefon (`DeviceRow`; telefonda yalnız
 * ortadaki): solda akış sağlığı halkası, ortada ana ekranın sayıları, sağda
 * parlak ikon yayı (`GlossArc`) üstünde kısa söz. Ürünün mobil yüzü satışı
 * yapıyorsa (kişisel finans, takip, bildirim). Manzara turu (2026-11-28).
 *
 * NEDEN BÖYLE: üç ekran "uygulamada ne var"ı tek bakışta anlatır; ortadaki
 * büyük ve önde, yandakiler küçük ve içe dönük (derinlik). Ekranlar gerçek
 * token'la çizilir, ekran görüntüsü değil. Telefonlar alttan sahne kenarına
 * kırpılır: ilk ekran yüksekliği aşılmaz.
 *
 * Sahne süs; telefon içerikleri `inert` (bağlantı yok, odak almaz), anlam
 * `DeviceRow` etiketinde. Sayılar ÖRNEK. Başlık (LCP) düz metin.
 */
export function DevicesHero() {
  const d = heroScenes.devices;
  const angle = Math.round((d.score.value / 100) * 360);
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-hidden bg-strong">
      <Wallpaper scene="mesh" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim" />
      <div className="mx-auto grid max-w-4xl justify-items-center px-4 pt-20 text-center sm:px-6 sm:pt-28">
        <p className="inline-flex items-center gap-2 rounded-full bg-on-brand/10 py-1 pr-3 pl-1 text-small text-on-brand ring-1 ring-on-brand/20 backdrop-blur-sm ring-inset">
          <span className="rounded-full bg-on-brand px-2 py-0.5 text-micro font-semibold text-chart-ink">{d.badge}</span>
          {d.badgeText}
        </p>
        <h1 className="mt-6 text-display font-medium text-balance text-on-brand sm:text-hero">
          {hero.title.map((line) => line.text).join(" ")}
        </h1>
        <p className="mt-6 max-w-2xl text-lead text-on-brand/80 text-pretty">{hero.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={hero.primary.href} className={buttonClass({ variant: "brand", size: "lg" })}>
            {hero.primary.label}
            <ArrowRight aria-hidden />
          </a>
          {hero.secondary ? (
            <a
              href={hero.secondary.href}
              className={buttonClass({ variant: "ghost", size: "lg", className: "border border-on-brand/35 bg-on-brand/10 text-on-brand backdrop-blur-sm hover:bg-on-brand/20 hover:text-on-brand" })}
            >
              {hero.secondary.label}
            </a>
          ) : null}
        </div>
      </div>

      <div className="devices-stage relative mx-auto mt-14 h-[30rem] max-w-5xl overflow-hidden px-4 sm:mt-16 sm:h-[34rem] sm:px-6">
        <span className="absolute top-0 right-6 z-10 rounded-full bg-on-brand/15 px-2.5 py-1 text-micro font-medium text-on-brand">{SAMPLE_NOTE}</span>
        <DeviceRow label="Uygulamanın üç ekranı: akış sağlığı, ana ekran ve kısayollar" className="pt-6">
          <DeviceFrame size={250} tone="dark">
            <div inert className="grid gap-3 px-4 pt-3 text-left">
              <p className="text-small font-medium">{d.greeting}</p>
              <div className="grid place-items-center rounded-lg bg-page/5 py-5 ring-1 ring-page/10">
                <div className="grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-chart-2) ${angle}deg, color-mix(in oklab, var(--color-page) 12%, transparent) 0)` }}>
                  <div className="grid size-[5.6rem] place-items-center rounded-full bg-strong text-center">
                    <span className="text-title font-semibold tabular-nums">{d.score.value}</span>
                    <span className="-mt-3 text-micro opacity-70">{d.score.label}</span>
                  </div>
                </div>
              </div>
              {d.queue.slice(0, 2).map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-md bg-page/5 px-3 py-2 text-small ring-1 ring-page/10">
                  <span className="opacity-80">{row.label}</span>
                  <span className="font-medium tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          </DeviceFrame>
          <DeviceFrame size={290}>
            <div inert className="grid gap-3 px-4 pt-3 text-left text-body">
              <div className="flex items-center justify-between">
                <p className="text-read font-semibold text-strong">{d.greeting}</p>
                <ChartPie aria-hidden className="size-4 text-muted" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {d.figures.map((figure) => (
                  <div key={figure.label} className="rounded-lg bg-surface p-3">
                    <p className="text-micro text-muted">{figure.label}</p>
                    <p className="mt-1 text-title font-semibold text-strong tabular-nums">{figure.value}</p>
                    <p className="mt-1 inline-flex rounded-full bg-success-wash px-1.5 text-micro font-medium text-success">{figure.delta}</p>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-small font-medium text-strong">Sırada</p>
              <ul className="grid gap-1.5">
                {d.queue.map((row) => (
                  <li key={row.label} className="flex items-center justify-between rounded-md bg-surface px-3 py-2.5 text-small">
                    <span>{row.label}</span>
                    <span className="font-medium text-strong tabular-nums">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </DeviceFrame>
          <DeviceFrame size={250} tone="dark">
            <div inert className="relative grid h-full content-start text-left">
              <div className="relative h-44 overflow-hidden">
                <GlossArc tiles={ARC} count={6} radius={220} arc={110} size="md" className="absolute inset-x-0 top-6" />
              </div>
              <div className="px-4">
                <GlossTile icon={Inbox} tone="primary" size="sm" />
                <p className="mt-3 text-title leading-tight font-semibold">Akışın Bir Bakışta</p>
                <p className="mt-2 text-small opacity-75">Talepler, görevler ve kargo tek ekranda; değişince haber verir.</p>
              </div>
            </div>
          </DeviceFrame>
        </DeviceRow>
      </div>
    </section>
  );
}
