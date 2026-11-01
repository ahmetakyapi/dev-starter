# snippets/ui/vitrin — Yaşayan Bileşen Vitrini

`snippets/ui` bileşenlerinin gerçekçi Türkçe verilerle, boardui vitrini
düzeninde (büyük yuvarlak kart + altında ad ve tek cümle) gösterildiği beş
sayfa. Her biri bir bileşenin **doğru kullanımının** örneğidir: prop'lar,
etiketler, durumlar. Bileşeni projeye alırken önce buradaki kullanıma bak.

| Dosya | İçerik |
|-------|--------|
| `index.tsx` | Giriş: beş grubun kartları (`app/vitrin/page.tsx`); grup sayfalarındaki örnek bağlantılar buraya döner |
| `polish.tsx` | Temel kütüphane: menü, seçim, onay, anahtar, sekmeler, rozet, avatar, tablo, takvim çizelgesi… (33 bileşen) |
| `form.tsx` | Kaydırıcı, sayı alanı, OTP, metin alanı, etiket, renk, takvim, tarih, saat |
| `feedback.tsx` | Bağlam menüsü, bildirim merkezi, uyarı satırı, ilerleme, ölçer, atlıkarınca, çip, duyuru |
| `charts.tsx` | Alan, gösterge, huni, ısı haritası, sıralı liste, radar, sankey |
| `blocks.tsx` | Uygulama kabuğu + sohbet, giriş kartı, ajan planı, ayarlar, palet seçici |

## Kurulum (bir şablon kopyasında)

```bash
# bileşenler
cp ~/dev-starter/snippets/ui/*.tsx components/ui/
rm components/ui/Skeleton.tsx            # şablonun dosyası, snippet skeleton.tsx ile harf çakışması
npm i @base-ui/react@1.8.0
# vitrin sayfaları
mkdir -p app/vitrin
cp ~/dev-starter/snippets/ui/vitrin/index.tsx app/vitrin/page.tsx
for n in polish form feedback charts blocks; do
  mkdir -p app/vitrin/$n && cp ~/dev-starter/snippets/ui/vitrin/$n.tsx app/vitrin/$n/page.tsx
done
```

`blocks.tsx` palet seçici için `app/palettes.css`i içe aktarır (şablonda var).
Sayfalar `"use client"` olduğu için yalnızca vitrin içindir; ürün sayfası
sunucu bileşeni kalır.

Doğrulama (Kasım 2026): beş sayfa bir `landing` şablon kopyasında `tsc`,
`eslint --max-warnings 0`, `next build` temiz; 390 ve 1440 piksel, açık ve
koyu temada ekran görüntüsüyle denetlendi.
