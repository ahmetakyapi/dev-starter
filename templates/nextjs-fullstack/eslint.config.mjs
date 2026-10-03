import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/* Next 16'da `next lint` yok; ESLint doğrudan çalışır ("lint": "eslint").
   Kurallar Next'in iki hazır kümesinden gelir, şablon kendi kuralını eklemez:
   bir kural rahatsız ediyorsa önce sorunu düzelt, `eslint-disable` yazma. */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "drizzle/**", "next-env.d.ts"]),
]);

export default eslintConfig;
