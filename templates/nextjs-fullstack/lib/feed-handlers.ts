import type { FeedItemRow } from "./schema";

/**
 * Akış aksiyonlarının GERÇEK işi. Kartın düğmesi `actionId` taşır; burada
 * o kimliğe bir işleyici yoksa aksiyon reddedilir (`authorizeFeedAction`).
 *
 * İşleyici girdisini `row.payload`tan okur, istemciden değil: alıcı adresi,
 * takvim kimliği, tutar hep sunucudaki satırda. İstemciden gelen tek serbest
 * alan `draftText`tir (kullanıcının düzenlediği taslak) ve yalnız taslak
 * kartlarında anlamlıdır.
 *
 * `undo` varsa Geri Al sunulur. Geri alınamaz iş (e-posta gönderimi, ödeme)
 * `undo` TAŞIMAZ ve kartta `reversibility: "irreversible"` ile işaretlenir.
 *
 * Yeni aksiyon: buraya işleyici ekle, üreticinin yazdığı öğede aynı `id`yi
 * kullan. İşleyici fırlatırsa kullanıcı "İşlem tamamlanamadı" görür ve
 * kart yerinde kalır.
 */

export type FeedHandlerContext = {
  userId: string;
  row: FeedItemRow;
  draftText?: string;
};

export type FeedHandler = {
  /** Başarıda kullanıcıya gösterilecek tek satır: "Toplantıyı perşembeye taşıdım". */
  run: (ctx: FeedHandlerContext) => Promise<{ summary: string }>;
  undo?: (ctx: FeedHandlerContext) => Promise<void>;
};

export const FEED_HANDLERS: Record<string, FeedHandler> = {
  /** Örnek: yalnızca kapatır. Gerçek işleyicin gelince sil. */
  tamam: {
    run: async () => ({ summary: "Not edildi" }),
    undo: async () => {},
  },
};

export const KNOWN_FEED_ACTIONS: ReadonlySet<string> = new Set(Object.keys(FEED_HANDLERS));
