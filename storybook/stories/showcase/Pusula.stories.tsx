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
  title: "Pusula",
  id: "demo-app",
  component: PusulaApp,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          `Pusula: küçük ekipler için destek + satış + görev + takvim + asistan paneli. Kataloğun ${TOTAL} bileşeninin hepsi tek bir kurgusal üründe, aynı sahte veriyle (Pusula, 2 Kasım 2026) birlikte çalışır: panodaki ciro = müşteriye göre listenin toplamı = rapor tablosunun dip satırı. Kenar çubuğu, ⌘K ve sayfa içi bağlantılar iç durumla gezer; dönem seçimi (Hafta/Ay/Yıl) bütün grafikleri birlikte değiştirir. Kapsam tablosu: Arşiv → Bileşen Kapsamı.`,
      },
    },
  },
  args: { initialPage: "dashboard", initialPeriod: "ay", signedOut: false },
  argTypes: {
    initialPage: { control: "select", options: ["dashboard", "inbox", "tasks", "calendar", "assistant", "reports", "notifications", "settings"] },
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
    // Sentetik Escape yerel <dialog>'un iptalini tetiklemez: kapat butonu.
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
    docs: { description: { story: "Kıl çizgiyle bölünmüş dört hücreli ölçü şeridi ve on iki grafik; dönem seçimi hepsini birlikte değiştirir. Sipariş ve dönüşüm birleşik grafikte, dönem hedefleri aktivite halkalarında. Yan yana kartlar eşit boyda, lejantlar dipte hizalı." } },
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
    docs: { description: { story: "Talep tablosu: arama alanı (“/” kısayolu, Türkçe harf düzleme), öncelik çipleri, müşteri seçimi, sıralama ve sayfalama; atanan kişinin üstüne gelince önizleme kartı, satıra sağ tıklayınca bağlam menüsü, ada basınca yan çekmecede ayrıntı. Arşivleme bildirimi Geri Al butonlu. Filtre boş kalınca boş durum." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const atlas = TICKETS.filter((t) => t.customerId === "atlas");
    // Öncelik filtresi
    const acil = await canvas.findByRole("button", { name: /^Acil/ });
    await userEvent.click(acil);
    await expect(acil).toHaveAttribute("aria-pressed", "true");
    const table = canvas.getByRole("table", { name: "Talepler" });
    await waitFor(() => expect(within(table).getAllByRole("row").length).toBe(TICKETS.filter((t) => t.priority === "Acil").length + 1));
    // Müşteri + Acil: Atlas'ın acil talebi yok → boş durum
    if (!atlas.some((t) => t.priority === "Acil")) {
      await userEvent.type(canvas.getByRole("combobox", { name: "Müşteri" }), "Atlas");
      await userEvent.click(await within(document.body).findByRole("option", { name: "Atlas Konaklama" }));
      await canvas.findByRole("heading", { name: "Bu Filtrelere Uyan Talep Yok" });
      await userEvent.click(canvas.getByRole("button", { name: "Filtreleri Temizle" }));
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
    await userEvent.click(within(sheet).getByRole("tab", { name: /Olay Akışı/ }));
    await expect(within(sheet).getByRole("heading", { name: "Olay Akışı" })).toBeInTheDocument();
    await settle(globals);
  },
};

export const Tasks: Story = {
  name: "Görevler",
  args: { initialPage: "tasks" },
  parameters: {
    docs: { description: { story: "Ekip panosu (kanban: fare, dokunma tutamağı ya da klavyeyle taşınır, Sürüyor kolonunda iş sınırı), kişinin bugünkü görev listesi ve yaklaşan son tarihler. Karta basınca (ya da Enter) ayrıntı paneli açılır: sorumlu, son tarih, etiketler; oradan sonraki kolona taşınır ya da tamamlanır. Kart kolon değiştirince sonuç bildirim olarak gelir." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Görevler" });
    // Klavyeyle taşıma: Yapılacak'ın ilk kartı Sürüyor'a.
    const first = BOARD[0].cards[0];
    // Panoda ara: "Yaklaşan Son Tarihler" satırları da aynı adla başlayan butonlar.
    const board = canvas.getByRole("region", { name: "Ekip İşleri" });
    const card = within(board).getByRole("button", { name: new RegExp(`^${first.title}`) });
    card.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    await within(document.body).findByText("Sürüyor Kolonuna Taşındı");
    // Karta basınca ayrıntı paneli açılır; oradan "Tamamlandı" kartı Bitti'ye taşır.
    const second = BOARD[0].cards[1];
    await userEvent.click(within(board).getByRole("button", { name: new RegExp(`^${second.title}`) }));
    const detail = await canvas.findByRole("dialog", { name: second.title });
    await userEvent.click(within(detail).getByRole("button", { name: "Tamamlandı" }));
    await waitFor(() => expect(detail).not.toBeVisible());
    await within(document.body).findByText("İş Tamamlandı");
    // Pano dışarıdan taşınınca yeniden kurulur: bölgeyi yeniden bul.
    await waitFor(() => expect(canvas.getByRole("region", { name: "Ekip İşleri" }).querySelector(`[data-column="bitti"] [data-card="${second.id}"]`)).not.toBeNull());
    // Ekip kararı: oy ver, sonuç görünür; aynı seçeneğe yeniden basınca geri alınır.
    const opt = canvas.getByRole("button", { name: /^%10 · hacim artışı için/ });
    await userEvent.click(opt);
    await expect(opt).toHaveAttribute("aria-pressed", "true");
    await expect(opt).toHaveAccessibleName(/yüzde 67, 4 oy, senin oyun/);
    await userEvent.click(opt);
    await expect(opt).toHaveAttribute("aria-pressed", "false");
    await settle(globals);
  },
};

export const Calendar: Story = {
  name: "Takvim",
  args: { initialPage: "calendar" },
  parameters: {
    docs: { description: { story: "Solda Bugün paneli (aralık seçen ay takvimi; Yapılacaklar son tarihe göre gruplu, gruba + ile iş eklenir; Etkinlikler ajandası), sağda kart görünümlü iş haftası: ikonlu kartlar, görüntülü görüşmede Katıl butonu, Son Tarih satırında ekip panosunun son tarihleri. Altta üç adımlı randevu akışı, onay diyaloğu, kısa bildirim ve bildirim merkezine kayıt." } },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    // Bugün paneli: Planlanmamış grubuna "+" ile iş ekle, Enter'la kaydet.
    await userEvent.click(await canvas.findByRole("button", { name: "Planlanmamış grubuna iş ekle" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Planlanmamış: yeni iş" }), "Kargo firmasıyla sözleşmeyi yenile{Enter}");
    await expect(canvas.getByRole("checkbox", { name: "Kargo firmasıyla sözleşmeyi yenile" })).toBeInTheDocument();
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

export const Notifications: Story = {
  name: "Bildirimler",
  args: { initialPage: "notifications" },
  parameters: {
    docs: {
      description: {
        story:
          "Sekmeli ve gün gün gruplu akış; satırda işin kendisi (Onayla, Teklifi Aç, Yanıtla, Yeniden Bağla), ⋯ menüsünde okunma, erteleme, sessize alma. Onaylanan satır yeşile döner, bildirim Geri Al butonlu. Sağda teslimat kanalları ve ertelenenler; Tercihler yan panelde olay × kanal tablosu (sütun başlığı bütün sütunu açar/kapar). Sayılar Pusula'nın verisinden. Zil kutusu ve kenar çubuğu rozeti aynı kaydı okur: burada okunan orada da okunmuş.",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Bildirimler" });
    await userEvent.click(canvas.getByRole("button", { name: "Onayla" }));
    await within(canvas.getByRole("tabpanel")).findByText("Onaylandı");
    // Sonuç iki yerde: kısa bildirim balonu ve (tek kayıt olduğu için) akışın başı.
    await waitFor(async () => expect((await within(document.body).findAllByText(/İndirim Onaylandı/)).length).toBeGreaterThanOrEqual(2));
    await userEvent.click(canvas.getByRole("button", { name: "Tercihler" }));
    const sheet = await canvas.findByRole("dialog", { name: "Bildirim Tercihleri" });
    const column = within(sheet).getByRole("checkbox", { name: "SMS: bütün olaylar" });
    await userEvent.click(column);
    await expect(within(sheet).getByRole("checkbox", { name: "Onay İstekleri, SMS" })).toBeChecked();
    await userEvent.click(within(sheet).getByRole("button", { name: "Vazgeç" }));
    // Vazgeç taslağı atar: yeniden açınca SMS sütunu eski hâlinde.
    await userEvent.click(canvas.getByRole("button", { name: "Tercihler" }));
    const again = await canvas.findByRole("dialog", { name: "Bildirim Tercihleri" });
    await expect(within(again).getByRole("checkbox", { name: "Onay İstekleri, SMS" })).not.toBeChecked();
    await userEvent.click(within(again).getByRole("button", { name: "Vazgeç" }));
    // Yeniden Bağla: önce izinleri gösteren pencere, bağlanınca satır "Bağlandı".
    await userEvent.click(canvas.getByRole("button", { name: "Yeniden Bağla" }));
    const conn = await canvas.findByRole("dialog", { name: "Kargo Bağlantısı" });
    await userEvent.click(within(conn).getByRole("button", { name: "Yeniden Bağla" }));
    await waitFor(() => expect(within(canvas.getByRole("tabpanel")).getByText("Bağlandı")).toBeInTheDocument(), { timeout: 4000 });
    // Tek kayıt: sayfada okununca zil de sıfırlanır (zil ve sayfa aynı listeyi okur).
    await waitFor(() => expect(canvas.getByRole("button", { name: /Bildirimler, \d+ okunmamış/ })).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Tümünü Okundu Say" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Bildirimler" })).toBeInTheDocument());
    await settle(globals);
  },
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
  parameters: {
    docs: {
      description: {
        story:
          "Kenar çubuğundaki Oturumu Kapat buraya getirir. Şifre alanı yok (örnek uygulamada tarayıcı şifre kaydetmeyi sormasın): bu cihazda kayıtlı hesapla tek dokunuş ya da e-postaya giriş bağlantısı. Çalışma alanı dışındaki adres alanın altında reddedilir; bağlantı gönderilince “Bağlantıyı Aç” panoyu açar.",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    // Şifre alanı yok: tarayıcının şifre yöneticisi devreye girmez.
    await expect(canvasElement.querySelector('input[type="password"]')).toBeNull();
    const email = await canvas.findByLabelText("E-Posta");
    await userEvent.type(email, "ahmet@gmail.com");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Bağlantısı Gönder" }));
    // Alanın altındaki hata (kayıtlı hesap satırı da "pusula.app" yazar: metni tam ara).
    await canvas.findByText("Pusula hesabıyla gir: ad@pusula.app", {}, { timeout: 3000 });
    await userEvent.clear(canvas.getByLabelText("E-Posta"));
    await userEvent.type(canvas.getByLabelText("E-Posta"), "ahmet@pusula.app");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Bağlantısı Gönder" }));
    await canvas.findByRole("heading", { name: "Bağlantıyı Gönderdik" }, { timeout: 3000 });
    await settle(globals);
  },
};

export const SampleAccount: Story = {
  name: "Kayıtlı Hesapla Giriş",
  args: { signedOut: true },
  parameters: {
    docs: {
      description: {
        story: "Bu cihazda kayıtlı hesaba tek dokunuş: form gönderilmez, şifre sorulmaz, pano açılır.",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Ahmet Akyapı olarak devam et/ }));
    await canvas.findByRole("heading", { name: "Pano" }, { timeout: 3000 });
    await settle(globals);
  },
};

export const MagicLink: Story = {
  name: "Bağlantıyla Giriş",
  args: { signedOut: true },
  parameters: { docs: { description: { story: "E-postaya giriş bağlantısı: gönderilince form “Bağlantıyı Gönderdik” paneline döner, bağlantı panoyu açar; “Başka Adres Kullan” forma geri getirir." } } },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText("E-Posta"), "ahmet@pusula.app");
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Bağlantısı Gönder" }));
    const heading = await canvas.findByRole("heading", { name: "Bağlantıyı Gönderdik" }, { timeout: 3000 });
    await waitFor(() => expect(heading).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "Başka Adres Kullan" }));
    await expect(canvas.getByLabelText("E-Posta")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Giriş Bağlantısı Gönder" }));
    await userEvent.click(await canvas.findByRole("button", { name: /Bağlantıyı Aç/ }, { timeout: 3000 }));
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
          "Oturum açmamış ziyaretçinin sayfası (Ribbon turu): kaydırınca üst kenara oturan menü, bulanıktan netleşen serif vurgulu başlık, görsel zemin üstünde beyaz birincil eylem, demoya inen ikincil eylem, cam duyuru hapı ve güven satırı, pencere şeridi + dock ile sayfada denenen ürün maketi, el yazısı ok notu, köşe maskotu; kavisli galeride hazır akışlar ve hareketli renk zeminli kapanış (Scrolltide turu).",
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { level: 1, name: "Talepleri Kaybetmeden Yanıtla" });
    // Renkli zemindeki iki eylem: biri giriş, öteki demoya iner (basılmayan hap kalmadı).
    await expect(canvas.getAllByRole("button", { name: "Ücretsiz Dene" })[0]).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Demoyu Gör" })).toHaveAttribute("href", "#tanitim-demo");
    const dock = canvas.getByRole("toolbar", { name: "Pusula uygulamaları" });
    await userEvent.click(within(dock).getByRole("button", { name: "Takvim" }));
    await waitFor(() => expect(canvas.getByRole("img", { name: /odakta Takvim/ })).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Maskota merhaba de" }));
    await canvas.findByText("Merhaba!");
    await settle(globals);
  },
};
