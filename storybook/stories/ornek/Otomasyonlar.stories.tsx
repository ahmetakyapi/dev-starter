import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { OtomasyonlarPage } from "./_otomasyonlar";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Otomasyonlar",
  id: "sample-automations",
  component: OtomasyonlarPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Otomasyon panosu: tek kartta dört ölçü, gün başına kredi (`StackedBarChart`), sıradaki çalışmalar (`ScheduleList`), aylık kredi (`SegmentedMeter`) ve bütün otomasyonların tablosu (`TickMeter` ile kredi çubuğu). Dönem seçimi şeridi, grafiği ve tabloyu birlikte değiştirir; telefonda tablo kayıt listesine döner. Bütün veri kurgusal ve sayfada \"ÖRNEK VERİ\" künyesiyle işaretli.",
      },
    },
  },
  args: { initialPeriod: "7", initialFilter: "all" },
  argTypes: {
    initialPeriod: { control: "inline-radio", options: ["7", "30", "90"] },
    initialFilter: { control: "inline-radio", options: ["all", "active", "paused"] },
  },
} satisfies Meta<typeof OtomasyonlarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Otomasyonlar/ })).toBeInTheDocument();
    // Dönem değişince grafiğin alt notu döner; sonunda varsayılana dönülür (hikaye "Hepsi" ve 7 günle açık kalır).
    await userEvent.click(canvas.getByRole("radio", { name: "30 gün" }));
    await expect(canvas.getByText("Son 30 gün, otomasyona göre")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: "7 gün" }));
  },
};

export const Paused: Story = {
  name: "Duraklatılmışlar Süzülü",
  args: { initialFilter: "paused" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Masaüstünde tablo, telefonda kayıt listesi: hangisi görünüyorsa onda yalnız iki satır kalır.
    const table = canvas.queryByRole("table", { name: "Bütün otomasyonlar" });
    const list = canvas.queryByRole("list", { name: "Bütün otomasyonlar" });
    if (table) await expect(within(table).getAllByRole("row")).toHaveLength(3);
    else await expect(within(list!).getAllByRole("listitem")).toHaveLength(2);
  },
};
