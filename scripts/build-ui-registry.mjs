#!/usr/bin/env node
/**
 * build-ui-registry — snippets/ui kütüphanesinin kaydını üretir
 *
 *   node scripts/build-ui-registry.mjs          # yaz   (npm run registry:ui)
 *   node scripts/build-ui-registry.mjs --check  # ayrışma var mı (npm run verify:registry, CI)
 *   UI_REGISTRY_URL=http://localhost:4000/r node scripts/build-ui-registry.mjs --out /tmp/r   # yerel shadcn denemesi
 *
 * Üç çıktı, tek kaynak (bileşen dosyaları + README kataloğu + hikâye kimlikleri):
 *   1. snippets/ui/registry.json — her bileşen: ad, dosya, Türkçe başlık ve
 *      kategori, istemci mi, doğrudan iç bağımlılıklar, şablondan gelen dosyalar
 *      ve npm paketleri (bu ikisi transitif; sürüm landing şablonundan),
 *      palettes.css gerekir mi, Storybook kimliği. Storybook'un "Projeye Al" bloğu bunu okur.
 *   2. storybook/public/r/<ad>.json — shadcn registry-item şeması
 *      (https://ui.shadcn.com/schema/registry-item.json). Herhangi bir Next
 *      projesinde: npx shadcn@latest add https://dev-starter-storybook.vercel.app/r/<ad>.json
 *      Şablondan gelen yardımcılar (lib/utils, lib/motion, ThemeToggle…) ayrı
 *      öğe, bileşen onlara URL ile bağlanır.
 *   3. storybook/public/r/registry.json — öğelerin dizini (registry şeması).
 *
 * --check: diske yazmaz; üretilecek içerik diskteki ile birebir değilse ya da
 * r/ altında artık bileşeni olmayan dosya kaldıysa exit 1. Bir bileşen
 * değişip kayıt yeniden üretilmezse kurulum eski kaynağı dağıtırdı.
 * Adres tabanı: UI_REGISTRY_URL (varsayılan aşağıda); --check aynı tabanla koşmalı.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import {
  FRAMEWORK_PACKAGES,
  REPO,
  SNIPPETS_UI,
  TEMPLATE,
  analyzeFile,
  collectClosure,
  describeComponent,
  describeFile,
  listComponents,
  packageVersions,
  readCatalog,
  readStoryMap,
  toPosix,
} from './lib/ui-graph.mjs'

const args = process.argv.slice(2)
const CHECK = args.includes('--check')
// --out <dizin>: shadcn öğelerini başka yere yaz (yerel deneme: UI_REGISTRY_URL=http://localhost:4000/r
// ile birlikte); snippets/ui/registry.json'a dokunmaz.
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null
const BASE_URL = (process.env.UI_REGISTRY_URL ?? 'https://dev-starter-storybook.vercel.app/r').replace(/\/$/, '')
const REGISTRY_JSON = join(SNIPPETS_UI, 'registry.json')
const R_DIR = OUT ? resolve(OUT) : join(REPO, 'storybook', 'public', 'r')
const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'
const INDEX_SCHEMA = 'https://ui.shadcn.com/schema/registry.json'

const components = listComponents()
const catalog = readCatalog()
const stories = readStoryMap()
const versions = packageVersions()
const warnings = []
const errors = []

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** Şablon dosyasının shadcn öğe adı: `lib/utils.ts` → `lib-utils`, `ThemeToggle` → `theme-toggle`. */
function templateItemName(target) {
  const m = target.match(/^components\/ui\/(.+)\.tsx?$/)
  if (m) {
    const name = kebab(m[1])
    // `Skeleton` (şablon) ile `skeleton` (snippet) çakışmasın
    return components.includes(name) ? `template-${name}` : name
  }
  if (target === 'app/palettes.css') return 'palettes'
  return kebab(target.replace(/\.[a-z]+$/, '').replace(/\//g, '-'))
}

const npmSpec = (pkg) => (versions[pkg] ? `${pkg}@${versions[pkg]}` : pkg)
const npmMap = (pkgs) => Object.fromEntries(pkgs.map((p) => [p, versions[p] ?? null]))

// ─── 1. registry.json ────────────────────────────────────────────────────────

const items = components.map((name) => {
  const d = describeComponent(name)
  const full = collectClosure([name])
  const closure = {
    templateFiles: [...full.files.values()].filter((f) => f.kind === 'template').map((f) => f.target).sort(),
    npm: full.npm,
  }
  for (const spec of d.unresolved) errors.push(`${d.file}: çözülemeyen içe aktarım "${spec}"`)
  const cat = catalog.get(name)
  const story = stories.get(name)
  if (!cat) warnings.push(`${name}: snippets/ui/README.md kataloğunda yok (kategori "Diğer")`)
  if (!story) warnings.push(`${name}: Storybook'ta meta id'si eşleşen hikâye yok`)
  for (const pkg of d.npm) if (!versions[pkg]) warnings.push(`${name}: "${pkg}" sürümü landing/storybook package.json'da yok`)
  return {
    name,
    title: story?.title ?? name,
    category: cat?.category ?? 'Diğer',
    description: cat?.description ?? '',
    file: d.file,
    client: d.client,
    storyId: story?.storyId ?? null,
    registryDependencies: d.registryDependencies,
    // Bileşenler doğrudan (zincir onlardan sürer); şablon dosyaları ve npm
    // paketleri TRANSİTİF: kurulumda gereken tam liste (date-picker → popover → Base UI).
    templateFiles: closure.templateFiles,
    npm: npmMap(closure.npm.filter((p) => !FRAMEWORK_PACKAGES.has(p))),
    palettes: full.palettes,
  }
})

const registry = {
  $comment:
    'ÜRETİLDİ — elle düzenleme. Kaynak: snippets/ui/*.tsx + README kataloğu + storybook hikâye kimlikleri. Üreten: npm run registry:ui',
  name: 'dev-starter-ui',
  homepage: BASE_URL.replace(/\/r$/, ''),
  shadcnBase: BASE_URL,
  install: {
    addUi: 'node ~/dev-starter/scripts/add-ui.mjs <proje> <ad...>',
    shadcn: `npx shadcn@latest add ${BASE_URL}/<ad>.json`,
  },
  items,
}

// ─── 2. shadcn registry-item'ları ────────────────────────────────────────────

/** @type {Map<string, object>} dosya adı → JSON */
const shadcn = new Map()

function shadcnDeps(file) {
  const a = analyzeFile(file)
  const deps = a.files.map(describeFile)
  if (a.palettes) deps.push(describeFile(join(TEMPLATE, 'app/palettes.css')))
  const registryDependencies = deps.map((d) => `${BASE_URL}/${d.kind === 'ui' ? d.name : templateItemName(d.target)}.json`)
  for (const d of deps) if (d.kind === 'template') addTemplateItem(join(REPO, d.source))
  return {
    dependencies: a.npm.filter((p) => !FRAMEWORK_PACKAGES.has(p)).map(npmSpec),
    registryDependencies,
  }
}

function addTemplateItem(file) {
  const d = describeFile(file)
  const name = templateItemName(d.target)
  if (shadcn.has(name)) return
  shadcn.set(name, null) // döngüye karşı yer tut
  const isCss = d.target.endsWith('.css')
  const isUi = d.target.startsWith('components/ui/')
  const type = isCss ? 'registry:file' : isUi ? 'registry:ui' : 'registry:lib'
  const deps = isCss ? { dependencies: [], registryDependencies: [] } : shadcnDeps(file)
  shadcn.set(name, {
    $schema: ITEM_SCHEMA,
    name,
    type,
    title: d.target,
    description: `dev-starter landing şablonundan: ${d.target}`,
    ...(deps.dependencies.length ? { dependencies: deps.dependencies } : {}),
    ...(deps.registryDependencies.length ? { registryDependencies: deps.registryDependencies } : {}),
    files: [
      {
        path: d.source,
        content: readFileSync(file, 'utf8'),
        type,
        // ui/lib projenin components.json takma adına gider; css dosyası köke göre.
        ...(isCss ? { target: d.target } : {}),
      },
    ],
  })
}

for (const item of items) {
  const file = join(REPO, item.file)
  const deps = shadcnDeps(file)
  shadcn.set(item.name, {
    $schema: ITEM_SCHEMA,
    name: item.name,
    type: 'registry:ui',
    title: item.title,
    description: item.description || item.title,
    ...(deps.dependencies.length ? { dependencies: deps.dependencies } : {}),
    ...(deps.registryDependencies.length ? { registryDependencies: deps.registryDependencies } : {}),
    files: [{ path: item.file, content: readFileSync(file, 'utf8'), type: 'registry:ui' }],
    categories: [item.category],
    meta: { client: item.client, storyId: item.storyId, palettes: item.palettes },
  })
}

const index = {
  $schema: INDEX_SCHEMA,
  name: 'dev-starter',
  homepage: registry.homepage,
  items: [...shadcn.values()].map(({ $schema: _s, files, ...rest }) => ({
    ...rest,
    files: files.map(({ content: _c, ...f }) => f),
  })),
}

// ─── Yaz ya da karşılaştır ───────────────────────────────────────────────────

const json = (v) => JSON.stringify(v, null, 2) + '\n'
const outputs = new Map([[join(R_DIR, 'registry.json'), json(index)]])
if (!OUT) outputs.set(REGISTRY_JSON, json(registry))
for (const [name, item] of shadcn) outputs.set(join(R_DIR, `${name}.json`), json(item))

const rel = (p) => toPosix(relative(REPO, p))
const stale = !OUT && existsSync(R_DIR)
  ? readdirSync(R_DIR).filter((f) => f.endsWith('.json') && !outputs.has(join(R_DIR, f))).map((f) => join(R_DIR, f))
  : []

for (const w of warnings) console.warn(`  ! ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`  ✖ ${e}`)
  process.exit(1)
}

if (CHECK) {
  const drift = [...outputs].filter(([p, body]) => !existsSync(p) || readFileSync(p, 'utf8') !== body).map(([p]) => rel(p))
  drift.push(...stale.map((p) => `${rel(p)} (artık bileşeni yok)`))
  if (drift.length) {
    console.error(`✖ UI kaydı kaynaktan ayrışmış (${drift.length} dosya):\n  ${drift.slice(0, 20).join('\n  ')}`)
    if (drift.length > 20) console.error(`  … ve ${drift.length - 20} dosya daha`)
    console.error('\nDüzeltme: npm run registry:ui')
    process.exit(1)
  }
  console.log(`✓ UI kaydı güncel: ${items.length} bileşen, ${shadcn.size} shadcn öğesi`)
} else {
  mkdirSync(R_DIR, { recursive: true })
  for (const p of stale) rmSync(p)
  for (const [p, body] of outputs) writeFileSync(p, body)
  if (!OUT) console.log(`✓ ${rel(REGISTRY_JSON)}: ${items.length} bileşen`)
  console.log(`✓ ${rel(R_DIR)}/: ${shadcn.size} shadcn öğesi + registry.json${stale.length ? `, ${stale.length} eski dosya silindi` : ''}`)
}
