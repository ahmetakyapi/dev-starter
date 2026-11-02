/**
 * Oynatma bitince süren CSS geçişlerini (tema, `transition-colors`, katman
 * girişi) bekler; a11y denetimi hemen ardından koşar ve yarıda yakalanan
 * renk sahte kontrast ihlali üretir. Sonsuz animasyonlar (spinner) sayılmaz.
 */
export async function settle() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const running = document
    .getAnimations()
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
}

/**
 * Devre dışı denetimlerin soluk metni WCAG 1.4.3'ten muaf ("inactive user
 * interface component"); axe bunu `disabled` özniteliği olmayan etiket ve
 * kaplarda bilemez. Yalnız `data-a11y-disabled` alt ağacında kontrast susar.
 */
export const DISABLED_CONTRAST_EXEMPT = {
  a11y: {
    config: {
      rules: [{ id: "color-contrast", selector: "*:not([data-a11y-disabled] *)" }],
    },
  },
} as const;
