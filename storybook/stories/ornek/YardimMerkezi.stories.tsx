import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { YardimMerkeziPage } from "./_yardim";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Yardım Merkezi",
  id: "sample-help-center",
  component: YardimMerkeziPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Bir ürünün yardım merkezi (MailPulse referansı: yapı ve davranış; ürün, makale ve sayılar kurgusal, ÖRNEK VERİ). Ortada arama kutusu (`/` kısayolu): makaleleri yazdıkça süzer, eşleşen sözcük vurgulanır; \"Popüler\" çipleri aramayı doldurur. Altında altı kategori kartı, popüler makaleler, \"Bize ulaş\" yolları (canlı sohbet çevrimiçi rozetiyle) ve sistem durumu. Bileşenler: `category-card`, `status-list`, `search-field`, `filter-chip`, `badge`, `app-shell`.",
      },
    },
  },
  args: {},
} satisfies Meta<typeof YardimMerkeziPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  name: "Ana Sayfa",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Yardım Merkezi" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Başlarken" })).toHaveAttribute("href", "#kategori-baslangic");
    await expect(canvas.getAllByText("Tüm sistemler çalışıyor").length).toBeGreaterThan(0);
  },
};

export const Search: Story = {
  name: "Arama Süzer",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = await canvas.findByRole("searchbox", { name: "Yardım ara" });
    await userEvent.type(box, "dkim");
    await waitFor(() => expect(canvas.getByRole("heading", { level: 2, name: "1 sonuç" })).toBeInTheDocument());
    // Arama sürerken kategori kartları gizlenir.
    await expect(canvas.queryByRole("link", { name: "Başlarken" })).toBeNull();
  },
};
