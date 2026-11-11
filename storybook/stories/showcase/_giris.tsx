"use client";

import { ArrowRight, BookOpen, CalendarDays, Compass, ImageIcon, Inbox, Keyboard, ListChecks } from "lucide-react";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { Marquee } from "@/components/ui/marquee";
import { MorphNav, MorphNavGrid } from "@/components/ui/morph-nav";
import { ScrambleText } from "@/components/ui/scramble-text";
import { CUSTOMERS, ME, OPEN_TICKETS, WORKSPACE } from "./_data";

/** Tanıtım sayfası aynı Storybook çerçevesinde açılır (Pusula Paneli → Tanıtım Sayfası). */
const LANDING = "?id=demo-app--landing&viewMode=story";

/** Oturum kapalıyken: Pusula'ya giriş. Başarılı girişte pano açılır. */
export function GirisPage({ onSignedIn }: { onSignedIn: () => void }) {
  async function signIn(_: AuthState, data: FormData): Promise<AuthState> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
    if (!email.endsWith(`@${WORKSPACE.domain}`)) return { email, fieldErrors: { email: `${WORKSPACE.name} hesabıyla gir: ad@${WORKSPACE.domain}` } };
    if (password.length < 8) return { email, error: "E-posta ya da şifre hatalı." };
    window.setTimeout(onSignedIn, 0);
    return { email };
  }

  return (
    <main id="icerik" className="relative grid min-h-dvh place-content-center justify-items-center gap-10 bg-page px-4 pt-28 pb-10">
      {/* Sitenin menüsü giriş ekranında da: ürünü tanımayan ziyaretçi buradan tanıtıma döner. */}
      <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
        <MorphNav
          label="Site menüsü"
          brand={<span className="text-read font-bold tracking-tight">{WORKSPACE.name}</span>}
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
      </div>
      <div className="grid w-full max-w-sm justify-items-center gap-6">
        <div className="flex items-center gap-2.5 text-strong">
          <span aria-hidden className="inline-grid size-9 place-items-center rounded-md bg-brand text-on-brand">
            <Compass className="size-5" strokeWidth={2} />
          </span>
          <span className="text-title font-semibold tracking-tight">Pusula</span>
        </div>
        <ScrambleText as="p" text="Şifreli Bağlantı Kuruldu" className="-mt-3 font-mono text-micro tracking-[0.14em] text-muted uppercase" />
        <AuthCard
          action={signIn}
          title={`${WORKSPACE.name} Çalışma Alanı`}
          description={`${OPEN_TICKETS.length} talep yanıt bekliyor. Ekip hesabınla gir.`}
          submitLabel="Giriş Yap"
          pendingLabel="Giriş Yapılıyor"
          className="w-full"
          footer={
            <div className="grid gap-2">
              {/* Örnek uygulamada şifre YAZDIRILMAZ: yazılan şifreyle gönderilen form
                  kaybolunca Chrome bunu gerçek giriş sayar, "Şifre kaydedilsin mi?"
                  sorar; "12345678" gibi bir denemede veri ihlali uyarısı açar. Bu
                  düğme formu göndermez, tarayıcının şifre yöneticisi devreye girmez.
                  Gerçek projede bu satır yok; form `autoComplete`iyle doğru çalışır. */}
              <button
                type="button"
                onClick={onSignedIn}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-overlay px-4 text-base font-semibold text-strong shadow-raised transition-[box-shadow,scale] duration-150 hover:shadow-floating active:scale-[0.98]"
              >
                Örnek Hesapla Gir
                <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              </button>
              <span className="text-small text-muted">Şifre gerekmez; {ME.name} olarak açılır.</span>
            </div>
          }
        />
      </div>
      <section aria-labelledby="giris-musteriler" className="grid w-full max-w-2xl gap-3">
        <h2 id="giris-musteriler" className="text-center text-small font-medium text-muted">
          {WORKSPACE.name} Bu Müşterilere Hizmet Veriyor
        </h2>
        <Marquee label={`${WORKSPACE.name} müşterileri`} duration={36}>
          {CUSTOMERS.map((c) => (
            <span key={c.id} className="inline-flex items-baseline gap-1.5 text-base font-semibold text-body">
              {c.name}
              <span className="text-small font-normal text-muted">{c.city}</span>
            </span>
          ))}
        </Marquee>
      </section>
    </main>
  );
}
