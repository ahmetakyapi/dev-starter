import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Avatar } from "@/components/ui/avatar";
import { StoryCard, StoryGrid } from "@/components/ui/story-card";
import { Wallpaper } from "@/components/ui/wallpaper";

// ÖRNEK veri: markalar ve sözler uydurmadır, `sample` künyesi bunun için.
const Mark = ({ children }: { children: string }) => <span className="font-medium tracking-tight">{children}</span>;

const meta = {
  title: "Bileşenler/Tanıtım/Hikaye Karosu",
  id: "story-card",
  component: StoryCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Müşteri hikayesi karosu: logo, alıntı, kim söylediği ya da tek büyük sonuç rakamı. `photo` zemin yuvasını koyu örtüyle kaplar (metin fotoğrafa değil örtüye göre AA), `plain` sakin gri kuyu, `stat` büyük rakam. `href` karonun tamamını TEK bağlantı yapar, içinde ikinci bağlantı yok. Sahte söz, logo ve doğrulanamayan çarpan yazılmaz (`guides/08`); örnek veri `sample` ile \"ÖRNEK\" künyeli. Socialscale müşteri bölümünün yapısından.",
      },
    },
  },
  args: {
    tone: "plain",
    logo: <Mark>Örnek Marka</Mark>,
    quote: "Ekibimizin haftalık işini bir sabaha sığdırdık; sonuçları tek yerde görüyoruz.",
    author: { name: "Örnek Kişi", role: "Dijital Direktör, Örnek Ajans", avatar: <Avatar name="Örnek Kişi" size="md" /> },
    href: "#hikaye",
    sample: true,
  },
  argTypes: { tone: { control: "inline-radio", options: ["photo", "plain", "stat"] } },
  render: (args) => (
    <div className="w-[min(100vw-2rem,30rem)]">
      <StoryCard {...args} />
    </div>
  ),
} satisfies Meta<typeof StoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Sade Karo",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link")).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: "Tam hikâyeyi oku" })).toHaveAttribute("href", "#hikaye");
    await expect(canvas.getByText("ÖRNEK")).toBeInTheDocument();
  },
};

export const Grid: Story = {
  name: "Dörtlü Izgara",
  render: () => (
    <div className="w-[min(100vw-2rem,72rem)]">
      <StoryGrid>
        <StoryCard
          tone="photo"
          sample
          background={<Wallpaper scene="dunes" />}
          logo={<Mark>Fotoğraflı</Mark>}
          quote="Müşterilerle daha etkileşimli buluşmak gündemimizin başında; keşiften satın almaya kesintisiz bir yol kuruyoruz."
          href="#a"
        />
        <StoryCard
          sample
          logo={<Mark>Ajans</Mark>}
          quote="Altyapı katmanı gibi çalışıyor; bütün müşterilerimizi daha verimli yönetiyoruz."
          author={{ name: "Örnek Kişi", role: "Dijital Direktör", avatar: <Avatar name="Örnek Kişi" /> }}
          href="#b"
        />
        <StoryCard
          sample
          logo={<Mark>Perakende</Mark>}
          quote="Kısa videoların bütün stratejimize etkisini anlamamıza yardım etti."
          author={{ name: "Örnek Kişi", role: "E-ticaret Direktörü", avatar: <Avatar name="Örnek Kişi" /> }}
          href="#c"
        />
        <StoryCard
          tone="stat"
          sample
          background={<Wallpaper scene="lagoon" />}
          logo={<Mark>Stüdyo</Mark>}
          quote="Bakış açımızı değiştirdi: haftada birkaç videodan binlerce içeriğe."
          stat={{ value: "Örnek ×", label: "İçerik üretimi" }}
          href="#d"
        />
      </StoryGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("link")).toHaveLength(4);
  },
};
