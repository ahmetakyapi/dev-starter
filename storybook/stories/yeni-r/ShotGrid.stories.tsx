import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ShotCard } from "@/components/ui/shot-card";
import { ShotGrid, ShotGridToolbar, useShotGrid } from "@/components/ui/shot-grid";
import { FILTERS, WORKS } from "./_akis";

function Demo() {
  const grid = useShotGrid({ items: WORKS, filters: FILTERS, storageKey: null });
  return (
    <div className="grid w-[min(100vw-2rem,72rem)] gap-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-overlay p-1 shadow-floating ring-1 ring-line">
          <ShotGridToolbar grid={grid} />
        </div>
      </div>
      <ShotGrid
        grid={grid}
        renderItem={(w, { view }) => {
          const Scene = w.scene;
          return (
            <ShotCard title={w.title} description={w.description} meta={w.meta} ratio={view === "masonry" ? w.ratio : 16 / 10} titleAs="h3">
              <Scene />
            </ShotCard>
          );
        }}
      />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Çalışma Izgarası",
  id: "shot-grid",
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kartları iki düzende gösterir: Akış (tek sütun, aynı boy) ve Masonry (2-3 sütun, her kart kendi oranında, sıradaki kart en kısa sütuna). Süzgeç (yerel `<select>`), görünüm ve Karıştır ayrı bir araç çubuğunda (`ShotGridToolbar`, `role=\"toolbar\"`, ← → gezinme) — `ScrollHideBar` içine konabilir. Değişimde akış 480 ms'de solarak gelir, sayfa yerinde kalır; sonuç sayısı canlı bölgede. Görünüm tercihi `localStorage`. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  // Kanca tabanlı (useShotGrid): hikaye kendi Demo'sunu çizer.
  render: () => <Demo />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("article")).toHaveLength(6);
    const toolbar = canvas.getByRole("toolbar", { name: "Akış Görünümü" });
    await userEvent.click(within(toolbar).getByRole("button", { name: "Masonry" }));
    await expect(within(toolbar).getByRole("button", { name: "Masonry" })).toHaveAttribute("aria-pressed", "true");
    // Süzgeç: yalnız Liman Fırın işleri.
    await userEvent.selectOptions(within(toolbar).getAllByRole("combobox")[0], "liman");
    await waitFor(() => expect(canvas.getAllByRole("article")).toHaveLength(3));
    await expect(canvas.getByRole("status")).toHaveTextContent("3 iş gösteriliyor");
  },
};

export const Empty: Story = {
  name: "Boş Sonuç",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar");
    const [project, kind] = within(toolbar).getAllByRole("combobox");
    await userEvent.selectOptions(project, "liman");
    await userEvent.selectOptions(kind, "marka");
    await expect(await canvas.findByText("Bu süzgeçlerle eşleşen iş yok.")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Süzgeçleri Temizle" }));
    await waitFor(() => expect(canvas.getAllByRole("article")).toHaveLength(6));
  },
};

export const KeyboardToolbar: Story = {
  name: "Klavye",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar");
    const shuffle = within(toolbar).getByRole("button", { name: "Karıştır" });
    // Tek Tab durağı; End son öğeye (Karıştır) gider.
    within(toolbar).getAllByRole("combobox")[0].focus();
    await userEvent.keyboard("{End}");
    await expect(shuffle).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(within(toolbar).getByRole("button", { name: "Masonry" })).toHaveFocus();
  },
};
