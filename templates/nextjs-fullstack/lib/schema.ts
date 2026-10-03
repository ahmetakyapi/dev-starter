import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
