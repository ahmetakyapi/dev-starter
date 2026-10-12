import assert from "node:assert/strict";
import { test } from "node:test";
import { parseActionResult, parseSponsoredItem } from "../components/feed/agent-feed-core";
import { demoFeed } from "../lib/feed-demo";
import {
  UNDO_WINDOW_MS,
  authorizeFeedAction,
  authorizeUndo,
  feedClock,
  rowToFeedItem,
  type FeedRow,
} from "../lib/feed-rules";

const NOW = new Date("2026-10-14T06:00:00Z");
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const KNOWN = new Set(["tasi"]);

const row = (overrides: Partial<FeedRow> = {}): FeedRow => ({
  id: "33333333-3333-4333-8333-333333333333",
  userId: OWNER,
  lane: "needs-you",
  priority: 3,
  item: {
    source: "Takvim",
    status: "Seni Bekliyor",
    title: "Toplantı çakışıyor",
    reason: "Müşteri ziyareti 13:30'a alındı.",
    body: { type: "text" },
    actions: [{ id: "tasi", label: "Perşembeye Taşı", emphasis: "primary", reversibility: "reversible" }],
  },
  undoToken: null,
  undoExpiresAt: null,
  dismissedAt: null,
  resolvedAt: null,
  summary: null,
  performedAction: null,
  createdAt: new Date("2026-10-14T05:02:00Z"),
  ...overrides,
});

test("rowToFeedItem: açık iş kart olur, saat kullanıcının diliminde", () => {
  const item = rowToFeedItem(row(), NOW);
  assert.equal(item?.lane, "needs-you");
  assert.equal(item?.timeLabel, "08:02");
  assert.equal(item?.actions.length, 1);
});

test("rowToFeedItem: kapanan iş 'handled' satırı olur, başlığı özettir, düğmesi yoktur", () => {
  const item = rowToFeedItem(
    row({ resolvedAt: NOW, summary: "Perşembeye taşıdım", undoToken: "t", undoExpiresAt: new Date(NOW.getTime() + 1000) }),
    NOW,
  );
  assert.equal(item?.lane, "handled");
  assert.equal(item?.title, "Perşembeye taşıdım");
  assert.deepEqual(item?.actions, []);
  assert.equal(item?.undoToken, "t");
});

test("rowToFeedItem: süresi dolan Geri Al istemciye gitmez", () => {
  const item = rowToFeedItem(row({ resolvedAt: NOW, summary: "x", undoToken: "t", undoExpiresAt: NOW }), NOW);
  assert.equal(item?.undoToken, undefined);
});

test("rowToFeedItem: bozuk JSON akışa girmez", () => {
  assert.equal(rowToFeedItem(row({ item: { title: "gerekçesiz" } }), NOW), null);
  assert.equal(rowToFeedItem(row({ item: "metin" }), NOW), null);
});

test("authorizeFeedAction: sahibi, açık iş, karttaki ve tanımlı aksiyon geçer", () => {
  const decision = authorizeFeedAction(row(), OWNER, "tasi", KNOWN, NOW);
  assert.equal(decision.ok, true);
});

test("authorizeFeedAction: başkasının öğesi ile olmayan öğe aynı cevabı alır", () => {
  const foreign = authorizeFeedAction(row(), OTHER, "tasi", KNOWN, NOW);
  const missing = authorizeFeedAction(undefined, OWNER, "tasi", KNOWN, NOW);
  assert.deepEqual(foreign, missing);
  assert.equal(foreign.ok, false);
});

test("authorizeFeedAction: kartta olmayan aksiyonu istemci uyduramaz", () => {
  const decision = authorizeFeedAction(row(), OWNER, "hesabi-sil", new Set(["tasi", "hesabi-sil"]), NOW);
  assert.deepEqual(decision, { ok: false, error: "Geçersiz aksiyon" });
});

test("authorizeFeedAction: işleyicisi yazılmamış aksiyon çalışmaz", () => {
  const decision = authorizeFeedAction(row(), OWNER, "tasi", new Set(), NOW);
  assert.equal(decision.ok, false);
});

test("authorizeFeedAction: kapanmış ya da ertelenmiş iş ikinci kez çalışmaz", () => {
  assert.equal(authorizeFeedAction(row({ resolvedAt: NOW }), OWNER, "tasi", KNOWN, NOW).ok, false);
  assert.equal(authorizeFeedAction(row({ dismissedAt: NOW }), OWNER, "tasi", KNOWN, NOW).ok, false);
});

test("authorizeUndo: doğru anahtar, sahibi ve açık pencere", () => {
  const closed = row({ resolvedAt: NOW, undoToken: "abc", undoExpiresAt: new Date(NOW.getTime() + UNDO_WINDOW_MS) });
  assert.equal(authorizeUndo(closed, OWNER, "abc", NOW), true);
  assert.equal(authorizeUndo(closed, OWNER, "abd", NOW), false);
  assert.equal(authorizeUndo(closed, OTHER, "abc", NOW), false);
  assert.equal(authorizeUndo(closed, OWNER, "abc", new Date(NOW.getTime() + UNDO_WINDOW_MS)), false);
});

test("parseActionResult: özetsiz başarı 'yapıldı' sayılmaz", () => {
  assert.deepEqual(parseActionResult({ ok: true }), { ok: false, error: "Sonuç okunamadı" });
});

test("parseSponsoredItem: aksiyon taşıyan reklam reddedilir", () => {
  const ad = { id: "a", sponsor: "S", title: "T", reason: "R", href: "https://example.com" };
  assert.ok(parseSponsoredItem(ad));
  assert.equal(parseSponsoredItem({ ...ad, actions: [] }), null);
});

test("demoFeed: bütün demo öğeleri sözleşmeden geçer", () => {
  assert.equal(demoFeed(NOW).length, 4);
});

test("feedClock: İstanbul saatiyle selam saati ve tarih", () => {
  assert.deepEqual(feedClock(NOW), { hour: 9, dateLabel: "Çarşamba, 14 Ekim" });
});
