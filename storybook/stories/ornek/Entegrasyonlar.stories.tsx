import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { EntegrasyonlarPage } from "./_entegrasyon";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Entegrasyonlar",
  id: "sample-integrations",
  component: EntegrasyonlarPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bir ürünün entegrasyon sayfası (MailPulse referansı: yapı ve davranış; ürün ve uygulama adları kurgusal, ÖRNEK VERİ). On iki kartlık ızgara; \"Bağla\" izin dökümlü pencereyi açar (okur/yazar rozetli izinler, para birimi, içe aktarma anahtarı), bağlayınca kart bağlı olur ve bildirim çıkar. Bağlı kartın menüsünde ayrıntılar, şimdi eşitle, duraklat, webhook adresi ve yıkıcı \"Bağlantıyı kes\" var; \"Ayrıntılar\" yan panelde Ayarlar / Olaylar / Son hareket sekmelerini açar, bağlantıyı kesme karşı kenarda. Bileşenler: `integration-card`, `permission-list`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `switch`, `select`, `toast`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof EntegrasyonlarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  name: "Izgara ve Bağlama",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Entegrasyonlar" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Kargo uygulamasını bağla" }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    await expect(within(dialog).getByText("Sipariş ve alıcıları okur")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Kargo ile bağlan" }));
    // Kart bağlı olur: "Kargo uygulamasını bağla" butonu kalkar, bildirim çıkar.
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Kargo uygulamasını bağla" })).toBeNull());
    await expect(await within(canvasElement.ownerDocument.body).findByText("Kargo bağlandı")).toBeInTheDocument();
  },
};

export const Detail: Story = {
  name: "Ayrıntı Paneli",
  args: { initialDetail: "sohbet" },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const panel = await body.findByRole("dialog");
    await expect(within(panel).getByRole("button", { name: /Bağlantıyı kes/ })).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole("tab", { name: "Olaylar" }));
    await expect(within(panel).getByRole("switch", { name: /Yeni ücretli abone/ })).toBeChecked();
  },
};
