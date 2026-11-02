import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Textarea } from "@/components/ui/textarea";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { settle } from "./_a11y";

const NEAR_LIMIT =
  "Kapı kodu 4512, üçüncü kat. Zil çalışmıyor, gelince telefonla arayın; akşam altıdan sonra evdeyiz, paket kapıya bırakılabilir.";

const FULL =
  "Siparişte iki ürün eksik geldi: 500 gram Ezine peyniri ve bir şişe zeytinyağı. Faturaya tutar tam yansımış. İade ya da gönderim rica ederim.";


/** Sayaç değeri anlık değişsin diye denetimli sarmalayıcı. */
function Controlled(props: ComponentProps<typeof Textarea>) {
  const [value, setValue] = useState(String(props.defaultValue ?? ""));
  return <Textarea {...props} defaultValue={undefined} value={value} onChange={(event) => setValue(event.target.value)} />;
}

const meta = {
  title: "Bileşenler/Form Girişleri/Metin Alanı",
  component: Textarea,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Çok satırlı metin için (not, açıklama, geri bildirim); tek satırlık değer için Field. İçeriğe göre `minRows`–`maxRows` arasında büyür. `maxLength` verilince köşede sayaç belirir; %90'da uyarı, sınırda hata tonuna döner ve aynı anda ekran okuyucuya söylenir.",
      },
    },
  },
  args: {
    label: "Teslimat Notu",
    hint: "Kapı kodu, kat, zil adı gibi kurye için bilgiler.",
    placeholder: "Kurye için not yaz",
    maxLength: 140,
    minRows: 3,
    maxRows: 8,
    disabled: false,
  },
  render: (args) => (
    <Frame width="sm">
      <Textarea {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Varsayilan: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Teslimat Notu" });
    await userEvent.type(field, "Üçüncü kat");
    await expect(canvas.getByText(/10 \/ 140/)).toBeInTheDocument();
  },
};

export const Sayacli: Story = {
  name: "Sayaçlı",
  args: { defaultValue: "Zil çalışmıyor, gelince arayın." },
  render: (args) => (
    <Frame width="sm">
      <Controlled {...args} />
    </Frame>
  ),
};

export const SinirYakin: Story = {
  name: "Sınıra Yakın",
  args: { defaultValue: NEAR_LIMIT },
  render: (args) => (
    <Frame width="sm">
      <Controlled {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Karakter sınırına yaklaşıldı");
  },
};

export const SinirDolu: Story = {
  name: "Sınır Dolu",
  args: { label: "Şikâyet Açıklaması", defaultValue: FULL, hint: "Yazdığın metin müşteri hizmetlerine gider." },
  render: (args) => (
    <Frame width="sm">
      <Controlled {...args} />
    </Frame>
  ),
};

export const Hatali: Story = {
  name: "Hatalı",
  args: {
    label: "İade Gerekçesi",
    defaultValue: "Beğenmedim",
    hint: undefined,
    maxLength: 280,
    error: "Gerekçe en az 20 karakter olmalı.",
  },
};

export const DevreDisi: Story = {
  name: "Devre Dışı",
  args: { defaultValue: "Sipariş yola çıktı; not artık değiştirilemez.", disabled: true, maxLength: undefined },
};

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded" },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş, sayaçsız">
        <Textarea label="Açıklama" placeholder="Proje hakkında birkaç cümle" className="w-full" />
      </Cell>
      <Cell label="Sayaç">
        <Textarea label="Teslimat Notu" maxLength={140} defaultValue="Zil çalışmıyor, gelince arayın." className="w-full" />
      </Cell>
      <Cell label="Sınıra yakın">
        <Textarea label="Teslimat Notu" maxLength={140} defaultValue={NEAR_LIMIT} className="w-full" />
      </Cell>
      <Cell label="Sınır dolu">
        <Textarea label="Şikâyet Açıklaması" maxLength={140} defaultValue={FULL} className="w-full" />
      </Cell>
      <Cell label="Hata">
        <Textarea label="İade Gerekçesi" defaultValue="Beğenmedim" error="Gerekçe en az 20 karakter olmalı." className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <Textarea label="Teslimat Notu" defaultValue="Not artık değiştirilemez." disabled className="w-full" />
      </Cell>
    </Gallery>
  ),
};
