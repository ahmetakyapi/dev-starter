# dev-starter — Ekosistem CLAUDE.md

Bu, Ahmet'in kişisel geliştirme ekosistemi. Yeni proje başlatmak, tema uygulamak veya deploy etmek için buradan başla.

**Versiyon**: 3.0.0 — Next 16 · React 19.2 · Tailwind v4 · `motion/react` · Drizzle + Neon · next-auth v5

Projeye başlarken sırayla izlenecek rehber: `guides/` (00 kimlik → 01 ilk gün → 08 yayına çıkış).
Global kuralların tek kaynağı: `machine/CLAUDE.md` (`~/.claude/CLAUDE.md` ona symlink).

---

## Ekosistem Yapısı

```text
dev-starter/
├── guides/                    → Projeye başlarken: sırayla okunan 11 rehber + README
│   ├── 00-brand-identity.md   → Kimlik değişmezleri + palet seçimi (signature/verdant/ember/iris)
│   ├── 01-kickoff.md          → İlk gün / ilk hafta (/kickoff → /new-project → Neon → Vercel → CI)
│   ├── 02-design-tokens.md    → İki katmanlı token, punto ölçeği, twMerge, kontrast, degrade istisnası
│   ├── 03-theming.md          → data-theme + çerez, ThemeToggle + view transition, zemin, glass
│   ├── 04-motion.md           → motion/react + LazyMotion, süreler, Reveal, kaydırma, desen kataloğu
│   ├── 05-components.md       → Şablon bileşenleri, ekran düzeni sırası, durumlar, Title Case
│   ├── 06-nextjs-16.md        → proxy.ts, async API, PageProps, önbellek, soft 404, formlar
│   ├── 07-data-auth-security.md → Neon/Drizzle, migration, next-auth, checkBearer, başlıklar
│   ├── 08-quality-and-ship.md → Commit kapısı, smoke, CWV, a11y, veri dürüstlüğü, deploy
│   ├── 09-typography.md       → Font preset'leri (snippets/fonts/fonts.ts)
│   └── 10-component-library.md → snippets/ui/ kopyala-yapıştır kütüphanesi
│
├── machine/
│   ├── CLAUDE.md              → Global kurallar (tek kaynak)
│   ├── README.md              → Yeni makine kurulumu, taşınmayanlar, skill listesi
│   ├── bootstrap.sh           → Komut/ajan/skill symlink'leri + taste-skill kurulumu
│   └── skills/motion-design/  → Depoda taşınan skill
│
├── packages/@ahmet/
│   ├── theme/      → Tailwind v4 theme.css (sistem + palet + @theme inline köprüsü) + tokens.ts aynası
│   └── ui/         → Surface, Button, Chip, CustomCursor + hooks + motion varyantları (m.*)
│
├── knowledge/
│   ├── themes/                → 6 projenin görsel hafızası (DESIGN.md 9 bölüm)
│   ├── decisions.md           → Kararlar; değişenler "Değişti (2026-10-03)" başlığıyla
│   ├── mistakes.md            → 92 kayıt (#58–73 agentic, #74–92 Next 16 / v4 / motion)
│   ├── patterns.md            → Test edilmiş desenler + Agentic UI
│   ├── tech-radar.md          → İhtiyaç → varsayılan seçim (strategist okur)
│   └── live-projects-audit.md → Canlı projelerin standart uyum denetimi
│
├── agents/                    → 10 rol tanımı + AGENT_PROTOCOL.md
│   ├── AGENT_PROTOCOL.md      → Haberleşme, akış, context curation, hook'lar
│   ├── strategist-agent.md    → Fikirden plana, yol haritası, teknoloji kararı
│   ├── business-analyst-agent.md → Planlama, onay, yönlendirme, ROUTEMAP
│   ├── uiux-agent.md          → Tasarım ve hareket kararları
│   ├── design-reviewer-agent.md → Kurulmuş arayüzü ekrandan ölçer, puanlar
│   ├── frontend-agent.md      → Next.js ve React uygulaması
│   ├── backend-agent.md       → DB, API, auth
│   ├── agentic-ui-agent.md    → Agentic UI: tool, kontrol, state, DSL
│   ├── content-editor-agent.md → Türkçe metin editörlüğü
│   ├── gate-agent.md          → 6+1 geçişli kalite kontrolü
│   └── deploy-agent.md        → Vercel deployment ve yayın
│
├── rules/                     → 8 kural dosyası (aşağıdaki tablo)
├── phases/                    → planning (P1→P6), e2e-polish (E0→E5), release-maintenance
│
├── hooks/
│   ├── gate-guard.sh          → Commit öncesi Gate PASSED kontrolü
│   ├── quality-scan.sh        → Sır, .env, debug kodu, @ts-ignore, kilit, agentic cast
│   ├── routemap-sync.sh       → ROUTEMAP hatırlatıcısı
│   └── lib/hook-input.sh      → stdin JSON okuyucu (TOOL_INPUT diye bir şey yok, #52)
│
├── scripts/
│   ├── health-check.sh        → Ekosistem bütünlüğü (13 kategori, 76 kontrol)
│   ├── audit-project.sh       → Canlı projeyi ekosistem standartlarıyla denetler
│   ├── test-hooks.sh          → Hook davranış testleri (17)
│   ├── verify-lockfile.mjs    → Kilit npm ci ile senkron mu (çevrimdışı)
│   ├── verify-package-exports.mjs → Manifestin vaat ettiği giriş noktaları
│   └── verify-agentic.mjs     → Agentic snippet/şablon derleniyor mu (opt-in)
│
├── tests/contract.test.ts     → Paket sözleşmesi (palet kontrastı WCAG formülüyle)
│
├── .claude/
│   ├── settings.json          → Hook entegrasyonu (paylaşılan, versiyonlanır)
│   ├── commands/              → 10 komut — bootstrap ile ~/.claude/commands'a symlink
│   ├── agents/                → 5 alt ajan sarmalayıcısı — ~/.claude/agents'a symlink
│   └── skills/clone-website/  → Site klonlama (yalnız bu depoda)
│
├── templates/
│   ├── nextjs-fullstack/      → Next 16 + Drizzle/Neon + next-auth v5 + proxy.ts + tema + bileşenler
│   ├── landing/               → Yedi kahraman düzeni (hero.variant), hareket kataloğu, SEO
│   ├── agentic-chat/          → AG-UI overlay, 7 senaryo, anahtarsız, testli
│   └── docs/                  → KICKOFF, PRODUCT, ROUTEMAP, DESIGN, ARCHITECTURE, SCREENS
│
├── snippets/                  → 19 hazır parça + ui/ kütüphanesi + fonts/
│   ├── reveal · theme-toggle · rolling-number · animated-number · scroll-progress
│   ├── tab-underline · use-scroll-lock · modal · drawer · confirm · toast · form
│   ├── skeleton · search-bar · infinite-scroll · og-image
│   └── agent-tool · action-card · agent-approval (tsc ✓)
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

Fikir → pazar taraması, yön seçenekleri, palet ve teknoloji kararları, MVP.
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

### Development (`rules/dev-cycle.md`)

```text
Plan → Validate → Develop → Self-Check → Gate → Commit → Review
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

## ROUTEMAP — Proje Durum Takibi

Her proje `docs/ROUTEMAP.md` ile durumunu takip eder (`rules/routemap-discipline.md`):

- **Tek kaynak**: Projenin durumu ROUTEMAP'te, başka yerde değil
- **Session resume**: Her yeni session'da ROUTEMAP okunur, kaldığı yerden devam edilir
- **Template**: `templates/docs/ROUTEMAP.template.md`

---

## Enforcement Hook'ları

Kurallar kağıt üstünde kalmaz — bash hook'ları ile fiziksel olarak uygulanır:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `hooks/gate-guard.sh` | PreToolUse:Bash (git commit) | Gate PASSED yoksa commit'i bloklar |
| `hooks/quality-scan.sh` | PreToolUse:Bash (git commit) | Sır, `.env`, debug kodu, `@ts-ignore`, kilit dosyası, agentic cast taraması |
| `hooks/routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP güncelleme hatırlatıcısı |

Entegrasyon: **`.claude/settings.json`** içindeki `hooks` bloğu (paylaşılan,
versiyonlanır). `.claude/settings.local.json` yalnızca makineye özgü izinler
içindir ve gitignore'dadır. impeccable eklentisi ve `.impeccable/` 3.0.0'da
kaldırıldı.

---

## Ecosystem Health Check

```bash
bash scripts/health-check.sh   # veya: npm run health
```

13 kategori, 76 kontrol: ajan dosyaları, kurallar, fazlar, hook'lar (davranış
testiyle), snippet'ler, şablonlar, knowledge base, paket tutarlılığı, token
ihlalleri, CI/CD, temel dosyalar, tasarım denetimi (degrade, palet dışı renk),
yığın uyumu (Tailwind v4, ESLint flat, Next 16 proxy, motion).

Agentic snippet ve şablonların **derlenip test edildiğini** kanıtlamak ayrı
bir komuttur (ağ + `npm install` gerektirir, bu yüzden opt-in):

```bash
npm run verify:agentic
```

Geçici bir dizinde pin'li bağımlılıkları kurar, `tsc --noEmit` + `vitest run`
çalıştırır ve `@ag-ui/client` pin'inin CopilotKit'le aynı olduğunu doğrular
(`mistakes.md #71`). CopilotKit yükseltmesinden sonra **önce bunu çalıştır**.

### Canlı Proje Denetimi

```bash
bash scripts/audit-project.sh ~/Desktop/Projects/<proje>
```

Canlı projelerin durumu: `knowledge/live-projects-audit.md`.

**Açık kararlar:**

1. ~~**Referans çelişkisi**~~ → ✅ 2026-10-03: ekosistemin görsel referansı
   artık Açılış Zili (`signature` paleti, token mimarisi). ahmetakyapi.com
   kendi eski paletinde kalır, dokunuldukça `signature`a yaklaşır.
2. ~~**`gradient-text` yasağı fazla katı**~~ → ✅ 2026-08-16, yasak kaldırıldı;
   2026-10-03'te yeni projeler için "üç yer + tek aile" kimlik kuralı geldi.
3. **Palet istisnaları**: `onepiece-hub` ✅ çözüldü. `ramazan-vakitleri`
   (mor+pembe+mavi) `iris`e yakın; hâlâ açık.

---

## Skill Komutları

| Komut | Açıklama | Dosya |
|-------|----------|-------|
| `/kickoff [fikir]` | Fikirden plana: pazar, yön, palet, teknoloji, MVP (strategist) | `.claude/commands/kickoff.md` |
| `/roadmap` | Var olan projeye sıradaki işler (strategist) | `.claude/commands/roadmap.md` |
| `/new-project [ad]` | Şablon + yer tutucular + palet/tema + belgeler + doğrulama | `.claude/commands/new-project.md` |
| `/theme [palet\|proje]` | Palet ya da referans tema uygula (Tailwind v4) | `.claude/commands/theme.md` |
| `/snippet [tip]` | Hazır parçayı projeye uyarla | `.claude/commands/snippet.md` |
| `/check` | Sağlık: build, tip, lint, test, yığın uyumu, token, güvenlik | `.claude/commands/check.md` |
| `/review-ui` | UI incelemesi: token, kimlik, iki tema, düzen, a11y, hareket | `.claude/commands/review-ui.md` |
| `/deploy` | Vercel deployment checklist | `.claude/commands/deploy.md` |
| `/release [seviye]` | Versiyon artırma + changelog | `.claude/commands/release.md` |
| `/agentic [konu]` | Agentic UI karar ağacı — tool, kontrol, state, dsl, test, kurulum, denetle | `.claude/commands/agentic.md` |
| `/clone-website <url>` | Pixel-perfect site klonlama (Browser MCP gerekli, yalnız bu depoda) | `.claude/skills/clone-website/SKILL.md` |

> **Tek kaynak: bu repo.** `machine/bootstrap.sh` her komutu
> `~/.claude/commands/`a symlink'ler; global kopya yoktur, **her projede bu
> sürümler çalışır**. Bu yüzden komutların içindeki yollar `~/dev-starter/...`
> biçiminde mutlaktır — göreli yol başka bir projeden çağrılınca bulunamaz.

### Kayıtlı Subagent'lar

`agents/*.md` dosyalarının çoğu ana oturumun **üstlendiği rol tanımlarıdır**.
Beşi izolasyondan gerçekten fayda gördüğü için kayıtlı alt ajandır ve
bootstrap ile `~/.claude/agents/`a symlink'lenir (her projede kullanılabilir):

| Subagent | Sarmalayıcı | Rol tanımı |
|----------|-------------|------------|
| `strategist` | `.claude/agents/strategist.md` | `agents/strategist-agent.md` |
| `gate` | `.claude/agents/gate.md` | `agents/gate-agent.md` |
| `deploy` | `.claude/agents/deploy.md` | `agents/deploy-agent.md` |
| `design-reviewer` | `.claude/agents/design-reviewer.md` | `agents/design-reviewer-agent.md` |
| `content-editor` | `.claude/agents/content-editor.md` | `agents/content-editor-agent.md` |

Sarmalayıcılar bilerek incedir; rol tanımını kopyalamazlar ve onu
`~/dev-starter/agents/...` mutlak yoluyla okurlar. İki kaynak olursa biri
sessizce bayatlar — bu denetimin en sık bulduğu hata sınıfı buydu.

---

## Context Curation

Her agent sadece ihtiyacı olan bilgiyi alır (`rules/context-curation.md`):

| Agent | Seviye | Ne Okur |
|-------|--------|---------|
| BA | FULL | Tüm dokümanlar |
| UI | FOCUSED | Tema + ekranlar |
| FE | TASK-SPECIFIC | Story + ilgili dosyalar |
| BE | TASK-SPECIFIC | Story + schema + API |
| GATE | REVIEW | Story + diff + rules |
| DP | MINIMAL | Config + env |

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

## Paket Kullanımı

Yeni bir Next.js projesinde (Tailwind v4):

```bash
npm install @ahmetakyapi/theme @ahmetakyapi/ui motion
```

```css
/* app/globals.css — tailwind.config.ts YOK */
@import "tailwindcss";
@import "@ahmetakyapi/theme/theme.css";   /* sistem + palet + @theme inline */
@import "@ahmetakyapi/theme/css";         /* isteğe bağlı: .surface, .glass, .display-ink, .app-bg */
```

```tsx
// app/layout.tsx — palet ve tema html'de
<html lang="tr" data-theme={theme} data-palette="signature" suppressHydrationWarning>
```

```ts
// Kökte <LazyMotion features={domAnimation} strict> ŞART — bileşenler m.* kullanır
import { Surface, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmetakyapi/ui'
import { EASE, DUR, SPRING, STAGGER, fadeUp, fadeIn } from '@ahmetakyapi/ui'
import { cn } from '@ahmetakyapi/ui'
```

v3 preset'i (`@ahmetakyapi/theme/tailwind`) 3.0.0'da kaldırıldı. Ayrıntı:
`guides/02-design-tokens.md`, `guides/00-brand-identity.md`.

---

## Kurallar

Tüm agent'lar `rules/` altındaki kurallara uyar:

| Kural | Özet |
|-------|------|
| `immutable-architecture.md` | Server-first, performance, DB migration, state, auth, no shortcuts |
| `design-tokens.md` | Hardcoded renk/boyut YASAK, semantic token zorunlu, degrade kuralları (token + fallback), AI-slop yasakları |
| `commit-conventions.md` | `feat/fix/refactor(scope): description` formatı |
| `bugfix-protocol.md` | TDD: failing test → fix → green → regression → document |
| `dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline |
| `routemap-discipline.md` | ROUTEMAP tek kaynak, session resume, durum geçişleri |
| `context-curation.md` | Agent bazlı filtered context, token bütçesi |
| `agentic-ui.md` | LLM tool çağırıyorsa: guardrail sunucuda, model yetkilendirmez, sandbox, token bütçesi, tool testi |

---

## Bu Dosyaları Güncelleme

- **Yeni hata keşfedilince**: `knowledge/mistakes.md` + o hatayı bir daha yaşatmayacak adım ilgili `guides/` dosyasına
- **Yeni proje tamamlanınca**: `knowledge/themes/[proje].md` doldur — şablon:
  `templates/docs/DESIGN.template.md` (YAML frontmatter token şeması + 9 bölümlük görsel hafıza)
- **Yeni desen bulununca**: `knowledge/patterns.md`
- **Karar değişince**: `knowledge/decisions.md` — eskisini silme, "Değişti (tarih)" alt başlığı
- **Paket versiyonu güncellenince**: `packages/@ahmet/*/package.json` + `CHANGELOG.md`
- **Yeni kural eklenince**: `rules/` altında dosya, `AGENT_PROTOCOL.md`'ye referans
- **Yeni faz eklenince**: `phases/` altında dosya
- **Yeni hook eklenince**: `hooks/` altında script, **`.claude/settings.json`**'a kayıt, `scripts/test-hooks.sh`'e davranış testi
- **Yeni komut eklenince**: `.claude/commands/` altında `.md` — yollar `~/dev-starter/...` mutlak; `bash machine/bootstrap.sh`
- **Yeni alt ajan eklenince**: `.claude/agents/[ad].md` (ince) + `agents/[ad]-agent.md`
- **Yeni snippet eklenince**: `snippets/` altında, `guides/05-components.md` ya da `10-component-library.md` kataloğuna
- **Global kural değişince**: `machine/CLAUDE.md` (symlink hedefi)
- **Katkı rehberi**: `CONTRIBUTING.md`

---

## Global Kurallar

Bakınız: `machine/CLAUDE.md` (= `~/.claude/CLAUDE.md`)
