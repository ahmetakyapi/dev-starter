import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ContactList } from "@/components/ui/contact-list";
import { Frame } from "../_lib/Frame";

const ITEMS = [
  { kind: "phone" as const, label: "İş", value: "(606) 555-0103" },
  { kind: "phone" as const, label: "Kişisel", value: "(859) 555-0116" },
  { kind: "email" as const, label: "İş", value: "ada@ornek-diş.com" },
  { kind: "address" as const, label: "İş Yeri", value: "Atatürk Cad. 12, Çankaya, Ankara", href: "https://www.openstreetmap.org/search?query=Ankara" },
  { kind: "web" as const, value: "ornek-dis.com" },
];

const meta = {
  title: "Bileşenler/Veri/İletişim Listesi",
  id: "contact-list",
  component: ContactList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Telefon, e-posta, adres ve web adresleri; her satırda tür etiketi (\"İş\", \"Kişisel\") ve kopyala butonu. Bağlantı türden ÜRETİLİR, ham dizgiden değil: telefondan yalnız rakam ve \"+\", e-posta `mailto:`, web `https://`; `javascript:` gibi bir şema bağlantıya girmez, düz metin kalır. Ekran okuyucu \"Telefon, İş: …\" okur. Brick ve Zain müşteri ekranlarından (yalnız yapı). Kişiler ÖRNEK'tir.",
      },
    },
  },
  args: { title: "İletişim", items: ITEMS },
  argTypes: { items: { control: false } },
  render: (args) => (
    <Frame width="md">
      <ContactList {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ContactList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phone = canvas.getByRole("link", { name: /\(606\) 555-0103/ });
    await expect(phone).toHaveAttribute("href", "tel:6065550103");
    await expect(canvas.getByRole("link", { name: /ada@ornek/ })).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
    await expect(canvas.getByRole("link", { name: /ornek-dis\.com/ })).toHaveAttribute("href", "https://ornek-dis.com/");
    await expect(canvas.getAllByRole("button", { name: /kopyala/i })).toHaveLength(5);
  },
};

export const UnsafeInput: Story = {
  name: "Güvensiz Girdi",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="md">
      <ContactList
        items={[
          { kind: "web", value: "javascript:alert(1)" },
          { kind: "address", value: "Bilinmeyen adres", href: "javascript:alert(1)" },
          { kind: "email", value: "geçersiz e-posta" },
        ]}
      />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    // Güvensiz şema asla bağlantı olmaz: üçü de düz metin.
    await expect(within(canvasElement).queryAllByRole("link")).toHaveLength(0);
  },
};
