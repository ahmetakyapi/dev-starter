import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LikeButton } from "@/components/ui/like-button";
import { Frame } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Buton ve İkon/Beğeni Butonu",
  id: "like-button",
  component: LikeButton,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kalp + sayaç: basınca kalp dolar ve küçük bir pop yapar (0,82 → 1,18 → 1,04), sayaçta yalnız değişen rakam yuvarlanır. İyimser: `onToggle` reddederse geri alınır, hata canlı bölgede okunur. Adı sayıyı söyler, `aria-pressed`. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { count: 219 },
  render: (args) => (
    <Frame width="sm">
      <LikeButton {...args} />
    </Frame>
  ),
} satisfies Meta<typeof LikeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Beğen, 219 beğeni" });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await expect(canvas.getByRole("button", { name: "Beğen, 220 beğeni" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Failing: Story = {
  name: "Kaydedilemeyen Beğeni",
  args: { count: 6, onToggle: () => new Promise((_, reject) => setTimeout(() => reject(new Error("ağ")), 300)) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Beğen, 6 beğeni" }));
    await expect(canvas.getByRole("button", { name: "Beğen, 7 beğeni" })).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Beğeni kaydedilemedi"));
    await expect(canvas.getByRole("button", { name: "Beğen, 6 beğeni" })).toHaveAttribute("aria-pressed", "false");
  },
};
