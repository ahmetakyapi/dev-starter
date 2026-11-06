import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ThemedDocsContainer } from "./docs-container";
import { DocsPageWithInstall } from "./install-block";
import { PALETTES } from "./palettes";
import "./preview.css";


/* Tema ve palet `<html>` üzerinde, ÇİZİMLE EŞZAMANLI yazılır (effect'te değil).
   addon-themes'in dekoratörü özniteliği play bittikten sonra yazıyordu: koyu
   temada katman önce açık renklerle çizilip `transition-colors` ile dönüyor,
   a11y denetimi geçişin ortasında sahte kontrast ihlali buluyordu (ölçüldü).
   Paletler `:root[data-palette]` seçicili, alt öğede çalışmaz. */
/* Değer adrese girer (`globals=theme:dark`): ASCII. "Açık" yazılsaydı adres
   `theme:A%C3%A7%C4%B1k` olurdu. Eski bağlantılar için Türkçe değerler de tanınır. */
const THEMES: Record<string, string> = { light: "light", dark: "dark", Açık: "light", Koyu: "dark" };

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
    // Her bileşen belgesinin başında "Projeye Al" (registry.json'dan). Kendi
    // docs.page'ini veren hikâye bunu ezer; kayıtta olmayan sayfada blok yok.
    // Belge kabı temayı izler; `lang: "tr"` Türkçe tireleme ve İ/ı dönüşümü için.
    docs: { page: DocsPageWithInstall, container: ThemedDocsContainer, lang: "tr" },
    options: {
      // Vitrin yüzü en üstte: önce bir arada görülen örnek tasarım ve vitrin,
      // sonra başlangıç, token'lar ve parça parça katalog.
      storySort: {
        order: [
          "Kapak",
          "Örnek Tasarım",
          ["Her Şey Bir Arada", "Desen Kütüphanesi", "Pusula Paneli", "Bileşen Kapsamı", "Referans Arşivi"],
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
      toolbar: { title: "Tema", icon: "mirror", items: [{ value: "light", title: "Açık", icon: "sun" }, { value: "dark", title: "Koyu", icon: "moon" }], dynamicTitle: true },
    },
    palette: {
      description: "Renk paleti",
      toolbar: { title: "Palet", icon: "paintbrush", items: [...PALETTES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light", palette: "signature" },
  decorators: [withMotion, withRootAttributes],
};

export default preview;
