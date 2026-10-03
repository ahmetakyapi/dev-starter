import { z } from "zod";

/**
 * Sunucu eylemi ve rota girdisinin çalışma zamanı doğrulaması.
 *
 * "use server" fonksiyonunun TypeScript imzası çalışma zamanında silinir;
 * yükü istemci belirler. `count: 1 | 2 | 3` hiçbir şey garanti etmez, oraya
 * `-1_000_000` de gelir. İstemciden okunan her sayı, kimlik ve serbest metin
 * önce buradan geçer.
 */

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

export function validate<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    // Alan başına İLK hata: aynı alanda üç mesaj okunmaz.
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: result.error.issues[0]?.message ?? "Geçersiz giriş.", fieldErrors };
}

/** FormData'yı düz nesneye çevirir; aynı addan birden fazla değer varsa sonuncusu. */
export function formToObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

// Ortak şemalar: mesajlar cümle olduğu için cümle düzeninde.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-posta çok uzun.")
  .pipe(z.email({ message: "Geçerli bir e-posta gir." }));

export const nameSchema = z
  .string()
  .trim()
  .min(2, "İsim en az 2 karakter olmalı.")
  .max(60, "İsim en fazla 60 karakter olabilir.");

export const uuidSchema = z.uuid({ message: "Geçersiz kimlik." });
