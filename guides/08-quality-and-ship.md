# 08 — Kalite ve Yayına Çıkış

Bir kontrolün yeşil olması, doğru soruyu sorduğu anlamına gelmez. Bu ekosistemde
aynı ders yedi kez tekrarlandı (`knowledge/mistakes.md` #52, #55, #57, #73):
lint hiç kurulu değildi ama CI yeşildi, hook'lar hiç çalışmıyordu ama sağlık
kontrolü "mevcut" diyordu. Bu rehberdeki her adım **bir komut çalıştırır**;
"baktım, iyi görünüyor" bir doğrulama değildir.

---

## 1. Commit Öncesi: Dört Komut

```bash
npm run typecheck   # tsc --noEmit (önce build ya da `npx next typegen`, bkz. 06 § 3)
npm run lint        # eslint, --max-warnings 0
npm test            # node --import tsx --test tests/*.test.ts
npm run build
```

Dördü de temiz olmadan commit yok. Görsel bir değişiklikse ayrıca tarayıcıda
**ölçülmüş** olmalı: "sığıyor gibi duruyor" bir doğrulama değil.

Testler için ek çatı yok: Node'un kendi test koşucusu + `tsx`.

```ts
// tests/format.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { titleCaseTr } from "../lib/text";

test("Türkçe i büyür, I değil", () => {
  assert.equal(titleCaseTr("işlem günü"), "İşlem Günü");
});
```

Neyi test et: saf fonksiyonlar (biçimlendirme, hesap, tarih/saat), zod
şemaları, server action'ların karar dalları. Bileşen çizimi değil; onu
smoke betiği yakalar.

---

## 2. Smoke Betiği

Açılış Zili'nin `scripts/smoke.mjs`i her projeye uyarlanır. Çalışan bir
kopyaya başsız Chrome ile gider, her rotayı iki genişlikte (390, 1280)
açar ve dört şey sorar:

| Kontrol | Neden |
|---------|-------|
| **HTTP kodu** — sayfalar 200, olmayan adres 404 | Soft 404 (06 § 9) boş sayfayı dizine sokar |
| **Konsol hatası** | Hidrasyon uyuşmazlığı ekranda hiçbir şey göstermeden yalnızca burada görünür |
| **Yatay taşma** — `scrollWidth > clientWidth + 1` | Telefonda sayfa yana kayar; gözle her rotayı denemek kimsenin yapmadığı iş |
| **Rota × dil** (iki dilliyse) | Çeviri eksikliği genellikle yalnızca bir dilde taşma yaratır |

```js
// özet
for (const route of ROUTES) for (const width of [390, 1280]) {
  await page.setViewport({ width, height: 900 });
  const res = await page.goto(BASE_URL + route, { waitUntil: "networkidle0" });
  if (res.status() !== 200) fail(route, width, `HTTP ${res.status()}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(route, width, `taşma ${overflow}px`);
}
```

- Yazma akışı (kayıt, giriş, silme) varsayılan kapalı, ayrı bir bayrakla
  (`SMOKE_ALLOW_WRITES=1`); kazara üretim adresinde koşmasın.
- Geçici ölçüm betikleri `.tmp-*.mjs` adıyla, commit'lenmez. Kalıcı olanı
  `scripts/smoke.mjs`.

---

## 3. Core Web Vitals Hedefleri

| Ölçü | Hedef | Sık bozan |
|------|-------|-----------|
| LCP | < 2,5 s | Kahramanı Reveal'e sarmak, LCP görselinde `priority` olmaması |
| CLS | < 0,1 | Yapıya uymayan iskelet (0,25 ölçüldü), boyutsuz görsel, geç yüklenen font |
| INP | < 200 ms | Ağır `onClick`, her `mousemove`da React state |

- Laboratuvar: Lighthouse, **mobil profil**, gizli pencerede. 90 altı bir
  puan bir soru işaretidir; puanın kendisi hedef değil.
- Saha: Vercel Speed Insights (gerçek kullanıcı). İkisi çelişirse saha kazanır.
- 4x yavaş CPU ile bir kez dene. Açılış Zili'nin kökteki `:has()` maliyeti
  (126 stil hesabı, 2,1 s) yalnızca orada göründü.

---

## 4. Erişilebilirlik Denetimi

Otomatik araç sorunların yaklaşık üçte birini bulur; gerisi elle:

- [ ] **Yalnızca klavye** ile tüm akış: Tab sırası mantıklı, odak her zaman
      görünür, hiçbir şey klavyede kapanıp kalmıyor, `Esc` diyalogları kapatıyor
- [ ] **Odak kırpılmıyor:** `overflow: hidden` kaplarda halka kesiliyorsa
      `outline-offset: -2px`
- [ ] **Yapışkan başlık odağı örtmüyor:** `scroll-padding-block` (WCAG 2.4.11)
- [ ] **VoiceOver** ile bir tur: başlık hiyerarşisi (h1 → h2), düğme adları,
      `aria-live` bildirimleri
- [ ] **%200 yakınlaştırma** ve tarayıcıda büyük punto: metin kesilmiyor
- [ ] **Kontrast** her iki temada ölçüldü (02 § 6)
- [ ] `prefers-reduced-motion` açıkken sayfa tamamen kullanılabilir ve
      hiçbir içerik `opacity: 0`da kalmıyor

---

## 5. Veri Dürüstlüğü

Veri gösteren her üründe geçerli; dördü de Açılış Zili'nde birer hata
düzeltmesinden geldi:

1. **Uydurma kesinlik yok.** Kaynak dakika vermiyorsa saat `~` ile yazılır
   ve hangi pencere olduğu adıyla söylenir: "~23:00 · Kapanış Sonrası".
2. **Eski veri büyük puntoyla gösterilmez.** Günlerce geriden yayımlanan bir
   seri ekranda bir haftalık fiyatı manşet gibi gösteriyordu; küçük puntoda
   tarih yazmak bunu kurtarmadı, ölçü kaldırıldı.
3. **Aynı sayı iki yerde duruyorsa aynı kaynaktan gelir.** Başlık anlık
   kotasyonu, grafik son barın kapanışını yazınca iki farklı fiyat yan yana
   durdu ve hata gibi okundu.
4. **Bir yüzde hangi günü anlattığını kanıtlar.** Sağlayıcı düşüp önbelleğe
   inilince dünün yüzdeleri "seans içi" künyesiyle basıldı. Gün tek başına
   yetmez, yaş da sorulur. **Ekran bayat veriyi künyesiyle gösterebilir;
   kalıcı metin üreten yazma katmanı gösteremez.**

Her veri panelinin altında kaynak ve saat (`DataStamp`): okuyucu sayının
nereden ve ne zaman geldiğini bilmeli.

---

## 6. iCloud Kopyaları

Depo iCloud ile eşitlenen bir klasördeyse (Masaüstü/Belgeler) eşitleme, iki
yerde değişmiş gördüğü dosyanın ikinci kopyasını bırakır: `alpaca 2.ts`,
`routes.d 5.ts`. `.next/types` altına düşen kopya TypeScript'e de girer ve
derleme `TS6200: Definitions … conflict` ile kırılır; hata koddan değil
dosya sisteminden gelir.

```gitignore
# .gitignore
* [0-9].*
* [0-9]
```

```json
"typecheck": "node scripts/clean-sync-dupes.mjs && tsc --noEmit"
```

Kalıcı çözüm kaynağında: Sistem Ayarları → Apple Hesabı → iCloud → iCloud
Drive → "Masaüstü ve Belgeler Klasörleri" kapalı, ya da projeleri
eşitlenmeyen bir klasörde tut.

---

## 7. Vercel Ortam Değişkenleri

- Yeni değişken **deploy'dan önce** Vercel'e eklenir; eklendikten sonra
  yeniden deploy gerekir (çalışan dağıtım eski değerleri taşır).
- Production / Preview / Development ayrı ayrı işaretlenir. Önizlemeye
  üretim veritabanı verilmez; Neon dalı kullanılır.
- `NEXT_PUBLIC_*` build anında pakete gömülür: değeri değiştirmek yeniden
  build ister.
- `vercel env ls` ile `.env.example` karşılaştır; eksik olan deploy'u değil
  ilk isteği kırar.

---

## 8. Deploy Kontrol Listesi

```text
/deploy
```

- [ ] Dört komut temiz (§ 1)
- [ ] Smoke betiği yerelde temiz
- [ ] Yeni migration varsa **üretime uygulandı** (`npm run db:migrate`, üretim `DATABASE_URL`)
- [ ] Yeni env Vercel'de, doğru ortamlarda
- [ ] `git status` yalnızca amaçlanan dosyaları gösteriyor
- [ ] Staged fark sır, `console.log`, geçici işaret (TODO/TMP/.tmp-) içermiyor
- [ ] Push sonrası: canlı adreste `/api/health` 200, olmayan adres 404,
      ana akış bir kez elle denendi
- [ ] Vercel → Logs ilk beş dakikada temiz

Geri alma: Vercel → Deployments → önceki dağıtım → "Promote to Production".
Migration geri alınmaz; ters SQL'i önceden hazırla.

---

## 9. Commit Kuralı

**Bir oturumda iki-üç commit.** Her mikro düzeltme için ayrı commit, geçmişi
taranamaz hâle getirir (Açılış Zili'nde bir oturumda altı commit oldu ve uyarı
dört kez tekrarlandı).

- İş sürerken yeni istek gelirse commit'i **ertele**; kuyruk boşalınca konu
  başına tek commit.
- Ölçü: yapılanlar tek başlıkta özetlenebiliyorsa tek commit; "görsel
  iyileştirme" ve "performans" gibi iki alan varsa iki.
- Gövdede her değişikliğin gerekçesi ayrı paragraf. Commit sayısı azalır,
  açıklama azalmaz.
- Biçim: `feat|fix|style|refactor|docs|chore|perf: kısa açıklama`
  (`rules/commit-conventions.md`).
- Commit istendiğinde push da aynı turda yapılır; `main`e push Vercel
  deploy'u tetikler.

---

## Kontrol Listesi

- [ ] typecheck · lint · test · build temiz
- [ ] Smoke: 200/404, konsol, yatay taşma
- [ ] Mobil Lighthouse ve 4x yavaş CPU denendi
- [ ] Klavye + VoiceOver turu
- [ ] Veri panellerinde kaynak ve saat
- [ ] Migration ve env deploy'dan önce
- [ ] Oturumda iki-üç commit
