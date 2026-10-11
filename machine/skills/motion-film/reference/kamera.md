# Kamera — 2D sahnede de bir karakter

Dünya bir koordinat düzlemi; kamera `{ x, y, z }`: dünya noktası (x, y)
ekranın ortasına, ölçek z. Tek dönüşüm fonksiyonu (`withCamera`, `toScreen`);
iris, sel, nişan gibi ekran efektleri hep ondan geçer, ekran koordinatı elle
yazılmaz.

## Hareket sözlüğü

| Hareket | Anlatır | Uygulama |
|---------|---------|----------|
| Ucu izle (follow) | yolculuk, süreç, zaman ipi | `followCamera(subjectAt, t, { lag, lead })` |
| Sabit kadraj, yavaş itiş | ağırlık, karar | `z *= 1 + 0.04 * ease.inOut(k)` |
| Dalış (push-in) | bir ayrıntıya giriş | önce −%4 geri (hazırlık), sonra 1 → 2,6 |
| Sürekli geri çekiliş | "hepsi tek resimmiş" | `z` 2,6 → 1, merkez özneden sahne ortasına |
| Nefes | dönen/bekleyen sahne ölü durmasın | `z *= 1 + 0.025 * sin(2πt / 7)` |
| Durgunluk itişi | doruktan önce | 0,35 sn, merkez doruk öğesine %50 |

## Takip formülü

```ts
// −lag … +lead aralığında sekiz örneğin ortalaması: geride kalma + önden sezme.
let x = 0, y = 0;
for (let k = 0; k < 8; k++) { const q = subjectAt(t - lag + (k / 7) * (lag + lead)); x += q.x / 8; y += q.y / 8; }
// Görünür alan dünyadan taşmasın: merkez kenardan yarım pencere içeride.
x = clamp(x, w / 2 / z, w - w / 2 / z);
```

- Kalemi izlerken `lag 0,45 · lead 0,25`. Y'de fiyatın kendisi değil
  **ortalaması**: günlük titreşim kamerayı sarsmasın.
- **Hızlı nesne kuralı (ölçümle bulundu):** 2,6 kat yakınlıkta saniyede ~800
  dünya pikseli giden damla ekranda ~2000 px/sn; hiçbir ortalama yetişmez,
  damla kadrajdan çıkar ve kare boş kalır. Çözüm iki parçalı: yol boyunca
  pencereyi daralt (`lag 0,12 · lead 0,08`) **ve** kamerayı aç (z → 1,6).
  Sinema dilinde "takip ederken açılma".
- Nesnenin yolunu kamerada da AYNI formülle hesapla (kavis dahil);
  kamera yaklaşık bir yolu izlerse nesne kayar.

## Ölçek ve çizgi

- Fırça genişliği dünya biriminde: yaklaşınca kalınlaşır (makro mercek gibi
  doğru). Kâğıt lifleri gibi doku çizgileri ise `lineWidth / z` — yoksa çizik gibi okunur.
- Yakında çok ince ayrıntı (≥ 2 kat) çizilecekse genişliği ayrı kıs.

## Kamera ile künyeler

Künyeler dünyada (kamerayla büyür). Kamera itişi künyeleri kenara iterse
yerleşimi tam zoom'da da ölç. Ekrana sabit kalması gereken öğe (ses düğmesi,
ilerleme çizgisi) DOM'da, tuvalin dışında.
