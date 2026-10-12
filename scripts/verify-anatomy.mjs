#!/usr/bin/env node
/**
 * verify-anatomy — anatomy figür kiti iki şablonda HÂLÂ sorunsuz mu?
 *
 * NEDEN VAR: anatomy bir npm paketi değil, neredeyse her gün değişen bir
 * skill deposu. Kiti şablona kopyalayan betik (add-figure-kit.mjs) bir kez
 * çalıştı diye her sürümde çalışacağı söylenemez. İlk denemede derleme ve
 * tip kontrolü geçti, lint 28 hatayla düştü (mistakes.md #98): "derlendi"
 * ile "CI yeşil" aynı şey değil.
 *
 * Ne yapar: bootstrap.sh'deki ANATOMY_REF'i (tek kaynak) geçici bir dizine
 * klonlar; her şablonu kopyalar, add-figure-kit --example ile kiti ve örnek
 * figürü kurar, figürü bir sayfaya koyar ve şablonun kendi CI sırasını koşar:
 * npm install → build → typecheck → lint → test.
 *
 * Ağ + iki npm install gerektirir; health-check'in yolunda DEĞİL.
 * Opt-in: `npm run verify:anatomy` (tek şablon: `-- landing`)
 * Yerel skill'i denemek için: `-- --local` (~/.claude/skills/anatomy)
 */

import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const TEMPLATES = args.filter((a) => !a.startsWith('--'))
const targets = TEMPLATES.length ? TEMPLATES : ['landing', 'nextjs-fullstack']

const fail = (msg) => {
  console.error(`\n❌ ${msg}`)
  process.exit(1)
}

const run = (cmd, cmdArgs, cwd, label, env = {}) => {
  try {
    execFileSync(cmd, cmdArgs, { cwd, stdio: 'pipe', encoding: 'utf8', env: { ...process.env, ...env } })
    console.log(`  ✅ ${label}`)
  } catch (error) {
    console.error(String(error.stdout ?? '').slice(-4000) + String(error.stderr ?? '').slice(-4000))
    fail(`${label} BAŞARISIZ`)
  }
}

const work = mkdtempSync(join(tmpdir(), 'verify-anatomy-'))
process.on('exit', () => rmSync(work, { recursive: true, force: true }))

// Kaynak: sabit commit (bootstrap.sh) ya da --local
let source
if (args.includes('--local')) {
  source = join(homedir(), '.claude/skills/anatomy')
  console.log(`📦 Kaynak: ${source} (yerel)`)
} else {
  const ref = readFileSync(join(REPO, 'machine/bootstrap.sh'), 'utf8').match(/^ANATOMY_REF="([0-9a-f]{40})"/m)?.[1]
  if (!ref) fail('machine/bootstrap.sh içinde ANATOMY_REF="<40 haneli sha>" satırı yok')
  source = join(work, 'anatomy')
  console.log(`📦 anatomy @ ${ref.slice(0, 7)} klonlanıyor...`)
  run('git', ['clone', '--quiet', 'https://github.com/wheresryan22/anatomy', source], work, 'klonlandı')
  run('git', ['-c', 'advice.detachedHead=false', 'checkout', '--quiet', ref], source, `${ref.slice(0, 7)} seçildi`)
}

// Figürü gösteren sayfa: şablonun vitrinine dokunmadan ayrı bir rota.
const FIGURE_PAGE = `import { TestRigFigure } from "@/components/figures/test-rig/figure";

export default function FigurePage() {
  return (
    <main id="icerik" className="mx-auto max-w-3xl px-4 py-16">
      <TestRigFigure />
    </main>
  );
}
`

for (const name of targets) {
  console.log(`\n▸ templates/${name}`)
  const dir = join(work, name)
  cpSync(join(REPO, 'templates', name), dir, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('/.next') })

  run('node', [join(REPO, 'scripts/add-figure-kit.mjs'), dir, '--example', '--source', source], dir, 'add-figure-kit --example')
  mkdirSync(join(dir, 'app/figur'), { recursive: true })
  writeFileSync(join(dir, 'app/figur/page.tsx'), FIGURE_PAGE)

  run('npm', ['install', '--no-audit', '--no-fund', '--silent'], dir, 'npm install')
  // Şablonun kendi CI sırası (ci.yml): build önce, PageProps tipleri build'de üretilir.
  run('npm', ['run', 'build'], dir, 'build', { SKIP_ENV_VALIDATION: '1', AUTH_SECRET: 'verify-placeholder' })
  run('npm', ['run', 'typecheck'], dir, 'typecheck')
  run('npm', ['run', 'lint', '--', '--max-warnings=0'], dir, 'lint (uyarısız)')
  run('npm', ['test'], dir, 'test')
}

console.log('\n✅ anatomy figür kiti şablonlarda derleniyor, lint ve testler temiz\n')
