# dev-starter — Ekosistem CLAUDE.md

Bu, Ahmet'in kişisel geliştirme ekosistemi. Yeni proje başlatmak, tema uygulamak veya deploy etmek için buradan başla.

**Versiyon**: 2.0.0

---

## Ekosistem Yapısı

```text
dev-starter/
├── packages/@ahmet/
│   ├── theme/      → CSS tokenları, Tailwind preset, animasyon varyantları
│   └── ui/         → GlassCard, Button, Chip, CustomCursor + hooks + variants
│
├── knowledge/
│   ├── themes/
│   │   ├── ahmetakyapi.md     → Ana görsel dil referansı
│   │   ├── digynotes.md       → DigyNotes görsel hafıza
│   │   ├── mimio.md           → Mimio görsel hafıza
│   │   ├── keskealsaydim.md   → KeskealSaydım görsel hafıza
│   │   └── ramazan-vakitleri.md → Ramazan Vakitleri görsel hafıza
│   ├── mistakes.md            → Tekrar edilmeyecek hatalar (37 kayıt)
│   └── patterns.md            → Test edilmiş kod desenleri (15+ desen)
│
├── agents/
│   ├── AGENT_PROTOCOL.md  → Haberleşme, akış, context curation, hook'lar
│   ├── business-analyst-agent.md → Planlama, onay, yönlendirme, ROUTEMAP
│   ├── uiux-agent.md       → Tasarım & animasyon kararları
│   ├── frontend-agent.md   → Next.js & React implementasyon
│   ├── backend-agent.md    → DB, API, auth
│   ├── gate-agent.md       → 6-pass kalite kontrolü, auto-fix, enforcement
│   └── deploy-agent.md     → Vercel deployment & release
│
├── rules/
│   ├── immutable-architecture.md → Kırılamaz mimari kurallar (10 kural)
│   ├── design-tokens.md          → Hardcoded değer yasağı, token enforcement
│   ├── commit-conventions.md     → Conventional commit standardı
│   ├── bugfix-protocol.md        → TDD bugfix akışı
│   ├── dev-cycle.md              → Plan → Dev → Gate → Commit → Review pipeline
│   ├── routemap-discipline.md    → ROUTEMAP tek kaynak prensibi
│   └── context-curation.md       → Agent bazlı context seviyeleri
│
├── phases/
│   ├── planning.md           → P1→P6: Discovery → Product → Architecture → Screens → Stories → Readiness
│   ├── e2e-polish.md         → E0→E5: Seed → Smoke → E2E → Perf → UI Polish → Acceptance
│   └── release-maintenance.md → Release checklist, maintenance triage, hotfix akışı
│
├── hooks/
│   ├── gate-guard.sh         → Commit öncesi Gate PASSED kontrolü
│   ├── quality-scan.sh       → Hardcoded değer, debug kodu, secret taraması
│   └── routemap-sync.sh      → ROUTEMAP güncelleme hatırlatıcısı
│
├── scripts/
│   └── health-check.sh       → Ekosistem bütünlük kontrolü (11 kategori)
│
├── .claude/
│   ├── settings.local.json   → Hook entegrasyonu + izinler
│   ├── skills/
│   │   └── clone-website/    → Website reverse-engineering & pixel-perfect clone
│   └── commands/             → Skill komut tanımları
│       ├── check.md          → /check — Proje sağlık kontrolü
│       ├── review-ui.md      → /review-ui — UI/UX kod incelemesi
│       ├── deploy.md         → /deploy — Vercel deployment checklist
│       ├── snippet.md        → /snippet — Hızlı bileşen üretimi
│       ├── theme.md          → /theme — Görsel tema uygulama
│       ├── new-project.md    → /new-project — Yeni proje sihirbazı
│       └── release.md        → /release — Versiyon & changelog yönetimi
│
├── templates/
│   ├── docs/                 → ROUTEMAP, PRODUCT, ARCHITECTURE, SCREENS şablonları
│   ├── nextjs-fullstack/     → Next.js + Drizzle + auth tam uygulama
│   └── landing/              → Three.js + glassmorphism tanıtım sayfası
│
├── snippets/                 → 10 hazır bileşen
│   ├── animated-number.tsx   → Sayı animasyonu
│   ├── infinite-scroll.tsx   → Sonsuz kaydırma
│   ├── og-image.tsx          → Open Graph görsel üretici
│   ├── search-bar.tsx        → Debounced arama kutusu
│   ├── modal.tsx             → Animasyonlu dialog
│   ├── drawer.tsx            → Yandan açılan panel
│   ├── form.tsx              → Server Action uyumlu form
│   ├── skeleton.tsx          → Yükleme placeholder'ları
│   ├── toast.tsx             → Bildirim sistemi
│   └── confirm.tsx           → Onay dialog'u
│
├── eslint.config.js          → Root ESLint yapılandırması
├── .prettierrc               → Prettier yapılandırması
├── .editorconfig             → IDE tutarlılığı
├── CHANGELOG.md              → Versiyon geçmişi
└── CONTRIBUTING.md           → Katkı rehberi
```

---

## Proje Yaşam Döngüsü

```text
PLANNING (P1→P6)  →  DEVELOPMENT  →  E2E & POLISH (E0→E5)  →  RELEASE  →  MAINTENANCE
```

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

Kurallar kağıt üstünde kalmaz — bash hook'ları ile fiziksel olarak uygulanır ve Claude Code'a entegre:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `hooks/gate-guard.sh` | PreToolUse:Bash (git commit) | Gate PASSED yoksa commit'i bloklar |
| `hooks/quality-scan.sh` | PreToolUse:Bash (git commit) | Hardcoded secret, debug kodu, design token ihlali tarar |
| `hooks/routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP güncelleme hatırlatıcısı |

Entegrasyon: `.claude/settings.local.json` dosyasında `hooks` bloğunda tanımlı.

---

## Ecosystem Health Check

```bash
bash scripts/health-check.sh
```

11 kategori kontrol eder: Agent dosyaları, kurallar, fazlar, hook'lar, snippet'ler, template'ler, knowledge base, paket tutarlılığı, design token ihlalleri, CI/CD, temel dosyalar.

---

## Skill Komutları

| Komut | Açıklama | Dosya |
|-------|----------|-------|
| `/check` | Proje sağlık kontrolü (build, type, lint, security) | `.claude/commands/check.md` |
| `/review-ui` | UI/UX kod incelemesi (token, responsive, a11y, dark mode) | `.claude/commands/review-ui.md` |
| `/deploy` | Vercel deployment checklist | `.claude/commands/deploy.md` |
| `/snippet [tip]` | Hızlı bileşen üretimi | `.claude/commands/snippet.md` |
| `/theme [proje]` | Görsel tema uygulama | `.claude/commands/theme.md` |
| `/new-project [ad]` | Yeni proje sihirbazı | `.claude/commands/new-project.md` |
| `/release [seviye]` | Versiyon artırma + changelog | `.claude/commands/release.md` |
| `/clone-website <url>` | Pixel-perfect site klonlama (Browser MCP gerekli) | `.claude/skills/clone-website/SKILL.md` |

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

### Görsel Tema Uygula

```text
/theme ahmetakyapi
/theme digynotes
/theme mimio
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
/snippet modal
/snippet form
/snippet drawer
/snippet skeleton
/snippet toast
/snippet confirm
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

Yeni bir Next.js projesinde:

```bash
# Lokal paketleri referans et (workspace veya dosya yolu)
npm install @ahmetakyapi/theme @ahmetakyapi/ui
```

```ts
// tailwind.config.ts
import preset from '@ahmetakyapi/theme/tailwind'
export default { presets: [preset], content: [...] }
```

```css
/* globals.css */
@import '@ahmetakyapi/theme/css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
// hooks, bileşenler ve varyantlar
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmetakyapi/ui'
import { GlassCard, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'
import { fadeUp, fadeIn, staggerContainer, EASE } from '@ahmetakyapi/ui'
import { cn } from '@ahmetakyapi/ui'
```

---

## Kurallar

Tüm agent'lar `rules/` altındaki kurallara uyar:

| Kural | Özet |
|-------|------|
| `immutable-architecture.md` | Server-first, performance, DB migration, state, auth, no shortcuts |
| `design-tokens.md` | Hardcoded renk/boyut YASAK, semantic token zorunlu |
| `commit-conventions.md` | `feat/fix/refactor(scope): description` formatı |
| `bugfix-protocol.md` | TDD: failing test → fix → green → regression → document |
| `dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline |
| `routemap-discipline.md` | ROUTEMAP tek kaynak, session resume, durum geçişleri |
| `context-curation.md` | Agent bazlı filtered context, token bütçesi |

---

## Bu Dosyaları Güncelleme

- **Yeni hata keşfedilince**: `knowledge/mistakes.md` güncelle
- **Yeni proje tamamlanınca**: `knowledge/themes/[proje].md` doldur
- **Yeni desen bulununca**: `knowledge/patterns.md` güncelle
- **Paket versiyonu güncellenince**: `packages/@ahmet/*/package.json` + `CHANGELOG.md` güncelle
- **Yeni kural eklenince**: `rules/` altında dosya oluştur, `AGENT_PROTOCOL.md`'ye referans ekle
- **Yeni faz eklenince**: `phases/` altında dosya oluştur
- **Yeni hook eklenince**: `hooks/` altında script oluştur, `.claude/settings.local.json`'a ekle
- **Yeni skill eklenince**: `.claude/commands/` altında `.md` oluştur
- **Yeni snippet eklenince**: `snippets/` altında `.tsx` oluştur
- **Katkı rehberi**: `CONTRIBUTING.md`'ye bakınız

---

## Global Kurallar

Bakınız: `~/.claude/CLAUDE.md`
