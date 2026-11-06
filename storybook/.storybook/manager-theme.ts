import { create } from "storybook/theming";
import { palettes, roles } from "../../packages/@ahmet/theme/tokens";

/**
 * Yönetici (sidebar, araç çubuğu, belge) teması: açık ve koyu, ikisi de
 * `tokens.ts`ten. Önceden burada elle yazılmış hex kopyası vardı; token
 * değişince Storybook'un kabuğu bayat kalıyordu (tek kaynak ilkesi).
 *
 * Storybook teması CSS değişkeni kabul etmez: seçili satırı `polished`
 * `darken()` ile hesaplar, `var()` görünce hata verir (SB 10.6.3
 * manager/runtime.js). Bu yüzden değerler JS'te çözülmüş hex. Seçili satırın
 * asıl görünüşü (yıkama + mürekkep + sol çizgi) manager-head.html'de, paletle
 * döner; buradaki `colorSecondary` yalnız Storybook'un kendi bağlantıları.
 *
 * Token'da karşılığı olmayan iki değer adlı sabit:
 */
const DARK_SECONDARY = "#2f9be8"; // #35b8ff seçili satırda darken(0.18) → beyaz metin 3,66:1 (AA değil); bu 5,73:1
const DARK_CONTENT = "#141416"; // koyu belge zemini: sayfadan bir ton yukarı (ton farkı)

const L = roles.light;
const D = roles.dark;
const SL = palettes.signature.light;
const SD = palettes.signature.dark;

const font = {
  fontBase: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
};

/** Marka: logo karosu + iki satır. Karonun degradesi marka karosu (degradenin üç yerinden biri). */
const brand = {
  brandTitle: `<span class="ds-mark"><span class="ds-mark__tile" aria-hidden="true"></span><span><span class="ds-mark__name">dev-starter</span><span class="ds-mark__meta">görsel katalog</span></span></span>`,
  brandUrl: "./?path=/story/cover--overview",
  brandTarget: "_self",
};

export const lightTheme = create({
  base: "light",
  ...font,
  ...brand,
  colorPrimary: SL.primary,
  colorSecondary: SL.primary,
  appBg: "#f7f7f7",
  appContentBg: L.pageBg,
  appPreviewBg: L.pageBg,
  appHoverBg: "#efefef",
  appBorderColor: "rgba(0,0,0,0.08)",
  appBorderRadius: 10,
  textColor: L.textStrong,
  textMutedColor: L.textMuted,
  textInverseColor: "#ffffff",
  barBg: L.pageBg,
  barTextColor: L.textBody,
  barHoverColor: SL.primaryHover,
  barSelectedColor: SL.primary,
  buttonBg: L.pageBg,
  buttonBorder: "rgba(0,0,0,0.14)",
  booleanBg: "#ebebeb",
  booleanSelectedBg: L.pageBg,
  inputBg: L.pageBg,
  inputBorder: "rgba(0,0,0,0.14)",
  inputTextColor: L.textStrong,
  inputBorderRadius: 8,
  gridCellSize: 12,
});

export const darkTheme = create({
  base: "dark",
  ...font,
  ...brand,
  colorPrimary: SD.primary,
  colorSecondary: DARK_SECONDARY,
  appBg: D.pageBg,
  appContentBg: DARK_CONTENT,
  appPreviewBg: D.pageBg,
  appHoverBg: "#1d1d20",
  appBorderColor: "rgba(255,255,255,0.08)",
  appBorderRadius: 10,
  textColor: D.textStrong,
  textMutedColor: D.textMuted,
  textInverseColor: "#0a0a0a",
  barBg: DARK_CONTENT,
  barTextColor: D.textBody,
  barHoverColor: SD.primaryHover,
  barSelectedColor: SD.primary,
  buttonBg: "#18181a",
  buttonBorder: "rgba(255,255,255,0.12)",
  booleanBg: D.pageBg,
  booleanSelectedBg: "#232326",
  inputBg: D.pageBg,
  inputBorder: "rgba(255,255,255,0.12)",
  inputTextColor: D.textStrong,
  inputBorderRadius: 8,
  gridCellSize: 12,
});

export const THEMES = { light: lightTheme, dark: darkTheme } as const;

/**
 * Sidebar seçiminin, odak halkasının ve marka karosunun palet değişkenleri:
 * 10 palet × 2 tema, `tokens.ts`ten üretilir (elle blok yok).
 */
export function paletteCss(): string {
  return Object.entries(palettes)
    .flatMap(([name, p]) =>
      (["light", "dark"] as const).map(
        (mode) =>
          `:root[data-palette="${name}"][data-theme="${mode}"]{--ds-ink:${p[mode].primaryInk};--ds-wash:${p[mode].primaryWash};--ds-tile:${p[mode].brandGradient};}`,
      ),
    )
    .join("\n");
}
