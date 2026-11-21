import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ImpactBar } from "@/components/ui/impact-bar";
import { Frame } from "../_lib/Frame";

const tl = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

const meta = {
  title: "Bileşenler/Geri Bildirim/Etki Çubuğu",
  id: "impact-bar",
  component: ImpactBar,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir işlemin bir bütçeye ya da kotaya EKLEDİĞİNİ onaydan önce gösterir: harcanan (dolu), bu işlemin eklediği dilim (çizgili) ve kalan iz tek çubukta; sağda \"önce → sonra / limit · yüzde\". Ölçer ve Çentikli Çubuk bir durumu gösterir, bu ise önerilen değişikliğin sonucunu. Limit aşılırsa çizgili dilim `danger` olur, limit işaretçisi çıkar ve metin \"Limit aşılıyor\" der (renk tek işaret değil). Spendix toplu onay penceresinden (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: { label: "Pazarlama", current: 1900, added: 480, limit: 6000, format: tl },
  render: (args) => (
    <Frame width="md">
      <ImpactBar {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ImpactBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Bütçe İçinde",
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole("meter", { name: "Pazarlama" });
    await expect(meter).toHaveAttribute("aria-valuetext", expect.stringContaining("yüzde 40"));
  },
};

export const Stack: Story = {
  name: "Birkaç Bütçe",
  render: () => (
    <Frame width="md">
      <div className="grid gap-5">
        <ImpactBar label="Pazarlama" current={1900} added={480} limit={6000} format={tl} />
        <ImpactBar label="Mühendislik" current={1510} added={240} limit={7000} format={tl} />
        <ImpactBar label="Satış" current={4300} added={600} limit={5000} format={tl} />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("meter", { name: "Satış" })).toHaveAttribute("aria-valuetext", expect.stringContaining("limite yakın"));
  },
};

export const Over: Story = {
  name: "Limit Aşılıyor",
  args: { label: "Mühendislik", current: 6800, added: 900, limit: 7000 },
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole("meter", { name: "Mühendislik" });
    await expect(meter).toHaveAttribute("aria-valuetext", expect.stringContaining("limit aşılıyor"));
  },
};
