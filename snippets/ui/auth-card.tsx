"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Giriş kartı: sosyal sağlayıcı düğmeleri, "ya da" ayırıcı, e-posta + şifre
 * (göster/gizle), hata durumu, birincil CTA. `/giris`, `/kayit` sayfasının
 * ortası. Kayıt için aynı kart: `title`, `submitLabel`, `footer` değişir.
 *
 * SUNUCU EYLEMİ: `action` bir server action olabilir ve `useActionState`
 * imzasıyla çağrılır: `(önceki, formData) => Promise<AuthState>`. Dönüşteki
 * `error` kartın üstünde, `fieldErrors` alanın altında görünür; `email`
 * geri dönerse alan yeniden doldurulur (şifre ASLA geri dönmez). Yetki
 * kararı sunucuda: bu kart yalnız toplar ve gösterir.
 *
 *   async function signIn(_: AuthState, data: FormData): Promise<AuthState> {
 *     "use server";
 *     // auth.js / kendi doğrulaman; hata metni kullanıcıya hangi alanın
 *     // yanlış olduğunu SÖYLEMEZ ("e-posta ya da şifre hatalı").
 *   }
 *
 * Sosyal düğmeler ayrı bir form: `socialAction` sağlayıcıyı `provider`
 * alanında alır. Marka logosu ve marka rengi YOK: logolar lisanslı varlık
 * ve rengi sakin kabuğu bozar; nötr bir harf karosu + sağlayıcı adı yeter,
 * kullanıcı adı okuyarak seçer.
 *
 * Erişilebilirlik: alan hataları `aria-invalid` + `aria-describedby`, genel
 * hata `role="alert"`; göster/gizle düğmesi `aria-pressed` taşır ve odağı
 * alandan çalmaz. Bekleme sırasında düğme `aria-disabled` değil gerçekten
 * devre dışı, metni "Giriş Yapılıyor" olur. `autoComplete` doğru: tarayıcı
 * ve şifre yöneticisi alanları tanır.
 */

export type AuthState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

export type AuthProvider = { id: string; label: string };

type AuthCardProps = {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  /** Sağlayıcıyla giriş; verilmezse sosyal satır çizilmez. */
  socialAction?: (formData: FormData) => void | Promise<void>;
  providers?: readonly AuthProvider[];
  title?: ReactNode;
  description?: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  forgotHref?: string;
  /** Kartın altında, kuyunun içinde: "Hesabın yok mu? Kaydol". */
  footer?: ReactNode;
  /** Kayıt formunda "new-password". */
  passwordAutoComplete?: "current-password" | "new-password";
  className?: string;
};

const DEFAULT_PROVIDERS: readonly AuthProvider[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
];

const FIELD =
  "min-h-11 w-full rounded-md border border-line-strong bg-surface-sunken shadow-well px-3 text-base text-strong transition-[color,background-color,border-color,box-shadow] placeholder:text-muted hover:border-primary-soft focus-visible:border-line-focus focus-visible:shadow-focus aria-invalid:border-danger";

export function AuthCard({
  action,
  socialAction,
  providers = DEFAULT_PROVIDERS,
  title = "Tekrar Hoş Geldin",
  description = "Hesabına e-posta ya da bir sağlayıcıyla gir.",
  submitLabel = "Giriş Yap",
  pendingLabel = "Giriş Yapılıyor",
  forgotHref,
  footer,
  passwordAutoComplete = "current-password",
  className,
}: AuthCardProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <section aria-labelledby={`${id}-title`} className={cn("w-full max-w-md rounded-2xl bg-surface p-2", className)}>
      <div className="rounded-xl bg-overlay p-6 shadow-raised sm:p-8">
        <header className="mb-6">
          <h2 id={`${id}-title`} className="text-heading font-semibold tracking-tight text-strong">
            {title}
          </h2>
          {description ? <p className="mt-1.5 text-base text-body">{description}</p> : null}
        </header>

        {socialAction && providers.length > 0 ? (
          <>
            <form action={socialAction} className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="submit"
                  name="provider"
                  value={provider.id}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-overlay px-3 text-base font-medium text-strong shadow-raised transition-[background-color,border-color] hover:border-line-strong hover:bg-surface active:translate-y-px"
                >
                  <span
                    aria-hidden
                    className="inline-grid size-5 place-items-center rounded-sm bg-surface-raised text-micro font-bold text-body"
                  >
                    {provider.label.charAt(0)}
                  </span>
                  {provider.label}
                  <span className="sr-only"> ile devam et</span>
                </button>
              ))}
            </form>
            <div className="my-5 flex items-center gap-3 text-small text-muted" role="separator" aria-label="ya da">
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span aria-hidden>ya da</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : null}

        <form action={formAction} noValidate className="grid gap-4">
          {state.error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md bg-danger-wash px-3 py-2.5 text-base text-danger [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0"
            >
              <AlertCircle aria-hidden strokeWidth={2} />
              {state.error}
            </p>
          ) : null}

          <div className="grid gap-1.5">
            <label htmlFor={`${id}-email`} className="text-small font-semibold text-strong">
              E-Posta
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              // Sunucudan dönen e-posta yeni bir değer: alan yeniden doldurulsun.
              key={state.email ?? ""}
              placeholder="ad@alanadi.com"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? `${id}-email-error` : undefined}
              className={FIELD}
            />
            {emailError ? (
              <p id={`${id}-email-error`} className="text-small text-danger">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-password`} className="text-small font-semibold text-strong">
                Şifre
              </label>
              {forgotHref ? (
                <Link
                  href={forgotHref}
                  className="text-small font-medium text-primary-ink underline-offset-4 hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <input
                id={`${id}-password`}
                name="password"
                type={reveal ? "text" : "password"}
                autoComplete={passwordAutoComplete}
                required
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? `${id}-password-error` : undefined}
                className={cn(FIELD, "pr-12")}
              />
              <button
                type="button"
                onClick={() => setReveal((value) => !value)}
                // Fareyle basınca odak alanda kalsın; klavyede düğme yine odaklanır.
                onMouseDown={(event) => event.preventDefault()}
                aria-pressed={reveal}
                aria-controls={`${id}-password`}
                aria-label="Şifreyi Göster"
                title={reveal ? "Şifreyi Gizle" : "Şifreyi Göster"}
                className="absolute inset-y-0 right-0 inline-grid w-11 place-items-center rounded-r-md text-muted transition-colors hover:text-strong [&_svg]:size-[1.125rem]"
              >
                {reveal ? <EyeOff aria-hidden strokeWidth={1.75} /> : <Eye aria-hidden strokeWidth={1.75} />}
              </button>
            </div>
            {passwordError ? (
              <p id={`${id}-password-error`} className="text-small text-danger">
                {passwordError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-md bg-cta px-4 text-base font-semibold text-on-brand shadow-cta transition-[opacity,translate] hover:opacity-95 active:translate-y-px disabled:opacity-70"
          >
            {pending ? <Spinner size="sm" label={null} className="text-on-brand" /> : null}
            {pending ? pendingLabel : submitLabel}
          </button>
        </form>
      </div>
      {footer ? <div className="px-4 pt-3 pb-2 text-center text-base text-body">{footer}</div> : null}
    </section>
  );
}
