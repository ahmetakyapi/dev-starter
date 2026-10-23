"use server";

import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult } from "@/components/feed/agent-feed-core";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { currentFeedUser, findOwnFeedRow } from "@/lib/feed";
import { DEMO_SUMMARIES } from "@/lib/feed-demo";
import { FEED_HANDLERS, KNOWN_FEED_ACTIONS } from "@/lib/feed-handlers";
import { UNDO_WINDOW_MS, authorizeFeedAction, authorizeUndo } from "@/lib/feed-rules";
import { rateLimit } from "@/lib/rate-limit";
import { feedItems } from "@/lib/schema";
import { uuidSchema, validate } from "@/lib/validation";

/**
 * Akış kartlarının sunucu eylemleri. İstemci YALNIZCA öğe kimliği, aksiyon
 * kimliği ve (taslak kartında) düzenlenen metni gönderir. Ne yapılacağı,
 * kime yapılacağı sunucudaki satırdan okunur.
 *
 * Sıra her eylemde aynı: oturum → hız sınırı → girdi doğrulama → satırı
 * SAHİBİYLE birlikte oku → `feed-rules` karar verir → işi yap.
 *
 * Dönüş tipi `ActionResult`: istemci yine de `parseActionResult`tan geçirir
 * (tel üzerinde her şey `unknown`, rules/agentic-ui.md 5).
 */

const runSchema = z.object({
  itemId: uuidSchema,
  actionId: z.string().trim().min(1).max(64),
  draftText: z.string().max(10_000).optional(),
});

const undoSchema = z.object({ itemId: uuidSchema, undoToken: z.string().min(1).max(200) });

/** Dakikada otuz aksiyon: akışı hızla temizleyen insana bol, döngüdeki script'e dar. */
const LIMIT = 30;
const WINDOW_MS = 60_000;
/**
 * Erteleme ayrı kovada ve daha geniş: hızlı bir ayıklama (art arda "Şimdi
 * Değil") gerçek aksiyon bütçesini tüketmesin. İstemci bu eylemleri sonucunu
 * beklemeden çağırır; sınır yalnız döngüdeki script'i durdurmaya yetecek kadar.
 */
const DISMISS_LIMIT = 120;

const fail = (error: string): ActionResult => ({ ok: false, error });

export async function runFeedAction(input: unknown): Promise<ActionResult> {
  const user = await currentFeedUser();
  if (!user) return fail("Oturum gerekli");
  if (!rateLimit(`feed:${user.id}`, LIMIT, WINDOW_MS).ok) return fail("Çok hızlı; biraz sonra tekrar dene");

  const parsed = validate(runSchema, input);
  if (!parsed.ok) return fail("Geçersiz istek");
  const { itemId, actionId, draftText } = parsed.data;
  // Öğe yaratılırken boş taslak reddedilir (parseFeedItem); düzenleme yolu da
  // aynı kurala uyar. Şemada `.trim()` yok, bilerek: kullanıcının metni değişmez.
  if (draftText !== undefined && draftText.trim() === "") return fail("Taslak boş olamaz");

  const now = new Date();
  const row = await findOwnFeedRow(user.id, itemId);
  const decision = authorizeFeedAction(row, user.id, actionId, KNOWN_FEED_ACTIONS, now);
  if (!decision.ok) return fail(decision.error);
  const handler = FEED_HANDLERS[actionId];
  if (!row || !handler) return fail("Bu iş bulunamadı"); // authorize zaten eler; tip daraltma

  // ÖNCE SAHİPLEN: iki sekmeden aynı anda basılan düğme işi iki kez yapmasın.
  const [claimed] = await db
    .update(feedItems)
    .set({ resolvedAt: now })
    .where(and(eq(feedItems.id, row.id), eq(feedItems.userId, user.id), isNull(feedItems.resolvedAt)))
    .returning({ id: feedItems.id });
  if (!claimed) return fail("Bu iş zaten kapandı");

  let summary: string;
  try {
    ({ summary } = await handler.run({
      userId: user.id,
      row,
      draftText: decision.item.body.type === "draft" ? draftText : undefined,
    }));
  } catch (error) {
    console.error("feed action failed", { actionId, itemId, error });
    // İş yapılamadı: sahiplenmeyi geri bırak, kart yerinde kalsın.
    await db.update(feedItems).set({ resolvedAt: null }).where(eq(feedItems.id, row.id));
    return fail("İşlem tamamlanamadı");
  }

  // Geri alınamaz aksiyon işleyicisi `undo` taşımaz; o zaman anahtar da yok.
  const undoToken = handler.undo && decision.action.reversibility === "reversible" ? randomUUID() : null;
  try {
    await db
      .update(feedItems)
      .set({
        summary,
        performedAction: actionId,
        undoToken,
        undoExpiresAt: undoToken ? new Date(now.getTime() + UNDO_WINDOW_MS) : null,
      })
      .where(eq(feedItems.id, row.id));
  } catch (error) {
    // İş YAPILDI, yalnız kapanış kaydı yazılamadı. Burada hata dönmek istemciye
    // "tekrar dene" dedirtir: yapılmış (belki geri alınamaz, gönderilmiş) işi
    // tekrar ettirmeye çağırır. Anahtar kaydedilmediği için Geri Al sunulmaz.
    console.error("feed action bookkeeping failed", { actionId, itemId, error });
    return { ok: true, summary };
  }

  return { ok: true, summary, undoToken: undoToken ?? undefined };
}

export async function undoFeedAction(input: unknown): Promise<ActionResult> {
  const user = await currentFeedUser();
  if (!user) return fail("Oturum gerekli");
  if (!rateLimit(`feed:${user.id}`, LIMIT, WINDOW_MS).ok) return fail("Çok hızlı; biraz sonra tekrar dene");

  const parsed = validate(undoSchema, input);
  if (!parsed.ok) return fail("Geçersiz istek");

  const now = new Date();
  const row = await findOwnFeedRow(user.id, parsed.data.itemId);
  if (!row || !authorizeUndo(row, user.id, parsed.data.undoToken, now)) return fail("Geri alma süresi doldu");

  const handler = row.performedAction ? FEED_HANDLERS[row.performedAction] : undefined;
  if (!handler?.undo) return fail("Bu iş geri alınamıyor");

  // Anahtar ÖNCE atomik tüketilir (ana aksiyon yolundaki koşullu UPDATE
  // deseniyle aynı): iki sekmeden aynı anahtarla gelen iki istek yarışırsa
  // yalnız biri satırı yakalar, handler.undo (iade/iptal) bir kez koşar.
  // authorizeUndo yukarıda sabit sürede karşılaştırdı; buradaki SQL eşitliği
  // yalnız yarışı çözer. Handler düşerse anahtar bilinçli geri yazılmaz:
  // yarım kalmış bir geri almayı ikinci kez koşturmak, kaybetmekten pahalı.
  const [claimed] = await db
    .update(feedItems)
    .set({ undoToken: null, undoExpiresAt: null })
    .where(
      and(
        eq(feedItems.id, row.id),
        eq(feedItems.userId, user.id),
        eq(feedItems.undoToken, parsed.data.undoToken),
        gt(feedItems.undoExpiresAt, now),
      ),
    )
    .returning({ id: feedItems.id });
  if (!claimed) return fail("Geri alma süresi doldu");

  try {
    await handler.undo({ userId: user.id, row });
  } catch (error) {
    console.error("feed undo failed", { itemId: row.id, error });
    return fail("Geri alınamadı");
  }

  // Agent'ın kendi yaptığı iş (handled) satırda kalır ve geri alındığını söyler;
  // kullanıcının onayladığı iş karar beklemeye döner. İstemci reducer'ı aynısını yapar.
  const reopened = row.lane !== "handled";
  await db
    .update(feedItems)
    .set(
      reopened
        ? { resolvedAt: null, summary: null, performedAction: null }
        : { summary: `Geri alındı: ${row.summary ?? ""}`.trim() },
    )
    .where(eq(feedItems.id, row.id));

  return { ok: true, summary: "Geri alındı" };
}

/** "Şimdi Değil": erteleme. Satır silinmez; üretici bu sinyali sıralamada kullanır. */
export async function dismissFeedItem(input: unknown): Promise<void> {
  const user = await currentFeedUser();
  if (!user) return;
  if (!rateLimit(`feed-dismiss:${user.id}`, DISMISS_LIMIT, WINDOW_MS).ok) return;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return;
  await db
    .update(feedItems)
    .set({ dismissedAt: new Date() })
    .where(and(eq(feedItems.id, parsed.data), eq(feedItems.userId, user.id), isNull(feedItems.resolvedAt)));
}

/**
 * "Geri Al"ın sunucu ayağı: erteleme işareti kalkar. Bu olmadan Geri Al
 * yalnız istemci listesini düzeltiyordu; sayfa yenilenince öğe yine geçilmiş
 * sayılırdı. Kapanmış (resolved) satıra dokunulmaz.
 */
export async function undismissFeedItem(input: unknown): Promise<void> {
  const user = await currentFeedUser();
  if (!user) return;
  if (!rateLimit(`feed-dismiss:${user.id}`, DISMISS_LIMIT, WINDOW_MS).ok) return;
  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return;
  await db
    .update(feedItems)
    .set({ dismissedAt: null })
    .where(and(eq(feedItems.id, parsed.data), eq(feedItems.userId, user.id), isNull(feedItems.resolvedAt)));
}

/* ── Demo: yalnız geliştirmede, veritabanı ya da oturum yokken ───────────── */

function demoAllowed(): boolean {
  return env.NODE_ENV !== "production";
}

export async function runDemoFeedAction(input: unknown): Promise<ActionResult> {
  if (!demoAllowed()) return fail("Demo kapalı");
  const actionId = z.object({ actionId: z.string().max(64) }).safeParse(input);
  const summary = actionId.success ? DEMO_SUMMARIES[actionId.data.actionId] : undefined;
  if (!summary) return fail("Bu aksiyon demoda yok");
  // Gönderim geri alınamaz: demoda da Geri Al sunulmaz.
  return { ok: true, summary, undoToken: actionId.success && actionId.data.actionId === "gonder" ? undefined : "demo" };
}

export async function undoDemoFeedAction(): Promise<ActionResult> {
  if (!demoAllowed()) return fail("Demo kapalı");
  return { ok: true, summary: "Geri alındı" };
}

export async function dismissDemoFeedItem(): Promise<void> {}

export async function undismissDemoFeedItem(): Promise<void> {}
