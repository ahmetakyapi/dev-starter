import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Hikayelerin `play` fonksiyonlarını ve a11y denetimini gerçek Chromium'da koşturur
 * (`npm run test:stories`). Hikaye listesi `.storybook/main.ts`ten gelir; test
 * ortamında (`SB_VITEST=1`) dışlanan klasörler orada tanımlıdır.
 *
 * Tarayıcı: CI'da `npx playwright install --with-deps chromium` ile gelir. Önceden
 * kurulu bir Chromium varsa yolu `SB_CHROMIUM` ile ver (ör. /opt/pw-browsers/chromium).
 * Dışlanan hikaye: dosyada `tags: ["!test"]` + `storybook/A11Y-DURUM.md` listesi.
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: {
          name: "storybook",
          // Her hikaye tek tek koşar: ağır sayfalar (Amiral, Pusula) için payı geniş tut.
          setupFiles: [".storybook/vitest.setup.ts"],
          testTimeout: 60_000,
          hookTimeout: 60_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: process.env.SB_CHROMIUM ? { executablePath: process.env.SB_CHROMIUM } : {},
              // Hareket azaltma AÇIK: giriş animasyonları ortasında ölçülen renk sahte
              // kontrast ihlali üretir (opaklık 0,3'teki metin #ccc görünür). Bileşenler
              // bu tercihe saygılı olduğu için durağan hal ölçülür ve koşu tekrarlanabilir.
              contextOptions: { reducedMotion: "reduce" },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
