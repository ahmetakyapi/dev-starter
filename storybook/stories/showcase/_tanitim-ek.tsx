"use client";

import { CalendarDays, Inbox, Link2, ListChecks, Pencil, Reply, Sparkles, Users } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { CornerLabel } from "@/components/ui/corner-label";
import { BentoGrid, FeatureTile } from "@/components/ui/feature-tile";
import { FocusStack } from "@/components/ui/focus-stack";
import { LikeButton } from "@/components/ui/like-button";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ShotCard } from "@/components/ui/shot-card";
import { StatStrip } from "@/components/ui/stat-strip";
import { StepRail } from "@/components/ui/step-rail";
import { StoryCard, StoryGrid } from "@/components/ui/story-card";
import { ToneText } from "@/components/ui/tone-text";
import { TrustLine } from "@/components/ui/trust-line";
import { MetricsScene, RepliesScene } from "../_lib/sahneler";
import { CUSTOMERS, EVENTS, OPEN_TICKETS, TICKET_STUBS, TEAM, customer, num, periodStats, shortDate } from "./_data";

/**
 * Pusula tanıtım sayfasının bölümleri, Sakin Akış dilinde (27 Kasım 2026;
 * yön: knowledge/design-directions.md → sakin-akis). Kural: kart gri kuyu +
 * beyaz karo, gölge yerine kıl halka, hiyerarşi tonla (güçlü / soluk),
 * renk yalnız bilgi taşır, başlıklar Title Case ve virgülsüz. Rakamlar elle
 * yazılmaz, Pusula verisinden türetilir (guides/08 → veri dürüstlüğü);
 * müşteri sözleri örnek veridir ve "ÖRNEK" künyelidir.
 */

export const SECTION = "mx-auto max-w-6xl px-4 pb-28 sm:px-6";
export const H2 = "font-display text-heading font-semibold tracking-[-0.03em] text-strong sm:text-display";
export const TRUST = ["Kart gerekmez", "2 dakikada kurulum", "Verini istediğin an dışa aktar"];
const TILE = "rounded-xl bg-overlay p-3 ring-1 ring-line-soft";

/** Özellikler: dört sakin karo (gri kuyu), içinde beyaz karoda gerçek Pusula verisi. */
export function FeaturesSection() {
  const tickets = OPEN_TICKETS.slice(0, 2);
  const events = EVENTS.slice(0, 3);
  return (
    <section id="tanitim-ozellik" aria-labelledby="tanitim-ozellik-baslik" className={`${SECTION} scroll-mt-24`}>
      <Reveal className="max-w-2xl">
        <CornerLabel>Özellikler</CornerLabel>
        <ToneText as="h2" className={`mt-4 ${H2}`}>
          <span id="tanitim-ozellik-baslik">
            Bütün İş <ToneText.Soft>Tek Şeritte Toplanır</ToneText.Soft>
          </span>
        </ToneText>
      </Reveal>
      <Reveal delay={0.08} className="mt-8">
        <BentoGrid>
          <FeatureTile
            tone="light"
            mediaAlign="center"
            title="Gelen Kutusu"
            description="Talepler önceliğe ve müşteriye göre sıralanır; yanıt süresi her satırda görünür."
            media={
              <ul className={`grid gap-2 ${TILE}`}>
                {tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Inbox aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="block truncate text-small font-medium text-strong">{t.subject}</span>
                      <span className="block text-micro text-muted">
                        {t.id} · {customer(t.customerId).name}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            }
          />
          <FeatureTile
            tone="light"
            mediaAlign="center"
            title="Takvim"
            description="Teslimat, görüşme ve numune aynı ajandada; çakışanlar yan yana durur."
            media={
              <div className={`grid gap-1.5 ${TILE}`}>
                {events.map((e, i) => (
                  <p key={e.id} className="flex items-center gap-2 truncate text-small text-strong">
                    <span aria-hidden className={`h-3.5 w-0.5 shrink-0 rounded-full ${["bg-chart-1", "bg-chart-4", "bg-chart-2"][i]}`} />
                    <span className="text-muted tabular-nums">{shortDate.format(e.date)}</span> {e.title}
                  </p>
                ))}
              </div>
            }
          />
          <FeatureTile
            tone="light"
            mediaAlign="center"
            title="Görevler"
            description="Ekip panosu, kişisel liste ve son tarihler aynı kaynaktan okunur."
            media={
              <p className={`flex items-center gap-2 text-small font-medium text-strong ${TILE}`}>
                <ListChecks aria-hidden className="size-4 text-muted" />
                Sürüyor kolonu en fazla 4 iş alır
              </p>
            }
          />
          <FeatureTile
            tone="light"
            mediaAlign="center"
            title="Asistan"
            description="Geciken siparişler için müşteri e-postasını taslak olarak yazar; göndermeden önce sen okursun."
            media={
              <div className={`flex items-center gap-2 ${TILE}`}>
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

/** Akan ekranlar: kendi kendine oynayan iki ürün ekranı, kaydırınca buğudan netleşir. */
export function ScreensSection() {
  return (
    <section aria-labelledby="tanitim-ekran-baslik" className={SECTION}>
      <Reveal className="max-w-2xl">
        <CornerLabel>Ekranlar</CornerLabel>
        <ToneText as="h2" className={`mt-4 ${H2}`}>
          <span id="tanitim-ekran-baslik">
            Asistan Önerir <ToneText.Soft>Karar Sende Kalır</ToneText.Soft>
          </span>
        </ToneText>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ScrollFocus>
          <ShotCard title="Yanıt Şablonları" description="Önce hazır seçenek, sonra doğal dil; asistan önerileri aynı kuyuda." meta={["Gelen Kutusu", "Yapay Zeka"]} titleAs="h3" fit={620} tone="surface" actions={<LikeButton count={31} />}>
            <RepliesScene />
          </ShotCard>
        </ScrollFocus>
        <ScrollFocus>
          <ShotCard title="Metrik Sekmeleri" description="Başlık bir yargı cümlesi; sekme değişince grafik ve hüküm birlikte döner." meta={["Raporlar", "Pano"]} titleAs="h3" fit={760} tone="surface" actions={<LikeButton count={22} />}>
            <MetricsScene />
          </ShotCard>
        </ScrollFocus>
      </div>
    </section>
  );
}

/** Müşteri hikâyeleri: örnek veri, "ÖRNEK" künyeli; rakam Pusula verisinden. Fotoğraf zemini yok. */
export function StoriesSection() {
  // Dört sakin alıntı kartı (ÖRNEK); sayı kartı yok: çözülen talep sayısı Süreç şeridinde, veriden.
  const [a, b, c, d] = CUSTOMERS;
  const person = (name: string) => ({ name, avatar: <Avatar name={name} size="sm" /> });
  return (
    <section aria-labelledby="tanitim-hikaye-baslik" className={SECTION}>
      <Reveal className="mx-auto max-w-2xl text-center">
        <ToneText as="h2" className={H2}>
          Ekipler Pusula'yı <ToneText.Soft>Nasıl Kullanıyor</ToneText.Soft>
        </ToneText>
        <span id="tanitim-hikaye-baslik" className="sr-only">
          Müşteri hikâyeleri (örnek)
        </span>
      </Reveal>
      <Reveal delay={0.08} className="mt-8">
        <StoryGrid>
          <StoryCard sample tone="plain" logo={a.name} quote="Talepler artık kaybolmuyor; her yanıtın bir sahibi ve bir saati var." author={person(a.contact)} href="#tanitim-demo" />
          <StoryCard sample tone="plain" logo={b.name} quote="Teslimat ve görüşme aynı takvimde olunca telefonla sormamıza gerek kalmadı." author={{ name: b.contact, role: b.name }} href="#tanitim-demo" />
          <StoryCard sample tone="plain" logo={c.name} quote="Kış listesini panoda sürükleyerek planladık." author={{ name: c.contact, role: c.name }} href="#tanitim-demo" />
          <StoryCard sample tone="plain" logo={d.name} quote="Asistanın taslağını okuyup göndermek, sıfırdan yazmaktan hızlı; son sözü yine biz söylüyoruz." author={{ name: d.contact, role: d.name }} href="#tanitim-demo" />
        </StoryGrid>
      </Reveal>
    </section>
  );
}

/** Süreç: açık gri kuyuda adım rayı ve türetilmiş sayı şeridi (koyu bant yerine). */
export function ProcessSection() {
  const year = periodStats("yil");
  return (
    <section aria-labelledby="tanitim-surec-baslik" className={SECTION}>
      <div className="rounded-[1.75rem] bg-surface px-6 py-12 sm:px-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <Reveal>
            <CornerLabel>Süreç</CornerLabel>
            <h2 id="tanitim-surec-baslik" className={`mt-4 text-balance ${H2}`}>
              Beş Adımda İlk Yanıta
            </h2>
            <p className="mt-3 max-w-md text-read text-body">Kurulum bir öğleden sonra sürer; ekip ilk gün gelen kutusuna girer.</p>
          </Reveal>
          <StepRail
            tone="light"
            current={2}
            aria-label="Pusula kurulum adımları"
            steps={[
              { icon: <Pencil />, title: "Kaydol", description: "Çalışma alanını aç." },
              { icon: <Link2 />, title: "Kanalları Bağla", description: "E-posta, telefon ve web formu." },
              { icon: <Reply />, title: "İlk Talebi Yanıtla", description: "Şablonlardan başla." },
              { icon: <CalendarDays />, title: "Takvime İşle", description: "Teslimat ve görüşmeler." },
              { icon: <Users />, title: "Ekibi Ekle", description: "Rol ver, kuyruğu paylaş." },
            ]}
          />
        </div>
        <StatStrip
          numberClassName="font-medium"
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
        <CornerLabel>Gelen Kutusu</CornerLabel>
        <ToneText as="h2" className={`mt-4 ${H2}`}>
          <span id="tanitim-odak-baslik">
            Sıradaki Talep <ToneText.Soft>Hep Odakta</ToneText.Soft>
          </span>
        </ToneText>
        <p className="mt-3 max-w-md text-read text-body">Açık talepler sırayla öne gelir; üzerine gelince döngü durur, ok tuşlarıyla sen gezersin.</p>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="rounded-[1.75rem] bg-surface p-4">
          <FocusStack label="Açık talepler" items={items} itemHeight={76} className="mx-auto w-full max-w-md" />
        </div>
      </Reveal>
    </section>
  );
}

/** Sık sorulanlar: kuyu içinde akordeon; Ctrl+F kapalı yanıtı da bulur. */
export function FaqSection() {
  const faq: [string, string][] = [
    ["Kurulum Ne Kadar Sürer", "E-posta ve web formunu bağlamak birkaç dakika; ekip ilk gün gelen kutusuna girer."],
    ["Verim Kimde Kalır", "Talepler ve müşteriler senin hesabında; istediğin an CSV ya da JSON olarak dışa aktarırsın."],
    ["Asistan Benim Yerime Gönderir mi", "Hayır. Asistan taslak yazar ve önerir; gönderme ve onay kararı her zaman insanda."],
    ["Ekip Büyüyünce Ne Olur", "Rol ve kuyruk paylaşımı ekip üyesi başına; sınırlı plan yok, kullandığın kadar."],
  ];
  return (
    <section id="tanitim-sss" aria-labelledby="tanitim-sss-baslik" className={`${SECTION} grid scroll-mt-24 gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`}>
      <Reveal>
        <CornerLabel>Sık Sorulanlar</CornerLabel>
        <h2 id="tanitim-sss-baslik" className={`mt-4 ${H2}`}>
          Aklındaki Sorular
        </h2>
      </Reveal>
      <Accordion variant="well">
        {faq.map(([q, a], i) => (
          <AccordionItem key={q} title={q} defaultOpen={i === 0} exclusive="tanitim-sss">
            <p className="pb-3 text-base text-body">{a}</p>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/** Kapanış: sade gri kuyu, iki tonlu başlık, tek koyu eylem (renk zemini yok). */
export function ClosingSection({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section aria-labelledby="tanitim-kapanis-baslik" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <Reveal className="grid justify-items-center gap-6 rounded-[1.75rem] bg-surface px-6 py-16 text-center sm:py-24">
        <ToneText as="h2" className="max-w-[18ch] font-display text-display font-semibold tracking-[-0.04em] text-balance text-strong sm:text-hero">
          <span id="tanitim-kapanis-baslik">
            İlk Talebi <ToneText.Soft>Bugün Yanıtla</ToneText.Soft>
          </span>
        </ToneText>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex min-h-12 items-center rounded-full bg-strong px-7 text-base font-medium text-page transition-[translate,scale] duration-200 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:hover:translate-y-0"
        >
          Ücretsiz Dene
        </button>
        <TrustLine items={TRUST} className="text-body" />
      </Reveal>
    </section>
  );
}
