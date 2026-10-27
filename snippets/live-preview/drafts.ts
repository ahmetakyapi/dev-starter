import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentDrafts } from "@/lib/schema";

/*
 * Canlı önizlemenin taslakları (rules/live-preview.md). Düzenleyici yazdıkça form değerleri
 * buraya düşer; önizleme rotası önce bu oturumun taslağını, yoksa yayındaki kaydı okur.
 *
 * - Taslak AYRI tabloda: site bu tabloyu hiç okumaz, taslak canlıya sızamaz.
 * - Anahtar (key, session) çifti: iki sekmede aynı kaydı düzenlemek birbirini ezmez, dünden
 *   kalmış taslak bugün açılan düzenleyicinin önizlemesine karışmaz.
 * - Yayına girince clearDraft; unutulanları writeDraft bir günde kendisi süpürür.
 *
 * Şema (lib/schema.ts):
 *   export const contentDrafts = pgTable("content_drafts", {
 *     key: text("key").notNull(),
 *     session: text("session").notNull(),
 *     data: jsonb("data").notNull(),
 *     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
 *   }, (t) => [primaryKey({ columns: [t.key, t.session] }), index("content_drafts_updated_idx").on(t.updatedAt)]);
 */

const SESSION = /^[0-9a-f]{24}$/;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export const isDraftSession = (value: unknown): value is string => typeof value === "string" && SESSION.test(value);

/** "page:home", "post:<id>", "post:new:en": kapsam, kayıt (yeni kayıt "new"), isteğe bağlı dil. */
export const draftKey = (scope: string, id = "", lang?: string) => [scope, id || "new", lang].filter(Boolean).join(":");

/** Bu oturumun taslağı; yoksa (ya da tablo henüz yoksa) undefined: önizleme yayındakini çizer. */
export async function readDraft<T>(key: string, session: string | undefined): Promise<T | undefined> {
  if (!isDraftSession(session)) return undefined;
  try {
    const [row] = await db
      .select({ data: contentDrafts.data })
      .from(contentDrafts)
      .where(and(eq(contentDrafts.key, key), eq(contentDrafts.session, session)))
      .limit(1);
    return row?.data as T | undefined;
  } catch {
    return undefined;
  }
}

/** Taslağı yazar; siteyi değiştirmez, değişiklik geçmişine girmez. */
export async function writeDraft(key: string, session: string, data: unknown): Promise<void> {
  const now = new Date();
  await db
    .insert(contentDrafts)
    .values({ key, session, data, updatedAt: now })
    .onConflictDoUpdate({ target: [contentDrafts.key, contentDrafts.session], set: { data, updatedAt: now } });
  await db.delete(contentDrafts).where(lt(contentDrafts.updatedAt, new Date(now.getTime() - DRAFT_TTL_MS)));
}

/** Kayıt yayına girdi: bu oturumun taslağı kalkar, önizleme yayındaki hâle döner. */
export async function clearDraft(key: string, session: string): Promise<void> {
  await db.delete(contentDrafts).where(and(eq(contentDrafts.key, key), eq(contentDrafts.session, session)));
}

/**
 * Yayındaki kaydın üstüne taslağı serer. Yalnız kayıtta olan ve aynı türdeki alanlar geçer:
 * taslakta boşaltılmış alan önizlemede de boş görünür (yazanın gördüğü, kaydedince çıkacak olan).
 */
export function overlay<T extends Record<string, unknown>>(base: T, draft: Partial<Record<keyof T, unknown>> | undefined): T {
  if (!draft) return base;
  const out = { ...base };
  for (const key of Object.keys(base) as (keyof T)[]) {
    const value = draft[key];
    if (value !== undefined && (value === null || typeof value === typeof base[key])) out[key] = value as T[keyof T];
  }
  return out;
}
