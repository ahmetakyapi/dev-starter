import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PackageCheck, Truck } from "lucide-react";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const ORDER: TimelineEvent[] = [
  { id: "1", at: "2026-10-28T09:12", when: "28 Ekim, 09.12", title: "Sipariş Alındı", tone: "primary" },
  { id: "2", at: "2026-10-28T14:40", when: "28 Ekim, 14.40", title: "Kargoya Verildi", description: "Takip numarası: 7340 2219 0581", tone: "neutral", icon: <Truck /> },
  { id: "3", at: "2026-10-30T11:05", when: "30 Ekim, 11.05", title: "Teslim Edildi", description: "Kapıda imzayla teslim alındı.", tone: "success" },
];

const TONES: TimelineEvent[] = [
  { id: "n", at: "2026-10-01", when: "1 Ekim", title: "Taslak Oluşturuldu", tone: "neutral" },
  { id: "p", at: "2026-10-03", when: "3 Ekim", title: "İncelemeye Gönderildi", tone: "primary" },
  { id: "w", at: "2026-10-06", when: "6 Ekim", title: "Düzeltme İstendi", description: "Fiyat tablosundaki KDV oranı güncellenmeli.", tone: "warning" },
  { id: "d", at: "2026-10-08", when: "8 Ekim", title: "Ödeme Reddedildi", description: "Kartın limiti yetersiz.", tone: "danger" },
  { id: "s", at: "2026-10-09", when: "9 Ekim", title: "Yayımlandı", tone: "success", icon: <PackageCheck /> },
];

const meta = {
  title: "Bileşenler/Veri/Zaman Çizelgesi",
  id: "timeline",
  component: Timeline,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Tarihli olayların dikey listesi (sipariş geçmişi, sürüm notları, etkinlik akışı). Her zaman `<time dateTime>`; görünen biçimi çağıran verir, göreli zaman hidrasyon uyuşmazlığı yaratır. Nokta rengi yalnızca bir ton ipucu, anlamı başlık söyler.",
      },
    },
  },
  args: { events: ORDER },
  argTypes: { events: { control: "object" } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const AllTones: Story = { name: "Bütün Tonlar", args: { events: TONES } };

export const SingleEvent: Story = { name: "Tek Olay", args: { events: [ORDER[0]] } };

export const LongText: Story = {
  name: "Uzun Metin",
  args: {
    events: [
      {
        id: "u",
        at: "2026-10-12T16:20",
        when: "12 Ekim, 16.20",
        title: "Müşteri Hizmetleri Görüşmesi Tamamlandı ve Talep Muhasebe Ekibine Aktarıldı",
        description:
          "Görüşmede iade tutarının kısmi olarak kartına, kalanının ise mağaza puanı olarak hesabına yüklenmesi kararlaştırıldı. Muhasebe ekibi iki iş günü içinde dönüş yapacak.",
        tone: "primary",
      },
    ],
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Sipariş Geçmişi: Nokta ve İkon Karosu" className="place-items-stretch">
        <Timeline events={ORDER} />
      </Cell>
      <Cell label="Beş Ton" className="place-items-stretch">
        <Timeline events={TONES} />
      </Cell>
    </Gallery>
  ),
};
