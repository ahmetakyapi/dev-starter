import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { Toaster, toast } from "@/components/ui/toast";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_settle";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const body = () => within(document.body);

function fireAll() {
  toast.info("Rapor hazırlanıyor", { description: "Hazır olunca e-posta da gelecek." });
  toast.warning("Depolama %90 dolu", { description: "Eski yedekleri silmeyi düşün." });
  toast.error("Ödeme alınamadı", { description: "Kart limiti yetersiz; başka kart dene." });
  toast.success("Fatura gönderildi", { description: "FTR-2024-0148 · Özdemir Zeytincilik" });
}

/** Tetikleyici düğmeler: her biri bir tür. */
function Triggers() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => toast.success("Taslak kaydedildi")}>
        Başarı
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.error("Ödeme alınamadı", { description: "Kart limiti yetersiz; başka kart dene." })}>
        Hata
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.warning("Oturum 5 dakika içinde kapanacak")}>
        Uyarı
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.info("Yeni sürüm yüklendi", { description: "Sayfayı yenileyince geçerli olur." })}>
        Bilgi
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast.undo("3 dosya silindi", () => toast.info("Dosyalar geri yüklendi"))}>
        Geri Al
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          void toast
            .promise(wait(1600).then(() => 12), {
              loading: "Fiyatlar güncelleniyor",
              success: (count) => `${count} ürünün fiyatı güncellendi`,
              error: "Fiyatlar güncellenemedi",
            })
            .catch(() => undefined)
        }
      >
        Promise
      </Button>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Geri Bildirim/Bildirim",
  id: "toast",
  component: Toaster,
  tags: ["autodocs"],
  beforeEach: () => {
    toast.dismiss();
  },
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Bir eylemin sonucu, kısa süre: `<Toaster />` sayfada bir kez, `toast.success/error/warning/info/undo/promise` her yerden (bileşen dışından da). Hata assertive okunur ve kendiliğinden kapanmaz; en çok 3 görünür, fazlası \"+N bildirim daha\" hapında; sağa ya da aşağı kaydırınca kapanır. Karar gerekiyorsa diyalog, kalıcı durum için banner-alert.",
      },
    },
  },
  args: { timeout: 5000, limit: 3 },
  render: (args) => (
    <Frame width="lg">
      <Toaster {...args} />
      <Triggers />
    </Frame>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Başarı" }));
    await expect(await body().findByText("Taslak kaydedildi")).toBeInTheDocument();
    await expect(body().getByRole("region", { name: /Bildirimler/ })).toBeInTheDocument();
  },
};

export const ErrorToast: Story = {
  name: "Hata",
  // Base UI'ın bilinçli deseni: yüksek öncelikli bildirimin görünen karosu
  // odak dışarıdayken `aria-hidden`, ekran okuyucu onun gizli `role="alert"`
  // kopyasını okur (iki kez okunmasın diye). Karo `tabindex=0` taşıdığı için
  // axe bunu "aria-hidden-focus" sayar; odak bölgeye girince (Tab, F6)
  // `aria-hidden` kalkar. Yalnız bu kural, yalnız bu hikâyede susar.
  parameters: { a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Hata" }));
    // Hata iki yerde: görünen karo ve Base UI'ın gizli `role="alert"` kopyası.
    await expect((await body().findAllByText("Ödeme alınamadı")).length).toBeGreaterThan(0);
    // Hata kendiliğinden kapanmaz; kapat düğmesi var. Base UI düğmeyi yığın
    // kapalıyken ekran okuyucudan gizler (odak girince açılır), adla aranamaz.
    await expect(document.querySelector('[data-type="error"] button[aria-label="Bildirimi Kapat"]')).not.toBeNull();
  },
};

export const Undo: Story = {
  name: "Geri Al",
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Geri Al" }));
    await body().findByText("3 dosya silindi");
    // Bildirimdeki "Geri Al" tuvalin dışında (portal).
    const undo = body()
      .getAllByRole("button", { name: "Geri Al" })
      .find((button) => !canvasElement.contains(button));
    await expect(undo).toBeTruthy();
    await userEvent.click(undo!);
    await expect(await body().findByText("Dosyalar geri yüklendi")).toBeInTheDocument();
  },
};

export const PromiseFlow: Story = {
  name: "Yükleniyor → Sonuç",
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Promise" }));
    await expect(await body().findByText("Fiyatlar güncelleniyor")).toBeInTheDocument();
    await waitFor(() => expect(body().getByText("12 ürünün fiyatı güncellendi")).toBeInTheDocument(), { timeout: 4000 });
  },
};

export const Stacked: Story = {
  name: "Yığın ve Sayaç",
  play: async () => {
    fireAll();
    toast.info("Yedek tamamlandı", { description: "Dün 23:00 · 1,2 GB" });
    await waitFor(() => expect(body().getByText("+2 bildirim daha")).toBeInTheDocument(), { timeout: 2000 });
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: (args) => (
    <Gallery cols={2}>
      <Toaster {...args} />
      <Cell label="Dört tür: önde başarı, arkada hata, uyarı, bilgi (fare gelince yığın açılır)">
        <Button variant="secondary" onClick={fireAll}>
          Dördünü Göster
        </Button>
      </Cell>
      <Cell label="Eylem ve promise">
        <Triggers />
      </Cell>
    </Gallery>
  ),
  play: async () => {
    fireAll();
    await expect(await body().findByText("Fatura gönderildi")).toBeInTheDocument();
  },
};
