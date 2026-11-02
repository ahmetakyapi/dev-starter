import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";
import { NOV, dayLabel, isSunday } from "./_data";

const range = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });

/** Takvim kendi kartında durur: gri kuyu içinde beyaz karo. */
function Card({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-[22rem] rounded-lg bg-overlay p-3 shadow-raised">{children}</div>;
}

function RangeDemo() {
  const [value, setValue] = useState<DateRange | null>({ start: NOV(12), end: NOV(18) });
  return (
    <div className="grid justify-items-center gap-3">
      <Card>
        <DateCalendar mode="range" label="Konaklama" value={value} onValueChange={setValue} defaultMonth={NOV(1)} isDateDisabled={isSunday} />
      </Card>
      <p className="text-small text-muted" aria-live="polite">
        {value ? (value.end ? range.formatRange(value.start, value.end) : `${range.format(value.start)}, çıkış günü seçin`) : "Giriş günü seçin"}
      </p>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Form Girişleri/Takvim",
  component: DateCalendar,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Satır içi ay takvimi: tek gün ya da tarih aralığı (rezervasyon paneli, filtre kenar çubuğu). Açılır kutu gerekiyorsa Tarih Seçici kullanın; doğum tarihi gibi yıllar öncesi değerler için takvim yanlış araçtır. Hafta pazartesi başlar; ←/→ gün, ↑/↓ hafta, PageUp/PageDown ay gezer.",
      },
    },
  },
  args: {
    label: "Randevu Günü",
    defaultMonth: NOV(1),
    defaultValue: NOV(5),
  },
  argTypes: {
    defaultMonth: { control: "date" },
    defaultValue: { control: "date" },
  },
  render: (args) => (
    <Frame width="sm">
      <Card>
        <DateCalendar {...args} />
      </Card>
    </Frame>
  ),
} satisfies Meta<typeof DateCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: dayLabel.format(NOV(5)) }));
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: dayLabel.format(NOV(6)) })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("button", { name: dayLabel.format(NOV(13)) })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("button", { name: dayLabel.format(NOV(13)) }).closest("td")).toHaveAttribute("aria-selected", "true");
  },
};

export const TekGun: Story = {
  name: "Tek Gün",
  args: { label: "Teslim Günü", defaultValue: NOV(21) },
};

export const Aralik: Story = {
  name: "Aralık",
  render: () => (
    <Frame width="sm">
      <RangeDemo />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: dayLabel.format(NOV(3)) }));
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{Enter}");
    await expect(canvas.getByText(range.formatRange(NOV(3), NOV(6)))).toBeInTheDocument();
  },
};

export const DevreDisiGunler: Story = {
  name: "Devre Dışı Günler",
  render: () => (
    <Frame width="sm">
      <Card>
        <DateCalendar label="Randevu Günü" defaultMonth={NOV(1)} min={NOV(4)} max={NOV(27)} isDateDisabled={isSunday} />
      </Card>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sunday = canvas.getByRole("button", { name: dayLabel.format(NOV(8)) });
    await expect(sunday).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(sunday);
    await expect(sunday.closest("td")).toHaveAttribute("aria-selected", "false");
  },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Tek gün">
        <Card>
          <DateCalendar label="Randevu Günü" defaultValue={NOV(5)} defaultMonth={NOV(1)} />
        </Card>
      </Cell>
      <Cell label="Aralık, haftayı aşan">
        <Card>
          <DateCalendar mode="range" label="Konaklama" defaultValue={{ start: NOV(12), end: NOV(18) }} defaultMonth={NOV(1)} />
        </Card>
      </Cell>
      <Cell label="Pazar kapalı, sınırlı">
        <Card>
          <DateCalendar label="Teslim Günü" defaultMonth={NOV(1)} min={NOV(4)} max={NOV(27)} isDateDisabled={isSunday} />
        </Card>
      </Cell>
    </Gallery>
  ),
};
