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
  BA Agent çıktıyı inceler
      ↓
  Deploy → DP Agent
```

---

## Standart Handoff Mesajı

Agent'tan agent'a iş geçerken bu formatta ilet:

```text
AGENT_HANDOFF
  from: [BA | UI | FE | BE | DP]
  to:   [BA | UI | FE | BE | DP]
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
Paralel çalıştır:
  → UI Agent: [görsel kısım]
  → BE Agent: [API/DB kısım]

Bekle: Her iki çıktı da hazır olunca FE Agent entegre eder.
```

---

## Proje Bağlamı (Her Agent İçin Zorunlu)

Her agent bir göreve başlamadan önce şunları kontrol et:

1. `~/dev-starter/knowledge/mistakes.md` — bilinen hatalar
2. `~/dev-starter/knowledge/patterns.md` — test edilmiş desenler
3. `~/dev-starter/knowledge/themes/[proje].md` — görsel tema (UI işlerinde)
4. Projenin `CLAUDE.md` (varsa)

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
| `/check` | Proje sağlık kontrolü | BA, FE, BE, DP |
| `/review-ui` | UI/UX kod incelemesi | UI, FE, BA |
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
