import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BedDouble, Car, Plane, Ticket } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { PromptBar } from "@/components/ui/prompt-bar";

const meta = {
  title: "Bileşenler/Tanıtım/Niyet Çubuğu",
  id: "prompt-bar",
  component: PromptBar,
  tags: ["autodocs", "yeni"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Kahramanın ortasında yüzen hap: arama ikonu, giriş, isteğe seçim hapı, koyu gönder ve altından uzanan vurgu yayı. Altında kapsam çipleri (`aria-pressed`): açık olan dolu ve ×, kapalılar soluk ve +. Boşken gönder odağı girişe verir. Manzara turundan (yalnız davranış ve yapı).",
      },
    },
  },
  args: {
    onSubmit: fn(),
    placeholder: "Nereye gitmek istersin?",
    submitLabel: "Planla",
    select: {
      label: "Misafir sayısı",
      options: [
        { value: "1", label: "1 Misafir" },
        { value: "2", label: "2 Misafir" },
        { value: "4", label: "4 Misafir" },
      ],
      defaultValue: "2",
    },
    scopes: [
      { value: "otel", label: "Oteller", icon: <BedDouble /> },
      { value: "ucus", label: "Uçuşlar", icon: <Plane /> },
      { value: "arac", label: "Araç", icon: <Car /> },
      { value: "etkinlik", label: "Etkinlikler", icon: <Ticket /> },
    ],
    defaultScopes: ["otel"],
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-2xl py-8">
      <PromptBar {...args} />
    </div>
  ),
} satisfies Meta<typeof PromptBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const otel = canvas.getByRole("button", { name: "Oteller" });
    const ucus = canvas.getByRole("button", { name: "Uçuşlar" });
    await expect(otel).toHaveAttribute("aria-pressed", "true");
    await expect(ucus).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(ucus);
    await expect(ucus).toHaveAttribute("aria-pressed", "true");

    // Boşken gönder: çağrı yok, odak girişte.
    const input = canvas.getByRole("searchbox", { name: "İstek" });
    await userEvent.click(canvas.getByRole("button", { name: "Planla" }));
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await expect(input).toHaveFocus();

    await userEvent.selectOptions(canvas.getByLabelText("Misafir sayısı"), "4");
    await userEvent.type(input, "Kapadokya'da hafta sonu{Enter}");
    await expect(args.onSubmit).toHaveBeenCalledWith({
      text: "Kapadokya'da hafta sonu",
      scopes: ["otel", "ucus"],
      select: "4",
    });
  },
};

export const Minimal: Story = {
  name: "Seçimsiz, Kapsamsız",
  args: { select: undefined, scopes: [], placeholder: "Bir şablon tarif et", submitLabel: "Oluştur" },
};

export const NativeForm: Story = {
  name: "Yerel Form Gönderimi",
  args: { onSubmit: undefined, action: "/ara", name: "q" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("search");
    await expect(form).toHaveAttribute("action", "/ara");
    await expect(canvas.getByRole("searchbox")).toHaveAttribute("name", "q");
    await expect(form.querySelector("input[type='hidden'][name='kapsam']")).toHaveValue("otel");
    await userEvent.click(canvas.getByRole("button", { name: "Araç" }));
    await expect(form.querySelectorAll("input[type='hidden'][name='kapsam']")).toHaveLength(2);
  },
};
