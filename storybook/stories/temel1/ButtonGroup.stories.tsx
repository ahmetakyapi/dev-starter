import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronLeft, ChevronRight, Italic, Underline } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/button-group";
import { IconButton } from "@/components/ui/icon-button";
import { Cell, Gallery } from "../_lib/Frame";

function FormatToggles() {
  const [on, setOn] = useState<Record<string, boolean>>({ Kalın: true, İtalik: false, "Altı Çizili": false });
  const icons = { Kalın: Bold, İtalik: Italic, "Altı Çizili": Underline } as const;
  return (
    <ButtonGroup aria-label="Metin biçimi" variant="well">
      {(Object.keys(icons) as (keyof typeof icons)[]).map((name) => (
        <IconButton
          key={name}
          icon={icons[name]}
          aria-label={name}
          aria-pressed={on[name]}
          onClick={() => setOn((prev) => ({ ...prev, [name]: !prev[name] }))}
          size="sm"
        />
      ))}
    </ButtonGroup>
  );
}

const meta = {
  title: "Bileşenler/Düğme ve İkon/Düğme Grubu",
  id: "button-group",
  component: ButtonGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Birbirine bağlı düğmeler (“Önceki / Bugün / Sonraki”). Grubun bir adı olur (`aria-label`). `attached` kenarları kaynaştırır; `well` gri kuyuda aç-kapa düğmeleri dizer, basılı (`aria-pressed`) olan beyaz karo olur. Tek seçim gerekiyorsa `SegmentedControl` kullan.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["attached", "well"] },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    children: { control: false },
  },
  args: {
    "aria-label": "Tarih gezintisi",
    variant: "attached",
    orientation: "horizontal",
    children: (
      <>
        <Button variant="secondary" aria-label="Önceki hafta">
          <ChevronLeft aria-hidden />
        </Button>
        <Button variant="secondary">Bugün</Button>
        <Button variant="secondary" aria-label="Sonraki hafta">
          <ChevronRight aria-hidden />
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const WellToggle: Story = {
  name: "Gri Zeminli (Aç-Kapa)",
  render: () => <FormatToggles />,
  play: async ({ canvasElement }) => {
    const italic = within(canvasElement).getByRole("button", { name: "İtalik" });
    await expect(italic).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(italic);
    await expect(italic).toHaveAttribute("aria-pressed", "true");
  },
};

export const Vertical: Story = {
  name: "Dikey",
  args: {
    orientation: "vertical",
    "aria-label": "Hizalama",
    children: (
      <>
        <Button variant="secondary"><AlignLeft aria-hidden />Sola</Button>
        <Button variant="secondary"><AlignCenter aria-hidden />Ortaya</Button>
        <Button variant="secondary"><AlignRight aria-hidden />Sağa</Button>
      </>
    ),
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="attached · Metinli">
        <ButtonGroup aria-label="Görünüm">
          <Button variant="secondary">Liste</Button>
          <Button variant="secondary" aria-pressed="true">Pano</Button>
          <Button variant="secondary">Takvim</Button>
        </ButtonGroup>
      </Cell>
      <Cell label="attached · İkonlu">
        <ButtonGroup aria-label="Hizalama">
          <IconButton variant="secondary" icon={AlignLeft} aria-label="Sola Hizala" />
          <IconButton variant="secondary" icon={AlignCenter} aria-label="Ortala" />
          <IconButton variant="secondary" icon={AlignRight} aria-label="Sağa Hizala" />
        </ButtonGroup>
      </Cell>
      <Cell label="well · Aç-Kapa (Kalın Basılı)">
        <FormatToggles />
      </Cell>
      <Cell label="attached · Dikey">
        <ButtonGroup aria-label="Sayfa" orientation="vertical">
          <Button variant="secondary">Önceki</Button>
          <Button variant="secondary">Sonraki</Button>
        </ButtonGroup>
      </Cell>
    </Gallery>
  ),
};
