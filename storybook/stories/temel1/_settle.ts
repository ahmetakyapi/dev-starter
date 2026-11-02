import { expect, waitFor } from "storybook/test";

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
const THEMES: Record<string, string> = { Açık: "light", Koyu: "dark" };

/**
 * Katman yerine oturana kadar bekler; a11y eklentisi play'in hemen ardından çalışır.
 *  1. Tema: tema dekoratörü (`withThemeByDataAttribute`) `data-theme`i play BİTTİKTEN sonra
 *     yazıyor (ölçüldü: play süresince öznitelik yok). Koyu temada açık katman önce açık
 *     renklerle çiziliyor, sonra `transition-colors` ile koyuya dönüyor; axe yarı geçişteki
 *     rengi okuyup sahte kontrast ihlali buluyordu. Burada araç çubuğundaki seçimi (globals)
 *     dekoratörden önce uygularız; değer aynı, tema sabitlenmez.
 *  2. Çalışan geçişler (opaklık, ölçek, renk) biter. Sonsuz döngüler (spinner) sayılmaz.
 */
export async function settle(globals?: Record<string, unknown>) {
  const wanted = THEMES[String(globals?.theme ?? "")];
  if (wanted && document.documentElement.dataset.theme !== wanted) document.documentElement.dataset.theme = wanted;
  await frame();
  await frame();
  await waitFor(
    () =>
      expect(
        document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity).length,
      ).toBe(0),
    { timeout: 3000 },
  );
}
