import { ArrowUpRight, Inbox, Layers, Plus, Settings } from "lucide-react";
import { ExampleForm } from "@/components/ExampleForm";
import { RevealItem } from "@/components/motion/Reveal";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Skeleton, SkeletonLines } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { PALETTE, getTheme } from "@/lib/theme";

/*
 * Başlangıç sayfası: şablonun kendi vitrini. Token'ları, bileşenleri ve
 * hareket dilini canlı gösterir; ilk gerçek ekran yazılınca silinir.
 *
 * Sınıf adları DİZİ İÇİNDE TAM yazılı (`"bg-surface-raised"`): Tailwind
 * kaynağı metin olarak tarar, `bg-${ad}` gibi birleştirilmiş bir ad derlenmez.
 */

/* Palet: projeye göre değişen tonlar. */
const PALETTE_SWATCHES = [
  { token: "page", className: "bg-page" },
  { token: "surface", className: "bg-surface" },
  { token: "surface-raised", className: "bg-surface-raised" },
  { token: "primary", className: "bg-primary" },
  { token: "primary-wash", className: "bg-primary-wash" },
  { token: "primary-ink", className: "bg-primary-ink" },
] as const;

const GRADIENTS = [
  { token: "display-gradient", className: "bg-(image:--display-gradient)", use: "Kısa display başlık" },
  { token: "cta-gradient", className: "bg-cta", use: "Ekranın tek birincil eylemi" },
  { token: "brand-gradient", className: "bg-brand", use: "Marka karosu" },
] as const;

/* Kimlik: her projede aynı kalan sistem rolleri ve kurallar. */
const SYSTEM_SWATCHES = [
  { token: "success", className: "bg-success" },
  { token: "warning", className: "bg-warning" },
  { token: "danger", className: "bg-danger" },
] as const;

const IDENTITY_RULES = [
  "Rol adlı tokenlar: bg-page, text-strong, border-line",
  "Derinlik gölgeyle değil ton farkıyla",
  "Degrade yalnızca üç yerde, tek renk ailesinde",
  "Tek hareket eğrisi: cubic-bezier(0.22, 1, 0.36, 1)",
  "Odak halkası 2 piksel, dokunma hedefi 44 piksel",
] as const;

const TYPE_SCALE = [
  { token: "display", className: "text-display font-bold text-strong" },
  { token: "heading", className: "text-heading font-semibold text-strong" },
  { token: "title", className: "text-title font-semibold text-strong" },
  { token: "lead", className: "text-lead text-body" },
  { token: "read", className: "text-read text-body" },
  { token: "base", className: "text-base text-soft" },
  { token: "small", className: "text-small text-muted" },
  { token: "micro", className: "text-micro text-muted" },
] as const;

const NEXT_STEPS = [
  {
    title: "Ortam Değişkenlerini Doldur",
    body: ".env.example dosyasını .env.local olarak kopyala. Boş bırakılan değer tanımsız sayılır.",
  },
  {
    title: "Temayı Projeye Uyarla",
    body: "Renk değerlerini globals.css içindeki iki tema bloğunda değiştir; sınıf adları aynı kalır.",
  },
  {
    title: "Şemayı Kur",
    body: "lib/schema.ts dosyasını düzenle, sonra npm run db:generate ile yeni bir migration üret.",
  },
  {
    title: "Girişi Aç",
    body: "AUTH_SECRET ve bir sağlayıcının anahtarlarını ekle. Korunan önekler proxy.ts içinde.",
  },
  {
    title: "Bu Sayfayı Sil",
    body: "app/page.tsx bir vitrin; ilk gerçek ekran onun yerini alsın.",
  },
] as const;

export default async function HomePage() {
  const theme = await getTheme();

  return (
    <div className="app-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="grid size-8 place-items-center rounded-sm bg-brand text-on-brand [&_svg]:size-4">
            <Layers />
          </span>
          <span className="text-base font-semibold text-strong">{SITE_NAME}</span>
        </span>
        <ThemeToggle initialTheme={theme} />
      </header>

      <main id="icerik" className="mx-auto max-w-5xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <PageHeader
          eyebrow="Next 16 Başlangıç Şablonu"
          title={SITE_NAME}
          ink
          description={SITE_DESCRIPTION}
          action={
            <a href="/api/health" className={buttonClass({ variant: "brand", size: "lg" })}>
              Sağlık Ucu
              <ArrowUpRight aria-hidden />
            </a>
          }
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Palet" meta={`Projeye göre değişir. Bu projede: ${PALETTE}`} />
            <ul className="grid grid-cols-3 gap-3">
              {PALETTE_SWATCHES.map((swatch) => (
                <li key={swatch.token} className="min-w-0">
                  <div className={`h-12 rounded-sm border border-line ${swatch.className}`} />
                  <p className="mt-1.5 truncate font-mono text-micro text-muted">{swatch.token}</p>
                </li>
              ))}
            </ul>
            <ul className="mt-5 space-y-3 border-t border-line-soft pt-5">
              {GRADIENTS.map((gradient) => (
                <li key={gradient.token} className="flex items-center gap-3">
                  <div className={`h-8 w-20 shrink-0 rounded-sm ${gradient.className}`} />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-micro text-muted">{gradient.token}</p>
                    <p className="text-small text-body">{gradient.use}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Kimlik" meta="Her projede aynı; palet değişse de dokunulmaz." />
            <ul className="grid grid-cols-3 gap-3">
              {SYSTEM_SWATCHES.map((swatch) => (
                <li key={swatch.token} className="min-w-0">
                  <div className={`h-12 rounded-sm border border-line ${swatch.className}`} />
                  <p className="mt-1.5 truncate font-mono text-micro text-muted">{swatch.token}</p>
                </li>
              ))}
            </ul>
            <ul className="mt-5 space-y-2.5 border-t border-line-soft pt-5">
              {IDENTITY_RULES.map((rule) => (
                <li key={rule} className="flex gap-2.5 text-base text-body">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {rule}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader title="Punto Ölçeği" meta="Adlar rol taşır, piksel değil." />
            <ul className="space-y-2">
              {TYPE_SCALE.map((step) => (
                <li key={step.token} className="flex items-baseline gap-3">
                  <span className="w-16 shrink-0 font-mono text-micro text-muted">{step.token}</span>
                  <span className={`min-w-0 truncate ${step.className}`}>Pijamalı hasta yağız</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader title="Düğmeler" meta="Dokunmatik ekranda her boy en az 44 piksel. Degradeli brand düğme ekranda bir kez: başlıktaki." />
            <div className="flex flex-wrap items-center gap-3">
              <Button>Birincil</Button>
              <Button variant="secondary">İkincil</Button>
              <Button variant="ghost">Sade</Button>
              <Button variant="danger">Sil</Button>
              <Button disabled>Devre Dışı</Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary">
                Küçük
              </Button>
              <Button size="md" variant="secondary">
                Orta
              </Button>
              <Button size="lg">
                <Plus aria-hidden />
                Büyük
              </Button>
              <Button size="icon" variant="ghost" aria-label="Ayarlar">
                <Settings aria-hidden />
              </Button>
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader title="Form Alanı" meta="Sunucu eylemi, zod doğrulaması ve hız sınırı." />
            <ExampleForm />
          </Panel>

          <Panel>
            <PanelHeader title="Boş Durum" />
            <EmptyState
              icon={<Inbox aria-hidden />}
              title="Henüz Kayıt Yok"
              hint="İlk kaydı eklediğinde burada listelenecek."
              action={
                <Button size="sm">
                  <Plus aria-hidden />
                  Kayıt Ekle
                </Button>
              }
            />
          </Panel>

          <Panel aria-busy="true">
            <PanelHeader title="Yükleme İskeleti" meta="Gelecek içeriğin şeklini tutar." />
            <div className="space-y-6">
              {[0, 1].map((row) => (
                <div key={row} className="flex gap-4">
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <SkeletonLines className="flex-1 pt-1" lines={3} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader title="Sonraki Adımlar" meta="Görünüme girince sırayla gelir." />
            <ol className="divide-y divide-line-soft">
              {NEXT_STEPS.map((step, index) => (
                <RevealItem key={step.title} as="li" index={index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-wash font-mono text-small text-primary-ink">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-read font-semibold">{step.title}</h3>
                    <p className="mt-1 text-base text-soft">{step.body}</p>
                  </div>
                </RevealItem>
              ))}
            </ol>
          </Panel>
        </div>

        <p className="mt-12 font-mono text-micro text-muted">Next 16 · React 19 · Tailwind 4 · Motion 13 · Drizzle</p>
      </main>
    </div>
  );
}
