import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { WeekCalendar } from "@/components/ui/week-calendar";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { HAFTA, SIMDI, TOPLANTILAR } from "./_veri";

const meta = {
  title: "Bileşenler/Verimlilik/Haftalık Takvim",
  id: "week-calendar",
  component: WeekCalendar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bir haftanın toplantı ve randevuları saat ızgarasında; çakışanlar yan yana şeritlere bölünür, bugünün kolonunda şu an çizgisi. Tarih seçmek için değil (o tarih takvimi). Telefonda ızgara yerine gün gün liste: üstte gün hapları, altında seçili günün saat sıralı etkinlikleri.",
      },
    },
  },
  args: {
    week: HAFTA,
    events: TOPLANTILAR,
    now: SIMDI,
    startHour: 8,
    endHour: 18,
    hourHeight: 52,
    label: "Ürün ekibinin haftası",
  },
  argTypes: {
    events: { control: "object" },
    startHour: { control: { type: "range", min: 0, max: 12, step: 1 } },
    endHour: { control: { type: "range", min: 13, max: 24, step: 1 } },
    hourHeight: { control: { type: "range", min: 36, max: 80, step: 4 } },
  },
  render: (args) => (
    <Frame width="full">
      <WeekCalendar {...args} />
    </Frame>
  ),
} satisfies Meta<typeof WeekCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  args: { onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Etkinlik düğmesinin adı görünen metinden (başlık, saat, yer); tıklayınca onSelect gelir.
    // Hem ızgarada hem (telefonda) listede aynı ad var: görünür olanı seç.
    const blok = canvas.getAllByRole("button", { name: /Ödeme Akışı Atölyesi/ })[0];
    await userEvent.click(blok);
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "t7" }));
  },
};

export const Overlaps: Story = {
  name: "Yoğun Çakışma",
  args: {
    events: [
      ...TOPLANTILAR,
      { id: "c1", title: "Yatırımcı Görüşmesi", start: "2026-11-04T10:30", end: "2026-11-04T11:30", location: "Çevrim İçi", series: 4 },
      { id: "c2", title: "Fiyatlandırma Kararı", start: "2026-11-05T13:30", end: "2026-11-05T15:00", series: 2 },
      { id: "c3", title: "Altyapı Bakımı", start: "2026-11-05T13:00", end: "2026-11-05T13:45", series: 6 },
    ],
  },
};

/** Etkinliği bir hafta geriye alır (saat aynı). */
const geri = (iso: string) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - 7);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${iso.slice(11)}`;
};

export const NotThisWeek: Story = {
  name: "Geçmiş Hafta (Şu An Yok)",
  args: { week: "2026-10-26", events: TOPLANTILAR.map((e) => ({ ...e, start: geri(e.start), end: geri(e.end) })) },
};

export const Empty: Story = {
  name: "Boş Hafta",
  args: { events: [] },
};

export const LongTitles: Story = {
  name: "Uzun Başlıklar",
  args: {
    events: [
      { id: "u1", title: "Kurumsal Müşteri Danışma Kurulu Üç Aylık Değerlendirme Toplantısı", start: "2026-11-02T10:00", end: "2026-11-02T12:00", location: "Genel Müdürlük, Büyük Toplantı Salonu", series: 1 },
      { id: "u2", title: "Erişilebilirlik Denetimi Sonuçlarının Ekiplerle Paylaşılması", start: "2026-11-03T09:00", end: "2026-11-03T09:30", series: 5 },
      { id: "u3", title: "Yeni Fiyatlandırma Sayfası İçin Kullanıcı Görüşmeleri", start: "2026-11-04T13:00", end: "2026-11-04T16:00", location: "Kullanıcı Araştırma Odası", series: 3 },
      { id: "u4", title: "Çeyrek Sonu Finansal Raporun Yönetim Kuruluna Sunumu", start: "2026-11-04T14:00", end: "2026-11-04T15:00", series: 4 },
    ],
  },
};

export const Mobile: Story = {
  name: "Telefon (Gün Gün Liste)",
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Gün hapları yalnız md altında var; geniş önizlemede (ızgara) sınanacak bir şey yok.
    const persembe = canvas.queryByRole("button", { name: /^5 Kasım Perşembe/ });
    if (!persembe) return;
    await userEvent.click(persembe);
    await expect(persembe).toHaveAttribute("aria-pressed", "true");
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      <Cell label="Sabah odaklı, sık ızgara (08–13)" className="block p-4">
        <WeekCalendar week={HAFTA} events={TOPLANTILAR} now={SIMDI} startHour={8} endHour={13} hourHeight={44} label="Sabah toplantıları" />
      </Cell>
      <Cell label="Öğleden sonra (12–18)" className="block p-4">
        <WeekCalendar week={HAFTA} events={TOPLANTILAR} now={SIMDI} startHour={12} endHour={18} hourHeight={44} label="Öğleden sonra toplantıları" />
      </Cell>
      <Cell label="Boş hafta" className="block p-4">
        <WeekCalendar week={HAFTA} events={[]} now={SIMDI} startHour={9} endHour={13} hourHeight={36} label="Boş hafta" />
      </Cell>
      <Cell label="Şu an çizgisi olmayan hafta" className="block p-4">
        <WeekCalendar week="2026-11-09" events={[{ id: "s1", title: "Yayın Sonrası Değerlendirme", start: "2026-11-10T10:00", end: "2026-11-10T11:00", series: 2 }]} now={SIMDI} startHour={9} endHour={13} hourHeight={36} label="Gelecek hafta" />
      </Cell>
    </Gallery>
  ),
};
