import { defineConfig } from "drizzle-kit";

/* drizzle-kit `.env.local`i kendiliğinden okumaz. Node 20.12+ dosyayı
   bağımlılıksız yükler; dosya yoksa (CI) ortamdaki değer kullanılır. */
try {
  process.loadEnvFile?.(".env.local");
} catch {
  // Dosya yok: değişken ortamdan gelmeli.
}

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
