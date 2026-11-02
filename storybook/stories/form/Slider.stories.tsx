import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Slider } from "@/components/ui/slider";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { DISABLED_CONTRAST_EXEMPT, settle } from "./_a11y";
import { TRY } from "./_data";

const meta = {
  title: "Bileşenler/Form Girişleri/Kaydırıcı",
  id: "slider",
  component: Slider,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bir aralıkta yaklaşık değer seçmek için (ses, yarıçap, fiyat aralığı). Kesin sayı yazılacaksa Sayı Alanı kullanın. `defaultValue` dizi olursa iki tutamaklı aralığa döner; sürüklerken yalnızca tutulan tutamağın üstünde değer balonu belirir.",
      },
    },
  },
  args: {
    label: "Bildirim Sesi",
    defaultValue: 64,
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    disabled: false,
    onValueChange: fn(),
    onValueCommitted: fn(),
  },
  argTypes: {
    defaultValue: { control: { type: "number" } },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
  },
  render: (args) => (
    <Frame width="sm">
      <Slider {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole("slider");
    thumb.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "66");
    await expect(args.onValueChange).toHaveBeenCalled();
  },
};

export const Range: Story = {
  name: "Aralık",
  args: {
    label: "Gecelik Fiyat",
    defaultValue: [1500, 4500],
    min: 0,
    max: 8000,
    step: 250,
    minStepsBetweenValues: 2,
    format: TRY,
    thumbLabels: ["En Düşük Fiyat", "En Yüksek Fiyat"],
    hint: "Vergiler dahil, kişi başı değil oda başı.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [low, high] = canvas.getAllByRole("slider");
    high.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(high).toHaveAttribute("aria-valuenow", "4250");
    await expect(low).toHaveAttribute("aria-valuenow", "1500");
  },
};

export const Checked: Story = {
  name: "İşaretli",
  args: {
    label: "Teslimat Yarıçapı",
    defaultValue: 6,
    min: 0,
    max: 20,
    step: 2,
    marks: [0, 4, 8, 12, 16, 20],
    showMarkLabels: true,
    format: { style: "unit", unit: "kilometer" },
    hint: "Kurye bu mesafenin dışına çıkmaz.",
  },
};

export const Invalid: Story = {
  name: "Hatalı",
  args: {
    label: "İndirim Oranı",
    defaultValue: 0.45,
    min: 0,
    max: 0.6,
    step: 0.05,
    format: { style: "percent" },
    error: "Kampanya indirimi %40'ı geçemez.",
  },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { label: "Ekran Parlaklığı", defaultValue: 72, disabled: true, hint: "Otomatik parlaklık açık." },
  parameters: DISABLED_CONTRAST_EXEMPT,
  render: (args) => (
    <Frame width="sm">
      <div data-a11y-disabled>
        <Slider {...args} />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded", ...DISABLED_CONTRAST_EXEMPT },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Tek Değer, Yüzde">
        <Slider label="Bildirim Sesi" defaultValue={0.64} min={0} max={1} step={0.01} format={{ style: "percent" }} className="w-full" />
      </Cell>
      <Cell label="Aralık, Para Birimi">
        <Slider
          label="Gecelik Fiyat"
          defaultValue={[1500, 4500]}
          min={0}
          max={8000}
          step={250}
          minStepsBetweenValues={2}
          format={TRY}
          thumbLabels={["En Düşük Fiyat", "En Yüksek Fiyat"]}
          className="w-full"
        />
      </Cell>
      <Cell label="İşaretli Aralık">
        <Slider
          label="Bütçe"
          defaultValue={[2000, 6000]}
          min={0}
          max={8000}
          step={500}
          marks={[0, 2000, 4000, 6000, 8000]}
          showMarkLabels
          format={TRY}
          thumbLabels={["En Düşük Bütçe", "En Yüksek Bütçe"]}
          className="w-full"
        />
      </Cell>
      <Cell label="Değer Gizli">
        <Slider label="Bulanıklık" defaultValue={30} showValue={false} hint="Arka planı yumuşatır." className="w-full" />
      </Cell>
      <Cell label="Hata">
        <Slider
          label="İndirim Oranı"
          defaultValue={0.45}
          min={0}
          max={0.6}
          step={0.05}
          format={{ style: "percent" }}
          error="Kampanya indirimi %40'ı geçemez."
          className="w-full"
        />
      </Cell>
      <Cell label="Devre Dışı">
        <div data-a11y-disabled className="w-full">
          <Slider label="Ekran Parlaklığı" defaultValue={72} disabled />
        </div>
      </Cell>
    </Gallery>
  ),
};
