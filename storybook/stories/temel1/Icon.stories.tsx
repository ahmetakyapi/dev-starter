import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Bell,
  Calendar,
  Check,
  CreditCard,
  Download,
  FileText,
  Filter,
  Heart,
  Mail,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const GLYPHS = { Bell, Calendar, CreditCard, Download, FileText, Filter, Heart, Mail, Search, Settings, Share2, Star, Trash2, Upload, Users } as const;

const meta = {
  title: "Bileşenler/Düğme ve İkon/İkon",
  id: "components-buttons-icon",
  component: Icon,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "lucide-react sarmalayıcısı: tek boyut ölçeği (sm 16 · md 20 · lg 24) ve tek çizgi kalınlığı (1,75). Varsayılan olarak ekran okuyucudan gizlidir; ikon tek başına anlam taşıyorsa `label` ver. Düğmenin tek içeriği ikonsa etiketi düğmeye ver (`IconButton`).",
      },
    },
  },
  argTypes: {
    icon: { control: "select", options: Object.keys(GLYPHS), mapping: GLYPHS },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  args: { icon: Bell, size: "md", className: "text-strong" },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const NextToText: Story = {
  name: "Metin Yanında",
  render: () => (
    <Frame width="sm">
      <ul className="grid gap-3">
        <li className="flex items-center gap-2 text-base text-body">
          <Icon icon={Mail} className="text-muted" />
          elif.yildiz@acme.com.tr
        </li>
        <li className="flex items-center gap-2 text-base text-body">
          <Icon icon={Calendar} className="text-muted" />
          14 Kasım 2026, Cuma
        </li>
        <li className="flex items-center gap-2 text-read font-semibold text-strong">
          <Icon icon={Users} size="md" className="text-primary-ink" />
          Ürün Ekibi · 8 kişi
        </li>
      </ul>
    </Frame>
  ),
};

export const MeaningfulIcon: Story = {
  name: "Anlam Taşıyan İkon",
  render: () => (
    <Frame width="md">
      <table className="w-full text-left text-base">
        <caption className="sr-only">Plan özellikleri</caption>
        <thead>
          <tr className="text-small text-muted">
            <th scope="col" className="py-2 font-medium">Özellik</th>
            <th scope="col" className="py-2 font-medium">Başlangıç</th>
            <th scope="col" className="py-2 font-medium">Kurumsal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft text-body">
          <tr>
            <td className="py-2.5">CSV dışa aktarma</td>
            <td><Icon icon={Check} label="Var" className="text-success" /></td>
            <td><Icon icon={Check} label="Var" className="text-success" /></td>
          </tr>
          <tr>
            <td className="py-2.5">Tek oturum açma (SSO)</td>
            <td><Icon icon={X} label="Yok" className="text-muted" /></td>
            <td><Icon icon={Check} label="Var" className="text-success" /></td>
          </tr>
        </tbody>
      </table>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Boylar: sm 16 · md 20 · lg 24">
        <div className="flex items-end gap-6 text-strong">
          <Icon icon={Star} size="sm" />
          <Icon icon={Star} size="md" />
          <Icon icon={Star} size="lg" />
        </div>
      </Cell>
      <Cell label="Sık kullanılan ikonlar">
        <ul className="grid grid-cols-5 gap-4 text-body">
          {Object.entries(GLYPHS).map(([name, glyph]) => (
            <li key={name} className="grid place-items-center" title={name}>
              <Icon icon={glyph} size="md" />
            </li>
          ))}
        </ul>
      </Cell>
    </Gallery>
  ),
};
