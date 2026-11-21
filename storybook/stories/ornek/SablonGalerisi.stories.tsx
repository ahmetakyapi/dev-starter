import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SablonGalerisiPage } from "./_sablon";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Şablon Galerisi",
  id: "sample-templates",
  component: SablonGalerisiPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Hazır akış şablonlarının galerisi (Axon referansı: yapı ve davranış; ad, metin ve sayılar kurgusal, ÖRNEK VERİ). Öne çıkan üç kart, kategori çipleri, arama (`/` kısayolu) ve sıralama; karta basınca ayrıntı penceresi açılır: numaralı adımlar (tetik, yapay zeka, mantık, eylem, insan), gereken bağlantılar, etki ölçüleri ve etiketler. Eksik bağlantıyı \"Bağla\" ile bağlayınca özet güncellenir ve \"Şablonu kullan\" açılır. Bileşenler: `app-shell`, `requirement-list`, `dialog`, `filter-chip`, `search-field`, `select`, `badge`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof SablonGalerisiPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Varsayılan hikaye hiçbir süzgeç bırakmaz: "Hepsi" açık ve bütün şablonlar ızgarada. */
export const Gallery: Story = {
  name: "Galeri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Şablonlar" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { pressed: true, name: /^Hepsi/ })).toBeInTheDocument();
  },
};

export const Filtered: Story = {
  name: "Kategori Süzülü",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Şablonlar" });
    // Kategori süzgeci: Destek'te tek şablon.
    await userEvent.click(canvas.getByRole("button", { pressed: false, name: /^Destek/ }));
    await expect(canvas.getAllByRole("heading", { level: 3, name: /Destek talebini etiketle/ }).length).toBeGreaterThan(0);
    await expect(canvas.queryByRole("heading", { level: 3, name: /Toplantı notlarından/ })).toBeNull();
  },
};

export const Detail: Story = {
  name: "Ayrıntı Penceresi",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Şablonlar" });
    // Kartın başlık butonu kartın tamamını kaplar.
    await userEvent.click(canvas.getAllByRole("button", { name: /Faturayı yakala/ })[0]);
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    await expect(within(dialog).getByText("Adımlar")).toBeInTheDocument();
    await expect(within(dialog).getByText(/hepsi bağlanınca şablon kullanılabilir/)).toBeInTheDocument();
    // Eksik bağlantı bağlanınca özet güncellenir, "Şablonu kullan" açılır.
    await userEvent.click(within(dialog).getByRole("button", { name: /^Sohbet uygulamasını bağla$/ }));
    await waitFor(() => expect(within(dialog).getByText("Bütün bağlantılar hazır.")).toBeInTheDocument());
    await expect(within(dialog).getByRole("button", { name: /Şablonu kullan/ })).toBeEnabled();
  },
};
