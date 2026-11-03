import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CodeBlock, installTabs } from "@/components/ui/code-block";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Pano iframe'de çoğu zaman izinsiz: kopyalanan metin taklitle yakalanır. */
function mockClipboard(sink: string[]) {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: (text: string) => (sink.push(text), Promise.resolve()) },
  });
  return () => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else Reflect.deleteProperty(navigator, "clipboard");
  };
}

const copied: string[] = [];

const CONFIG = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});`;

const meta = {
  title: "Bileşenler/Düğme ve İkon/Kod Bloğu",
  id: "code-block",
  component: CodeBlock,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Kurulum komutu, yapılandırma parçası ya da API örneği. Başlıkta dosya adı ya da sekmeler (npm / pnpm / yarn / bun), sağda kopyala. Sekme bir sekme listesidir: oklar seçimi taşır. `persist` verilirse seçim aynı anahtarlı bütün bloklarda ve sonraki ziyarette hatırlanır. Kaydırılabilir kod alanı klavyeyle odaklanır. Sözdizimi renklendirmesi bilerek yok: tek renk iki temada da AA.",
      },
    },
  },
  beforeEach: () => {
    copied.length = 0;
    try {
      window.localStorage.removeItem("code-block:hikaye-pm");
    } catch {
      // depo kapalı
    }
    return mockClipboard(copied);
  },
  args: { tabs: installTabs("motion"), persist: "hikaye-pm" },
  render: (args) => (
    <Frame width="lg">
      <CodeBlock {...args} />
    </Frame>
  ),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Paket Yöneticisi Sekmeleri",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pnpm = canvas.getByRole("tab", { name: "pnpm" });
    await userEvent.click(canvas.getByRole("tab", { name: "npm" }));
    await userEvent.keyboard("{ArrowRight}");
    await expect(pnpm).toHaveAttribute("aria-selected", "true");
    await expect(pnpm).toHaveFocus();
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("pnpm add motion");
    await userEvent.click(canvas.getByRole("button", { name: "pnpm Komutunu Kopyala" }));
    await waitFor(() => expect(copied.at(-1)).toBe("pnpm add motion"));
  },
};

export const SharedPreference: Story = {
  name: "Tercih Paylaşılır",
  render: (args) => (
    <Frame width="lg">
      <div className="grid gap-3">
        <CodeBlock {...args} tabs={installTabs("motion")} />
        <CodeBlock {...args} tabs={installTabs("vitest", { dev: true })} />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole("tab", { name: "bun" })[0]);
    await waitFor(() => expect(canvas.getAllByRole("tab", { name: "bun" })[1]).toHaveAttribute("aria-selected", "true"));
    await expect(canvas.getAllByRole("tabpanel")[1]).toHaveTextContent("bun add -d vitest");
  },
};

export const FileTitle: Story = {
  name: "Dosya Adıyla",
  args: { tabs: undefined, persist: undefined, title: "drizzle.config.ts", code: CONFIG },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByLabelText("drizzle.config.ts");
    await expect(region).toHaveAttribute("tabindex", "0");
    await userEvent.click(canvas.getByRole("button", { name: "Kodu Kopyala" }));
    await waitFor(() => expect(copied.at(-1)).toBe(CONFIG));
  },
};

export const ShellPrompt: Story = {
  name: "Kabuk İstemi",
  args: { tabs: undefined, persist: undefined, title: "Terminal", prompt: true, code: "git clone https://github.com/ahmetakyapi/dev-starter\ncd dev-starter\nnpm run storybook" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Kodu Kopyala" }));
    // `$` görsel ipucu: kopyalanan metne girmez.
    await waitFor(() => expect(copied.at(-1)).not.toContain("$"));
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Sekmeli · Kurulum">
        <CodeBlock tabs={installTabs("@base-ui/react")} className="w-full" />
      </Cell>
      <Cell label="Kabuk İstemi">
        <CodeBlock title="Terminal" prompt code={"npm install\nnpm run dev"} className="w-full" />
      </Cell>
      <Cell label="Dosya · Uzun Satır Kayar">
        <CodeBlock title="app/layout.tsx" code={'<html lang="tr" data-theme={theme} data-palette="signature" suppressHydrationWarning>'} className="w-full" />
      </Cell>
      <Cell label="Dosya · Satır Kırılır">
        <CodeBlock title="next.config.ts" wrap code="Content-Security-Policy: default-src 'self'; img-src 'self' data: https://pusula.kervantekstil.com.tr; connect-src 'self' https://api.kervantekstil.com.tr" className="w-full" />
      </Cell>
    </Gallery>
  ),
};
