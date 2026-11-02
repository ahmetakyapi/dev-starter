#!/usr/bin/env node
/**
 * add-ui — snippets/ui bileşenlerini bir Next projesine kurar (bağımlılıklarıyla)
 *
 *   node ~/dev-starter/scripts/add-ui.mjs <proje> <bileşen...> [--dry-run] [--force] [--install]
 *   node ~/dev-starter/scripts/add-ui.mjs <proje> --all
 *   node ~/dev-starter/scripts/add-ui.mjs --list
 *
 * Ne yapar:
 *   1. Her bileşenin TRANSİTİF bağımlılıklarını kaynaktan çözer: `@/components/ui/x`
 *      → snippets/ui/x.tsx (yoksa şablonun components/ui'si), `@/lib/utils`,
 *      `@/lib/motion`, `@/lib/theme` → landing şablonu. Kayıt (registry.json)
 *      değil kaynak okunur: henüz kayda girmemiş bileşen de kurulur.
 *   2. Dosyaları projenin `@/` köküne (tsconfig `paths`, `src/` dahil) kopyalar:
 *      bileşenler `components/ui/`, yardımcılar `lib/`. Var olan dosyanın üstüne
 *      YAZMAZ: aynıysa "aynı", farklıysa "farklı" der ve satır farkını sayar
 *      (`--force` ile üzerine yazar). macOS/Windows'ta `skeleton.tsx` ile
 *      `Skeleton.tsx` aynı dosyadır: harf çakışması ayrıca durdurulur.
 *   3. Eksik npm paketlerini (sürüm landing şablonunun package.json'ından)
 *      projenin paket yöneticisiyle kurulum komutu olarak yazar; `--install`
 *      çalıştırır.
 *   4. `palettes.css` gerekiyorsa `app/palettes.css`i kopyalar ve globals.css'e
 *      eklenecek satırı söyler.
 *   5. Hedefte eksik olanı uyarır: kullanılan token'lar (`--color-*`,
 *      `--shadow-*`, `@utility`), `m.*` için kökte `LazyMotion`, atlanan
 *      yardımcı dosyada bileşenin istediği dışa aktarım (ör. `SPRING`).
 *
 * Çıkış: 0 tamam (atlanan dosya varsa uyarıyla), 1 kullanım hatası / bilinmeyen bileşen.
 * Bağımlılıksız, Node 22+. Belgeler: guides/10-component-library.md § 7.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import {
  FRAMEWORK_PACKAGES,
  TEMPLATE,
  collectClosure,
  describeComponent,
  listComponents,
  packageVersions,
  readCatalog,
  stripComments,
  toPosix,
} from './lib/ui-graph.mjs'

const USAGE = `Kullanım:
  node ~/dev-starter/scripts/add-ui.mjs <proje> <bileşen...> [--dry-run] [--force] [--install]
  node ~/dev-starter/scripts/add-ui.mjs <proje> --all [--dry-run]
  node ~/dev-starter/scripts/add-ui.mjs --list`

const argv = process.argv.slice(2)
const FLAGS = new Set(['--list', '--dry-run', '--force', '--all', '--install', '--help', '-h'])
const flag = (f) => argv.includes(f)
const unknownFlags = argv.filter((a) => a.startsWith('-') && !FLAGS.has(a))
const positional = argv.filter((a) => !a.startsWith('-'))

const fail = (msg, code = 1) => {
  console.error(`✖ ${msg}`)
  process.exit(code)
}

if (flag('--help') || flag('-h')) {
  console.log(USAGE)
  process.exit(0)
}
if (unknownFlags.length) fail(`Bilinmeyen seçenek: ${unknownFlags.join(', ')}\n${USAGE}`)

const all = listComponents()

// ─── --list ──────────────────────────────────────────────────────────────────

if (flag('--list')) {
  const catalog = readCatalog()
  const groups = new Map()
  for (const name of all) {
    const cat = catalog.get(name)?.category ?? 'Diğer'
    groups.set(cat, [...(groups.get(cat) ?? []), name])
  }
  for (const [cat, names] of groups) {
    console.log(`\n${cat}`)
    for (const name of names) {
      const d = describeComponent(name)
      const deps = [...d.registryDependencies, ...d.npm.filter((p) => !FRAMEWORK_PACKAGES.has(p) && p !== 'react')]
      console.log(`  ${name.padEnd(22)} ${d.client ? 'istemci' : 'sunucu '}  ${deps.join(', ')}`)
    }
  }
  console.log(`\n${all.length} bileşen. Kurulum: node ~/dev-starter/scripts/add-ui.mjs <proje> <ad...>`)
  process.exit(0)
}

// ─── Argümanlar ──────────────────────────────────────────────────────────────

const [projectArg, ...requested] = positional
if (!projectArg) fail(USAGE)
const project = resolve(projectArg)
if (!existsSync(project) || !statSync(project).isDirectory()) fail(`Proje dizini yok: ${project}`)
const pkgPath = join(project, 'package.json')
if (!existsSync(pkgPath)) fail(`${pkgPath} yok — bir Node projesi değil mi?`)

const normalize = (raw) => raw.replace(/^ui\//, '').replace(/\.tsx$/, '').trim()
const byLower = new Map(all.map((n) => [n.toLowerCase(), n]))
const names = flag('--all') ? all : [...new Set(requested.map(normalize))]
if (!names.length) fail(`Bileşen adı ver ya da --all.\n${USAGE}`)

function suggest(raw) {
  const q = raw.toLowerCase()
  const hits = all.filter((n) => n.includes(q) || q.includes(n) || n.split('-').some((p) => p.length > 2 && q.includes(p)))
  return hits.length ? ` Şunu mu demek istedin: ${hits.slice(0, 5).join(', ')}?` : ' Liste: --list'
}
const resolvedNames = names.map((raw) => byLower.get(raw.toLowerCase()) ?? fail(`Bileşen yok: "${raw}".${suggest(raw)}`))

const DRY = flag('--dry-run')
const FORCE = flag('--force')

// ─── Projenin `@/` kökü (tsconfig paths) ─────────────────────────────────────

const warnings = []

/**
 * tsconfig yorum ve sondaki virgül taşıyabilir (JSONC). Dizge farkında okur:
 * include desenindeki (yıldız, eğik çizgi, yıldız) yorum başlangıcı değildir.
 */
function readJsonc(path) {
  const src = readFileSync(path, 'utf8')
  let out = ''
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '"') {
      let j = i + 1
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1
      out += src.slice(i, j + 1)
      i = j
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++
      out += '\n'
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2)
      if (i < 0) break
      i++
    } else out += c
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

function aliasRoot() {
  for (const f of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(project, f)
    if (!existsSync(p)) continue
    try {
      const co = readJsonc(p).compilerOptions ?? {}
      const target = co.paths?.['@/*']?.[0]
      if (target) return resolve(project, co.baseUrl ?? '.', target.replace(/\*$/, ''))
    } catch {
      warnings.push(`${f} okunamadı; @/ kökü tahmin edildi`)
    }
  }
  const guess = existsSync(join(project, 'src', 'app')) ? join(project, 'src') : project
  const rel = toPosix(relative(project, guess))
  warnings.push(`tsconfig'te "@/*" takma adı yok: bileşenler @/ ile içe aktarır. compilerOptions.paths → { "@/*": ["./${rel ? `${rel}/` : ''}*"] } ekle`)
  return guess
}
const root = aliasRoot()

// ─── Plan ────────────────────────────────────────────────────────────────────

let closure
try {
  closure = collectClosure(resolvedNames)
} catch (e) {
  fail(e.message)
}
for (const u of closure.unresolved) warnings.push(`${u.from}: çözülemeyen içe aktarım "${u.spec}" (kaynakta eksik dosya)`)

/** Satır farkı: yalnız birinde geçen satır sayısı (diff değil, büyüklük işareti). */
function lineDelta(a, b) {
  const count = (lines) => lines.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map())
  const ca = count(a.split('\n'))
  const cb = count(b.split('\n'))
  let plus = 0
  let minus = 0
  for (const [l, n] of cb) plus += Math.max(0, n - (ca.get(l) ?? 0))
  for (const [l, n] of ca) minus += Math.max(0, n - (cb.get(l) ?? 0))
  return `+${plus} −${minus} satır`
}

/** Hedef dizinde aynı adın başka harfle yazılmışı (macOS/Windows'ta aynı dosya). */
function caseTwin(target) {
  const dir = dirname(target)
  if (!existsSync(dir)) return null
  const want = basename(target)
  return readdirSync(dir).find((f) => f !== want && f.toLowerCase() === want.toLowerCase()) ?? null
}

const plan = []
for (const [file, d] of closure.files) {
  const target = join(root, ...d.target.split('/'))
  const content = readFileSync(file, 'utf8')
  const row = { file, d, target, content, status: 'yeni', note: '' }
  const twin = caseTwin(target)
  if (twin) {
    row.status = 'çakışma'
    row.note = `${twin} var; macOS/Windows'ta aynı dosya, atlandı`
  } else if (existsSync(target)) {
    const current = readFileSync(target, 'utf8')
    if (current === content) row.status = 'aynı'
    else if (FORCE) row.status = 'üzerine'
    else {
      row.status = 'farklı'
      row.note = `${lineDelta(current, content)}; atlandı (--force ile üzerine yaz)`
      row.current = current
    }
  }
  plan.push(row)
}

if (!DRY) {
  for (const row of plan) {
    if (row.status !== 'yeni' && row.status !== 'üzerine') continue
    mkdirSync(dirname(row.target), { recursive: true })
    writeFileSync(row.target, row.content)
  }
}

// ─── Atlanan yardımcıda istenen dışa aktarım var mı ──────────────────────────

for (const row of plan) {
  if (row.status !== 'farklı' || !row.current) continue
  const wanted = closure.wants.get(row.file)
  if (!wanted?.size) continue
  const code = stripComments(row.current)
  const missing = [...wanted].filter(
    (n) =>
      !new RegExp(`export\\s+(?:declare\\s+)?(?:async\\s+)?(?:const|let|var|function\\*?|class|type|interface|enum)\\s+${n}\\b`).test(code) &&
      !new RegExp(`export\\s*(?:type\\s*)?\\{[^}]*\\b${n}\\b[^}]*\\}`).test(code),
  )
  if (missing.length) warnings.push(`${projectRel(row.target)} atlandı ama bileşenlerin istediği dışa aktarım onda yok: ${missing.join(', ')}`)
}
function projectRel(p) {
  return toPosix(relative(project, p))
}

// ─── npm paketleri ───────────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const have = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
const versions = packageVersions()
const missingPkgs = closure.npm.filter((p) => !have[p])
const spec = (p) => (versions[p] ? `${p}@${versions[p]}` : p)

function packageManager() {
  if (existsSync(join(project, 'pnpm-lock.yaml'))) return ['pnpm', 'add']
  if (existsSync(join(project, 'yarn.lock'))) return ['yarn', 'add']
  if (existsSync(join(project, 'bun.lock')) || existsSync(join(project, 'bun.lockb'))) return ['bun', 'add']
  return ['npm', 'install']
}
const [pm, pmAdd] = packageManager()
const installArgs = [pmAdd, ...missingPkgs.map(spec)]
const quote = (s) => (/[\^~<>|&\s]/.test(s) ? `"${s}"` : s)
const installCmd = `${pm} ${installArgs.map(quote).join(' ')}`

// ─── palettes.css ────────────────────────────────────────────────────────────

const globalsPath = join(root, 'app', 'globals.css')
const globals = existsSync(globalsPath) ? readFileSync(globalsPath, 'utf8') : null
const nextSteps = []
if (closure.palettes && !(globals && /@import\s+["']\.\/palettes\.css["']/.test(globals))) {
  nextSteps.push(`${toPosix(relative(project, globalsPath))}: \`@import "tailwindcss";\` satırının altına  @import "./palettes.css";`)
  nextSteps.push('Palet çerezi ilk boyamadan önce gelsin: components/ui/palette-switcher.tsx başındaki KURULUM 2. adım')
}

// ─── Token ve LazyMotion denetimi ────────────────────────────────────────────

const copiedCode = plan.filter((r) => /\.tsx?$/.test(r.target)).map((r) => stripComments(r.content)).join('\n')

if (!globals) {
  warnings.push(`${toPosix(relative(project, globalsPath))} yok: bileşenler şablonun token sınıflarına dayanır (guides/02-design-tokens.md)`)
} else {
  const tpl = readFileSync(join(TEMPLATE, 'app', 'globals.css'), 'utf8')
  // Tailwind'in kendi teması bunları zaten taşır: hedefte tanımsız olması eksiklik değil
  const builtIn = new Set(['shadow-sm', 'shadow-md', 'text-base'])
  const tokens = new Map()
  for (const m of tpl.matchAll(/--(color|shadow)-([a-z0-9]+(?:-[a-z0-9]+)*)\s*:/g)) tokens.set(`${m[1]}-${m[2]}`, { ns: m[1], name: m[2] })
  // Punto: yalnız satır yüksekliği eşi olanlar (`--text-strong` gibi ham rol değişkeni punto değil)
  for (const m of tpl.matchAll(/--text-([a-z0-9]+)--line-height\s*:/g)) tokens.set(`text-${m[1]}`, { ns: 'text', name: m[1] })
  for (const m of tpl.matchAll(/@utility\s+([a-z0-9-]+)/g)) tokens.set(`utility-${m[1]}`, { ns: 'utility', name: m[1] })
  const PREFIX = {
    color: '(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|fill|stroke|outline|from|via|to|divide|placeholder|caret|accent|decoration|shadow)',
    shadow: 'shadow',
    text: 'text',
  }
  const missing = []
  for (const [key, t] of tokens) {
    if (builtIn.has(key)) continue
    const used =
      t.ns === 'utility'
        ? new RegExp(`(?<![\\w-])${t.name}(?![\\w-])`).test(copiedCode)
        : new RegExp(`(?<![\\w-])(?:[a-z-]+:)*${PREFIX[t.ns]}-${t.name}(?![\\w-])`).test(copiedCode)
    if (!used) continue
    const defined =
      t.ns === 'utility'
        ? new RegExp(`@utility\\s+${t.name}\\b|\\.${t.name}\\s*[{,]`).test(globals)
        : globals.includes(`--${t.ns}-${t.name}`)
    if (!defined) missing.push(t.ns === 'utility' ? `@utility ${t.name}` : `--${t.ns}-${t.name}`)
  }
  if (missing.length) {
    const shown = missing.slice(0, 12).join(', ') + (missing.length > 12 ? ` … (+${missing.length - 12})` : '')
    warnings.push(`globals.css'te bileşenlerin kullandığı token yok: ${shown}. Şablonun globals.css'inden al (guides/02-design-tokens.md)`)
  }
}

if (/\bm\.[a-z]/.test(copiedCode) || /import\s*\{[^}]*\bm\b[^}]*\}\s*from\s*["']motion\/react["']/.test(copiedCode)) {
  const scan = (dir, depth = 0) =>
    existsSync(dir) &&
    readdirSync(dir, { withFileTypes: true }).some((e) => {
      if (e.name === 'node_modules' || e.name.startsWith('.')) return false
      const p = join(dir, e.name)
      if (e.isDirectory()) return depth < 4 && scan(p, depth + 1)
      return /\.(tsx|ts|jsx|js)$/.test(e.name) && readFileSync(p, 'utf8').includes('LazyMotion')
    })
  const hasLazy = ['app', 'components', 'src'].some((d) => scan(join(project, d)))
  if (!hasLazy) warnings.push('m.* kullanan bileşen var ama projede LazyMotion yok: kök layout\'ta <LazyMotion features={domAnimation} strict> şart (guides/04-motion.md)')
}

// ─── Rapor ───────────────────────────────────────────────────────────────────

const rows = plan.map((r) => [toPosix(relative(project, r.target)), r.d.kind === 'ui' ? r.d.source.replace('snippets/', '') : `şablon: ${r.d.target}`, r.status, r.note])
const widths = [0, 1, 2].map((i) => Math.max(['Dosya', 'Kaynak', 'Durum'][i].length, ...rows.map((r) => r[i].length)))
const line = (cells) => cells.map((c, i) => (i < 3 ? c.padEnd(widths[i]) : c)).join('  ').trimEnd()

console.log(`\n${DRY ? 'Deneme (--dry-run, hiçbir şey yazılmadı)' : 'Kurulum'}: ${resolvedNames.join(', ')} → ${project}\n`)
console.log(line(['Dosya', 'Kaynak', 'Durum', '']))
console.log(line(widths.map((w) => '─'.repeat(w)).concat('')))
for (const r of rows) console.log(line(r))

const count = (s) => plan.filter((r) => r.status === s).length
console.log(
  `\n${count('yeni')} yeni, ${count('üzerine')} üzerine yazıldı, ${count('aynı')} aynı, ${count('farklı')} farklı (atlandı), ${count('çakışma')} harf çakışması`,
)

console.log('\nnpm paketleri:')
if (!closure.npm.length) console.log('  gerek yok')
for (const p of closure.npm) console.log(`  ${p.padEnd(18)} ${have[p] ? `var (${have[p]})` : `EKSİK → ${versions[p] ?? 'son sürüm'}`}`)

if (missingPkgs.length) {
  if (flag('--install') && !DRY) {
    console.log(`\n$ ${installCmd}`)
    // Windows'ta npm/pnpm .cmd betiği: Node 22 kabuk olmadan çalıştırmaz.
    const r = spawnSync(pm, installArgs, { cwd: project, stdio: 'inherit', shell: process.platform === 'win32' })
    if (r.status !== 0) warnings.push(`Kurulum başarısız (exit ${r.status ?? r.error?.message}); elle: ${installCmd}`)
  } else nextSteps.unshift(`Paketleri kur:  ${installCmd}${DRY ? '' : '   (ya da --install)'}`)
}

nextSteps.push('Doğrula: npm run typecheck && npm run lint')
if (warnings.length) {
  console.log('\nUyarılar:')
  for (const w of warnings) console.log(`  ! ${w}`)
}
console.log('\nSonraki adımlar:')
nextSteps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
console.log('')
