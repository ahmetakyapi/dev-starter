# 01 — İlk Gün ve İlk Hafta

Bir projenin kalitesi büyük ölçüde ilk haftada kurulan iskelete bağlı. Sonradan
eklenen tema sistemi, sonradan eklenen CI ve sonradan düşünülen erişilebilirlik
hep iki kat pahalıya geldi. Bu sayfa sırayla yürünür; her madde bir kutu.

---

## Sıfırıncı Adım: `/kickoff`

```text
/kickoff "ergoterapistler için seans takip uygulaması"
```

Kod yazmayan ilk adım. `strategist` ajanı en fazla beş soru sorar, pazarı
tarar, yön seçenekleri ve MVP planı çıkarır; sonuç `docs/KICKOFF.md` ve
taslak `docs/PRODUCT.md` olur. Teknoloji önerisi
[../knowledge/tech-radar.md](../knowledge/tech-radar.md) dışına çıkıyorsa
gerekçesiyle yazılır. **Palet ve varsayılan tema da
burada seçilir** (ürün türü ve kullanım anına göre, bkz.
[00-brand-identity.md](00-brand-identity.md) § 2). Plan onaylanınca
`/new-project`e geçilir; şablon, palet ve tema KICKOFF.md'den gelir. Aşağıdaki ürün sorusu bu adımın
çekirdeğidir: `/kickoff` kullanmasan da üç cümleyi yaz.

**Neden önce strateji:** iskelet kurulduktan sonra yön değiştirmek, kurulan
iskeletin bir kısmını çöpe atmak demektir. Var olan bir projede "sırada ne
var" sorusu için `/roadmap`.

---

## 0. Ürün Sorusu — Kod Yazmadan Önce

Üç cümle yaz, `docs/PRODUCT.md`nin başına koy:

1. **Kimin için?** "Yatırımcı" değil: "Türkiye'den ABD borsasını izleyen,
   akşam 16:30'da telefonuna bakan bireysel yatırımcı."
2. **Ne zaman kullanılıyor — gündüz mü gece mi?** Bu soru varsayılan temayı
   (ürün türüyle birlikte paleti de, 00 § 2) belirler:

   | Ürün | Kullanım anı | Varsayılan tema | Örnek |
   |------|--------------|-----------------|-------|
   | Araç, veri, okuma | Gündüz, masa başı | **Açık** (şablon varsayılanı) | Açılış Zili, Mimio |
   | Portfolyo, vitrin | Akşam, merak | **Koyu** | ahmetakyapi.com |
   | Oyun, eğlence | Gece | **Koyu** | dungeon-mates |

   **Neden:** "Koyu havalı durur" refleksiyle başlayan Mimio bir klinik aracı
   olduğu için Ağustos 2026'da açık temaya çevrildi; açık tema baştan
   tasarlanmadığı için her ekran yeniden ele alındı.
3. **Tek bir ölçü:** Bu ürün işini yapıyorsa hangi sayı değişir? (günlük
   dönen kullanıcı, okunan analiz, kaydedilen seans)

✅ "Seans sonrası 2 dakikada not düşen terapist için, gündüz, açık tema."
❌ "Modern, kullanıcı dostu bir sağlık platformu."

---

## 1. Şablon Seçimi

| Şablon | Ne zaman | İçinde |
|--------|----------|--------|
| `nextjs-fullstack` | Oturumu, veritabanı olan her uygulama | Drizzle + Neon, next-auth v5, proxy.ts, tema, bileşen kataloğu |
| `landing` | Tek sayfalık tanıtım, vitrin | Tema, hareket kataloğu, yedi kahraman düzeni (`hero.variant`), SEO dosyaları, veritabanı yok |
| `+ agentic-chat` | Üstüne LLM sohbeti eklenecekse | AG-UI overlay, `/agentic` ile karar ver |

```text
/new-project proje-adi
```

Komut şablonu kopyalar, `PROJECT_NAME` ve `PROJECT_DESCRIPTION` yer
tutucularını değiştirir, `npm install` + build + typecheck + lint + test koşar.
**Neden hepsi:** şablonun kendisi kırıksa bunu ilk gün öğrenmek istersin, ilk
deploy'da değil (`knowledge/mistakes.md` #49 ve #53: şablonda çalışmayan lint
ve hiç derlenmeyen Tailwind aylarca fark edilmedi).

---

## 2. Belgeler — Üç Dosya, İlk Gün

```bash
mkdir -p docs
cp ~/dev-starter/templates/docs/PRODUCT.template.md  docs/PRODUCT.md
cp ~/dev-starter/templates/docs/ROUTEMAP.template.md docs/ROUTEMAP.md
cp ~/dev-starter/templates/docs/DESIGN.template.md   docs/DESIGN.md
```

(`/kickoff` çalıştıysa `docs/KICKOFF.md` ve taslak `PRODUCT.md` zaten var.)

- **PRODUCT.md** — yukarıdaki üç cümle + kapsam dışı listesi. Kapsam dışını
  yazmayan proje her hafta büyür.
- **ROUTEMAP.md** — yalnızca DURUM: canlıda ne var, ne yarım, ne bilinçli
  olarak yapılmadı. Rota listesi README'de tutulur; Açılış Zili'nde iki ayrı
  rota tablosu tutulunca biri on üç rota geride kaldı.
- **DESIGN.md** — tema kararları. Bir referans tema seçtiysen
  (`knowledge/themes/*.md`) oradan başla, kopyalama: **farkı** yaz.

`CLAUDE.md` şablonla gelir; ilk gün "Hızlı Komutlar" ve "Bilinmesi
Gerekenler" bölümlerini projeye göre düzelt.

---

## 3. Ortam Değişkenleri

```bash
cp .env.example .env.local
```

Şablonda `lib/env.ts` zod ile doğrular:

```ts
// lib/env.ts (özet)
const server = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});
```

Kurallar:

- **Boş string tanımsız sayılır.** `.env.local`de `FOO=` satırı "var ama boş"
  değil "yok" demektir; aksi hâlde `z.string().url()` boş dizeye takılır.
- **Yeni değişken = üç yer:** `.env.local`, `.env.example` (değersiz),
  Vercel → Settings → Environment Variables. Biri unutulursa build geçer,
  üretim çöker (`mistakes.md` #12).
- **İstemcinin okuyacağı her şey `NEXT_PUBLIC_`** — ve bu yüzden asla secret
  değil.
- Build sırasında veritabanı yoksa `SKIP_ENV_VALIDATION=1` kaçışı var; CI'da
  kullanılır, yerelde değil.

---

## 4. Neon

1. Neon'da proje aç, bölge: **AWS eu-central-1** (Frankfurt, Türkiye'ye en yakın).
2. `main` dalının bağlantı dizesini (pooled) `DATABASE_URL`e yaz.
3. Geliştirme için ayrı bir **dal** aç; üretim verisine yerelden yazma.
4. İlk şema:

```bash
npm run db:generate   # lib/schema.ts → drizzle/0000_*.sql
npm run db:migrate    # uygula
```

**Migration'lar deploy'da uygulanmaz.** Bunu ilk gün `docs/ROUTEMAP.md`ye
yaz; ayrıntısı [07-data-auth-security.md](07-data-auth-security.md).

---

## 5. Vercel ve İlk Deploy

```bash
vercel link          # projeyi bağla
vercel env pull      # (isteğe bağlı) üretim env'ini yerele çek
git push origin main # ilk deploy
```

İlk deploy **boş sayfayla** yapılır, özellik beklemeden. Neden: alan adı, env,
build ayarları ve bölge sorunları en ucuz o anda çözülür. Kontrol:

- [ ] Node sürümü `.nvmrc` ile aynı (24)
- [ ] Fonksiyon bölgesi veritabanıyla aynı (`fra1`)
- [ ] `/api/health` 200 dönüyor
- [ ] Olmayan bir adres **404** dönüyor, 200 değil (soft 404, bkz. 06)

---

## 6. CI

Şablonun `.github/workflows/ci.yml` dosyası sırayı sabitler:

```yaml
- run: npm ci
- run: npm run build      # PageProps/RouteContext tiplerini üretir
- run: npm run typecheck  # build'den SONRA
- run: npm run lint
- run: npm test
```

**Neden build önce:** Next 16 global `PageProps<"/r">` ve `RouteContext`
tiplerini `.next/types` altında üretir ve o klasör gitignore'dadır. Temiz bir
kopyada typecheck önce koşarsa onlarca "Cannot find name 'PageProps'" hatası
verir; kod sağlamdır, tipler henüz yoktur (Açılış Zili). Alternatif:
`npx next typegen`.

---

## 7. Alan Adı

- Vercel → Domains → alan adını ekle, `www` → kök alan adı (apex) yönlendirmesi.
- `NEXT_PUBLIC_SITE_URL=https://alanadi.com` — `lib/site.ts` sırayla
  `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `localhost`
  okur. **Neden sıra:** önizleme dağıtımlarında OG görseli ve canonical
  adres önizleme alanına değil, üretime işaret etmeli (simayahi).

---

## 8. Analitik

```bash
npm i @vercel/analytics @vercel/speed-insights
```

```tsx
// app/layout.tsx, <body> sonunda
<Analytics />
<SpeedInsights />
```

Speed Insights gerçek kullanıcıların Core Web Vitals değerini verir;
Lighthouse laboratuvar ölçümüdür, ikisi farklı sorulara cevaptır.
Çerezsiz ölçüm olduğu için KVKK onay bandı gerektirmez; kendi olay takibini
eklersen bu değişir.

---

## 9. SEO Temelleri

Şablonda hazır, ilk gün yalnızca içerik doldurulur:

| Dosya | Görev |
|-------|-------|
| `app/layout.tsx` → `metadata` | `metadataBase`, `title.template`, açıklama, `alternates.canonical` |
| `app/sitemap.ts` | Herkese açık rotalar |
| `app/robots.ts` | Önizleme ortamında `disallow: "/"` |
| `app/opengraph-image.tsx` | Tek OG şablonu, metin temadan |
| `app/icon.svg`, `app/manifest.ts` | Sekme ikonu, PWA künyesi |

✅ `title: { template: "%s · Proje", default: "Proje" }`
❌ Her sayfada elle `"Sayfa | Proje"` yazmak — biri mutlaka unutulur.

---

## 10. Erişilebilirlik Tabanı

İlk ekranda zaten doğru olması gerekenler; sonradan eklemek her bileşeni
yeniden açmak demek:

- `<html lang="tr">` ve doğru `<title>`
- "İçeriğe Atla" bağlantısı (`sr-only focus:not-sr-only`)
- Her etkileşimli öğede görünür `focus-visible` halkası (`--line-focus`)
- Dokunma hedefi ≥ 44 px (görünmez genişletme: `.tap-44`)
- Metin kontrastı ≥ 4,5:1, büyük metin ve ikon ≥ 3:1 — **ölç, tahmin etme**
- `prefers-reduced-motion` global olarak kısaltılmış
- `scroll-padding-block` yapışkan başlık yüksekliği kadar; yoksa klavyeyle
  gezilen öğe başlığın altında kalır (WCAG 2.4.11, Açılış Zili)

---

## İlk Hafta Bitmeden

- [ ] Varsayılan tema **ve** öteki tema gözle kontrol edildi (03)
- [ ] Token sözlüğü projeye göre düzenlendi, tek hardcoded renk yok (02)
- [ ] `PageHeader` / `Panel` / `EmptyState` ilk ekranda kullanıldı (05)
- [ ] Smoke betiği: rotalar × 390/1280, soft 404, konsol hatası, yatay taşma (08)
- [ ] CI yeşil ve **bilerek bir kez kırmızıya düşürüldü** (kapının kapı
      olduğunu ancak böyle bilirsin, `mistakes.md` #55)
- [ ] `docs/ROUTEMAP.md` güncel
- [ ] İlk kayıt `knowledge/themes/<proje>.md` için açıldı (proje bitince
      doldurulur, ama dosya ilk haftada vardır)
