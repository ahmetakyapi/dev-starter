import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Copy, Eye, FileText, Folder, FolderInput, Link2, PencilLine, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fireEvent, screen, userEvent, waitFor, within } from "storybook/test";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { settle } from "./_settle";
import { Frame } from "../_lib/Frame";

function FileCard() {
  const [starred, setStarred] = useState(true);
  return (
    <ContextMenu>
      <ContextMenuTrigger
        aria-label="Q3 raporu.pdf, seçenekler için sağ tıklayın"
        className="block w-full max-w-72 rounded-xl bg-overlay p-3 shadow-raised outline-none select-none focus-visible:outline-2 focus-visible:outline-line-focus"
      >
        <div className="grid aspect-[16/9] place-items-center rounded-lg bg-chart-2/15">
          <FileText aria-hidden className="size-8 text-primary-ink" strokeWidth={1.5} />
        </div>
        <p className="mt-3 truncate text-base font-semibold text-strong">Q3 raporu.pdf</p>
        <p className="text-small text-muted">2,4 MB · 12 Eki</p>
        <p className="mt-3 rounded-md bg-surface px-2.5 py-1.5 text-center text-small text-muted">Sağ tıklayın ya da basılı tutun</p>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem icon={<Eye />} shortcut={["⌘", "O"]}>
          Aç
        </ContextMenuItem>
        <ContextMenuItem icon={<PencilLine />} shortcut={["F2"]}>
          Yeniden Adlandır
        </ContextMenuItem>
        <ContextMenuItem icon={<Copy />} shortcut={["⌘", "D"]}>
          Kopyasını Oluştur
        </ContextMenuItem>
        <ContextMenuSub label="Taşı" icon={<FolderInput />}>
          <ContextMenuItem icon={<Folder />}>Finans</ContextMenuItem>
          <ContextMenuItem icon={<Folder />}>Yönetim Kurulu</ContextMenuItem>
          <ContextMenuItem icon={<Folder />}>Arşiv 2026</ContextMenuItem>
        </ContextMenuSub>
        <ContextMenuSub label="Paylaş" icon={<Share2 />}>
          <ContextMenuItem icon={<Link2 />} shortcut={["⌘", "L"]}>
            Bağlantıyı Kopyala
          </ContextMenuItem>
          <ContextMenuItem>Ekiple Paylaş</ContextMenuItem>
        </ContextMenuSub>
        <ContextMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>
          Yıldızla
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem tone="danger" icon={<Trash2 />} shortcut={["⌘", "⌫"]}>
            Çöp Kutusuna Taşı
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Kartın ortasına sağ tık: menü imlecin olduğu yerde açılır. */
async function rightClick(canvasElement: HTMLElement) {
  const card = within(canvasElement).getByText("Q3 raporu.pdf");
  const box = card.getBoundingClientRect();
  fireEvent.contextMenu(card, { clientX: box.left + box.width / 2, clientY: box.top, button: 2 });
  return screen.findByRole("menu");
}

const meta = {
  title: "Bileşenler/Katmanlar/Bağlam Menüsü",
  id: "components-overlays-context-menu",
  component: ContextMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir nesnenin üzerinde sağ tık ya da uzun basmayla açılan eylem listesi. Gizli bir kapıdır, tek kapı olamaz: aynı eylemler görünür bir “Daha Fazla” düğmesiyle (`DropdownMenu`) de sunulmalı. Yıkıcı öğe ayırıcıdan sonra ayrı grupta; kısayollar yalnızca hatırlatıcıdır.",
      },
    },
  },
  argTypes: { children: { control: false } },
  render: () => (
    <Frame width="md" className="min-h-[34rem]">
      <div className="flex justify-center">
        <FileCard />
      </div>
    </Frame>
  ),
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan (Kapalı)" };

export const OpensOnRightClick: Story = {
  name: "Sağ Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    const menu = await rightClick(canvasElement);
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: /Yeniden Adlandır/ })).toBeVisible());
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Yıldızla" })).toHaveAttribute("aria-checked", "true");
    await settle(globals);
  },
};

export const SubmenuOpen: Story = {
  name: "Alt Menü Açık",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    const menu = await rightClick(canvasElement);
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Taşı" }));
    await waitFor(() => expect(screen.getAllByRole("menu").length).toBeGreaterThan(1));
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Yönetim Kurulu/ })).toBeVisible());
    await settle(globals);
  },
};
