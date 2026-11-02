"use client";

import { Compass } from "lucide-react";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { ME, OPEN_TICKETS, WORKSPACE } from "./_data";

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
    <main id="icerik" className="grid min-h-dvh place-items-center bg-page px-4 py-10">
      <div className="grid w-full max-w-sm justify-items-center gap-6">
        <div className="flex items-center gap-2.5 text-strong">
          <span aria-hidden className="inline-grid size-9 place-items-center rounded-md bg-brand text-on-brand">
            <Compass className="size-5" strokeWidth={2} />
          </span>
          <span className="text-title font-semibold tracking-tight">Pusula</span>
        </div>
        <AuthCard
          action={signIn}
          title={`${WORKSPACE.name} Çalışma Alanı`}
          description={`${OPEN_TICKETS.length} talep yanıt bekliyor. Ekip hesabınla gir.`}
          submitLabel="Giriş Yap"
          pendingLabel="Giriş Yapılıyor"
          className="w-full"
          footer={<span className="text-muted">Örnek hesap: {ME.email}, şifre en az 8 karakter.</span>}
        />
      </div>
    </main>
  );
}
