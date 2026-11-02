import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DatePicker } from "@/components/ui/date-picker";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";
import { NOV, dayLabel, isSunday } from "./_data";


const meta = {
  title: "Bileşenler/Form Girişleri/Tarih Seçici",
  id: "components-forms-date-picker",
  component: DatePicker,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Formda tek satır yer kaplayan, tıklayınca açılır kutuda takvim gösteren seçici (randevu günü, rapor aralığı). Takvim sayfada sürekli görünecekse doğrudan Takvim kullanın. Açılınca odak seçili güne gider; tek günde seçim kutuyu kapatır, aralıkta bitiş günü seçilince kapanır.",
      },
    },
  },
  args: {
    label: "Teslim Tarihi",
    defaultValue: NOV(21),
    defaultMonth: NOV(1),
    name: "teslim",
    disabled: false,
  },
  argTypes: {
    defaultValue: { control: "date" },
    defaultMonth: { control: "date" },
  },
  render: (args) => (
    <Frame width="sm">
      <DatePicker {...args} />
    </Frame>
  ),
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: /Teslim Tarihi/ });
    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole("button", { name: dayLabel.format(NOV(21)) })).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("23 Kas 2026"));
  },
};

export const SingleDayOpen: Story = {
  name: "Tek Gün, Açık",
  parameters: { layout: "padded" },
  render: (args) => (
    <Frame width="sm" className="min-h-[34rem]">
      <DatePicker {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Teslim Tarihi/ }));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("grid")).toBeVisible());
  },
};

export const Range: Story = {
  name: "Aralık",
  render: () => (
    <Frame width="sm" className="min-h-[34rem]">
      <DatePicker
        mode="range"
        label="Konaklama"
        placeholder="Giriş – Çıkış"
        defaultValue={{ start: NOV(12), end: NOV(18) }}
        defaultMonth={NOV(1)}
        isDateDisabled={isSunday}
        hint="Pazar günleri giriş ve çıkış yapılmaz."
        name="konaklama"
      />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Konaklama/ }));
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole("grid")).toBeVisible());
  },
};

export const Empty: Story = {
  name: "Boş",
  args: { label: "Rapor Başlangıcı", defaultValue: null, placeholder: "Tarih Seçin" },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: { label: "Teslim Tarihi", defaultValue: null, error: "Teslim tarihi seçmelisin." },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true, hint: "Sipariş yola çıktı." },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş">
        <DatePicker label="Rapor Başlangıcı" defaultMonth={NOV(1)} className="w-full" />
      </Cell>
      <Cell label="Tek gün">
        <DatePicker label="Teslim Tarihi" defaultValue={NOV(21)} defaultMonth={NOV(1)} className="w-full" />
      </Cell>
      <Cell label="Aralık">
        <DatePicker
          mode="range"
          label="Rapor Dönemi"
          defaultValue={{ start: NOV(3), end: NOV(16) }}
          defaultMonth={NOV(1)}
          className="w-full"
        />
      </Cell>
      <Cell label="Aralık, yarım">
        <DatePicker mode="range" label="Konaklama" defaultValue={{ start: NOV(12), end: null }} defaultMonth={NOV(1)} className="w-full" />
      </Cell>
      <Cell label="Hata">
        <DatePicker label="Teslim Tarihi" error="Teslim tarihi seçmelisin." className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <DatePicker label="Teslim Tarihi" defaultValue={NOV(21)} disabled className="w-full" />
      </Cell>
    </Gallery>
  ),
};
