import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SettingsDialog } from "@/components/ui/settings-dialog";
import { Cell, Gallery } from "../_lib/Frame";
import { SETTINGS_TABS } from "./settings-data";

/** Açık başlayan, kapatılınca düğmesiyle yeniden açılan kontrollü pencere. */
function OpenSettings(props: ComponentProps<typeof SettingsDialog>) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-overlay px-3.5 text-base font-medium text-strong shadow-raised transition-[border-color,background-color] hover:border-line-strong [&_svg]:size-4 [&_svg]:text-muted"
      >
        <Settings aria-hidden strokeWidth={1.75} />
        Ayarları Aç
      </button>
      <SettingsDialog {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}

const meta = {
  title: "Bloklar/Ayarlar Penceresi",
  component: SettingsDialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sayfadan çıkmadan açılan, anında etki eden ayarlar penceresi: solda sekmeler (telefonda üstte yatay kayar), sağda anahtar ve seçim satırları; Kaydet düğmesi yok. Ayar sayfası uzunsa ya da derin bağlantı gerekiyorsa ayrı rota daha doğru.",
      },
      story: { inline: false, height: "34rem" },
    },
  },
  args: {
    tabs: SETTINGS_TABS,
    title: "Ayarlar",
    description: "Pusula hesabının tercihleri.",
    defaultTab: "genel",
  },
  argTypes: {
    tabs: { control: false },
    defaultTab: { control: "select", options: SETTINGS_TABS.map((tab) => tab.value) },
  },
  render: (args) => <OpenSettings key={args.defaultTab} {...args} />,
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Acik: Story = {
  name: "Açık",
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement).findByRole("dialog");
    const tabs = within(dialog);
    const general = tabs.getByRole("tab", { name: "Genel" });
    await expect(general).toHaveAttribute("aria-selected", "true");
    general.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(tabs.getByRole("tab", { name: "Görünüm" })).toHaveAttribute("aria-selected", "true"));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(general).toHaveAttribute("aria-selected", "true"));
  },
};

export const GorunumSekmesi: Story = { name: "Görünüm Sekmesi", args: { defaultTab: "gorunum" } };
export const BildirimlerSekmesi: Story = { name: "Bildirimler Sekmesi", args: { defaultTab: "bildirimler" } };
export const GizlilikSekmesi: Story = { name: "Gizlilik Sekmesi", args: { defaultTab: "gizlilik" } };

export const KendiDugmesiyle: Story = {
  name: "Kendi Düğmesiyle",
  parameters: { docs: { description: { story: "Kontrolsüz kullanım: `triggerLabel` ile kendi düğmesini çizer." } } },
  render: (args) => <SettingsDialog {...args} />,
  args: { triggerLabel: "Ayarlar" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Ayarlar" }));
    const dialog = await canvas.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("tab", { name: "Bildirimler" }));
    await expect(within(dialog).getByRole("switch", { name: /Ajan İşi Bitirdiğinde/ })).toBeChecked();
  },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: {
    docs: { description: { story: "Pencere tek seferde bir tane açılır; galeri her sekmenin satırlarını yan yana gösterir." } },
  },
  render: () => (
    <Gallery cols={2}>
      {SETTINGS_TABS.map((tab) => (
        <Cell key={tab.value} label={`${tab.label} sekmesi`} className="block">
          <div className="rounded-xl bg-overlay p-5 shadow-raised ring-1 ring-line">{tab.content}</div>
        </Cell>
      ))}
    </Gallery>
  ),
};
