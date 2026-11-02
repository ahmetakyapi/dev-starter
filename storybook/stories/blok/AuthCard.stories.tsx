import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { expect, userEvent, within } from "storybook/test";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/** Sahte sunucu eylemi: e-postada @ yoksa alan hatası, şifre 8'den kısaysa genel hata. */
async function demoSignIn(_: AuthState, data: FormData): Promise<AuthState> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
  if (password.length < 8) return { email, error: "E-posta ya da şifre hatalı." };
  return { email };
}

/** Hiç dönmeyen eylem: bekleme halini sabit göstermek için. */
function neverResolves(): Promise<AuthState> {
  return new Promise<AuthState>(() => undefined);
}

async function demoSocial() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

const SIGN_IN_FOOTER = (
  <>
    Hesabın yok mu?{" "}
    <Link href="/kayit" className="font-semibold text-strong underline-offset-4 hover:underline">
      Kaydol
    </Link>
  </>
);

const SIGN_UP_FOOTER = (
  <>
    Zaten hesabın var mı?{" "}
    <Link href="/giris" className="font-semibold text-strong underline-offset-4 hover:underline">
      Giriş Yap
    </Link>
  </>
);

const SIGN_UP = {
  title: "Hesap Oluştur",
  description: "Ekibinle birlikte çalışmaya iki dakikada başla.",
  submitLabel: "Kaydol",
  pendingLabel: "Hesap Oluşturuluyor",
  passwordAutoComplete: "new-password" as const,
  footer: SIGN_UP_FOOTER,
};

const meta = {
  title: "Bloklar/Giriş Kartı",
  id: "blocks-auth-card",
  component: AuthCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Giriş ve kayıt kartı: sağlayıcı düğmeleri, e-posta, göster/gizle şifre ve sunucu eylemine bağlanan hata durumu. Yetki kararı sunucuda; hata metni hangi alanın yanlış olduğunu söylemez. Marka logosu ve marka rengi yok, sağlayıcı adı okunarak seçilir.",
      },
    },
  },
  args: {
    action: demoSignIn,
    socialAction: demoSocial,
    title: "Tekrar Hoş Geldin",
    description: "Hesabına e-posta ya da bir sağlayıcıyla gir.",
    submitLabel: "Giriş Yap",
    pendingLabel: "Giriş Yapılıyor",
    forgotHref: "/sifremi-unuttum",
    footer: SIGN_IN_FOOTER,
    passwordAutoComplete: "current-password",
  },
  argTypes: {
    action: { control: false },
    socialAction: { control: false },
    footer: { control: false },
    providers: { control: false },
  },
  render: (args) => (
    <Frame width="md" className="bg-page ring-1 ring-line">
      <AuthCard {...args} />
    </Frame>
  ),
} satisfies Meta<typeof AuthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  name: "Giriş",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Şifreyi Göster" });
    const password = canvas.getByLabelText("Şifre");
    await expect(password).toHaveAttribute("type", "password");
    await userEvent.click(toggle);
    await expect(password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
  },
};

export const SignUp: Story = {
  name: "Kayıt",
  args: SIGN_UP,
};

export const Error: Story = {
  name: "Hata",
  parameters: { docs: { description: { story: "Sunucu genel hata döndürdü: kartın üstünde `role=\"alert\"`, e-posta yeniden dolu, şifre boş." } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("E-posta"), "elif@pusula.app");
    await userEvent.type(canvas.getByLabelText("Şifre"), "1234");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Yap" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("E-posta ya da şifre hatalı.");
    await expect(canvas.getByLabelText("E-posta")).toHaveValue("elif@pusula.app");
  },
};

export const FieldError: Story = {
  name: "Alan Hatası",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("E-posta"), "elif.pusula");
    await userEvent.type(canvas.getByLabelText("Şifre"), "uzunbirsifre");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Yap" }));
    await expect(await canvas.findByText("Geçerli bir e-posta adresi yaz.")).toBeVisible();
    await expect(canvas.getByLabelText("E-posta")).toHaveAttribute("aria-invalid", "true");
  },
};

export const Submitting: Story = {
  name: "Gönderiliyor",
  args: { action: neverResolves },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("E-posta"), "elif@pusula.app");
    await userEvent.type(canvas.getByLabelText("Şifre"), "guclu-sifre-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Yap" }));
    const pending = await canvas.findByRole("button", { name: /Giriş Yapılıyor/ });
    await expect(pending).toBeDisabled();
  },
};

export const SignUpWithoutProviders: Story = {
  name: "Sağlayıcısız Kayıt",
  args: { ...SIGN_UP, socialAction: undefined },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: (args) => (
    <Gallery cols={3}>
      <Cell label="Giriş · sağlayıcılarla">
        <AuthCard {...args} />
      </Cell>
      <Cell label="Kayıt · yeni şifre">
        <AuthCard {...args} {...SIGN_UP} />
      </Cell>
      <Cell label="Yalnız e-posta">
        <AuthCard {...args} socialAction={undefined} title="E-postayla Gir" description={undefined} />
      </Cell>
    </Gallery>
  ),
};
