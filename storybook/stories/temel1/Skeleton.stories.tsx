import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton, SkeletonCard, SkeletonRow, SkeletonText } from "@/components/ui/skeleton";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Yükleme/İskelet Yükleyici",
  id: "components-loading-skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Gelecek içeriğin şeklinde yükleme iskeleti: metin, liste satırı, kart. Yer tuttuğu için içerik gelince sayfa zıplamaz. Ekran okuyucuya gizlidir; “yükleniyor” bilgisini kap verir (`aria-busy=\"true\"`). Bütün bloklar aynı anda parlar.",
      },
    },
  },
  render: (args) => (
    <Frame width="sm">
      <Skeleton {...args} />
    </Frame>
  ),
  args: { className: "h-4 w-48" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Paragraph: Story = {
  name: "Paragraf",
  render: () => (
    <Frame width="sm">
      <div aria-busy="true">
        <SkeletonText lines={4} />
      </div>
    </Frame>
  ),
};

export const ListRows: Story = {
  name: "Liste Satırları",
  render: () => (
    <Frame width="md">
      <div aria-busy="true" className="divide-y divide-line-soft rounded-xl bg-overlay px-4 shadow-raised">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow value={false} />
      </div>
    </Frame>
  ),
};

export const DashboardLoading: Story = {
  name: "Pano Yükleniyor",
  parameters: { layout: "padded" },
  render: () => (
    <section aria-busy="true" aria-label="Pano yükleniyor" className="grid w-[min(100vw-2rem,64rem)] gap-4 sm:grid-cols-3">
      <SkeletonCard lines={1} action={false} />
      <SkeletonCard lines={1} action={false} />
      <SkeletonCard lines={1} action={false} />
      <SkeletonCard lines={4} className="sm:col-span-2" />
      <SkeletonCard lines={3} />
    </section>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Skeleton — tek blok, avatar" className="bg-overlay">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </Cell>
      <Cell label="SkeletonText — son satır kısa" className="block bg-overlay">
        <SkeletonText lines={3} />
      </Cell>
      <Cell label="SkeletonRow — avatar, iki satır, değer" className="block bg-overlay">
        <SkeletonRow />
        <SkeletonRow avatar={false} />
      </Cell>
      <Cell label="SkeletonCard — başlık, metin, düğme yeri" className="block bg-overlay">
        <SkeletonCard />
      </Cell>
    </Gallery>
  ),
};
