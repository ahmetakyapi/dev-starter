"use client";

import "./pusula.css";
import { ArrowRight, CalendarDays, Compass, Inbox, ListChecks, Sparkles } from "lucide-react";
import { useState } from "react";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { ArcCarousel } from "@/components/ui/arc-carousel";
import { BlurIn } from "@/components/ui/blur-in";
import { BookCover } from "@/components/ui/book-cover";
import { Dock } from "@/components/ui/dock";
import { DockingNav } from "@/components/ui/docking-nav";
import { DriftColumns } from "@/components/ui/drift-columns";
import { CornerMascot } from "@/components/ui/corner-mascot";
import { HandCallout } from "@/components/ui/hand-callout";
import { Kbd } from "@/components/ui/kbd";
import { LiquidGlassLink } from "@/components/ui/liquid-glass";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { MeshGradient } from "@/components/ui/mesh-gradient";
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

const TRUST = ["Kart gerekmez", "2 dakikada kurulum", "Verini istediğin an dışa aktar"];

const WINDOWS: readonly { id: WindowId; label: string; icon: typeof Inbox }[] = [
  { id: "gelen", label: "Gelen Kutusu", icon: Inbox },
  { id: "takvim", label: "Takvim", icon: CalendarDays },
  { id: "gorevler", label: "Görevler", icon: ListChecks },
  { id: "asistan", label: "Asistan", icon: Sparkles },
];

/** Kavisli galerideki hazır akışlar; kapakları duvar kâğıdı sahneleri. */
const FLOWS = [
  { id: "destek", title: "Destek Kuyruğu", meta: "Öncelik · SLA · Devir" },
  { id: "satis", title: "Satış Takibi", meta: "Teklif · Sipariş · Hatırlatma" },
  { id: "etkinlik", title: "Etkinlik Planı", meta: "Takvim · Kayıt · Görev" },
  { id: "iade", title: "İade ve Değişim", meta: "Talep · Onay · Kargo" },
  { id: "isealim", title: "İşe Alım", meta: "Başvuru · Görüşme · Teklif" },
  { id: "tedarik", title: "Tedarik", meta: "Sipariş · Teslim · Fatura" },
  { id: "icerik", title: "İçerik Takvimi", meta: "Taslak · Onay · Yayın" },
] as const;

export function TanitimPage({ onSignIn }: { onSignIn: () => void }) {
  const [focus, setFocus] = useState<WindowId>("gelen");
  const tickets = OPEN_TICKETS.slice(0, 3);
  const events = EVENTS.slice(0, 3);

  return (
    <div className="min-h-dvh bg-page">
      <DockingNav
        brand={
          <span className="flex items-center gap-2 text-read font-bold tracking-tight text-strong">
            <span aria-hidden className="pusula-ink grid size-7 place-items-center rounded-lg">
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
        <section className="relative isolate overflow-hidden px-4 pt-32 pb-24 text-center sm:pt-36 sm:pb-32">
          {/* Görsel zemin: paletin koyulaştırılmış birincil tonu (pusula.css →
              .pusula-hero; her palette, iki temada beyaz metin ≥ 5,5:1) ve üstünde
              aynı ailenin yumuşak lekeleri. Eskiden `bg-primary`ti: koyu temada açık
              camgöbeğine dönüyor, beyaz başlık ve mavi düğmeler zeminde kayboluyordu. */}
          <div aria-hidden className="pusula-hero absolute inset-0 -z-10">
            <div className="absolute -top-32 left-[6%] size-[28rem] rounded-full bg-primary-soft opacity-20 blur-3xl" />
            <div className="absolute top-40 right-[2%] size-[24rem] rounded-full bg-primary opacity-20 blur-3xl" />
          </div>
          {/* Duyuru hapı: renkli zeminde cam, BASILIR (demoya iner). Eski plan
              hapı düğme gibi görünüp hiçbir şey yapmıyordu. */}
          <LiquidGlassLink tone="media" href="#tanitim-demo" className="mb-8 min-h-9 gap-2 px-4 text-small">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Yeni: Pencere Şeridi
            <ArrowRight aria-hidden className="size-3.5" />
          </LiquidGlassLink>
          <BlurIn as="h1" className="mx-auto max-w-4xl font-display text-[clamp(2.5rem,7vw,5.25rem)] leading-[1.05] font-semibold tracking-tight text-on-brand text-balance">
            Talepleri <em className="font-[family-name:var(--font-serif-face),serif] font-normal">Kaybetmeden</em> Yanıtla
          </BlurIn>
          <p className="mx-auto mt-6 max-w-xl text-lead text-on-brand/85">
            Destek, satış, görev ve takvim tek şeritte. Yeni talep açık işin yanına gelir; hiçbir pencere küçülmez.
          </p>
          {/* Renkli zeminde birincil eylem BEYAZ hap (yazısı zeminin tonunda):
              mavi üstünde mavi düğme kayboluyordu. İkincil eylem çizgili hayalet;
              eskiden yanında düğme gibi görünen ama basılmayan plan hapı vardı. */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-12 items-center rounded-full bg-on-brand px-7 text-base font-semibold shadow-floating transition-[translate,scale,box-shadow] duration-200 hover:-translate-y-px active:scale-[0.98] motion-reduce:hover:translate-y-0"
            >
              <span className="pusula-hero-ink">Ücretsiz Dene</span>
            </button>
            <a
              href="#tanitim-demo"
              className="inline-flex min-h-12 items-center rounded-full px-6 text-base font-medium text-on-brand ring-1 ring-inset ring-on-brand/40 transition-colors duration-200 hover:bg-on-brand/10"
            >
              Demoyu Gör
            </a>
          </div>
          <TrustLine tone="media" className="mt-5" items={TRUST} />
        </section>

        <section id="tanitim-demo" aria-labelledby="tanitim-demo-baslik" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-20 pb-36 sm:px-6 sm:pt-28">
          {/* Duyuru destesi bölüm başlığının yanında: eskiden ekranın sol altına
              sabitti ve kaydırınca başlıkların, kartların üstüne biniyordu. */}
          <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="max-w-2xl">
              <p className="font-mono text-small text-primary-ink">Canlı Demo</p>
              <h2 id="tanitim-demo-baslik" className="mt-3 font-display text-heading font-bold text-strong sm:text-display">
                Bir Gün, Tek Şeritte
              </h2>
              <p className="mt-3 text-read text-body">
                Alttaki raftan bir uygulama seç: şeritte onun penceresi odağa gelir.
              </p>
            </div>
            <NoticeDeck
            className="w-full max-w-sm shrink-0"
            label="Pusula duyuruları"
            items={[
              { id: "surum", eyebrow: "Yeni Sürüm", title: "Pusula 3.1 yayında", body: "Pencere şeridi ve kısayol paleti." },
              { id: "canli", eyebrow: "Canlı Yayın", title: "Cuma 20.00'de soru-cevap" },
              { id: "duvar", eyebrow: "Duvar Kâğıtları", title: `${WALLPAPER_SCENES.length} yeni sahne indirilebilir` },
            ]}
          />
          </Reveal>

          <Reveal delay={0.08} className="relative">
          <Wallpaper scene="lagoon" className="mt-8 rounded-[1.375rem] p-3 shadow-floating ring-1 ring-line sm:p-6">
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
          {/* Not, seçilecek yeri gösterir: ok rafın (dock) dibinden yukarı çıkar. Başlığın
              yanındayken duvar kâğıdının boş köşesini gösteriyordu. */}
          <HandCallout direction="up-left" delay={500} className="absolute top-full left-[calc(50%+4.5rem)] mt-1 hidden sm:flex">
            buradan seç
          </HandCallout>
          </Reveal>
        </section>

        <section aria-labelledby="tanitim-duvar-baslik" className="mx-auto grid max-w-6xl gap-10 px-4 pb-28 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          <Reveal>
            <p className="font-mono text-small text-primary-ink">Duvar Kâğıtları</p>
            <h2 id="tanitim-duvar-baslik" className="mt-3 font-display text-heading font-bold text-strong sm:text-display">
              Masaüstün İçin Sekiz Sahne
            </h2>
            <p className="mt-3 max-w-md text-read text-body">
              Retina masaüstü ve telefon boyutunda indir: {WALLPAPER_SCENES.map((s) => WALLPAPER_NAMES[s]).join(", ")}.
            </p>
          </Reveal>
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

        <section id="tanitim-kisayol" aria-labelledby="tanitim-kisayol-baslik" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-28 sm:px-6">
          <Reveal>
            <p className="font-mono text-small text-primary-ink">Kısayollar</p>
            <h2 id="tanitim-kisayol-baslik" className="mt-3 font-display text-heading font-bold text-strong sm:text-display">
              Fareye <MarkAnnotate type="underline">Uzanmadan</MarkAnnotate>
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { keys: ["⌘", "K"], label: "Command K", text: "Talep, müşteri ya da komut ara" },
              { keys: ["⌥", "→"], label: "Option sağ ok", text: "Şeritte sonraki pencere" },
              { keys: ["⌘", "Z"], label: "Command Z", text: "Son işlemi geri al" },
            ].map((s, i) => (
              <RevealItem as="li" index={i} key={s.label} className="flex items-center gap-3 rounded-xl bg-surface p-4 edge-lit">
                <span className="flex gap-1">
                  {s.keys.map((k) => (
                    <Kbd key={k} aria-hidden>
                      {k}
                    </Kbd>
                  ))}
                </span>
                <span className="text-base text-body">
                  <span className="sr-only">{s.label}: </span>
                  {s.text}
                </span>
              </RevealItem>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tanitim-akis-baslik" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="font-mono text-small text-primary-ink">Hazır Akışlar</p>
            <h2 id="tanitim-akis-baslik" className="mt-3 font-display text-heading font-bold text-strong sm:text-display">
              Ekibine Uyanı Seç
            </h2>
            <p className="mt-3 max-w-md text-read text-body">Her akış kendi etiketleri, kuralları ve panosuyla gelir; ilk gün değiştirebilirsin.</p>
          </Reveal>
          <ArcCarousel
            label="Hazır Akışlar"
            linkLabel="Bu Akışla Dene"
            visible={2}
            className="mt-6"
            items={FLOWS.map((flow, i) => ({
              id: flow.id,
              title: flow.title,
              meta: flow.meta,
              href: "#tanitim-demo",
              media: (
                <span className="relative block size-full">
                  <Wallpaper scene={WALLPAPER_SCENES[i % WALLPAPER_SCENES.length]} />
                </span>
              ),
            }))}
          />
        </section>

        <section aria-labelledby="tanitim-rehber-baslik" className="mx-auto grid max-w-6xl gap-10 px-4 pb-28 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center">
          <Reveal>
            <p className="font-mono text-small text-primary-ink">Rehberler</p>
            <h2 id="tanitim-rehber-baslik" className="mt-3 font-display text-heading font-bold text-strong sm:text-display">
              Ekibin İlk Haftası İçin
            </h2>
            <p className="mt-3 max-w-md text-read text-body">
              Kurulumdan ilk yanıta iki kısa rehber; ekibe yeni katılan ilk gün ikisini okur.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="flex flex-wrap justify-center gap-6 rounded-2xl bg-surface px-4 py-10 edge-lit sm:gap-10">
            <BookCover title="Başlangıç Rehberi" subtitle="Gelen kutusu, görevler, takvim" author={WORKSPACE.name} mark="01" width={128} />
            <BookCover tone="ink" title="Destek El Kitabı" subtitle="Yanıt dili ve öncelikler" author={WORKSPACE.name} mark="02" width={128} />
          </Reveal>
        </section>

        {/* Kapanış: sayfa kitaplarla bitip boşlukta kalıyordu. Tek eylem, altında aynı güven satırı. */}
        <section aria-labelledby="tanitim-kapanis-baslik" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <MeshGradient texture="grain" scrim className="rounded-2xl edge-lit">
          <Reveal className="grid justify-items-center gap-6 px-6 py-16 text-center sm:py-24">
            <h2 id="tanitim-kapanis-baslik" className="max-w-[16ch] font-display text-display font-bold text-balance text-strong sm:text-hero">
              İlk Talebi Bugün Yanıtla
            </h2>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex min-h-12 items-center rounded-full bg-cta px-7 text-base font-semibold text-on-brand shadow-cta transition-[translate,scale] duration-200 hover:-translate-y-px active:scale-[0.98]"
            >
              Ücretsiz Dene
            </button>
            {/* Renk zemininde küçük metin `text-body`: `text-muted` lekenin üstünde 3,4:1'de kalıyordu. */}
            <TrustLine items={TRUST} className="text-body" />
          </Reveal>
          </MeshGradient>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 pt-6 pb-28 text-small text-muted sm:px-6">
        <p className="flex items-center gap-2 font-semibold text-strong">
          <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-brand text-on-brand">
            <Compass className="size-3.5" />
          </span>
          {WORKSPACE.name}
        </p>
        <p>Örnek ürün: Tanıtım bileşenleriyle kurulmuş bir açılış sayfası.</p>
      </footer>

      <CornerMascot messages={["Merhaba!", `${OPEN_TICKETS.length} talep yanıt bekliyor.`, "Demoyu denedin mi?"]} />
    </div>
  );
}
