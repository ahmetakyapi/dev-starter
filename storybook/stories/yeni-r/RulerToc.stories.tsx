import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { RulerToc } from "@/components/ui/ruler-toc";

const SECTIONS = [
  { id: "rt-hos-geldin", label: "Hoş geldin" },
  { id: "rt-randevu", label: "Randevu bağlantıları" },
  { id: "rt-gorev", label: "Görev ayrıntısı" },
  { id: "rt-duyuru", label: "Duyurular" },
  { id: "rt-baslangic", label: "Elindekiyle başla" },
  { id: "rt-nasil", label: "Nasıl çalışır" },
  { id: "rt-marka", label: "Marka dili" },
  {
    id: "rt-afis",
    label: "Afiş serisi",
    preview: (
      <span aria-hidden className="grid h-16 w-40 grid-cols-3 gap-1 bg-surface p-1">
        <span className="rounded-sm bg-chart-1" />
        <span className="rounded-sm bg-chart-2" />
        <span className="rounded-sm bg-chart-3" />
      </span>
    ),
  },
];

function Page() {
  return (
    <div className="bg-page">
      <RulerToc sections={SECTIONS} label="Bu Sayfada" />
      <main className="mx-auto grid max-w-xl gap-6 px-5 py-16 md:pl-20">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-8">
            <div className="grid h-80 place-items-center rounded-2xl bg-surface ring-1 ring-line-soft">
              <h2 id={`${s.id}-h`} className="text-lead font-medium text-strong">
                <span className="mr-2 font-mono text-small text-soft">{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </h2>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Form ve Gezinme/Cetvel İçindekiler",
  id: "ruler-toc",
  component: RulerToc,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "640px" },
      description: {
        component:
          "Uzun akışın sol kenarında sabit çizgi cetveli: her bölüm bir çizgi, okunan bölüm uzun ve koyu. İmleç cetvelin üstünde gezinince çizgiler çan eğrisiyle uzar (rAF yayı, yalnız hareket sürerken); satırda balon \"01 · Bölüm\" + isteğe önizleme. Tık bölüme kaydırır ve odağı taşır. Dar ekranda köşede \"01 Hoş geldin\" butonu açılır liste olur. Sakin Akış turundan (yalnız davranış).",
      },
    },
  },
  args: { sections: SECTIONS },
  render: () => <Page />,
} satisfies Meta<typeof RulerToc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navs = canvas.getAllByRole("navigation", { name: "Bu Sayfada", hidden: true });
    await expect(navs.length).toBeGreaterThan(0);
    const desktop = navs.find((n) => n.tagName === "NAV" && n.querySelector("ol a[aria-current]"));
    await expect(desktop).toBeTruthy();
    await expect(within(desktop!).getByRole("link", { name: "Hoş geldin", hidden: true })).toHaveAttribute("aria-current", "location");
  },
};

export const Navigate: Story = {
  name: "Bölüme Git",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas
      .getAllByRole("link", { name: "Duyurular", hidden: true })
      .find((a) => (a as HTMLElement).offsetParent !== null);
    if (!link) return; // dar görünümde masaüstü cetvel gizli
    await userEvent.click(link);
    await waitFor(() => expect(link).toHaveAttribute("aria-current", "location"));
    await expect(canvasElement.ownerDocument.activeElement?.id).toBe("rt-duyuru");
  },
};

export const Mobile: Story = {
  name: "Dar Ekran",
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.queryByRole("button", { name: /Hoş geldin, Bu Sayfada/ });
    if (!toggle || (toggle as HTMLElement).offsetParent === null) return;
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  },
};
