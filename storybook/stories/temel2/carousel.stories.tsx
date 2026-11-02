import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Carousel } from "@/components/ui/carousel";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const SLIDES = [
  { tag: "Grafikler", title: "Huni ve Sütun Grafikleri Panoya Geldi", body: "Kayıttan ödemeye her aşamayı tek kartta karşılaştırın.", series: "bg-chart-1" },
  { tag: "Ekip", title: "Panoya Misafir Davet Edin", body: "Düzenleme yetkisi vermeden yalnızca okuma bağlantısı paylaşın.", series: "bg-chart-2" },
  { tag: "Dışa Aktarma", title: "CSV ve PDF Tek Tıkla", body: "Filtrelenmiş görünüm neyse dosyaya o yazılır.", series: "bg-chart-3" },
  { tag: "Bildirimler", title: "Günlük Özet E-postası", body: "Her sabah 09.00'da yalnızca değişenler.", series: "bg-chart-4" },
  { tag: "Mobil", title: "Telefondan Onay Verin", body: "Bekleyen harcamalar tek ekranda, iki dokunuşla.", series: "bg-chart-5" },
];

const cards = (list = SLIDES) =>
  list.map((slide) => (
    <article key={slide.title} className="h-full rounded-xl bg-overlay p-5 shadow-raised">
      <div className={`mb-6 h-24 rounded-lg ${slide.series}`} aria-hidden />
      <p className="text-micro font-semibold text-muted">{slide.tag}</p>
      <h3 className="mt-1 text-title font-semibold text-strong">{slide.title}</h3>
      <p className="mt-1 text-base text-body">{slide.body}</p>
    </article>
  ));

const QUOTES = [
  ["Stok sayımı yarım günden yirmi dakikaya indi.", "Elif Karaca, Karaca Kırtasiye"],
  ["Şubeler arası transferi artık tek ekrandan izliyoruz.", "Mert Aydın, Aydın Yapı Market"],
  ["Haftalık rapor pazartesi sabahı hazır geliyor.", "Zeynep Öztürk, Öztürk Eczanesi"],
] as const;

const meta = {
  title: "Bileşenler/Gezinme/Kart Kaydırıcı",
  id: "carousel",
  component: Carousel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Yan yana kaydırılan kartlar (yorumlar, \"Yeni Neler Var\"). Kaydırma JS'siz `scroll-snap`; JavaScript yalnızca okları, noktaları ve klavyeyi bağlar, görünen slaytı `IntersectionObserver` söyler. Asıl mesaj ikinci slayta konmaz: çoğu kullanıcı oraya gelmez.",
      },
    },
  },
  args: { label: "Yeni Neler Var", slides: cards() },
  argTypes: { slides: { control: false } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="full">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prev = canvas.getByRole("button", { name: "Önceki Slayt" });
    await expect(prev).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Sonraki Slayt" }));
    await waitFor(() => expect(prev).toHaveAttribute("aria-disabled", "false"));
  },
};

export const FullWidthSlide: Story = {
  name: "Tam Genişlik Slayt",
  args: { label: "Müşteri Yorumları", slideClassName: "basis-full" },
};

export const Testimonials: Story = {
  name: "Müşteri Yorumları",
  args: {
    label: "Müşteri Yorumları",
    slides: QUOTES.map(([quote, who]) => (
      <figure key={who} className="flex h-full flex-col justify-between gap-6 rounded-xl bg-overlay p-6 shadow-raised">
        <blockquote className="text-title font-medium text-strong">“{quote}”</blockquote>
        <figcaption className="text-small text-muted">{who}</figcaption>
      </figure>
    )),
  },
};

export const TwoSlides: Story = { name: "İki Slayt", args: { slides: cards(SLIDES.slice(0, 2)) } };

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Varsayılan Genişlik" className="place-items-stretch">
        <Carousel label="Yeni Neler Var, galeri" slides={cards()} slideClassName="basis-[85%]" />
      </Cell>
      <Cell label="Tam Genişlik Slayt" className="place-items-stretch">
        <Carousel label="Tam genişlik, galeri" slides={cards()} slideClassName="basis-full" />
      </Cell>
    </Gallery>
  ),
};
