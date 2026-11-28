import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { EdgeBlur } from "@/components/ui/edge-blur";
import { OfferCard, OfferRow } from "@/components/ui/offer-card";
import { Wallpaper, type WallpaperScene } from "@/components/ui/wallpaper";

const OFFERS: { scene: WallpaperScene; title: string; country: string; rating: number; reviews: number; price: string }[] = [
  { scene: "lagoon", title: "Kıyı Evleri", country: "Türkiye", rating: 4.8, reviews: 674, price: "₺2.400'den" },
  { scene: "alpine", title: "Çam Yamacı", country: "Türkiye", rating: 4.7, reviews: 312, price: "₺1.850'den" },
  { scene: "dunes", title: "Kum Sarayı", country: "Fas", rating: 4.6, reviews: 1208, price: "₺3.100'den" },
  { scene: "aurora", title: "Kuzey Kulübesi", country: "Norveç", rating: 4.9, reviews: 98, price: "₺5.600'den" },
  { scene: "sunset", title: "Liman Konağı", country: "Yunanistan", rating: 4.5, reviews: 451, price: "₺2.950'den" },
];

const meta = {
  title: "Bileşenler/Tanıtım/Teklif Kartı",
  id: "offer-card",
  component: OfferCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Görselin tamamen kapladığı koyu yuvarlak kart: cam künye hapı, kaydet toggle'ı (`aria-pressed`), alt örtüde başlık, puan ve ülke çipleri, fiyat satırı ve tam genişlik açık hap eylem. Metin iki temada da sabit açık (`text-on-brand`, örtü `--color-scrim`). `OfferRow` kartları yatay sıraya dizer; `EdgeBlur` ile sarılabilir. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    title: "Kıyı Evleri",
    tag: "Otel",
    media: <Wallpaper scene="lagoon" className="size-full" />,
    rating: { value: 4.8, reviews: 674 },
    meta: ["Türkiye"],
    price: "₺2.400'den",
    priceUnit: "/ gece",
    action: { label: "İncele", onClick: fn() },
    onSavedChange: fn(),
  },
  render: (args) => (
    <div className="w-[min(100vw-2rem,20rem)]">
      <OfferCard {...args} />
    </div>
  ),
} satisfies Meta<typeof OfferCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("article", { name: "Kıyı Evleri" })).toBeInTheDocument();
    await expect(canvas.getByText("4,8 (674 Yorum)")).toBeInTheDocument();

    const save = canvas.getByRole("button", { name: "Kaydet: Kıyı Evleri" });
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await expect(args.onSavedChange).toHaveBeenCalledWith(true);

    await userEvent.click(canvas.getByRole("button", { name: "İncele, Kıyı Evleri" }));
    await expect(args.action?.onClick).toHaveBeenCalled();
  },
};

export const Row: Story = {
  name: "Sıra ve Kenar Buğusu",
  render: () => (
    <div className="mx-auto w-full max-w-5xl">
      <EdgeBlur size="6rem">
        <OfferRow label="Hafta sonu kaçamakları">
          {OFFERS.map((o, i) => (
            <OfferCard
              key={o.title}
              title={o.title}
              tag={i === 3 ? "Kulübe" : "Otel"}
              media={<Wallpaper scene={o.scene} className="size-full" />}
              rating={{ value: o.rating, reviews: o.reviews }}
              meta={[o.country]}
              price={o.price}
              priceUnit="/ gece"
              action={{ label: "İncele", href: `#${o.scene}` }}
              defaultSaved={i === 1}
            />
          ))}
        </OfferRow>
      </EdgeBlur>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Hafta sonu kaçamakları" });
    await expect(within(region).getAllByRole("article")).toHaveLength(OFFERS.length);
    await expect(canvas.getByRole("button", { name: "Kaydet: Çam Yamacı" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("link", { name: "İncele, Kıyı Evleri" })).toHaveAttribute("href", "#lagoon");
  },
};
