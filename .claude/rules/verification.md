---
paths:
  - "scripts/**"
  - "machine/bootstrap.sh"
  - "package.json"
  - ".github/**"
  - "tests/**"
---

# Ekosistem Denetim Komutları

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Ecosystem Health Check" bölümüydü
> (verify:agentic, anatomy, cinecode, slop taraması, canlı proje denetimi);
> script'lere dokunulunca yüklensin diye buraya taşındı
> (`knowledge/decisions.md` → "Bağlam Dosyaları"). Komutların kısa listesi
> kök `CLAUDE.md`de kaldı.

## Ecosystem Health Check

```bash
bash scripts/health-check.sh   # veya: npm run health
```

15 kategori, 130+ kontrol: agent dosyaları, kurallar, fazlar, hook'lar (davranış
testiyle), snippet'ler, şablonlar (hook kaydı dahil), knowledge base, paket
tutarlılığı, token ihlalleri, CI/CD, temel dosyalar, tasarım denetimi (degrade,
palet dışı renk), tech stack uyumu (Tailwind v4, ESLint flat, Next 16 proxy,
motion), orkestrasyon bütünlüğü (wrapper ↔ rol ↔ protokol, komut ↔ tablo;
10 Kasım 2026'dan beri ajan katmanı sözleşmesi: wrapper alanları ve
salt-okur rollerin araçları, komut frontmatter'ı, `~/dev-starter/...`
yollarının çözülmesi, skill'ler, commit tiplerinin üç yerde eşitliği, ayar
dosyalarındaki `ask`/`allow`, git pre-commit köprüsü)
ve bilgi tabanı bütünlüğü (mistakes numaraları, indeks kapsamı, satır tavanları;
8 Kasım 2026'dan beri bağlam dosyaları: CLAUDE.md tavanları, `paths:`
frontmatter'ı, bootstrap'ın kural/izin adımları, `.env` Read yasağı, commit
hook'larının `if` filtresi).

Agentic snippet ve şablonların **derlenip test edildiğini** kanıtlamak ayrı
bir komuttur (ağ + `npm install` gerektirir, bu yüzden opt-in):

```bash
npm run verify:agentic
```

Geçici bir dizinde pin'li bağımlılıkları kurar, `tsc --noEmit` + `vitest run`
çalıştırır ve `@ag-ui/client` pin'inin CopilotKit'le aynı olduğunu doğrular
(`mistakes.md #71`). CopilotKit yükseltmesinden sonra **önce bunu çalıştır**.

Açıklayıcı figür kiti (anatomy) için aynısı:

```bash
node scripts/add-figure-kit.mjs <proje> [--example]   # kiti projeye kur
npm run verify:anatomy                                # iki şablonda build/tip/lint/test
```

anatomy `machine/bootstrap.sh` → `ANATOMY_REF` commit'ine sabitli. Yükseltme:
SHA'yı değiştir, **önce** `verify:anatomy`, sonra commit (`mistakes.md #98`).

Film stüdyosu **cinecode** (sarpstar/cinecode, MIT) aynı yoldan,
`machine/bootstrap.sh` → `CINECODE_REF` commit'ine sabitli. MP4 teslim edilen
kısa film, reklam ve müzik videosu onunla; sayfa içi film `motion-film`le
(iş bölümü `machine/skills/motion-film/SKILL.md` § 1b). Yükseltme: SHA'yı
değiştir, aradaki commit'lerde `scripts/hook.cjs`/`guard.py` farkını oku, commit.

## AI Slop Taraması

```bash
bash scripts/slop-scan.sh app components   # veya: npm run slop -- <yol>
```

Tek taraflı vurgu şeridi, ölü bağlantı, `transition-all`, `font-black`, yer
tutucu ve dolgu metni, gökkuşağı degrade, emoji, `scale(0)` gibi kalıpları
bulur; YÜKSEK bulguda exit 1. Kurallar `rules/design-tokens.md` → AI-Slop
Yasakları; neyi neden almadığımız `knowledge/decisions.md` → "AI Slop Taraması".

## Canlı Proje Denetimi

```bash
bash scripts/audit-project.sh ~/Desktop/Projects/<proje>
```

Canlı projelerin durumu: `knowledge/live-projects-audit.md`.

## Sayı Değişince

Rehber, bileşen, agent, komut ya da mistakes kaydı eklenince/silinince:
`npm run readme:assets` — README istatistik görselleri bu sayıları basar;
unutulursa CI `verify:readme`de kırılır (health-check de yakalar).
