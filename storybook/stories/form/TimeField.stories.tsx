import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TimeField } from "@/components/ui/time-field";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

const meta = {
  title: "Bileşenler/Form Girişleri/Saat Alanı",
  id: "components-forms-time-field",
  component: TimeField,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "24 saatlik SS:DD girişi (randevu saati, mesai başlangıcı); ÖÖ/ÖS yok. Saat sabit bir listeden seçilecekse Select daha az tuş ister. İki segment ayrı birer `spinbutton`: ↑/↓ artırır, rakam yazmak doğrudan doldurur ve sonraki segmente geçer.",
      },
    },
  },
  args: {
    label: "Randevu Saati",
    defaultValue: "14:30",
    minuteStep: 5,
    hint: "Randevular 5 dakikalık aralıklarla.",
    disabled: false,
    onValueChange: fn(),
  },
  render: (args) => (
    <Frame width="sm">
      <TimeField {...args} />
    </Frame>
  ),
} satisfies Meta<typeof TimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const minute = canvas.getByRole("spinbutton", { name: "Dakika" });
    minute.focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(minute).toHaveAttribute("aria-valuetext", "35");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("14:35");
    // Odak çıkar: dinlenen hâl görünsün. Odaktaki segmentin kontrastı snippet
    // tarafında ayrıca raporlandı (primary-ink / primary-wash, 4,27:1).
    minute.blur();
  },
};

export const FiveMinuteStep: Story = {
  name: "Adım 5 Dakika",
  args: { defaultValue: "09:00" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hour = canvas.getByRole("spinbutton", { name: "Saat" });
    hour.focus();
    await userEvent.keyboard("1");
    await userEvent.keyboard("6");
    const minute = canvas.getByRole("spinbutton", { name: "Dakika" });
    await expect(minute).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(minute).toHaveAttribute("aria-valuetext", "55");
    minute.blur();
  },
};

export const Empty: Story = {
  name: "Boş",
  args: { label: "Mesai Bitişi", defaultValue: null, minuteStep: 1, hint: "24 saat düzeninde." },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: { label: "Kapanış Saati", defaultValue: "07:15", hint: undefined, error: "Kapanış, açılıştan (09:00) önce olamaz." },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { defaultValue: "18:00", disabled: true, hint: "Bu gün için saat sabit." },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Dolu">
        <TimeField label="Randevu Saati" defaultValue="14:30" minuteStep={5} className="w-full max-w-60" />
      </Cell>
      <Cell label="Boş">
        <TimeField label="Mesai Bitişi" className="w-full max-w-60" />
      </Cell>
      <Cell label="Gece yarısı">
        <TimeField label="Teslim Saati" defaultValue="00:00" className="w-full max-w-60" />
      </Cell>
      <Cell label="Yardım metni">
        <TimeField label="Açılış Saati" defaultValue="09:00" minuteStep={15} hint="15 dakikalık adım." className="w-full max-w-60" />
      </Cell>
      <Cell label="Hata">
        <TimeField label="Kapanış Saati" defaultValue="07:15" error="Kapanış, açılıştan önce olamaz." className="w-full max-w-60" />
      </Cell>
      <Cell label="Devre dışı">
        <TimeField label="Randevu Saati" defaultValue="18:00" disabled className="w-full max-w-60" />
      </Cell>
    </Gallery>
  ),
};
