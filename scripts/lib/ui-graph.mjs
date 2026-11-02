/**
 * ui-graph — snippets/ui bileşen kütüphanesinin bağımlılık grafiği
 *
 * `scripts/add-ui.mjs` (projeye kurulum) ve `scripts/build-ui-registry.mjs`
 * (registry.json + shadcn kaydı) AYNI çözücüyü kullanır: biri kaynaktan,
 * öteki kayıttan okusaydı ikisi sessizce ayrışırdı.
 *
 * Çözüm kuralı (storybook/.storybook/resolve-at.ts ile aynı):
 *   - `@/components/ui/<ad>` → önce `snippets/ui/<ad>.tsx`, yoksa landing
 *     şablonunun `components/ui/<ad>`ı (Button, Field, ThemeToggle…).
 *   - Geri kalan `@/…` → landing şablonu (`lib/utils`, `lib/motion`, `lib/theme`).
 *   - Göreli içe aktarım → içe aktaran dosyanın yanından.
 *   - Çıplak ad → npm paketi (`motion/react` → `motion`).
 * Büyük/küçük harf ayrıdır: `skeleton` snippet, `Skeleton` şablonun dosyası.
 *
 * Bağımlılıksız (yalnız node:*), Node 22+.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const SNIPPETS_UI = join(REPO, 'snippets', 'ui')
export const TEMPLATE = join(REPO, 'templates', 'landing')
export const STORIES = join(REPO, 'storybook', 'stories')
export const PALETTES_REL = 'app/palettes.css'

/** Kurulu her Next projesinde zaten olan paketler: kurulum komutuna girmez. */
export const FRAMEWORK_PACKAGES = new Set(['react', 'react-dom', 'next'])

const EXT = ['', '.tsx', '.ts', '.mts', '.css', '/index.tsx', '/index.ts']

/** Windows'ta da ileri eğik çizgi: kayıt ve çıktı platformdan bağımsız. */
export const toPosix = (p) => p.split(sep).join('/')

function firstExisting(base) {
  for (const ext of EXT) {
    const file = base + ext
    if (existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

/** Kütüphanedeki bileşen adları (dosya adı, uzantısız), sıralı. */
export function listComponents() {
  return readdirSync(SNIPPETS_UI)
    .filter((f) => f.endsWith('.tsx') && !/\.(test|spec|stories)\.tsx$/.test(f))
    .map((f) => f.slice(0, -4))
    .sort()
}

/**
 * Yorumları siler: JSDoc'taki `import "../palettes.css";` gibi örnekler
 * gerçek içe aktarım sanılmasın. Dizgedeki `https://` korunur (önündeki `:`).
 */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1')
}

/**
 * İçe aktarımlar: `{ spec, names }`. `names` adlandırılmış içe aktarılanlar
 * (`type` önekleri ve `as` takma adları ayıklanmış); hedefte eksik dışa
 * aktarımı yakalamak için kullanılır.
 */
export function parseImports(src) {
  const code = stripComments(src)
  const out = []
  const re = /\b(?:import|export)\s+(?:type\s+)?(?:([\w*{}\s,$]+?)\s+from\s+)?["']([^"'\n]+)["']/g
  for (const m of code.matchAll(re)) {
    const clause = m[1] ?? ''
    const names = []
    const braces = clause.match(/\{([^}]*)\}/)
    if (braces) {
      for (const part of braces[1].split(',')) {
        const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
        if (name) names.push(name)
      }
    }
    out.push({ spec: m[2], names })
  }
  for (const m of code.matchAll(/\bimport\(\s*["']([^"'\n]+)["']\s*\)/g)) out.push({ spec: m[1], names: [] })
  return out
}

/** `@scope/ad/alt` → `@scope/ad`, `motion/react` → `motion`; `node:*` → null. */
export function packageName(spec) {
  if (spec.startsWith('node:')) return null
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

/** Kaynak dosyanın türü ve projedeki hedef yolu (`@/` köküne göre, posix). */
export function describeFile(file) {
  if (file.startsWith(SNIPPETS_UI + sep)) {
    const base = file.slice(SNIPPETS_UI.length + 1)
    return { kind: 'ui', name: base.replace(/\.tsx?$/, ''), source: toPosix(relative(REPO, file)), target: `components/ui/${base}` }
  }
  if (file.startsWith(TEMPLATE + sep)) {
    const rel = toPosix(relative(TEMPLATE, file))
    return { kind: 'template', name: rel.replace(/\.[a-z]+$/, ''), source: toPosix(relative(REPO, file)), target: rel }
  }
  throw new Error(`Kütüphane dışı dosya: ${file}`)
}

/** Tek içe aktarımı çözer: `{ kind: 'file', file }` | `{ kind: 'npm', pkg }` | null (çözülemedi). */
export function resolveSpecifier(spec, fromFile) {
  if (spec.startsWith('@/')) {
    const rest = spec.slice(2)
    if (rest.startsWith('components/ui/')) {
      const name = rest.slice('components/ui/'.length)
      const file = firstExisting(join(SNIPPETS_UI, name)) ?? firstExisting(join(TEMPLATE, rest))
      return file ? { kind: 'file', file } : null
    }
    const file = firstExisting(join(TEMPLATE, rest))
    return file ? { kind: 'file', file } : null
  }
  if (spec.startsWith('.')) {
    const file = firstExisting(resolve(dirname(fromFile), spec))
    return file ? { kind: 'file', file } : null
  }
  const pkg = packageName(spec)
  return pkg ? { kind: 'npm', pkg } : { kind: 'builtin' }
}

const analysisCache = new Map()

/** Bir dosyanın kendi (transitif olmayan) bağımlılıkları. */
export function analyzeFile(file) {
  if (analysisCache.has(file)) return analysisCache.get(file)
  const src = readFileSync(file, 'utf8')
  const code = stripComments(src)
  const files = []
  const npm = new Set()
  const unresolved = []
  /** hedef dosya → bu dosyanın ondan istediği adlar */
  const wants = new Map()
  for (const { spec, names } of parseImports(src)) {
    const r = resolveSpecifier(spec, file)
    if (!r) unresolved.push(spec)
    else if (r.kind === 'file') {
      if (!files.includes(r.file)) files.push(r.file)
      wants.set(r.file, [...(wants.get(r.file) ?? []), ...names])
    } else if (r.kind === 'npm') npm.add(r.pkg)
  }
  const result = {
    file,
    client: /^\s*["']use client["']/.test(code),
    // Kurulum yönergesi yorumda da olsa ihtiyaç gerçektir (palette-switcher).
    palettes: /palettes\.css/.test(src),
    files,
    npm: [...npm].sort(),
    unresolved,
    wants,
  }
  analysisCache.set(file, result)
  return result
}

export function componentFile(name) {
  const file = join(SNIPPETS_UI, `${name}.tsx`)
  return existsSync(file) ? file : null
}

/**
 * Bileşenlerin transitif kapanışı: kopyalanacak her dosya (bileşenler,
 * şablondan gelen yardımcılar), npm paketleri, palettes.css ihtiyacı.
 */
export function collectClosure(names) {
  const files = new Map()
  const npm = new Set()
  const unresolved = []
  const wants = new Map()
  let palettes = false
  const queue = names.map((n) => {
    const f = componentFile(n)
    if (!f) throw new Error(`Bileşen yok: ${n}`)
    return f
  })
  while (queue.length) {
    const file = queue.shift()
    if (files.has(file)) continue
    const a = analyzeFile(file)
    files.set(file, describeFile(file))
    a.npm.forEach((p) => npm.add(p))
    a.unresolved.forEach((s) => unresolved.push({ from: toPosix(relative(REPO, file)), spec: s }))
    for (const [dep, list] of a.wants) {
      const set = wants.get(dep) ?? new Set()
      list.forEach((n) => set.add(n))
      wants.set(dep, set)
    }
    palettes ||= a.palettes
    queue.push(...a.files)
  }
  if (palettes) {
    const file = join(TEMPLATE, PALETTES_REL)
    files.set(file, describeFile(file))
  }
  return { files, npm: [...npm].sort(), unresolved, palettes, wants }
}

/** npm sürümleri: landing şablonu tek kaynak; orada olmayan (Base UI) Storybook'tan. */
export function packageVersions() {
  const read = (p) => {
    try {
      const j = JSON.parse(readFileSync(p, 'utf8'))
      return { ...j.devDependencies, ...j.dependencies }
    } catch {
      return {}
    }
  }
  return { ...read(join(REPO, 'storybook', 'package.json')), ...read(join(TEMPLATE, 'package.json')) }
}

/**
 * README kataloğu: `### Başlık` altındaki tablo satırları → kategori + "Ne Zaman".
 * Kataloğa henüz girmemiş bileşen `Diğer` kategorisine düşer (kayıt kırılmaz,
 * `build-ui-registry --check` uyarır).
 */
export function readCatalog() {
  const text = readFileSync(join(SNIPPETS_UI, 'README.md'), 'utf8')
  const out = new Map()
  let category = null
  for (const line of text.split('\n')) {
    const h = line.match(/^###\s+(.+?)\s*$/)
    if (h) category = h[1]
    else if (/^##\s/.test(line)) category = null
    const row = line.match(/^\|\s*`([a-z0-9-]+)\.tsx`\s*\|\s*([^|]+?)\s*\|/)
    if (row && category && !out.has(row[1])) out.set(row[1], { category, description: row[2] })
  }
  return out
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.stories.tsx') ? [join(dir, d.name)] : [],
  )
}

/**
 * Storybook eşlemesi: bileşen adı → { storyId, title }.
 * Kural (storybook/README → "Adresler İngilizce"): meta `id` = dosya adı.
 * Önce meta'nın `component:` tanımlayıcısının geldiği modül; o yoksa id = ad.
 * (`track-bar-chart` → `bar-chart` gibi istisnalar böyle bulunur.)
 */
export function readStoryMap() {
  const out = new Map()
  const known = new Set(listComponents())
  for (const file of walk(STORIES)) {
    const src = readFileSync(file, 'utf8')
    const at = src.search(/const meta\b|export default\s*\{/)
    if (at < 0) continue
    const meta = src.slice(at)
    const id = meta.match(/\n\s{2}id:\s*["']([^"']+)["']/)?.[1]
    const title = meta.match(/\n\s{2}title:\s*["']([^"']+)["']/)?.[1]
    if (!id || !title) continue
    const imports = new Map()
    for (const m of src.matchAll(/import\s+\{([^}]*)\}\s+from\s+["']@\/components\/ui\/([^"']+)["']/g)) {
      for (const part of m[1].split(',')) {
        const local = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim()
        if (local) imports.set(local, m[2])
      }
    }
    const comp = meta.match(/\n\s{2}component:\s*([A-Za-z_$][\w$]*)/)?.[1]
    const byComponent = comp && imports.get(comp)
    const name = byComponent && known.has(byComponent) ? byComponent : known.has(id) ? id : null
    if (!name) continue
    const leaf = title.split('/').pop()
    // id = ad olan sayfa kesin eşleşmedir; başka sayfa onu ezmez.
    if (!out.has(name) || id === name) out.set(name, { storyId: id, title: leaf })
  }
  return out
}

/** Bileşenin kendi (transitif olmayan) özeti: kayıt satırı bundan kurulur. */
export function describeComponent(name) {
  const file = componentFile(name)
  if (!file) throw new Error(`Bileşen yok: ${name}`)
  const a = analyzeFile(file)
  const deps = a.files.map(describeFile)
  return {
    name,
    file: toPosix(relative(REPO, file)),
    client: a.client,
    palettes: a.palettes,
    registryDependencies: deps.filter((d) => d.kind === 'ui').map((d) => d.name),
    templateFiles: [...deps.filter((d) => d.kind === 'template').map((d) => d.target), ...(a.palettes ? [PALETTES_REL] : [])],
    npm: a.npm,
    unresolved: a.unresolved,
  }
}
