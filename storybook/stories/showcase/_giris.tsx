"use client";

import { ArrowRight, Compass } from "lucide-react";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { Marquee } from "@/components/ui/marquee";
import { ScrambleText } from "@/components/ui/scramble-text";
import { CUSTOMERS, ME, OPEN_TICKETS, WORKSPACE } from "./_data";

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
    <main id="icerik" className="grid min-h-dvh place-content-center justify-items-center gap-10 bg-page px-4 py-10">
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
