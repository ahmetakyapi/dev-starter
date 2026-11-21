"use client";

import { ArrowRight, BarChart3, CalendarClock, Inbox, LifeBuoy, Mail, PenLine, Search, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Announcement } from "@/components/ui/announcement";
import { AppWindow } from "@/components/ui/app-window";
import { Badge } from "@/components/ui/badge";
import { CornerLabel } from "@/components/ui/corner-label";
import { DockingNav } from "@/components/ui/docking-nav";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { FocusStack, type FocusItem } from "@/components/ui/focus-stack";
import { HorizonScene } from "@/components/ui/horizon-scene";
import { LiquidGlassLink } from "@/components/ui/liquid-glass";
import { Marquee } from "@/components/ui/marquee";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { PatternBackground } from "@/components/ui/pattern-bg";
import { Sparkline } from "@/components/ui/sparkline";
import { Stat, StatGrid } from "@/components/ui/stat";
import { StatStrip } from "@/components/ui/stat-strip";
import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";
import { cn } from "@/lib/utils";

/**
 * Kahraman sahneleri: her biri tam sayfa bir açılış üst bölümü. Markalar
 * kurgusal, logolar düz kelime işareti, sayılar "ÖRNEK" (guides/08). Zemin
 * yalnız `wallpaper`, `mesh-gradient` ve token; üçüncü taraf görsel yok.
 */

const PRIMARY_BTN =
  "inline-flex h-11 items-center gap-2 rounded-full bg-cta px-5 text-base font-medium text-on-brand shadow-cta outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";
const SECOND_BTN =
  "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-overlay px-5 text-base font-medium text-strong shadow-raised outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";

/** Menü bağlantılarının gittiği sayfa içi duraklar (ölü `#` yok). */
export function Anchors() {
  return (
    <>
      <section id="ozellikler" className="bg-page px-6 py-16 text-center">
        <h2 className="text-heading font-medium text-strong">Özellikler</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-muted">Menü bağlantısının gittiği bölüm; örnek sayfada yalnız hedef olarak durur.</p>
      </section>
      <section id="fiyat" className="bg-surface px-6 py-16 text-center">
        <h2 className="text-heading font-medium text-strong">Fiyat</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-muted">İkinci hedef bölüm.</p>
      </section>
    </>
  );
}

/** Kurgusal kelime işaretleri: farklı ağırlık ve harf aralığı, hepsi metin. */
const MARKS = [
  { name: "Kuzeyenerji", cls: "font-display text-lg italic" },
  { name: "VOLTİS", cls: "text-base font-extrabold tracking-wider" },
  { name: "Yeşilakış", cls: "text-lg font-bold tracking-tight" },
  { name: "terravolt", cls: "font-mono text-base tracking-tight" },
  { name: "Akarsu Grid", cls: "text-base font-light tracking-[0.2em] uppercase" },
] as const;

function LogoStrip({ tone = "default", label = "Güvenen kuruluşlar" }: { tone?: "default" | "media"; label?: string }) {
  return (
    <div className="w-full">
      <p className={cn("text-center text-small", tone === "media" ? "text-on-brand/80" : "text-muted")}>{label}</p>
      <Marquee label={`${label}, örnek markalar`} duration={36} control className={cn("mt-4", tone === "media" ? "text-on-brand/80" : "text-soft")}>
        {MARKS.map((mark) => (
          <span key={mark.name} className={cn("whitespace-nowrap", mark.cls)}>
            {mark.name}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

const Brand = ({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "media" }) => (
  <span className={cn("text-read font-bold tracking-tight", tone === "media" ? "text-on-brand" : "text-strong")}>{children}</span>
);

/* 1 — Atmosfer ------------------------------------------------------------ */

export function AtmosphereHero() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-strong">
      <Wallpaper scene="mesh" className="absolute inset-0 -z-20" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim/45" />
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Brand tone="media">Kuzeyenerji</Brand>
        <a href="#fiyat" className="rounded-full bg-overlay px-4 py-2 text-small font-medium text-strong shadow-raised">
          Demo İste
        </a>
      </header>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <ToneText as="h1" tone="media" className="text-hero font-medium">
          Modern işletmeler için <em className="font-display">enerji</em> zekâsı
        </ToneText>
        <p className="mt-5 max-w-xl text-lead text-on-brand/85">Tüketimi izle, maliyeti düşür, anlık veriyle daha akıllı sürdürülebilirlik kararları ver.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <LiquidGlassLink tone="media" href="#ozellikler" className="h-11 px-5 text-base font-medium">
            Demo İste
          </LiquidGlassLink>
          <a href="#fiyat" className="inline-flex h-11 items-center rounded-full border border-on-brand/35 bg-scrim/50 px-5 text-base font-medium text-on-brand backdrop-blur-sm">
            Panoyu Gör
          </a>
        </div>
      </div>
      <div className="px-6 pb-10 sm:px-10">
        <LogoStrip tone="media" />
      </div>
    </section>
  );
}

/* 2 — Süzülen kartlar ----------------------------------------------------- */

const CARD = "rounded-2xl border border-line bg-overlay p-4 shadow-floating";

export function FloatCardsHero() {
  return (
    <section className="relative isolate bg-page">
      <PatternBackground pattern="dot-grid" fade="center" glow="spotlight" tone="primary" className="-z-10" />
      <div className="flex justify-center px-6 pt-8">
        <Announcement href="#ozellikler" tag="Yeni">
          Dört yeni rapor şablonu yayında
        </Announcement>
      </div>
      <FloatCards className="md:min-h-[38rem]">
        <FloatCard at={{ left: "7%", top: "12%" }} rotate={-5} depth={1} className={cn(CARD, "w-64")}>
          <Stat label="Aylık Gelir" value="1.240.000" unit="₺" change={2.4} changeLabel="Geçen Aya Göre" />
        </FloatCard>
        <FloatCard at={{ right: "6%", top: "9%" }} rotate={4} depth={2} delay={1.2} className={cn(CARD, "w-60")}>
          <p className="text-small text-muted">Kampanya Durumu</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="success" dot>
              Yayında
            </Badge>
            <Badge tone="warning" dot>
              Onay Bekliyor
            </Badge>
          </div>
        </FloatCard>
        <FloatCard at={{ left: "9%", bottom: "9%" }} rotate={3} depth={2} delay={0.6} className={cn(CARD, "w-72")}>
          <p className="text-small text-muted">Son 30 Gün</p>
          <Sparkline values={[12, 18, 14, 22, 20, 28, 26, 34, 31, 40]} title="Son 30 gün satış eğrisi, örnek veri" width={220} height={48} className="mt-2" />
        </FloatCard>
        <FloatCard at={{ right: "8%", bottom: "11%" }} rotate={-3} depth={1} delay={1.8} className={cn(CARD, "w-64")}>
          <Stat label="Açık Talep" value="38" change={-6} changeLabel="Dünden" positiveIsGood={false} />
        </FloatCard>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center px-6 pt-14 pb-8 text-center md:min-h-[38rem] md:py-16">
          <ToneText as="h1" className="text-hero font-medium">
            Satışın işletim sistemi, <em className="font-display">tek</em> panoda
          </ToneText>
          <p className="mt-5 max-w-lg text-lead text-muted">Aday, kampanya ve gelir takibini tek yerde topla; ekip aynı sayıya bakar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#fiyat" className={SECOND_BTN}>
              Demo İste
            </a>
            <a href="#ozellikler" className={PRIMARY_BTN}>
              Ücretsiz Dene
              <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>
        <ul aria-label="Panodan örnekler" className="relative z-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-10 md:hidden [scrollbar-width:none]">
          <li className={cn(CARD, "w-64 shrink-0 snap-center")}>
            <Stat label="Aylık Gelir" value="1.240.000" unit="₺" change={2.4} changeLabel="Geçen Aya Göre" />
          </li>
          <li className={cn(CARD, "w-64 shrink-0 snap-center")}>
            <Stat label="Açık Talep" value="38" change={-6} changeLabel="Dünden" positiveIsGood={false} />
          </li>
          <li className={cn(CARD, "w-64 shrink-0 snap-center")}>
            <p className="text-small text-muted">Son 30 Gün</p>
            <Sparkline values={[12, 18, 14, 22, 20, 28, 26, 34, 31, 40]} title="Son 30 gün satış eğrisi, örnek veri" width={200} height={48} className="mt-2" />
          </li>
        </ul>
      </FloatCards>
    </section>
  );
}

/* 3 — Odak yığını --------------------------------------------------------- */

const AGENTS: readonly FocusItem[] = [
  { id: "satis", icon: <Search />, title: "Satış Ajanı", subtitle: "Aday araştırma ve ilk temas" },
  { id: "destek", icon: <LifeBuoy />, title: "Destek Ajanı", subtitle: "Talepleri etiketle ve yönlendir" },
  { id: "fatura", icon: <Wallet />, title: "Fatura Ajanı", subtitle: "Gelen faturaları eşleştir" },
  { id: "takvim", icon: <CalendarClock />, title: "Takvim Ajanı", subtitle: "Toplantı saatlerini bul" },
  { id: "rapor", icon: <BarChart3 />, title: "Rapor Ajanı", subtitle: "Haftalık özeti hazırla" },
  { id: "posta", icon: <Mail />, title: "Posta Ajanı", subtitle: "Yanıt taslaklarını yaz" },
];

export function FocusStackHero() {
  return (
    <MeshGradient tone="primary" intensity="soft" as="section" className="min-h-dvh">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ToneText as="h1" className="text-hero font-medium">
            İnsanların yapmasına gerek olmayan işleri <em className="font-display">ajanlara</em> ver
          </ToneText>
          <p className="mt-5 max-w-lg text-lead text-body">İş birikiyor, ekip sürekli bağlam değiştiriyor. Tekrarlayan akışları otomatiğe al.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#fiyat" className={SECOND_BTN}>
              Bize Yaz
            </a>
            <a href="#ozellikler" className={PRIMARY_BTN}>
              Şablonu Al
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">
          <FocusStack label="Hazır ajanlar" items={AGENTS} />
        </div>
      </div>
    </MeshGradient>
  );
}

/* 4 — Köşe etiketi -------------------------------------------------------- */

export function CornerLabelHero() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col justify-end overflow-hidden bg-strong">
      <Wallpaper scene="silk" className="absolute inset-0 -z-20" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-scrim/35" />
      <DockingNav
        brand={<Brand>Netiz</Brand>}
        links={[
          { href: "#ozellikler", label: "Ürün" },
          { href: "#fiyat", label: "Fiyat" },
        ]}
        action={
          <a href="#fiyat" className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta">
            Demo İste
          </a>
        }
      />
      <div className="px-6 pb-14 sm:px-16 sm:pb-20">
        <CornerLabel tone="media">Birleşik karar katmanı</CornerLabel>
        <ToneText as="h1" tone="media" className="mt-8 max-w-4xl text-hero font-medium">
          Önemli olanı gör.
          <br />
          Kesinlikle karar ver.
        </ToneText>
        <p className="mt-6 max-w-lg text-lead text-on-brand/85">Dağınık veriyi tek katmanda topla; ekip aynı sayıya bakıp aynı kararı versin.</p>
        <a href="#fiyat" className={cn(PRIMARY_BTN, "mt-8")}>
          Demo İste
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </div>
    </section>
  );
}

/* 5 — Ufuk ---------------------------------------------------------------- */

export function HorizonHero() {
  return (
    <div className="bg-page">
      <header className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5">
        <nav aria-label="Ana menü" className="flex gap-5 text-base text-body">
          <a href="#ozellikler">Hizmetler</a>
          <a href="#fiyat">Fiyat</a>
        </nav>
        <Brand>Statik</Brand>
        <div className="flex justify-end">
          <a href="#fiyat" className="inline-flex h-10 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta">
            Görüşme Ayarla
          </a>
        </div>
      </header>
      <HorizonScene
        peek="lg"
        fade="lg"
        frame={
          <AppWindow title="Onay Kuyruğu" icon={<Inbox />} focused>
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_16rem]">
              <ul className="grid gap-2">
                {["Bahar kampanyası, kare 1", "Bahar kampanyası, kare 2", "İndirim bülteni"].map((item) => (
                  <li key={item} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 text-base text-strong">
                    {item}
                    <Badge tone="success" dot>
                      Onaylandı
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-line p-4 text-center">
                <PenLine aria-hidden className="mx-auto size-5 text-primary-ink" />
                <p className="mt-2 text-base font-medium text-strong">İnceleme Tamamlandı</p>
                <p className="mt-1 text-small text-muted">10 kavram onaylandı. Özete geçilebilir.</p>
              </div>
            </div>
          </AppWindow>
        }
        scene={
          <div
            className="size-full [[data-theme=dark]_&]:brightness-50"
            style={{ maskImage: "linear-gradient(to bottom, transparent 0%, transparent 38%, black 80%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 38%, black 80%)" }}
          >
            <Wallpaper scene="paper" className="size-full" />
          </div>
        }
      >
        <ToneText as="h1" className="text-hero font-medium">
          Harcamayla birlikte büyüyen <em className="font-display">kreatif</em> üretim
        </ToneText>
        <p className="mx-auto mt-5 max-w-xl text-lead text-muted">Veriye dayalı reklam kavramları, açılış sayfaları ve e-postalar. İstek üzerine yeni açılar.</p>
        <a href="#fiyat" className={cn(PRIMARY_BTN, "mt-8")}>
          Görüşme Ayarla
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </HorizonScene>
    </div>
  );
}

/* 6 — Bej finans ---------------------------------------------------------- */

export function BeigeFinanceHero() {
  return (
    <section
      className="relative isolate min-h-dvh overflow-hidden"
      style={{
        background:
          "radial-gradient(46rem 30rem at 100% -8%, color-mix(in srgb, var(--accent-warm) 34%, transparent), transparent 62%), radial-gradient(40rem 28rem at -6% 62%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 60%), color-mix(in srgb, var(--accent-warm) 9%, var(--page-bg))",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <header className="flex justify-center pt-6">
          <div className="flex w-full max-w-lg items-center justify-between rounded-full bg-overlay py-2 pr-2 pl-5 shadow-raised">
            <Brand>Sinais</Brand>
            <a href="#fiyat" className="inline-flex h-9 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta">
              Uygulamayı Aç
            </a>
          </div>
        </header>
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <ToneText as="h1" className="text-hero font-medium">
            Herkes için <ToneText.Soft>sade finans</ToneText.Soft> yönetimi
          </ToneText>
          <p className="mx-auto mt-5 max-w-lg text-lead text-body">Varlıkların üzerinde tam ve güvenli denetim, kolayca.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#ozellikler" className={PRIMARY_BTN}>
              Başla
            </a>
            <a href="#fiyat" className={SECOND_BTN}>
              Demo İste
            </a>
          </div>
        </div>
        <AppWindow title="Raporlar" icon={<BarChart3 />} focused className="mx-auto mt-14 max-w-4xl">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <StatGrid>
                <Stat label="Toplam Gider" value="678,23" unit="₺" change={10.5} changeLabel="Geçen Aya Göre" positiveIsGood={false} />
              </StatGrid>
              <Sparkline values={[8, 6, 9, 7, 12, 10, 14]} title="Gider eğrisi, örnek veri" width={240} height={40} className="mt-3" />
            </div>
            <div className="rounded-xl border border-line p-4">
              <StatGrid>
                <Stat label="Toplam Gelir" value="15.000" unit="₺" change={9.5} changeLabel="Geçen Aya Göre" />
              </StatGrid>
              <Sparkline values={[10, 11, 11, 13, 12, 15, 16]} title="Gelir eğrisi, örnek veri" width={240} height={40} className="mt-3" />
            </div>
          </div>
        </AppWindow>
        <div className="mx-auto mt-14 max-w-4xl">
          <LogoStrip label="Birlikte çalıştığımız kurumlar" />
        </div>
        <div className="mx-auto mt-14 max-w-4xl">
          <StatStrip
            items={[
              { value: "480+", label: "Şirket (ÖRNEK)" },
              { value: "%72", label: "Daha hızlı raporlama (ÖRNEK)" },
              { value: "2,4 mr", label: "İşlenen veri, ₺ (ÖRNEK)" },
            ]}
          />
          <p className="mt-4 text-center text-small text-muted">Bu sayılar örnektir; yayına çıkmadan önce kaynaklı gerçek sayılarla değiştir.</p>
        </div>
      </div>
    </section>
  );
}

/** Hikayeler bu parçayı sarar: hero + menünün gittiği duraklar. */
export function Scene({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page text-body">
      <main>{children}</main>
      <Anchors />
    </div>
  );
}
