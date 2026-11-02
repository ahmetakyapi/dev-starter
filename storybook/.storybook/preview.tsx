import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./preview.css";

/** Paletler: şablonun `app/palettes.css`iyle aynı adlar (signature varsayılan). */
export const PALETTES = [
  { value: "signature", title: "Signature" },
  { value: "cobalt", title: "Kobalt" },
  { value: "violet", title: "Menekşe" },
  { value: "rose", title: "Gül" },
  { value: "ruby", title: "Yakut" },
  { value: "tangerine", title: "Mandalina" },
  { value: "jade", title: "Yeşim" },
  { value: "verdant", title: "Zümrüt" },
  { value: "ember", title: "Kehribar" },
  { value: "iris", title: "İris" },
] as const;

/* Tema ve palet `<html>` üzerinde, ÇİZİMLE EŞZAMANLI yazılır (effect'te değil).
   addon-themes'in dekoratörü özniteliği play bittikten sonra yazıyordu: koyu
   temada katman önce açık renklerle çizilip `transition-colors` ile dönüyor,
   a11y denetimi geçişin ortasında sahte kontrast ihlali buluyordu (ölçüldü).
   Paletler `:root[data-palette]` seçicili, alt öğede çalışmaz. */
const THEMES: Record<string, string> = { Açık: "light", Koyu: "dark" };

const withRootAttributes: Decorator = (Story, context) => {
  const root = document.documentElement;
  const theme = THEMES[String(context.globals.theme)] ?? "light";
  const palette = String(context.globals.palette ?? "signature");
  if (root.dataset.theme !== theme) root.dataset.theme = theme;
  if (root.dataset.palette !== palette) root.dataset.palette = palette;
  return <Story />;
};

/* Bileşenler `m.*` kullanır: kökte LazyMotion şart (şablonun sağlayıcısı). */
const withMotion: Decorator = (Story) => (
  <MotionProvider>
    <Story />
  </MotionProvider>
);

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    backgrounds: { disable: true },
    a11y: { test: "error" },
    nextjs: { appDirectory: true },
    options: {
      // Vitrin yüzü en üstte: önce bir arada görülen örnek tasarım ve vitrin,
      // sonra başlangıç, token'lar ve parça parça katalog.
      storySort: {
        order: [
          "Örnek Tasarım",
          ["Her Şey Bir Arada", "Pusula Paneli", "Bileşen Kapsamı"],
          "Vitrin",
          ["Genel Bakış", "Temel Kütüphane", "Form Girişleri", "Katman ve Geri Bildirim", "Grafikler", "Bloklar"],
          "Başlangıç",
          "Tema",
          ["Renkler", "Paletler", "Tipografi", "Yüzeyler", "Grafik Renkleri", "Hareket"],
          "Bileşenler",
          "Grafikler",
          "Bloklar",
          "Ekranlar",
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Tema",
      toolbar: { title: "Tema", icon: "mirror", items: [{ value: "Açık", title: "Açık", icon: "sun" }, { value: "Koyu", title: "Koyu", icon: "moon" }], dynamicTitle: true },
    },
    palette: {
      description: "Renk paleti",
      toolbar: { title: "Palet", icon: "paintbrush", items: [...PALETTES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "Açık", palette: "signature" },
  decorators: [withMotion, withRootAttributes],
};

export default preview;
