import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/* Next 16'da `next lint` yok; ESLint doğrudan çalışır ("lint": "eslint").
   Kurallar Next'in iki hazır kümesinden gelir, şablon kendi kuralını eklemez:
   bir kural rahatsız ediyorsa önce sorunu düzelt, `eslint-disable` yazma. */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Açıklayıcı figürler (anatomy kiti, scripts/add-figure-kit.mjs) bilinçli
    // olarak React'in dışında hareket eder: kare başına ref'e yazar, yeniden
    // çizmez. react-hooks 7'nin derleyici kuralları bu deseni hata sayar
    // (mistakes.md #98). Kapsam yalnız figür dizinleri; React Compiler
    // açılırsa figürün canlı bileşenine "use no memo" yazılır.
    files: ["components/iso/**", "components/figures/**"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      // lathe.mjs (--lathe ile kopyalanan kit) kısa devre ifadesi kullanıyor.
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "drizzle/**", "next-env.d.ts"]),
]);

export default eslintConfig;
