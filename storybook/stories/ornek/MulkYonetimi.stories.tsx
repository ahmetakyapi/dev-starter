import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MulkYonetimiPage } from "./_mulk";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Mülk ve Satıcı Yönetimi",
  id: "sample-properties",
  component: MulkYonetimiPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bir bina yönetim ürününün mülk ve satıcı ekranları (Fixora referansı: yapı ve davranış; ad, metin ve rakamlar kurgusal, ÖRNEK VERİ). Kenar çubuğundan Mülkler ve Satıcılar görünümü seçilir. Mülkler: sağlık, doluluk, iş emri ve maliyet şeridi; sekme ve seçicilerle süzülen tablo; satıra basınca sağda sistem puanları, öneri kutusu, açık iş emirleri ve kilit varlıklar. \"Mülk Ekle\" penceresi seçilen bina sistemlerine göre başlangıç planını canlı yazar, eklenen mülk listeye düşer. Satıcılar: yanıt süresi, zamanında bitirme, puan ve sigorta durumu; ayrıntıda hedef çizgili haftalık yanıt grafiği. Sol altta kurulum kartı. Bileşenler: `insight-callout`, `choice-chips`, `setup-card`, `track-bar-chart`, `segmented-control`, `select`, `dialog`, `badge`, `avatar`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof MulkYonetimiPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Mülkler",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Mülkler/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: /Riskli/ }));
    await expect(canvas.getByRole("button", { name: /Çınarlı Sitesi/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Papatya Evleri/ })).toBeNull();
  },
};

export const AddProperty: Story = {
  name: "Mülk Ekle",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole("button", { name: "Mülk Ekle" }));
    const dialog = await body.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Mülk Adı"), "Gül Sitesi");
    await userEvent.type(within(dialog).getByLabelText("Adres"), "Gül Sokak 3");
    await userEvent.click(within(dialog).getByRole("button", { name: "Güneş Paneli" }));
    await expect(within(dialog).getByText(/güneş paneli kontrolü/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Mülk Ekle" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: /Gül Sitesi/ })).toBeInTheDocument());
  },
};

export const Vendors: Story = {
  name: "Satıcılar",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("link", { name: "Satıcılar" }));
    await expect(await canvas.findByRole("heading", { level: 1, name: /Satıcılar/ })).toBeInTheDocument();
    await expect(canvas.getByText("Olağan Dışı Maliyet: Limanlı Loftlar")).toBeInTheDocument();
  },
};
