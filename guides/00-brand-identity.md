# 00 — Marka Kimliği

Ahmet'in projeleri tek bir markanın ürünleri gibi tanınmalı, ama hepsi aynı
renkte olmak zorunda değil. Bir finans aracı ile bir oyun aynı maviyi
taşırsa ikisinden biri yanlış ürünü anlatır. Çözüm iki katman:

- **Kimlik** — her projede aynı, tartışılmaz. Bir ekranı "bu Ahmet'in"
  yapan şey renk değil, bu kurallar.
- **Palet** — projeye göre seçilir. Varsayılan `signature` (Açılış Zili
  mavisi); uygun olmayan ürün başka bir aile alır, kurallar değişmez.

Karar kaydı: [../knowledge/decisions.md](../knowledge/decisions.md) →
"Palet — Varsayılan Renk Ailesi". Token'ların kendisi:
[02-design-tokens.md](02-design-tokens.md).

---

## 1. Değişmezler (Kimlik)

| # | Kural | Neden |
|---|-------|-------|
| 1 | İki katmanlı token: ham rol değişkenleri → `@theme inline` köprüsü; rol adları her projede aynı (`--text-strong`, `--primary-wash`...) | Bir projeden ötekine geçen bileşen, adlar aynıysa değiştirilmeden çalışır |
| 2 | Derinlik **ton farkıyla**; tek gerçek gölge açılır katmanda ve marka karosunda | Açılış Zili ekosistemin en okunaklı projesi ve gölge yığını kullanmıyor |
| 3 | Glass opt-in, yalnızca altından içerik geçen öğede | Düz zemin üstünde bulanıklık görünmez, yalnızca maliyet ekler |
| 4 | Degrade yalnızca üç yerde: kısa display başlık, birincil eylem, marka karosu | Her yerde olan degrade vurgu olmaktan çıkar (Mimio ve Açılış Zili aynı sonuca ayrı ayrı vardı) |
| 5 | Degrade **tek renk ailesi** içinde: koyudan açığa aynı ton | Gökkuşağı degrade şablon hissi verir; tek aile bir malzeme gibi okunur |
| 6 | Tek değişken yazı ailesi (+ gerekirse mono), rol adlı punto ölçeği, `text-wrap: balance/pretty` | Kontrast ikinci bir aileden değil ağırlıktan gelir |
| 7 | Title Case başlık ve düğme; arayüz metninde em dash yok | Ses tutarlılığı; Türkçe `İ` doğru |
| 8 | Tek hareket eğrisi `cubic-bezier(0.22, 1, 0.36, 1)`, `DUR` tablosu, reduced-motion | Hareket ritmi markanın sesi |
| 9 | Radius ölçeği, 2 px odak halkası (`--line-focus`), 44 px dokunma hedefi | Erişilebilirlik bir tercih değil |
| 10 | Açık tema yeniden tasarlanır; açıkta `--primary` bir basamak koyu, wash üstünde `-ink` | Ters çevrilmiş açık tema AA'yı tutmaz (ElevenForge) |

✅ Zümrüt paletli bir sağlık uygulaması: ton farkıyla kartlar, tek değişken
   aile, yalnızca birincil düğmede zümrüt degradesi. Tanınır.
❌ Mavi paletli ama her kartı glass, başlıkları üç renkli degrade, iki ayrı
   yazı ailesi. Renk "doğru" ama kimlik yok.

---

## 2. Palet Seçimi

Palet ürünün **kimin için ve ne zaman** kullanıldığından seçilir. Seçim
`/kickoff` çıktısında yapılır (`docs/KICKOFF.md`), `/new-project` oradan alır.

| Ürün türü / kullanım anı | Palet | Varsayılan tema |
|---------------------------|-------|-----------------|
| Finans, veri, araç; gündüz, masa başı | `signature` | Açık |
| Editoryal, okuma, haber | `signature` | Açık |
| Kişisel site, portfolyo; akşam, merak | `signature` | Koyu |
| Sağlık, terapi, doğa; gündüz, sakin | `verdant` | Açık |
| Oyun, eğlence, topluluk; gece | `ember` | Koyu |
| Yaratıcı araç, yapay zekâ ürünü | `iris` | Koyu ya da açık, ürüne göre |

Kararsız kalındığında `signature` + açık tema. "Koyu havalı görünür" bir
gerekçe değil: koyu tema gece kullanılan ürün içindir.

| Palet | Açık `--primary` | Koyu `--primary` | Aile |
|-------|------------------|------------------|------|
| `signature` | `#0d74c4` | `#35b8ff` | Lacivert → mavi |
| `verdant` | ~`#0f7a5a` | ~`#34d399` ailesi | Zümrüt |
| `ember` | ~`#b45309` | ~`#fbbf24` ailesi | Kehribar → turuncu |
| `iris` | ~`#5b4bd6` | ~`#a5b4fc` ailesi | Mor → indigo |

`~` işaretli değerler yön gösterir; kesin değer § 4'teki ölçümle bulunur.
`signature`ın tam değerleri [02-design-tokens.md](02-design-tokens.md) § 1.

Seçim `<html data-palette="...">` ile yapılır ve `data-theme` ile birleşir
(`:root[data-theme="dark"][data-palette="verdant"]`). Tek palet kullanan
proje yalnızca palet bloğunu kendi `globals.css`inde ezer.

---

## 3. Mevcut Projeler Hangi Palete Yakın

Mevcut projeler kendi temalarıyla kalır; toplu dönüşüm yok. Tablo, bir
projeye dokunulduğunda hangi yöne gidileceğini söyler.

| Proje | Bugünkü renk | Yakın palet | Not |
|-------|--------------|-------------|-----|
| Açılış Zili | Lacivert → mavi | `signature` | Paletin kaynağı |
| Mimio | Mavi → cyan imza degradesi | `signature` | Kendi `THEME.md`si geçerli |
| ahmetakyapi.com | İndigo + cyan + emerald | `signature` | Kişisel site; dokunulduğunda maviye yaklaşır |
| Keskealsaydım | Emerald + cyan | `verdant` | Vite + React, shadcn HSL |
| DigyNotes | Emerald | `verdant` | Arşiv |
| Dungeon Mates, OnePiece Hub | Sıcak tonlar | `ember` | |
| Ramazan Vakitleri | Mor + pembe + mavi | `iris` | Açık palet istisnası, `live-projects-audit.md` |
| ElevenForge | `data-accent` ile dört vurgu | Kendi sistemi | İkinci eksen deseni burada doğdu |

---

## 4. Yeni Bir Palet Nasıl Türetilir

1. **Tek ton seç**, iki uç: açık temada koyu basamak, koyu temada açık
   basamak. Aynı rengin iki parlaklığı; ayrı renkler değil.
2. **Aileyi doldur:** `--primary`, `-hover` (açıkta daha koyu, koyuda daha
   açık), `-soft`, `-wash` (%10–14 opaklık), `-ink`, `--on-primary`,
   `--line-focus` (genellikle `--primary`).
3. **Ölç, uydurma.** Her iki temada:

   | Çift | Hedef |
   |------|-------|
   | `--on-primary` üstünde `--primary` dolgu | ≥ 4,5:1 |
   | `--primary-ink` metni `--primary-wash` zemin üstünde | ≥ 4,5:1 |
   | `--text-muted` `--page-bg` ve kart zemini üstünde | ≥ 4,5:1 |
   | `--line-focus` zemin üstünde | ≥ 3:1 |

   Ölçüm bir betik ya da testle (WCAG göreli parlaklık formülü); sonuç
   token yorumuna yazılır.
4. **`-ink` kuralı:** wash üstünde `--primary` AA'yı tutmuyorsa `-ink` bir
   basamak koyulaştırılır; koyu temada genellikle `--primary`nin kendisi yeter.
5. **`--on-primary` koyu temada koyu olabilir.** Açık bir dolgu üstünde beyaz
   metin kontrastı tutmaz; `signature` koyuda `#06121f` kullanır.
6. **Degradeler aynı aileden:** `--display-gradient` koyudan açığa aynı ton,
   küçük punto için ayrı `-tight` sürüm (açık ucu AA sınırında durur).
7. Her iki temada bir ekranı yan yana aç; biri "bitmemiş" görünüyorsa o
   temanın kendi kararı eksik.

✅ `verdant` açık: `--primary #0f7a5a`, wash üstünde `-ink` bir basamak koyu,
   ölçüm yorumda.
❌ `--primary: #10b981` her iki temada aynı: açık zeminde beyaz metinle 2,5:1.

---

## Kontrol Listesi

- [ ] Palet `/kickoff` çıktısında ürün türüne göre seçildi
- [ ] Değişmezlerin onu da uygulanıyor (glass opt-in, degrade üç yerde, tek aile)
- [ ] Yeni palet her iki temada ölçüldü, oranlar token yorumunda
- [ ] Degradeler tek renk ailesinden
