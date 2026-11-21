"use client";

import { CalendarDays, Inbox, Link2, ListChecks, Pencil, Reply, Sparkles, Users } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { AppWindow } from "@/components/ui/app-window";
import { Avatar } from "@/components/ui/avatar";
import { CornerLabel } from "@/components/ui/corner-label";
import { BentoGrid, FeatureTile, GlassFrame } from "@/components/ui/feature-tile";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { FocusStack } from "@/components/ui/focus-stack";
import { HorizonScene } from "@/components/ui/horizon-scene";
import { StatStrip } from "@/components/ui/stat-strip";
import { StepRail } from "@/components/ui/step-rail";
import { StoryCard, StoryGrid } from "@/components/ui/story-card";
import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";
import { CUSTOMERS, EVENTS, OPEN_TICKETS, TICKET_STUBS, TEAM, clock, customer, num, periodStats, shortDate } from "./_data";

/**
 * Pusula tanıtım sayfasının ikinci dalga bölümleri (Socialscale, Synais,
 * StatiQ, Forge turları): süzülen kartlar, bento özellikler, müşteri
 * hikâyeleri, adım rayı + sayı şeridi, odak yığını, ufuk sahnesi. Rakamlar
 * elle yazılmaz, Pusula verisinden türetilir (guides/08 → veri dürüstlüğü);
 * müşteri sözleri örnek veridir ve "ÖRNEK" künyelidir.
 */

const SECTION = "mx-auto max-w-6xl px-4 pb-28 sm:px-6";
const H2 = "font-display text-heading font-bold text-strong sm:text-display";

/** Kahramanın iki yanında süzülen üç kart; süs, `lg` altında gizli. */
export function HeroFloatCards() {
  const ticket = OPEN_TICKETS[0];
  const event = EVENTS[1];
  const stats = periodStats("ay");
  return (
    <FloatCards className="absolute inset-0 -z-[5]">
      <FloatCard at={{ left: "3%", top: "22%" }} rotate={-5} depth={2} className="w-56 rounded-xl bg-overlay p-3 text-start text-strong max-lg:hidden">
        <p className="truncate text-small font-medium">{ticket.subject}</p>
        <p className="mt-0.5 text-micro text-muted">
          {ticket.id} · {customer(ticket.customerId).name}
        </p>
      </FloatCard>
      <FloatCard at={{ right: "3%", top: "26%" }} rotate={4} depth={2} delay={1.2} className="w-56 rounded-xl bg-overlay p-3 text-start text-strong max-lg:hidden">
        <p className="flex items-center gap-1.5 text-micro text-muted">
          <CalendarDays aria-hidden className="size-3.5" />
          {shortDate.format(event.date)} · {clock.format(event.date)}
        </p>
        <p className="mt-1 truncate text-small font-medium">{event.title}</p>
      </FloatCard>
      <FloatCard at={{ left: "8%", bottom: "9%" }} rotate={3} depth={1} delay={2.4} className="w-48 rounded-xl bg-overlay p-3 text-start text-strong max-lg:hidden">
        <p className="text-micro text-muted">Bu ay gelen talep</p>
        <p className="text-title font-semibold tabular-nums">{num.format(stats.ticketCount)}</p>
      </FloatCard>
    </FloatCards>
  );
}

/** Bento özellikler: dört karo, gerçek Pusula verisiyle dolu sahneler. */
export function FeaturesSection() {
  const tickets = OPEN_TICKETS.slice(0, 2);
  const events = EVENTS.slice(0, 3);
  return (
    <section aria-labelledby="tanitim-ozellik-baslik" className={SECTION}>
      <Reveal className="max-w-2xl">
        <CornerLabel>Özellikler</CornerLabel>
        <ToneText as="h2" className={`mt-4 ${H2}`}>
          Bütün iş <ToneText.Soft>tek şeritte toplanır</ToneText.Soft>
        </ToneText>
        <span id="tanitim-ozellik-baslik" className="sr-only">
          Bütün iş tek şeritte toplanır
        </span>
      </Reveal>
      <Reveal delay={0.08} className="mt-8">
        <BentoGrid>
          <FeatureTile
            tone="brand"
            title="Gelen Kutusu"
            description="Talepler önceliğe ve müşteriye göre sıralanır; yanıt süresi her satırda görünür."
            media={
              <GlassFrame>
                <ul className="grid gap-2">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <Inbox aria-hidden className="size-4 shrink-0 text-muted" />
                      <span className="min-w-0">
                        <span className="block truncate text-small font-medium">{t.subject}</span>
                        <span className="block text-micro text-muted">{t.id}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassFrame>
            }
          />
          <FeatureTile
            tone="light"
            title="Takvim"
            description="Teslimat, görüşme ve numune aynı ajandada; çakışanlar yan yana durur."
            media={
              <div className="grid gap-2 rounded-xl bg-overlay p-3 shadow-raised">
                {events.map((e) => (
                  <p key={e.id} className="truncate rounded-md bg-primary-wash px-2 py-1 text-micro font-medium text-primary-ink">
                    {shortDate.format(e.date)} · {e.title}
                  </p>
                ))}
              </div>
            }
          />
          <FeatureTile
            tone="dark"
            title="Görevler"
            description="Ekip panosu, kişisel liste ve son tarihler aynı kaynaktan okunur."
            media={
              <GlassFrame>
                <p className="flex items-center gap-2 text-small font-medium">
                  <ListChecks aria-hidden className="size-4 text-muted" />
                  Sürüyor kolonu en fazla 4 iş alır
                </p>
              </GlassFrame>
            }
          />
          <FeatureTile
            tone="light"
            title="Asistan"
            description="Geciken siparişler için müşteri e-postasını taslak olarak yazar; göndermeden önce sen okursun."
            media={
              <div className="flex items-center gap-2 rounded-xl bg-overlay p-3 shadow-raised">
                <Sparkles aria-hidden className="size-4 text-primary-ink" />
                <p className="text-small text-body">Taslak hazır: Atlas Konaklama, 2 gün gecikme</p>
              </div>
            }
          />
        </BentoGrid>
      </Reveal>
    </section>
  );
}

/** Müşteri hikâyeleri: örnek veri, "ÖRNEK" künyeli; rakam Pusula verisinden. */
export function StoriesSection() {
  const [a, b, c] = CUSTOMERS;
  const year = periodStats("yil");
  const person = (name: string) => ({ name, avatar: <Avatar name={name} size="sm" /> });
  return (
    <section aria-labelledby="tanitim-hikaye-baslik" className={SECTION}>
      <Reveal className="mx-auto max-w-2xl text-center">
        <ToneText as="h2" className={H2}>
          Ekipler Pusula'yı <ToneText.Soft>nasıl kullanıyor</ToneText.Soft>
        </ToneText>
        <span id="tanitim-hikaye-baslik" className="sr-only">
          Müşteri hikâyeleri (örnek)
        </span>
      </Reveal>
      <Reveal delay={0.08} className="mt-8">
        <StoryGrid>
          <StoryCard
            sample
            tone="photo"
            background={<Wallpaper scene="dunes" />}
            logo={a.name}
            quote="Talepler artık kaybolmuyor; her yanıtın bir sahibi ve bir saati var."
            author={person(a.contact)}
            href="#tanitim-demo"
          />
          <StoryCard sample tone="plain" logo={b.name} quote="Teslimat ve görüşme aynı takvimde olunca telefonla sormamıza gerek kalmadı." author={{ name: b.contact, role: b.name }} href="#tanitim-demo" />
          <StoryCard sample tone="plain" logo={c.name} quote="Kış listesini panoda sürükleyerek planladık." author={{ name: c.contact, role: c.name }} href="#tanitim-demo" />
          <StoryCard
            tone="stat"
            background={<Wallpaper scene="lagoon" />}
            logo="Pusula"
            quote="Son on iki ayda Pusula'da kapanan talepler."
            stat={{ value: num.format(year.quality.resolved), label: "çözülen talep" }}
            href="#tanitim-demo"
          />
        </StoryGrid>
      </Reveal>
    </section>
  );
}

/** Koyu bant: adım rayı ve türetilmiş sayı şeridi. */
export function ProcessSection() {
  const year = periodStats("yil");
  return (
    <section aria-labelledby="tanitim-surec-baslik" className={SECTION}>
      <div className="rounded-2xl bg-strong px-6 py-12 text-page sm:px-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <Reveal>
            {/* Ters yüzey: açık temada koyu, koyu temada açık. Metin `text-page`; `tone="media"` sabit beyaz olduğu için açık yüzeyde kaybolurdu. */}
            <p className="font-mono text-small tracking-[0.12em] uppercase opacity-75">Süreç</p>
            <h2 id="tanitim-surec-baslik" className="mt-4 font-display text-heading font-bold text-balance text-page sm:text-display">
              Beş adımda ilk yanıta
            </h2>
            <p className="mt-3 max-w-md text-read opacity-75">Kurulum bir öğleden sonra sürer; ekip ilk gün gelen kutusuna girer.</p>
          </Reveal>
          <StepRail
            tone="dark"
            current={2}
            aria-label="Pusula kurulum adımları"
            steps={[
              { icon: <Pencil />, title: "Kaydol", description: "Çalışma alanını aç." },
              { icon: <Link2 />, title: "Kanalları bağla", description: "E-posta, telefon ve web formu." },
              { icon: <Reply />, title: "İlk talebi yanıtla", description: "Şablonlardan başla." },
              { icon: <CalendarDays />, title: "Takvime işle", description: "Teslimat ve görüşmeler." },
              { icon: <Users />, title: "Ekibi ekle", description: "Rol ver, kuyruğu paylaş." },
            ]}
          />
        </div>
        <StatStrip
          tone="dark"
          numberClassName="font-semibold"
          className="mt-12"
          items={[
            { value: num.format(TICKET_STUBS.length), label: "talep kaydı" },
            { value: num.format(CUSTOMERS.length), label: "müşteri" },
            { value: num.format(year.quality.resolved), label: "çözülen talep, son 12 ay" },
            { value: num.format(TEAM.length), label: "ekip üyesi" },
          ]}
        />
      </div>
    </section>
  );
}

/** Odak yığını: açık talepler sırayla öne gelir. */
export function FocusSection() {
  const items = OPEN_TICKETS.slice(0, 7).map((t) => ({
    id: t.id,
    icon: <Inbox aria-hidden />,
    title: t.subject,
    subtitle: `${customer(t.customerId).name} · ${t.id}`,
  }));
  return (
    <section aria-labelledby="tanitim-odak-baslik" className={`${SECTION} grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center`}>
      <Reveal>
        <CornerLabel>Gelen kutusu</CornerLabel>
        <ToneText as="h2" className={`mt-4 ${H2}`}>
          <span id="tanitim-odak-baslik">Sıradaki talep <ToneText.Soft>hep odakta</ToneText.Soft></span>
        </ToneText>
        <p className="mt-3 max-w-md text-read text-body">Açık talepler sırayla öne gelir; üzerine gelince döngü durur, ok tuşlarıyla sen gezersin.</p>
      </Reveal>
      <Reveal delay={0.08}>
        <FocusStack label="Açık talepler" items={items} itemHeight={76} className="mx-auto w-full max-w-md" />
      </Reveal>
    </section>
  );
}

/** Ufuk sahnesi: ürün penceresi manzaranın arkasından doğar, sayfa zeminine solar. */
export function HorizonSection({ onSignIn }: { onSignIn: () => void }) {
  const tickets = OPEN_TICKETS.slice(0, 3);
  return (
    <HorizonScene
      className="mb-16"
      frame={
        <AppWindow title="Gelen Kutusu" icon={<Inbox />} focused className="mx-auto w-full max-w-2xl">
          <ul className="divide-y divide-line-soft">
            {tickets.map((t) => (
              <li key={t.id} className="px-3 py-2">
                <p className="truncate text-small font-medium text-strong">{t.subject}</p>
                <p className="text-micro text-muted">{t.id}</p>
              </li>
            ))}
          </ul>
        </AppWindow>
      }
      scene={<Wallpaper scene="alpine" className="size-full" />}
    >
      <ToneText as="h2" className="font-display text-display font-bold text-balance text-strong">
        Pazartesi sabahı <ToneText.Soft>sakin başlar</ToneText.Soft>
      </ToneText>
      <p className="mx-auto mt-4 max-w-md text-read text-body">Yanıt bekleyen talepler, bugünün teslimatları ve açık işler tek bakışta.</p>
      <button
        type="button"
        onClick={onSignIn}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-cta px-7 text-base font-semibold text-on-brand shadow-cta transition-[translate,scale] duration-200 hover:-translate-y-px active:scale-[0.98]"
      >
        Ücretsiz Dene
      </button>
    </HorizonScene>
  );
}
