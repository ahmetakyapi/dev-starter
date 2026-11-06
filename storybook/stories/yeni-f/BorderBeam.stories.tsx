import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { BorderBeam } from "@/components/ui/border-beam";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Button } from "@/components/ui/Button";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Hareket ve Doku/Işık Kenarı",
  id: "border-beam",
  component: BorderBeam,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Kartın çerçevesinde dolaşan kısa ışık: “bu kart şu an çalışıyor”. Asistanın yazdığı mesaj, süren içe aktarma. Yalnız bir iş sürerken (`active`); bitince söner. Saf CSS (`@property` açısı + halka maskesi), tek renk ailesi, hareket azaltmada durağan çerçeve.",
      },
    },
  },
  args: { children: null },
  render: () => <Demo />,
} satisfies Meta<typeof BorderBeam>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [active, setActive] = useState(true);
  return (
    <Frame width="md">
      <div className="grid gap-4">
        <BorderBeam active={active} className="rounded-xl bg-overlay p-5 shadow-raised" aria-busy={active}>
          <p className="text-small text-muted">Asistan</p>
          {active ? (
            <TextShimmer className="mt-1 text-read">Haftalık satış özeti hazırlanıyor…</TextShimmer>
          ) : (
            <p className="mt-1 text-read text-strong">Özet hazır: 214 sipariş, geçen haftadan %12 fazla.</p>
          )}
        </BorderBeam>
        <Button variant="secondary" onClick={() => setActive((v) => !v)}>
          {active ? "İşi Bitir" : "Yeniden Başlat"}
        </Button>
      </div>
    </Frame>
  );
}

export const Default: Story = { name: "Varsayılan" };

export const Tones: Story = {
  name: "Tonlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      {(["primary", "success", "warning", "danger"] as const).map((tone) => (
        <Cell key={tone} label={tone}>
          <BorderBeam tone={tone} className="grid h-24 w-full place-items-center rounded-xl bg-overlay text-small text-body shadow-raised">
            Senkronize ediliyor
          </BorderBeam>
        </Cell>
      ))}
    </Gallery>
  ),
};

export const Shapes: Story = {
  name: "Biçimler",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Hap düğme, kalın çerçeve">
        <BorderBeam as="span" width={2} duration={3} className="inline-flex min-h-11 items-center rounded-full bg-overlay px-5 text-base font-medium text-strong shadow-raised">
          Canlı Yayında
        </BorderBeam>
      </Cell>
      <Cell label="Geniş kart, uzun kuyruk">
        <BorderBeam arc={180} duration={6} className="h-28 w-full rounded-2xl bg-overlay shadow-raised" />
      </Cell>
      <Cell label="Sönük (active=false)">
        <BorderBeam active={false} className="h-28 w-full rounded-xl bg-overlay shadow-raised" />
      </Cell>
    </Gallery>
  ),
};
