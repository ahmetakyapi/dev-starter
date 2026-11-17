"use client";

import "./pusula.css";
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, Compass, ImageIcon, Inbox, Keyboard, ListChecks } from "lucide-react";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/marquee";
import { MorphNav, MorphNavGrid } from "@/components/ui/morph-nav";
import { ScrambleText } from "@/components/ui/scramble-text";
import { CUSTOMERS, DELAYED, EVENTS, ME, OPEN_TICKETS, TODAY, WORKSPACE, customer, dayKey, longDate } from "./_data";

/** Tanıtım sayfası aynı Storybook çerçevesinde açılır (Pusula → Tanıtım Sayfası). */
const LANDING = "?id=demo-app--landing&viewMode=story";

const PRIORITY_ORDER = { Acil: 0, Yüksek: 1, Normal: 2, Düşük: 3 } as const;
const TODAY_EVENTS = EVENTS.filter((e) => dayKey(e.date) === dayKey(TODAY));
const SUMMARY = [
  { value: OPEN_TICKETS.filter((t) => t.priority === "Acil").length, label: "acil talep" },
  { value: DELAYED.length, label: "geciken sipariş" },
  { value: TODAY_EVENTS.length, label: "bugünkü toplantı" },
];
const WAITING = [...OPEN_TICKETS].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]).slice(0, 3);

/**
 * Oturum kapalıyken: Pusula'ya giriş. İki yol, ikisi de ŞİFRESİZ:
 *   1. Bu cihazda kayıtlı hesap: tek dokunuşla devam (hesap seçici).
 *   2. E-postaya giriş bağlantısı (`AuthCard method="link"`).
 * Şifre alanı bilerek yok: örnek uygulamada yazılan şifreyle gönderilen form
 * kaybolunca tarayıcı bunu gerçek giriş sayıp "Şifre kaydedilsin mi?"
 * soruyordu (sahibinin itirazı, 2026-11-17). Bağlantıyla giriş gerçek
 * ürünlerde de var; burada "e-posta" sahnelenir: "Bağlantıyı Aç" panoyu açar.
 *
 * Düzen: solda giriş, sağda (geniş ekranda) ürünün renkli paneli: bugün
 * bekleyen işler ve müşteri şeridi. Telefonda yalnız giriş sütunu.
 */
export function GirisPage({ onSignedIn }: { onSignedIn: () => void }) {
  async function sendLink(_: AuthState, data: FormData): Promise<AuthState> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const email = String(data.get("email") ?? "").trim();
    if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
    if (!email.endsWith(`@${WORKSPACE.domain}`)) return { email, fieldErrors: { email: `${WORKSPACE.name} hesabıyla gir: ad@${WORKSPACE.domain}` } };
    return { email, sentTo: email };
  }

  return (
    <div className="grid min-h-dvh bg-page lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      <main id="icerik" className="flex min-h-dvh min-w-0 flex-col px-4 pt-4 pb-8 sm:px-8">
        {/* Sitenin menüsü giriş ekranında da: ürünü tanımayan ziyaretçi buradan tanıtıma döner. */}
        <MorphNav
          label="Site menüsü"
          brand={
            <span className="flex items-center gap-2 text-read font-bold tracking-tight text-strong">
              <span aria-hidden className="pusula-ink inline-grid size-7 place-items-center rounded-lg">
                <Compass className="size-4" strokeWidth={2.25} />
              </span>
              {WORKSPACE.name}
            </span>
          }
          items={[
            {
              label: "Ürün",
              content: (
                <MorphNavGrid
                  links={[
                    { href: `${LANDING}#tanitim-demo`, title: "Gelen Kutusu", description: "Talepler tek şeritte", icon: Inbox },
                    { href: `${LANDING}#tanitim-demo`, title: "Görevler", description: "Talepten doğan işler", icon: ListChecks },
                    { href: `${LANDING}#tanitim-demo`, title: "Takvim", description: "Toplantı ve teslimler", icon: CalendarDays },
                    { href: `${LANDING}#tanitim-kisayol`, title: "Kısayollar", description: "Fareye uzanmadan", icon: Keyboard },
                  ]}
                />
              ),
            },
            {
              label: "Kaynaklar",
              content: (
                <MorphNavGrid
                  links={[
                    { href: `${LANDING}#tanitim-rehber-baslik`, title: "Rehberler", description: "Ekibin ilk haftası", icon: BookOpen },
                    { href: `${LANDING}#tanitim-duvar-baslik`, title: "Duvar Kâğıtları", description: "Sekiz sahne, iki boy", icon: ImageIcon },
                  ]}
                />
              ),
            },
            { label: "Tanıtım", href: LANDING },
          ]}
        />

        <div className="grid flex-1 place-items-center py-8 sm:py-10">
          <div className="grid w-full max-w-sm gap-6">
            <header className="grid gap-1.5">
              <h1 className="font-display text-heading font-bold tracking-tight text-strong">Tekrar Hoş Geldin</h1>
              <p className="text-base text-body">
                {WORKSPACE.name} çalışma alanına gir; {OPEN_TICKETS.length} talep yanıt bekliyor.
              </p>
            </header>

            {/* Hesap seçici: bu cihazda daha önce girmiş hesap. Örnek uygulamanın tek tık girişi. */}
            <section aria-labelledby="giris-kayitli" className="rounded-2xl bg-surface p-2">
              <h2 id="giris-kayitli" className="px-3 pt-1 pb-2 text-small font-medium text-muted">
                Bu Cihazda Kayıtlı
              </h2>
              <button
                type="button"
                onClick={onSignedIn}
                aria-label={`${ME.name} olarak devam et`}
                className="group flex w-full items-center gap-3 rounded-xl bg-overlay p-3 text-start shadow-raised transition-[box-shadow,scale] duration-150 hover:shadow-floating active:scale-[0.99]"
              >
                <Avatar name={ME.name} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-strong">{ME.name}</span>
                  <span className="block truncate text-small text-muted">
                    {ME.email} · {ME.role}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4 text-muted transition-[translate] duration-200 group-hover:translate-x-0.5" />
              </button>
            </section>

            <div className="flex items-center gap-3 text-small text-muted" role="separator" aria-label="ya da">
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span aria-hidden>ya da</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
            </div>

            <AuthCard
              method="link"
              action={sendLink}
              title="E-Postayla Gir"
              description="Şifre yok: adresine tek kullanımlık giriş bağlantısı gelir."
              submitLabel="Giriş Bağlantısı Gönder"
              pendingLabel="Gönderiliyor"
              className="max-w-none"
              sentAction={
                <>
                  <Button onClick={onSignedIn} className="w-full">
                    Bağlantıyı Aç
                    <ArrowRight aria-hidden />
                  </Button>
                  <span className="text-small text-muted">Örnek uygulamada e-posta gitmez; bağlantı buradan açılır.</span>
                </>
              }
              footer={<span className="text-small text-muted">Hesabın yok mu? Çalışma alanı yöneticinden davet iste.</span>}
            />
          </div>
        </div>
      </main>

      {/* Ürünün renkli paneli: zemin .pusula-hero (iki temada beyaz metin AA). Bilgi verir, eylem taşımaz. */}
      <aside aria-labelledby="giris-bugun" className="pusula-hero relative isolate hidden overflow-hidden lg:sticky lg:top-3 lg:m-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:flex-col lg:justify-between lg:rounded-[1.75rem] lg:p-10 xl:p-12">
        <div aria-hidden className="absolute -top-24 -right-24 -z-10 size-[28rem] rounded-full bg-primary-soft opacity-20 blur-3xl" />
        <div className="grid gap-8">
          <div className="grid gap-3">
            <p className="text-small font-medium text-on-brand/75">{longDate.format(TODAY)}</p>
            <h2 id="giris-bugun" className="font-display text-display leading-tight font-bold tracking-tight text-on-brand text-balance">
              <ScrambleText text={`${OPEN_TICKETS.length} Talep Seni Bekliyor`} />
            </h2>
            <p className="max-w-[44ch] text-read text-on-brand/85">{DELAYED.length} siparişin teslim tarihi geçti. Girince ilk bunlar karşılar; en acil olan en üstte.</p>
          </div>
          <ul className="grid max-w-md gap-2">
            {WAITING.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-on-brand/10 px-4 py-3 ring-1 ring-inset ring-on-brand/15">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-on-brand">{t.subject}</span>
                  <span className="block truncate text-small text-on-brand/75">
                    {t.id} · {customer(t.customerId).name}
                  </span>
                </span>
                {/* Beyaz hap + zeminin koyu tonu: yarı saydam beyaz hap mavi paneli açıp metni 3,5:1'e düşürüyordu. Acil'in noktası rengi tek işaret bırakmaz. */}
                <span className="inline-flex w-20 shrink-0 items-center justify-center gap-1.5 rounded-full bg-on-brand px-2.5 py-0.5 text-small font-semibold">
                  {t.priority === "Acil" ? <span aria-hidden className="size-1.5 rounded-full bg-danger" /> : null}
                  <span className="pusula-hero-ink">{t.priority}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid max-w-md grid-cols-3 divide-x divide-on-brand/20 rounded-xl ring-1 ring-inset ring-on-brand/20">
          {SUMMARY.map((s) => (
            <div key={s.label} className="grid gap-0.5 px-4 py-3">
              <dt className="order-2 text-small text-on-brand/80">{s.label}</dt>
              <dd className="order-1 font-display text-heading font-bold text-on-brand tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <section
          aria-labelledby="giris-musteriler"
          // Şeridin "Durdur" düğmesi `text-muted` gelir; renkli zeminde okunmuyordu.
          className="grid gap-3 text-on-brand [&_.ui-marquee-control]:text-on-brand/85 [&_.ui-marquee-control:hover]:bg-on-brand/10 [&_.ui-marquee-control:hover]:text-on-brand"
        >
          <h2 id="giris-musteriler" className="text-small font-medium text-on-brand/75">
            {WORKSPACE.name} Bu Müşterilere Hizmet Veriyor
          </h2>
          <Marquee label={`${WORKSPACE.name} müşterileri`} duration={36}>
            {CUSTOMERS.map((c) => (
              <span key={c.id} className="inline-flex items-baseline gap-1.5 text-base font-semibold text-on-brand">
                {c.name}
                <span className="text-small font-normal text-on-brand/70">{c.city}</span>
              </span>
            ))}
          </Marquee>
        </section>
      </aside>
    </div>
  );
}
