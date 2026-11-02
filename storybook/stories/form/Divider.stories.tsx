import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/divider";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

const meta = {
  title: "Bileşenler/Geri Bildirim/Ayırıcı",
  id: "components-feedback-divider",
  component: Divider,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "İçeriği iki parçaya bölen kıl çizgi; kart içinde ikinci kart açmak yerine bölümler bununla ayrılır. Dikey ayırıcı `aria-orientation` taşır; etiketli olan (\"ya da\") separator değildir ki etiket ekran okuyucuda kaybolmasın. Yalnızca görsel ritimse `decorative`.",
      },
    },
  },
  args: {
    orientation: "horizontal",
    tone: "default",
    align: "center",
    decorative: false,
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    tone: { control: "inline-radio", options: ["soft", "default", "strong"] },
    align: { control: "inline-radio", options: ["start", "center"] },
    label: { control: "text" },
  },
  render: (args) => (
    <Frame width="sm">
      <div className={args.orientation === "vertical" ? "flex h-10 items-center justify-center gap-4 text-small text-muted" : "grid gap-4"}>
        <p className="text-base text-body">Fatura bilgileri</p>
        <Divider {...args} />
        <p className="text-base text-body">Teslimat bilgileri</p>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
};

export const Horizontal: Story = {
  name: "Yatay",
  render: () => (
    <Frame width="sm">
      <div className="rounded-lg bg-overlay p-5 shadow-raised">
        <p className="text-base font-semibold text-strong">Sipariş #10482</p>
        <p className="mt-0.5 text-small text-muted">3 ürün, 1.240 TL</p>
        <Divider className="my-4" />
        <p className="text-base font-semibold text-strong">Teslimat</p>
        <p className="mt-0.5 text-small text-muted">Moda Cad. No 18, Kadıköy</p>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("separator")).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  name: "Dikey",
  render: () => (
    <Frame width="sm">
      <div className="flex h-9 items-center justify-center gap-3 text-small text-muted">
        <span>Taslak</span>
        <Divider orientation="vertical" />
        <span>12 Eki</span>
        <Divider orientation="vertical" />
        <span>3 düzenleyen</span>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const [first] = within(canvasElement).getAllByRole("separator");
    await expect(first).toHaveAttribute("aria-orientation", "vertical");
  },
};

export const Labeled: Story = {
  name: "Etiketli",
  render: () => (
    <Frame width="sm">
      <div className="grid gap-4">
        <Button variant="secondary">Google ile Giriş Yap</Button>
        <Divider label="ya da" />
        <Button variant="secondary">E-postayla Devam Et</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ya da")).toBeVisible();
    await expect(canvas.queryByRole("separator")).not.toBeInTheDocument();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Yatay, soft">
        <Divider tone="soft" />
      </Cell>
      <Cell label="Yatay, default">
        <Divider />
      </Cell>
      <Cell label="Yatay, strong">
        <Divider tone="strong" />
      </Cell>
      <Cell label="Etiketli, ortada">
        <Divider label="ya da" className="w-full" />
      </Cell>
      <Cell label="Etiketli, başta">
        <Divider label="Dün" align="start" className="w-full" />
      </Cell>
      <Cell label="Dikey">
        <div className="flex h-9 items-center gap-3 text-small text-muted">
          <span>Taslak</span>
          <Divider orientation="vertical" />
          <span>12 Eki</span>
          <Divider orientation="vertical" decorative />
          <span>3 düzenleyen</span>
        </div>
      </Cell>
    </Gallery>
  ),
};
