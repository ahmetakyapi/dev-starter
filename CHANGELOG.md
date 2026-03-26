# Changelog

Tum onemli degisiklikler bu dosyada belgelenir.
Format: [Keep a Changelog](https://keepachangelog.com/) + [Semantic Versioning](https://semver.org/)

---

## [2.0.0] — 2026-03-25

### Eklenenler (Added)

- **Agent Sistemi**: 7 agent dosyasi (BA, UI, FE, BE, Gate, Deploy + AGENT_PROTOCOL)
- **Gate Agent**: 6-pass kalite kontrolu (Requirements, Compliance, Security, Tests, Performance, UI) + auto-fix
- **Kural Dosyalari**: 7 kural (immutable-architecture, design-tokens, commit-conventions, bugfix-protocol, dev-cycle, routemap-discipline, context-curation)
- **Faz Dosyalari**: Planning (P1-P6), E2E & Polish (E0-E5), Release & Maintenance
- **Enforcement Hook'lari**: gate-guard.sh, quality-scan.sh, routemap-sync.sh — Claude Code'a entegre
- **Skill Komutlari**: /check, /review-ui, /deploy, /snippet, /theme, /new-project, /release
- **Snippet'ler**: modal, drawer, form, skeleton, toast, confirm (mevcut 4'e ek olarak)
- **Ecosystem Health Check**: scripts/health-check.sh — 11 kategori, otomatik dogrulama
- **CI/CD**: TypeScript kontrolu, guvenlik taramasi, design token kontrolu, ecosystem health check
- **Doc Template'leri**: ROUTEMAP, PRODUCT, ARCHITECTURE, SCREENS sablonlari
- **ESLint + Prettier**: Root seviye yapilandirma
- **EditorConfig**: Tuketici IDE tutarliligi

### Degistirilenler (Changed)

- **Button bilesen**: Hardcoded renkler (`bg-indigo-600`) → semantic token (`bg-ahmet-indigo`)
- **Button bilesen**: Dark/light mode parity eklendi
- **CLAUDE.md**: Tam ekosistem dokumantasyonu ile yeniden yazildi
- **AGENT_PROTOCOL.md**: Lifecycle fazlari, enforcement hook'lari, context curation eklendi
- **CI workflow**: Build-only → quality checks + ecosystem health
- **knowledge/patterns.md**: Error handling, form submission, middleware auth, pagination, file upload, image optimization desenleri eklendi
- **knowledge/mistakes.md**: 32 → 37 hata kaydi (async context, migration rollback, edge limits, framer bundle, npm workspace)

### Duzeltilen (Fixed)

- Button bileseninde design token ihlali (rules/design-tokens.md)
- Ghost ve outline varyantlarinda dark/light mode eksikligi

---

## [1.0.0] — 2026-03-20

### Eklenenler (Added)

- Monorepo yapisi (npm workspaces)
- `@ahmetakyapi/theme` paketi — CSS tokenlari, Tailwind preset, animasyon degerleri
- `@ahmetakyapi/ui` paketi — GlassCard, Button, Chip, CustomCursor + hooks + variants
- Proje sablonlari: nextjs-fullstack, landing
- Snippet'ler: animated-number, infinite-scroll, og-image, search-bar
- Knowledge base: mistakes.md (32 hata), patterns.md, 5 tema dosyasi
- BA ve UI/UX agent dosyalari
- Temel CI pipeline (build + export verify)
