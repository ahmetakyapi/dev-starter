import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkline } from "@/components/ui/sparkline";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const RISING = [42, 48, 45, 52, 58, 55, 61, 66, 63, 70, 74, 79];
const FALLING = [88, 84, 86, 79, 75, 77, 70, 66, 68, 61, 58, 54];
const FLAT = [50, 52, 49, 51, 50, 53, 51, 50, 52, 51, 50, 51];

const meta = {
  title: "Bileşenler/Veri/Mini Eğri",
  component: Sparkline,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Eksensiz, ızgarasız bir eğilim işareti; okunacak sayı yanındaki `Stat`. `tone=\"auto\"` ilk ve son noktayı karşılaştırır, yalnızca \"yükselmek iyi\" olan serilerde kullan; faiz, gecikme gibi serilerde `primary` (varsayılan).",
      },
    },
  },
  args: { values: RISING, title: "Son 12 Hafta Ciro", width: 120, height: 32, tone: "primary", area: true },
  argTypes: { tone: { control: "inline-radio", options: ["primary", "auto", "muted"] } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <div className="grid place-items-center">
          <Story />
        </div>
      </Frame>
    ),
  ],
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = { name: "Varsayılan" };

export const OtomatikYukselen: Story = { name: "Otomatik, Yükselen", args: { tone: "auto" } };

export const OtomatikDusen: Story = { name: "Otomatik, Düşen", args: { tone: "auto", values: FALLING, title: "Son 12 Hafta Hisse Fiyatı" } };

export const Soluk: Story = { name: "Soluk", args: { tone: "muted", values: FLAT, title: "Son 12 Hafta Ziyaret" } };

export const Dolgusuz: Story = { name: "Dolgusuz", args: { area: false } };

export const Genis: Story = { name: "Geniş", args: { width: 280, height: 56 } };

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="primary (varsayılan)">
        <Sparkline title="Ciro" values={RISING} />
      </Cell>
      <Cell label="auto, yükselen: success">
        <Sparkline title="Hisse Fiyatı, Yükselen" values={RISING} tone="auto" />
      </Cell>
      <Cell label="auto, düşen: danger">
        <Sparkline title="Hisse Fiyatı, Düşen" values={FALLING} tone="auto" />
      </Cell>
      <Cell label="muted">
        <Sparkline title="Ziyaret" values={FLAT} tone="muted" />
      </Cell>
      <Cell label="Dolgusuz">
        <Sparkline title="Ciro, Dolgusuz" values={RISING} area={false} />
      </Cell>
      <Cell label="Geniş kutu, sabit çizgi">
        <Sparkline title="Ciro, Geniş" values={FALLING} width={240} height={56} />
      </Cell>
    </Gallery>
  ),
};
