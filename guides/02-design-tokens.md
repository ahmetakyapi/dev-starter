# 02 — Tasarım Token'ları

Tailwind v4'te `tailwind.config.ts` yok; token'lar `app/globals.css` içinde
yaşar. Bu rehber Açılış Zili'nin iki katmanlı düzenini ekosistem varsayılanı
yapar: iki temada, üç ayrı projede ve bir yıl boyunca tutan tek yapı bu oldu.

---

## 1. İki Katman

Aşağıdaki değerler varsayılan **`signature`** paletidir: Açılış Zili'nin
lacivert → mavi tek ailesi (§ 1a). Şablonların varsayılan teması açık;
ürüne göre değişir (01 § 0).

```text
Katman 1 — ham rol değişkenleri     :root, :root[data-theme="light"] { --text-strong: #101c2b; }
             (temaya göre değişir)  :root[data-theme="dark"]          { --text-strong: #eaf1f8; }
                     │
Katman 2 — Tailwind köprüsü         @theme inline { --color-strong: var(--text-strong); }
             (hiç değişmez)
                     │
Sınıf                               text-strong
```

```css
/* app/globals.css */
@import "tailwindcss";

:root,
:root[data-theme="light"] {
  color-scheme: light;
  --page-bg: #f7f9fb;
  --surface: rgb(16 32 52 / 0.028);
  --surface-raised: rgb(16 32 52 / 0.07);
  --surface-sunken: rgb(16 32 52 / 0.045);
  --text-strong: #101c2b;
  --text-body: #54677c;
  --text-muted: #586a7c;      /* zemin 5,28:1 · kart 4,62:1 */
  --line: rgb(16 32 52 / 0.1);
  --line-soft: rgb(16 32 52 / 0.06);
  --line-strong: rgb(16 32 52 / 0.17);
  --line-focus: #0d74c4;
  --primary: #0d74c4;
  --primary-hover: #0a5a9a;
  --primary-wash: rgb(13 116 196 / 0.1);
  --primary-ink: #0c69b1;     /* wash üstündeki metin, bir basamak koyu */
  --on-primary: #ffffff;
  --success: #0c7350;
  --danger: #c01a3d;
  --accent-warm: #a4720f;     /* sıcak ikincil vurgu, seyrek */
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --page-bg: #070d16;
  --surface: rgb(255 255 255 / 0.05);
  --surface-raised: rgb(255 255 255 / 0.12);
  --surface-sunken: rgb(0 0 0 / 0.3);
  --text-strong: #eaf1f8;
  --text-body: #94a7ba;
  --text-muted: #8497a9;
  --line: rgb(255 255 255 / 0.11);
  --line-soft: rgb(255 255 255 / 0.07);
  --line-strong: rgb(255 255 255 / 0.2);
  --line-focus: #35b8ff;
  --primary: #35b8ff;
  --primary-hover: #7fd2ff;
  --primary-wash: rgb(53 184 255 / 0.14);
  --primary-ink: var(--primary);
  --on-primary: #06121f;      /* açık mavi dolgunun üstünde koyu metin */
  --success: #3ddc97;
  --danger: #ff5c7a;
  --accent-warm: #d3a04a;
}

@theme inline {
  --color-page: var(--page-bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-strong: var(--text-strong);
  --color-body: var(--text-body);
  --color-muted: var(--text-muted);
  --color-line: var(--line);
  --color-primary: var(--primary);
  --color-primary-wash: var(--primary-wash);
  --color-primary-ink: var(--primary-ink);
  --color-on-primary: var(--on-primary);
}
```

Dikkat edilecek iki şey: koyu temada `--on-primary` **koyu**dur (açık mavi
dolgu üstünde beyaz metin AA'yı tutmaz), ve kart zeminleri opak renk değil
metin renginin çok düşük opaklıklı tonudur. Derinlik gölgeden değil bu ton
farkından gelir.

**Neden `inline`:** `@theme` (inline olmadan) değeri derleme anında çözer ve
sınıfa sabit renk yazar; tema değişince sınıf değişmez. `inline`,
`var(--text-strong)` referansını korur, tema değişimi yalnızca katman 1'i
yeniden tanımlayarak her sınıfa yayılır.

**Neden `color-scheme`:** kaydırma çubukları, form denetimleri ve `<select>`
açılır listesi bunu okur. Yazılmazsa koyu temada beyaz kaydırma çubuğu kalır.

---

## 1a. Palet Katmanı

Yukarıdaki değerler `signature` paletidir. Rol adları ve mimari her
projede aynıdır (kimlik); renk ailesi projeye göre `data-palette` ile seçilir
ve `data-theme` ile birleşir:

```css
:root[data-palette="verdant"],
:root[data-palette="verdant"][data-theme="light"] { --primary: /* ... */; }
:root[data-palette="verdant"][data-theme="dark"]  { --primary: /* ... */; }
```

Palete giren token'lar: `--primary` ailesi (`-hover`, `-soft`, `-wash`,
`-ink`, `--on-primary`, `--line-focus`), `--display-gradient(-tight)`,
`--brand-gradient`, zemin ve metnin hafif renk eğilimi. Geri kalan her şey
kimliktir, palet değiştirmez. Hangi ürüne hangi palet ve yeni paletin nasıl
ölçülerek türetileceği: [00-brand-identity.md](00-brand-identity.md).

---

## 2. Adlandırma — Rol Adı, Renk Adı Değil

✅ `--text-muted`, `--surface-raised`, `--primary-wash`, `--danger`
❌ `--slate-400`, `--indigo-50`, `--red`

**Neden:** açık temada `--slate-400` hangi renk olacak? Renk adı tema
değişince yalan söyler. Rol adı iki temada da doğrudur.

Sözleşmedeki tam liste:

| Grup | Token'lar |
|------|-----------|
| Zemin/yüzey | `--page-bg` `--surface` `--surface-raised` `--surface-sunken` `--overlay` `--scrim` |
| Metin | `--text-strong` `--text-body` `--text-soft` `--text-muted` |
| Kenarlık | `--line` `--line-soft` `--line-strong` `--line-focus` |
| Vurgu | `--primary` `--primary-hover` `--primary-soft` `--primary-wash` `--primary-ink` `--on-primary` |
| Durum | `--success` `--warning` `--danger` (+ `-wash`) |
| Gölge | `--shadow-sm` `--shadow-md` `--shadow-overlay` |

### `-wash`, `-ink`, `on-*`

Üçü bir arada çözülmesi gereken tek bir sorun için var: **renkli bir zemin
üstündeki metin.**

- `--primary-wash` — vurgunun çok açık zemini (rozet, seçili satır).
- `--primary-ink` — wash zemin üstüne yazılan metin. `--primary`den bir
  basamak koyu, çünkü `--primary` kendi wash'ının üstünde AA'yı tutmaz.
- `--on-primary` — dolu `--primary` zemin üstündeki metin (düğme).

```tsx
✅ <span className="bg-primary-wash text-primary-ink">Yeni</span>
❌ <span className="bg-primary-wash text-primary">Yeni</span>   {/* 3,1:1 */}
✅ <button className="bg-primary text-on-primary">Kaydet</button>
❌ <button className="bg-primary text-white">Kaydet</button>     {/* koyu temada? */}
```

Açılış Zili'nin en çok tekrarlanan bileşeni `ChangePill` (`bg-up-wash`,
11–12 px) bu yüzden sayfa zemininde değil **kendi wash'ı üzerinde** ölçülür
ve oran token tablosuna yazılır (`knowledge/themes/acilis-zili.md`).

---

## 3. Punto Ölçeği ve Ad Çakışması

Punto da rol adıyla yazılır:

```css
@theme {
  --text-micro: 0.6875rem;   /* 11 */
  --text-small: 0.75rem;     /* 12 */
  --text-base: 0.875rem;     /* 14 — arayüz varsayılanı */
  --text-read: 1rem;         /* 16 — okuma gövdesi */
  --text-lead: 1.125rem;
  --text-title: 1.25rem;
  --text-heading: 1.5rem;
  --text-display: 2.25rem;
  --text-hero: clamp(2.5rem, 6vw, 4.5rem);
}
```

**Tuzak 1 — `--text-body` çakışması.** Tailwind v4'te `--text-*` ad alanı
PUNTO demektir. Renk token'ı `--text-body` de `text-body` sınıfını üretmek
ister. Bu yüzden gövde puntosunun adı `read`dir, `body` değil; renk tarafı
katman 2'de `--color-body` olarak köprülenir.

**Tuzak 2 — `twMerge` özel puntoları tanımaz.** `cn("text-small", "text-strong")`
sonucunda `text-small` **sessizce silinir**: birleştirici tanımadığı `text-*`
adını renk sayar, iki "renk" sınıfından sonuncusu kazanır. Açılış Zili'nde
çipler, rozetler ve künyeler aylarca olması gerekenden büyük çizildi; kodda
doğru sınıf yazılı olduğu için görünmüyordu.

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const TEXT_SIZES = ["micro", "small", "base", "read", "lead", "title", "heading", "display", "hero"] as const;

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: [...TEXT_SIZES] }] } },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

Yeni bir punto eklersen bu listeye de ekle; renkleri ekleme.

**Tuzak 3 — `next/font` değişken adı.** `Manrope({ variable: "--font-sans" })`
ile `@theme { --font-sans: ... }` aynı adı taşırsa öz-referans olur ve font
düşer. Font değişkenine farklı ad ver, köprüde bağla:

```ts
const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope" });
```
```css
@theme inline { --font-sans: var(--font-manrope), system-ui, sans-serif; }
```

---

## 4. Radius, Gölge, Aralık

```css
@theme {
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

- **Radius iç içe küçülür:** dış kap `rounded-xl`, iç kart `rounded-lg`. İç
  radius dıştan büyükse köşede boşluk "şişer".
- **Tek gerçek gölge.** Açılış Zili derinliği gölgeyle değil ton farkıyla
  kurar; gölge yalnızca gerçekten havada duran katmanda (`--shadow-overlay`:
  menü, diyalog). ElevenForge iki katmanlı gölge kullanır (yakın keskin +
  uzak yumuşak); ikisini de yapma, birini seç.
- **Aralık Tailwind'in 4 px ızgarası.** Paneller arası `gap-5`, panel içi
  `p-5 sm:p-6`. Rastgele `mt-[13px]` yok; ölçü bir karar ise yorumuna yaz.

---

## 5. Açık Tema Yeniden Tasarlanır, Ters Çevrilmez

❌ Koyu temanın açıklığını tersine çevirmek: `#0a0f1a` → `#f5f0e5`.
✅ Açık temayı kendi başına tasarlamak: zemin hafif soğuk gri, kartlar beyaz,
   kenarlık daha belirgin, gölge daha yumuşak.

**Neden:** koyu temada derinlik ışıktan gelir (öne çıkan kart daha açık),
açık temada kartın kendi renginden ve kenarlıktan. ElevenForge'un ilk açık teması
yalnızca grileri ters çevirmişti ve üç şey kırıldı: yarı saydam paneller
neredeyse beyaz zeminde kenarsız kaldı (tüm ekran tek bir yaprak gibi
okundu), koyu temanın altın vurgusu beyazda ~1,6:1'e düştü ve siyaha
ayarlı gölgeler beyazda kir gibi durdu. Düzeltme: zemin tonlu, kartlar
OPAK beyaz, her vurgu aynı rengin bir basamak koyusu. Bu dizilim koyu
temanın tersidir; aynı değerleri çevirerek ifade edilemez.

Kontrol: her ekranı iki temada aynı anda aç. Biri "bitmemiş" görünüyorsa o
temanın kendi kararı eksiktir.

---

## 6. Kontrast Hedefleri

| Ne | Oran | Not |
|----|------|-----|
| Gövde metni | ≥ 4,5:1 | WCAG AA |
| `--text-muted` | ≥ 4,5:1 | Künye de metindir; "soluk" estetiği AA'yı ezmez |
| Büyük metin (≥ 24 px ya da ≥ 19 px kalın) | ≥ 3:1 | |
| İkon, kenarlık, odak halkası | ≥ 3:1 | WCAG 1.4.11 |
| `-ink` / `-wash` çifti | ≥ 4,5:1 | Her durum rengi için ayrı ölç |

Ölçtüğün oranı token'ın yanına yaz:

```css
--text-muted: #586a7c; /* zemin 5,28:1 · kart 4,62:1 — ölçüldü, Açılış Zili */
```

Açılış Zili'nde eski `--text-muted` sayfada 3,50:1, kart zemininde
3,06:1 veriyordu ve 10–13 px künyelerde kullanılıyordu; yeni değer iki
zeminde 5,28 ve 4,62.

---

## 7. Degrade Metin — Belgeli İstisna

Varsayılan: metin düz renktir. İstisna yalnızca kısa display metninde ve dört
şartla:

```css
.display-ink { color: var(--text-strong); }              /* 1. solid fallback ÖNCE */

@supports (background-clip: text) or (-webkit-background-clip: text) {   /* 2. korumalı */
  .display-ink {
    background-image: var(--display-gradient);            /* 3. token'dan */
    background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 0.06em;                               /* 4. g, y, ş kırpılmasın */
  }
}
```

- Fallback'siz degrade metin, kırpmayı desteklemeyen yerde **görünmez** olur
  (üç projede bulundu, `mistakes.md` #42).
- `.display-ink` içindeki bir çocuğa `opacity`/`transform` verme: yeni
  stacking context kırpmayı bozar.
- Degrade yalnızca **üç yerde**: kısa display başlık (`.display-ink`),
  birincil eylem düğmesi ve marka karosu. Veri gösteren paneller ve gövde
  metni degrade taşımaz (Açılış Zili ve Mimio kuralı).

```css
:root, :root[data-theme="light"] {
  --display-gradient: linear-gradient(112deg, #0a2140 0%, #0e4a8f 44%, #1272c9 76%, #2493dd 100%);
  --display-gradient-tight: linear-gradient(100deg, #0a2547 0%, #1e6fbe 100%); /* 13–16 px, açık uç AA sınırında */
  --brand-gradient: linear-gradient(150deg, #5cc4ff 0%, #1f86e0 48%, #0b3f86 100%); /* CTA + marka karosu */
}
:root[data-theme="dark"] {
  --display-gradient: linear-gradient(112deg, #f2f7fc 0%, #b6e2ff 44%, #74caff 76%, #3fbcff 100%);
  --display-gradient-tight: linear-gradient(100deg, #eef5fc 0%, #58c4ff 100%);
}
```

---

## 8. `dark:` Yerine Token

```tsx
❌ <p className="text-slate-700 dark:text-slate-300">
✅ <p className="text-body">
```

**Neden:** `dark:` her satıra ikinci bir renk ekler, üçüncü tema (yüksek
kontrast) geldiğinde her satıra üçüncüsü gerekir. Token tek yerde döner.
Mimio'da `dark:` yasak; Açılış Zili'nde hiç yok. Tailwind'in hazır paleti
(`bg-white`, `text-gray-500`, `bg-indigo-600`) da aynı sebeple yok: bir
renk sınıfı görürsen ya token'dır ya hatadır.

Tek meşru `dark:` kullanımı: tema token'ı olmayan üçüncü taraf bir bileşeni
geçersiz kılmak. Onu da yoruma yaz.

---

## 9. Katmansız CSS Utility'yi Ezer

Tailwind v4 yardımcıları `@layer utilities` içindedir. **Katmansız yazılmış
her kural, katmandaki her kuraldan güçlüdür** — özgüllükten bağımsız.

```css
❌ a { color: var(--primary); }           /* text-strong sınıfını EZER */
✅ @layer base { a { color: var(--primary); } }
```

Element varsayılanları `@layer base`, bileşen sınıfları `@layer components`.
Katmansız kalan tek şey bilerek her şeyi ezmesi gerekenlerdir (ör.
`prefers-reduced-motion` kısaltması). Açılış Zili `globals.css`inin "Temel"
bölümü bu tuzağı başlığına yazar: katmansız `a { color }` ya da
`h1 { font-size }` sayfadaki `text-primary` / `text-3xl`i ezer.

---

## Kontrol Listesi

- [ ] Her renk iki katmandan geçiyor, `@theme inline` kullanılıyor
- [ ] Hiç `dark:` ve hazır palet sınıfı yok (`grep -rn "dark:\|-gray-\|bg-white" app components`)
- [ ] Özel punto adları `cn()` içinde kayıtlı
- [ ] `next/font` değişken adı `@theme` adıyla çakışmıyor
- [ ] Kontrast oranları ölçülüp token yorumuna yazılmış
- [ ] Element varsayılanları `@layer base` içinde
