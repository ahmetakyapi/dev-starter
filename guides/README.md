# Rehberler — Projeye Başlarken Gereken Her Şey

`knowledge/` neyin **neden** öyle olduğunu kaydeder (karar, desen, hata).
`guides/` ise **sırayla ne yapılacağını** anlatır: yeni bir projenin ilk
gününden canlıya çıkışına kadar. Her kuralın yanında bir cümlelik gerekçe ve
çoğu zaman hangi projede yaşandığı yazar; gerekçesi olmayan kural, ilk
zorlukta delinir.

Yığın (Ekim 2026): Next 16 App Router · React 19.2 · Tailwind v4 (`@theme`) ·
`motion/react` (LazyMotion) · Drizzle + Neon · next-auth v5 · zod 4 ·
Vercel. Şablonlar `~/dev-starter/templates/` altında, bu sözleşmeye uyar.

## Okuma Sırası

| # | Rehber | Ne zaman |
|---|--------|----------|
| 0 | [00-brand-identity.md](00-brand-identity.md) | Bir kez, sonra palet seçerken: kimlik ve palet |
| 1 | [01-kickoff.md](01-kickoff.md) | Projenin ilk günü, ilk haftası |
| 2 | [02-design-tokens.md](02-design-tokens.md) | İlk ekran çizilmeden önce |
| 3 | [03-theming.md](03-theming.md) | Açık/koyu tema ve zemin kararı |
| 4 | [04-motion.md](04-motion.md) | İlk animasyondan önce |
| 5 | [05-components.md](05-components.md) | Ekran kurarken, her gün |
| 6 | [06-nextjs-16.md](06-nextjs-16.md) | Rota, veri, form, önbellek yazarken |
| 7 | [07-data-auth-security.md](07-data-auth-security.md) | Veritabanı, giriş, API ucu açarken |
| 8 | [08-quality-and-ship.md](08-quality-and-ship.md) | Her commit ve her deploy öncesi |
| 9 | [09-typography.md](09-typography.md) | Font seçimi: preset'ler, `next/font` kurulumu |
| 10 | [10-component-library.md](10-component-library.md) | Şablonda olmayan bileşen gerektiğinde: `snippets/ui/` kütüphanesi |

Fikir aşamasındaysan önce `/kickoff` (strateji, pazar, MVP), sonra 01.
Acelen varsa: 01 → 08 → gerisi ihtiyaç anında.

## Rehberler Arası Kaynaklar

- Kararların gerekçesi: [../knowledge/decisions.md](../knowledge/decisions.md)
- Kopyalanabilir desenler: [../knowledge/patterns.md](../knowledge/patterns.md)
- Yaşanmış hatalar: [../knowledge/mistakes.md](../knowledge/mistakes.md)
- Proje temaları: [../knowledge/themes/](../knowledge/themes/)
- Token kuralları: [../rules/design-tokens.md](../rules/design-tokens.md)

## Bu Rehberleri Güncellemek

Bir projede bir kural bozulup düzeltildiyse üç yere yazılır: hatanın kendisi
`knowledge/mistakes.md`ye, kalıcı desen `knowledge/patterns.md`ye, ve
**sıradaki projede o hatayı hiç yaşatmayacak adım** buradaki ilgili rehbere.
Rehber yalnızca "ne yap" der; uzun hikâye mistakes kaydında kalır ve buradan
numarasıyla bağlanır.
