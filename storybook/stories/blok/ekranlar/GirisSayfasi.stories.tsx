import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Orbit } from "lucide-react";
import Link from "next/link";
import { expect, userEvent, within } from "storybook/test";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { Screen } from "../../_lib/Frame";

async function demoSignIn(_: AuthState, data: FormData): Promise<AuthState> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
  if (password.length < 8) return { email, error: "E-posta ya da şifre hatalı." };
  return { email };
}

async function demoSocial() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

type LoginScreenProps = { mode: "giris" | "kayit" };

function LoginScreen({ mode }: LoginScreenProps) {
  const signUp = mode === "kayit";
  return (
    <Screen>
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-md font-semibold text-strong">
            <span aria-hidden className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
              <Orbit className="size-4" strokeWidth={2} />
            </span>
            Pusula
          </Link>
          <Link
            href={signUp ? "/giris" : "/kayit"}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-base font-medium text-body transition-colors hover:bg-surface hover:text-strong pointer-fine:min-h-9"
          >
            {signUp ? "Giriş Yap" : "Hesap Oluştur"}
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <h1 className="sr-only">{signUp ? "Pusula'ya Kaydol" : "Pusula'ya Giriş"}</h1>
          <AuthCard
            action={demoSignIn}
            socialAction={demoSocial}
            forgotHref={signUp ? undefined : "/sifremi-unuttum"}
            title={signUp ? "Hesap Oluştur" : "Tekrar Hoş Geldin"}
            description={
              signUp
                ? "Ekibinle birlikte çalışmaya iki dakikada başla. Kredi kartı istemiyoruz."
                : "Destek çalışma alanına e-posta ya da bir sağlayıcıyla gir."
            }
            submitLabel={signUp ? "Kaydol" : "Giriş Yap"}
            pendingLabel={signUp ? "Hesap Oluşturuluyor" : "Giriş Yapılıyor"}
            passwordAutoComplete={signUp ? "new-password" : "current-password"}
            footer={
              signUp ? (
                <>
                  Zaten hesabın var mı?{" "}
                  <Link href="/giris" className="font-semibold text-strong underline-offset-4 hover:underline">
                    Giriş Yap
                  </Link>
                </>
              ) : (
                <>
                  Ekibin Pusula kullanıyor mu?{" "}
                  <Link href="/davet" className="font-semibold text-strong underline-offset-4 hover:underline">
                    Davet Bağlantısıyla Katıl
                  </Link>
                </>
              )
            }
          />
          {signUp ? (
            <p className="mt-4 max-w-sm text-center text-small text-pretty text-muted">
              Kaydolarak{" "}
              <Link href="/kosullar" className="font-medium text-body underline underline-offset-4">
                Kullanım Koşulları
              </Link>
              'nı ve{" "}
              <Link href="/gizlilik" className="font-medium text-body underline underline-offset-4">
                Gizlilik Bildirimi
              </Link>
              'ni kabul etmiş olursun.
            </p>
          ) : null}
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-5 pb-6 text-small text-muted">
          <span>© 2026 Pusula</span>
          <Link href="/gizlilik" className="inline-flex min-h-11 items-center hover:text-strong pointer-fine:min-h-6">
            Gizlilik
          </Link>
          <Link href="/kosullar" className="inline-flex min-h-11 items-center hover:text-strong pointer-fine:min-h-6">
            Koşullar
          </Link>
          <Link href="/durum" className="inline-flex min-h-11 items-center hover:text-strong pointer-fine:min-h-6">
            Sistem Durumu
          </Link>
        </footer>
      </div>
    </Screen>
  );
}

const meta = {
  title: "Ekranlar/Uygulama/Giriş Sayfası",
  component: LoginScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Tam ekran giriş: sakin sayfa zemini, ortada giriş kartı, üstte marka ve karşı eylem, altta yasal bağlantılar. Kayıt aynı düzen; kart metinleri ve şifre `autoComplete` değeri değişir.",
      },
      story: { inline: false, height: "52rem" },
    },
  },
  args: { mode: "giris" },
  argTypes: { mode: { control: "inline-radio", options: ["giris", "kayit"] } },
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Giris: Story = { name: "Giriş" };

export const Kayit: Story = { name: "Kayıt", args: { mode: "kayit" } };

export const HataliGiris: Story = {
  name: "Hatalı Giriş",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("E-posta"), "elif@pusula.app");
    await userEvent.type(canvas.getByLabelText("Şifre"), "kisa");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Yap" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("E-posta ya da şifre hatalı.");
  },
};
