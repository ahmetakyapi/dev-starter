import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pagination } from "@/components/ui/pagination";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const hrefFor = (n: number) => `?sayfa=${n}`;

const meta = {
  title: "Bileşenler/Veri/Sayfalama",
  id: "pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfa numarası adreste (`?sayfa=3`): bağlantılar gerçek, paylaşılabilir, JavaScript'siz çalışır. Masaüstünde ilk, son ve geçerli sayfanın komşuları; telefonda \"3 / 12\" künyesi ve iki ok. Liste sayfanın ortasındaysa `scroll={false}`.",
      },
    },
  },
  args: { page: 3, pageCount: 12, hrefFor, scroll: false },
  argTypes: {
    page: { control: { type: "number", min: 1 } },
    pageCount: { control: { type: "number", min: 1 } },
  },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="md">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const FirstPage: Story = { name: "İlk Sayfa", args: { page: 1 } };

export const MiddlePage: Story = { name: "Orta Sayfa", args: { page: 6 } };

export const LastPage: Story = { name: "Son Sayfa", args: { page: 12 } };

export const FewPages: Story = { name: "Az Sayfa", args: { page: 2, pageCount: 4 } };

export const Mobile: Story = {
  name: "Telefon",
  args: { page: 3 },
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: {
    docs: { description: { story: "Dar ekranda numaralar yerine künye: yedi numara 390 piksele 44 piksellik hedeflerle sığmıyor." } },
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="İlk Sayfa: Önceki Oku Pasif">
        <Pagination page={1} pageCount={12} hrefFor={hrefFor} scroll={false} labels={{ nav: "Sayfalama, İlk Sayfa" }} />
      </Cell>
      <Cell label="Orta Sayfa: İki Yanda Boşluk">
        <Pagination page={6} pageCount={12} hrefFor={hrefFor} scroll={false} labels={{ nav: "Sayfalama, Orta Sayfa" }} />
      </Cell>
      <Cell label="Son Sayfa: Sonraki Oku Pasif">
        <Pagination page={12} pageCount={12} hrefFor={hrefFor} scroll={false} labels={{ nav: "Sayfalama, Son Sayfa" }} />
      </Cell>
      <Cell label="Dört Sayfa: Boşluk Yok">
        <Pagination page={2} pageCount={4} hrefFor={hrefFor} scroll={false} labels={{ nav: "Sayfalama, Dört Sayfa" }} />
      </Cell>
    </Gallery>
  ),
};
