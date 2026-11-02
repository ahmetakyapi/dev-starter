import { expect, waitFor } from "storybook/test";

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
const THEMES: Record<string, string> = { Açık: "light", Koyu: "dark" };

/**
 * Oynatma bitince a11y denetimi hemen koşar. Tema dekoratörü `data-theme`i
 * play BİTTİKTEN sonra yazıyor; koyu temada katmanlar önce açık renkle çizilip
 * `transition-colors` ile döner ve axe yarı geçişteki rengi okur. Araç
 * çubuğundaki seçimi (globals) önce uygular, belge zaman çizelgesindeki sonlu animasyonların bitmesini
 * bekler (spinner gibi sonsuz döngüler sayılmaz). Tema sabitlenmez.
 */
export async function settle(globals?: Record<string, unknown>) {
  const wanted = THEMES[String(globals?.theme ?? "")];
  if (wanted && document.documentElement.dataset.theme !== wanted) document.documentElement.dataset.theme = wanted;
  // Tam sayfa görüntü ve denetim sayfanın başından: play aşağı kaydırmış olabilir.
  window.scrollTo({ top: 0 });
  await frame();
  await frame();
  await waitFor(
    () =>
      expect(
        document
          .getAnimations()
          // Kaydırmaya bağlı animasyonlar (data-table'ın sağ kenar solması) zamanla bitmez; yalnız belge zaman çizelgesi.
          .filter((a) => a.timeline === document.timeline && a.playState === "running" && a.effect?.getTiming().iterations !== Infinity).length,
      ).toBe(0),
    { timeout: 4000 },
  );
}
