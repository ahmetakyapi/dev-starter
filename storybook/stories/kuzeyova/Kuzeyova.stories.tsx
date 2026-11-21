import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CUSTOMERS } from "./_data";
import { KuzeyovaApp } from "./_app";
import { KitGallery } from "./_kit-demo";
import { settle } from "./_settle";

/** Telefonda masaüstü öğeleri gizli: yalnızca görüneni tıkla. */
function visible(el: Element | null | undefined): el is HTMLElement {
  return !!el && (el as HTMLElement).offsetParent !== null;
}

/** Kenar çubuğundan (telefonda çekmeceden) bir sayfaya git ve başlığını bekle. */
async function go(root: HTMLElement, label: string) {
  const canvas = within(root);
  const pick = () =>
    canvas
      .queryAllByRole("navigation", { name: "Ana Gezinme" })
      .filter(visible)
      .flatMap((nav) => within(nav).queryAllByRole("link"))
      .find((a) => a.textContent?.startsWith(label));
  let link = pick();
  if (!link) {
    await userEvent.click(canvas.getByRole("button", { name: "Gezinmeyi Aç" }));
    await waitFor(() => expect(pick()).toBeTruthy());
    link = pick();
  }
  await userEvent.click(link!);
  await canvas.findByRole("heading", { level: 1, name: label }, { timeout: 3000 });
}

/** Adresten derin bağlantıyla (yenileme, geri tuşu) açıldıysa ilk-sayfa varsayımlı oynatma testleri atlanır. */
const deepLinked = () => {
  const q = new URLSearchParams(window.location.search);
  return q.has("e_view") && q.get("e_story") === q.get("id");
};

async function command(root: HTMLElement, query: string) {
  await userEvent.keyboard("{Control>}k{/Control}");
  const box = await within(root.ownerDocument.body).findByPlaceholderText("Müşteri, sayaç, sayfa ya da komut ara");
  await userEvent.type(box, query);
  await userEvent.keyboard("{Enter}");
}

const meta = {
  title: "Kuzeyova Portalı",
  id: "kuzeyova-portal",
  component: KuzeyovaApp,
  // autodocs YOK: kenar çubuğundan açınca açıklama sayfası değil doğrudan uygulama (Overview) açılır.
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Elektrik dağıtım şirketi operasyon portalı: tıklanabilir, tek kurgusal şirketin (Kuzeyova, 360 abone) tek sahte verisiyle çalışan bir demo. Sol menü: Pano; Müşteriler, Başvurular, Müşteri Kaydı; Sayaçlar, Sayaç Stok, Okumalar, Saha Okuma, Ham Veri, Üreticiler; Faturalar, Ödemeler, İtirazlar ve Mahsup; Arıza ve Kesintiler, Çağrı Merkezi, Kaçak Vakaları, İş Emirleri, Şebeke ve Trafo; Tedarikçiler; Raporlar; Uyum Merkezi, Ayarlar. Tek depo: bir sayfada yapılan işlem (ödeme, onay, ekip ataması) rozetleri, panoyu ve müşteri bakiyesini aynı anda günceller; adres çubuğu ve geri tuşu çalışır. Müşteri, sayaç, okuma, fatura ve ödeme listeleri tek kaynaktan türer: panodaki her toplam listelerin toplamıdır. ⌘K ile müşteri adı, tesisat no ya da sayaç seri no aranır; açık ve koyu temada aynı kalitede. Bütün veri ÖRNEKTİR.",
      },
    },
  },
  args: { initialPage: "dashboard", initialParams: {}, initialPeriod: "3" },
  argTypes: {
    initialPage: {
      control: "select",
      options: ["dashboard", "customers", "register", "meters", "readings", "rawdata", "invoices", "payments", "suppliers", "outages", "reports", "settings", "applications", "stock", "field", "producers", "disputes", "calls", "leaks", "workorders", "grid", "compliance"],
    },
    initialPeriod: { control: "inline-radio", options: ["1", "3", "6"] },
    initialParams: { control: false },
  },
} satisfies Meta<typeof KuzeyovaApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Uygulama (Gezinmeli)",
  parameters: { docs: { description: { story: "Bütün portal: kenar çubuğundan, ⌘K komut paletinden ve sayfa içi bağlantılardan gezilir; geçişte üstte gezinme çubuğu ve iskelet." } } },
  play: async ({ canvasElement, globals }) => {
    if (deepLinked()) return;
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Pano" });
    await go(canvasElement, "Faturalar");
    await go(canvasElement, "Sayaçlar");
    await command(canvasElement, CUSTOMERS[0].id);
    await canvas.findByRole("heading", { level: 1, name: "Müşteriler" }, { timeout: 3000 });
    await go(canvasElement, "Pano");
    await settle(globals);
  },
};

export const Dashboard: Story = {
  name: "Pano",
  parameters: { docs: { description: { story: "Altı hücreli ölçü şeridi (aktif abone, tüketim, tahsilat oranı, kayıp/kaçak, açık arıza, okunamayan sayaç), günlük yük eğrisi, tahakkuk ve tahsilat, bölgeye göre kayıp/kaçak, sıradaki işler, sistem durumu ve dikkat gerektirenler. Dönem seçimi hepsini birlikte değiştirir." } } },
  play: async ({ canvasElement, globals }) => {
    if (deepLinked()) return;
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("radio", { name: "6 Ay" }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: "6 Ay" })).toHaveAttribute("aria-checked", "true"));
    await userEvent.click(canvas.getByRole("radio", { name: "3 Ay" }));
    await expect(canvas.getByRole("heading", { name: "Dikkat Gerektirenler" })).toBeInTheDocument();
    await settle(globals);
  },
};

export const DashboardLastMonth: Story = {
  name: "Pano (Son Ay)",
  args: { initialPeriod: "1" },
  play: async ({ globals }) => settle(globals),
};

export const Customers: Story = { name: "Müşteriler", args: { initialPage: "customers" }, play: async ({ globals }) => settle(globals) };
export const Register: Story = { name: "Müşteri Kaydı", args: { initialPage: "register" }, play: async ({ globals }) => settle(globals) };
export const Meters: Story = { name: "Sayaçlar", args: { initialPage: "meters" }, play: async ({ globals }) => settle(globals) };
export const Readings: Story = { name: "Okumalar", args: { initialPage: "readings" }, play: async ({ globals }) => settle(globals) };
export const RawData: Story = { name: "Ham Veri", args: { initialPage: "rawdata" }, play: async ({ globals }) => settle(globals) };
export const Invoices: Story = { name: "Faturalar", args: { initialPage: "invoices" }, play: async ({ globals }) => settle(globals) };
export const Payments: Story = { name: "Ödemeler", args: { initialPage: "payments" }, play: async ({ globals }) => settle(globals) };
export const Suppliers: Story = { name: "Tedarikçiler", args: { initialPage: "suppliers" }, play: async ({ globals }) => settle(globals) };
export const Outages: Story = { name: "Arıza ve Kesintiler", args: { initialPage: "outages" }, play: async ({ globals }) => settle(globals) };
export const Reports: Story = { name: "Raporlar", args: { initialPage: "reports" }, play: async ({ globals }) => settle(globals) };
export const Settings: Story = { name: "Ayarlar", args: { initialPage: "settings" }, play: async ({ globals }) => settle(globals) };

export const Kit: Story = {
  name: "Kit (Ortak Parçalar)",
  parameters: {
    docs: { description: { story: "Sayfaların ortak dili: sayı biçimi, PageHero ve Metric, role göre TodayBand, BarTarget, StepCountChart, RowLink ve j/k, FilterBar, boş/hata/yetkisiz durumlar. Rolü değiştirince Bugün Senin İşin bandı değişir." } },
  },
  render: () => <KitGallery />,
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("radio", { name: "Tahsilat" }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Tahsilat" })).toHaveAttribute("aria-checked", "true"));
    await expect(canvas.getByRole("heading", { name: "Bugün Senin İşin" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: "Yönetici" }));
    await settle(globals);
  },
};
