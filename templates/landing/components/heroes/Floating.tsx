import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { hero } from "@/lib/content";
import { HeroActions, HeroEyebrow, HeroTitle } from "./shared";

/**
 * floating: ortada başlık, çevresinde hafif döndürülmüş, kenara taşan süzülen
 * ürün kartları. Süzülen kartlar süs: `aria-hidden`, `md` altında gizli.
 * Telefonda aynı veri boş bırakılmaz: başlığın altında yatay, yapışmalı bir
 * şerit (`md:hidden`) iki kartı (huni + haftalık kapanan) gerçek içerik olarak
 * gösterir; hero ilk ekranı doldurur ama aşmaz.
 *
 * Kart içerikleri `hero.board` (ÖRNEK veri) ve `hero.stats`'tan gelir; yeni
 * veri alanı yok.
 */
export function FloatingHero() {
  const { funnel, closed, thread } = hero.board;
  const peak = Math.max(...closed.weekly);
  const first = funnel.stages[0];
  const last = funnel.stages[funnel.stages.length - 1];
  return (
    <section id="ust" aria-label="Giriş" className="relative isolate">
      <FloatCards className="lg:min-h-[calc(100dvh-4rem)] md:min-h-[34rem]">
        <FloatCard at={{ left: "3%", top: "12%" }} rotate={-5} depth={1} className="w-60">
          <p className="text-micro text-muted">{funnel.title}</p>
          <p className="mt-1 text-display font-semibold text-strong tabular-nums">{first.value.toLocaleString("tr-TR")}</p>
          <p className="text-micro text-muted">
            {first.label} → {last.label}: {last.value.toLocaleString("tr-TR")}
          </p>
        </FloatCard>
        <FloatCard at={{ right: "2%", top: "8%" }} rotate={4} depth={2} delay={2} className="w-64">
          <p className="text-micro text-muted">{closed.title}</p>
          <div className="mt-3 flex h-16 items-end gap-1.5">
            {closed.weekly.map((value, i) => (
              <span key={closed.days[i]} className="flex-1 rounded-sm bg-primary" style={{ height: `${(value / peak) * 100}%` }} />
            ))}
          </div>
          <p className="mt-2 text-micro text-muted">
            {closed.value} · {closed.delta}
          </p>
        </FloatCard>
        <FloatCard at={{ left: "4%", bottom: "8%" }} rotate={3} depth={2} delay={4} className="w-64">
          <p className="text-small font-semibold text-strong">{thread.title}</p>
          <ul className="mt-2 space-y-1.5">
            {thread.steps.map((step) => (
              <li key={step.label} className="flex items-center justify-between gap-3 text-micro text-body">
                <span>{step.label}</span>
                <span className="text-muted tabular-nums">{step.time}</span>
              </li>
            ))}
          </ul>
        </FloatCard>
        <FloatCard at={{ right: "5%", bottom: "10%" }} rotate={-4} depth={1} delay={1} className="w-52">
          {hero.stats.items.slice(0, 2).map((item) => (
            <div key={item.label} className="first:mb-3">
              <p className="text-micro text-muted">{item.label}</p>
              <p className="text-lead font-semibold text-strong tabular-nums">{item.value}</p>
            </div>
          ))}
        </FloatCard>
        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 pt-14 pb-8 text-center sm:px-6 md:py-20">
          <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
          <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
          <p className="mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8 justify-center" />
        </div>
        <ul className="relative z-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-10 md:hidden [scrollbar-width:none]" aria-label="Panodan örnekler">
          <li className="w-64 shrink-0 snap-center rounded-xl border border-line bg-overlay p-4 shadow-raised">
            <p className="text-micro text-muted">{funnel.title}</p>
            <p className="mt-1 text-display font-semibold text-strong tabular-nums">{first.value.toLocaleString("tr-TR")}</p>
            <p className="text-micro text-muted">
              {first.label} → {last.label}: {last.value.toLocaleString("tr-TR")}
            </p>
          </li>
          <li className="w-64 shrink-0 snap-center rounded-xl border border-line bg-overlay p-4 shadow-raised">
            <p className="text-micro text-muted">{closed.title}</p>
            <div className="mt-3 flex h-14 items-end gap-1.5">
              {closed.weekly.map((value, i) => (
                <span key={closed.days[i]} className="flex-1 rounded-sm bg-primary" style={{ height: `${(value / peak) * 100}%` }} />
              ))}
            </div>
            <p className="mt-2 text-micro text-muted">
              {closed.value} · {closed.delta}
            </p>
          </li>
        </ul>
      </FloatCards>
    </section>
  );
}
