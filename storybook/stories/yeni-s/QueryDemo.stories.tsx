import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { QueryDemo, type QueryRequest } from "@/components/ui/query-demo";

const buildRequest = (input: string, preset: string): QueryRequest => ({
  method: "GET",
  path: "/v1/konaklama",
  params: [
    ["sehir", input.toLocaleLowerCase("tr-TR")],
    ["sira", preset],
    ["adet", "3"],
  ],
});

const meta = {
  title: "Bileşenler/Tanıtım/Sorgu Deneme Şeridi",
  id: "query-demo",
  component: QueryDemo,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Kahramanın altında \"kendin dene\" şeridi: etiketli giriş, hazır ifade çipleri (radyo grubu) ve koyu çalıştır butonu; arkasından çıkan katmanda canlı istek satırı her yazışta güncellenir. Butona basınca çağıranın verdiği ÖRNEK sonuçlar sırayla belirir. API ve veri servisi tanıtımı. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    fields: { label: "Şehir", placeholder: "Bir şehir yaz", defaultValue: "İzmir" },
    presets: [
      { value: "puan", label: "En Yüksek Puan" },
      { value: "fiyat", label: "En Uygun Fiyat" },
      { value: "yakin", label: "Denize Yakın" },
    ],
    presetsLabel: "Sıralama",
    buildRequest,
    results: [
      { title: "Kıyı Evleri", detail: "Urla · 12 oda", value: "4,8" },
      { title: "Çam Yamacı", detail: "Seferihisar · 8 oda", value: "4,7" },
      { title: "Liman Konağı", detail: "Foça · 15 oda", value: "4,6" },
    ],
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-4xl">
      <QueryDemo {...args} />
    </div>
  ),
} satisfies Meta<typeof QueryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const line = canvasElement.querySelector("[aria-live='polite']") as HTMLElement;
    await expect(line).toHaveTextContent("sira=puan");

    await userEvent.click(canvas.getByRole("radio", { name: "Denize Yakın" }));
    await expect(canvas.getByRole("radio", { name: "Denize Yakın" })).toBeChecked();
    await expect(line).toHaveTextContent("sira=yakin");

    const input = canvas.getByLabelText("Şehir");
    await userEvent.clear(input);
    await userEvent.type(input, "Muğla");
    await expect(line).toHaveTextContent("sehir=muğla");

    await userEvent.click(canvas.getByRole("button", { name: "Sorguyu Çalıştır" }));
    await expect(await canvas.findByText("Kıyı Evleri")).toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent("3 örnek sonuç gösterildi.");
  },
};

export const WithOnRun: Story = {
  name: "Kendi Çalıştırıcısıyla",
  args: { onRun: fn(), results: [] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Sorguyu Çalıştır" }));
    await expect(args.onRun).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", path: "/v1/konaklama" }),
    );
  },
};

export const FromTemplate: Story = {
  name: "Sunucu Şablonuyla",
  args: {
    buildRequest: undefined,
    request: {
      method: "GET",
      path: "/v1/etkinlik",
      params: [
        { key: "q", value: "{input}" },
        { key: "tur", value: "{preset}" },
        { key: "dil", value: "tr" },
      ],
    },
    fields: { label: "Aranan", placeholder: "Bir sanatçı ya da mekan yaz", defaultValue: "caz" },
    presets: [
      { value: "konser", label: "Konser" },
      { value: "tiyatro", label: "Tiyatro" },
    ],
    presetsLabel: "Tür",
    results: [
      { title: "Gece Yarısı Caz", detail: "Moda Sahnesi · Cuma", value: "₺450" },
      { title: "Liman Akşamları", detail: "Kordon · Cumartesi", value: "₺320" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const line = canvasElement.querySelector("[aria-live='polite']") as HTMLElement;
    await expect(line).toHaveTextContent("q=caz");
    await expect(line).toHaveTextContent("tur=konser");
    await userEvent.click(canvas.getByRole("radio", { name: "Tiyatro" }));
    await expect(line).toHaveTextContent("tur=tiyatro");
    await expect(line).toHaveTextContent("dil=tr");
  },
};
