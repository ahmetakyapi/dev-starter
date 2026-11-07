/// <reference types="vite/client" />
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BOARD, DELAYED, OPEN_TICKETS, TICKETS, periodStats, tl } from "./_data";
import { PusulaApp } from "./_app";
import { TanitimPage } from "./_tanitim";
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

/** Katalogdaki bileşen sayısı: elle yazılmaz, snippets/ui klasöründen sayılır (Kapsam hikâyesiyle aynı yöntem). */
const TOTAL = Object.keys(import.meta.glob("../../../snippets/ui/*.tsx")).length;

async function command(root: HTMLElement, query: string) {
  await userEvent.keyboard("{Control>}k{/Control}");
  const box = await within(root.ownerDocument.body).findByPlaceholderText("Sayfa, talep ya da komut ara");
  await userEvent.type(box, query);
  await userEvent.keyboard("{Enter}");
}

const meta = {
  title: "Örnek Tasarım/Pusula Paneli",
  id: "demo-app",
  component: PusulaApp,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          `Pusula: küçük ekipler için destek + satış + görev + takvim + asistan paneli. Kataloğun ${TOTAL} bileşeninin hepsi tek bir kurgusal üründe, aynı sahte veriyle (Pusula, 2 Kasım 2026) birlikte çalışır: panodaki ciro = müşteriye göre listenin toplamı = rapor tablosunun dip satırı. Kenar çubuğu, ⌘K ve sayfa içi bağlantılar iç durumla gezer; dönem seçimi (Hafta/Ay/Yıl) bütün grafikleri birlikte değiştirir. Kapsam tablosu: Ekranlar/Showcase/Bileşen Kapsamı.`,
      },
    },
  },
  args: { initialPage: "dashboard", initialPeriod: "ay", signedOut: false },
  argTypes: {
    initialPage: { control: "select", options: ["dashboard", "inbox", "tasks", "calendar", "assistant", "reports", "settings"] },
    initialPeriod: { control: "inline-radio", options: ["hafta", "ay", "yil"] },
    initialParams: { control: false },
  },
} satisfies Meta<typeof PusulaApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Uygulama (Gezinmeli)",
  parameters: {
    docs: { description: { story: "Bütün uygulama: kenar çubuğundan, ⌘K komut paletinden ve sayfa içi bağlantılardan gezilir; geçişte üstte gezinme çubuğu ve iskelet." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Pano" });
    // 1. Kenar çubuğu
    await go(canvasElement, "Gelen Kutusu");
    await expect(canvas.getByRole("table", { name: "Talepler" })).toBeInTheDocument();
    // 2. ⌘K → Takvim
    await command(canvasElement, "Takvim");
    await canvas.findByRole("heading", { level: 1, name: "Takvim" }, { timeout: 3000 });
    // 3. ⌘K → açık bir talep, gelen kutusunda ayrıntısıyla açılır
    await command(canvasElement, OPEN_TICKETS[0].id);
    const sheet = await canvas.findByRole("dialog", { name: OPEN_TICKETS[0].subject }, { timeout: 3000 });
    // Sentetik Escape yerel <dialog>'un iptalini tetiklemez: kapat düğmesi.
    await userEvent.click(within(sheet).getByRole("button", { name: "Kapat" }));
    await waitFor(() => expect(sheet).not.toBeVisible());
    // 4. Kenar çubuğundan panoya dönüş
    await go(canvasElement, "Pano");
    await settle(globals);
  },
};

export const Dashboard: Story = {
  name: "Pano",
  parameters: {
    docs: { description: { story: "Dört ölçü karosu ve on iki grafik; dönem seçimi hepsini birlikte değiştirir. Sipariş ve dönüşüm birleşik grafikte, dönem hedefleri aktivite halkalarında. Yan yana kartlar eşit boyda, lejantlar dipte hizalı." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const yil = periodStats("yil");
    await userEvent.click(await canvas.findByRole("radio", { name: "Hafta" }));
    await waitFor(() => expect(canvas.getAllByText(/Son 7 Gün/).length).toBeGreaterThan(0));
    await userEvent.click(canvas.getByRole("radio", { name: "Yıl" }));
    await waitFor(() => expect(canvas.getAllByText(tl.format(yil.revenue)).length).toBeGreaterThanOrEqual(3));
    await userEvent.click(canvas.getByRole("radio", { name: "Ay" }));
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Ay" })).toHaveAttribute("aria-checked", "true"));
    await settle(globals);
  },
};

export const DashboardLast7Days: Story = {
  name: "Pano (Son 7 Gün)",
  args: { initialPeriod: "hafta" },
  play: async ({ globals }) => settle(globals),
};

export const Inbox: Story = {
  name: "Gelen Kutusu",
  args: { initialPage: "inbox" },
  parameters: {
    docs: { description: { story: "Talep tablosu: arama alanı (“/” kısayolu, Türkçe harf düzleme), öncelik çipleri, müşteri seçimi, sıralama ve sayfalama; atanan kişinin üstüne gelince önizleme kartı, satıra sağ tıklayınca bağlam menüsü, ada basınca yan çekmecede ayrıntı. Arşivleme bildirimi Geri Al düğmeli. Süzgeç boş kalınca boş durum." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const atlas = TICKETS.filter((t) => t.customerId === "atlas");
    // Öncelik süzgeci
    const acil = await canvas.findByRole("button", { name: /^Acil/ });
    await userEvent.click(acil);
    await expect(acil).toHaveAttribute("aria-pressed", "true");
    const table = canvas.getByRole("table", { name: "Talepler" });
    await waitFor(() => expect(within(table).getAllByRole("row").length).toBe(TICKETS.filter((t) => t.priority === "Acil").length + 1));
    // Müşteri + Acil: Atlas'ın acil talebi yok → boş durum
    if (!atlas.some((t) => t.priority === "Acil")) {
      await userEvent.type(canvas.getByRole("combobox", { name: "Müşteri" }), "Atlas");
      await userEvent.click(await within(document.body).findByRole("option", { name: "Atlas Konaklama" }));
      await canvas.findByRole("heading", { name: "Bu Süzgeçlere Uyan Talep Yok" });
      await userEvent.click(canvas.getByRole("button", { name: "Süzgeçleri Temizle" }));
    }
    await waitFor(() => expect(within(canvas.getByRole("table", { name: "Talepler" })).getAllByRole("row").length).toBe(9));
    // Sıralama: öncelik başlığı
    await userEvent.click(canvas.getByRole("link", { name: /Öncelik/ }));
    await waitFor(() => expect(canvas.getByRole("columnheader", { name: /Öncelik/ })).toHaveAttribute("aria-sort"));
    await settle(globals);
  },
};

export const TicketDetail: Story = {
  name: "Gelen Kutusu (Talep Ayrıntısı)",
  args: { initialPage: "inbox", initialParams: { ticket: TICKETS[0].id } },
  parameters: {
    docs: { description: { story: `Yan çekmecede ${TICKETS[0].id}: geciken ${DELAYED[0]?.id ?? "sipariş"} siparişine bağlı acil talep, olay akışı ve izleyenler.` } },
  },
  play: async ({ canvasElement, globals }) => {
    const sheet = await within(canvasElement).findByRole("dialog", { name: TICKETS[0].subject });
    await expect(within(sheet).getByRole("heading", { name: "Olay Akışı" })).toBeInTheDocument();
    await settle(globals);
  },
};

export const Tasks: Story = {
  name: "Görevler",
  args: { initialPage: "tasks" },
  parameters: {
    docs: { description: { story: "Ekip panosu (kanban: fare, dokunma tutamağı ya da klavyeyle taşınır, Sürüyor kolonunda iş sınırı), kişinin bugünkü görev listesi ve yaklaşan son tarihler. Kart kolon değiştirince sonuç bildirim olarak gelir." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Görevler" });
    // Klavyeyle taşıma: Yapılacak'ın ilk kartı Sürüyor'a.
    const first = BOARD[0].cards[0];
    const card = canvas.getByRole("button", { name: new RegExp(`^${first.title}`) });
    card.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    await within(document.body).findByText("Sürüyor Kolonuna Taşındı");
    await settle(globals);
  },
};

export const Calendar: Story = {
  name: "Takvim",
  args: { initialPage: "calendar" },
  parameters: {
    docs: { description: { story: "Aralık takvimi ve ajanda, seçilen haftanın saat ızgarası (türler aç-kapa grubuyla süzülür); altta üç adımlı randevu akışı, onay diyaloğu, kısa bildirim ve bildirim merkezine kayıt." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Devam" }));
    await canvas.findByRole("listitem", { current: "step" });
    await userEvent.click(canvas.getByRole("button", { name: "Devam" }));
    await userEvent.click(canvas.getByRole("button", { name: "Randevuyu Onayla" }));
    const dialog = await canvas.findByRole("dialog", { name: "Randevu Oluşturulsun mu?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Oluştur ve Davet Gönder" }));
    // Bildirim (toast) sayfanın köküne taşınır: kanvasta değil, belgede aranır.
    await within(document.body).findByText("Randevu Oluşturuldu");
    await expect(canvas.getByRole("button", { name: /Bildirimler, \d+ okunmamış/ })).toBeInTheDocument();
    await settle(globals);
  },
};

export const Assistant: Story = {
  name: "Asistan",
  args: { initialPage: "assistant" },
  parameters: {
    docs: { description: { story: "Ajan planı canlı ilerler, bitince geciken siparişler için taslaklar gelir. Soru yazınca yanıt panodaki sayılarla verilir." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const box = await canvas.findByRole("textbox");
    await userEvent.type(box, "Bu haftanın satış özetini çıkar{Enter}");
    await canvas.findByText(/Son 7 günde/, undefined, { timeout: 4000 });
    await settle(globals);
  },
};

export const Reports: Story = {
  name: "Raporlar",
  args: { initialPage: "reports" },
  parameters: {
    docs: { description: { story: "Hazır rapor kartları, sekmeler; satış tablosunun toplamı panodaki ciroyla aynı, birikimli ciro çizgileri tablonun ilk dört satırında biter, müşteri haritası tablonun sütunlarını saçılım olarak gösterir. Destek sekmesinde kapanış anketi puanı; dışa aktarma sekmesinde dosya hazırlanırken yükleme durumu." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("tab", { name: "Dışa ve İçe Aktar" }));
    await userEvent.click(await canvas.findByRole("button", { name: "CSV Oluştur" }));
    // Sonuç bildirimi (toast) belgenin kökünde; kanvasta değil.
    await within(document.body).findByText("Dışa Aktarma Hazır", undefined, { timeout: 5000 });
    await userEvent.click(canvas.getByRole("tab", { name: "Satış" }));
    await expect(canvas.getByRole("table", { name: "Müşteri Bazında Ciro" })).toBeInTheDocument();
    await settle(globals);
  },
};

export const ReportsLoading: Story = {
  name: "Raporlar (Yükleniyor)",
  args: { initialPage: "reports", initialParams: { preview: "loading" } },
  parameters: { docs: { description: { story: "Satış tablosunun yerinde iskelet satırlar; kap `aria-busy`." } } },
  play: async ({ globals }) => settle(globals),
};

export const Settings: Story = {
  name: "Ayarlar",
  args: { initialPage: "settings" },
  parameters: {
    docs: { description: { story: "Form girişlerinin hepsi bir ayar sayfasında; iki adımlı doğrulamada kod yazılınca onay; Hızlı Ayarlar penceresi." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const group = await canvas.findByRole("group", { name: "Doğrulama Kodu" });
    await userEvent.click(within(group).getAllByRole("textbox")[0]);
    await userEvent.keyboard("482913");
    await canvas.findByText("İki Adımlı Doğrulama Açık");
    await settle(globals);
  },
};

export const SignedOut: Story = {
  name: "Oturum Kapalı",
  args: { signedOut: true },
  parameters: { docs: { description: { story: "Kenar çubuğundaki Oturumu Kapat buraya getirir; çalışma alanı e-postasıyla girince pano açılır." } } },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText("E-Posta"), "ahmet@gmail.com");
    await userEvent.type(canvas.getByLabelText("Şifre"), "pusula2026");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Yap" }));
    await canvas.findByText(/pusula\.app/, { selector: "[id$='-error'], p, span" }, { timeout: 3000 });
    await settle(globals);
  },
};

export const SampleAccount: Story = {
  name: "Örnek Hesapla Giriş",
  args: { signedOut: true },
  parameters: {
    docs: {
      description: {
        story: "Şifre yazdırmadan tek tıkla giriş: form gönderilmez, tarayıcı “şifre kaydedilsin mi?” ya da veri ihlali uyarısı açmaz. Yalnız örnek uygulamada.",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Örnek Hesapla Gir/ }));
    await canvas.findByRole("heading", { name: "Pano" }, { timeout: 3000 });
    await settle(globals);
  },
};

export const Landing: Story = {
  name: "Tanıtım Sayfası",
  render: () => <TanitimPage onSignIn={() => {}} />,
  parameters: {
    // Sabit menü ve köşe maskotu belge sayfasının üstüne binmesin: kendi çerçevesinde.
    docs: {
      story: { inline: false, height: "900px" },
      description: {
        story:
          "Oturum açmamış ziyaretçinin sayfası (Ribbon turu): kaydırınca üst kenara oturan menü, bulanıktan netleşen serif vurgulu başlık, görsel zemin üstünde sıvı cam eylem ve güven satırı, pencere şeridi + dock ile sayfada denenen ürün maketi, el yazısı ok notu, köşe maskotu.",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Talepleri kaybetmeden yanıtla." });
    const dock = canvas.getByRole("toolbar", { name: "Pusula uygulamaları" });
    await userEvent.click(within(dock).getByRole("button", { name: "Takvim" }));
    await waitFor(() => expect(canvas.getByRole("img", { name: /odakta Takvim/ })).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Maskota merhaba de" }));
    await canvas.findByText("Merhaba!");
    await settle(globals);
  },
};
