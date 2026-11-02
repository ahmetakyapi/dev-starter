import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

function UploadDemo() {
  const [value, setValue] = useState(46);
  const left = Math.round(((100 - value) / 100) * 40);
  return (
    <div className="grid gap-5">
      <Progress
        label="Q3 raporu.pdf Yükleniyor"
        value={value}
        hint={value >= 100 ? "Dosya klasöre eklendi" : `Yaklaşık ${left} saniye kaldı`}
      />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setValue((v) => Math.max(0, v - 18))}>
          Geri Al
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setValue((v) => Math.min(100, v + 18))}>
          İlerlet
        </Button>
      </div>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Geri Bildirim/İlerleme",
  id: "progress",
  component: Progress,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bir işin ne kadarının bittiğini gösterir (yükleme, dışa aktarma, kurulum). Bir kapasitenin doluluğu ilerleme değil ölçüdür: Ölçer kullanın. Süre bilinmiyorsa `value={null}` ile belirsiz gösterin, yüzde uydurmayın; bitince dolgu yeşile döner ve \"Tamamlandı\" yazar.",
      },
    },
  },
  args: {
    label: "Q3 raporu.pdf Yükleniyor",
    value: 46,
    max: 100,
    hint: "Yaklaşık 20 saniye kaldı",
    size: "md",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  render: (args) => (
    <Frame width="md">
      <Progress {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
};

export const Determinate: Story = {
  name: "Belirli",
  render: () => (
    <Frame width="md">
      <UploadDemo />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar");
    await userEvent.click(canvas.getByRole("button", { name: "İlerlet" }));
    await expect(bar).toHaveAttribute("aria-valuenow", "64");
  },
};

export const Indeterminate: Story = {
  name: "Belirsiz",
  args: { label: "Müşteri Listesi Hazırlanıyor", value: null, hint: "Satır sayısı bilinmiyor" },
};

export const Completed: Story = {
  name: "Tamamlandı",
  args: { label: "Ekim Yedeği", value: 100, hint: "2,4 GB, 14.32'de bitti" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Tamamlandı")).toBeInTheDocument();
  },
};

export const CustomValueText: Story = {
  name: "Özel Değer Metni",
  args: { label: "Fotoğraflar Aktarılıyor", value: 12, max: 40, valueText: "12 / 40 dosya", hint: undefined },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Başlangıç">
        <Progress label="Arşiv Sıkıştırılıyor" value={4} className="w-full" />
      </Cell>
      <Cell label="Belirli">
        <Progress label="Q3 raporu.pdf Yükleniyor" value={46} hint="Yaklaşık 20 saniye kaldı" className="w-full" />
      </Cell>
      <Cell label="Belirsiz">
        <Progress label="Müşteri Listesi Hazırlanıyor" value={null} hint="Satır sayısı bilinmiyor" className="w-full" />
      </Cell>
      <Cell label="Özel Değer Metni">
        <Progress label="Fotoğraflar Aktarılıyor" value={12} max={40} valueText="12 / 40 dosya" className="w-full" />
      </Cell>
      <Cell label="Küçük Boy, Metinsiz">
        <Progress label="Kurulum" value={72} size="sm" valueText={false} className="w-full" />
      </Cell>
      <Cell label="Tamamlandı">
        <Progress label="Ekim Yedeği" value={100} className="w-full" />
      </Cell>
    </Gallery>
  ),
};
