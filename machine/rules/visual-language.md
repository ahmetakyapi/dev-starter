---
paths:
  - "**/*.css"
  - "**/*.tsx"
  - "**/THEME.md"
  - "**/DESIGN.md"
  - "**/knowledge/themes/**"
---

# Görsel Dil (global, yol kapsamlı)

> Kaynak: `~/dev-starter/machine/rules/visual-language.md` → `~/.claude/rules/dev-starter/`
> (bootstrap). 8 Kasım 2026'ya dek global `CLAUDE.md`nin "Görsel Dil" bölümü
> ve "Öğrenilen Hatalar" 10 idi; stil/tema dosyasına dokunulunca yüklensin
> diye taşındı (`knowledge/decisions.md` → "Bağlam Dosyaları").

Proje seviyesinde farklı tema belirtilmediği sürece Açılış Zili referans alınır
(`signature` paleti ve token mimarisi oradan). ahmetakyapi.com da Ekim 2026 yenilemesiyle `signature` paletine geçiyor.

## Ortak Tasarım DNA — Kimlik Ortak, Palet Projeye Göre

Projeler tek markanın ürünleri gibi tanınır ama hepsi aynı renkte değildir.
Ayrıntı: `~/dev-starter/guides/00-brand-identity.md`.

**Kimlik (her projede, değişmez):**
- **Token**: iki katman — ham rol değişkenleri `:root[data-theme]`, köprü `@theme inline`; rol adları ortak
- **Derinlik**: gölgeyle değil **ton farkıyla**; tek gerçek gölge açılır katman ve marka karosunda
- **Glass**: opt-in, yalnızca altından içerik geçen öğede; `@supports` korumalı, `prefers-reduced-transparency`de opak. Blur 12–16 px
- **Degrade**: yalnızca üç yerde (kısa display başlık, birincil eylem, marka karosu), tek renk ailesi içinde; veri panelleri ve gövde metni taşımaz
- **Ease**: `[0.22, 1, 0.36, 1]` — CSS'te `--ease-brand`, `@theme`te varsayılan geçiş eğrisi
- **Erişilebilirlik**: kontrast ölçülür (≥ 4,5:1, `-ink` kuralı), 44 px dokunma hedefi, 2 px odak halkası
- **Açık tema** ters çevrilmez, yeniden tasarlanır. **Şablon varsayılanı açık**; portfolyo/oyun koyu
- **Hardcoded renk yok** → her zaman CSS variable/token; `dark:` yok (eski "Öğrenilen Hatalar" 10)

**Palet (`data-palette`):** `signature` varsayılan — Açılış Zili'nin lacivert → mavi
ailesi (açık `#0d74c4`, koyu `#35b8ff`); `verdant` (zümrüt; sağlık/terapi), `ember`
(kehribar; oyun/topluluk), `iris` (mor-indigo; yaratıcı/yapay zekâ). Palet `/kickoff`ta
seçilir. Mevcut projeler kendi temalarıyla kalır.

> **Not:** Mimio (Ağustos 2026, "Deniz" v2) kendi yolunu izler: imza mavi→cyan
> degradesi, üç katmanlı zemin (aurora → grain → cam), varsayılan tema açık.
> Degrade yalnızca üç yerde: birincil eylem, seçili gezinme satırı, marka
> döşemesi. Veri panelleri degrade taşımaz. Bkz. `THEME.md`.

> **Not:** Açılış Zili glass/glow kullanmaz — derinlik gölgeyle değil **ton
> farkıyla** kurulur. Degrade metin (`.display-ink`) ekosistem yasağına
> **belgeli istisnadır**: token'lanmış, `@supports` korumalı, solid fallback'li,
> descender düzeltmeli ve yalnızca kısa display metninde (artık kimlik kuralının
> "üç yer"inden biri). Ayrıca `--ease-brand`
> `--default-transition-timing-function` olarak ayarlı — her geçiş marka
> eğrisini otomatik alır, ayrıca yazmaya gerek yok.

## Proje Tema Referansları

| Proje | Font | Vurgu | Tema Sistemi | Detay |
|-------|------|-------|--------------|-------|
| ahmetakyapi.com | Manrope + IBM Plex Mono | İndigo+Cyan+Emerald | next-themes class | `knowledge/themes/ahmetakyapi.md` |
| Açılış Zili | Schibsted Grotesk (tek aile, değişken 400–900) | Lacivert→mavi tek aile (`#0d74c4` / koyu `#35b8ff`) + yön renkleri (up/down) | Custom `data-theme`, **varsayılan açık** | `knowledge/themes/acilis-zili.md` |
| Mimio | Schibsted Grotesk (başlık) + Plus Jakarta Sans (gövde) + IBM Plex Mono | Mavi→cyan imza degradesi (`#2b62f5`→`#17c2e0`) | Custom `data-theme`, **varsayılan açık** | `knowledge/themes/mimio.md` |
| DigyNotes | Avenir Next (system) | Emerald (`#10b981`) | `html.light` class | `knowledge/themes/digynotes.md` |
| Keskealsaydım | Archivo + IBM Plex Mono | Emerald + Cyan | shadcn HSL vars, açık/koyu tam destek | `knowledge/themes/keskealsaydim.md` |
| Ramazan Vakitleri | System stack | Mor+Pembe+Mavi | Dark only (CSS) | `knowledge/themes/ramazan-vakitleri.md` |
