# Prompt kalıpları — bir ajana film yaptırırken

prompt-motion.com ve awesome-opus5-5-videos'taki yüzlerce prompt'un iyi
çalışanlarının ortak yapısı. Kısa "showreel yap, sınırlarını zorla" prompt'u
da iş görür ama sonuç birbirine benzer; yapı vermek onu farklılaştırır.

## İskelet

```
<girdiler>
  Konu, süre (10–40 sn), boyut (1920×1080 / sayfa içi kutu), dil,
  marka: palet token'ları, font, logo dosyası. Varsa gerçek veri.
</girdiler>
<yön>
  Tek cümle hikâye. Stil (örn. tek çizgi mürekkep, kâğıt zemin, tek vurgu rengi).
  Tek öğe hiç kesilmez; her sahne bir öncekinden biçim değiştirerek doğar.
  Kamera ölçek değiştirir (dalış, takip, geri çekiliş). Dev kinetik yazı.
  Her 1,5–2 sn yeni bir fikir. Son açılışla kafiyeli.
  Yasak: <projenin yasakları — glow, blur, mor degrade, jenerik push/slide…>
</yön>
<yapı>
  Perde perde, saniye saniye; her perdede olay ve okuma.
</yapı>
<yapım>
  1. Her stil t'den hesaplanır (seek(t)); timer, CSS transition, durum yok.
  2. Yaylar kapalı biçim (adım yanıtı); hedefi çok kez değişen değer, her
     değişim için bir yayın toplamı — yine t'nin saf fonksiyonu.
  3. Önce her vuruş için bir kare çiz; ızgaradan kayan, sıkışan, okunmayanı düzelt.
  4. Sonra temas sayfası + kritik anların şeridi; sonra tam çıktı.
</yapım>
<tuzaklar>
  Kameranın ölçeklediği şeye will-change verme (yazı bulanıklaşır).
  Biçim değiştiren kapta yer değiştiren yazının kendi giriş/çıkış zamanı olsun.
  Döngüyse son kare ilk kareyle (imleç konumu ve hızı dahil) birebir.
</tuzaklar>
<başlangıç>
  Önce girdileri sor, sonra kod yazmadan önce perde/vuruş listesini göster.
</başlangıç>
```

## Kısa sürüm (hızlı deneme)

```
<Konu> için <süre> sn'lik bir hareket filmi yap. Önce ~/dev-starter/machine/skills/motion-film/SKILL.md'yi oku.
Stil: <stil>. Marka token'ları: <...>. Önce tretmanı ve okumaları göster,
onaydan sonra render(t) sözleşmesiyle kur, temas sayfası ve şeritleri bana göster.
```

## Prompt seçerken

- awesome-opus5-5-videos `prompts/` ve `data/videos.json`: konu ve kategoriye
  göre ara (motion graphics, explainer, 3D, oyun); prompt'u kopyalayıp kendi
  konunla uyarla. Her prompt yaratıcısına aittir; özgün gönderiye bağlantı ver.
- lemo-opuscar `styles/<stil>/STYLE.md`: bir görünüm seçip konuyu kendin getir
  (43 stil + OPUSCAR 98'in 98 stil prompt'u). Stil dilbilgisini al, referans
  eserlerin karakter/melodi/çekimlerini alma.
- Prompt'ta projenin kurallarını tekrar etme; "projenin CLAUDE.md'sine uy" yeter.
