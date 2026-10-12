import { timingSafeEqual } from "node:crypto";
import { parseFeedItem, type FeedAction, type FeedItem } from "@/components/feed/agent-feed-core";

/**
 * AI akışının sunucu kuralları. SAF: veritabanına, oturuma ve saate
 * dokunmaz (saat parametre). `tests/feed.test.ts` hepsini modelsiz ve
 * veritabanısız sabitler.
 *
 * Neden ayrı dosya: yetki kararı burada, tek yerde verilir. Sunucu eylemi
 * (`app/akis/actions.ts`) yalnızca satırı okur, bu fonksiyona sorar ve
 * cevaba uyar. Model ya da istemci yetki kararı vermez (rules/agentic-ui.md 1, 2).
 */

/** Veritabanı satırının bu dosyanın ihtiyaç duyduğu kısmı (`FeedItemRow` ile uyumlu). */
export type FeedRow = {
  id: string;
  userId: string;
  lane: "needs-you" | "suggestion" | "handled";
  priority: number;
  item: unknown;
  undoToken: string | null;
  undoExpiresAt: Date | null;
  dismissedAt: Date | null;
  resolvedAt: Date | null;
  summary: string | null;
  performedAction: string | null;
  createdAt: Date;
};

/** Geri Al penceresi. Süre istemcide değil burada dolar. */
export const UNDO_WINDOW_MS = 10 * 60_000;

/** Kapanan iş akışta bu kadar süre "halledildi" satırı olarak kalır. */
export const HANDLED_VISIBLE_MS = 24 * 60 * 60_000;

/** Kullanıcı başına saat dilimi gelene kadar tek varsayılan. */
export const FEED_TIME_ZONE = "Europe/Istanbul";

const timeFormat = (timeZone: string) =>
  new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });

export function undoOpen(row: Pick<FeedRow, "undoToken" | "undoExpiresAt">, now: Date): boolean {
  return Boolean(row.undoToken && row.undoExpiresAt && row.undoExpiresAt.getTime() > now.getTime());
}

/**
 * Satır → istemciye giden öğe. Bozuk `item` JSON'u `null` döner ve akışa
 * girmez: yarım kart çizmektense hiç çizme. Kapanmış iş `handled` kulvarına
 * düşer, başlığı kapanış özetidir ve düğmesi yoktur.
 */
export function rowToFeedItem(row: FeedRow, now: Date, timeZone = FEED_TIME_ZONE): FeedItem | null {
  const stored = typeof row.item === "object" && row.item !== null ? row.item : {};
  const closed = row.resolvedAt !== null;
  return parseFeedItem({
    ...stored,
    id: row.id,
    lane: closed ? "handled" : row.lane,
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
    timeLabel: timeFormat(timeZone).format(row.createdAt),
    ...(closed
      ? {
          title: row.summary ?? (stored as { title?: unknown }).title,
          actions: [],
          undoToken: undoOpen(row, now) ? row.undoToken : undefined,
        }
      : {}),
  });
}

export type Authorized = { ok: true; item: FeedItem; action: FeedAction } | { ok: false; error: string };

/**
 * Bu kullanıcı bu öğede bu aksiyonu çalıştırabilir mi?
 *
 * Başkasının öğesi ile var olmayan öğe AYNI cevabı alır: kimlik tahmin
 * eden biri hangi kimliklerin var olduğunu öğrenemez.
 */
export function authorizeFeedAction(
  row: FeedRow | undefined,
  userId: string,
  actionId: string,
  knownActions: ReadonlySet<string>,
  now: Date,
): Authorized {
  if (!row || row.userId !== userId) return { ok: false, error: "Bu iş bulunamadı" };
  if (row.resolvedAt || row.dismissedAt) return { ok: false, error: "Bu iş zaten kapandı" };

  const item = rowToFeedItem(row, now);
  if (!item) return { ok: false, error: "Bu iş okunamadı" };

  // Düğme kartta yoksa istemci onu uyduramaz: liste sunucudaki öğeden okunur.
  const action = item.actions.find((a) => a.id === actionId);
  if (!action) return { ok: false, error: "Geçersiz aksiyon" };
  if (!knownActions.has(actionId)) return { ok: false, error: "Bu aksiyon henüz tanımlı değil" };

  return { ok: true, item, action };
}

/** Geri Al: sahibi, açık pencere ve sabit sürede karşılaştırılan anahtar. */
export function authorizeUndo(row: FeedRow | undefined, userId: string, token: string, now: Date): boolean {
  if (!row || row.userId !== userId || !row.resolvedAt || !row.undoToken) return false;
  if (!undoOpen(row, now)) return false;
  const expected = Buffer.from(row.undoToken);
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Selamlama ve tarih satırı için saat ve "Salı, 14 Ekim", kullanıcının saat diliminde. */
export function feedClock(now: Date, timeZone = FEED_TIME_ZONE): { hour: number; dateLabel: string } {
  const parts = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { hour: Number(part("hour")), dateLabel: `${part("weekday")}, ${part("day")} ${part("month")}` };
}
