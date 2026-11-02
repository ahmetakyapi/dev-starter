import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AgentPlan } from "@/components/ui/agent-plan";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { PLAN, PLAN_LABELS } from "./_shared";

const meta = {
  title: "Bloklar/Asistan Planı",
  id: "blocks-agent-plan",
  component: AgentPlan,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Yapay zekâ ajanının çok adımlı işinin kuşbakışı: tamamlananlar üstü çizili, etkin adım beyaz karoda dönen halkayla, bekleyenler kesik çizgili. Durum tek sayıdan (`activeIndex`) türer; bileşen durum tutmaz, sunucuda da çizilir. Tek tek araç çağrıları ve onaylar için `agent-feed` / `agent-approval`.",
      },
    },
  },
  args: {
    steps: PLAN,
    activeIndex: 3,
    stepLabels: PLAN_LABELS,
    defaultOpen: true,
  },
  argTypes: {
    steps: { control: false },
    stepLabels: { control: false },
    activeIndex: { control: { type: "range", min: 0, max: PLAN.length, step: 1 } },
  },
  render: (args) => (
    <Frame width="md">
      <AgentPlan {...args} className="bg-page ring-1 ring-line" />
    </Frame>
  ),
} satisfies Meta<typeof AgentPlan>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Midway: Story = { name: "Ortada" };

export const GettingStarted: Story = { name: "Başlangıç", args: { activeIndex: 0 } };

export const Done: Story = {
  name: "Bitti",
  args: { activeIndex: PLAN.length },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Plan tamamlandı")).toBeVisible();
  },
};

export const Collapsed: Story = {
  name: "Daraltılmış",
  args: { defaultOpen: false },
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector("details");
    await expect(details).not.toHaveAttribute("open");
    const summary = canvasElement.querySelector("summary");
    if (!summary) throw new Error("summary yok");
    // Aç ve yeniden kapat: hikâye daraltılmış haliyle kalsın.
    await userEvent.click(summary);
    await waitFor(() => expect(details).toHaveAttribute("open"));
    await userEvent.click(summary);
    await waitFor(() => expect(details).not.toHaveAttribute("open"));
  },
};

function LivePlan() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setIndex((value) => (value > PLAN.length ? 0 : value + 1)), index > PLAN.length - 1 ? 3600 : 1400);
    return () => window.clearTimeout(id);
  }, [index]);
  return (
    <Frame width="md">
      <AgentPlan steps={PLAN} activeIndex={Math.min(index, PLAN.length)} stepLabels={PLAN_LABELS} className="bg-page ring-1 ring-line" />
    </Frame>
  );
}

export const Live: Story = {
  name: "Canlı",
  parameters: { docs: { description: { story: "Ajan akışı gibi kendiliğinden ilerler; bitince baştan başlar. Adım değişimi gizli canlı bölgede duyurulur." } } },
  render: () => <LivePlan />,
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: (args) => (
    <Gallery cols={2}>
      <Cell label="Başlangıç · 0 / 7" className="block">
        <AgentPlan {...args} activeIndex={0} className="bg-page ring-1 ring-line" />
      </Cell>
      <Cell label="Ortada · 3 / 7" className="block">
        <AgentPlan {...args} activeIndex={3} className="bg-page ring-1 ring-line" />
      </Cell>
      <Cell label="Bitti · 7 / 7" className="block">
        <AgentPlan {...args} activeIndex={PLAN.length} className="bg-page ring-1 ring-line" />
      </Cell>
      <Cell label="Daraltılmış · özel başlık" className="block">
        <AgentPlan {...args} defaultOpen={false} title="Rapor hazırlanıyor" className="bg-page ring-1 ring-line" />
      </Cell>
    </Gallery>
  ),
};
