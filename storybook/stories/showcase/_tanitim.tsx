"use client";

import "./pusula.css";
import { ArrowRight, BookOpen, CalendarDays, Compass, Inbox, ListChecks, Repeat, ShoppingBag, Sparkles, Truck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Reveal, RevealItem } from "@/components/motion/Reveal";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { ArcCarousel } from "@/components/ui/arc-carousel";
import { BlurIn } from "@/components/ui/blur-in";
import { BookCover } from "@/components/ui/book-cover";
import { CornerLabel } from "@/components/ui/corner-label";
import { Dock } from "@/components/ui/dock";
import { DockingNav } from "@/components/ui/docking-nav";
import { HandCallout } from "@/components/ui/hand-callout";
import { Kbd } from "@/components/ui/kbd";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { NoticeDeck } from "@/components/ui/notice-deck";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ShotCard } from "@/components/ui/shot-card";
import { StatusIcon } from "@/components/ui/status-icon";
import { TrustLine } from "@/components/ui/trust-line";
import { EVENTS, OPEN_TICKETS, PRODUCT } from "./_data";
import { ClosingSection, FaqSection, FeaturesSection, FocusSection, H2, ProcessSection, ScreensSection, SECTION, StoriesSection, TRUST } from "./_tanitim-ek";
import { GorunumSection } from "./_tanitim-gorunum";
import { InboxScene } from "./_tanitim-sahne";
import { SergiSection } from "./_ek-q";
import { ManzaraSections } from "./_ek-s";

/**
 * Pusula'nın tanıtım sayfası (oturum açmamış ziyaretçi), Sakin Akış dilinde
 * (27 Kasım 2026, sahibinin isteği: "her ekran her sayfa yeni tasarım diline
 * uygun olsun"; yön: knowledge/design-directions.md → sakin-akis).
 *
 * Eski sayfanın mavi degrade kahramanı, cam duyuru hapı, yüzen kartları,
 * köşe maskotu, serif italik vurgusu ve renk akışlı kapanışı kalktı. Yerine:
 * sakin menü, büyük ama iki tonlu başlık (buğudan netleşir), koyu hap eylem,
 * geniş vitrinde kendi kendine oynayan gelen kutusu (asistan taslak yazar,
 * insan gönderir), sayfada denenen pencere şeridi, nasıl çalışır sekmeleri,
 * özellikler, akan ekranlar, müşteri hikâyeleri (ÖRNEK), süreç, kısayollar,
 * hazır akışlar, kişiselleştirme önizlemesi (eski süslerin GERÇEK işi),
 * rehberler, SSS ve sade kapanış. Renk yalnız bilgi taşır.
 */

type WindowId = "gelen" | "takvim" | "gorevler" | "asistan";

const WINDOWS: readonly { id: WindowId; label: string; icon: typeof Inbox }[] = [
  { id: "gelen", label: "Gelen Kutusu", icon: Inbox },
  { id: "takvim", label: "Takvim", icon: CalendarDays },
  { id: "gorevler", label: "Görevler", icon: ListChecks },
  { id: "asistan", label: "Asistan", icon: Sparkles },
];

/** Kavisli galerideki hazır akışlar; kapakları sade ikon karoları (illüstrasyon zemini yok). */
const FLOWS = [
  { id: "destek", title: "Destek Kuyruğu", meta: "Öncelik · SLA · Devir", icon: Inbox },
  { id: "satis", title: "Satış Takibi", meta: "Teklif · Sipariş · Hatırlatma", icon: ShoppingBag },
  { id: "etkinlik", title: "Etkinlik Planı", meta: "Takvim · Kayıt · Görev", icon: CalendarDays },
  { id: "iade", title: "İade ve Değişim", meta: "Talep · Onay · Kargo", icon: Repeat },
  { id: "isealim", title: "İşe Alım", meta: "Başvuru · Görüşme · Teklif", icon: UserPlus },
  { id: "tedarik", title: "Tedarik", meta: "Sipariş · Teslim · Fatura", icon: Truck },
  { id: "icerik", title: "İçerik Takvimi", meta: "Taslak · Onay · Yayın", icon: BookOpen },
] as const;

const PILL = "inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-base font-medium transition-[translate,scale,background-color] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page";

export function TanitimPage({ onSignIn }: { onSignIn: () => void }) {
  const [focus, setFocus] = useState<WindowId>("gelen");
  const tickets = OPEN_TICKETS.slice(0, 3);
  const events = EVENTS.slice(0, 3);

  return (
    <div className="min-h-dvh bg-page text-body">
      <DockingNav
        brand={
          <span className="flex items-center gap-2 text-read font-semibold tracking-tight text-strong">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-strong text-page">
              <Compass className="size-4" />
            </span>
            {PRODUCT.name}
          </span>
        }
        links={[
          { href: "#tanitim-demo", label: "Demo" },
          { href: "#tanitim-ozellik", label: "Özellikler" },
          { href: "#tanitim-gorunum", label: "Kişiselleştir" },
          { href: "#tanitim-sss", label: "SSS" },
        ]}
        action={
          <button type="button" onClick={onSignIn} className="inline-flex min-h-11 items-center rounded-full bg-strong px-4 text-small font-medium text-page pointer-fine:min-h-9">
            Giriş Yap
          </button>
        }
      />

      <main>
        {/* Kahraman: beyaz sayfa, iki tonlu büyük başlık, koyu hap eylem; altında geniş vitrin. */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-4 pt-32 pb-24 sm:px-6 sm:pt-40">
          <div className="mx-auto grid max-w-4xl justify-items-center gap-7 text-center">
            <CornerLabel>Pusula · Destek Masası</CornerLabel>
            <BlurIn as="h1" by="block" className="font-display text-[clamp(2.5rem,7vw,5.25rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance text-strong">
              Talepleri Kaybetmeden{" "}
              <br className="max-sm:hidden" />
              <span className="text-muted">Yanıtla</span>
            </BlurIn>
            <p className="max-w-xl text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-[1.6] text-body text-pretty">
              Destek, satış, görev ve takvim tek şeritte. Yeni talep açık işin yanına gelir; asistan taslağı yazar, gönderme kararı sende kalır.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={onSignIn} className={`${PILL} bg-strong text-page hover:-translate-y-px motion-reduce:hover:translate-y-0`}>
                Ücretsiz Dene <ArrowRight aria-hidden className="size-4" />
              </button>
              <a href="#tanitim-demo" className={`${PILL} bg-surface text-strong ring-1 ring-inset ring-line hover:bg-surface-raised`}>
                Demoyu Gör
              </a>
            </div>
            <TrustLine items={TRUST} />
          </div>

          <div className="relative">
            <ShotCard title="Gelen Kutusu" description="Sıradaki talep seçilir, asistan yanıtı yazar; gönderilince satır Yanıtlandı olur ve sayaç düşer." meta={["Pusula", "Canlı Ekran"]} titleAs="h2" fit={1040} inset={0.04} tone="surface">
              <InboxScene />
            </ShotCard>
            {/* Yüzen bildirim kuyunun üst kenarına oturur; sayfa genişliğini aşmaz, dar ekranda gizli. */}
            <div aria-hidden inert className="pointer-events-none absolute inset-x-0 top-0 hidden lg:block">
              <div className="absolute -top-6 right-10 flex items-center gap-2 rounded-2xl bg-overlay px-4 py-3 text-base text-strong shadow-floating ring-1 ring-line">
                <StatusIcon status="done" /> Ortalama İlk Yanıt 12 dk
              </div>
            </div>
          </div>
        </section>

        <section id="tanitim-demo" aria-labelledby="tanitim-demo-baslik" className={`${SECTION} scroll-mt-24`}>
          <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="max-w-2xl">
              <CornerLabel>Canlı Demo</CornerLabel>
              <h2 id="tanitim-demo-baslik" className={`mt-4 ${H2}`}>
                Bir Gün Tek Şeritte
              </h2>
              <p className="mt-3 text-read text-body">Alttaki raftan bir uygulama seç: şeritte onun penceresi odağa gelir.</p>
            </div>
            <NoticeDeck
              className="w-full max-w-sm shrink-0"
              label="Pusula duyuruları"
              items={[
                { id: "surum", eyebrow: "Yeni Sürüm", title: "Pusula 3.1 Yayında", body: "Pencere şeridi ve kısayol paleti." },
                { id: "canli", eyebrow: "Canlı Yayın", title: "Cuma 20.00'de Soru-Cevap" },
                { id: "arka", eyebrow: "Kişiselleştir", title: "Sekiz Yeni Arka Plan" },
              ]}
            />
          </Reveal>

          <Reveal delay={0.08} className="relative">
            <div className="mt-8 rounded-[1.75rem] bg-surface p-3 ring-1 ring-line-soft sm:p-6">
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
                    {events.map((e, i) => (
                      <li key={e.id} className="flex items-center gap-2 truncate text-micro font-medium text-strong">
                        <span aria-hidden className={`h-3 w-0.5 shrink-0 rounded-full ${["bg-chart-1", "bg-chart-4", "bg-chart-2"][i]}`} />
                        {e.title}
                      </li>
                    ))}
                  </ul>
                </AppWindow>
                <AppWindow title="Görevler" icon={<ListChecks />} focused={focus === "gorevler"} className="w-60">
                  <ul className="space-y-2 p-3 text-micro text-strong">
                    {["Atlas teklif tablosu", "Lavanta kargosu", "Kış fiyat listesi"].map((t, i) => (
                      <li key={t} className="flex items-center gap-2">
                        <StatusIcon status={i === 0 ? "progress" : "todo"} size={12} /> {t}
                      </li>
                    ))}
                  </ul>
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
            </div>
            {/* Not seçilecek yeri gösterir; tek el yazısı, sayfada başka yok. */}
            <HandCallout direction="up-left" delay={500} className="absolute top-full left-[calc(50%+4.5rem)] mt-1 hidden sm:flex">
              buradan seç
            </HandCallout>
          </Reveal>
        </section>

        <SergiSection />
        <ManzaraSections />
        <FeaturesSection />
        <ScreensSection />
        <FocusSection />
        <StoriesSection />
        <ProcessSection />

        <section id="tanitim-kisayol" aria-labelledby="tanitim-kisayol-baslik" className={`${SECTION} scroll-mt-24`}>
          <Reveal>
            <CornerLabel>Kısayollar</CornerLabel>
            <h2 id="tanitim-kisayol-baslik" className={`mt-4 ${H2}`}>
              Fareye <MarkAnnotate type="underline">Uzanmadan</MarkAnnotate>
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { keys: ["⌘", "K"], label: "Command K", text: "Talep, müşteri ya da komut ara" },
              { keys: ["⌥", "→"], label: "Option sağ ok", text: "Şeritte sonraki pencere" },
              { keys: ["⌘", "Z"], label: "Command Z", text: "Son işlemi geri al" },
            ].map((k, i) => (
              <RevealItem as="li" index={i} key={k.label} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
                <span className="flex gap-1">
                  {k.keys.map((key) => (
                    <Kbd key={key} aria-hidden>
                      {key}
                    </Kbd>
                  ))}
                </span>
                <span className="text-base text-body">
                  <span className="sr-only">{k.label}: </span>
                  {k.text}
                </span>
              </RevealItem>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tanitim-akis-baslik" className={SECTION}>
          <Reveal className="max-w-2xl">
            <CornerLabel>Hazır Akışlar</CornerLabel>
            <h2 id="tanitim-akis-baslik" className={`mt-4 ${H2}`}>
              Ekibine Uyanı Seç
            </h2>
            <p className="mt-3 max-w-md text-read text-body">Her akış kendi etiketleri, kuralları ve panosuyla gelir; ilk gün değiştirebilirsin.</p>
          </Reveal>
          <ScrollFocus>
            <ArcCarousel
              label="Hazır Akışlar"
              linkLabel="Bu Akışla Dene"
              visible={2}
              className="mt-6"
              items={FLOWS.map((flow) => {
                const Icon = flow.icon;
                return {
                  id: flow.id,
                  title: flow.title,
                  meta: flow.meta,
                  href: "#tanitim-demo",
                  media: (
                    <span className="grid size-full place-items-center bg-surface">
                      <span className="grid size-16 place-items-center rounded-2xl bg-overlay text-strong ring-1 ring-line-soft">
                        <Icon aria-hidden className="size-7" strokeWidth={1.6} />
                      </span>
                    </span>
                  ),
                };
              })}
            />
          </ScrollFocus>
        </section>

        <GorunumSection />

        <section aria-labelledby="tanitim-rehber-baslik" className={`${SECTION} grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center`}>
          <Reveal>
            <CornerLabel>Rehberler</CornerLabel>
            <h2 id="tanitim-rehber-baslik" className={`mt-4 ${H2}`}>
              Ekibin İlk Haftası İçin
            </h2>
            <p className="mt-3 max-w-md text-read text-body">Kurulumdan ilk yanıta iki kısa rehber; ekibe yeni katılan ilk gün ikisini okur.</p>
          </Reveal>
          <Reveal delay={0.08} className="flex flex-wrap justify-center gap-6 rounded-[1.75rem] bg-surface px-4 py-10 sm:gap-10">
            <BookCover title="Başlangıç Rehberi" subtitle="Gelen kutusu, görevler, takvim" author={PRODUCT.name} mark="01" width={128} />
            <BookCover tone="ink" title="Destek El Kitabı" subtitle="Yanıt dili ve öncelikler" author={PRODUCT.name} mark="02" width={128} />
          </Reveal>
        </section>

        <FaqSection />
        <ClosingSection onSignIn={onSignIn} />
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 pt-6 pb-28 text-small text-muted sm:px-6">
        <p className="flex items-center gap-2 font-medium text-strong">
          <span aria-hidden className="grid size-6 place-items-center rounded-md bg-strong text-page">
            <Compass className="size-3.5" />
          </span>
          {PRODUCT.name}
        </p>
        <p className="flex items-center gap-1.5">
          <Users aria-hidden className="size-3.5" /> Örnek ürün: tanıtım bileşenleriyle kurulmuş bir açılış sayfası.
        </p>
      </footer>
    </div>
  );
}
