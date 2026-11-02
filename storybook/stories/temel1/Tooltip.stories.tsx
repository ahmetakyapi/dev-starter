import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Download, Pencil, Settings, Share2 } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { IconButton } from "@/components/ui/icon-button";
import { InfoTip, Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { settle } from "./_settle";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Katmanlar/İpucu",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "`Tooltip` görsel etikettir: ikon düğmenin adını fareyle gelene ve klavyeyle odaklanana gösterir, dokunmatikte bilerek açılmaz; içine önemli bilgi konmaz. Okunması gereken açıklama için `InfoTip`: farede üzerine gelince, dokunmatikte tıklayınca açılır.",
      },
    },
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    children: { control: false },
  },
  args: {
    label: "Ayarları Aç",
    side: "top",
    delay: 500,
    children: <IconButton icon={Settings} aria-label="Ayarları Aç" variant="secondary" showTitle={false} />,
  },
  render: (args) => (
    <Frame width="sm" className="min-h-56">
      <div className="flex justify-center pt-12">
        <Tooltip {...args} />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan (Kapalı)" };

export const OdaklanincaAcilir: Story = {
  name: "Klavyeyle Odaklanınca Açılır",
  tags: ["!autodocs"],
  args: { delay: 0 },
  play: async ({ canvasElement, globals }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole("button", { name: "Ayarları Aç" })).toHaveFocus();
    const tip = await screen.findByText("Ayarları Aç");
    await waitFor(() => expect(tip).toBeVisible());
    await settle(globals);
  },
};

export const InfoTipKapali: Story = {
  name: "InfoTip (Kapalı)",
  render: () => (
    <Frame width="sm" className="min-h-64">
      <div className="pt-24">
        <p className="flex items-center gap-2 text-small font-medium text-muted">
          F/K Oranı
          <InfoTip label="F/K Nedir">Hisse fiyatının hisse başına yıllık kâra oranı. Düşük değer, kâra göre ucuz demektir.</InfoTip>
        </p>
        <p className="mt-1 text-display font-bold text-strong tabular-nums">14,2</p>
      </div>
    </Frame>
  ),
};

export const InfoTipAcik: Story = {
  name: "InfoTip (Tıklayınca Açık)",
  tags: ["!autodocs"],
  render: InfoTipKapali.render,
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "F/K Nedir" }));
    const popup = await screen.findByRole("dialog", { name: "F/K Nedir" });
    await waitFor(() => expect(popup).toBeVisible());
    await settle(globals);
  },
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Araç çubuğu: TooltipProvider ile komşular beklemeden açılır">
        <TooltipProvider>
          <div className="flex gap-1 rounded-lg bg-overlay p-1 shadow-raised">
            <Tooltip label="Düzenle">
              <IconButton icon={Pencil} aria-label="Düzenle" showTitle={false} size="sm" />
            </Tooltip>
            <Tooltip label="Paylaş">
              <IconButton icon={Share2} aria-label="Paylaş" showTitle={false} size="sm" />
            </Tooltip>
            <Tooltip label="İndir">
              <IconButton icon={Download} aria-label="İndir" showTitle={false} size="sm" />
            </Tooltip>
            <Tooltip label="Bildirimler" side="bottom">
              <IconButton icon={Bell} aria-label="Bildirimler" showTitle={false} size="sm" />
            </Tooltip>
          </div>
        </TooltipProvider>
      </Cell>
      <Cell label="InfoTip: sayının yanında açıklama">
        <p className="flex items-center gap-2 text-base font-medium text-body">
          Aktif Kullanıcı
          <InfoTip label="Aktif Kullanıcı Nedir">Son 30 günde en az bir kez oturum açan kişi sayısı.</InfoTip>
        </p>
      </Cell>
    </Gallery>
  ),
};
