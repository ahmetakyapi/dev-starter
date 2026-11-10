<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proje Kuralları (Her Kodlama Asistanı İçin)

Ayrıntılı rehber `CLAUDE.md`; buradaki kısa liste Codex, Cursor, Copilot gibi
`AGENTS.md` okuyan asistanlar ve insan geliştirici içindir. Claude'a özgü
hook'lar (Gate, sır taraması) yalnız Claude Code'da çalışır. Başka araçla ya
da terminalden commit atıyorsan klon başına bir kez
`bash ~/dev-starter/hooks/git-pre-commit.sh --install` çalıştır (aynı iki
kontrolü git'in pre-commit kancasına bağlar); `~/dev-starter` yoksa aşağıdaki
kontrolleri commit'ten önce ELLE çalıştır.

- **Renk ve ölçü yalnız token'dan**: `bg-page`, `text-strong`, `border-line`,
  `bg-cta text-on-brand`. Hex, `rgb()`, Tailwind ham paleti (`bg-zinc-100`),
  `bg-white` ve `dark:` yok; tema `data-theme` ile token'dan döner.
- **Hareket** `motion/react` ve `m.*` (kökte `LazyMotion`); `framer-motion`
  yok. Yalnız `transform`/`opacity`; hareketi azaltan kullanıcıya saygı.
- **Arayüz metni Türkçe**, başlık ve düğmede Title Case; `capitalize` ya da
  `toUpperCase` yok (Türkçe i → I hatası). Emoji ikon yok, `lucide-react`.
- **Next 16**: `proxy.ts` (middleware değil), `params`/`cookies()` async.
  Kod yazmadan önce yukarıdaki bloktaki Next belgelerine bak.
- **Commit**: `<tip>(<kapsam>): <açıklama>` (feat, fix, refactor, style,
  docs, test, chore, perf, ci). Sır, `.env`, `console.log`, `@ts-ignore`
  girmez.
- **Commit öncesi** (sırayla): `npm run lint && npm run typecheck && npm test
  && npm run build`, sonra `bash ~/dev-starter/scripts/slop-scan.sh app components`.
- **Durum** `docs/ROUTEMAP.md`'de; iş bitince story satırını güncelle.
