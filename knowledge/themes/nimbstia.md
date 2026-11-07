---
name: Nimbstia
description: Klavye öncelikli macOS çalışma tezgâhı (Hammerspoon + WKWebView panelleri): pano, ekran görüntüsü, pencere düzeni, proje açıcı, durum merkezi
colors:
  primary: '#2563ff'
  accent: '#2563ff'
  neutral-bg: '#f6f6f5'
  neutral-fg: '#17181a'
  dark-bg: '#1f2024'
  dark-card: '#26272c'
typography:
  display:
    fontFamily: 'Inter, -apple-system, sans-serif'
    fontSize: '17px–38px (widget numaraları)'
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: '-0.03em'
  body:
    fontFamily: 'Inter, -apple-system, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: '-0.006em'
  mono:
    fontFamily: 'Geist Mono, SF Mono, monospace'
    use: 'yalnız kod, hash, adres, port'
rounded:
  card: '20px'
  widget: '22px'
  control: '12px'
  pill: '999px'
components:
  button-primary:
    backgroundColor: 'linear-gradient(180deg,#3d7bff,#2563ff)'
    textColor: '#ffffff'
    rounded: '{rounded.pill}'
---

# Görsel Hafıza: Nimbstia

> **Kaynak:** `ahmetakyapi/Nimbstia` → `theme.css` (tek tasarım sistemi), `pulstia.html` (merkez),
> `clipboard.html`, `projects.html`, `layouts.html`, `shot.html` — doğrulandı 2026-11-03

> Bu dosya DESIGN.md 9-section formatını takip eder.

Kaynak proje: `~/.hammerspoon` (GitHub: ahmetakyapi/Nimbstia)
Versiyon: Hammerspoon 1.0 + Lua, panel başına tek HTML (WKWebView, WebKit 16+), framework yok

---

## 1. Visual Theme & Atmosphere

> **Kasım 2026 revizyonu, iki tur.** İlk tur shojimac.com'dan "kâğıt-mürekkep" yönü aldı
> (siyah mürekkep birincil düğme, büyük harf + geniş aralıklı Geist Mono etiketler, siyaha yakın
> koyu tema). Sahibi reddetti: "çok siyah ve koyu, etiketler okunmuyor". İkinci tur
> ui.wensity.com ve macOS widget'larından aydınlık, bir bakışta okunan yöne geçti; ardından
> "fazla renkli" geri bildirimiyle renk yalnız sinyale indirildi. Ders: `mistakes.md` #115–#118.

Nimbstia bir uygulama değil, **her biri bir kısayolla açılan sakin paneller** dizisidir. Görsel
dil bu yüzden macOS'un kendi yüzeylerine (Denetim Merkezi, widget'lar) akraba durur: beyaz
kartlar, yumuşak gölge, tek bir birincil eylem, renk yalnız anlam taşıdığı yerde.

**Temel Karakteristikler:**
- Inter 4 (opsz eksenli, gömülü): okunan her şey. Geist Mono yalnız veri (sha, yol, port, kod)
- Nötr kart + renk sinyal: durum çipi, araç ikonu glifi, Claude halkası, sistem halkaları
- Tek birincil eylem: mavi degrade hap (Yapıştır, VS Code'da Aç, Kopyala)
- Hareket: girişte 35 ms aralıklı yükselme, halkalar ve çubuklar dolarak gelir, bağlıyken radar nabzı
- Açık + grafit koyu tema; panel başlığındaki güneş/ay düğmesi hepsini birlikte çevirir

---

## 2. Color Palette & Roles

### Arka Plan
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--bg` | `#1f2024` | `#f6f6f5` | Panel zemini |
| `--card` | `#26272c` | `#ffffff` | Widget/kart |
| `--chip` | `rgba(255,255,255,.075)` | `rgba(20,24,40,.055)` | Segment rayı, kapalı anahtar |

### Vurgu
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--accent` | `#2563ff` / dark `#5b9dff` | Odak, seçim, bağlantı, numara |
| `--primary` | `linear-gradient(180deg,#3d7bff,#2563ff)` | Tek birincil eylem |
| Uygulama kimliği | Pastia `#3b82f6`, Clipstia `#22c55e`, Panestia `#8b5cf6`, Repostia `#f59e0b`, Lexstia `#14b8a6` | Yalnız glif + açık zemin tonu |
| Claude | `#f7b195 → #d9623f` (dış halka), `#fcd581 → #ef9a1a` (iç halka) | Limit halkaları |

### Metin
| Token | Dark | Light | Kontrast |
|-------|------|-------|----------|
| `--text` | `#f3f4f7` | `#17181a` | — |
| `--muted` | `#b9bcc8` | `#4b5065` | ≥ 7:1 |
| `--faint` | `#9094a3` | `#6b7085` | beyazda 4.9:1; açık önizleme zemininde 4.42 → orada `--muted` |

### Durum
`--ok-bar #22c55e`, `--warn-bar #f59e0b`, `--bad-bar #f43f5e`; metin sürümleri `--ok #15803d`, `--danger #d0193a`.

---

## 3. Typography Rules

- **Etiketler cümle düzeninde, ≥ 11.5px, 550–650 ağırlık.** Büyük harf + `letter-spacing:.12em`
  mono "eyebrow" etiketleri okunmuyor diye kaldırıldı (#115).
- Büyük sayı: Inter 700–740, `-0.03…-0.045em`, `tabular-nums`. Türkçe yüzde önce (`%33`),
  İngilizce sonra (`33%`): `<html lang>` okunarak.
- Mono yalnız veri: sha, yol, host, `:3000` portu, kod önizlemesi (ligatür kapalı).
- Tuş kapakları Inter (⌘⌥⌃⇧ glifleri Inter'de var; Geist'te yok).

## 4. Component Stylings

- **Widget kartı:** radius 22, `0 0 0 1px line` + üstten `inset 0 1px 0 rgba(255,255,255,.85)` ışık + `0 10px 28px -14px` gölge.
- **Bağlantı kartı:** nötr; durum renk çipi (`Bağlı 18 ms`) + son kontrol zamanı. Dekoratif radar denendi, "göz yoruyor" diye kaldırıldı.
- **Geliştirme Sunucuları:** canlı bilgi üstte; başlığa tıklayınca katlanır, durum `hs.settings`te saklanır.
- **Claude kartı:** Apple Watch tarzı iç içe iki halka (r 38/27, kalınlık 10), ortada Claude glifi, yanda lejant.
- **Araç döşemesi:** 48px squircle, kimlik renginin %7→%17 tonu + iç ışık; altında ad, iş, tek satır kısayol.
- **Hızlı ayar:** 2×2 Denetim Merkezi döşemesi; açıkken küçük daire dolu renk, kart nötr.
- **Pastia önizlemeleri:** tür başına ayrı yerleşim (bağlantı kartı, renk HEX/RGB/HSL, satır numaralı kod, e-posta avatarı, yol çipleri, büyük sayı, çerçeveli görsel).

## 5. Layout Principles

- Merkez 480px genişlik, 12px iç boşluk, kartlar arası 10px; içerik boyunu JS bildirir (`size` mesajı).
- Liste + önizleme panelleri 1060×660; sol liste gün gruplu, sağda önizleme + bilgi ızgarası.
- Dar döşemede metin ölçülür; doğru kelime kısaltılmaz, alan açılır (#118). Merkez 480px.

## 6. Depth & Elevation

Panel: `0 0 0 .5px` kenar + 3 katman gölge. Koyu temada gölgeler `rgba(0,0,0,.6)` ve üst kenar
ışığı `rgba(255,255,255,.06)`. Açık temada siyah dolgu yok; ipucu balonu ve bildirim beyaz kart (#115).

## 7. Do's and Don'ts

| Yap | Yapma |
|-----|-------|
| Renk yalnız sinyal (durum, kimlik, ölçü) | Her widget'a doygun degrade zemin (#116) |
| Tek mavi birincil eylem | Açık temada siyah "ink" düğme/rozet (#115) |
| Cümle düzeninde okunur etiket | Küçük büyük-harf mono etiket |
| Fontu göm (Inter) | README görüntüsünü sistem fontuna güvenerek üret (#117) |
| Dar kutuda metni ölç, alanı aç | Uzun Türkçe etiketi kesik bırak (#118) |
| Başlık, düğme, rozet Title Case | Cümle düzeninde başlık, arayüzde em dash (#119) |

## 8. Responsive Behavior

Pencere boyları Lua'da sabit; panel ekran çerçevesine sığdırılır. `prefers-reduced-motion`
tüm animasyonları kısaltır. Tema "auto" iken macOS görünümünü izler.

## 9. Agent Prompt Guide

"Nimbstia dilinde bir panel: Inter, beyaz 22px widget kartları, renk yalnız sinyal, tek mavi
degrade birincil düğme, etiketler cümle düzeninde 12px, büyük sayılar 700 ağırlık ve sıkı
aralık, mono yalnız veri. `theme.css` token'larını kullan; Türkçe dizgileri aynen koru, İngilizce
`i18n.js` tablosundan gelir. Önizle: `node scripts/preview/shoot.js out <panel>`."

## Açık Öneri: Ribbon Dili (2026-11-07, onay bekliyor)

meetribbon.app incelemesinden. Nimbstia zaten yolun ~%70'inde (nötr zemin,
beyaz kart, tek mavi, tuş kapakları, pastel mini masaüstleri). Panellere
önerilen, ÖNİZLENDİ ama uygulanmadı (Pano ve Yerleşim, iki tema):

- Zemin serin zinc (`#f6f6f5` → `#f4f4f5`), panelde wash ve grain yok,
  kart `ring 1px zinc-900/10 + shadow-sm`, hub widget'ı 24 px.
- Vurgu sky, üçe ayrılır (AA): çizgi/halka `#0ea5e9` (metin değil, 2.77:1),
  metin `#0369a1` (5.93:1), dolgu `#0273b6` (beyaz metin 5.08:1). Ribbon'ın
  birebir sky-500/600'ü 11-13 px metinde AA'yı geçmez.
- Seçili satır: sky-50 + 1 px sky çizgi; **sol 3 px şerit kalkar** (tek taraflı
  vurgu şeridi, slop). Yerleşimde tek odaklı pencere halkası + kesik çizgili hayalet pencere.
- Tuş kapağı düz (zinc-50 + zinc-300), ipucu ve boş durum metninde satır içi.

Panele GİRMEZ (pazarlama/README kahramanı): büyük harfli eyebrow (#115),
serif başlık + italik vurgu, el yazısı not, maskot, sıvı cam, yuvaya oturan
menü, güven satırı. Instrument Serif `theme.css`e konmaz (`panel.lua` her
panele base64 gömer, +70-90 KB). README hemen macOS 13+ diyor; `@property`
13.3+, `color-mix()` Safari 16.2 ister. Logo degradesi (mavi→mor) sky arayüzle
çatışır: karar gerekir. Ayrıntılı token tablosu: oturum raporu (nimbstia-visual).
