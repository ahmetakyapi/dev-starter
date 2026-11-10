---
description: Referans turu — beğenilen bir sitenin bütününü tarar, ekosistemde karşılığı OLMAYAN desenleri token'larla sıfırdan yazıp kütüphaneye, Storybook'a ve bilgi tabanına işler. Secki, Bencho, EasyUI ve Ribbon turlarının yöntemi. Yalnız ~/dev-starter deposunda.
argument-hint: "<site adresi> [odak: bileşen | hareket | strateji | hepsi]"
---

# /harvest — Siteden Ekosisteme

Kaynak: **$ARGUMENTS**

`/reference` bir bölümün yapısını BİR projeye uyarlar. `/harvest` bütün siteyi
tarar ve kalıcı kazancı **ekosisteme** işler: kütüphanede eksik olan
bileşenler, desen ve strateji dersleri, alınmayanların gerekçesi. Bu komut
yalnız `~/dev-starter` deposunda yüklüdür (`machine/bootstrap.sh` →
`REPO_ONLY_COMMANDS`; başka projeye bağlanmaz). Yollar depo köküne göredir.

**Kural (değişmez):** alınan şey dil ve davranıştır. Kod, metin, logo, görsel,
maskot, ses ve font kopyalanmaz; her şey token'la sıfırdan yazılır
(`knowledge/design-references.md` → Kullanım Şartı). Üçüncü tarafın ekran
görüntüsü depoya girmez (`.tmp-*` ya da scratchpad).

## 1. Yakala (ölç, tahmin etme)

Playwright (bulut oturumunda kurulu: `require('playwright')`; yerelde
Playwright MCP ya da `puppeteer-core` + sistem Chrome):

- 1440 ve 390 genişlikte, sayfa boyu adım adım ekran görüntüsü. Önce bir kez
  sonuna kadar kaydır: görünüme girince beliren bölümler tetiklensin.
- HTML'i indir; bölüm başlıkları (`h1–h3`), varlık listesi, JSON-LD.
- CSS dosyası: özel değişkenler (`--*`), `@font-face` aileleri, `@keyframes`
  adları. Sitenin fontu ve renk sistemi buradan okunur, gözle değil.
- **Durum farkı:** kaydırmadan önce ve sonra öne çıkan öğelerin `className`
  ya da hesaplanmış stili (yapışan menü, küçülen başlık). `position: fixed`
  öğelerin listesi (maskot, sohbet balonu, tuval).
- **Etkileşim:** canlı demo, sekme, akordeon, fiyat seçici tıklanır; önce/sonra
  görüntüsü. Klavye kısayolu varsa denenir.
- Hareketi sayıyla oku: `document.getAnimations()`, öğenin ilk stili
  (`opacity:0; filter:blur(10px); transform:…`).

## 2. Envanter ve fark

Her bölüm için bir satır: **ne**, **nasıl** (ölçülen değerler), **neden işe
yarıyor**. Sonra ekosistemle karşılaştır (dosyaları OKU, hafızadan söyleme):

- `snippets/ui/README.md` kataloğu (gruplar: … Hareket ve Doku, Tanıtım, Yapay Zekâ)
- `templates/landing/components/` (kahramanlar, bölümler, `SiteHeader`, `Faq`)
- `snippets/fonts/fonts.ts` preset'leri, `knowledge/patterns.md`,
  `knowledge/decisions.md` (daha önce reddedilen var mı?), `knowledge/references.md`
  → "Değerlendirilip Alınmayanlar"

Her bulguyu tek sınıfa koy ve kullanıcıya tablo olarak göster:

| Sınıf | Ne yapılır |
|---|---|
| Zaten var | Dosyasını yaz; dokunma (ya da eksik bir durumu varsa küçük iyileştirme) |
| Yeni bileşen | `snippets/ui/<ad>.tsx` olarak yazılır (adım 3) |
| Desen notu | `guides/10` ilgili tur bölümü ya da `knowledge/patterns.md` (tavan 1600 satır) |
| Strateji dersi | `knowledge/decisions.md` → "<Site> Turu" (deneme yerine demo, güvence yeri, SEO) |
| Alınmayan | `knowledge/references.md` → Değerlendirilip Alınmayanlar, tek cümle gerekçe |

Frekans kapısı (`guides/04` § 15): nedeni tek cümleyle yazılamayan hareket ve
oyuncak etkileşim alınmaz. Sahte aciliyet (kıtlık sayacı), doğrulanamayan sayı
ve rozet alınmaz (`guides/08` → veri dürüstlüğü).

## 3. Yaz

Kullanıcı tabloyu onaylayınca. Her yeni bileşen `snippets/ui/README.md`
başındaki sözleşmeye uyar:

- Yalnız token (`bg-overlay`, `text-strong`, `ring-line`…); hex, ham palet,
  `dark:` yok. Durum renkleri (`danger/warning/success`) sabit renk yerine.
- Dosya başında Türkçe belge yorumu: ne zaman, ne zaman DEĞİL, nasıl çalışır,
  erişilebilirlik, kısa örnek. Kaynağı adıyla an (kod alınmadı).
- Sunucu bileşeni mümkünse (CSS ile hareket, `useId`); istemci gerekiyorsa
  `"use client"` ve hareket azaltma, `pointer: fine`, dokunmatik ayrımı.
- Bileşene özgü CSS: `<style href="ui-<ad>" precedence="default">`.
- Kit uygunluğu: yalnız `react`, `motion/react`, `lucide-react`, `@/lib/*` ve
  kardeş `@/components/ui/*` → pakete girer. `next/*` ya da Base UI kitten düşürür.
- Font ya da glif iddiası yazıyorsan woff2 cmap'inden doğrula (fontTools).

## 4. Doğrula (gerçek uygulamada)

Bir şablon kopyasında (scratchpad'e `templates/nextjs-fullstack` kopyala,
`npm install`), bileşenleri `components/ui/`a, bir deneme sayfası `app/<tur>/`:

- `npx tsc --noEmit` · `npx eslint components/ui app/<tur> --max-warnings 0` ·
  `SKIP_ENV_VALIDATION=1 NEXT_PUBLIC_SITE_URL=http://localhost:3000 npx next build`
- `next start` + Playwright: 1440 ve 390, `theme` çerezi `light` ve `dark`;
  konsol hatası, yatay taşma (`scrollWidth - innerWidth`), klavye (Esc, Tab),
  etkileşim sonuçları. Ekran görüntülerine BAK; küçük ayrıntı için öğe
  görüntüsünü `deviceScaleFactor: 3` ile al.
- Sunucuyu kapat (`pkill -f next-server`).

## 5. Ekosisteme bağla

- `snippets/ui/README.md` → ilgili gruba satır (yoksa yeni `###` grup ve tur notu)
- `npm run registry:ui` ve `npm run kit:ui`; kit sayısı değiştiyse
  `packages/@ahmet/ui/README.md` + `package.json` açıklaması
- Storybook: `storybook/stories/yeni-<harf>/<Ad>.stories.tsx` (`tags: ["autodocs", "yeni"]`,
  kimlik İngilizce). Sabit konumlu öğe (`fixed`) içeren hikâye
  `parameters.docs.story.inline = false`. Her yeni bileşen Pusula'da
  (`storybook/stories/showcase/_*.tsx`) gerçek bir yerde kullanılır; yeni sayfa
  dosyası açtıysan `Kapsam.stories.tsx` → `PAGE_OF`. Gereken font
  `.storybook/preview-head.html` + `preview.css`.
- `knowledge/references.md` (en üste satır: ne aldık, nerede yaşıyor),
  `knowledge/decisions.md` (tur kararı), `guides/10` (ne zaman hangisi),
  `CHANGELOG.md` → Yayınlanmamış
- Sayılar: `CLAUDE.md` (bileşen, kit, hikâye), sonra `npm run readme:assets`

## 6. Kapı

```bash
npm run lint && npm run typecheck && npm test
npm run verify:kit && npm run verify:registry && npm run verify:readme
bash scripts/slop-scan.sh snippets/ui storybook/stories && bash scripts/health-check.sh
(cd storybook && npx tsc --noEmit && npm run check:ids && npm run build)
```

Rapor: neler eklendi (tablo), neler zaten vardı, alınmayanlar ve nedeni,
doğrulama çıktıları, bilinen sınırlar (ör. tarayıcı desteği). Sürüm artışı
`/release`in işi.
