import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchX } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, fn, userEvent, within } from "storybook/test";
import ErrorBoundary from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound from "@/app/not-found";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cell, Frame, Gallery } from "../_lib/Frame";

/* Şablonun 404 metni: boş durum örnekleri metin uydurmasın diye buradan. */
const NOT_FOUND = {
  title: "Sayfa Bulunamadı",
  hint: "Aradığın adres taşınmış ya da hiç var olmamış olabilir.",
  action: "Ana Sayfaya Dön",
} as const;

/** Next'in segment hata sınırına verdiği hata nesnesinin taklidi. */
function failure(digest?: string): Error & { digest?: string } {
  return Object.assign(new Error("Örnek hata"), digest ? { digest } : {});
}

const meta = {
  title: "Ekranlar/Açılış Sayfası/Sistem Sayfaları",
  component: ErrorBoundary,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Şablonun sistem sayfaları: `app/not-found.tsx`, `app/error.tsx` (segment hata sınırı), `app/global-error.tsx` (kök layout çökünce) ve onların yapı taşı `EmptyState`. Hata sayfası mesajı GÖSTERMEZ, yalnızca iletilebilecek `digest` kimliğini; `retry` segmenti sunucudan yeniden ister.",
      },
    },
  },
  args: { error: failure("3170429855"), retry: fn() },
  argTypes: { error: { control: false } },
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-page text-body">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bulunamadi: Story = {
  name: "Sayfa Bulunamadı (404)",
  render: () => <NotFound />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: NOT_FOUND.title })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: NOT_FOUND.action })).toHaveAttribute("href", "/");
  },
};

export const Hata: Story = {
  name: "Hata",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Tekrar Dene" }));
    await expect(args.retry).toHaveBeenCalledOnce();
    await expect(canvas.getByText("Hata Kimliği 3170429855")).toBeInTheDocument();
  },
};

export const HataKimliksiz: Story = {
  name: "Hata, Kimlik Yok",
  args: { error: failure() },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/Hata Kimliği/)).not.toBeInTheDocument();
  },
};

/*
 * global-error kendi <html> ve <body>sini basar ve stilleri satır içidir
 * (globals.css yüklenmemiş olabilir): Storybook kökünün içine çizilemez.
 * Statik HTML'i bir iframe'de gösterilir. Sayfa `prefers-color-scheme`
 * izler; iframe içinde bu sorgu çerçeve öğesinin `color-scheme`ine bakar,
 * o yüzden araç çubuğundaki tema oraya yazılır. Düğme statik çıktıda tıklanmaz.
 */
export const GenelHata: Story = {
  name: "Genel Hata Sayfası",
  render: (args, { globals }) => (
    <main className="grid min-h-dvh place-items-center p-4">
      <iframe
        title="Genel hata sayfası"
        style={{ colorScheme: globals.theme === "Koyu" ? "dark" : "light" }}
        className="h-[32rem] w-full max-w-3xl rounded-2xl border border-line bg-surface"
        srcDoc={`<!doctype html>${renderToStaticMarkup(<GlobalError {...args} />)}`}
      />
    </main>
  ),
};

export const BosDurum: Story = {
  name: "Boş Durum",
  render: () => (
    <main className="grid min-h-dvh place-items-center p-4">
      <Frame>
        <EmptyState
          icon={<SearchX aria-hidden />}
          title={NOT_FOUND.title}
          titleAs="h1"
          hint={NOT_FOUND.hint}
          action={<ButtonLink href="/">{NOT_FOUND.action}</ButtonLink>}
        />
      </Frame>
    </main>
  ),
};

export const BosDurumlar: Story = {
  name: "Bütün Boş Durumlar",
  render: () => (
    <main className="grid min-h-dvh place-items-center p-4">
      <h1 className="sr-only">Boş Durumlar</h1>
      <Gallery cols={2}>
        <Cell label="İkon, ipucu ve eylem">
          <EmptyState
            className="w-full"
            icon={<SearchX aria-hidden />}
            title={NOT_FOUND.title}
            hint={NOT_FOUND.hint}
            action={<ButtonLink href="/">{NOT_FOUND.action}</ButtonLink>}
          />
        </Cell>
        <Cell label="Eylemsiz">
          <EmptyState className="w-full" icon={<SearchX aria-hidden />} title={NOT_FOUND.title} hint={NOT_FOUND.hint} />
        </Cell>
        <Cell label="İkonsuz">
          <EmptyState
            className="w-full"
            title={NOT_FOUND.title}
            hint={NOT_FOUND.hint}
            action={<ButtonLink href="/">{NOT_FOUND.action}</ButtonLink>}
          />
        </Cell>
        <Cell label="Yalnız başlık">
          <EmptyState className="w-full" title={NOT_FOUND.title} />
        </Cell>
      </Gallery>
    </main>
  ),
};
