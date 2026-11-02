import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stepper, type Step } from "@/components/ui/stepper";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const STEPS: Step[] = [
  { label: "Sepet", description: "3 ürün" },
  { label: "Teslimat", description: "Adres ve kargo" },
  { label: "Ödeme", description: "Kart ya da havale" },
  { label: "Onay" },
];

const meta = {
  title: "Bileşenler/Gezinme/Adım Göstergesi",
  component: Stepper,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Çok adımlı bir akışta neredeyiz (\"Bilgiler › Ödeme › Onay\"); adımlar arası geçişi akışın kendisi yönetir. Sıralı liste, bulunulan adım `aria-current=\"step\"`, tamamlanan adım görünmez \"Tamamlandı\" metniyle de söylenir.",
      },
    },
  },
  args: { steps: STEPS, current: 1, "aria-label": "Ödeme Adımları", doneLabel: "Tamamlandı" },
  argTypes: { current: { control: { type: "range", min: 0, max: 4, step: 1 } } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="lg">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const IlkAdim: Story = { name: "İlk Adım", args: { current: 0 } };

export const SonAdim: Story = { name: "Son Adım", args: { current: 3 } };

export const Tamamlandi: Story = { name: "Hepsi Tamamlandı", args: { current: 4 } };

export const AciklamasizUc: Story = {
  name: "Açıklamasız, Üç Adım",
  args: { steps: [{ label: "Bilgiler" }, { label: "Ödeme" }, { label: "Onay" }], current: 1 },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      {[0, 1, 3, 4].map((current) => (
        <Cell key={current} label={current === 4 ? "Hepsi tamamlandı" : `Bulunulan adım: ${STEPS[current].label}`} className="place-items-stretch">
          <Stepper aria-label={`Adımlar ${current}`} steps={STEPS} current={current} />
        </Cell>
      ))}
    </Gallery>
  ),
};
