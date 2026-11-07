"use client";

import { CalendarDays, Compass, Inbox, ListChecks, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { BlurIn } from "@/components/ui/blur-in";
import { BookCover } from "@/components/ui/book-cover";
import { CornerMascot } from "@/components/ui/corner-mascot";
import { Dock } from "@/components/ui/dock";
import { DockingNav } from "@/components/ui/docking-nav";
import { DriftColumns } from "@/components/ui/drift-columns";
import { HandCallout } from "@/components/ui/hand-callout";
import { Kbd } from "@/components/ui/kbd";
import { LiquidGlass, LiquidGlassButton } from "@/components/ui/liquid-glass";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { NoticeDeck } from "@/components/ui/notice-deck";
import { TrustLine } from "@/components/ui/trust-line";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper } from "@/components/ui/wallpaper";
import { EVENTS, OPEN_TICKETS, WORKSPACE } from "./_data";

/**
 * Pusula'nın tanıtım sayfası (oturum açmamış ziyaretçi). Ribbon turunun
 * (2026-11-07) parçaları bir arada: yuvaya oturan menü, bulanıktan netleşen
 * serif vurgulu başlık, görsel zemin üstünde sıvı cam eylem ve güven satırı,
 * pencere şeridi + dock ile canlı ürün maketi, el yazısı ok notu, köşe maskotu.
 * Dock'taki simgeye basınca şeritte o pencere odağa gelir: maket bir resim
 * değil, sayfada denenen küçük bir demo.
 */

type WindowId = "gelen" | "takvim" | "gorevler" | "asistan";

const WINDOWS: readonly { id: WindowId; label: string; icon: typeof Inbox }[] = [
  { id: "gelen", label: "Gelen Kutusu", icon: Inbox },
  { id: "takvim", label: "Takvim", icon: CalendarDays },
  { id: "gorevler", label: "Görevler", icon: ListChecks },
  { id: "asistan", label: "Asistan", icon: Sparkles },
];

export function TanitimPage({ onSignIn }: { onSignIn: () => void }) {
  const [focus, setFocus] = useState<WindowId>("gelen");
  const tickets = OPEN_TICKETS.slice(0, 3);
  const events = EVENTS.slice(0, 3);

  return (
    <div className="min-h-dvh bg-page">
      <DockingNav
        brand={
          <span className="flex items-center gap-2 text-read font-bold tracking-tight text-strong">
            <span aria-hidden className="grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
              <Compass className="size-4" />
            </span>
            {WORKSPACE.name}
          </span>
        }
        links={[
          { href: "#tanitim-demo", label: "Demo" },
          { href: "#tanitim-kisayol", label: "Kısayollar" },
        ]}
        action={
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex min-h-9 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta"
          >
            Giriş Yap
          </button>
        }
      />

      <main>
        <section className="relative isolate overflow-hidden px-4 pt-36 pb-24 text-center sm:pt-44 sm:pb-32">
          {/* Görsel zemin: tek renk ailesinin lekeleri. Gerçek projede çizim ya da fotoğraf. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-primary">
            <div className="absolute -top-24 left-[8%] size-96 rounded-full bg-primary-hover opacity-90 blur-3xl" />
            <div className="absolute top-32 right-[4%] size-[26rem] rounded-full bg-primary-soft opacity-50 blur-3xl" />
            <div className="absolute bottom-[-6rem] left-1/3 size-80 rounded-full bg-brand opacity-70 blur-3xl" />
          </div>
          <BlurIn as="h1" className="mx-auto max-w-4xl font-display text-[clamp(2.5rem,7vw,5.25rem)] leading-[1.05] font-semibold tracking-tight text-on-brand text-balance">
            Talepleri <em className="font-[family-name:var(--font-serif-face),serif] font-normal">kaybetmeden</em> yanıtla.
          </BlurIn>
          <p className="mx-auto mt-6 max-w-xl text-lead text-on-brand/85">
            Destek, satış, görev ve takvim tek şeritte. Yeni talep açık işin yanına gelir; hiçbir pencere küçülmez.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <LiquidGlassButton tone="media" onClick={onSignIn} className="h-12 px-7">
              Ücretsiz Dene
            </LiquidGlassButton>
            <LiquidGlass tone="media">{WORKSPACE.plan} · {WORKSPACE.seats.total} koltuk</LiquidGlass>
          </div>
          <TrustLine tone="media" className="mt-5" items={["Kart gerekmez", "2 dakikada kurulum", "Verini istediğin an dışa aktar"]} />
        </section>

        <section id="tanitim-demo" aria-labelledby="tanitim-demo-baslik" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-micro font-semibold tracking-[0.14em] text-primary-ink uppercase">Canlı Demo</p>
              <h2 id="tanitim-demo-baslik" className="mt-2 text-title font-semibold tracking-tight text-strong">
                Bir gün, tek şeritte
              </h2>
              <p className="mt-3 text-small text-soft">
                Alttaki raftan bir uygulama seç: şeritte onun penceresi odağa gelir.
              </p>
            </div>
            <HandCallout direction="down-right" className="-mb-8 hidden sm:flex">
              buradan seç
            </HandCallout>
          </div>

          <Wallpaper scene="lagoon" className="mt-4 rounded-[1.375rem] p-3 shadow-floating ring-1 ring-line sm:p-6">
            <WindowStrip role="img" aria-label={`Pusula pencereleri, odakta ${WINDOWS.find((w) => w.id === focus)?.label}`} className="h-60">
              <AppWindow title="Gelen Kutusu" icon={<Inbox />} focused={focus === "gelen"} className="w-72">
                <ul className="divide-y divide-line-soft">
                  {tickets.map((t) => (
                    <li key={t.id} className="px-3 py-2">
                      <p className="truncate text-small font-medium text-strong">{t.subject}</p>
                      <p className="text-micro text-muted">{t.id}</p>
                    </li>
                  ))}
                </ul>
              </AppWindow>
              <AppWindow title="Takvim" icon={<CalendarDays />} focused={focus === "takvim"} className="w-60">
                <ul className="space-y-1.5 p-3">
                  {events.map((e) => (
                    <li key={e.id} className="truncate rounded-md bg-primary-wash px-2 py-1 text-micro font-medium text-primary-ink">
                      {e.title}
                    </li>
                  ))}
                </ul>
              </AppWindow>
              <AppWindow title="Görevler" icon={<ListChecks />} focused={focus === "gorevler"} className="w-60">
                <div className="space-y-2 p-3">
                  <div className="h-2 w-3/4 rounded-full bg-surface" />
                  <div className="h-2 w-1/2 rounded-full bg-surface" />
                  <div className="h-2 w-2/3 rounded-full bg-surface" />
                </div>
              </AppWindow>
              <AppWindow title="Asistan" icon={<Sparkles />} ghost={focus !== "asistan"} focused={focus === "asistan"} className="w-60" />
            </WindowStrip>
            <div className="mt-6 flex justify-center">
              <Dock
                label="Pusula uygulamaları"
                onSelect={(id) => setFocus(id as WindowId)}
                items={WINDOWS.map((w) => {
                  const Icon = w.icon;
                  return { id: w.id, label: w.label, icon: <Icon className="text-body" />, active: w.id === focus };
                })}
              />
            </div>
          </Wallpaper>
        </section>

        <section aria-labelledby="tanitim-duvar-baslik" className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          <div>
            <p className="text-micro font-semibold tracking-[0.14em] text-primary-ink uppercase">Duvar Kâğıtları</p>
            <h2 id="tanitim-duvar-baslik" className="mt-2 text-title font-semibold tracking-tight text-strong">
              Masaüstün İçin Sekiz Sahne
            </h2>
            <p className="mt-3 max-w-md text-small text-soft">
              Retina masaüstü ve telefon boyutunda indir: {WALLPAPER_SCENES.map((s) => WALLPAPER_NAMES[s]).join(", ")}.
            </p>
          </div>
          <DriftColumns columns={3} duration={60} className="h-[30rem]">
            {[...WALLPAPER_SCENES, ...WALLPAPER_SCENES].map((scene, i) => (
              <figure key={i} className="overflow-hidden rounded-xl ring-1 ring-line">
                <div className="aspect-[3/4]">
                  <Wallpaper scene={scene} />
                </div>
                <figcaption className="bg-overlay px-3 py-2 text-micro font-medium text-soft">{WALLPAPER_NAMES[scene]}</figcaption>
              </figure>
            ))}
          </DriftColumns>
        </section>

        <section id="tanitim-kisayol" aria-labelledby="tanitim-kisayol-baslik" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6">
          <h2 id="tanitim-kisayol-baslik" className="text-heading font-semibold tracking-tight text-strong">
            Fareye <MarkAnnotate type="underline">uzanmadan</MarkAnnotate>
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { keys: ["⌘", "K"], label: "Command K", text: "Talep, müşteri ya da komut ara" },
              { keys: ["⌥", "→"], label: "Option sağ ok", text: "Şeritte sonraki pencere" },
              { keys: ["⌘", "Z"], label: "Command Z", text: "Son işlemi geri al" },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
                <span className="flex gap-1">
                  {s.keys.map((k) => (
                    <Kbd key={k} aria-hidden>
                      {k}
                    </Kbd>
                  ))}
                </span>
                <span className="text-small text-body">
                  <span className="sr-only">{s.label}: </span>
                  {s.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tanitim-rehber-baslik" className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center">
          <div>
            <p className="text-micro font-semibold tracking-[0.14em] text-primary-ink uppercase">Rehberler</p>
            <h2 id="tanitim-rehber-baslik" className="mt-2 text-title font-semibold tracking-tight text-strong">
              Ekibin İlk Haftası İçin
            </h2>
            <p className="mt-3 max-w-md text-small text-soft">
              Kurulumdan ilk yanıta iki kısa rehber; ekibe yeni katılan ilk gün ikisini okur.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:justify-start">
            <BookCover title="Başlangıç Rehberi" subtitle="Gelen kutusu, görevler, takvim" author={WORKSPACE.name} mark="01" width={148} />
            <BookCover tone="ink" title="Destek El Kitabı" subtitle="Yanıt dili ve öncelikler" author={WORKSPACE.name} mark="02" width={148} />
          </div>
        </section>
      </main>

      <NoticeDeck
        className="fixed bottom-4 left-4 z-30 hidden sm:block"
        label="Pusula duyuruları"
        items={[
          { id: "surum", eyebrow: "Yeni Sürüm", title: "Pusula 3.1 yayında", body: "Pencere şeridi ve kısayol paleti." },
          { id: "canli", eyebrow: "Canlı Yayın", title: "Cuma 20.00'de soru-cevap" },
          { id: "duvar", eyebrow: "Duvar Kâğıtları", title: `${WALLPAPER_SCENES.length} yeni sahne indirilebilir` },
        ]}
      />
      <CornerMascot messages={["Merhaba!", `${OPEN_TICKETS.length} talep yanıt bekliyor.`, "Demoyu denedin mi?"]} />
    </div>
  );
}
