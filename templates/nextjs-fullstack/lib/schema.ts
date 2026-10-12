import { index, jsonb, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Şema. Kural: her yabancı anahtar `onDelete` davranışını AÇIKÇA söyler;
 * varsayılan (`no action`) silmeyi sessizce engeller ve hatası çok sonra,
 * bir hesap silinmek istendiğinde çıkar.
 *
 * Şema değişince: `npm run db:generate` YENİ bir migration dosyası üretir.
 * Uygulanmış bir migration'ı asla düzenleme.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** Yabancı anahtar örneği. Projeye göre yeniden adlandır ya da sil. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Kullanıcı silinince notları da gider; sahipsiz satır kalmaz.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("notes_user_id_idx").on(table.userId)],
);

/**
 * AI akışı (`/akis`, `lib/feed.ts`). Bir satır = kullanıcıya hazırlanmış bir iş.
 *
 * `item` istemciye giden görünümdür (başlık, gerekçe, taslak, düğmeler);
 * `payload` aksiyonun GERÇEK girdisidir (alıcı adresi, takvim kimliği) ve
 * istemciye hiç gitmez. Sunucu aksiyonu çalıştırırken alıcıyı istemciden
 * değil buradan okur.
 */
export const feedItems = pgTable(
  "feed_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lane: text("lane", { enum: ["needs-you", "suggestion", "handled"] }).notNull(),
    priority: smallint("priority").notNull().default(0),
    item: jsonb("item").notNull(),
    payload: jsonb("payload").notNull().default({}),
    // Geri Al: tek kullanımlık anahtar ve son kullanma anı. Süre SUNUCUDA dolar.
    undoToken: text("undo_token"),
    undoExpiresAt: timestamp("undo_expires_at", { withTimezone: true }),
    // "Şimdi Değil" bir ertelemedir: satır silinmez, üretici bu sinyali okur.
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    // Kapanınca gösterilen tek satır ("Toplantıyı perşembeye taşıdım") ve onu
    // yapan aksiyon; Geri Al doğru işleyiciyi buradan bulur.
    summary: text("summary"),
    performedAction: text("performed_action"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("feed_items_user_open_idx").on(table.userId, table.resolvedAt)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type FeedItemRow = typeof feedItems.$inferSelect;
export type NewFeedItemRow = typeof feedItems.$inferInsert;
