import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Archive, Inbox, MailPlus, Search, Tag, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ToolPolicyList, defaultToolPolicies, type PolicyGroup, type ToolPolicy } from "@/components/ui/tool-policy-list";

const GROUPS: PolicyGroup[] = [
  {
    id: "read",
    label: "Okuyan Araçlar",
    kind: "read",
    tools: [
      { id: "search", name: "Talep Ara", description: "Bütün taleplerde başlık ve içerik araması.", icon: <Search /> },
      { id: "inbox", name: "Gelen Kutusunu Oku", description: "Atanmış ve atanmamış talepleri listeler.", icon: <Inbox /> },
      { id: "customers", name: "Müşteri Bilgisi", description: "Müşterinin geçmiş talepleri ve planı.", icon: <Users /> },
    ],
  },
  {
    id: "write",
    label: "Yazan ve Silen Araçlar",
    kind: "write",
    tools: [
      { id: "reply", name: "Yanıt Gönder", description: "Müşteriye e-posta yanıtı gönderir.", icon: <MailPlus /> },
      { id: "tag", name: "Etiket Ata", description: "Talebe etiket ekler ya da kaldırır.", icon: <Tag /> },
      { id: "archive", name: "Arşivle", description: "Çözülen talebi arşive taşır.", icon: <Archive /> },
      { id: "delete", name: "Talebi Sil", description: "Talebi ve eklerini kalıcı olarak siler.", icon: <Trash2 /> },
    ],
  },
];

function Demo() {
  const [value, setValue] = useState<Record<string, ToolPolicy>>(() => defaultToolPolicies(GROUPS));
  return (
    <div className="w-[min(100vw-2rem,30rem)]">
      <ToolPolicyList groups={GROUPS} value={value} onValueChange={setValue} />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Yapay Zeka/Araç Politikası",
  id: "tool-policy-list",
  component: ToolPolicyList,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Ajanın her aracı için kalıcı izin düzeyi: İzin Ver, Sor (her çağrıda insan onayı), Otomatik (onaysız). Okuyan ve yazan/silen araçlar ayrı gruplarda; grup başlığı hepsini birden ayarlar. Güvenli başlangıç `defaultToolPolicies`: okuyan İzin Ver, yazan Sor. Yazan araçta Otomatik seçilince uyarı satırı çıkar. Politika sunucuda saklanır ve orada uygulanır (`rules/agentic-ui.md` § 2). Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { groups: GROUPS, value: defaultToolPolicies(GROUPS), onValueChange: () => {} },
  render: () => <Demo />,
} satisfies Meta<typeof ToolPolicyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Talep Ara izni" })).toHaveValue("allow");
    await expect(canvas.getByRole("combobox", { name: "Talebi Sil izni" })).toHaveValue("ask");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Talebi Sil izni" }), "auto");
    await expect(canvas.getByText("Bu araç onay beklemeden çalışır.")).toBeInTheDocument();
    // Grup karışık oldu; toplu ayar hepsini geri alır.
    await expect(canvas.getByRole("combobox", { name: "Yazan ve Silen Araçlar: hepsi" })).toHaveValue("mixed");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Yazan ve Silen Araçlar: hepsi" }), "ask");
    await expect(canvas.queryByText("Bu araç onay beklemeden çalışır.")).not.toBeInTheDocument();
  },
};
