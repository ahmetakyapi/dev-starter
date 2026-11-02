import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { NumberField } from "@/components/ui/number-field";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";
import { TRY } from "./_data";


const meta = {
  title: "Bileşenler/Form Girişleri/Sayı Alanı",
  component: NumberField,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Kesin ve küçük bir sayı için (kişi sayısı, adet, gün). Değer yaklaşıksa Kaydırıcı; telefon ya da posta kodu gibi sayı görünümlü metin için düz metin alanı kullanın. Sınıra gelince ilgili düğme devre dışı kalır, basılı tutunca adım hızlanır.",
      },
    },
  },
  args: {
    label: "Misafir Sayısı",
    defaultValue: 2,
    min: 1,
    max: 12,
    step: 1,
    hint: "Bebekler sayılmaz.",
    disabled: false,
    onValueChange: fn(),
  },
  render: (args) => (
    <Frame width="sm">
      <NumberField {...args} />
    </Frame>
  ),
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Misafir Sayısı" });
    await userEvent.click(canvas.getByRole("button", { name: "Artır" }));
    await userEvent.click(canvas.getByRole("button", { name: "Artır" }));
    await expect(input).toHaveValue("4");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(4);
  },
};

export const ParaBirimi: Story = {
  name: "Para Birimi",
  args: {
    label: "Aylık Bütçe",
    defaultValue: 12500,
    min: 0,
    max: 100000,
    step: 500,
    format: TRY,
    hint: "500 TL adımlarla; Shift ile 10 kat.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Aylık Bütçe" });
    await userEvent.click(canvas.getByRole("button", { name: "Artır" }));
    await expect(input).toHaveValue(new Intl.NumberFormat("tr-TR", TRY).format(13000));
  },
};

export const Sinirda: Story = {
  name: "Sınırda",
  args: { label: "Gece Sayısı", defaultValue: 14, min: 1, max: 14, hint: "En fazla 14 gece rezervasyon yapılabilir." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Artır" })).toBeDisabled();
  },
};

export const Bos: Story = {
  name: "Boş",
  args: { label: "Adet", defaultValue: undefined, min: 0, placeholder: "0", hint: undefined },
};

export const Hatali: Story = {
  name: "Hatalı",
  args: { label: "Koltuk Sayısı", defaultValue: 0, min: 0, max: 40, error: "En az bir koltuk seçmelisin.", hint: undefined },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { label: "Oda Sayısı", defaultValue: 1, disabled: true, hint: "Bu pakette tek oda var." },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Varsayılan">
        <NumberField label="Misafir Sayısı" defaultValue={2} min={1} max={12} className="w-full max-w-60" />
      </Cell>
      <Cell label="Para birimi">
        <NumberField label="Aylık Bütçe" defaultValue={12500} min={0} step={500} format={TRY} className="w-full max-w-60" />
      </Cell>
      <Cell label="Üst sınırda">
        <NumberField label="Gece Sayısı" defaultValue={14} min={1} max={14} className="w-full max-w-60" />
      </Cell>
      <Cell label="Ondalık">
        <NumberField
          label="Ağırlık"
          defaultValue={2.5}
          min={0}
          step={0.5}
          format={{ style: "unit", unit: "kilogram", maximumFractionDigits: 1 }}
          className="w-full max-w-60"
        />
      </Cell>
      <Cell label="Hata">
        <NumberField label="Koltuk Sayısı" defaultValue={0} min={0} error="En az bir koltuk seçmelisin." className="w-full max-w-60" />
      </Cell>
      <Cell label="Devre dışı">
        <NumberField label="Oda Sayısı" defaultValue={1} disabled className="w-full max-w-60" />
      </Cell>
    </Gallery>
  ),
};
