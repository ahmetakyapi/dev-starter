import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { useEffect } from "react";
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

/* Palet `<html data-palette>` üzerinde olmalı: palet blokları `:root[...]`
   seçicisiyle yazılı, alt öğede işe yaramaz (ölçüldü). */
const withPalette: Decorator = (Story, context) => {
  const palette = (context.globals.palette as string) ?? "signature";
  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);
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
      storySort: { order: ["Giriş", "Tema", "Bileşenler", "Grafikler", "Bloklar", "Ekranlar"] },
    },
  },
  globalTypes: {
    palette: {
      description: "Renk paleti",
      toolbar: { title: "Palet", icon: "paintbrush", items: [...PALETTES], dynamicTitle: true },
    },
  },
  initialGlobals: { palette: "signature" },
  decorators: [
    withMotion,
    withPalette,
    withThemeByDataAttribute({
      themes: { Açık: "light", Koyu: "dark" },
      defaultTheme: "Açık",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
