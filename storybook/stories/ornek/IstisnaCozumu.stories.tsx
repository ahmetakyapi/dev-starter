import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IstisnaCozumu } from "./_istisna";

const meta = {
  title: "Ekranlar/Örnek Sayfalar/İstisna Çözümü",
  id: "sample-exception",
  component: IstisnaCozumu,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fatura hattında otomatik kontrolü geçemeyen kaydı insanın çözdüğü kenarsız tam ekran sayfa: durum bandı, token'la çizilmiş fatura kesiti ve değer farkı (`ValueDiff`), \"Neden Başarısız Oldu\" açıklaması, çözüm yolu kartları (biri kilitli, nedeni yazılı), sağda risk etkenleri ve tedarikçi kartı. Gönderince \"Düzeltme Bekleniyor\", tedarikçi yanıtı simüle edilince \"Düzeltildi ve Kabul Edildi\". Veri kurgusal ve \"ÖRNEK VERİ\" künyeli.",
      },
    },
  },
  args: { initialPhase: "acik" },
  argTypes: { initialPhase: { control: "inline-radio", options: ["acik", "bekliyor", "kabul", "reddedildi"] } },
} satisfies Meta<typeof IstisnaCozumu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: /KDV Numarası Uyuşmuyor/ })).toBeInTheDocument();
    await expect(canvas.getByRole("radio", { name: /Burada Düzelt/ })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Düzeltme İste" }));
    await waitFor(() => expect(canvas.getAllByText("Düzeltme Bekleniyor").length).toBeGreaterThan(0));
    await userEvent.click(canvas.getByRole("button", { name: "Tedarikçi Yanıtını Simüle Et" }));
    await waitFor(() => expect(canvas.getAllByText("Çözüldü").length).toBeGreaterThan(0));
  },
};

export const Cozuldu: Story = {
  name: "Çözüldü",
  args: { initialPhase: "kabul" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Düzeltildi ve Kabul Edildi")).toBeInTheDocument();
  },
};
