import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { OnayKuyrugu } from "./_onay";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/Onay Kuyruğu",
  id: "sample-approvals",
  component: OnayKuyrugu,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Harcama taleplerini bütçe ve politika bağlamıyla karara bağlayan kenarsız tam ekran sayfa: ince ölçü şeridi, süzgeçli kuyruk (çentikli bütçe çubuğu, SLA rozeti, satırda Reddet ve Onayla), sağda seçili talebin bütçe etkisi, politika kontrolleri ve geçmişi. Reddet, Vekil Ata ve toplu onay iletişim kutuları çalışır; onaylanan satır kuyruktan çıkar, bildirimde Geri Al vardır. Veri kurgusal ve \"ÖRNEK VERİ\" künyeli.",
      },
    },
  },
  args: { initialTab: "tumu" },
  argTypes: { initialTab: { control: "inline-radio", options: ["tumu", "asan", "buyuk"] } },
} satisfies Meta<typeof OnayKuyrugu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /Onaylar/ })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Seçilenleri Onayla/ })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Onayla: Webinar Eklentisi" }));
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Onayla: Webinar Eklentisi" })).toBeNull());
  },
};

export const SuresiAsan: Story = {
  name: "Süresi Aşan",
  args: { initialTab: "asan" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: /Reddet: Müşteri İlişkileri/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Reddet: Webinar/ })).toBeNull();
  },
};

export const RedDialog: Story = {
  name: "Reddet İletişim Kutusu",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Reddet: Grafik Aracı/ }));
    const body = within(document.body);
    await expect(await body.findByRole("dialog", { name: "Talebi Reddet" })).toBeInTheDocument();
    await expect(body.getByText("Önerilen")).toBeInTheDocument();
  },
};
