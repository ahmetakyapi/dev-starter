import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, MapPin } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChipGroup, FilterChip, RemovableChip } from "@/components/ui/chip";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Seçim/Süzgeç Etiketi",
  id: "components-selection-chip",
  component: FilterChip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "`FilterChip` bir süzgeç: aç/kapa düğmesi (`aria-pressed`), seçiliyken zemin, metin ve ✓ birlikte değişir, genişlik zıplamaz. `RemovableChip` seçilmiş bir değer; yalnızca × bir düğmedir. `ChipGroup` grubu adlandırır. Tek seçimli süzgeç gerekiyorsa çip değil bölümlü denetim.",
      },
    },
  },
  args: { selected: false, children: "Bu Hafta", count: 24, disabled: false },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <div className="flex justify-center">
          <Story />
        </div>
      </Frame>
    ),
  ],
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

function Toggle(props: Omit<ComponentProps<typeof FilterChip>, "onClick">) {
  const [on, setOn] = useState(props.selected);
  return <FilterChip {...props} selected={on} onClick={() => setOn((v) => !v)} />;
}

export const Default: Story = {
  name: "Varsayılan",
  render: (args) => <Toggle key={String(args.selected)} {...args} />,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("button", { name: /Bu Hafta/ });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  },
};

export const Selected: Story = { name: "Seçili", args: { selected: true } };

export const WithIcon: Story = { name: "İkonlu", args: { icon: <CalendarDays />, count: undefined } };

export const Disabled: Story = { name: "Devre Dışı", args: { disabled: true } };

const STATUS = [
  ["Bekleyen", 24],
  ["Gecikmiş", 7],
  ["Kargoda", 12],
  ["Tamamlanan", 138],
] as const;

function FilterDemo() {
  const [on, setOn] = useState<Record<string, boolean>>({ Bekleyen: true, Gecikmiş: false, Kargoda: true, Tamamlanan: false });
  return (
    <ChipGroup aria-label="Durum Süzgeci">
      {STATUS.map(([name, n]) => (
        <FilterChip key={name} selected={on[name]} count={n} onClick={() => setOn((f) => ({ ...f, [name]: !f[name] }))}>
          {name}
        </FilterChip>
      ))}
    </ChipGroup>
  );
}

const CITIES = ["İstanbul", "İzmir", "Ankara", "Eskişehir"];

function RemovableDemo() {
  const [cities, setCities] = useState(CITIES);
  return (
    <ChipGroup aria-label="Seçili Şehirler">
      {cities.map((city) => (
        <RemovableChip key={city} label={city} leading={<MapPin className="size-3.5" />} onRemove={() => setCities((c) => c.filter((x) => x !== city))}>
          {city}
        </RemovableChip>
      ))}
      {cities.length === 0 ? <span className="text-small text-muted">Bütün şehirler kaldırıldı.</span> : null}
    </ChipGroup>
  );
}

export const FilterGroup: Story = { name: "Süzgeç Grubu", render: () => <FilterDemo /> };

export const RemovableChips: Story = {
  name: "Kaldırılabilir Çipler",
  render: () => <RemovableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getAllByRole("button")[0];
    await userEvent.click(remove);
    await expect(canvas.queryByText("İstanbul")).toBeNull();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="FilterChip: boş, seçili, sayılı, ikonlu">
        <ChipGroup aria-label="Süzgeç Örnekleri" className="justify-center">
          <FilterChip selected={false}>Bugün</FilterChip>
          <FilterChip selected>Bu Hafta</FilterChip>
          <FilterChip selected={false} count={1240}>
            Tümü
          </FilterChip>
          <FilterChip selected icon={<CalendarDays />}>
            Ekim
          </FilterChip>
          <FilterChip selected={false} disabled>
            Arşiv
          </FilterChip>
        </ChipGroup>
      </Cell>
      <Cell label="RemovableChip">
        <ChipGroup aria-label="Kaldırılabilir Örnekler" className="justify-center">
          <RemovableChip label="İstanbul">İstanbul</RemovableChip>
          <RemovableChip label="Ankara" leading={<MapPin className="size-3.5" />}>
            Ankara
          </RemovableChip>
          <RemovableChip label="Bursa" disabled>
            Bursa
          </RemovableChip>
        </ChipGroup>
      </Cell>
      <Cell label="ChipGroup: süzgeç satırı">
        <FilterDemo />
      </Cell>
    </Gallery>
  ),
};
