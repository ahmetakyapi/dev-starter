import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { KanbanBoard, type KanbanColumn } from "@/components/ui/kanban-board";
import { Gallery } from "../_lib/Frame";
import { GrafikHucre, Sahne } from "../grafik/_sahne";
import { BUGUN, SPRINT } from "./_veri";

const meta = {
  title: "Bileşenler/Verimlilik/Kanban Panosu",
  id: "kanban-board",
  component: KanbanBoard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "İşi kolonlar arasında taşıyan ekip panosu. Üç yol: fareyle kartın her yerinden, dokunmada tutamaktan (gövde kaydırmaya kalır), klavyede Boşluk ile tut, oklarla taşı, Boşluk ile bırak, Escape ile vazgeç; her adım canlı bölgede okunur. Kolon sayacı WIP sınırını gösterir; `limitMode=\"block\"` dolu kolona bırakmayı reddeder.",
      },
    },
  },
  args: {
    defaultColumns: SPRINT,
    today: BUGUN,
    label: "Sprint 46 panosu",
    limitMode: "warn",
    onChange: fn(),
  },
  argTypes: {
    defaultColumns: { control: "object" },
    limitMode: { control: "inline-radio", options: ["warn", "block"] },
  },
  render: (args) => (
    <Sahne width="xl">
      <KanbanBoard {...args} />
    </Sahne>
  ),
} satisfies Meta<typeof KanbanBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Başlığına göre kolonun içinde arama. */
const kolon = (root: HTMLElement, ad: string) => within(within(root).getByRole("heading", { name: ad }).closest<HTMLElement>("[data-column]")!);

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector("[aria-live]")!;
    const kart = canvas.getByRole("button", { name: /^Fatura e-postasına PDF eki/ });
    kart.focus();
    // Boşlukla tut, sağ okla "Sürüyor"a taşı, aşağı okla sona indir, Boşlukla bırak
    await userEvent.keyboard(" ");
    await expect(kart).toHaveAttribute("aria-pressed", "true");
    await expect(live).toHaveTextContent("Fatura e-postasına PDF eki tutuldu. Yapılacak kolonu, konum 1 / 3");
    await userEvent.keyboard("{ArrowRight}");
    await expect(live).toHaveTextContent("Sürüyor kolonu, konum 1 / 3");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await expect(live).toHaveTextContent("Sürüyor kolonu, konum 3 / 3");
    await userEvent.keyboard(" ");
    await expect(live).toHaveTextContent("Fatura e-postasına PDF eki bırakıldı. Sürüyor kolonu, konum 3 / 3.");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    // Kart gerçekten yeni kolonda ve odak onda
    const suruyor = kolon(canvasElement, "Sürüyor");
    await expect(suruyor.getAllByRole("button")).toHaveLength(3);
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Fatura e-postasına PDF eki/));
    // Sınırda (3 / 3): sayaç uyarı tonunda ve okunur
    await expect(suruyor.getByText(/sınır 3, sınırda/)).toBeInTheDocument();
  },
};

export const KeyboardCancel: Story = {
  name: "Klavyeyle Taşı, Escape ile Vazgeç",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector("[aria-live]")!;
    const kart = canvas.getByRole("button", { name: /^Proje şablonları galerisi/ });
    kart.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(live).toHaveTextContent("Sürüyor kolonu");
    await userEvent.keyboard("{Escape}");
    await expect(live).toHaveTextContent("Taşıma iptal edildi. Proje şablonları galerisi ilk yerine döndü: İncelemede kolonu, konum 1 / 3.");
    await expect(kolon(canvasElement, "İncelemede").getAllByRole("button")).toHaveLength(3);
  },
};

export const BlockLimit: Story = {
  name: "Sınır Engeller (WIP)",
  args: { limitMode: "block" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector("[aria-live]")!;
    // İncelemede 3 / 2: sınır aşılmış, Sürüyor'dan oraya taşınamaz
    await expect(kolon(canvasElement, "İncelemede").getByText(/sınır aşıldı/)).toBeInTheDocument();
    const kart = canvas.getByRole("button", { name: /^CSV dışa aktarımında/ });
    kart.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await expect(live).toHaveTextContent("İncelemede kolonu dolu (sınır 2).");
    await userEvent.keyboard(" ");
    await expect(kolon(canvasElement, "Sürüyor").getAllByRole("button")).toHaveLength(2);
  },
};

const BOS: KanbanColumn[] = [
  { id: "todo", title: "Yapılacak", cards: [] },
  { id: "doing", title: "Sürüyor", limit: 3, cards: [] },
  { id: "review", title: "İncelemede", limit: 2, cards: [] },
  { id: "done", title: "Bitti", done: true, cards: [] },
];

export const Empty: Story = {
  name: "Boş Pano",
  args: { defaultColumns: BOS },
};

export const FewCards: Story = {
  name: "Az Kart",
  args: {
    defaultColumns: [
      { ...BOS[0], cards: [SPRINT[0].cards[0]] },
      { ...BOS[1], cards: [SPRINT[1].cards[0]] },
      BOS[2],
      BOS[3],
    ],
  },
};

export const LongTitles: Story = {
  name: "Uzun Başlık ve Çok Etiket",
  args: {
    defaultColumns: [
      {
        ...SPRINT[0],
        cards: [
          {
            id: "PUS-160",
            title: "Kurumsal müşteriler için tek oturum açma (SAML) yapılandırma sihirbazı ve hata durumlarının açıklayıcı metinleri",
            tags: [
              { label: "Güvenlik", tone: "chart-6" },
              { label: "Kurumsal", tone: "chart-4" },
              { label: "Belgelendirme", tone: "chart-1" },
              { label: "Tasarım", tone: "chart-5" },
            ],
            assignee: { name: "Deniz Arslan" },
            due: "2026-10-28",
          },
          ...SPRINT[0].cards,
        ],
      },
      ...SPRINT.slice(1),
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
    <Gallery cols={2}>
      <GrafikHucre label="Uyarı: sınır aşılınca sayaç kırmızı">
        <KanbanBoard label="Uyarı modlu pano" today={BUGUN} defaultColumns={[SPRINT[1], SPRINT[2]]} />
      </GrafikHucre>
      <GrafikHucre label="Engel: dolu kolona bırakılmaz">
        <KanbanBoard label="Engel modlu pano" today={BUGUN} limitMode="block" defaultColumns={[SPRINT[0], { ...SPRINT[1], limit: 2 }]} />
      </GrafikHucre>
      <GrafikHucre label="Bitti kolonu: gecikme gösterilmez">
        <KanbanBoard label="Bitti kolonlu pano" today={BUGUN} defaultColumns={[SPRINT[3], { ...SPRINT[3], id: "done-2", title: "Arşiv", cards: [] }]} />
      </GrafikHucre>
      <GrafikHucre label="Boş kolonlar">
        <KanbanBoard label="Boş pano" today={BUGUN} defaultColumns={[BOS[0], BOS[1]]} />
      </GrafikHucre>
    </Gallery>
  ),
};
