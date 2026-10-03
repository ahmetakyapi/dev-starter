# 04 — Hareket

Hareket bir bilgi taşır: neyin nereden geldiğini, neyin değiştiğini, neyin
beklendiğini. Taşımıyorsa süs olur ve süs, okuyucunun beklediği her
milisaniyede vergi keser. Ekosistem kuralı: **basit şey CSS'le, orkestrasyon
`motion/react` ile.** GSAP yok.

---

## 1. Kütüphane: `motion/react`, LazyMotion + `m`

Kütüphanenin güncel adı `motion` (eski paket adı `framer-motion`); import yolu
`motion/react`. Yeni projede `framer-motion` kurulmaz.

```tsx
// components/motion/MotionProvider.tsx
"use client";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
```

```tsx
// bileşende
import * as m from "motion/react-m";        // ya da: import { m } from "motion/react"
<m.div animate={{ opacity: 1 }} />
```

- **`m` + LazyMotion:** `motion.div` bütün özellikleri (sürükleme, layout,
  jestler) bileşenle birlikte indirir; `m.div` özelliksiz gelir (~4,6 KB) ve
  yalnızca sağlayıcıda seçilen özellik paketini (`domAnimation`) yükler.
- **`strict`:** biri yanlışlıkla `motion.div` yazarsa çalışma anında hata
  verir; sessizce paketi büyütmez (`mistakes.md` #36).
- **`reducedMotion="user"`:** işletim sistemi tercihini her animasyona uygular;
  transform hareketleri kapanır, opaklık kalır.
- Sürükleme ya da `layout` animasyonu gerekiyorsa `domMax` — yalnızca o
  ekranın sağlayıcısında.

---

## 2. Sabitler: `lib/motion.ts`

```ts
// lib/motion.ts — "use client" DEĞİL: sunucu bileşeni de okur
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DUR = { fast: 0.16, base: 0.28, slow: 0.5, page: 0.6 } as const;

export const SPRING = {
  snappy: { type: "spring", stiffness: 500, damping: 40 },
  soft: { type: "spring", stiffness: 120, damping: 22, mass: 0.8 },
} as const;

export const STAGGER = 0.06;

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
} as const;
```

**Neden `"use client"` değil:** `"use client"` bir modülden dışa aktarılan
DEĞER sunucu bileşenine gerçek değer olarak gelmez, istemci referansına
dönüşür; ne derleme ne çalışma zamanı uyarır (Açılış Zili, `mistakes.md`).
Sabitler nötr modülde durur.

CSS tarafında aynı eğri token'dır ve **her geçişin varsayılanıdır:**

```css
:root { --ease-brand: cubic-bezier(0.22, 1, 0.36, 1); }
@theme {
  --default-transition-timing-function: var(--ease-brand);
  --default-transition-duration: 180ms;
}
```

Açılış Zili'nde 114 `transition-colors` iki farklı ritimde çalışıyordu
(Tailwind varsayılanı ve marka eğrisi); varsayılanı değiştirmek hepsini tek
satırda hizaladı.

---

## 3. Süre Tablosu

| Tür | Süre | Örnek |
|-----|------|-------|
| Mikro | 120–180 ms | Hover rengi, düğme basışı, onay işareti |
| Panel | 240–320 ms | Açılır menü, akordeon, sekme alt çizgisi, çekmece |
| Sayfa | 400–600 ms | Kahraman girişi, rota geçişi, tema dairesi |
| Ortam | ≥ 8 s, döngü | Aurora sürüklenmesi (yalnız görünürken) |

- Çıkış girişten kısa (~%70): kapanan şey beklenmez.
- Kullanıcının tetiklediği hareket 300 ms'yi nadiren geçer; geçerse "yavaş
  site" diye okunur.
- Bir ekranda en fazla **bir** sayfa ölçeğinde hareket.

---

## 4. Reveal Kuralları

```tsx
// components/motion/Reveal.tsx
"use client";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { DUR, EASE } from "@/lib/motion";

export function Reveal({ children, delay = 0, y = 16 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : DUR.slow, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}
```

Üç kural, üçü de yaşandı:

1. **Reduced-motion'da `initial={false}` KULLANMA.** SSR HTML'i `opacity: 0`
   ile gelir; `initial={false}` kütüphaneye "zaten hedefte" der ve
   `whileInView` hiç tetiklenmez: içerik kalıcı görünmez kalır (simayahi,
   Playwright ile teşhis). `initial` hedefini değiştir.
2. **Kahraman ve LCP öğesi Reveal'e sarılmaz.** `opacity: 0` ile başlayan
   bir öğe tarayıcı için "boyanmamış" demektir; LCP hidrasyon + animasyon
   süresi kadar gecikir. Kahraman ya hiç hareket etmez ya da yalnızca CSS
   ile, `opacity` 0'dan değil 0,01'den başlayarak.
3. **`once: true`.** Geri kaydırınca tekrar oynayan içerik titrer gibi okunur
   (keskealsaydim).

JavaScript kapalıyken de içerik görünmeli: kritik metni Reveal'in dışında
tut ya da CSS sürümünü kullan (§ 7).

---

## 5. Stagger

```tsx
<m.ul initial="hidden" whileInView="show" viewport={{ once: true }}
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}>
  {items.map((it) => <m.li key={it.id} variants={fadeUp}>{it.title}</m.li>)}
</m.ul>
```

- Gecikme 40–80 ms; toplam kademe **≤ 400 ms**. On iki kartlık ızgarada
  kademe dördüncü öğeden sonra sabitlenir (Açılış Zili `.page-enter`:
  `:nth-child(n + 4)` hep 135 ms).
- Kademe okuma sırasını izler. Izgarada satır satır, rastgele değil.

---

## 6. `layoutId`

Paylaşılan öğe geçişi (sekme alt çizgisi, seçili hap):

```tsx
{tabs.map((t) => (
  <button key={t.id} onClick={() => setActive(t.id)} className="relative">
    {t.label}
    {active === t.id && <m.span layoutId={`tab-underline-${groupId}`} className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
  </button>
))}
```

- `layoutId` sayfada **benzersiz** olmalı; aynı bileşen iki kez basılırsa
  grup kimliğiyle ayır (`mistakes.md` #8).
- `layout` animasyonu `domMax` ister. Yalnızca bir alt çizgi için bunu
  indirmek istemiyorsan ahmetakyapi.com yolu: konum ve genişliği ölç, CSS
  değişkenine yaz (`--pill-x`, `--pill-w`), `transform` ile kaydır.
  Snippet: `snippets/tab-underline.tsx`.

---

## 7. Kaydırma

**Önce CSS.** Kaydırmaya bağlı belirme için kütüphane gerekmez:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal-on-scroll {
      animation: rise linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
}
@keyframes rise { from { opacity: 0; translate: 0 24px; } }
```

Desteklemeyen tarayıcı öğeyi olduğu gibi görür; hiçbir şey gizli kalmaz.
ahmetakyapi.com bütün reveal'lerini böyle yapar, sıfır JS.

**Değere bağlı hareket** (paralaks, ilerleme çubuğu) için `useScroll`:

```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);
const smooth = useSpring(y, { stiffness: 120, damping: 22 });
<m.div ref={ref} style={{ y: smooth }} />
```

Snippet: `snippets/scroll-progress.tsx`.

---

## 8. Sayfa Geçişleri

İki yol, ikisi de hafif:

**a) `template.tsx` + CSS** — her gezinmede yeniden bağlanır:

```tsx
// app/(app)/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
```
```css
@keyframes page-enter { from { opacity: 0; transform: translateY(6px); } }
.page-enter { animation: page-enter 0.3s var(--ease-brand); }   /* fill-mode YOK */
@media (prefers-reduced-motion: reduce) { .page-enter { animation: none; } }
```

**Fill-mode yazma (`both`, `forwards`).** Son kare `transform: translateY(0)`
olarak kalıcı uygulanır; sıfır bile olsa bir transform, içindeki her
`position: fixed` öğe için kapsayıcı blok oluşturur. ElevenForge'da bütün
diyaloglar görünüme değil `<main>`e tutundu ve sayfanın aşağısında açıldı.
`filter`, `backdrop-filter`, `perspective`, `will-change: transform` aynı
hatayı geri getirir.

**b) View Transitions** — React 19.2'nin `<ViewTransition>`ı ya da
`document.startViewTransition`. Tema geçişinde kullanılıyor (03 § 3);
rota geçişinde kullanacaksan önce iki temada, sonra yavaş CPU'da dene.

Gezinme bekleniyorsa bir sinyal ver ama hemen değil: Açılış Zili'nin
`RouteProgress`i 420 ms sonra "yükleniyor" der; daha hızlı gelen sayfada
hiç görünmez.

---

## 9. Sayaçlar

Display sayısı için `RollingFigure` deseni (Açılış Zili): **sunucuda çizilir,
JS yok.** Her rakam kendi penceresinde 0–9 şeridinin iki turu olarak basılır,
CSS şeridi son rakama kaydırır.

- Biçim ilk karede tam ("54.114,33 $"); istemci sayacı ara karelerde "54.1"
  gibi yarım biçimler basar.
- Genişlik sıçramaz: pencere genişliğini son rakamın görünmez kopyası belirler.
- Ekran okuyucu sayının tamamını düz metin duyar; şeritler `aria-hidden`.
- **Yalnızca ilk ekranda.** Aşağıdaki sayıya konursa okuyucu oraya indiğinde
  dönüş bitmiş olur; orası için görünüme girişte oynayan ayrı bir sürüm.

Snippet: `snippets/rolling-number.tsx`. Değer **değiştiğinde** sayan sayaç
(hesap makinesi sonucu) üçüncü bir iştir: `useSpring` ile, `animated-number`.

---

## 10. Mikro Etkileşimler

```css
.btn { transition: background-color, color, transform; }
.btn:active { transform: scale(0.97); }
```

- Basış geri bildirimi `scale(0.97)`, 120 ms.
- Hover yalnızca `@media (hover: hover)` altında; dokunmatikte yapışıp kalır.
- Kart parlaması: imleç konumunu `--mx/--my` değişkenine yaz, degradeyi CSS
  çizsin (ahmetakyapi.com). React state'i her `mousemove`da yeniden çizim.

---

## 11. Ne Zaman Animasyon YAPMA

- Veri tablosu satırları, form alanları, hata mesajları (hata hemen görünür).
- Okuyucunun **beklediği** her şey: arama sonuçları, filtre değişimi.
- Sürekli dönen ticker, sonsuz marquee **uygulama içinde** (keskealsaydim
  uygulama içi piyasa ekranından ticker'ı kaldırdı: okunmak için beklemek
  gerekiyordu).
- Aynı anda iki büyük hareket.
- Kahraman başlığına harf harf yazma efekti: LCP'yi ve ekran okuyucuyu bozar.

---

## 12. Performans

- **Yalnızca `transform` ve `opacity`.** `width`, `height`, `top`, `left`,
  `margin` animasyonu her karede yerleşim hesaplatır (`mistakes.md` #44).
  Yükseklik açılımı için `grid-template-rows: 0fr → 1fr` ya da
  `interpolate-size: allow-keywords` (`@supports` ile).
- **`will-change` disiplini:** kalıcı yazma. Yalnızca animasyon başlamadan
  hemen önce ekle, bitince kaldır; her öğede `will-change: transform` GPU
  belleğini doldurur ve fixed öğe hatasını (§ 8) geri getirir.
- Sonsuz animasyon yalnızca görünürken: `IntersectionObserver` ya da
  `animation-play-state: paused`.
- 4x yavaş CPU ile bir kez dene (DevTools → Performance). Hızlı makinede
  görünmeyen kasılma orada çıkar.

---

## 13. Desen Kataloğu — Ölçülü Ama Unutulmaz

Awwwards seviyesindeki sitelerin çoğu az sayıda hareketi çok iyi yapar.
Her birinin sınırı yanında:

| Desen | Nasıl | Sınır |
|-------|-------|-------|
| **Satır satır başlık** | Her satır `overflow: hidden` kabında, iç span `translateY(100%) → 0`, 60 ms kademe | Yalnızca display başlık; metin DOM'da tek parça kalır (`aria-label` gerekmez) |
| **Maskeli görsel açılışı** | `clip-path: inset(100% 0 0 0) → inset(0)`, 600 ms | Kahraman görseli değilse; LCP görseli maskelenmez |
| **Magnetic düğme** | İmlece doğru `x/y` yay, güç 0,2–0,3 | Yalnızca `(hover: hover) and (pointer: fine)`; dokunmatikte kapalı |
| **Paralaks** | `useScroll` + `useTransform`, ±40 px | Bir ekranda tek katman; reduced-motion'da sıfır |
| **Marquee** | CSS `translateX(-50%)` döngüsü, iki kopya | Hover ve odakta durur, ikinci kopya `aria-hidden` + `tabIndex={-1}`, reduced-motion'da statik |
| **Sayaç** | `RollingFigure` | İlk ekranda bir kez |
| **İmleç takibi** | `--mx/--my` ile radyal parlama | Yalnızca `pointer: fine` |
| **Sekme göstergesi** | `layoutId` ya da ölçülen `--pill-x` | Panel süresi, 240 ms |

```css
@media (hover: hover) and (pointer: fine) {
  .magnetic { /* yalnızca burada etkinleşir */ }
}
.marquee:hover .track,
.marquee:focus-within .track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .marquee .track { animation: none; } }
```

---

## Kontrol Listesi

- [ ] `framer-motion` yok, `motion/react` + `m` + LazyMotion `strict`
- [ ] Süreler `DUR`'dan, eğri `EASE`/`--ease-brand`'den
- [ ] Kahraman/LCP Reveal'e sarılı değil
- [ ] Reduced-motion'da `initial` hedefi değişiyor, `initial={false}` yok
- [ ] Sayfa giriş animasyonunda fill-mode yok
- [ ] Yalnızca `transform` ve `opacity` animasyonu
- [ ] Magnetic/imleç efektleri `pointer: fine` altında
