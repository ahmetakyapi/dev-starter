import { z } from "zod";

/**
 * Ortam değişkenleri: tek doğrulama, iki yüz.
 *
 * BOŞ DİZGİ = TANIMSIZ. Vercel ve `vercel env pull` bir değişkeni tanımlı
 * ama boş bırakabiliyor; `.env.example`ten kopyalanan dosya da öyle.
 * `??` boş dizgide devreye girmez ve `new URL("")` gibi bir çağrı bütün
 * build'i nedeni söylemeyen bir hatayla düşürür. Burada boş dizgi en baştan
 * `undefined` sayılıyor.
 *
 * KAÇIŞ: `SKIP_ENV_VALIDATION=1` doğrulamayı atlar (CI derlemesi, Docker
 * imajı). Değerler yine okunur ve boş dizgi yine tanımsız sayılır.
 *
 * `next.config.ts` bu modülü içe aktarır: eksik bir değişken derlemenin ilk
 * saniyesinde yakalanır, ilk istekte değil.
 */

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(blankToUndefined, z.string().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

/*
 * Yalnızca http(s): zod'un `z.url()`ı her şemayı kabul eder; "localhost:3000"
 * (`localhost:` şeması sanılır) ya da "ftp://..." geçer ve kanonik adres,
 * site haritası, OG olarak yayına çıkardı. `DATABASE_URL` `postgres://` olduğu
 * için genel `optionalUrl`de kalır.
 */
const optionalHttpUrl = z.preprocess(blankToUndefined, z.url({ protocol: /^https?$/ }).optional());

export const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: optionalUrl,
    AUTH_SECRET: optionalString,
    AUTH_GITHUB_ID: optionalString,
    AUTH_GITHUB_SECRET: optionalString,
    CRON_SECRET: optionalString,
  })
  .superRefine((env, ctx) => {
    // Auth.js üretimde anahtarsız oturum imzalayamaz; ilk girişte değil
    // açılışta düşmesi daha iyi.
    if (env.NODE_ENV === "production" && !env.AUTH_SECRET) {
      ctx.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "üretimde zorunlu" });
    }
    // Sağlayıcı yarım tanımlıysa giriş düğmesi görünür ama çalışmaz.
    if (Boolean(env.AUTH_GITHUB_ID) !== Boolean(env.AUTH_GITHUB_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GITHUB_SECRET"],
        message: "AUTH_GITHUB_ID ile birlikte tanımlanmalı",
      });
    }
  });

export const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalHttpUrl,
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

type Source = Record<string, string | undefined>;

function shouldSkip(source: Source): boolean {
  const flag = source.SKIP_ENV_VALIDATION;
  return flag === "1" || flag === "true";
}

/** Doğrulamadan geçirmeden yalnızca boş dizgileri ayıklar (kaçış yolu). */
function looseParse<T>(schema: z.ZodObject, source: Source): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(schema.shape)) out[key] = blankToUndefined(source[key]);
  return out as T;
}

function parseWith<T>(schema: z.ZodType<T>, source: Source, label: string): T {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`${label} ortam değişkenleri geçersiz:\n${lines.join("\n")}`);
}

export function parseServerEnv(source: Source): ServerEnv {
  if (shouldSkip(source)) {
    const loose = looseParse<ServerEnv>(serverSchema, source);
    return { ...loose, NODE_ENV: loose.NODE_ENV ?? "development" };
  }
  return parseWith(serverSchema, source, "Sunucu");
}

export function parseClientEnv(source: Source): ClientEnv {
  if (shouldSkip(source)) return looseParse<ClientEnv>(clientSchema, source);
  return parseWith(clientSchema, source, "İstemci");
}

/**
 * Üretim DERLEMESİNDE site adresi zorunlu. Yoksa `lib/site.ts` sessizce
 * http://localhost:3000'e düşer; kanonik adres, site haritası, robots, OG ve
 * JSON-LD onunla yayına çıkar, derleme yine yeşil biter (mistakes.md #100
 * sınıfı: kendi sunucunda değişkeni unutmak ya da yanlış sekmeye koymak).
 * Vercel'de üretim alan adı yeter.
 *
 * Şemada değil burada, çünkü yalnızca `next build`te çağrılır
 * (next.config.ts → PHASE_PRODUCTION_BUILD): değer derlemede gömülür,
 * `next start` ortamında olmaması hata değildir.
 */
export function assertSiteUrlForBuild(source: Source): void {
  if (shouldSkip(source)) return;
  const candidates = [
    source.NEXT_PUBLIC_SITE_URL,
    source.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    source.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  if (candidates.some((value) => blankToUndefined(value) !== undefined)) return;
  throw new Error(
    "NEXT_PUBLIC_SITE_URL üretim derlemesinde zorunlu: yoksa kanonik adres ve site haritası " +
      "localhost'a düşer. Yerel deneme için .env.local'a NEXT_PUBLIC_SITE_URL=http://localhost:3000, " +
      "CI derlemesinde SKIP_ENV_VALIDATION=1.",
  );
}

/**
 * İstemci değişkenleri ADIYLA okunur. Next `NEXT_PUBLIC_*` değerlerini
 * derlemede yalnızca `process.env.AD` biçimini gördüğü yerde gömer;
 * `process.env` nesnesini toptan geçirmek tarayıcıda boş nesne verir.
 */
export const clientEnv: ClientEnv = parseClientEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
});

const isServer = typeof window === "undefined";

/**
 * Sunucu değişkenleri. Tarayıcıda okunmaya çalışılırsa sessizce `undefined`
 * dönmek yerine fırlatır: bir sırrın istemciye sızmaya çalıştığı yer
 * derleme çıktısında değil, ilk denemede görünür olur.
 */
export const env: ServerEnv = isServer
  ? parseServerEnv(process.env)
  : new Proxy({} as ServerEnv, {
      get(_target, prop) {
        throw new Error(`Sunucu ortam değişkeni istemcide okunamaz: ${String(prop)}`);
      },
    });
