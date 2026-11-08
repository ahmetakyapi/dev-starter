---
paths:
  - "app/akis/**"
  - "components/feed/**"
  - "lib/feed*.ts"
  - "tests/feed.test.ts"
---

# AI Akışı (`/akis`)

> Şablon CLAUDE.md'sinden taşındı (dev-starter, 8 Kasım 2026): akış
> dosyalarına dokunulunca yüklenir; akışın varlığı CLAUDE.md'de tek satır.

Agent hazırlar, kullanıcı karar verir: sohbet kutusu yerine karara hazır
kartlar (taslak e-posta, çakışma çözümü, rakam özeti). Desen:
`~/dev-starter/knowledge/patterns.md → AI Feed`.

- **Parçalar:** `components/feed/` (arayüz + sözleşme, `~/dev-starter/snippets/`
  ile bayt bayt aynı; orada düzelt, buraya kopyala), `lib/feed-rules.ts` (yetki,
  saf, `tests/feed.test.ts`), `lib/feed.ts` (okuma, `addFeedItem`),
  `lib/feed-handlers.ts` (aksiyonların gerçek işi), `app/akis/actions.ts`.
- **Demo:** geliştirmede veritabanı ya da oturum yokken sayfa örnek öğelerle
  açılır, aksiyonlar hiçbir şeye dokunmaz. Üretimde demo yok.
- **Üretici** öğeyi yalnızca `addFeedItem` ile yazar (yazmadan önce doğrular).
  Tespit kuraldır; model yalnızca metni yazar. Öncelik ve kulvar koddan.
- **Yetki:** istemci yalnız `{ itemId, actionId, draftText }` gönderir; alıcı,
  tutar, kimlik `feed_items.payload`tan okunur. Kartta olmayan ya da
  `FEED_HANDLERS`ta işleyicisi olmayan aksiyon çalışmaz.
- **Geri alınamaz iş** (gönderim, ödeme) işleyicide `undo` taşımaz, kartta
  `reversibility: "irreversible"`; agent bunu `handled` kulvarına kendisi yazamaz.
- Ürün akış istemiyorsa sil: `app/akis/`, `components/feed/`, `lib/feed*.ts`,
  `tests/feed.test.ts`, `lib/schema.ts` → `feedItems`.
