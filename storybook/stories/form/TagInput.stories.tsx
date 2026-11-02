import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TagInput } from "@/components/ui/tag-input";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { DISABLED_CONTRAST_EXEMPT, settle } from "./_a11y";
import { SKILLS } from "./_data";

const meta = {
  title: "Bileşenler/Form Girişleri/Etiket Girişi",
  component: TagInput,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Serbest ya da önerili çoklu değer için (konu etiketleri, beceriler, alıcı e-postaları). Seçenekler kapalı ve sayılıysa çoklu Combobox daha doğrudur. Enter ya da virgül ekler; boş alanda Backspace ilk basışta son çipi işaretler, ikincide siler.",
      },
    },
  },
  args: {
    label: "Beceriler",
    defaultValue: ["Figma", "Tasarım Sistemi", "React"],
    suggestions: SKILLS,
    maxTags: 8,
    hint: "En fazla 8 beceri; listede olmayanı da yazabilirsin.",
    disabled: false,
    onValueChange: fn(),
  },
  render: (args) => (
    <Frame width="sm">
      <TagInput {...args} />
    </Frame>
  ),
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox", { name: "Beceriler" });
    await userEvent.type(field, "Veri Görselleştirme{Enter}");
    await expect(canvas.getByRole("button", { name: "Veri Görselleştirme etiketini kaldır" })).toBeInTheDocument();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["Figma", "Tasarım Sistemi", "React", "Veri Görselleştirme"]);
  },
};

export const Oneriler: Story = {
  name: "Öneriler",
  args: { defaultValue: ["Figma"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox", { name: "Beceriler" });
    await userEvent.click(field);
    await userEvent.type(field, "pro");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(canvas.getByRole("button", { name: "Prototipleme etiketini kaldır" })).toBeInTheDocument();
    // Öneri listesi açık kalsın: ekran görüntüsünde görünsün.
    await userEvent.type(field, "e");
  },
};

export const Sinirda: Story = {
  name: "Sınırda",
  args: {
    label: "Konu Etiketleri",
    defaultValue: ["Bütçe", "Kira", "Fatura"],
    suggestions: [],
    maxTags: 3,
    hint: "Bir harcamaya en fazla 3 etiket.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toHaveAttribute("placeholder", "En fazla 3 etiket");
  },
};

export const Bos: Story = {
  name: "Boş",
  args: { label: "Alıcılar", defaultValue: [], suggestions: [], maxTags: undefined, hint: "E-posta yaz, virgülle ayır." },
};

export const Hatali: Story = {
  name: "Hatalı",
  args: { defaultValue: [], hint: undefined, error: "En az bir beceri ekle." },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { defaultValue: ["Figma", "React"], disabled: true },
  parameters: DISABLED_CONTRAST_EXEMPT,
  render: (args) => (
    <Frame width="sm">
      <div data-a11y-disabled>
        <TagInput {...args} />
      </div>
    </Frame>
  ),
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded", ...DISABLED_CONTRAST_EXEMPT },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <TagInput label="Alıcılar" className="w-full" />
      </Cell>
      <Cell label="Dolu, önerili">
        <TagInput label="Beceriler" defaultValue={["Figma", "Tasarım Sistemi", "React"]} suggestions={SKILLS} className="w-full" />
      </Cell>
      <Cell label="Sınırda">
        <TagInput label="Konu Etiketleri" defaultValue={["Bütçe", "Kira", "Fatura"]} maxTags={3} className="w-full" />
      </Cell>
      <Cell label="Uzun etiketler">
        <TagInput
          label="Teslimat Bölgeleri"
          defaultValue={["Kadıköy", "Üsküdar", "Ataşehir", "Beşiktaş", "Şişli", "Sarıyer"]}
          className="w-full"
        />
      </Cell>
      <Cell label="Hata">
        <TagInput label="Beceriler" error="En az bir beceri ekle." className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <div data-a11y-disabled className="w-full">
          <TagInput label="Beceriler" defaultValue={["Figma", "React"]} disabled />
        </div>
      </Cell>
    </Gallery>
  ),
};
