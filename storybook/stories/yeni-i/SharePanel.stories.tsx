import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Globe } from "lucide-react";
import { SharePanel } from "@/components/ui/share-panel";

const TEAM = ["Ahmet Akyapı", "Zeynep Kaya", "Mert Aksoy", "Selin Arslan", "Can Demir", "Burak Öztürk"];

function Demo() {
  const [team, setTeam] = useState(true);
  const [link, setLink] = useState(false);
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-overlay p-6 shadow-floating ring-1 ring-line">
      <h2 className="text-title font-semibold text-strong">Panoyu Paylaş</h2>
      <p className="mt-1 mb-5 text-base text-muted">Ekiple ya da bağlantıyla.</p>
      <SharePanel
        link="https://pusula.app/p/pano?donem=ay"
        access={[
          { id: "ekip", label: "Pusula Ekibi", tag: "Ekip", people: TEAM, checked: team, onCheckedChange: setTeam },
          { id: "herkes", label: "Bağlantıya sahip herkes", tag: "Herkese Açık", icon: <Globe />, checked: link, onCheckedChange: setLink },
        ]}
      />
    </div>
  );
}

const meta = {
  title: "Bileşenler/Katmanlar/Paylaşım Paneli",
  id: "share-panel",
  component: SharePanel,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Bağlantı + kopyala ve kitle düzeyinde erişim satırları (ekip, bağlantıya sahip herkes); satırın tamamı anahtarın etiketi. Hiçbir erişim açık değilken bağlantının işe yaramayacağını söyler. Paylaşım diyaloğunun gövdesi; önizlemeyi çağıran üstüne koyar. Pusula: Raporlar → Hazır Raporlar → Paylaş.",
      },
    },
  },
  args: { link: "https://pusula.app/p/pano", access: [] },
  render: () => <Demo />,
} satisfies Meta<typeof SharePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Ekip ve Bağlantı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const team = canvas.getByRole("switch", { name: /Pusula Ekibi/ });
    await expect(team).toBeChecked();
    await userEvent.click(team);
    await canvas.findByText(/Erişim kapalı/);
    await userEvent.click(canvas.getByRole("switch", { name: /Bağlantıya sahip herkes/ }));
    await expect(canvas.queryByText(/Erişim kapalı/)).not.toBeInTheDocument();
  },
};
