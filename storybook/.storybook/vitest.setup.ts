import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as projectAnnotations from "./preview";

// Hikayeler preview.tsx'in kök ayarlarıyla (dekoratörler, a11y) çizilir.
setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
  {
    // Bileşen hikayeleri sayfa parçasıdır: sayfa düzeyi sıra kuralları (başlık sırası,
    // aynı adlı bölge) tek başına anlamsız ve galerilerde aynı bölge tekrar ediyor.
    // Gerçek sayfa ekranlarında bu iki kural elle denetlenir (guides/10 § 6).
    parameters: { a11y: { config: { rules: [{ id: "heading-order", enabled: false }, { id: "landmark-unique", enabled: false }] } } },
  },
]);

/**
 * Yalnız Vitest koşusu: geçişler ve animasyonlar neredeyse anında biter. Axe renk
 * kontrastını `play` biter bitmez ölçer; 150-600 ms'lik `transition-colors` ya da
 * giriş animasyonunun ORTASINDAKİ renk (ör. #fdfdfd metin, 1,01:1) sahte ihlal
 * üretiyordu. Süre sıfıra yakın tutulur (sıfır değil): `animation-fill-mode` ve
 * `transitionend` dinleyen kodlar yine tetiklenir, hikayede görünen son hal ölçülür.
 */
const style = document.createElement("style");
style.textContent = `*, *::before, *::after {
  transition-duration: 1ms !important;
  transition-delay: 0s !important;
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  scroll-behavior: auto !important;
}`;
document.head.append(style);
