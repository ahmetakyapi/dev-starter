import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/empty-state";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Sahne yuvası için sade bir çizim: token renkleriyle, dekoratif. */
function SearchScene() {
  return (
    <svg viewBox="0 0 160 112" className="h-28 w-40" fill="none">
      <rect x="12" y="18" width="104" height="72" rx="12" className="fill-overlay stroke-line" strokeWidth="1.5" />
      <rect x="26" y="34" width="56" height="8" rx="4" className="fill-surface-raised" />
      <rect x="26" y="50" width="76" height="8" rx="4" className="fill-surface-raised" />
      <rect x="26" y="66" width="40" height="8" rx="4" className="fill-surface-raised" />
      <circle cx="112" cy="70" r="20" className="fill-primary-wash stroke-primary" strokeWidth="2.5" />
      <path d="M126 84l14 14" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: "Bileşenler/Veri/Boş Durum",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Üç biçim: `icon` panel içinde ikonlu kuyu, `scene` sayfa düzeyinde çizimli boşluk (arama sonucu yok, ilk kurulum), `inline` küçük listeler için tek satır. Başlık Title Case; `hint` bir sonraki adımı söyler, suçlamaz. Panel içine sahne konmaz.",
      },
    },
  },
  args: {
    variant: "icon",
    icon: <FileText />,
    title: "Henüz Fatura Yok",
    hint: "İlk siparişin tamamlandığında faturası burada listelenecek.",
    action: <Button size="sm">Fatura Oluştur</Button>,
    titleAs: "p",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["icon", "scene", "inline"] },
    titleAs: { control: "inline-radio", options: ["p", "h1", "h2", "h3"] },
    icon: { control: false },
    action: { control: false },
    scene: { control: false },
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
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const Sahne: Story = {
  name: "Sahneli",
  args: {
    variant: "scene",
    scene: <SearchScene />,
    icon: undefined,
    title: "Sonuç Bulunamadı",
    hint: "“Kayseri şubesi” için eşleşen kayıt yok. Yazımı kontrol et ya da süzgeçleri temizle.",
    action: (
      <Button variant="secondary" size="sm">
        Süzgeçleri Temizle
      </Button>
    ),
  },
};

export const SatirIci: Story = {
  name: "Satır İçi",
  args: { variant: "inline", icon: undefined, title: "Bu hafta etkinlik yok.", hint: undefined, action: undefined },
};

export const EylemsizIpucsuz: Story = { name: "Yalnız Başlık", args: { hint: undefined, action: undefined, icon: <SearchX /> } };

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="icon: panel içi" className="place-items-stretch">
        <EmptyState icon={<FileText />} title="Henüz Fatura Yok" hint="İlk siparişin tamamlandığında burada listelenecek." action={<Button size="sm">Fatura Oluştur</Button>} />
      </Cell>
      <Cell label="scene: sayfa düzeyi" className="place-items-stretch">
        <EmptyState variant="scene" scene={<SearchScene />} title="Sonuç Bulunamadı" hint="Yazımı kontrol et ya da süzgeçleri temizle." />
      </Cell>
      <Cell label="inline: küçük liste">
        <EmptyState variant="inline" title="Bu hafta etkinlik yok." />
      </Cell>
    </Gallery>
  ),
};
