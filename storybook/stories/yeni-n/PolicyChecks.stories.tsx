import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { Frame } from "../_lib/Frame";

const CHECKS = [
  { id: "butce", label: "Pazarlama bütçesi içinde", detail: "3.860 ₺ kalıyor", state: "pass" as const },
  { id: "satici", label: "Onaylı satıcı", detail: "2024'ten beri", state: "pass" as const },
  { id: "kopya", label: "Mevcut bir aracı kopyalıyor", detail: "1 koltuk kayıtlı", state: "warn" as const },
];

const meta = {
  title: "Bileşenler/Geri Bildirim/Politika Kontrolleri",
  id: "policy-checks",
  component: PolicyChecks,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bir talebin onaydan ÖNCE geçtiği otomatik denetimler: her satır tek durum (geçti, uyarı, başarısız) ve sağda kısa gerekçe. Durum rengin yanında ikon şekliyle (onay, üçgen, çarpı) ve ekran okuyucuya \"Geçti:\", \"Uyarı:\", \"Başarısız:\" öneğiyle söylenir. Özet satırı kontrollerden türer (\"2 / 3 kontrol temiz · 1 uyarı\"). Spendix onay kuyruğundan (yalnız yapı). Örnek veri ÖRNEK'tir.",
      },
    },
  },
  args: { title: "Politika Kontrolleri", checks: CHECKS },
  render: (args) => (
    <Frame width="sm">
      <PolicyChecks {...args} />
    </Frame>
  ),
} satisfies Meta<typeof PolicyChecks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Bir Uyarı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("2 / 3 kontrol temiz · 1 uyarı")).toBeInTheDocument();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByText("Uyarı:")).toBeInTheDocument();
  },
};

export const Failed: Story = {
  name: "Başarısız Kontrol",
  args: {
    checks: [
      { id: "a", label: "Bütçe içinde", detail: "420 ₺ aşıyor", state: "fail" },
      { id: "b", label: "Onaylı satıcı", state: "pass" },
    ],
    summary: "Onay için amir kararı gerekir",
  },
};

export const AllClear: Story = {
  name: "Hepsi Temiz",
  args: {
    title: undefined,
    checks: [
      { id: "a", label: "Bütçe içinde", state: "pass" },
      { id: "b", label: "Onaylı satıcı", state: "pass" },
    ],
  },
};
