# 05 — Bileşenler ve Ekran Düzeni

Ekranlar tek tek tasarlanınca her biri kendi çözümünü bulur ve sonuç, aynı
ürünün içinde birbirine benzemeyen sayfalar olur (Açılış Zili, Eylül 2026).
Bu rehber iki şeyi sabitler: **hangi parçalar var** ve **hangi sırayla dizilir.**

---

## 1. Şablondaki Bileşenler (`components/ui/`)

`nextjs-fullstack` şablonuyla gelir. Hepsi token sınıfı kullanır, odak
halkası `--line-focus`, dokunma hedefi ≥ 44 px.

### Button / ButtonLink

```tsx
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";

<Button variant="primary">Kaydet</Button>
<Button variant="ghost" size="sm">İptal</Button>
<Button variant="danger">Hesabımı Sil</Button>
<Button variant="secondary" size="icon" aria-label="Menüyü aç"><Menu /></Button>
<ButtonLink href="/kayit" variant="primary">Ücretsiz Başla</ButtonLink>
```

- Varyant: `primary | secondary | ghost | danger`. Boy: `sm | md | lg | icon`.
- **`asChild` yok.** Bağlantı görünümlü düğme `ButtonLink`, başka bir öğe
  `buttonClass()`. Tek bileşenin iki öğe gibi davranması tipi ve
  erişilebilirliği bulanıklaştırır.
- `sm` dokunmatikte de 44 px; yalnızca fare altında (`pointer-fine:`) 36 px.
- `type="button"` varsayılan. Form gönderen düğme `type="submit"`i açıkça
  yazar; yoksa bir formun içindeki her düğme formu gönderir.
- Ekranda **tek** `primary`. İki birincil eylem, hiçbirinin birincil
  olmadığı anlamına gelir.

### Panel / PanelHeader

```tsx
<Panel>
  <PanelHeader title="Son Analizler" meta="12 Kayıt" action={<ButtonLink href="/analizler" variant="ghost" size="sm">Tümünü Gör</ButtonLink>} />
  {/* içerik */}
</Panel>
```

**Her panelin bir `h2`si var.** Başlıksız panelde nerede başladığı yalnızca
çizgiden anlaşılır; ekran okuyucu için de başlık yoktur (Açılış Zili
karşılaştırma tablosu). Başlık kalıbı kutu değil ton.

### PageHeader

```tsx
<PageHeader
  eyebrow="Bilançolar"
  title="Bu Haftanın Takvimi"
  description="Açıklama tarihi yaklaşan şirketler, beklenen hisse başı kâr ile."
  action={<DatePicker />}
/>
```

Üst künye (isteğe bağlı), ad, **tek cümlelik** açıklama, sağda o ekranın
**tek** denetimi.

### EmptyState

```tsx
<EmptyState
  title="Henüz Takip Ettiğin Şirket Yok"
  hint="Bir şirket sayfasındaki yıldıza basınca burada görünür."
  action={<ButtonLink href="/piyasalar">Piyasalara Göz At</ButtonLink>}
/>
```

Başlık Title Case, ipucu cümle. Boş durum bir hata değil bir **sonraki
adımdır**: ne olduğunu ve ne yapılacağını söyler.

### Skeleton

```tsx
<Skeleton className="h-6 w-40" />
<SkeletonLines lines={3} />
```

**İskelet içeriğin yapısıyla eşleşir.** Üç satırlık kartın iskeleti üç
satırdır, aynı yükseklikte. Yapı tutmazsa içerik gelince sayfa zıplar:
Açılış Zili'nde genel bir iskelet CLS'i 0,25'e çıkarmıştı (eşik 0,1).

### Field

```tsx
"use client";
const [state, action, pending] = useActionState(signUp, initial);

<form action={action}>
  <Field label="E-Posta" name="email" type="email" autoComplete="email" error={state.errors?.email} />
  <Button type="submit" disabled={pending}>Hesap Oluştur</Button>
</form>
```

Etiket her zaman görünür (yer tutucu etiket değildir), hata alanın altında
ve `aria-describedby` ile bağlı, `aria-invalid` hata varken açık.

### ThemeToggle

Ayrıntısı [03-theming.md](03-theming.md) § 3.

---

## 2. Şablonda Olmayan Bileşenler

Şablon yalnızca her projede gereken yedi parçayı taşır. Gerisi kopyalanarak
alınır, paket olarak kurulmaz:

- **Bileşen kütüphanesi** — `~/dev-starter/snippets/ui/`: yükleme, ikon ve
  düğme çeşitleri, popover / tooltip / dropdown / dialog / komut paleti /
  sheet, veri tablosu, ağaç görünümü, sayfalama, istatistik, sparkline, form
  ve gezinme bileşenleri. Katalog, kurulum ve her bileşenin sınırları:
  [10-component-library.md](10-component-library.md).
- **Hareket ve tema parçaları** — `~/dev-starter/snippets/` kökünde:
  `reveal.tsx`, `theme-toggle.tsx`, `rolling-number.tsx`, `animated-number.tsx`,
  `scroll-progress.tsx`, `tab-underline.tsx`, `use-scroll-lock.ts`. Kuralları
  [04-motion.md](04-motion.md) ve [03-theming.md](03-theming.md).
- **Fontlar** — `~/dev-starter/snippets/fonts/fonts.ts` preset'leri:
  [09-typography.md](09-typography.md).
- **Agentic UI** — `agent-tool.tsx`, `action-card.tsx`, `agent-approval.tsx`;
  karar için `/agentic`.
- **Tanıtım sayfası kahramanı** — `landing` şablonunda yedi düzen
  (`components/heroes/`: editorial-split, statement, product-frame, live-data,
  bento, minimal, scroll-stage), `lib/content.ts` → `hero.variant` ile seçilir.

`/snippet <ad>` ile projeye uyarlanır.

**Kaydırma kilidi neden sayaçlı:** üst üste iki katman açıldığında (formun
üstünde bir onay diyaloğu) ilki kapanınca kilit erken çözülmesin. Kilit
sayısı sıfıra inmeden sayfa serbest kalmaz (Mimio `useScrollLock`). `position: fixed` ile
kilitlenen gövde kaydırma konumunu kaybeder, geri yazılmalı (`mistakes.md` #21).

---

## 3. Ekran Düzeni: Aynı Sıra, Her Ekranda

Bir ekranı tanımak için okumak gerekmemeli.

1. **Başlık** — `PageHeader`.
2. **Künye/seçim şeridi** — ekranın neyi anlattığı (şirket kimliği, seçili
   filtreler, kapak).
3. **Ana görsel** — grafik ya da harita. Tek tane; ikincisi ölçülerin altına.
4. **Ölçü ızgarası** — sayılar. Yan yana ölçüler **aynı hatta** biter; birim
   sayıdan kopmaz.
5. **Metin** — yorum, değerlendirme.
6. **Künyeler ve uyarılar** — panelin İÇİNDE, hairline ile ayrılmış düz
   paragraf. Bir uyarı için yeni kutu açılmaz.
7. **Veri damgası** (kaynak, saat), sonra ilgili rehbere bağlantı.

Bağlı kurallar:

- **Panel aralığı sabit** (`gap-5`). İki kolonlu düzende `justify-between`
  kullanma: ızgara satırı kolonları eşit boya gerer, kısa kolon farkı panel
  aralarına dağıtır ve öteki kolona panel eklemek bu kolonun boşluklarını
  oynatır (Açılış Zili: 20 px → 92 px).
- **Karşılaştırılan büyüklük bir de çizgi olarak okunur** — sayının altındaki
  ince çubuk sıralamayı okumadan verir. Karşılaştırılamayan ölçüde çubuk hiç
  basılmaz.
- **Kaydırma saklanmaz.** Sığmayan tablo `table-fixed` ile kaba zorlanmaz;
  tabana bir genişlik verilir, yatay kaydırma kalır, ilk sütun yapışkan,
  kenarda "devamı var" gölgesi.
- **Izgara hücresi `minmax(0, 1fr)`.** Düz `1fr` uzun bir kelimeyi sığdırmak
  için kolonu genişletir ve sayfa yatay taşar (simayahi).

---

## 4. Boş, Yükleme ve Hata Durumları

Veri gösteren her panelin dört hâli vardır; tasarımda dördü de çizilir:

| Durum | Bileşen | Kural |
|-------|---------|-------|
| Yükleniyor | `Skeleton` | Yapıyla eşleşir; 300 ms'den kısa yüklemede hiç görünmemesi daha iyi |
| Boş | `EmptyState` | Ne olduğunu ve sonraki adımı söyler |
| Hata | Panel içi mesaj + "Tekrar Dene" | Sayfa çökmez; yalnızca o panel "veri alınamadı" der |
| Dolu | İçerik | |

- Segment düzeyinde `loading.tsx` **yok**: `notFound()` o zaman 200 döner
  (soft 404). Yavaş parça kendi `<Suspense>`ine alınır (06 § 6).
- Sağlayıcı anahtarı boşsa ilgili kart "veri alınamadı" gösterir, sayfa
  ayakta kalır. Bu bir hata değil, beklenen davranış.
- Hata mesajı cümledir, kullanıcının diliyle: "Fiyatlar şu an alınamıyor."
  Teknik gerekçe (HTTP kodu, sağlayıcı adı) loglanır, gösterilmez.

---

## 5. Dokunma Hedefi

- Her etkileşimli öğe ≥ 44 × 44 px (WCAG 2.5.5).
- Görsel olarak küçük kalması gereken öğe için görünmez genişletme:

```css
@layer components {
  .tap-44 { position: relative; }
  .tap-44::after {
    content: "";
    position: absolute;
    inset: 50% auto auto 50%;
    width: max(100%, 44px);
    height: max(100%, 44px);
    translate: -50% -50%;
  }
}
```

- İki hedef arasında en az 8 px. Satır içi bağlantılar istisna.
- Dokunmatikte input puntosu ≥ 16 px; altında iOS sayfayı yakınlaştırır:
  `@media (pointer: coarse) { input, select, textarea { font-size: 16px; } }`

---

## 6. Title Case

Başlık, düğme, sekme, rozet, tablo başlığı, künye: **Title Case**.
Paragraf, açıklama, hata mesajı gövdesi, yer tutucu, `aria-label`: cümle.

✅ `Tümünü Gör` · `Hesabımı Sil` · `Son 30 Gün` · `15 Dakika Gecikmeli`
❌ `Tümünü gör` · `Hesabımı sil` · `son 30 gün`

- Bağlaç ve edatlar (`ve`, `ile`, `için`, `de/da`, `mi`) küçük kalır, başta
  gelirse büyür: `Faiz, Tahvil ve Getiri Eğrisi`.
- `text-transform: capitalize` ve `.toUpperCase()` **yasak**: `i → I` üretir,
  `İ` değil. Küçültürken `toLocaleLowerCase("tr-TR")`.
- Kısaltmalar olduğu gibi: `CSV`, `KVKK`, `EPS`.
- Arayüz metninde em dash (—) yok; künyede ayraç ` · `.

---

## Kontrol Listesi

- [ ] Ekran sırası: başlık → künye → ana görsel → ölçüler → metin → uyarılar → damga
- [ ] Her panelin `h2`si var
- [ ] Ekranda tek `primary` düğme
- [ ] Dört veri durumu da çizildi
- [ ] Dokunma hedefleri ≥ 44 px, dokunmatik input ≥ 16 px
- [ ] Tüm başlık ve düğmeler Title Case, `capitalize` yok
