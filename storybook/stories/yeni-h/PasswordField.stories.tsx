import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PasswordField } from "@/components/ui/password-field";

const meta = {
  title: "Bileşenler/Form Girişleri/Kurallı Şifre",
  id: "password-field",
  component: PasswordField,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Yeni şifre belirlerken kurallar baştan ilerleme olarak görünür: karşılanan her kural listede işaretlenir ve dilimli çubuğa bir dilim ekler; güç sözcükle de yazılır (\"Zayıf / Orta / Güçlü\"). Varsayılan kurallar uzunluğu öne alır (12 karakter); `rules` ile değişir. Liste alanın `aria-describedby`ında; canlı bölge yalnız karşılanan kural sayısı değişince okunur. Giriş ekranında (`current-password`) kullanılmaz. scrolltide.co turundan.",
      },
    },
  },
  args: { label: "Yeni Şifre", name: "password" },
  render: (args) => (
    <div className="mx-auto max-w-md p-6">
      <PasswordField {...args} />
    </div>
  ),
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Boş" };
export const Partial: Story = { name: "Yarım", args: { defaultValue: "pusula2026" } };
export const Custom: Story = {
  name: "Özel Kurallar",
  args: {
    rules: [
      { id: "len", label: "En az 16 karakter", test: (v: string) => [...v].length >= 16 },
      { id: "space", label: "En az iki sözcük", test: (v: string) => v.trim().split(/\s+/).length >= 2 },
    ],
  },
};
