#!/usr/bin/env node
/**
 * add-figure-kit — anatomy'nin figür kitini bir Next projesine kurar
 *
 *   node ~/dev-starter/scripts/add-figure-kit.mjs <proje> [--example] [--source <anatomy dizini>]
 *
 * Ne yapar (tekrar çalıştırmak güvenli; yalnız kit dosyalarının üzerine yazar):
 *   1. kit/iso-kit.ts, kit/iso.css, kit/react/{draw,live}.tsx → components/iso/
 *      (+ LICENSE ve hangi commit'ten geldiğini yazan SOURCE.md)
 *   2. components/iso/bridge.css: kitin mono fontu projenin fontuna bağlanır
 *   3. app/layout.tsx: iki CSS importu (`./globals.css` satırının altına)
 *   4. --example: examples/test-rig → components/figures/test-rig (yoksa)
 *
 * Neden kopya, paket değil: anatomy bir npm paketi değil, bir skill. Kit
 * projeye kopyalanır (references/react.md "Copy kit/ into the project").
 * Kaynak varsayılan olarak bootstrap'in kurduğu `~/.claude/skills/anatomy`;
 * şablon zaten hazır: <html class="iso"> ve figür dizinleri için ESLint ayarı.
 *
 * Doğrulama: `npm run verify:anatomy` bu betiği iki şablonda koşar ve
 * build + typecheck + lint + test'in temiz kaldığını kanıtlar.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--source')

const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

const project = positional[0] && resolve(positional[0])
if (!project) fail('Kullanım: node add-figure-kit.mjs <proje> [--example] [--source <anatomy dizini>]')
const layoutPath = join(project, 'app/layout.tsx')
if (!existsSync(layoutPath)) fail(`${layoutPath} yok — Next App Router projesi değil mi?`)

const source = resolve(option('--source') ?? join(homedir(), '.claude/skills/anatomy'))
if (!existsSync(join(source, 'kit/iso-kit.ts'))) {
  fail(`${source} içinde anatomy kiti yok. Önce: bash ~/dev-starter/machine/bootstrap.sh (ya da --source)`)
}

let commit = 'bilinmiyor'
try {
  commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
} catch {
  // git deposu değilse commit bilinmez; kurulum yine yapılır
}

// 1. Kit
const iso = join(project, 'components/iso')
mkdirSync(join(iso, 'react'), { recursive: true })
for (const f of ['iso-kit.ts', 'iso.css']) cpSync(join(source, 'kit', f), join(iso, f))
for (const f of ['draw.tsx', 'live.tsx']) cpSync(join(source, 'kit/react', f), join(iso, 'react', f))
if (existsSync(join(source, 'LICENSE'))) cpSync(join(source, 'LICENSE'), join(iso, 'LICENSE'))
writeFileSync(
  join(iso, 'SOURCE.md'),
  `# Figür kiti — wheresryan22/anatomy (MIT)

Kaynak commit: \`${commit}\`

Bu dizin \`~/dev-starter/scripts/add-figure-kit.mjs\` ile kopyalandı. Elle
düzenleme: betik yeniden çalışınca \`iso-kit.ts\`, \`iso.css\` ve \`react/\`
üzerine yazılır. Projeye özgü stil \`bridge.css\`e ya da figürün kendi CSS'ine.

Figür yazmak: anatomy skill'i (\`/anatomy\` ya da "bunu açıklayan bir figür çiz").
Yerleşim: \`components/figures/<ad>/\` (model.ts, view.ts, geometry.ts, art.tsx,
live.tsx, figure.tsx). Kurallar: \`~/.claude/skills/anatomy/references/react.md\`.
`,
)

// 2. Köprü: kitin token'larına dokunmadan yalnız projenin fontu.
const bridge = join(iso, 'bridge.css')
if (!existsSync(bridge)) {
  writeFileSync(
    bridge,
    `/*
 * Figür kiti ↔ proje köprüsü. Kitin gri tonları (gölge, kenar, kağıt) BİLEREK
 * nötr kalır: figür bir ölçü aleti kartıdır, palet rengi taşımaz. Yalnızca
 * yazı ailesi projeninkine bağlanır. Tema: <html class="iso" data-theme>,
 * kit açık temaya \`.iso[data-theme="light"]\` ile geçer.
 */
.iso {
  --anatomy-mono: var(--font-mono-face, ui-monospace), "SF Mono", Menlo, monospace;
}
`,
  )
}

// 3. CSS importları
let layout = readFileSync(layoutPath, 'utf8')
const anchor = 'import "./globals.css";'
const imports = 'import "@/components/iso/iso.css";\nimport "@/components/iso/bridge.css";'
if (!layout.includes('@/components/iso/iso.css')) {
  if (!layout.includes(anchor)) fail(`app/layout.tsx içinde '${anchor}' satırı yok; importları elle ekle:\n${imports}`)
  layout = layout.replace(anchor, `${anchor}\n${imports}`)
  writeFileSync(layoutPath, layout)
}
if (!/className=\{`iso /.test(layout) && !/className="iso[ "]/.test(layout)) {
  console.warn('⚠️  <html> üzerinde `iso` sınıfı yok: kit açık temaya geçemez. Şablondan gelen layout\'ta vardır.')
}

// 4. Örnek figür
if (flag('--example')) {
  const target = join(project, 'components/figures/test-rig')
  if (existsSync(target)) {
    console.log('= components/figures/test-rig zaten var, dokunulmadı')
  } else {
    cpSync(join(source, 'examples/test-rig'), target, { recursive: true })
    for (const f of readdirSync(target)) {
      if (!/\.(ts|tsx)$/.test(f)) continue
      const p = join(target, f)
      writeFileSync(
        p,
        readFileSync(p, 'utf8')
          .replaceAll('"../../kit/react/', '"@/components/iso/react/')
          .replaceAll('"../../kit/iso-kit"', '"@/components/iso/iso-kit"'),
      )
    }
    console.log('✅ Örnek figür: components/figures/test-rig (TestRigFigure, figure.tsx)')
  }
}

console.log(`✅ Figür kiti kuruldu: components/iso (anatomy ${commit.slice(0, 7)})`)
