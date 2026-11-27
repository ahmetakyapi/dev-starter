import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { GlideLink } from "@/components/ui/glide-link";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Tanıtım/Süpürülen Bağlantı",
  id: "glide-link",
  component: GlideLink,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Metin içi bağlantı: dinlenmede ince kıl alt çizgi, üzerine gelince ya da odakta metin rengindeki çizgi soldan sağa süpürülür (450 ms, `--ease-brand`). Dış bağlantı kendiliğinden yeni sekmede açılır ve bunu ekran okuyucuya söyler. Logo duvarı yerine altı çizili düz müşteri listesi için. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { href: "https://ornek.dev", children: "Kıyı Stüdyo" },
  render: (args) => (
    <Frame width="md">
      <p className="text-base leading-relaxed text-body">
        İzmir&apos;de doğdum, şu an <GlideLink {...args} /> ekibinde ürün tasarımı yürütüyorum. Ürünleri bazen sıfırdan, bazen büyüme
        aşamasında tasarlayıp kuruyorum.
      </p>
    </Frame>
  ),
} satisfies Meta<typeof GlideLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: /Kıyı Stüdyo/ });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveTextContent("(yeni sekmede açılır)");
  },
};

export const ClientList: Story = {
  name: "Seçili İşler Listesi",
  render: () => (
    <Frame width="md">
      <p className="text-base leading-relaxed text-body">
        Seçili işler:
        <br />
        {["Kıyı Kahve", "Pusula", "Ada Lojistik", "Mavi Defter", "Nokta Sağlık"].map((name, i, all) => (
          <span key={name}>
            <GlideLink href={`#${i}`}>{name}</GlideLink>
            {i < all.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Pusula" });
    await expect(link).not.toHaveAttribute("target");
  },
};
