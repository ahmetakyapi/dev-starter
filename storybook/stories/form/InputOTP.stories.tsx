import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { InputOTP } from "@/components/ui/input-otp";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

const meta = {
  title: "Bileşenler/Form Girişleri/Tek Kullanımlık Kod",
  component: InputOTP,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "SMS, e-posta ya da doğrulayıcı uygulamasından gelen sabit uzunluklu, yalnızca rakamlı kod için. Parola ya da serbest metin için kullanmayın. Yapıştırılan \"482 913\" boşluğu atılıp kutulara dağılır; kod tamamlanınca `onComplete` bir kez çalışır.",
      },
    },
  },
  args: {
    label: "Doğrulama Kodu",
    hint: "0532 *** ** 47 numarasına gönderdik.",
    length: 6,
    disabled: false,
    onValueChange: fn(),
    onComplete: fn(),
  },
  render: (args) => (
    <Frame width="sm">
      <InputOTP {...args} />
    </Frame>
  ),
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("textbox", { name: "Doğrulama Kodu" });
    await userEvent.click(first);
    await userEvent.paste("482 913");
    await waitFor(() =>
      expect(
        canvas
          .getAllByRole("textbox")
          .map((box) => (box as HTMLInputElement).value)
          .join(""),
      ).toBe("482913"),
    );
    await expect(args.onComplete).toHaveBeenCalledWith("482913");
  },
};

export const Bos: Story = {
  name: "Boş",
};

export const Dolu: Story = {
  name: "Dolu",
  args: { defaultValue: "719305" },
};

export const YarimKalmis: Story = {
  name: "Yarım Kalmış",
  args: { defaultValue: "4829" },
};

export const Hatali: Story = {
  name: "Hatalı",
  args: { label: "Yedek Kod", defaultValue: "719305", hint: undefined, error: "Kod süresi doldu, yenisini iste." },
};

export const DortHane: Story = {
  name: "Dört Hane, Ayraçsız",
  args: { label: "Kart Şifresi Onayı", length: 4, groupAt: 0, hint: "Kartının son dört hanesi." },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { defaultValue: "4829", disabled: true, hint: "Yeni kod 45 saniye sonra istenebilir." },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Boş">
        <InputOTP label="Doğrulama Kodu" hint="Telefonuna gelen 6 haneli kod." />
      </Cell>
      <Cell label="Yarım">
        <InputOTP label="Doğrulama Kodu" defaultValue="4829" />
      </Cell>
      <Cell label="Dolu">
        <InputOTP label="Doğrulama Kodu" defaultValue="719305" />
      </Cell>
      <Cell label="Hata">
        <InputOTP label="Yedek Kod" defaultValue="719305" error="Kod süresi doldu, yenisini iste." />
      </Cell>
      <Cell label="Dört hane, ayraçsız">
        <InputOTP label="Kart Şifresi Onayı" length={4} groupAt={0} />
      </Cell>
      <Cell label="Devre dışı">
        <InputOTP label="Doğrulama Kodu" defaultValue="4829" disabled />
      </Cell>
    </Gallery>
  ),
};
