import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronDown, Copy, ExternalLink, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { settle } from "./_settle";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const onAction = fn();

const meta = {
  title: "Bileşenler/Katmanlar/Açılır Menü",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir düğmenin altındaki eylem listesi (Düzenle, Kopyala, Sil); değer seçtirmek için `Select` kullan. WAI-ARIA menü kalıbı Base UI'dan: oklar, Home/End, harfle atlama, Escape ile kapanıp odağın tetikleyiciye dönmesi. Başka sayfaya giden öğe `DropdownMenuLinkItem`; yıkıcı öğe ayırıcıdan sonra ve `tone=\"danger\"`.",
      },
    },
  },
  argTypes: { defaultOpen: { control: "boolean" }, children: { control: false } },
  args: { defaultOpen: false },
  render: (args) => (
    <Frame width="sm" className="min-h-96">
      <div className="flex justify-center">
        <DropdownMenu {...args}>
          <DropdownMenuTrigger render={<Button variant="secondary" />}>
            Eylemler
            <ChevronDown aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />} shortcut="E" onClick={() => onAction("Düzenle")}>
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Copy />} shortcut="⌘D" onClick={() => onAction("Kopyasını Oluştur")}>
              Kopyasını Oluştur
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Share2 />} onClick={() => onAction("Paylaş")}>
              Paylaş
            </DropdownMenuItem>
            <DropdownMenuLinkItem icon={<ExternalLink />} href="#rapor">
              Raporu Yeni Sekmede Aç
            </DropdownMenuLinkItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" icon={<Trash2 />} shortcut="⌘⌫" onClick={() => onAction("Sil")}>
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Frame>
  ),
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan (Kapalı)" };

export const TiklayincaAcilir: Story = {
  name: "Tıklayınca Açılır",
  tags: ["!autodocs"],
  play: async ({ canvasElement, globals }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Eylemler" });
    await userEvent.click(trigger);
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Düzenle" })).toBeVisible());
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(menu).getAllByRole("menuitem").some((item) => item.hasAttribute("data-highlighted"))).toBe(true));
    await settle(globals);
  },
};

export const Acik: Story = {
  name: "Açık",
  tags: ["!autodocs"],
  args: { defaultOpen: true },
  play: async ({ globals }) => {
    await settle(globals);
  },
};

function ColumnsMenu({ defaultOpen }: { defaultOpen?: boolean }) {
  const [columns, setColumns] = useState<Record<string, boolean>>({ Müşteri: true, Tutar: true, Durum: true, "Son Ödeme": false });
  const [sort, setSort] = useState("yeni");
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={<IconButton icon={MoreHorizontal} aria-label="Tablo Seçenekleri" variant="secondary" />} />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sütunlar</DropdownMenuLabel>
          {Object.keys(columns).map((name) => (
            <DropdownMenuCheckboxItem
              key={name}
              checked={columns[name]}
              onCheckedChange={(checked) => setColumns((prev) => ({ ...prev, [name]: checked }))}
              closeOnClick={false}
            >
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(String(value))}>
            <DropdownMenuRadioItem value="yeni">En yeni önce</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="eski">En eski önce</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="tutar">Tutara göre</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const OnayVeRadyoAcik: Story = {
  name: "Onay ve Radyo Öğeleri (Açık)",
  tags: ["!autodocs"],
  render: () => (
    <Frame width="sm" className="min-h-[30rem]">
      <div className="flex justify-center">
        <ColumnsMenu defaultOpen />
      </div>
    </Frame>
  ),
  play: async ({ globals }) => {
    await settle(globals);
  },
};

export const TumVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Metinli tetikleyici: eylem listesi">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" />}>
            Eylemler
            <ChevronDown aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />}>Düzenle</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" icon={<Trash2 />}>
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Cell>
      <Cell label="İkon tetikleyici: onay ve radyo öğeleri">
        <ColumnsMenu />
      </Cell>
    </Gallery>
  ),
};
