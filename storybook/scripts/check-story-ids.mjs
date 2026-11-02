/**
 * Kural: Storybook adresleri (hikâye ve belge kimlikleri) İNGİLİZCE.
 * Görünen adlar (`title`, `name`) Türkçe kalır; adresi meta'daki `id` ve
 * dışa aktarılan hikâye adı (İngilizce) belirler. Kimlik verilmezse Storybook
 * Türkçe başlıktan "giriş--giris", "i̇pucu" gibi bozuk adresler üretir.
 *
 * Denetim derlenmiş `storybook-static/index.json` üstünde koşar:
 *   1. yalnızca a-z, 0-9 ve tire
 *   2. sık Türkçe kelimeler yok (kimlik verilmeden kalan başlığı yakalar)
 * Kullanım: npm run build && npm run check:ids
 */
import { readFileSync } from 'node:fs'

const index = JSON.parse(readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'))
// Tam kelime olarak aranır: "palette" İngilizce, "palet" Türkçe.
const TURKISH = new Set([
  'bilesen', 'bilesenler', 'grafik', 'grafikler', 'giris', 'varsayilan', 'butun', 'tum', 'sayfa', 'sayfasi',
  'secim', 'secili', 'acik', 'kapali', 'dugme', 'dugmesi', 'tema', 'renk', 'renkler', 'palet', 'paletler',
  'ekran', 'ekranlar', 'blok', 'bloklar', 'vitrin', 'ornek', 'tasarim', 'baslangic', 'yukleme', 'katman',
  'katmanlar', 'gezinme', 'veri', 'bos', 'hata', 'telefon', 'uzun', 'devre', 'disi', 'tablo', 'kart', 'takvim',
  'ayar', 'ayarlar', 'sohbet', 'pano', 'huni', 'cubuk', 'halka', 'akis', 'yuzey', 'yuzeyler', 'hareket',
  'tipografi', 'etiket', 've', 'ile', 'icin', 'genel', 'bakis', 'alan', 'secici', 'listesi', 'kutusu',
])
const bad = []
for (const [id, entry] of Object.entries(index.entries)) {
  if (!/^[a-z0-9-]+$/.test(id)) bad.push(`${id}  ← ASCII dışı ya da büyük harf (${entry.title})`)
  else {
    const hit = id.split(/-+/).find((word) => TURKISH.has(word))
    if (hit) bad.push(`${id}  ← Türkçe kelime "${hit}" (${entry.title} / ${entry.name})`)
  }
}
if (bad.length) {
  console.error(`✖ ${bad.length} Türkçe ya da geçersiz adres (kural: adresler İngilizce):\n  ` + bad.join('\n  '))
  console.error('\nDüzeltme: meta\'ya İngilizce `id` ver, hikâyeyi İngilizce adla dışa aktar (`export const Default = { name: "Varsayılan" }`).')
  process.exit(1)
}
console.log(`✓ ${Object.keys(index.entries).length} adresin hepsi İngilizce`)
