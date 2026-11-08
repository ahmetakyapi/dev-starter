# dev-starter — Ekosistem Haritası

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Ekosistem Yapısı", "Proje Yaşam
> Döngüsü" ve "Hızlı Başlangıç" bölümleriydi. Her oturumda bağlama yüklenen
> CLAUDE.md'yi ~200 satırın altına indirmek için (Claude Code resmî önerisi)
> buraya taşındı; kök `CLAUDE.md` kısa haritayı ve bu dosyanın adresini taşır
> (`knowledge/decisions.md` → "Bağlam Dosyaları"). Bu dosya otomatik
> yüklenmez: dizin yapısı, faz akışı ya da komut örneği gerektiğinde oku.
> Sayılar eskiyebilir; güncel sayı için kaynağa sor (`ls`, `npm run readme:assets`).

## Ekosistem Yapısı

```text
dev-starter/
├── guides/                    → Projeye başlarken: sırayla okunan 12 rehber + README
│   ├── 00-brand-identity.md   → Kimlik değişmezleri + palet seçimi (signature/verdant/ember/iris)
│   ├── 01-kickoff.md          → İlk gün / ilk hafta (/kickoff → /new-project → Neon → Vercel → CI)
│   ├── 02-design-tokens.md    → İki katmanlı token, punto ölçeği, twMerge, kontrast, degrade istisnası
│   ├── 03-theming.md          → data-theme + çerez, ThemeToggle + view transition, zemin, glass
│   ├── 04-motion.md           → motion/react + LazyMotion, süreler, Reveal, kaydırma, desen kataloğu
│   ├── 05-components.md       → Şablon bileşenleri, ekran düzeni sırası, durumlar, Title Case
│   ├── 06-nextjs-16.md        → proxy.ts, async API, PageProps, önbellek, soft 404, formlar
│   ├── 07-data-auth-security.md → Neon/Drizzle, migration, next-auth, checkBearer, başlıklar
│   ├── 08-quality-and-ship.md → Commit kontrolü, smoke, CWV, a11y, veri dürüstlüğü, deploy
│   ├── 09-typography.md       → Font preset'leri (snippets/fonts/fonts.ts)
│   ├── 10-component-library.md → snippets/ui/ kopyala-yapıştır kütüphanesi
│   └── 11-vps-email-push.md   → VPS deploy, env senkronu (GitHub → sunucu), SEO açılışı, Resend, Web Push
│
├── machine/
│   ├── CLAUDE.md              → Global kurallar (tek kaynak, her projede yüklenir — ~200 satır tavanı)
│   ├── rules/                 → Yol kapsamlı global kurallar → ~/.claude/rules/dev-starter/ (paths: frontmatter)
│   ├── README.md              → Yeni makine kurulumu, taşınmayanlar, skill listesi
│   ├── bootstrap.sh           → Komut/agent/kural/skill symlink'leri + Read(~/dev-starter/**) izni + taste-skill
│   └── skills/                → Depoda taşınan skill'ler
│       ├── motion-design/     → UI hareketi: zamanlama, easing, koreografi (LottieFiles, MIT)
│       └── motion-film/       → Kodla hareket filmi: yönetmenlik, kamera, mürekkep, ses, MP4
│                                (MP4 filmler: cinecode, bootstrap sabit commit'le kurar)
│
├── packages/@ahmet/
│   ├── theme/      → Tailwind v4 theme.css (sistem + palet + @theme inline köprüsü) + tokens.ts aynası
│   └── ui/         → 86 bileşenlik kit (snippets/ui'dan üretilir) + Surface, Button, Chip, CustomCursor + hooks + motion varyantları (m.*)
│
├── knowledge/
│   ├── themes/                → 7 projenin görsel hafızası (DESIGN.md 9 bölüm)
│   ├── decisions.md           → Kararlar; değişenler "Değişti (2026-10-03)" başlığıyla
│   ├── mistakes.md            → 119 kayıt, başında makine-okunur indeks (#58–73 agentic, #74–98 Next 16 / v4 / motion / figür, #99 ekosistem altyapısı, #100–101 VPS / env / yayın, #102–106 denetim, #107–114 Geo Tour, #115–119 Nimbstia tasarım)
│   ├── patterns.md            → Test edilmiş desenler + Agentic UI
│   ├── tech-radar.md          → İhtiyaç → varsayılan seçim (strategist okur)
│   ├── design-references.md   → Bölüm → ücretsiz referans galerisi (navbar, CTA, footer, 404, bento) — /reference okur
│   ├── references.md          → Referans arşivi: incelenen siteler, skill/kod kaynakları, elenenler (bağlantı + ne alındı)
│   └── live-projects-audit.md → Canlı projelerin standart uyum denetimi
│
├── agents/                    → 12 rol tanımı + AGENT_PROTOCOL.md
│   ├── AGENT_PROTOCOL.md      → Haberleşme, orkestrasyon (Görev Tanımı), context curation, hook'lar
│   ├── strategist-agent.md    → Fikirden plana, yol haritası, teknoloji kararı
│   ├── business-analyst-agent.md → Planlama, onay, orkestrasyon, ROUTEMAP
│   ├── uiux-agent.md          → Tasarım ve hareket kararları
│   ├── design-reviewer-agent.md → Kurulmuş arayüzü ekrandan ölçer, puanlar
│   ├── frontend-agent.md      → Next.js ve React uygulaması
│   ├── backend-agent.md       → DB, API, auth
│   ├── agentic-ui-agent.md    → Agentic UI: tool, kontrol, state, DSL
│   ├── qa-agent.md            → Test stratejisi, test-first, regression
│   ├── researcher-agent.md    → Benzer çözümler, kütüphane seçimi (kaynaklı)
│   ├── content-editor-agent.md → Türkçe metin editörlüğü
│   ├── gate-agent.md          → 6+1 adımlı kalite denetimi (rapor: docs/gate/)
│   └── deploy-agent.md        → Vercel deployment ve yayın
│
├── rules/                     → 10 kural dosyası (tablo: kök CLAUDE.md → Kurallar)
├── phases/                    → planning (P1→P6), development (dalga planı), e2e-polish (E0→E5), release-maintenance
│
├── hooks/
│   ├── gate-guard.sh          → Commit öncesi Gate PASSED kontrolü (kolon başlıktan, #99)
│   ├── quality-scan.sh        → Sır (AWS/PEM/JWT + sağlayıcı anahtarları), .env, debug, @ts-ignore, kilit, agentic cast, TDD/format uyarıları
│   ├── routemap-sync.sh       → ROUTEMAP tazelik + DONE⇒PASSED değişmezi
│   ├── session-brief.sh       → SessionStart: ROUTEMAP özeti + sıradaki iş önerisi
│   ├── lib/hook-input.sh      → stdin JSON okuyucu (TOOL_INPUT diye bir şey yok, #52)
│   └── lib/routemap.sh        → ROUTEMAP tablo ayrıştırıcı — kolon ada göre (#99)
│
├── scripts/
│   ├── health-check.sh        → Ekosistem bütünlüğü (15 kategori, 130+ kontrol)
│   ├── audit-project.sh       → Canlı projeyi ekosistem standartlarıyla denetler
│   ├── slop-scan.sh           → AI slop taraması (23 kalıp, her projede; `slop-ok` ile gerekçeli susturma)
│   ├── test-slop-scan.sh      → slop-scan davranış testi (kirli/temiz fixture)
│   ├── test-hooks.sh          → Hook davranış testleri (87, fixture'lar resmi şablon düzeninde)
│   ├── verify-lockfile.mjs    → Kilit npm ci ile senkron mu (çevrimdışı)
│   ├── verify-package-exports.mjs → Manifestin vaat ettiği giriş noktaları
│   ├── verify-agentic.mjs     → Agentic snippet/şablon derleniyor mu (opt-in)
│   ├── add-ui.mjs             → snippets/ui bileşenini bağımlılıklarıyla projeye kurar (--list, --dry-run, --install)
│   ├── build-ui-registry.mjs  → snippets/ui/registry.json + shadcn kaydı storybook/public/r (--check: verify:registry)
│   ├── build-ui-package.mjs   → snippets/ui → @ahmetakyapi/ui kiti (86 bileşen, next/Base UI'sız; --check: verify:kit)
│   ├── add-figure-kit.mjs     → anatomy figür kitini bir projeye kurar (components/iso)
│   └── verify-anatomy.mjs     → Figür kiti iki şablonda build/tip/lint/test temiz mi (opt-in)
│
├── tests/contract.test.ts     → Paket sözleşmesi (palet kontrastı WCAG formülüyle)
│
├── docs/ECOSYSTEM.md          → Bu harita (kök CLAUDE.md'den taşındı, otomatik yüklenmez)
│
├── .claude/
│   ├── settings.json          → Hook entegrasyonu (commit hook'ları `if` filtreli) + .env Read yasağı
│   ├── rules/                 → Yol kapsamlı proje kuralları (hooks, verification, packages, orchestration)
│   ├── commands/              → 19 komut — bootstrap ile ~/.claude/commands'a symlink
│   ├── agents/                → 9 subagent wrapper'ı — ~/.claude/agents'a symlink
│   └── skills/clone-website/  → Site klonlama (yalnız bu depoda)
│
├── templates/
│   ├── nextjs-fullstack/      → Next 16 + Drizzle/Neon + next-auth v5 + proxy.ts + tema + bileşenler + /akis (AI akışı)
│   ├── landing/               → Board dili: showcase hero (canlı pano) + 7 düzen, demolu özellikler, kaydırma sahnesi, SEO
│   ├── agentic-chat/          → AG-UI overlay, 7 senaryo, anahtarsız, testli
│   └── docs/                  → KICKOFF, PRODUCT, ROUTEMAP, DESIGN, ARCHITECTURE, SCREENS
│
├── storybook/                 → Görsel katalog (Storybook 10, kendi kilidi): 728 hikâye — Kapak, Tema, Bileşenler,
│                                Grafikler, Bloklar, Ekranlar, Desen Kütüphanesi, Pusula (118/118); kabuk tema ve paleti izler
├── snippets/                  → 22 hazır parça + ui/ kütüphanesi (118 bileşen + vitrin/) + fonts/ + live-preview/
│   ├── reveal · theme-toggle · rolling-number · animated-number · scroll-progress
│   ├── tr-text (testli) · phrases → Türkçe başlık: anlam öbekleriyle satır kırma, punto sığdırma
│   ├── tab-underline · use-scroll-lock · modal · drawer · confirm · toast · form
│   ├── skeleton · search-bar · infinite-scroll · og-image
│   ├── agent-tool · action-card · agent-approval (tsc ✓) · agent-feed (test ✓)
│   └── live-preview/ → Panelde yazdıkça güncellenen canlı önizleme (masaüstü + telefon, açık/koyu, font anında)
│
├── eslint.config.js · .prettierrc · .editorconfig · .nvmrc (24)
├── CHANGELOG.md · CONTRIBUTING.md
```

---

## Proje Yaşam Döngüsü

```text
KICKOFF  →  PLANNING (P1→P6)  →  DEVELOPMENT  →  E2E & POLISH (E0→E5)  →  RELEASE  →  MAINTENANCE
```

### Kickoff (`/kickoff`, `agents/strategist-agent.md`)

Fikir → pazar araştırması, yön seçenekleri, palet ve teknoloji kararları, MVP.
Çıktı `docs/KICKOFF.md` + taslak `docs/PRODUCT.md`; onaylanınca `/new-project`.

### Planning (`phases/planning.md`)

6 adımda fikirden geliştirmeye hazır story'lere:

| Adım | Ne Yapar | Çıktı |
|------|----------|-------|
| P1 | Discovery & Brainstorm | decisions.md |
| P2 | Product Definition | PRODUCT.md |
| P3 | Architecture Design | ARCHITECTURE.md |
| P4 | Screen Design | SCREENS.md |
| P5 | Story Writing | stories/ |
| P6 | Dev Readiness Check | checklist |

### Development (`phases/development.md`)

Fazın playbook'u: iş boyu (KÜÇÜK/ORTA/BÜYÜK), story seçimi, subagent'lara
dalga planıyla dağıtım (Görev Tanımı), Gate döngüsü ve eskalasyon. Tek
story'nin iç akışı `rules/dev-cycle.md`:

```text
Plan → Validate → Develop → Self-Check → Gate → Commit → Review → Compound
```

### E2E & Polish (`phases/e2e-polish.md`)

```text
E0: Seed Data → E1: Smoke Test → E2: Interactive E2E → E3: Performance → E4: UI Polish → E5: Acceptance
```

### Release & Maintenance (`phases/release-maintenance.md`)

```text
Pre-Release Checklist → Version Tag → Deploy → Post-Deploy Verify → Maintenance Mode
```

---

## Hızlı Başlangıç

### Yeni Proje

```text
/new-project [proje-adı]
```

### Fikirden Başla

```text
/kickoff "ergoterapistler için seans takip uygulaması"
```

### Günlük Döngü

```text
/status                → kaldığın yer + sıradaki 3 iş
/story STORY-004       → story'yi uçtan uca işle (dağıt → gate → commit)
/gate                  → commit'e izin ver
/fix "panel boş geliyor"  → TDD bugfix
/research "takvim senkronu" → benzer çözümler + öneri
/retro                 → dersleri bilgi tabanına işle
```

### Palet ya da Tema Uygula

```text
/theme signature
/theme verdant
/theme acilis-zili
```

### Deploy

```text
/deploy
```

### Referanstan Kur

```text
/reference navbar                       → uygun ücretsiz galeriyi öner
/reference cta ~/Desktop/cta.png        → ekran görüntüsünün yapısını kendi renklerinle kur
```

### UI İnceleme

```text
/review-ui [dosya veya dizin]
```

### Hızlı Bileşen Üret

```text
/snippet reveal
/snippet theme-toggle
/snippet rolling-number
/snippet modal
/snippet form
/snippet drawer
/snippet skeleton
/snippet toast
/snippet confirm
/snippet agent-tool
/snippet action-card
/snippet agent-approval
/snippet agent-feed
/snippet live-preview   → yönetim paneline canlı önizleme (rules/live-preview.md)
```

### Website Klonla

```text
/clone-website https://example.com
```

### Sağlık Kontrolü

```text
/check
```

### Release

```text
/release patch
/release minor
/release major
```

---

