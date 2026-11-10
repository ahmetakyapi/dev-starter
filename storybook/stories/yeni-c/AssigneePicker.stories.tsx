import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AssigneePicker, type Person } from "@/components/ui/assignee-picker";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const TEAM: Person[] = [
  { id: "ahmet", name: "Ahmet Akyapı", detail: "Destek Lideri" },
  { id: "zeynep", name: "Zeynep Kaya", detail: "Destek Uzmanı" },
  { id: "mert", name: "Mert Aksoy", detail: "Satış Sorumlusu" },
  { id: "selin", name: "Selin Arslan", detail: "Satış Temsilcisi" },
  { id: "can", name: "Can Demir", detail: "Operasyon" },
  { id: "burak", name: "Burak Öztürk", detail: "Muhasebe" },
];

function Stateful({ initial, multiple = true, label = "İzleyenler" }: { initial: string[]; multiple?: boolean; label?: string }) {
  const [value, setValue] = useState(initial);
  return <AssigneePicker label={label} multiple={multiple} people={TEAM} value={value} onValueChange={setValue} />;
}

const meta = {
  title: "Bileşenler/Seçim/Kişi Seçici",
  id: "assignee-picker",
  component: AssigneePicker,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Talebe, göreve ya da karta kişi ata. Tetikleyici seçilenlerin avatar yığını, boşken kesik çizgili “Ekle” halkası; adı durumu söyler (“İzleyenler: Can Demir”). Açılan katmanda Türkçe harf düzleyen arama (“ozturk” → Öztürk), ok tuşlarıyla gezilen liste (`listbox`, `aria-selected`). Tekli modda seçim katmanı kapatır.",
      },
    },
  },
  args: { label: "İzleyenler", people: TEAM, value: ["can", "mert"], onValueChange: () => undefined },
  render: () => (
    <Frame width="sm">
      <Stateful initial={["can", "mert"]} />
    </Frame>
  ),
} satisfies Meta<typeof AssigneePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Çoklu Seçim",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "İzleyenler: Mert Aksoy, Can Demir" }));
    const search = await page.findByRole("combobox", { name: "İzleyenler için kişi ara" });
    await expect(search).toHaveFocus();
    await userEvent.type(search, "ozturk");
    const option = page.getByRole("option", { name: /Burak Öztürk/ });
    await expect(option).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{Enter}");
    await expect(option).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Escape}");
    // Odak, açılır pencere kapanış geçişi bitince düğmeye döner (anında değil).
    await waitFor(() => expect(canvas.getByRole("button", { name: "İzleyenler: Mert Aksoy, Can Demir, Burak Öztürk" })).toHaveFocus());
  },
};

export const Single: Story = {
  name: "Tekli (Atanan)",
  render: () => (
    <Frame width="sm">
      <Stateful initial={["zeynep"]} multiple={false} label="Atanan" />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Atanan: Zeynep Kaya" }));
    await userEvent.click(await page.findByRole("option", { name: /Selin Arslan/ }));
    await expect(await canvas.findByRole("button", { name: "Atanan: Selin Arslan" })).toBeVisible();
  },
};

export const Empty: Story = {
  name: "Boş",
  render: () => (
    <Frame width="sm">
      <Stateful initial={[]} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "İzleyenler: kimse yok" })).toBeVisible();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <Stateful initial={[]} />
      </Cell>
      <Cell label="İki Kişi">
        <Stateful initial={["ahmet", "zeynep"]} />
      </Cell>
      <Cell label="Fazlası +N">
        <Stateful initial={["ahmet", "zeynep", "mert", "selin", "can"]} />
      </Cell>
    </Gallery>
  ),
};
