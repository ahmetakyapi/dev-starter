import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TocNav } from "@/components/ui/toc-nav";

const SECTIONS = [
  { id: "toc-kurulum", label: "Kurulum" },
  { id: "toc-tema", label: "Tema" },
  { id: "toc-bilesen", label: "Bileşenler" },
  { id: "toc-yayin", label: "Yayın" },
  { id: "toc-sss", label: "Sık Sorulanlar" },
];

function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-[60vh]">
      <TocNav sections={SECTIONS} />
      {SECTIONS.map((s, i) => (
        <section key={s.id} className="mt-10 grid gap-3">
          <h2 id={s.id} className="scroll-mt-24 text-heading font-semibold">
            {s.label}
          </h2>
          {Array.from({ length: 4 }, (_, k) => (
            <p key={k} className="text-read text-body">
              {i + 1}. bölümün {k + 1}. paragrafı. Uzun bir belgede okunan bölüm üstteki hapta vurgulanır, altındaki ince çizgi sayfanın ne kadarının
              okunduğunu gösterir.
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: "Bileşenler/Gezinme/Bölüm Gezintisi",
  id: "toc-nav",
  component: TocNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Uzun sayfanın üstünde yapışkan içindekiler hapı: okunan bölüm vurgulu (`aria-current=\"location\"`, IntersectionObserver), altında okuma ilerlemesi (kaydırmaya bağlı CSS). Tıklama başlığa kaydırır ve odak verir, adres `#id` ile güncellenir. Beş ve daha fazla bölümlü sayfa için.",
      },
    },
  },
  args: { sections: SECTIONS },
  render: () => <Page />,
} satisfies Meta<typeof TocNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Bu Sayfada" });
    await expect(within(nav).getByRole("link", { name: /Kurulum/ })).toHaveAttribute("aria-current", "location");
    await userEvent.click(within(nav).getByRole("link", { name: /Yayın/ }));
    await waitFor(() => expect(within(nav).getByRole("link", { name: /Yayın/ })).toHaveAttribute("aria-current", "location"));
    await expect(canvasElement.ownerDocument.getElementById("toc-yayin")).toHaveFocus();
  },
};
