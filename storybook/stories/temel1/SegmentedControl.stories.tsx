import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { useArgs } from "storybook/preview-api";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { Cell, Gallery } from "../_lib/Frame";

const RANGE: readonly SegmentOption<string>[] = [
  { value: "gun", label: "Gün" },
  { value: "hafta", label: "Hafta" },
  { value: "ay", label: "Ay" },
  { value: "yil", label: "Yıl" },
];

function Local({ options, initial, label, size }: { options: readonly SegmentOption<string>[]; initial: string; label: string; size?: "sm" | "md" }) {
  const [value, setValue] = useState(initial);
  return <SegmentedControl options={options} value={value} onValueChange={setValue} aria-label={label} size={size} />;
}

const meta = {
  title: "Bileşenler/Düğme ve İkon/Bölmeli Seçici",
  id: "components-buttons-segmented-control",
  component: SegmentedControl,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "2-5 seçenekten biri (“Gün / Hafta / Ay”). Anlamı bir radyo grubu: ok tuşları seçimi taşır, Tab gruba bir kez girer; seçili seçenek gri kuyuda kayan beyaz karo. Seçim bir içerik bölümünü değiştiriyorsa `Tabs` kullan.",
      },
    },
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    value: { control: "select", options: RANGE.map((option) => option.value) },
    options: { control: false },
  },
  args: { options: RANGE, value: "hafta", "aria-label": "Zaman Aralığı", size: "md", onValueChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <SegmentedControl
        {...args}
        onValueChange={(value) => {
          updateArgs({ value });
          args.onValueChange(value);
        }}
      />
    );
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Ay" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith("ay");
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Ay" })).toHaveAttribute("aria-checked", "true"));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByRole("radio", { name: "Yıl" })).toHaveAttribute("aria-checked", "true"));
    await expect(canvas.getByRole("radio", { name: "Yıl" })).toHaveFocus();
  },
};

export const Small: Story = {
  name: "Küçük",
  args: { size: "sm" },
};

export const DisabledOption: Story = {
  name: "Devre Dışı Seçenek",
  args: {
    "aria-label": "Plan dönemi",
    value: "aylik",
    options: [
      { value: "aylik", label: "Aylık" },
      { value: "yillik", label: "Yıllık" },
      { value: "omur", label: "Ömür Boyu", disabled: true },
    ],
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="md · dört seçenek">
        <Local options={RANGE} initial="hafta" label="Zaman aralığı (orta)" />
      </Cell>
      <Cell label="sm · üç seçenek">
        <Local options={RANGE.slice(0, 3)} initial="gun" label="Zaman aralığı (küçük)" size="sm" />
      </Cell>
      <Cell label="İki seçenek">
        <Local
          options={[
            { value: "liste", label: "Liste" },
            { value: "pano", label: "Pano" },
          ]}
          initial="pano"
          label="Görünüm"
        />
      </Cell>
      <Cell label="Devre dışı seçenekli">
        <Local
          options={[
            { value: "aylik", label: "Aylık" },
            { value: "yillik", label: "Yıllık" },
            { value: "omur", label: "Ömür Boyu", disabled: true },
          ]}
          initial="yillik"
          label="Plan dönemi"
        />
      </Cell>
    </Gallery>
  ),
};
