"use client";

import { Bell, CalendarDays, Inbox, Palette } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { AppWindow } from "@/components/ui/app-window";
import { ArtMat } from "@/components/ui/art-mat";
import { CornerLabel } from "@/components/ui/corner-label";
import { CornerMascot } from "@/components/ui/corner-mascot";
import { DriftColumns } from "@/components/ui/drift-columns";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { HorizonScene } from "@/components/ui/horizon-scene";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { Switch } from "@/components/ui/switch";
import { ToneText } from "@/components/ui/tone-text";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper, type WallpaperScene } from "@/components/ui/wallpaper";
import { cn } from "@/lib/utils";
import { EVENTS, OPEN_TICKETS, clock, shortDate } from "./_data";

/**
 * Tanıtım → "Kişiselleştir" bölümü (Sakin Akış geçişi, 27 Kasım 2026).
 * Eski sayfada süs olan parçalar burada GERÇEK bir özelliğin önizlemesi:
 * Pusula'nın masaüstü arka planı. Seçenekler solda (sekiz illüstrasyon,
 * "Renk Akışı" ve kolajlı "Çizim Kağıdı" (`art-mat`)), önizleme sağda: pencere manzaranın arkasından doğar
 * (`horizon-scene`), üstünde masaüstü bildirimleri süzülür (`float-cards`),
 * görselin üstündeki tek eylem cam buton (`liquid-glass`), "Yardımcı Simge"
 * açılınca köşede maskot (`corner-mascot`). Altında indirilebilir sahneler
 * yavaşça akar (`drift-columns`: galeri içerikse süs değil).
 * Hareket azaltmada akış, süzülme ve renk akışı durur (bileşenlerin kendisi).
 */

type Choice = WallpaperScene | "akis" | "kagit";

export function GorunumSection() {
  const [choice, setChoice] = useState<Choice>("lagoon");
  const [helper, setHelper] = useState(false);
  const [applied, setApplied] = useState(false);
  const ticket = OPEN_TICKETS[0];
  const event = EVENTS[1];
  const options: { id: Choice; label: string }[] = [...WALLPAPER_SCENES.map((s) => ({ id: s as Choice, label: WALLPAPER_NAMES[s] })), { id: "akis", label: "Renk Akışı" }, { id: "kagit", label: "Çizim Kağıdı" }];
  const scene =
    choice === "akis" ? (
      <MeshGradient tone="primary" intensity="vivid" className="size-full" />
    ) : choice === "kagit" ? (
      <ArtMat variant="grid" className="size-full" />
    ) : (
      <Wallpaper scene={choice} className="size-full" />
    );
  const label = options.find((o) => o.id === choice)?.label ?? "";

  return (
    <section id="tanitim-gorunum" aria-labelledby="tanitim-gorunum-baslik" className="mx-auto grid max-w-6xl scroll-mt-24 grid-cols-1 gap-10 px-4 pb-28 sm:px-6">
      <Reveal className="max-w-2xl">
        <CornerLabel>Kişiselleştir</CornerLabel>
        <ToneText as="h2" className="mt-4 font-display text-heading font-semibold tracking-[-0.03em] text-strong sm:text-display">
          <span id="tanitim-gorunum-baslik">
            Masaüstün <ToneText.Soft>Senin Gibi Dursun</ToneText.Soft>
          </span>
        </ToneText>
        <p className="mt-3 max-w-md text-read text-body">Arka planı seç; pencere, bildirimler ve yardımcı simge önizlemede hemen değişir.</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-4">
        {/* Seçenekler önizlemenin üstünde tek sıra (telefonda 5'li iki sıra): on seçenek yetim bırakmaz. */}
        <fieldset className="grid gap-3 rounded-2xl bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
          <legend className="sr-only">Arka plan</legend>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-10">
            {options.map((o) => (
              <label key={o.id} className="group grid cursor-pointer gap-1.5">
                <input
                  type="radio"
                  name="tanitim-arka-plan"
                  value={o.id}
                  checked={choice === o.id}
                  onChange={() => {
                    setChoice(o.id);
                    setApplied(false);
                  }}
                  className="peer sr-only"
                />
                <span className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-line transition-shadow duration-200 peer-checked:ring-2 peer-checked:ring-strong peer-focus-visible:ring-2 peer-focus-visible:ring-line-focus">
                  {o.id === "akis" ? (
                    <MeshGradient tone="primary" intensity="vivid" className="absolute inset-0 size-full" />
                  ) : o.id === "kagit" ? (
                    <ArtMat variant="grid" className="absolute inset-0" />
                  ) : (
                    <Wallpaper scene={o.id} className="absolute inset-0" />
                  )}
                </span>
                <span className="truncate text-small text-muted peer-checked:text-strong">{o.label}</span>
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-overlay px-4 py-1 ring-1 ring-line-soft sm:w-64">
            <Switch label="Yardımcı Simge" hint="Köşede küçük asistan; tıklayınca ipucu verir" checked={helper} onChange={(e) => setHelper(e.currentTarget.checked)} />
          </div>
        </fieldset>

        {/* Önizleme: pencere manzaranın arkasından doğar; bildirimler süzülür; tek eylem cam buton. */}
        <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-surface ring-1 ring-line-soft">
          <HorizonScene
            peek="md"
            fade="md"
            frame={
              <AppWindow title="Gelen Kutusu" icon={<Inbox />} className="mx-auto w-full max-w-lg">
                <ul className="divide-y divide-line-soft">
                  {OPEN_TICKETS.slice(0, 3).map((t) => (
                    <li key={t.id} className="px-3 py-2">
                      <p className="truncate text-small font-medium text-strong">{t.subject}</p>
                      <p className="text-micro text-muted">{t.id}</p>
                    </li>
                  ))}
                </ul>
              </AppWindow>
            }
            scene={scene}
          >
            <p className="flex items-center justify-center gap-2 pt-6 text-small text-muted">
              <Palette aria-hidden className="size-3.5" /> Önizleme · {label}
            </p>
          </HorizonScene>
          <FloatCards className="pointer-events-none absolute inset-0">
            <FloatCard at={{ left: "4%", top: "30%" }} rotate={-3} depth={1} className="w-52 rounded-xl bg-overlay p-3 text-start shadow-floating ring-1 ring-line max-sm:hidden">
              <p className="flex items-center gap-1.5 text-micro text-muted">
                <Bell aria-hidden className="size-3.5" /> Yeni Talep
              </p>
              <p className="mt-1 truncate text-small font-medium text-strong">{ticket.subject}</p>
            </FloatCard>
            <FloatCard at={{ right: "4%", top: "42%" }} rotate={3} depth={1} delay={1.4} className="w-52 rounded-xl bg-overlay p-3 text-start shadow-floating ring-1 ring-line max-sm:hidden">
              <p className="flex items-center gap-1.5 text-micro text-muted">
                <CalendarDays aria-hidden className="size-3.5" /> {shortDate.format(event.date)} · {clock.format(event.date)}
              </p>
              <p className="mt-1 truncate text-small font-medium text-strong">{event.title}</p>
            </FloatCard>
          </FloatCards>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <LiquidGlassButton tone="media" onClick={() => setApplied(true)} className="min-h-11 px-5 text-small">
              {applied ? "Arka Plan Uygulandı" : "Arka Planı Uygula"}
            </LiquidGlassButton>
          </div>
          {helper && <CornerMascot className="absolute right-4 bottom-4" label="Yardımcı simgeye merhaba de" messages={["Merhaba!", "Bugün 3 talep acil.", "Kısayollar için ⌘K."]} />}
          <span role="status" className="sr-only">
            {applied ? `${label} arka plan olarak uygulandı` : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] bg-surface p-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:p-8">
        <div>
          <h3 className="text-read font-medium text-strong">Sekiz Sahneyi İndir</h3>
          <p className="mt-1 max-w-sm text-base text-muted">Retina masaüstü ve telefon boyutunda: {WALLPAPER_SCENES.map((s) => WALLPAPER_NAMES[s]).join(", ")}.</p>
        </div>
        <DriftColumns columns={3} duration={70} className={cn("h-72")}>
          {[...WALLPAPER_SCENES, ...WALLPAPER_SCENES].map((s, i) => (
            <figure key={i} className="overflow-hidden rounded-xl bg-overlay ring-1 ring-line-soft">
              <div className="aspect-[3/4]">
                <Wallpaper scene={s} />
              </div>
              <figcaption className="px-3 py-2 text-micro text-muted">{WALLPAPER_NAMES[s]}</figcaption>
            </figure>
          ))}
        </DriftColumns>
      </div>
    </section>
  );
}
