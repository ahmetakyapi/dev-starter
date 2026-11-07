import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Download, Folder, Mail, Music, NotebookPen } from "lucide-react";
import { useRef, useState } from "react";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { Dock } from "@/components/ui/dock";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper, downloadWallpaper, type WallpaperScene } from "@/components/ui/wallpaper";

const SIZES = [
  { label: "Masaüstü", w: 2880, h: 1800 },
  { label: "Telefon", w: 1290, h: 2796 },
] as const;

function Card({ scene }: { scene: WallpaperScene }) {
  const box = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  async function save(w: number, h: number, label: string) {
    const svg = box.current?.querySelector("svg");
    if (!svg) return;
    setBusy(label);
    try {
      await downloadWallpaper(svg, w, h, `pusula-${scene}`);
    } finally {
      setBusy(null);
    }
  }
  return (
    <figure className="overflow-hidden rounded-2xl bg-overlay shadow-raised ring-1 ring-line">
      <div ref={box} className="aspect-[16/10]">
        <Wallpaper scene={scene} />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="text-small font-semibold text-strong">{WALLPAPER_NAMES[scene]}</span>
        <span className="flex gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => save(s.w, s.h, s.label)}
              disabled={busy !== null}
              aria-label={`${WALLPAPER_NAMES[scene]}: ${s.label} PNG indir (${s.w}×${s.h})`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-micro font-medium text-strong hover:bg-surface-raised disabled:opacity-60"
            >
              <Download aria-hidden className="size-3.5" />
              {busy === s.label ? "Hazırlanıyor" : s.label}
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

const meta = {
  title: "Bileşenler/Tanıtım/Duvar Kâğıdı",
  id: "wallpaper",
  component: Wallpaper,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Çözünürlükten bağımsız (SVG) sekiz illüstrasyon sahnesi: elle seçilmiş renk setleri, katman başına ışık degradesi, sis, hale, ipek dokusu. Masaüstü maketinin arkası olur ya da `downloadWallpaper()` ile PNG olarak indirilir (Retina masaüstü 2880×1800, telefon 1290×2796).",
      },
    },
  },
  args: { scene: "dunes" },
  render: () => (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {WALLPAPER_SCENES.map((s) => (
        <Card key={s} scene={s} />
      ))}
    </div>
  ),
} satisfies Meta<typeof Wallpaper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Sahneler ve İndirme", parameters: { layout: "fullscreen" } };

export const Desktop: Story = {
  name: "Masaüstü Maketi",
  parameters: { layout: "padded" },
  render: () => (
    <Wallpaper scene="alpine" className="aspect-[16/10] w-full max-w-4xl rounded-2xl p-6">
      <WindowStrip role="img" aria-label="Şafak dağları duvar kâğıdı üstünde iki pencere, Notlar odakta" className="h-48">
        <AppWindow title="Notlar" icon={<NotebookPen />} focused className="w-64" />
        <AppWindow title="Posta" icon={<Mail />} className="w-56" />
      </WindowStrip>
      <div className="mt-16 flex justify-center">
        <Dock
          items={[
            { id: "d", label: "Dosyalar", icon: <Folder className="text-body" />, active: true },
            { id: "p", label: "Posta", icon: <Mail className="text-body" /> },
            { id: "m", label: "Müzik", icon: <Music className="text-body" /> },
          ]}
        />
      </div>
    </Wallpaper>
  ),
};

export const Phone: Story = {
  name: "Telefon Oranı",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-4">
      {WALLPAPER_SCENES.map((s) => (
        <div key={s} className="aspect-[9/19.5] w-36 overflow-hidden rounded-[1.75rem] ring-4 ring-strong/80">
          <Wallpaper scene={s} />
        </div>
      ))}
    </div>
  ),
};
