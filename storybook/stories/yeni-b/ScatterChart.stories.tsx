import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ChartCard } from "@/components/ui/chart-card";
import { ScatterChart } from "@/components/ui/scatter-chart";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "../grafik/_sahne";
import { KAMPANYALAR, KANALLAR, sayi, toplam } from "./_veri";

const HARCAMA = { label: "Harcama", unit: "bin ₺" };
const KAYIT = { label: "Yeni Kayıt", unit: "kayıt" };
const TIKLAMA = { label: "Tıklama" };

const meta = {
  title: "Grafikler/Saçılım Grafiği",
  id: "scatter-chart",
  component: ScatterChart,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "İki ölçü arasındaki ilişki (harcama ↔ kayıt); nokta boyu isteğe bağlı üçüncü ölçü, alanla (√) ölçeklenir, rengi kategori. İmleçte ekran pikselinde en yakın nokta seçilir; klavyede noktalar X sırasıyla gezilir. Kategori anahtarı süzgeç, ama eksen kaymaz: saçılımda konum kıyas içindir.",
      },
    },
  },
  args: {
    title: "Kampanya Harcaması ve Yeni Kayıt",
    points: KAMPANYALAR,
    categories: KANALLAR,
    x: HARCAMA,
    y: KAYIT,
    size: TIKLAMA,
    height: "h-72",
  },
  argTypes: {
    points: { control: "object" },
    categories: { control: "object" },
    x: { control: "object" },
    y: { control: "object" },
    size: { control: "object" },
    height: { control: "select", options: ["h-56", "h-72", "h-96"] },
  },
  render: (args) => (
    <Sahne width="lg">
      <ChartCard
        id="sacilim-kart"
        label={args.title}
        value={`${sayi(toplam(args.points.map((p) => p.y)))} kayıt`}
        change={12.4}
        changeLabel="önceki çeyreğe göre"
        action={<Donem defaultValue="90g" />}
      >
        <ScatterChart {...args} />
      </ChartCard>
    </Sahne>
  ),
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector("figure [aria-live]");
    const plot = canvas.getByRole("group", { name: /ok tuşlarıyla/ });
    plot.focus();
    // En düşük harcama ilk: Haftalık Bülten (4 bin ₺)
    await userEvent.keyboard("{Home}");
    await expect(live).toHaveTextContent("Haftalık Bülten (E-Posta): Harcama 4 bin ₺, Yeni Kayıt 260 kayıt, Tıklama 6.100");
    // E-posta gizlenince klavye onu atlar
    await userEvent.click(canvas.getByRole("button", { name: "E-Posta" }));
    plot.focus();
    await userEvent.keyboard("{Home}");
    await expect(live).toHaveTextContent(/^Kullanıcı Hikâyeleri \(Sosyal Medya\)/);
  },
};

export const UniformSize: Story = {
  name: "Tek Boy (İki Ölçü)",
  args: { size: undefined },
};

export const SingleCategory: Story = {
  name: "Tek Kategori",
  args: {
    title: "Arama Ağı Kampanyaları",
    points: KAMPANYALAR.filter((p) => p.category === "arama"),
    categories: [KANALLAR[0]],
  },
};

export const FewData: Story = {
  name: "Az Veri (Üç Nokta)",
  args: { points: KAMPANYALAR.filter((p) => ["Marka Araması", "Kış İndirimi", "Haftalık Bülten"].includes(p.label)) },
};

export const Empty: Story = {
  name: "Boş",
  args: { points: [] },
};

export const LongLabels: Story = {
  name: "Uzun Adlar",
  args: {
    categories: [
      { key: "arama", label: "Arama Ağı ve Alışveriş Reklamları", series: 1 },
      { key: "sosyal", label: "Sosyal Medya Sponsorlu İçerikleri", series: 2 },
      { key: "eposta", label: "E-Posta ve Bülten", series: 3 },
      { key: "gorsel", label: "Görüntülü Reklam Ağı", series: 4 },
    ],
    points: KAMPANYALAR.map((p, i) => (i === 3 ? { ...p, label: "Ücretsiz Deneme Kampanyası, Kasım Dönemi Genişletilmiş Hedefleme" } : p)),
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      <GrafikHucre label="Üç ölçü, dört kategori">
        <ChartCard id="sacilim-v1" label="Kampanya Harcaması ve Yeni Kayıt" value="6.350 kayıt" change={12.4}>
          <ScatterChart title="Kampanya Harcaması ve Yeni Kayıt" points={KAMPANYALAR} categories={KANALLAR} x={HARCAMA} y={KAYIT} size={TIKLAMA} height="h-56" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="İki ölçü, tek boy">
        <ChartCard id="sacilim-v2" label="Harcama ve Kayıt, Tek Boy" value="6.350 kayıt">
          <ScatterChart title="Kampanya Harcaması ve Yeni Kayıt" points={KAMPANYALAR} categories={KANALLAR} x={HARCAMA} y={KAYIT} height="h-56" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Tek kategori">
        <ChartCard id="sacilim-v3" label="Arama Ağı Kampanyaları" value="2.920 kayıt" change={-3.1}>
          <ScatterChart
            title="Arama Ağı Kampanyaları"
            points={KAMPANYALAR.filter((p) => p.category === "arama")}
            categories={[KANALLAR[0]]}
            x={HARCAMA}
            y={KAYIT}
            size={TIKLAMA}
            height="h-56"
          />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Boş">
        <ChartCard id="sacilim-v4" label="Aralık Kampanyaları" value="0 kayıt">
          <ScatterChart title="Kampanya Harcaması ve Yeni Kayıt" points={[]} categories={KANALLAR} x={HARCAMA} y={KAYIT} height="h-56" />
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
