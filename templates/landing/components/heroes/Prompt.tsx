import { CalendarClock, Mail, MessageCircle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { EdgeBlur } from "@/components/ui/edge-blur";
import { OfferCard } from "@/components/ui/offer-card";
import { PromptBar } from "@/components/ui/prompt-bar";
import { Wallpaper } from "@/components/ui/wallpaper";
import { hero, heroScenes } from "@/lib/content";

/** Kapsam çiplerinin ikonu (içerikte ikon tutulmaz: düz veri kalır). */
const SCOPE_ICONS: Record<string, ReactNode> = {
  "e-posta": <Mail aria-hidden />,
  form: <CalendarClock aria-hidden />,
  sohbet: <MessageCircle aria-hidden />,
};

/**
 * prompt: "anlat, gerisini o yapsın". Ortalı künye hapı + sıkı başlık, altında
 * NİYET ÇUBUĞU (`PromptBar`: yaz → kapsam çiplerini aç/kapa → gönder) ve
 * hemen altında kenarları kademeli buğulu (`EdgeBlur`) yatay şablon kartı
 * şeridi (`OfferCard`). Ürünün girdisi doğal dilse (yapay zekalı planlayıcı,
 * otomasyon kurucu, arama): ziyaretçi ilk ekranda neyi yazacağını görür,
 * kartlar "hazır başlangıçlar" der. Manzara turu (2026-11-28).
 *
 * NEDEN BÖYLE: çubuk sayfanın tek odağı (tek birincil eylem); kartlar
 * çubuğun altında ve sayfa kenarından taşar, kenar buğusu "devamı var" der
 * ama metni kesmez (buğu yalnız kenardaki kartın dış yarısında). Kart
 * görselleri illüstrasyon (`Wallpaper`), fotoğraf yok.
 *
 * Çubuk `onSubmit` almaz: sunucu bileşeni; yerel form `hero.primary.href`e
 * GET ile gider (`q`, `kapsam`). Gerçek üründe o adres planlayıcının kendisi.
 * Kartların sayıları ÖRNEK. Başlık (LCP) düz metin.
 */
export function PromptHero() {
  const p = heroScenes.prompt;
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate overflow-clip">
      <div aria-hidden className="prompt-mist pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem]" />
      <div className="mx-auto grid max-w-4xl justify-items-center px-4 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="inline-flex items-center gap-2 rounded-md bg-overlay px-3 py-1.5 text-small text-body ring-1 ring-line ring-inset">
          <Sparkles aria-hidden className="size-3.5 text-primary-ink" />
          {p.badge}
        </p>
        <h1 className="mt-6 text-display font-semibold text-balance text-strong sm:text-hero" style={{ letterSpacing: "-0.055em" }}>
          {hero.title.map((line) => (
            <span key={line.text} className="block">
              {line.text}
            </span>
          ))}
        </h1>
        <p className="mt-5 max-w-xl text-lead text-muted text-pretty">{hero.description}</p>
        <PromptBar
          className="mt-9 w-full max-w-2xl min-w-0 text-left"
          action={hero.primary.href}
          placeholder={p.placeholder}
          submitLabel={p.submitLabel}
          scopes={p.scopes.map((scope) => ({ ...scope, icon: SCOPE_ICONS[scope.value] }))}
          defaultScopes={[...p.defaultScopes]}
        />
      </div>
      <EdgeBlur scrollable label="Hazır akış şablonları" className="mt-14 sm:mt-16" inset="max(1rem, calc((100% - 72rem) / 2))" listClassName="gap-4 pb-6 sm:gap-5" itemClassName="w-64 shrink-0 sm:w-72">
        {p.cards.map((card) => (
          <OfferCard
            key={card.title}
            title={card.title}
            headingLevel={2}
            tag={card.tag}
            media={<Wallpaper scene={card.scene} className="size-full" />}
            rating={{ value: card.rating }}
            meta={[card.meta]}
            price={card.price}
            priceUnit={card.unit}
            action={{ label: p.cardAction, href: hero.primary.href }}
          />
        ))}
      </EdgeBlur>
    </section>
  );
}
