---
description: Hazır bileşeni projeye uyarlayarak kopyala: snippets/ui kütüphanesi, reveal, theme-toggle, rolling-number, modal, form, toast ve diğerleri
argument-hint: "ui/<ad> (data-table, tree-view, dialog, combobox …) | reveal | theme-toggle | rolling-number | modal | toast | form | og-image | agent-tool | agent-feed | live-preview"
---

`$ARGUMENTS` tipinde bir bileşen snippet'ini mevcut projeye uyarla. Bu komut
her projeden çağrılabilir; kaynak `~/dev-starter/snippets/`.

**Önce oku:** `~/dev-starter/guides/05-components.md` § 2 ve bileşen
kütüphanesi için `~/dev-starter/guides/10-component-library.md` (`snippets/ui/`:
dialog, dropdown, data-table, tree-view, pagination, stat, sparkline...). Hareket içeriyorsa `~/dev-starter/guides/04-motion.md`.

## `snippets/ui` bileşeni ise: add-ui (elle kopyalama yok)

Kütüphane bileşeni (`ui/<ad>` ya da `--list`te görünen ad) **betikle** kurulur;
transitif bağımlılıkları (`@/components/ui/*`, `lib/utils`, `lib/motion`,
`lib/theme`, `app/palettes.css`) kendisi çözer, var olan dosyanın üstüne yazmaz:

```bash
node ~/dev-starter/scripts/add-ui.mjs --list                       # katalog
node ~/dev-starter/scripts/add-ui.mjs . <ad...> --dry-run          # önce plan
node ~/dev-starter/scripts/add-ui.mjs . <ad...> --install          # kur + eksik npm paketleri
```

Özet tablosunu oku: `farkli (atlandi)` satırı projenin kendi dosyasıdır —
`--force` ile ezmeden önce farkı kullanıcıya göster. `Uyarilar` (eksik token,
LazyMotion yok, atlanan yardımcıda eksik dışa aktarım) ve `Sonraki adimlar`
(palettes.css satırı) uygulanmadan bitti deme. Proje farklı rol adları
kullanıyorsa (shadcn `bg-background`) sınıfları kurulumdan SONRA çevir.
Tailwind v3 / Next 14 projesinde betik kopyalar ama sınıflar v4 token'i ister:
aşağıdaki adımlarla uyarla.

## Adımlar (snippets/ kök parçaları ve uyarlama)

1. `ls ~/dev-starter/snippets/ ~/dev-starter/snippets/ui/` ile dosyayı bul ve tamamını oku (`.tsx`, `.ts`;
   `rolling-number` yanında `.module.css` de var).
2. Projenin tech stack'ini kontrol et:
   ```bash
   grep -E '"(next|react|tailwindcss|motion|framer-motion)"' package.json
   grep -rn "LazyMotion" app components 2>/dev/null | head -3
   ```
3. Uyarla ve projeye yaz (genellikle `components/ui/` ya da `components/motion/`).
4. `npm run typecheck && npm run lint` temiz olmadan bitti deme.

## Kurallar

- **Hareket `motion/react`tan.** Kökte `LazyMotion features={domAnimation} strict`
  varsa bileşende `m.*` (`import * as m from "motion/react-m"`); `motion.*`
  strict altında hata verir. `framer-motion` kullanan eski projede import yolunu
  projeye uydur, yeni paket kurma.
- `tab-underline` `layout` animasyonu için kendi `LazyMotion features={domMax}`
  wrapper'ini getirir; kökteki `domAnimation`i değiştirme.
- **Token sınıfları:** `bg-surface`, `text-strong`, `text-body`, `border-line`,
  `bg-primary text-on-primary`, `bg-primary-wash text-primary-ink`, `bg-scrim`.
  Hardcoded renk, hazır palet sınıfı (`bg-white`, `text-gray-*`) ve `dark:` yok.
  Proje farklı rol adları kullanıyorsa (shadcn `bg-background` gibi) onlara çevir.
- Sabitler `lib/motion.ts`ten (`EASE`, `DUR`, `SPRING`); yoksa snippet'in
  içindekini kullan, yeni sihirli sayı ekleme.
- `'use client'` yalnızca etkileşimli bileşende.
- Reveal: kahraman/LCP öğesini sarma; reduced-motion'da `initial={false}` yok.
- Erişilebilirlik: diyaloglarda odak tuzağı + `Esc` + sayaçlı kaydırma kilidi
  (`use-scroll-lock`), dokunma hedefi ≥ 44 px, `aria-label` cümle düzeninde.
  `modal`, `drawer`, `confirm` `./use-scroll-lock`tan `useScrollLock` +
  `useLayer` (katman yığını, odak, Escape) alır: o dosyayı yanına birlikte
  kopyala, katman başına ayrı kilit ya da Escape dinleyicisi yazma.
- Arayüz metni Türkçe Title Case (başlık, düğme), em dash yok.

> `live-preview` bir **kit**tir (6 dosya): önce `~/dev-starter/snippets/live-preview/README.md`
> ve `~/dev-starter/rules/live-preview.md`i oku, README'deki 1–7 adımını sırayla uygula
> (şema → görünüm bileşenine `draft` prop'u + `data-edit` → taslak Server Action'i →
> önizleme rotası → düzenleyici → yazı tipi şeridi), sonunda README'deki Kabul listesini
> tarayıcıda tek tek doğrula.

> `agent-*` ve `action-card` snippet'leri `@copilotkit/react-core@1.69.2` tip
> tanımlarıyla `tsc --noEmit` üzerinden doğrulandı. Uyarlarken sürüm pin'ine
> dikkat — `~/dev-starter/knowledge/mistakes.md` #70, #71. Karar için: `/agentic`

> `agent-feed` CopilotKit gerektirmez: `agent-feed.tsx` (arayüz) +
> `agent-feed-core.ts` (sözleşme, reducer, sıralama) + `agent-feed.test.ts`.
> Üç dosyayı birlikte kopyala; `runAction`/`undoAction` projenin server
> action'larıdır ve yetkiyi ORADA doğrular. Desen: `patterns.md → AI Feed`.

Çıktı: yazılan dosyalar (ve `add-ui` özet tablosu), projeye uyarlarken
değiştirdiğin şeyler (import yolu, token adı), `npm run typecheck` ve
`npm run lint` exit kodları, kalan elle adımlar (ör. `palettes.css` satırı,
`LazyMotion` sarmalayıcısı).
