import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/* Storybook'un kendi arayüzü de board dilinde: nötr gri, Inter, tek vurgu.
   Renkler burada SABİT yazılır: yönetici arayüzü şablonun CSS değişkenlerini
   görmez (ayrı belge). Değerler theme.css'teki açık sistem + signature. */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "dev-starter · board",
    brandUrl: "https://github.com/ahmetakyapi/dev-starter",
    fontBase: '"Inter", ui-sans-serif, system-ui, sans-serif',
    fontCode: '"JetBrains Mono", ui-monospace, monospace',
    colorPrimary: "#0d74c4",
    colorSecondary: "#0d74c4",
    appBg: "#f7f7f7",
    appContentBg: "#ffffff",
    appPreviewBg: "#ffffff",
    appBorderColor: "rgba(0,0,0,0.08)",
    appBorderRadius: 12,
    textColor: "#0a0a0a",
    textMutedColor: "#6b6b6b",
    textInverseColor: "#ffffff",
    barTextColor: "#525252",
    barSelectedColor: "#0d74c4",
    barHoverColor: "#0a5a9a",
    barBg: "#ffffff",
    inputBg: "#ffffff",
    inputBorder: "rgba(0,0,0,0.14)",
    inputTextColor: "#0a0a0a",
    inputBorderRadius: 10,
  }),
  sidebar: { showRoots: true },
});
