import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FilePlus2, FileText, LayoutDashboard, Moon, Palette, Receipt, Search, Settings, UserPlus, Users } from "lucide-react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { CommandPalette, openCommandPalette, type Command } from "@/components/ui/command-palette";
import { KbdCombo } from "@/components/ui/kbd";
import { settle } from "./_settle";
import { Frame } from "../_lib/Frame";

const select = fn();

const COMMANDS: Command[] = [
  { id: "pano", label: "Pano", group: "Gezinme", icon: <LayoutDashboard />, shortcut: ["G", "P"], onSelect: () => select("pano") },
  { id: "raporlar", label: "Raporlar", group: "Gezinme", icon: <FileText />, shortcut: ["G", "R"], onSelect: () => select("raporlar") },
  { id: "musteriler", label: "Müşteriler", hint: "2.418 kayıt", group: "Gezinme", icon: <Users />, onSelect: () => select("musteriler") },
  { id: "faturalar", label: "Faturalar", group: "Gezinme", icon: <Receipt />, onSelect: () => select("faturalar") },
  { id: "yeni-rapor", label: "Yeni Rapor Oluştur", group: "Eylemler", icon: <FilePlus2 />, shortcut: ["⌘", "N"], onSelect: () => select("yeni-rapor") },
  { id: "davet", label: "Ekibe Üye Davet Et", group: "Eylemler", icon: <UserPlus />, keywords: ["kullanıcı", "ekle"], onSelect: () => select("davet") },
  { id: "tema", label: "Koyu Temaya Geç", group: "Tercihler", icon: <Moon />, keywords: ["görünüm", "karanlık"], onSelect: () => select("tema") },
  { id: "palet", label: "Paleti Değiştir", group: "Tercihler", icon: <Palette />, keywords: ["renk"], onSelect: () => select("palet") },
  { id: "ayarlar", label: "Hesap Ayarları", group: "Tercihler", icon: <Settings />, shortcut: ["⌘", ","], onSelect: () => select("ayarlar") },
];

const meta = {
  title: "Bileşenler/Katmanlar/Komut Paleti",
  component: CommandPalette,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "⌘K / Ctrl+K ile açılan, yerel `<dialog>` üstünde bir combobox: odak hep aramada kalır, ok tuşları etkin satırı taşır. Arama Türkçe küçük harfle karşılaştırır (“İ” → “i”), `keywords` eş anlamlılar içindir. Başlıktaki bir düğmeden açmak için `openCommandPalette()`.",
      },
    },
  },
  argTypes: { commands: { control: false } },
  args: { commands: COMMANDS, placeholder: "Komut ya da sayfa ara", emptyText: "Eşleşen komut yok." },
  render: (args) => (
    <Frame width="md" className="min-h-[32rem]">
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-overlay px-3 text-base text-muted shadow-raised transition-colors hover:border-line-strong"
      >
        <Search aria-hidden className="size-4" strokeWidth={1.75} />
        <span className="flex-1 text-left">Ara ya da komut çalıştır</span>
        <KbdCombo keys={["⌘", "K"]} label="Command K" className="hidden pointer-fine:inline-flex" />
      </button>
      <CommandPalette {...args} />
    </Frame>
  ),
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan (Kapalı)" };

export const KisayolIleAcilir: Story = {
  name: "⌘K ile Açılır",
  tags: ["!autodocs"],
  play: async ({ globals }) => {
    await userEvent.keyboard("{Meta>}k{/Meta}");
    const dialog = await screen.findByRole("dialog", { name: "Komut Paleti" });
    const input = within(dialog).getByRole("combobox");
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(input).toHaveAttribute("aria-activedescendant", expect.stringMatching(/-1$/));
    await settle(globals);
  },
};

export const DugmeyleAcilir: Story = {
  name: "Düğmeyle Açılır",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /Ara ya da komut çalıştır/ }));
    const dialog = await screen.findByRole("dialog", { name: "Komut Paleti" });
    await waitFor(() => expect(dialog).toBeVisible());
    await settle(globals);
  },
};

export const Arama: Story = {
  name: "Arama (Eş Anlamlıyla)",
  tags: ["!autodocs"],
  play: async ({ globals }) => {
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: "Komut Paleti" });
    await userEvent.type(within(dialog).getByRole("combobox"), "görünüm");
    await waitFor(() => expect(within(dialog).getByRole("option", { name: /Koyu Temaya Geç/ })).toBeVisible());
    await expect(within(dialog).queryByRole("option", { name: /Raporlar/ })).toBeNull();
    await settle(globals);
  },
};

export const SonucYok: Story = {
  name: "Sonuç Yok",
  tags: ["!autodocs"],
  play: async ({ globals }) => {
    await userEvent.keyboard("{Meta>}k{/Meta}");
    const dialog = await screen.findByRole("dialog", { name: "Komut Paleti" });
    await userEvent.type(within(dialog).getByRole("combobox"), "bordro");
    await waitFor(() => expect(within(dialog).getByText("Eşleşen komut yok.")).toBeVisible());
    await settle(globals);
  },
};
