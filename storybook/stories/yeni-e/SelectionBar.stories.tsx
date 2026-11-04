import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Archive, CheckCheck, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Frame } from "../_lib/Frame";

const ROWS = ["PSL-1186 · Siparişimiz hâlâ teslim edilmedi", "PSL-1185 · Kasım faturasında KDV", "PSL-1184 · Toplu yenileme teklifi", "PSL-1183 · Ödeme adımı hata veriyor"];

function Demo({ initial = [] as number[] }) {
  const [picked, setPicked] = useState<number[]>(initial);
  const [log, setLog] = useState("");
  const done = (what: string) => {
    setLog(`${picked.length} talep: ${what}`);
    setPicked([]);
  };
  return (
    <Frame width="md">
      <div className="grid gap-1.5 rounded-xl bg-overlay p-2 shadow-raised">
        {ROWS.map((r, i) => (
          <Checkbox key={r} label={r} checked={picked.includes(i)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, i] : p.filter((x) => x !== i)))} />
        ))}
      </div>
      <p className="mt-3 text-small text-muted">{log || "Satır seç; çubuk alttan yükselir."}</p>
      <SelectionBar count={picked.length} noun="talep" onClear={() => setPicked([])}>
        <SelectionAction icon={<UserRoundCheck />} onClick={() => done("sana atandı")}>
          Bana Ata
        </SelectionAction>
        <SelectionAction icon={<CheckCheck />} onClick={() => done("çözüldü")}>
          Çözüldü
        </SelectionAction>
        <SelectionAction tone="danger" icon={<Archive />} onClick={() => done("arşivlendi")}>
          Arşivle
        </SelectionAction>
      </SelectionBar>
    </Frame>
  );
}

const meta = {
  title: "Bileşenler/Veri/Seçim Çubuğu",
  id: "selection-bar",
  component: SelectionBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Birden çok satır seçilince ekranın altından yükselen toplu işlem adası. Ters zemin (iki temada da sayfanın üstünde ayrı katman), yıkıcı eylem dolgulu hap. WAI-ARIA toolbar: Tab bir kez girer, ← → gezinir, Escape seçimi bırakır; sayı canlı bölgede okunur. İşlemler satırın kendi menüsünde de durur.",
      },
    },
  },
  args: { count: 2, noun: "talep", onClear: () => undefined, children: null },
  render: () => <Demo />,
} satisfies Meta<typeof SelectionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByRole("toolbar")).toBeNull();
    await userEvent.click(canvas.getByLabelText(/PSL-1186/));
    await userEvent.click(canvas.getByLabelText(/PSL-1184/));
    const bar = await page.findByRole("toolbar", { name: "Seçili talep işlemleri" });
    await expect(bar).toHaveTextContent("2talep seçildi");
    // ← → gezinme
    within(bar).getByRole("button", { name: /Bana Ata/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(bar).getByRole("button", { name: /Çözüldü/ })).toHaveFocus();
    await userEvent.click(within(bar).getByRole("button", { name: /Arşivle/ }));
    await expect(canvas.getByText("2 talep: arşivlendi")).toBeVisible();
    await waitFor(() => expect(page.queryByRole("toolbar")).toBeNull());
  },
};

export const EscapeClears: Story = {
  name: "Escape Seçimi Bırakır",
  render: () => <Demo initial={[0, 1, 2]} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const bar = await page.findByRole("toolbar");
    within(bar).getByRole("button", { name: /Bana Ata/ }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("toolbar")).toBeNull());
  },
};
