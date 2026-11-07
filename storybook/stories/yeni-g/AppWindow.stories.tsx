import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Compass, Mail, NotebookPen, SquareTerminal } from "lucide-react";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const Lines = () => (
  <div className="space-y-2 p-3">
    <div className="h-2 w-3/4 rounded-full bg-surface" />
    <div className="h-2 w-1/2 rounded-full bg-surface" />
  </div>
);

const meta = {
  title: "Bileşenler/Tanıtım/Uygulama Penceresi",
  id: "app-window",
  component: AppWindow,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Üç pencere düğmeli masaüstü penceresi maketi. Ürünü ekran görüntüsü yerine token'la çizilmiş canlı parçalarla anlatır: iki temada doğru, metni seçilebilir, bayatlamaz. `focused` tek pencerede, `ghost` henüz açılmamış pencere. `WindowStrip` pencereleri ekranın dışına taşarak dizer.",
      },
    },
  },
  args: { title: "Notlar", focused: true },
  render: (args) => (
    <Frame>
      <AppWindow {...args} icon={<NotebookPen />} className="h-40 w-64">
        <Lines />
      </AppWindow>
    </Frame>
  ),
} satisfies Meta<typeof AppWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Odakta" };

export const States: Story = {
  name: "Durumlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={4}>
      <Cell label="varsayılan">
        <AppWindow title="Tarayıcı" icon={<Compass />} className="h-36 w-full">
          <Lines />
        </AppWindow>
      </Cell>
      <Cell label="focused">
        <AppWindow title="Notlar" icon={<NotebookPen />} focused className="h-36 w-full">
          <Lines />
        </AppWindow>
      </Cell>
      <Cell label="ghost">
        <AppWindow title="Posta" icon={<Mail />} ghost className="h-36 w-full" />
      </Cell>
      <Cell label='tone="inverse"'>
        <AppWindow title="Uçbirim" icon={<SquareTerminal />} tone="inverse" className="h-36 w-full">
          <pre className="p-3 font-mono text-micro text-page/80">$ npm test{"\n"}tamam.</pre>
        </AppWindow>
      </Cell>
    </Gallery>
  ),
};

export const Strip: Story = {
  name: "Pencere Şeridi",
  render: () => (
    <Frame width="xl">
      <WindowStrip role="img" aria-label="Dört pencere yan yana, Notlar odakta" className="h-48 w-full">
        <AppWindow title="Tarayıcı" icon={<Compass />} className="w-56">
          <Lines />
        </AppWindow>
        <AppWindow title="Notlar" icon={<NotebookPen />} focused className="w-64">
          <Lines />
        </AppWindow>
        <AppWindow title="Posta" icon={<Mail />} ghost className="w-56" />
        <AppWindow title="Uçbirim" icon={<SquareTerminal />} className="w-56">
          <Lines />
        </AppWindow>
      </WindowStrip>
    </Frame>
  ),
};
