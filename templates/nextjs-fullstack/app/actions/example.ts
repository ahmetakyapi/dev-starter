"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { emailSchema, formToObject, nameSchema, validate } from "@/lib/validation";

/**
 * Örnek sunucu eylemi: doğrulama + hız sınırı + alan hataları. Başlangıç
 * sayfasındaki formu besler; kendi eylemini yazınca bu dosyayı sil.
 */

const exampleSchema = z.object({ name: nameSchema, email: emailSchema });

export type ExampleState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Record<string, string>; values: Record<string, string> }
  | { status: "success"; message: string };

/** Dakikada beş deneme: insan için bol, döngüdeki betik için dar. */
const LIMIT = 5;
const WINDOW_MS = 60_000;

export async function submitExample(_prev: ExampleState, form: FormData): Promise<ExampleState> {
  const values = formToObject(form);

  const limited = rateLimit(`example:${clientIp(await headers())}`, LIMIT, WINDOW_MS);
  if (!limited.ok) {
    const seconds = Math.ceil(limited.retryAfterMs / 1000);
    return { status: "error", message: `Çok fazla deneme. ${seconds} saniye sonra tekrar dene.`, fieldErrors: {}, values };
  }

  const parsed = validate(exampleSchema, values);
  if (!parsed.ok) {
    return { status: "error", message: "Formda düzeltilecek alanlar var.", fieldErrors: parsed.fieldErrors, values };
  }

  // Gerçek iş burada: `db.insert(...)`, e-posta gönderimi vb.
  return { status: "success", message: `Teşekkürler ${parsed.data.name}, kayıt alındı.` };
}
