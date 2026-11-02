/**
 * Devre dışı denetimlerin soluk metni WCAG 1.4.3'ten muaftır ("inactive user
 * interface component"); axe bunu `disabled` özniteliği olmayan etiket ve
 * çiplerde bilemez. Yalnız `data-a11y-disabled` işaretli alt ağaçta kontrast
 * kuralı susar; sayfanın geri kalanı denetlenmeye devam eder.
 */
export const DISABLED_CONTRAST_EXEMPT = {
  a11y: {
    config: {
      rules: [{ id: "color-contrast", selector: "*:not([data-a11y-disabled] *)" }],
    },
  },
} as const;

/**
 * Oynatma bitince süren CSS geçişlerini (tema değişimi, `transition-colors`)
 * bekler. a11y denetimi hemen ardından koşar; yarıda yakalanan renk
 * (koyu zeminde açık temanın metni) gerçek olmayan kontrast ihlali üretir.
 * Sonsuz animasyonlar beklenmez.
 */
export async function settle() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const running = document
    .getAnimations()
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
}
