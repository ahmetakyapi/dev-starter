import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ChatComposer } from "@/components/ui/chat-composer";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { MODELS } from "./_shared";

/*
 * "Model Seçimi" hikâyesi menüyü gerçekten açar: snippet'te etiket radyo
 * grubunun dışındayken Base UI 1.8 menü açılır açılmaz "MenuGroupContext is
 * missing" (#31) fırlatıyordu. Bu hikâye o hatanın geri dönmemesinin testi.
 */
function WithModel(props: ComponentProps<typeof ChatComposer>) {
  const [model, setModel] = useState(props.model);
  return (
    <ChatComposer
      {...props}
      model={model}
      onModelChange={(next) => {
        setModel(next);
        props.onModelChange?.(next);
      }}
    />
  );
}

const meta = {
  title: "Bloklar/Sohbet Giriş Kutusu",
  component: ChatComposer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Sohbet giriş kutusu: içeriğe göre büyüyen metin alanı, ek, model seçici, mikrofon ve yuvarlak gönder. Enter gönderir, Shift+Enter satır açar, IME ile yazarken Enter göndermez. Yanıt akarken gönder düğmesi aynı yerde Durdur'a döner. Tek satırlık arama için `search-bar` daha doğru.",
      },
    },
  },
  args: {
    onSend: fn(),
    onStop: fn(),
    onModelChange: fn(),
    onAttach: fn(),
    onVoice: fn(),
    status: "idle",
    model: MODELS[0],
    models: MODELS,
    placeholder: "Bir şey sor ya da görev ver",
    label: "Mesaj",
    disabled: false,
  },
  argTypes: {
    status: { control: "inline-radio", options: ["idle", "streaming"] },
    model: { control: "select", options: [...MODELS] },
    models: { control: false },
  },
  render: (args) => (
    <Frame width="lg">
      <WithModel {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bos: Story = { name: "Boş" };

export const Yazili: Story = {
  name: "Yazılı",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByLabelText("Mesaj");
    await userEvent.type(area, "Geçen çeyreğin destek taleplerini özetle.{Shift>}{Enter}{/Shift}En sık üç sorunu örnekleriyle çıkar.");
    await expect(area).toHaveValue("Geçen çeyreğin destek taleplerini özetle.\nEn sık üç sorunu örnekleriyle çıkar.");
    await expect(canvas.getByRole("button", { name: "Gönder" })).toBeEnabled();
  },
};

export const Gonderme: Story = {
  name: "Gönderme",
  parameters: { docs: { description: { story: "Enter gönderir; alan boşalır ve odak alanda kalır." } } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByLabelText("Mesaj");
    await expect(canvas.getByRole("button", { name: "Gönder" })).toBeDisabled();
    await userEvent.type(area, "Açık talepleri önceliğe göre sırala{Enter}");
    await expect(args.onSend).toHaveBeenCalledWith("Açık talepleri önceliğe göre sırala");
    await waitFor(() => expect(area).toHaveValue(""));
  },
};

export const GonderiliyorDurdur: Story = {
  name: "Gönderiliyor / Durdur",
  args: { status: "streaming" },
  play: async ({ args, canvasElement }) => {
    const stop = within(canvasElement).getByRole("button", { name: "Yanıtı Durdur" });
    await userEvent.click(stop);
    await expect(args.onStop).toHaveBeenCalled();
  },
};

export const TekModel: Story = {
  name: "Tek Model",
  parameters: { docs: { description: { story: "`models` verilmezse model yalnız etiket; `onAttach` / `onVoice` yoksa o düğmeler hiç çizilmez." } } },
  args: { models: undefined, onAttach: undefined, onVoice: undefined, model: "Fable 5 Mini" },
};

export const DevreDisi: Story = { name: "Devre Dışı", args: { disabled: true, placeholder: "Bağlantı bekleniyor" } };

export const ButunVaryantlar: Story = {
  name: "Bütün Varyantlar",
  render: (args) => (
    <Gallery cols={2}>
      <Cell label="Boş · gönder soluk" className="block">
        <ChatComposer {...args} />
      </Cell>
      <Cell label="Yanıt akıyor · Durdur" className="block">
        <ChatComposer {...args} status="streaming" />
      </Cell>
      <Cell label="Tek model · ek ve ses yok" className="block">
        <ChatComposer {...args} models={undefined} onAttach={undefined} onVoice={undefined} />
      </Cell>
      <Cell label="Devre dışı" className="block">
        <ChatComposer {...args} disabled placeholder="Bağlantı bekleniyor" />
      </Cell>
    </Gallery>
  ),
};

export const ModelSecimi: Story = {
  name: "Model Seçimi",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: new RegExp(MODELS[0]) }));
    const body = within(canvasElement.ownerDocument.body);
    const next = await body.findByRole("menuitemradio", { name: MODELS[1] });
    await userEvent.click(next);
    await waitFor(() => expect(args.onModelChange).toHaveBeenCalledWith(MODELS[1]));
  },
};

