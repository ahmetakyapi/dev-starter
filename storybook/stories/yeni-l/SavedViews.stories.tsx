import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SavedViews, type SavedView } from "@/components/ui/saved-views";

const START: SavedView[] = [
  { id: "hepsi", label: "Hepsi", builtin: true, count: 360 },
  { id: "bugun", label: "Bugün Aranacaklar", count: 14 },
  { id: "sorunlu", label: "Sorunlu Sayaçlar", count: 32 },
];

function Demo() {
  const [views, setViews] = useState<SavedView[]>(START);
  const [value, setValue] = useState("hepsi");
  return (
    <div className="mx-auto max-w-2xl p-6">
      <SavedViews
        views={views}
        value={value}
        onValueChange={setValue}
        onSave={(name) => {
          const id = `v-${views.length}`;
          setViews((list) => [...list, { id, label: name }]);
          setValue(id);
        }}
        onDelete={(id) => {
          setViews((list) => list.filter((v) => v.id !== id));
          setValue("hepsi");
        }}
      />
      <p className="mt-3 text-small text-muted">Seçili görünüm: {views.find((v) => v.id === value)?.label}</p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Gezinme/Kayıtlı Görünümler",
  id: "saved-views",
  component: SavedViews,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Sık kullanılan süzgeç + sıralama birleşimi tek tıkla çip. Sabit görünüm kaldırılamaz; kullanıcının kaydettiği × ile silinir; \"Görünümü Kaydet\" satır içinde ad alanı açar (Enter kaydeder, Esc vazgeçer). Ad boş, çok uzun ya da mevcut bir görünümle aynı olamaz (Türkçe büyük/küçük harf farkı yok sayılır). Neyi içerdiğini bilmez: süzgeçleri görünüme çevirmek çağıranın işi. Kuzeyova portalı UX denetiminden.",
      },
    },
  },
  args: { views: START, value: "hepsi", onValueChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof SavedViews>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Kaydet ve Sil",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Görünümü Kaydet" }));
    const input = canvas.getByRole("textbox", { name: "Görünüm adı" });
    await userEvent.type(input, "bugün aranacaklar{Enter}");
    await expect(canvas.getByRole("alert")).toHaveTextContent("zaten var");
    await userEvent.clear(input);
    await userEvent.type(input, "Işıklı Hat{Enter}");
    await expect(canvas.getByRole("button", { name: "Işıklı Hat" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Sil: Işıklı Hat" }));
    await expect(canvas.queryByRole("button", { name: "Işıklı Hat" })).not.toBeInTheDocument();
  },
};
