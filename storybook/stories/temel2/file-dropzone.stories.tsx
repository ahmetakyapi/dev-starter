import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Cell, Frame, Gallery } from "../_lib/Frame";

const meta = {
  title: "Bileşenler/Seçim/Dosya Bırakma Alanı",
  id: "components-selection-file-dropzone",
  component: FileDropzone,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sürükle-bırak bir kısayol; asıl yol tıklayınca açılan dosya seçici, klavyeyle de erişilir. `accept` bir MIME izin listesi; SVG varsayılan olarak reddedilir (script taşıyabilir). Reddedilen dosya nedeniyle listelenir; sunucu yine de türü ve boyutu yeniden denetler.",
      },
    },
  },
  args: { label: "Fatura Yükle", hint: "PDF ya da görsel, en fazla 5 MB.", multiple: true, name: "fatura" },
  argTypes: { accept: { control: "object" }, maxBytes: { control: "number" } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="md">
        <Story />
      </Frame>
    ),
  ],
} satisfies Meta<typeof FileDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const AcceptAndReject: Story = {
  name: "Kabul ve Ret",
  args: { accept: ["application/pdf"], maxBytes: 1024 * 1024, hint: "Yalnızca PDF, en fazla 1 MB." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Sürükle-bırak: gerçek bir DataTransfer ile bırakma olayı. (`userEvent.upload`
    // girişin `files`ını salt-okunur bir taklitle değiştirir; bileşen kabul edilen
    // dosyaları girişe geri yazdığı için o yol burada kullanılamaz.)
    const transfer = new DataTransfer();
    transfer.items.add(new File(["%PDF-1.7"], "Ekim Faturası.pdf", { type: "application/pdf" }));
    transfer.items.add(new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }));
    const zone = canvasElement.querySelector("label")!;
    for (const type of ["dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }
    await expect(await canvas.findByText(/Ekim Faturası\.pdf/)).toBeVisible();
    await expect(await canvas.findByText(/logo\.svg/)).toBeVisible();
  },
};

export const SingleFile: Story = { name: "Tek Dosya", args: { multiple: false, label: "Profil Fotoğrafı", hint: "PNG ya da JPEG.", accept: ["image/png", "image/jpeg"] } };

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={2}>
      <Cell label="Çoklu, varsayılan izin listesi" className="place-items-stretch">
        <FileDropzone label="Fatura Yükle" />
      </Cell>
      <Cell label="Tek görsel" className="place-items-stretch">
        <FileDropzone label="Profil Fotoğrafı" hint="PNG ya da JPEG." multiple={false} accept={["image/png", "image/jpeg"]} />
      </Cell>
    </Gallery>
  ),
};
