import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { expect, userEvent, within } from "storybook/test";
import { ShotCard } from "@/components/ui/shot-card";
import { Frame } from "../_lib/Frame";
import { WORKS } from "./_akis";

const Booking = WORKS[0].scene;
const Tickets = WORKS[1].scene;

const meta = {
  title: "Bileşenler/Tanıtım/Çalışma Kartı",
  id: "shot-card",
  component: ShotCard,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Portfolyo akışının kartı: büyük gri kuyunun ortasında sahne (görsel, sessiz döngü video ya da gerçek bileşenlerle çizilmiş ekran), altında başlık, tek cümle ve künye. Video yalnız görünümdeyken oynar, dışına çıkınca durur; hareket azaltmada posterde kalır ve Oynat butonu çıkar. Yüklenene kadar iskelet ışıltısı. `onOpen` ile sahne “Aç: …” adlı buton olur; eylemler (beğen) künyenin sağındaki yuvada. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: {
    title: WORKS[0].title,
    description: WORKS[0].description,
    meta: WORKS[0].meta,
    onOpen: fn(),
  },
  render: (args) => (
    <Frame width="lg">
      <ShotCard {...args}>
        <Booking />
      </ShotCard>
    </Frame>
  ),
} satisfies Meta<typeof ShotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2, name: "Rezervasyon Bağlantıları" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Aç: Rezervasyon Bağlantıları" }));
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

export const WithActions: Story = {
  name: "Eylem Yuvası",
  args: { onOpen: undefined },
  render: (args) => (
    <Frame width="lg">
      <ShotCard
        {...args}
        title={WORKS[1].title}
        description={WORKS[1].description}
        meta={WORKS[1].meta}
        ratio={4 / 3}
        actions={
          <button type="button" className="rounded-full px-2.5 py-1 text-small text-muted ring-1 ring-line hover:text-strong">
            Paylaş
          </button>
        }
      >
        <Tickets />
      </ShotCard>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // onOpen yok: sahne buton değil, tek buton eylem yuvasındaki.
    await expect(canvas.queryByRole("button", { name: /^Aç:/ })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Paylaş" })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: "Medya Yükleniyor",
  args: { onOpen: undefined },
  parameters: { docs: { description: { story: "Kaynağı gelmeyen video: iskelet ışıltısı sürer, künye okunur kalır. Gerçek projede `media={{ type: \"video\", src, poster, label }}`." } } },
  render: (args) => (
    <Frame width="lg">
      <ShotCard {...args} media={{ type: "video", src: "", label: "Rezervasyon akışının ekran kaydı" }} />
    </Frame>
  ),
};
