import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MediaLightbox, useLightbox, type LightboxItem } from "@/components/ui/media-lightbox";
import { Frame } from "../_lib/Frame";

/** Üçüncü taraf görsel yok: kareler token'la çizilmiş küçük ekran sahneleri. */
function Scene({ bars, title }: { bars: number[]; title: string }) {
  return (
    <div className="grid aspect-[16/10] w-full max-w-2xl gap-3 rounded-xl bg-overlay p-5 shadow-raised">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-line-strong" />
        ))}
        <span className="ml-3 text-small text-muted">{title}</span>
      </div>
      <div className="flex items-end gap-2 rounded-lg bg-surface p-4">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-t-md bg-primary-soft" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

const ITEMS: LightboxItem[] = [
  { id: "a", title: "Rezervasyon Bağlantıları", description: "15, 30 ve 60 dakikalık görüşme kartları.", node: <Scene title="Takvim" bars={[30, 55, 40, 80, 62, 45, 70]} /> },
  { id: "b", title: "Görev Ayrıntısı", description: "Alt görevler, tarih alanları ve durum hapı.", node: <Scene title="Görevler" bars={[60, 35, 75, 50, 90, 40, 55]} /> },
  { id: "c", title: "Duyuru Düzenleyici", description: "Kanallara giden bakım duyurusu.", node: <Scene title="Duyurular" bars={[20, 45, 65, 85, 70, 50, 30]} /> },
];

function Demo() {
  const box = useLightbox(ITEMS.length);
  return (
    <Frame width="lg">
      <ul className="grid grid-cols-3 gap-3">
        {ITEMS.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => box.show(i)}
              className="grid w-full gap-2 rounded-xl border border-line bg-surface p-2 text-left text-small text-strong transition-colors hover:bg-surface-sunken"
            >
              <span aria-hidden className="pointer-events-none origin-top-left">
                {item.node}
              </span>
              <span className="truncate px-1">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <MediaLightbox items={ITEMS} {...box.props} />
    </Frame>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Medya Işıklığı",
  id: "media-lightbox",
  component: MediaLightbox,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      story: { inline: false, iframeHeight: 640 },
      description: {
        component:
          "Galerideki kareyi sayfanın üstünde büyük gösterir: yerel `<dialog>`, zemin solar, kart 0,97 ölçek ve 8 px aşağıdan yükselir. ← / → ve Önceki/Sonraki ile gezilir, konum (\"2 / 3\") canlı bölgede, Escape kapatır ve odak açan karta döner. Görsel, sessiz video ya da canlı sahne. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { items: ITEMS, index: 0, open: false, onIndexChange: () => {}, onOpenChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof MediaLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: /Görev Ayrıntısı/ });
    await userEvent.click(opener);
    const dialog = await canvas.findByRole("dialog", { name: "Görev Ayrıntısı" });
    await expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByRole("dialog", { name: "Duyuru Düzenleyici" })).toBeInTheDocument());
    await userEvent.click(within(dialog).getByRole("button", { name: "Sonraki" }));
    await waitFor(() => expect(canvas.getByRole("dialog", { name: "Rezervasyon Bağlantıları" })).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
