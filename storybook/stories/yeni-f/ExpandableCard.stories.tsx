import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { PatternBackground } from "@/components/ui/pattern-bg";
import { Frame } from "../_lib/Frame";

/* Görsel yerine token'lı desen: hikâye ağ isteği yapmaz, palet değişince kart da döner. */
function Art({ glow, pattern }: { glow: "horizon-top" | "corner" | "bloom"; pattern: "dots" | "rings" | "diagonal" }) {
  return (
    <span className="relative isolate block size-full bg-surface-sunken">
      <PatternBackground pattern={pattern} glow={glow} fade="center" size={14} intensity={0.6} tone="primary" />
    </span>
  );
}

const ROASTS = [
  { title: "Kıyı Harmanı", summary: "Orta kavrum · 1 kg", art: <Art glow="horizon-top" pattern="dots" />, body: "Brezilya Cerrado ve Etiyopya Sidamo karışımı. Fındık, sütlü çikolata ve hafif portakal kabuğu. Espresso ve moka potta dengeli; filtrede 1:16 oranla dene. Kavrumdan sonraki 5-21 gün arası en iyi dönemi." },
  { title: "Yirgacheffe", summary: "Açık kavrum · 250 g", art: <Art glow="corner" pattern="rings" />, body: "Yıkanmış işlem, 1.900-2.200 m. Bergamot, yasemin, limon. V60 ve Chemex için; 94 °C su, 3 dakikada bitir." },
  { title: "Huila", summary: "Orta kavrum · 250 g", art: <Art glow="bloom" pattern="diagonal" />, body: "Kolombiya'nın güneyinden, küçük üretici kooperatifi. Kırmızı elma, karamel, yuvarlak gövde. Sütlü içeceklerde öne çıkar." },
];

const meta = {
  title: "Bileşenler/Katmanlar/Genişleyen Kart",
  id: "expandable-card",
  component: ExpandableCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Tıklanan kart yerinden büyüyerek pencereye dönüşür; görsel ve başlık aynı öğe olarak akar (`layoutId`), ayrıntı sonra belirir. Pencere kuralları tam: `role=\"dialog\"`, odak Kapat'a, Tab içeride döner, Escape ve zemin kapatır, odak karta geri döner. Hareket azaltmada yerinde solar.",
      },
    },
  },
  args: { title: ROASTS[0].title, summary: ROASTS[0].summary, children: ROASTS[0].body },
  render: () => (
    <Frame width="xl">
      <div className="grid gap-4 sm:grid-cols-3">
        {ROASTS.map((r) => (
          <ExpandableCard key={r.title} title={r.title} summary={r.summary} media={r.art}>
            {r.body}
          </ExpandableCard>
        ))}
      </div>
    </Frame>
  ),
} satisfies Meta<typeof ExpandableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const card = canvas.getByRole("button", { name: /Yirgacheffe/ });
    await userEvent.click(card);
    const dialog = await page.findByRole("dialog", { name: "Yirgacheffe" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Kapat" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    // Kabuk yumuşak yayla karta döner (~1,2 sn); pencere çıkış bitince kalkar.
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(card).toHaveFocus();
  },
};
