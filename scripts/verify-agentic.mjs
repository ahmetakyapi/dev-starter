#!/usr/bin/env node
/**
 * verify-agentic — Agentic snippet ve template'lerinin HALA derlendigini kanitlar
 *
 * NEDEN VAR: bu dosyalar bir kez `tsc --noEmit` ile dogrulanip commit edildi.
 * Ama CopilotKit haftalik surum cikariyor. Bir yukseltmeden sonra "derlenmisti"
 * demek, `mistakes.md`in alti kez tekrarladigi hataya dusmek olur:
 * bir kontrolun bir kez yesil olmasi, hala yesil oldugu anlamina gelmez.
 *
 * Ne yapar: gecici bir dizinde PIN'LENMIS bagimliliklari kurar, snippet ve
 * template dosyalarini kopyalar, `tsc --noEmit` + `vitest run` calistirir.
 *
 * AG kurulumu icin ag erisimi gerekir; bu yuzden health-check'in varsayilan
 * yolunda DEGIL. Opt-in: `npm run verify:agentic`
 */

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TPL = join(REPO, 'templates/agentic-chat')

// Pin'ler TEK KAYNAKTAN gelir: template'in package.json'i.
// Burada tekrar yazsaydik ikisi sessizce ayrisirdi.
const pins = JSON.parse(readFileSync(join(TPL, 'package.json'), 'utf8')).dependencies
const DEV = ['typescript@5', 'vitest@3', 'react@19', 'react-dom@19', '@types/react@19', '@types/node', 'motion@13']

const fail = (msg) => {
  console.error(`\n❌ ${msg}`)
  process.exit(1)
}

// @ag-ui/* pin'leri CopilotKit'in bagimliliklariyla ayni mi? -> mistakes.md #71
// core da karsilastirilir: client'i yukseltip core'u unutmak ikinci bir core
// kopyasi kurar ve skipLibCheck .d.ts uyusmazligini gizler.
const AG_UI = ['@ag-ui/client', '@ag-ui/core']
const ckVersion = pins['@copilotkit/react-core']
let ckDeps
try {
  ckDeps = JSON.parse(execFileSync('npm', ['view', `@copilotkit/react-core@${ckVersion}`, 'dependencies', '--json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }))
} catch {
  console.warn('⚠️  npm view basarisiz (ag yok?) — pin kontrolu atlandi')
}
for (const name of AG_UI) {
  const expected = ckDeps?.[name]
  if (!expected) continue
  if (pins[name] !== expected) {
    fail(`${name} pin'i uyusmuyor: template "${pins[name]}", CopilotKit ${ckVersion} "${expected}" istiyor.\n   -> knowledge/mistakes.md #71`)
  }
  console.log(`✅ ${name} pin'i CopilotKit ${ckVersion} ile uyumlu (${expected})`)
}

const work = mkdtempSync(join(tmpdir(), 'verify-agentic-'))
process.on('exit', () => rmSync(work, { recursive: true, force: true }))
// Dinleyicisiz SIGINT/SIGTERM'de Node 'exit' yaymaz: kurulum sirasinda
// Ctrl-C gecici dizini node_modules'uyle birlikte tmpdir'de birakiyordu.
for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => process.exit(130))

const run = (cmd, args, label) => {
  try {
    execFileSync(cmd, args, { cwd: work, stdio: 'pipe', encoding: 'utf8' })
    console.log(`✅ ${label}`)
  } catch (error) {
    console.error(String(error.stdout ?? '') + String(error.stderr ?? ''))
    fail(`${label} BASARISIZ`)
  }
}

writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'verify-agentic', private: true, type: 'module' }))
console.log(`\n📦 Bagimliliklar kuruluyor (${work})...`)
const specs = Object.entries(pins).map(([n, v]) => `${n}@${v}`)
// --ignore-scripts: kilitsiz kurulumda gecisli bagimliliklarin post-install
// script'leri calismasin (tedarik zinciri). tsc ve vitest'in calismasi icin
// script gerekmiyor; gerektigi gun bu dogrulama kosusu kendisi soyler.
run('npm', ['install', '--no-audit', '--no-fund', '--silent', '--ignore-scripts', ...specs, ...DEV], 'bagimliliklar kuruldu')

// Ic kopya kaldi mi? Kaldiysa tipler nominal olarak ayrisir (ayni surumun iki
// kopyasi da). Yalniz react-core'un altina bakmak yetmez: @copilotkit/core,
// shared ve web-inspector de @ag-ui/client'a bagimli; farkli pin'leyen bir
// surum kopyayi KENDI node_modules'una koyar. Butun agac taranir.
const copies = Object.fromEntries(AG_UI.map((name) => [name, []]))
const scan = (nodeModules) => {
  for (const name of AG_UI) {
    const manifest = join(nodeModules, name, 'package.json')
    if (existsSync(manifest)) copies[name].push(`${JSON.parse(readFileSync(manifest, 'utf8')).version} (${manifest.slice(work.length + 1)})`)
  }
  for (const entry of readdirSync(nodeModules)) {
    const dirs = entry.startsWith('@')
      ? readdirSync(join(nodeModules, entry)).map((n) => join(nodeModules, entry, n))
      : [join(nodeModules, entry)]
    for (const dir of dirs) {
      if (existsSync(join(dir, 'node_modules'))) scan(join(dir, 'node_modules'))
    }
  }
}
scan(join(work, 'node_modules'))
for (const name of AG_UI) {
  if (copies[name].length > 1) {
    fail(`${name} CIFT KOPYA — HttpAgent tipi AbstractAgent'a atanamaz:\n   ${copies[name].join('\n   ')}\n   -> knowledge/mistakes.md #71`)
  }
}
console.log('✅ @ag-ui/client + @ag-ui/core tek kopya (cift kopya yok)')

// Kaynaklari topla: snippet'ler + template
mkdirSync(join(work, 'src/lib'), { recursive: true })
mkdirSync(join(work, 'src/app'), { recursive: true })
mkdirSync(join(work, 'src/__tests__'), { recursive: true })
for (const f of ['agent-tool.tsx', 'action-card.tsx', 'agent-approval.tsx', 'agent-tool.test.ts', 'agent-feed.tsx', 'agent-feed-core.ts']) {
  cpSync(join(REPO, 'snippets', f), join(work, 'src', f))
}
cpSync(join(TPL, 'lib/agui-scenarios.ts'), join(work, 'src/lib/agui-scenarios.ts'))
cpSync(join(TPL, 'app/providers/copilot-provider.tsx'), join(work, 'src/app/copilot-provider.tsx'))
cpSync(join(TPL, 'app/api/agent/route.ts'), join(work, 'src/app/route.ts'))
for (const f of ['agui-scenarios.test.ts', 'agui-contract.test.ts']) {
  cpSync(join(TPL, '__tests__', f), join(work, 'src/__tests__', f))
}

writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], jsx: 'react-jsx',
    module: 'ESNext', moduleResolution: 'bundler', strict: true, noEmit: true,
    skipLibCheck: true, esModuleInterop: true, baseUrl: './src', paths: { '@/*': ['./*'] },
  },
  include: ['src'],
}, null, 2))
cpSync(join(TPL, 'vitest.config.ts'), join(work, 'vitest.config.ts'))

run('npx', ['tsc', '--noEmit'], 'tsc --noEmit temiz')
run('npx', ['vitest', 'run', '--reporter=dot'], 'vitest gecti')

console.log('\n✅ Agentic dogrulama tamam — snippet\'ler ve template derleniyor, testler geciyor\n')
