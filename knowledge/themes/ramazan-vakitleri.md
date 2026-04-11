# Görsel Hafıza: Ramazan Vakitleri

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: `~/ramazan-vakitleri`
GitHub: https://github.com/ahmetakyapi/ramazan-vakitleri
Versiyon: React + Vite, Vanilla CSS, Dark only

---

## 1. Visual Theme & Atmosphere

Ramazan Vakitleri, Ramazan ayı boyunca namaz vakitlerini ve iftar/sahur geri sayımını gösteren minimal, mobil-öncelikli bir tek-sayfa uygulamasıdır. Tasarım felsefesi "gece gökyüzü altında huzur" hissini yansıtır: koyu mor-lacivert arka plan üzerine lavanta, pembe ve mavi gradient vurguları ile neredeyse kozmik bir atmosfer yaratılır. Kullanıcı telefonunu açtığında karşılaşması gereken his: sakin, okunaklı, dikkat dağıtmayan bir arayüz.

Diğer Ahmet projelerinden (indigo/emerald/cyan paleti) bilinçli olarak kopmuştur. Burada mor (#a78bfa) ana vurgu rengiyken, pembe (#f472b6) ve mavi (#60a5fa) destekleyici gradient partnerleridir. Altın/bronz tonları saat rakamlarında özel bir sıcaklık katar. Kadir Gecesi gibi özel anlarda altın animasyonlu badge devreye girer.

**Temel Karakteristikler:**
- **Font**: Sistem font stack — hız öncelikli, sıfır network yükü
- **Renk stratejisi**: Üçlü gradient vurgu (mor/pembe/mavi) + altın saat rakamları
- **Efekt sistemi**: Ultra-ince beyaz opaklık katmanları (glass benzeri ama daha sade), animasyonsuz derinlik
- **Animasyon felsefesi**: Sadece CSS transition (0.2s ease). Framer Motion, GSAP yok. Stagger animasyonları da saf CSS delay ile
- **Dark/Light mod**: Sadece dark — light mod yok, tema değiştirme yok
- **Bağımlılık**: Minimum — sadece React + @vercel/analytics

---

## 2. Color Palette & Roles

### Arka Plan
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--bg-top` | `#1a1a2e` | — | Sayfa üst gradient ucu (koyu mor-navy) |
| `--bg-middle` | `#16213e` | — | Sayfa orta gradient noktası (orta lacivert) |
| `--bg-bottom` | `#1a1a2e` | — | Sayfa alt gradient ucu |
| `--card-bg` | `rgba(255,255,255,0.03)` | — | Kart arka planı — neredeyse görünmez beyaz |

### Vurgu Renkleri
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--accent` | `#a78bfa` | Ana vurgu — lavanta/mor. Başlıklar, aktif göstergeler |
| `--accent-pink` | `#f472b6` | Gradient orta nokta — pembe |
| `--accent-blue` | `#60a5fa` | Gradient bitiş noktası — mavi |

### Gradient Metin
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--gradient-text` | `linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%)` | Başlıklar, öne çıkan metinler |
| `--gradient-text-alt` | `linear-gradient(135deg, #fff 0%, #a78bfa 100%)` | Alternatif gradient metin — beyazdan lavantaya |

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--text-primary` | `#ffffff` | — | Ana metin, başlıklar |
| `--text-secondary` | `rgba(255,255,255,0.5)` | — | İkincil metin, etiketler |
| `--text-muted` | `rgba(255,255,255,0.35)` | — | Silik metin, yardımcı bilgi |

### Yüzey & Buton
| Token | Dark | Kullanım |
|-------|------|----------|
| `--button-bg` | `rgba(255,255,255,0.08)` | Buton arka planı |
| `--button-bg-hover` | `rgba(255,255,255,0.12)` | Buton hover durumu |
| `--active-bg` | `rgba(255,255,255,0.04)` | Aktif sekme arka planı |
| `--active-border` | `rgba(255,255,255,0.15)` | Aktif sekme kenarlığı |

### Özel Gradient'ler
| Kullanım | Değer |
|----------|-------|
| Saat rakamları (altın/bronz) | `linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 30%, #d4b896 60%, #c9a87c 100%)` |
| Saat ayırıcı (:) | `linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ff6b6b 100%)` |
| Kadir Gecesi badge | `linear-gradient(135deg, rgba(251,191,36,0.10), rgba(245,158,11,0.05))` |

### Durum Renkleri
Bu projede açık durum renkleri tanımlı değildir. Namaz vakti aktiflik durumu `--active-bg` + `--active-border` ile belirtilir.

### Genel Değişkenler
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--border-radius` | `20px` | Ana kartlar, container'lar |
| `--border-radius-sm` | `12px` | Butonlar, badge'ler |
| `--transition` | `all 0.2s ease` | Tüm geçişlerde standart |

### Sayfa Arka Plan Kodu
```css
/* Sadece dark — light mod yok */
body {
  background: linear-gradient(180deg,
    var(--bg-top)    0%,
    var(--bg-middle) 50%,
    var(--bg-bottom) 100%
  );
  min-height: 100vh;
}
```

---

## 3. Typography Rules

### Font Ailesi
- **Sans**: Sistem font stack — `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Mono**: Yok — mono font kullanılmıyor
- **Google Fonts**: Yok — bilinçli tercih, sıfır font yükü
- **text-rendering**: `optimizeLegibility`
- **-webkit-font-smoothing**: `antialiased`

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Özellik | Not |
|-----|------|-------|---------|-------------------|---------|-----|
| Geri Sayım (mobil) | System sans | 4.5rem | 300 (light) | 1 | `font-variant-numeric: tabular-nums` | Altın gradient metin |
| Geri Sayım (desktop) | System sans | 5.5rem | 300 (light) | 1 | `font-variant-numeric: tabular-nums` | Altın gradient metin |
| Saat Ayırıcı | System sans | 4.5rem/5.5rem | 300 | 1 | — | Altın/turuncu/kırmızı gradient |
| Başlık (gradient) | System sans | — | 600 | — | `--gradient-text` uygulanır | `-webkit-background-clip: text` |
| Namaz Vakti Adı | System sans | — | 500 | — | `--text-primary` | Sol hizada |
| Namaz Vakti Saati | System sans | — | 400 | — | `--text-secondary` | Sağ hizada |
| Alt Bilgi | System sans | — | 400 | — | `--text-muted` | Küçük punto |

### Prensipler
- Sayılar her zaman `font-variant-numeric: tabular-nums` ile gösterilir — böylece geri sayım sırasında rakamların genişliği değişmez ve sayı "zıplamaz"
- Geri sayım rakamları `font-weight: 300` (light) kullanır — büyük boyutta zarafet sağlar
- Gradient metin uygulaması: `background: var(--gradient-text); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`

---

## 4. Component Stylings

### Butonlar

**Standart Buton (Şehir Seçimi, Sekme)**
- Background: `rgba(255,255,255,0.08)`
- Text: `--text-primary` (#ffffff)
- Padding: proje bileşenine göre değişir
- Radius: `var(--border-radius-sm)` → `12px`
- Hover: `rgba(255,255,255,0.12)`
- Transition: `all 0.2s ease`

**Aktif Sekme / Seçili Durum**
- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(255,255,255,0.15)`
- Radius: `12px`
- Fark: daha ince arka plan ama belirgin kenarlık ile aktiflik gösterilir

### Kartlar & Container'lar
- Background: `rgba(255,255,255,0.03)` — neredeyse saydam
- Border: yok (kenarlık yerine opaklık farkı ile ayrım yapılır)
- Radius: `20px` (`--border-radius`)
- Shadow: yok — düz renk katmanlarıyla derinlik
- Hover: tanımlı değil (mobil-öncelikli, hover efekti minimal)

### Saat Gösterimi (Projeye Özel)
```css
/* Geri sayım rakamları — altın/bronz gradient */
.countdown-digit {
  background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 30%, #d4b896 60%, #c9a87c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 4.5rem;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
}

/* Desktop */
@media (min-width: 620px) {
  .countdown-digit { font-size: 5.5rem; }
}

/* Saat ayırıcı (:) — altın/turuncu/kırmızı */
.countdown-separator {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Kadir Gecesi Badge (Projeye Özel)
```css
.kadir-badge {
  background: linear-gradient(135deg, rgba(251,191,36,0.10), rgba(245,158,11,0.05));
  border: 1px solid rgba(251,191,36,0.20);
  border-radius: var(--border-radius-sm); /* 12px */
  animation: kadir-glow 3s ease-in-out infinite;
}

.kadir-badge .icon {
  animation: kadir-sparkle 2s ease-in-out infinite;
}

@keyframes kadir-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes kadir-sparkle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
```

### Namaz Listesi
```css
/* Her namaz vakti satırı stagger animasyonu */
.prayer-item {
  animation: prayerItemIn 0.3s ease both;
}
.prayer-item:nth-child(1) { animation-delay: 0.04s; }
.prayer-item:nth-child(2) { animation-delay: 0.08s; }
.prayer-item:nth-child(3) { animation-delay: 0.12s; }
.prayer-item:nth-child(4) { animation-delay: 0.16s; }
.prayer-item:nth-child(5) { animation-delay: 0.20s; }
.prayer-item:nth-child(6) { animation-delay: 0.24s; }

@keyframes prayerItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Navigasyon
- Proje tek ekrandır — klasik nav bar yok
- Şehir seçimi ve tarih navigasyonu üst kısımda buton grubu olarak yer alır
- Aktif durum: `--active-bg` + `--active-border`

---

## 5. Layout Principles

### Spacing Sistemi
- Base unit: `8px`
- Container padding: `32px 24px 40px` (üst sol/sağ alt)
- Bileşenler arası boşluk: esnek, flex gap ile yönetilir

### Grid & Container
- Max content width: `430px` (iPhone genişliği)
- Margin: `0 auto` (yatay merkezleme)
- Height: `100dvh` (dynamic viewport height — mobil tarayıcı toolbar'larına uyumlu)
- Display: `flex`, direction: `column`
- Overflow: `hidden` — sayfa scroll etmez, içerik container içinde kalır

### Responsive Container Genişlikleri
```css
/* Mobil (varsayılan) */
max-width: 430px;

/* Tablet (620px+) */
@media (min-width: 620px) {
  max-width: 620px;
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  max-width: 520px;  /* Ortalanır, tablet'ten dar — mobil his korunur */
}
```

### Whitespace Felsefesi
- Çok geniş boşluk bırakma — mobil ekranda alan değerlidir
- İçerik dikey flex ile dağıtılır, `justify-content` veya `gap` ile dengelenir
- Alt kısımda `40px` padding ile "nefes alma alanı" bilinçli olarak korunur

### Border Radius Scale
| İsim | Değer | Kullanım |
|------|-------|----------|
| `--border-radius-sm` | `12px` | Butonlar, badge'ler, küçük kartlar |
| `--border-radius` | `20px` | Ana kartlar, container'lar |
| full | `9999px` | Kullanılmıyor — pill şeklinde bileşen yok |

---

## 6. Depth & Elevation

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| Flat (0) | Yok | Sayfa gradient arka planı |
| Subtle (1) | `rgba(255,255,255,0.03)` bg | Kart arka planları — shadow yok, opaklık ile ayrım |
| Interactive (2) | `rgba(255,255,255,0.08)` bg | Butonlar — hover'da `0.12`'ye çıkar |
| Active (3) | `rgba(255,255,255,0.04)` bg + `rgba(255,255,255,0.15)` border | Aktif sekmeler — kenarlık ile belirginleştirme |

### Efekt Sistemi
Bu projede glassmorphism, `backdrop-filter`, `box-shadow` kullanılmaz. Derinlik tamamen beyaz opaklık katmanlarıyla sağlanır:

```css
/* Kart — en temel yüzey */
background: rgba(255,255,255,0.03);
border-radius: 20px;

/* Buton — etkileşim yüzeyi */
background: rgba(255,255,255,0.08);
border-radius: 12px;
transition: all 0.2s ease;

/* Buton hover */
background: rgba(255,255,255,0.12);
```

### Dekoratif Derinlik
- Sayfa arka planı dikey gradient (`#1a1a2e → #16213e → #1a1a2e`) ile hafif bir "ortada aydınlanma" etkisi yaratır
- Gradient metinler (mor/pembe/mavi + altın/bronz) dekoratif odak noktası olarak çalışır
- Kadir Gecesi badge'inde `kadir-glow` animasyonu nefes alış efektiyle dikkat çeker

---

## 7. Do's and Don'ts

### Do
- Sayılarda her zaman `font-variant-numeric: tabular-nums` kullan — rakamların genişliği sabit kalmalı
- Tüm geçişlerde `all 0.2s ease` kullan — tutarlılık
- Renk değerleri için CSS custom property (variable) kullan, hardcoded renk yazma
- `100dvh` kullan `100vh` yerine — mobil tarayıcılarda toolbar kaymasından etkilenmez
- Stagger animasyonlarında `0.04s` artışlarla delay ver — doğal ve hızlı hissiyat
- Gradient metin uygulamasında hem `-webkit-background-clip` hem `-webkit-text-fill-color` kullan
- Container'ı `overflow: hidden` yap — içerik taşmasın
- Mobil-öncelikli düşün, sonra tablet/desktop'a adapt et

### Don't
- Tailwind CSS kullanma — bu proje saf CSS ile yazılır
- Framer Motion, GSAP veya herhangi bir animasyon kütüphanesi ekleme — sadece CSS transition/animation
- Google Fonts veya özel font yükleme — sistem fontları yeterli
- Light mod ekleme — sadece dark, tema değiştirme yok
- `box-shadow` ile derinlik yaratma — beyaz opaklık katmanları kullan
- `backdrop-filter: blur()` kullanma — bu projede glassmorphism yok
- `background-attachment: fixed` kullanma — mobilde sorunlu
- Gereksiz bağımlılık ekleme — React ve @vercel/analytics dışında bir şey yok
- `100vh` kullanma — `100dvh` tercih et (mobil uyumluluk)
- Geri sayım fontunda bold (`700+`) ağırlık kullanma — `300` (light) daha zarif

---

## 8. Responsive Behavior

### Breakpoints
| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | < 620px | `max-width: 430px`, geri sayım `4.5rem`, padding `32px 24px 40px` |
| Tablet | 620px - 1023px | `max-width: 620px`, geri sayım `5.5rem` |
| Desktop | >= 1024px | `max-width: 520px` (ortalanır, mobil his korunur) |

### Dokunma Hedefleri
- Butonlar minimum `44px` yükseklik (Apple HIG uyumlu)
- Şehir seçimi ve tarih butonları rahat dokunulabilir boyutta
- Namaz vakti satırları yeterli padding ile ayrılır

### Daraltma Stratejisi
- Mobil-öncelikli: tasarım 430px genişliğe göre yapılır
- Tablet'te genişlik 620px'e açılır ama layout aynı kalır (tek sütun)
- Desktop'ta 520px'e daraltılır — kasıtlı olarak mobil hissiyatı korunur, büyük ekranda ortada "kart" gibi durur
- Yatay scroll asla olmaz — `overflow: hidden`
- Dikey içerik `100dvh` içinde sınırlıdır — scroll gerektirmez

### Özel Not
Desktop'ta container genişliği tablet'ten **dar**dır (520px < 620px). Bu bilinçli bir tercih: uygulama telefon aracı olarak tasarlanmış, desktop'ta da telefon ekranı gibi hissettirmesi amaçlanmış.

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı
- **Arka plan gradient**: `#1a1a2e → #16213e → #1a1a2e` (dikey, üstten alta)
- **Ana vurgu (lavanta)**: `#a78bfa`
- **İkincil vurgu (pembe)**: `#f472b6`
- **Üçüncül vurgu (mavi)**: `#60a5fa`
- **Gradient metin**: `linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%)`
- **Alternatif gradient metin**: `linear-gradient(135deg, #fff 0%, #a78bfa 100%)`
- **Saat rakamları (altın)**: `linear-gradient(135deg, #f5e6d3, #e8d4b8, #d4b896, #c9a87c)`
- **Saat ayırıcı (altın/turuncu)**: `linear-gradient(135deg, #ffd700, #ffb347, #ff6b6b)`
- **Kart arka planı**: `rgba(255,255,255,0.03)`
- **Buton**: `rgba(255,255,255,0.08)` → hover `rgba(255,255,255,0.12)`
- **Ana metin**: `#ffffff`
- **İkincil metin**: `rgba(255,255,255,0.5)`
- **Silik metin**: `rgba(255,255,255,0.35)`
- **Kenarlık (aktif)**: `rgba(255,255,255,0.15)`
- **Kadir badge**: altın `rgba(251,191,36,0.20)` kenarlık

### Örnek Component Prompt'ları

- **Geri sayım gösterimi**: "430px genişlikte, koyu mor arka plan üzerinde altın/bronz gradient büyük rakamları olan bir geri sayım. Rakamlar 4.5rem, font-weight 300, tabular-nums. Ayırıcı (:) altın/turuncu/kırmızı gradient. Üstte mor/pembe/mavi gradient metin başlık."

- **Namaz vakti listesi**: "6 satırlık namaz vakti listesi, her satır sol hizada vakit adı (beyaz, 500) ve sağ hizada saat (rgba beyaz 0.5, 400). Satırlar rgba(255,255,255,0.03) arka plan kartında, radius 20px. Her satır 0.04s aralıkla stagger animasyonuyla girer."

- **Şehir seçici**: "Yatay buton grubu, her buton rgba(255,255,255,0.08) arka plan, 12px radius. Seçili şehir rgba(255,255,255,0.04) arka plan + rgba(255,255,255,0.15) kenarlık. Geçişler 0.2s ease."

- **Kadir Gecesi badge**: "Altın tonlarında ince gradient arka plan (rgba 251,191,36 opaklık 0.10), altın kenarlık (opaklık 0.20), 12px radius. Badge 3s'de bir nefes alır (glow), içindeki ikon 2s'de bir scale animasyonu yapar."

### İterasyon Rehberi
1. **Renk değişikliği**: Her zaman CSS variable üzerinden yap, hardcoded HEX/RGB yazma
2. **Yeni bileşen**: Aynı opaklık katmanı sistemini kullan (0.03 yüzey, 0.08 etkileşim, 0.12 hover)
3. **Animasyon ekleme**: Sadece CSS transition/animation — `all 0.2s ease` standart, stagger için `0.04s` artış
4. **Font değişikliği**: Sistem font stack'ini koru. Özel font ekleme dürtüsüne karşı koy
5. **Responsive kontrol**: 430px → 620px → 520px sırasını hatırla. Desktop, tablet'ten dardır
6. **Yeni gradient metin**: 135deg açıyla, 3 renk durağını koru (0%, 50%, 100%)

---

## Teknoloji Notu

| Katman | Seçim | Not |
|--------|-------|-----|
| Framework | React + Vite (SPA) | Next.js yok, server component yok |
| Stil | Vanilla CSS + CSS Variables | Tailwind yok, CSS-in-JS yok |
| Animasyon | CSS transition + @keyframes | Framer Motion yok, GSAP yok |
| Tema Sistemi | Yok — sadece dark | next-themes yok, tema değiştirme yok |
| Font | Sistem font stack | Google Fonts yok, özel font yok |
| Analytics | @vercel/analytics | Tek harici bağımlılık |
| Test | Node.js built-in test runner | Jest/Vitest yok |
| Deployment | Vercel | Standart SPA deploy |
