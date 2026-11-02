import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Globe, Mail, Megaphone, Search, Share2 } from "lucide-react";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { BarList } from "@/components/ui/bar-list";
import { ChartCard } from "@/components/ui/chart-card";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "./_sahne";
import { URUNLER, sayi, toplam } from "./_veri";

type Args = ComponentProps<typeof BarList> & { kalemSayisi: number };

const KANALLAR = [
  { label: "Google Arama", value: 3400, icon: <Search /> },
  { label: "Instagram", value: 2300, icon: <Share2 /> },
  { label: "Doğrudan", value: 1800, icon: <Globe /> },
  { label: "E-posta Bülteni", value: 1500, icon: <Mail /> },
  { label: "Reklam", value: 1580, icon: <Megaphone /> },
];

const meta = {
  title: "Grafikler/Sıralı Çubuk Listesi",
  component: BarList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Uzun adlı 3-10 kalemlik sıralama (sayfalar, ürünler, kaynaklar); dolgu satırın arkasında, ad kısalmaz. Varsayılan büyükten küçüğe sıralar; zaman ya da aşama sırası anlamlıysa `sort={false}`. `href` verilen satırın tamamı bağlantı olur (dokunmatikte 44 px).",
      },
    },
  },
  args: {
    title: "En Çok Satan Ürünler",
    items: URUNLER,
    columns: ["Ürün", "Adet"],
    series: 2,
    sort: true,
    kalemSayisi: 6,
  },
  argTypes: {
    items: { control: "object" },
    columns: { control: "object" },
    valueFormat: { control: "object" },
    series: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    kalemSayisi: { control: { type: "range", min: 1, max: 10, step: 1 }, description: "Gösterilen kalem sayısı" },
  },
  render: ({ kalemSayisi, items, ...args }) => {
    const shown = items.slice(0, kalemSayisi);
    return (
      <Sahne>
        <ChartCard id="liste-kart" label={args.title} value={sayi(toplam(shown.map((i) => i.value)))} change={7.3} action={<Donem defaultValue="30g" />}>
          <BarList {...args} items={shown} />
        </ChartCard>
      </Sahne>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "En Çok Satan Ürünler" });
    const rows = within(list).getAllByRole("listitem");
    await expect(rows).toHaveLength(6);
    await expect(rows[0]).toHaveTextContent("Kablosuz Kulak İçi Kulaklık");
  },
};

export const Ikonlu: Story = {
  name: "İkonlu Kaynaklar",
  args: { title: "Trafik Kaynakları", items: KANALLAR, columns: ["Kaynak", "Ziyaret"], series: 3, kalemSayisi: 5 },
};

export const Baglantili: Story = {
  name: "Bağlantılı Satırlar",
  args: {
    title: "En Çok Ziyaret Edilen Sayfalar",
    columns: ["Sayfa", "Ziyaret"],
    series: 1,
    kalemSayisi: 5,
    items: [
      { label: "/", value: 6380, href: "/" },
      { label: "/fiyatlandirma", value: 4120, href: "/fiyatlandirma" },
      { label: "/blog/next-16-gecis-rehberi", value: 2940, href: "/blog/next-16-gecis-rehberi" },
      { label: "/dokumanlar/kurulum", value: 2310, href: "/dokumanlar/kurulum" },
      { label: "/iletisim", value: 1180, href: "/iletisim" },
    ],
  },
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    await expect(links).toHaveLength(5);
    await expect(links[1]).toHaveAttribute("href", "/fiyatlandirma");
  },
};

export const Yuzde: Story = {
  name: "Yüzde Biçimi, Sırasız",
  args: {
    title: "Ödeme Adımında Kayıp",
    columns: ["Adım", "Oran"],
    sort: false,
    series: 4,
    valueFormat: { style: "percent", maximumFractionDigits: 1 },
    kalemSayisi: 4,
    items: [
      { label: "Sepet", value: 0.312 },
      { label: "Teslimat Adresi", value: 0.184 },
      { label: "Kargo Seçimi", value: 0.062 },
      { label: "Kart Bilgisi", value: 0.147 },
    ],
  },
};

export const AzVeri: Story = {
  name: "Az Veri (İki Kalem)",
  args: { kalemSayisi: 2 },
};

export const SifirDeger: Story = {
  name: "Sıfır Değerli Kalem",
  args: {
    title: "Ülkeye Göre Sipariş",
    columns: ["Ülke", "Sipariş"],
    kalemSayisi: 4,
    items: [
      { label: "Türkiye", value: 4120 },
      { label: "Almanya", value: 386 },
      { label: "Hollanda", value: 74 },
      { label: "Azerbaycan", value: 0 },
    ],
  },
};

export const UzunEtiket: Story = {
  name: "Uzun Etiket",
  args: {
    title: "En Çok Açılan Destek Konuları",
    columns: ["Konu", "Bilet"],
    kalemSayisi: 4,
    items: [
      { label: "Siparişim kargoya verildi görünüyor ama takip numarası çalışmıyor", value: 812 },
      { label: "İade talebim onaylandı, para kartıma ne zaman yansır", value: 604 },
      { label: "Fatura bilgilerimi kurumsal hesaba nasıl çeviririm", value: 288 },
      { label: "Şifremi sıfırlama e-postası gelmiyor", value: 241 },
    ],
  },
};

export const Telefon: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={3}>
      {([1, 2, 3, 4, 5, 6] as const).map((s) => (
        <GrafikHucre key={s} label={`Seri ${s}`}>
          <ChartCard id={`bl-v${s}`} label={`Trafik Kaynakları · Seri ${s}`} value={sayi(toplam(KANALLAR.map((k) => k.value)))}>
            <BarList title={`Trafik kaynakları, seri ${s}`} items={KANALLAR.slice(0, 4)} series={s} />
          </ChartCard>
        </GrafikHucre>
      ))}
    </Gallery>
  ),
};
