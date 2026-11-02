import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ActivityRings } from "@/components/ui/activity-rings";
import { ChartCard } from "@/components/ui/chart-card";
import { Gallery } from "../_lib/Frame";
import { Donem, GrafikHucre, Sahne } from "../grafik/_sahne";
import { GUNLUK_HEDEF, SATIS_KOTASI } from "./_veri";

const ortalama = (rings: readonly { value: number; goal: number }[]) =>
  Math.round((rings.reduce((s, r) => s + Math.min(r.value / r.goal, 1), 0) / rings.length) * 100);

const meta = {
  title: "Grafikler/Aktivite Halkaları",
  id: "activity-rings",
  component: ActivityRings,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Her ölçü kendi hedefine göre bir tam tur (günlük hareket, haftalık satış kotası); %100'de halka kapanır, aşılırsa ikinci tur kesikle üstünden geçer. Ölçülerin birbirine oranı okunacaksa iç içe halka grafiği. Çizim `aria-hidden`; aynı bilgi yanındaki listede metin olarak.",
      },
    },
  },
  args: {
    title: "Bugünkü Hedefler",
    rings: GUNLUK_HEDEF,
    layout: "row",
    thickness: 14,
    gap: 4,
    showList: true,
  },
  argTypes: {
    rings: { control: "object" },
    layout: { control: "inline-radio", options: ["row", "stack"] },
    thickness: { control: { type: "range", min: 8, max: 20, step: 1 } },
    gap: { control: { type: "range", min: 2, max: 8, step: 1 } },
  },
  render: (args) => (
    <Sahne width="md">
      <ChartCard id="halka-kart" label={args.title} value={`%${ortalama(args.rings)}`} change={6} changeLabel="dünküne göre" action={<Donem defaultValue="7g" />}>
        <ActivityRings {...args} />
      </ChartCard>
    </Sahne>
  ),
} satisfies Meta<typeof ActivityRings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Bugünkü Hedefler" });
    const items = within(list).getAllByRole("listitem");
    await expect(items).toHaveLength(3);
    // Aşılan hedef ikinci tura geçer ve metinde de söylenir
    await expect(items[1]).toHaveTextContent("Egzersiz42 / 30 dk%140, hedef tamamlandı");
  },
};

export const SalesQuota: Story = {
  name: "Dört Halka (Satış Kotası)",
  args: { title: "Kasım Satış Kotası", rings: SATIS_KOTASI, thickness: 12 },
};

export const Stacked: Story = {
  name: "Liste Altta",
  args: { layout: "stack" },
};

export const AllDone: Story = {
  name: "Hepsi Tamam, İkinci Tur",
  args: {
    rings: [
      { label: "Hareket", value: 1140, goal: 600, unit: "kcal", series: 1 },
      { label: "Egzersiz", value: 75, goal: 30, unit: "dk", series: 2 },
      { label: "Ayakta", value: 13, goal: 12, unit: "saat", series: 3 },
    ],
  },
};

export const Empty: Story = {
  name: "Boş (Gün Başı)",
  args: { rings: GUNLUK_HEDEF.map((r) => ({ ...r, value: 0 })) },
};

export const LongLabels: Story = {
  name: "Uzun Adlar",
  args: {
    title: "Çeyrek Hedefleri",
    rings: [
      { label: "Kurumsal Müşteri Sözleşme Yenilemeleri", value: 46, goal: 60, unit: "sözleşme", series: 4 },
      { label: "Yeni Pazarlarda Açılan Deneme Hesapları", value: 1240, goal: 1000, unit: "hesap", series: 5 },
      { label: "Destek Memnuniyet Anketine Yanıt", value: 310, goal: 500, unit: "yanıt", series: 6 },
    ],
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={3}>
      <GrafikHucre label="Üç halka, yanında liste">
        <ChartCard id="halka-v1" label="Bugünkü Hedefler" value={`%${ortalama(GUNLUK_HEDEF)}`}>
          <ActivityRings title="Bugünkü Hedefler" rings={GUNLUK_HEDEF} layout="stack" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Dört halka, ince">
        <ChartCard id="halka-v2" label="Kasım Satış Kotası" value={`%${ortalama(SATIS_KOTASI)}`}>
          <ActivityRings title="Kasım Satış Kotası" rings={SATIS_KOTASI} thickness={11} layout="stack" />
        </ChartCard>
      </GrafikHucre>
      <GrafikHucre label="Listesiz, ortada özel özet">
        <ChartCard id="halka-v3" label="Sprint 46" value="38 / 42 puan">
          <ActivityRings
            title="Sprint 46"
            showList={false}
            thickness={18}
            rings={[
              { label: "Tamamlanan Puan", value: 38, goal: 42, unit: "puan", series: 1 },
              { label: "Kapanan Hata", value: 14, goal: 10, unit: "hata", series: 2 },
            ]}
          >
            <div>
              <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">2 gün</p>
              <p className="text-micro text-muted">Sprint sonuna</p>
            </div>
          </ActivityRings>
        </ChartCard>
      </GrafikHucre>
    </Gallery>
  ),
};
