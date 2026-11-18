import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterSheet, type FilterGroup, type FilterValue } from "@/components/ui/filter-sheet";

/** Kurgusal ilan listesi: sayı filtrelerden gerçekten hesaplanır. */
const ITEMS = [
  { city: "İstanbul", type: "Daire", rooms: "2+1" },
  { city: "İstanbul", type: "Daire", rooms: "3+1" },
  { city: "İzmir", type: "Müstakil", rooms: "4+1" },
  { city: "Ankara", type: "Daire", rooms: "2+1" },
  { city: "İzmir", type: "Daire", rooms: "1+1" },
  { city: "Antalya", type: "Villa", rooms: "4+1" },
  { city: "İstanbul", type: "Rezidans", rooms: "1+1" },
  { city: "Ankara", type: "Müstakil", rooms: "3+1" },
] as const;

const count = (key: "city" | "type", v: string) => ITEMS.filter((i) => i[key] === v).length;

const GROUPS: readonly FilterGroup[] = [
  { id: "sira", label: "Sıralama", options: [{ value: "yeni", label: "En Yeni" }, { value: "ucuz", label: "Fiyat Artan" }, { value: "pahali", label: "Fiyat Azalan" }] },
  { id: "sehir", label: "Şehir", multiple: true, options: ["İstanbul", "İzmir", "Ankara", "Antalya"].map((c) => ({ value: c, label: c, count: count("city", c) })) },
  { id: "tur", label: "Tür", multiple: true, options: ["Daire", "Müstakil", "Villa", "Rezidans"].map((t) => ({ value: t, label: t, count: count("type", t) })) },
];

const EMPTY: FilterValue = { sira: ["yeni"], sehir: [], tur: [] };

function Demo({ initiallyOpen = true }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [value, setValue] = useState<FilterValue>(EMPTY);
  const rows = ITEMS.filter((i) => (!value.sehir?.length || value.sehir.includes(i.city)) && (!value.tur?.length || value.tur.includes(i.type)));
  const active = (value.sehir?.length ?? 0) + (value.tur?.length ?? 0);
  return (
    <div className="mx-auto grid max-w-md gap-3 p-4">
      <Button variant="secondary" onClick={() => setOpen(true)} className="justify-self-start">
        <SlidersHorizontal aria-hidden />
        Filtreler{active ? ` · ${active}` : ""}
      </Button>
      <p className="text-small text-muted">{rows.length} ilan listeleniyor.</p>
      <FilterSheet
        open={open}
        onOpenChange={setOpen}
        groups={GROUPS}
        value={value}
        onValueChange={setValue}
        resultCount={rows.length}
        resultLabel={(n) => (n ? `${n} İlanı Göster` : "Uyan İlan Yok")}
        canClear={active > 0 || value.sira?.[0] !== "yeni"}
        onClear={() => setValue(EMPTY)}
      />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Filtre Çekmecesi",
  id: "filter-sheet",
  component: FilterSheet,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    // Yerel <dialog> üst katmanda açılır: belge sayfasının üstüne binmesin, kendi çerçevesinde.
    docs: {
      story: { inline: false, height: "720px" },
      description: {
        component:
          "Telefonda bütün filtre ve sıralama seçimleri alttan açılan tek yüzeyde; dipte Temizle ve SONUÇ SAYISINI söyleyen ana buton (\"3 İlanı Göster\"). Seçimler anında uygulanır, sayı gerçek; kullanıcı listeyi göremese de 0 sonuca düşmeden önce görür. Tekli grup radyo grubu (ok tuşları), çoklu grup `aria-pressed`; seçili çipte ✓ ve kalın kenar da var, renk tek işaret değil. `sheet.tsx` üstüne kurulu. Assetora turundan. Pusula: Gelen Kutusu telefonda.",
      },
    },
  },
  args: { open: true, onOpenChange: () => {}, groups: GROUPS, value: EMPTY, onValueChange: () => {}, resultCount: ITEMS.length, onClear: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof FilterSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "İlan Filtresi",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole("dialog", { name: "Filtre ve Sıralama" });
    await userEvent.click(within(sheet).getByRole("button", { name: /^İstanbul/ }));
    await expect(within(sheet).getByRole("button", { name: "3 İlanı Göster" })).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole("button", { name: /^Villa/ }));
    await expect(within(sheet).getByRole("button", { name: "Uyan İlan Yok" })).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole("button", { name: "Temizle" }));
    await expect(within(sheet).getByRole("button", { name: "8 İlanı Göster" })).toBeInTheDocument();
  },
};
