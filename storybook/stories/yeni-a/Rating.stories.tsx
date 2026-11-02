import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Rating, RatingInput } from "@/components/ui/rating";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { DISABLED_CONTRAST_EXEMPT, settle } from "./_settle";

const WORDS = ["Çok Kötü", "Kötü", "Orta", "İyi", "Mükemmel"] as const;

const meta = {
  title: "Bileşenler/Seçim/Puanlama",
  id: "rating",
  component: RatingInput,
  tags: ["autodocs"],
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "`RatingInput` giriş (yorum formu, anket): görünmez yerel radyo düğmeleri, ok tuşları, form gönderimi; seçenek adları \"5 üzerinden 4 yıldız, İyi\". `Rating` gösterim: tek `role=\"img\"`, adı \"5 üzerinden 4,6 puan\", yarım yıldız çizer. Seçili yıldıza yeniden basmak seçimi kaldırır.",
      },
    },
  },
  args: {
    label: "Siparişi Puanla",
    name: "puan",
    labels: WORDS,
    allowHalf: false,
    clearable: true,
    size: "md",
    disabled: false,
    readOnly: false,
  },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
  render: (args) => (
    <Frame width="sm">
      <RatingInput {...args} />
    </Frame>
  ),
} satisfies Meta<typeof RatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radiogroup", { name: "Siparişi Puanla" })).toBeInTheDocument();
    const four = canvas.getByRole("radio", { name: "5 üzerinden 4 yıldız, İyi" });
    await userEvent.click(four);
    await expect(four).toBeChecked();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "5 üzerinden 5 yıldız, Mükemmel" })).toBeChecked();
    // Seçili yıldıza yeniden basmak seçimi kaldırır.
    await userEvent.click(canvas.getByRole("radio", { name: "5 üzerinden 5 yıldız, Mükemmel" }));
    await expect(canvas.getByRole("radio", { name: "5 üzerinden 5 yıldız, Mükemmel" })).not.toBeChecked();
  },
};

export const HalfStars: Story = {
  name: "Yarım Yıldız",
  args: { label: "Kursu Puanla", labels: undefined, allowHalf: true, defaultValue: 3.5, size: "lg" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radio", { name: "5 üzerinden 3,5 yıldız" })).toBeChecked();
    await userEvent.click(canvas.getByRole("radio", { name: "5 üzerinden 3,5 yıldız" }));
    await userEvent.click(canvas.getByRole("radio", { name: "5 üzerinden 4,5 yıldız" }));
    await expect(canvas.getByRole("radio", { name: "5 üzerinden 4,5 yıldız" })).toBeChecked();
  },
};

export const Display: Story = {
  name: "Gösterim",
  render: () => (
    <Frame width="sm">
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-small font-semibold text-strong">Ezine Peyniri, 500 g</span>
          <Rating value={4.6} count={1284} showValue />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-small font-semibold text-strong">Soğuk Sıkım Zeytinyağı</span>
          <Rating value={3.5} count={86} showValue />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-small font-semibold text-strong">Kekik Balı</span>
          <Rating value={2} count={9} showValue />
        </div>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("img", { name: "5 üzerinden 4,6 puan, 1.284 değerlendirme" })).toBeInTheDocument();
  },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: { required: true, error: "Göndermeden önce bir puan seç." },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true, defaultValue: 4, hint: "Teslim edilmeyen sipariş puanlanamaz." },
  parameters: DISABLED_CONTRAST_EXEMPT,
  render: (args) => (
    <Frame width="sm">
      <div data-a11y-disabled>
        <RatingInput {...args} />
      </div>
    </Frame>
  ),
};

export const ReadOnly: Story = {
  name: "Salt Okunur",
  args: { readOnly: true, defaultValue: 5, label: "Verdiğin Puan", hint: "Puanını yalnız yorumla birlikte değiştirebilirsin." },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded", ...DISABLED_CONTRAST_EXEMPT },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Gösterim, küçük">
        <Rating value={4.6} size="sm" count={1284} showValue />
      </Cell>
      <Cell label="Gösterim, büyük, yarım">
        <Rating value={3.5} size="lg" showValue />
      </Cell>
      <Cell label="Giriş, boş">
        <RatingInput label="Teslimatı Puanla" name="v-teslimat" labels={WORDS} />
      </Cell>
      <Cell label="Giriş, seçili, sözlü karşılık">
        <RatingInput label="Ürünü Puanla" name="v-urun" labels={WORDS} defaultValue={4} />
      </Cell>
      <Cell label="Giriş, yarım adım, büyük">
        <RatingInput label="Kursu Puanla" name="v-kurs" allowHalf defaultValue={3.5} size="lg" />
      </Cell>
      <Cell label="Hata">
        <RatingInput label="Siparişi Puanla" name="v-hata" required error="Göndermeden önce bir puan seç." />
      </Cell>
      <Cell label="Devre dışı">
        <div data-a11y-disabled>
          <RatingInput label="Siparişi Puanla" name="v-kapali" disabled defaultValue={4} />
        </div>
      </Cell>
      <Cell label="On üzerinden">
        <Rating value={8.5} max={10} size="sm" showValue />
      </Cell>
    </Gallery>
  ),
};
