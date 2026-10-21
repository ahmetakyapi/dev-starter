import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { parseFeedItem, type FeedItem } from "@/components/feed/agent-feed-core";
import { db } from "./db";
import { env } from "./env";
import { FEED_HANDLERS } from "./feed-handlers";
import { HANDLED_VISIBLE_MS, rowToFeedItem } from "./feed-rules";
import { feedItems, users, type FeedItemRow } from "./schema";

/**
 * AI akışının veri katmanı. Yetki kuralları `feed-rules.ts`te (saf, testli);
 * burası yalnızca okur ve yazar.
 *
 * ÜRETİCİ: akışa öğeyi bir cron ucu ya da webhook yazar (`addFeedItem`).
 * Tespit KURALDIR (çakışan toplantı, cevapsız e-posta, yeni rapor); model
 * yalnızca metni yazar (taslak, başlık, gerekçe). Öncelik ve kulvar koddan
 * gelir. Örnek uç: `app/api/cron/...` + `rejectUnauthorized(req, env.CRON_SECRET)`.
 */

export type FeedUser = { id: string; firstName: string };

/**
 * Oturumdaki kullanıcının `users` satırı. Auth.js burada JWT kullanıyor ve
 * oturumda veritabanı kimliği yok; e-postayla eşleşir. Giriş yapan kullanıcı
 * tabloda yoksa (`auth.ts` → `callbacks.signIn` upsert'i yazılmadıysa) akış boş.
 */
export async function currentFeedUser(): Promise<FeedUser | null> {
  // AUTH_SECRET yokken Auth.js oturum çözemez; sorup hata almak yerine "yok" de.
  if (!env.AUTH_SECRET) return null;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const [row] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);
  if (!row) return null;
  return { id: row.id, firstName: (row.name ?? email.split("@")[0] ?? "").split(" ")[0] ?? "" };
}

/**
 * Açık işler + son 24 saatte kapananlar; geçilenler hariç.
 *
 * Tavan bu sıradan SONRA uygulanır: önce açık iş (Postgres'te false < true),
 * sonra öncelik, sonra yenilik. Yalnız yeniliğe göre kesseydik gece yazılan
 * elli "halledildi" satırı, kullanıcıyı bekleyen eski bir kararı akıştan sessizce
 * düşürürdü. İstemci yine kulvar ve önceliğe göre dizer.
 */
export async function getFeed(userId: string, now: Date): Promise<FeedItem[]> {
  const since = new Date(now.getTime() - HANDLED_VISIBLE_MS);
  const rows = await db
    .select()
    .from(feedItems)
    .where(
      and(
        eq(feedItems.userId, userId),
        isNull(feedItems.dismissedAt),
        or(isNull(feedItems.resolvedAt), gt(feedItems.resolvedAt, since)),
      ),
    )
    .orderBy(sql`${feedItems.resolvedAt} is not null`, desc(feedItems.priority), desc(feedItems.createdAt))
    .limit(50);
  return rows.map((row) => rowToFeedItem(row, now)).filter((item): item is FeedItem => item !== null);
}

export async function findOwnFeedRow(userId: string, id: string): Promise<FeedItemRow | undefined> {
  const [row] = await db
    .select()
    .from(feedItems)
    .where(and(eq(feedItems.id, id), eq(feedItems.userId, userId)))
    .limit(1);
  return row;
}

export type NewFeedItem = Omit<FeedItem, "id" | "createdAt" | "timeLabel" | "undoToken">;

export type AddFeedItemOptions = {
  /** Aksiyonun gerçek girdisi (alıcı, takvim kimliği). İstemciye gitmez. */
  payload?: Record<string, unknown>;
  /**
   * Yalnız `handled` kulvarı: ajanın kendi yaptığı işin işleyici adı.
   * İşleyicinin `undo`su varsa kart Geri Al sunar.
   */
  performedAction?: string;
};

/**
 * Üreticinin tek yazma yolu. Öğe yazılmadan ÖNCE istemcinin göreceği
 * şekliyle doğrulanır: gerekçesiz, aksiyonsuz ya da bozuk aksiyonlu öğe
 * tabloya hiç girmez.
 *
 * `handled`: ajan işi KENDİSİ yaptı. Yalnız geri alınabilir iş buraya
 * yazılır (rules/agentic-ui.md 4); geri alınamaz iş `needs-you` kartıdır.
 */
export async function addFeedItem(userId: string, input: NewFeedItem, options: AddFeedItemOptions = {}) {
  const now = new Date();
  const checked = parseFeedItem({ ...input, id: "yeni", createdAt: now.toISOString() });
  if (!checked) throw new Error("Akış öğesi geçersiz: gerekçe, kulvar ve aksiyonları kontrol et.");
  // Tabloya yalnızca görünüm alanları yazılır; kimlik, zaman ve Geri Al anahtarı sütunlardan gelir.
  const { lane, priority, source, status, title, reason, body, actions } = checked;
  const item = { source, status, title, reason, body, actions };

  const handled = lane === "handled";
  const undoable = handled && options.performedAction && FEED_HANDLERS[options.performedAction]?.undo;

  const [row] = await db
    .insert(feedItems)
    .values({
      userId,
      lane,
      priority,
      item,
      payload: options.payload ?? {},
      ...(handled ? { resolvedAt: now, summary: item.title, performedAction: options.performedAction ?? null } : {}),
      // Ajanın gece yaptığı iş sabah görülür: Geri Al penceresi görünür kaldığı süre kadar.
      ...(undoable ? { undoToken: randomUUID(), undoExpiresAt: new Date(now.getTime() + HANDLED_VISIBLE_MS) } : {}),
    })
    .returning({ id: feedItems.id });
  return row;
}
