# Agent Haberleşme Protokolü

Bu dosya tüm agent'ların nasıl iletişim kurduğunu tanımlar.
Claude Code Agent SDK'sının `Agent` ve `SendMessage` araçlarını kullanır.

---

## Agent Ekibi

| Agent | Dosya | Alan | Kısaltma |
|-------|-------|------|----------|
| Business Analyst | `business-analyst-agent.md` | Planlama, onay, yönlendirme | **BA** |
| UI/UX | `uiux-agent.md` | Tasarım, animasyon, görsel sistem | **UI** |
| Frontend | `frontend-agent.md` | Next.js, React, TypeScript | **FE** |
| Backend | `backend-agent.md` | DB, API, auth | **BE** |
| Gate | `gate-agent.md` | Kalite kontrolü, auto-fix, enforcement | **GATE** |
| Deploy | `deploy-agent.md` | Vercel, CI/CD, production | **DP** |

---

## Akış

```text
Kullanıcı talebi
      ↓
   BA Agent
  (doğrula)
      ↓
  Onay? ─── Hayır ──→ Geri dön, revizyon iste
      │
      Evet
      ↓
 İlgili agent(lar) paralel/sıralı çalışır
      ↓
  FE/BE Agent self-check
      ↓
  Gate Agent — 6-pass kalite kontrolü
      ↓
  PASSED? ─── Hayır ──→ Auto-fix veya agent'a geri gönder (max 2 döngü)
      │
      Evet
      ↓
  Commit (conventional commit)
      ↓
  BA Agent çıktıyı inceler
      ↓
  Deploy → DP Agent
```

### Bugfix Akışı

```text
Bug bildirimi
      ↓
   BA Agent (triage: HOTFIX/BUGFIX/REGRESSION)
      ↓
   Bugfix Protocol (TDD): Failing test → Fix → Green → Regression
      ↓
   Gate Agent
      ↓
   Commit + mistakes.md güncelle
```

---

## Standart Handoff Mesajı

Agent'tan agent'a iş geçerken bu formatta ilet:

```text
AGENT_HANDOFF
  from: [BA | UI | FE | BE | GATE | DP]
  to:   [BA | UI | FE | BE | GATE | DP]
  task: [tek cümle görev tanımı]
  context:
    - proje: [proje adı]
    - ilgili dosyalar: [dosya yolları]
    - bağımlılıklar: [önceki agent çıktısı varsa özet]
  acceptance_criteria:
    - [kriter 1]
    - [kriter 2]
```

---

## Paralel Çalışma Kuralı

BA Agent'ın bir işi birden fazla agent'a yönlendirmesi durumunda:

```text
Wave 1 (paralel):
  → UI Agent: [görsel kısım]
  → BE Agent: [API/DB kısım]

Wave 2 (Wave 1 bittikten sonra):
  → FE Agent: UI + API entegrasyonu

Wave 3:
  → Gate Agent: Kalite kontrolü
  → BA Agent: Review
```

Wave arası: Build kontrolü yap, çakışma varsa çöz.

---

## Kurallar (Tüm Agent'lar İçin Zorunlu)

Her agent bu kurallara uyar, istisnası yoktur:

| Kural Dosyası | İçerik | Özellikle Kim |
|---------------|--------|---------------|
| `rules/immutable-architecture.md` | Server-first, performance, DB, state, auth | FE, BE, GATE |
| `rules/design-tokens.md` | Hardcoded değer yasağı, token enforcement | UI, FE, GATE |
| `rules/commit-conventions.md` | Conventional commit standardı | Herkes |
| `rules/bugfix-protocol.md` | TDD bugfix akışı | FE, BE, GATE |
| `rules/dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline | Herkes |
| `rules/routemap-discipline.md` | ROUTEMAP tek kaynak prensibi | Herkes |
| `rules/context-curation.md` | Agent bazlı context seviyeleri | Herkes |

---

## Yaşam Döngüsü Fazları

Proje bu fazları sırasıyla takip eder:

| Faz | Protokol Dosyası | Yöneten Agent |
|-----|-----------------|---------------|
| **Planning** (P1→P6) | `phases/planning.md` | BA Agent |
| **Development** | `rules/dev-cycle.md` | BA → FE/BE/UI → GATE |
| **E2E & Polish** (E0→E5) | `phases/e2e-polish.md` | BA + GATE |
| **Release & Maintenance** | `phases/release-maintenance.md` | BA + DP |

### Session Resume

Her yeni session'da:

1. `docs/ROUTEMAP.md` oku (varsa)
2. Aktif faz ve son tamamlanan adımı bul
3. Kullanıcıya özet sun: "Kaldığımız yer: [faz] — [son story]"
4. Onay al, devam et

---

## Enforcement Hook'ları

Kuralların kağıt üstünde kalmaması için bash hook'ları:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `hooks/gate-guard.sh` | PreToolUse:Bash (git commit) | Gate PASSED yoksa commit bloklar |
| `hooks/quality-scan.sh` | PreToolUse:Bash (git commit) | Hardcoded değer, debug kodu, secret tarar |
| `hooks/routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP güncelleme hatırlatıcısı |

---

## Context Curation

Her agent sadece ihtiyacı olan bilgiyi alır (`rules/context-curation.md`):

| Agent | Seviye | Max Token | Ne Okur |
|-------|--------|-----------|---------|
| BA | FULL | ~50k | Tüm dokümanlar |
| UI | FOCUSED | ~15k | Tema + ekranlar |
| FE | TASK-SPECIFIC | ~10k | Story + ilgili dosyalar |
| BE | TASK-SPECIFIC | ~10k | Story + schema + API |
| GATE | REVIEW | ~20k | Story + diff + rules |
| DP | MINIMAL | ~5k | Config + env |

---

## Proje Bağlamı (Her Agent İçin Zorunlu)

Her agent bir göreve başlamadan önce şunları kontrol et:

1. `docs/ROUTEMAP.md` — proje durumu (varsa)
2. `~/dev-starter/knowledge/mistakes.md` — bilinen hatalar
3. `~/dev-starter/knowledge/patterns.md` — test edilmiş desenler
4. `~/dev-starter/knowledge/themes/[proje].md` — görsel tema (UI işlerinde)
5. `~/dev-starter/rules/` — kural dosyaları (context seviyesine göre)
6. Projenin `CLAUDE.md` (varsa)

### Ahmet'in Repo'ları

| Repo | Tema Dosyası | Stack Özellikleri |
|------|-------------|-------------------|
| ahmetakyapi.com | `themes/ahmetakyapi.md` | Next.js, Three.js, Framer Motion |
| Mimio | `themes/mimio.md` | Next.js, custom data-theme |
| DigyNotes | `themes/digynotes.md` | Next.js, Emerald accent, html.light |
| Keskealsaydım | `themes/keskealsaydim.md` | Next.js, shadcn, HSL vars |
| Ramazan Vakitleri | `themes/ramazan-vakitleri.md` | Dark only, Mor+Pembe+Mavi |

---

## Skills Referans Tablosu

| Skill | Kullanım | Hangi Agent |
|-------|----------|-------------|
| `/check` | Proje sağlık kontrolü | BA, FE, BE, GATE, DP |
| `/review-ui` | UI/UX kod incelemesi | UI, FE, GATE |
| `/snippet [tip]` | Hızlı bileşen üret | UI, FE |
| `/theme [proje]` | Görsel tema uygula | UI |
| `/deploy` | Vercel deploy checklist | DP, BA |
| `/release [patch\|minor\|major]` | npm paketi yayınla | DP |
| `/new-project [ad]` | Yeni proje sihirbazı | BA |

---

## Güncel Teknoloji Referansları

### Next.js 15

- `params` ve `searchParams` artık `Promise<...>` — `await` edilmeli
- `use cache` direktifi — granüler cache kontrolü
- `unstable_cache` → `use cache` ile değiştir
- PPR (Partial Prerendering) — experimental ama stabil yaklaşıyor
- `after()` API — response sonrası background işlemler

### React 19

- `use(promise)` hook — Suspense ile async data
- `useActionState` — form action durumu
- `useOptimistic` — optimistic UI
- `useFormStatus` — form submission durumu
- Server Actions stabil — `'use server'` direktifi
- `ref` artık prop olarak geçilebilir (forwardRef gereksiz)
- `<form action={serverAction}>` — doğrudan Server Action bağlantısı

### Tailwind v4

- Config dosyası yok — `tailwind.config.ts` kullanılmaz
- `@import "tailwindcss"` CSS dosyasında
- `@theme { }` bloğunda custom token'lar
- `@layer` kullanımı aynı
- Artık PostCSS plugin değil, Vite/native entegrasyon

### TypeScript 5.5+

- `satisfies` operatörü — type narrowing için
- `const` type parameters
- Inferred type predicates

### Claude Agent SDK

- `Agent` tool — yeni agent spawn et
- `SendMessage` — mevcut agent'a mesaj gönder
- `subagent_type` — hangi agent tipi kullanılacak
- `isolation: "worktree"` — izole git worktree

---

## Hata Yönetimi

Bir agent görevi tamamlayamazsa:

```text
AGENT_ERROR
  agent: [agent adı]
  task:  [görev]
  error: [hata açıklaması]
  blocker: [ne engel oluyor]
  needs: [neye ihtiyaç var]
```

Bu mesajı BA Agent'a ilet, yeniden yönlendirme yapacaktır.

Gate Agent FAILED döndürdüğünde:

```text
GATE_FAILED
  story: [görev adı]
  pass: [hangi pass fail etti]
  severity: [CRITICAL | HIGH]
  issue: [sorun açıklaması]
  attempted_fix: [denenen auto-fix]
  needs: [agent'tan ne bekleniyor]
```

Bu mesaj ilgili agent'a (FE/BE) iletilir, max 2 düzeltme döngüsü sonra BA Agent'a escalate.
