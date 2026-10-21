#!/usr/bin/env node
/**
 * Lockfile Integrity Verification
 *
 * package-lock.json'un `npm ci` tarafindan KABUL EDILEBILIR oldugunu dogrular:
 * manifest'lerin (kok + her workspace) kilitle ayni seyi soyledigini ve
 * kilitteki her bagimlilik kenarinin kilit icinde cozulebildigini kontrol eder.
 *
 * Neden var: 2026-08-17'de CI'in iki isi de `npm ci` adiminda oldu —
 * "Missing: devtools-protocol from lock file". Kilit yerelde npm 11 (Node 24)
 * ile uretilmisti; CI Node 22 kullaniyordu, yani npm 10. npm 11 chromium-bidi'nin
 * `devtools-protocol: "*"` PEER bagimliligi icin tepe seviye girdi yazmiyor,
 * npm 10 ise onu sart kosuyor. Kilit yerelde gecerli, CI'da gecersizdi.
 * Commit yesil gorundu, CI kirmizi dustu, hicbir adim calismadi.
 * Bkz. knowledge/mistakes.md #57
 *
 * Neden `npm ci --dry-run` degil: o komut aga cikar ve saniyeler surer.
 * Bu kontrol tamamen cevrimdisidir ve pre-commit hook'unda calisacak kadar
 * hizlidir — kilit dosyasini okur, grafi yurur, biter.
 *
 * Kullanim:
 *   node scripts/verify-lockfile.mjs
 *   npm run verify:lock
 */

import { existsSync, readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const MANIFEST = resolve(ROOT, 'package.json')
const LOCKFILE = resolve(ROOT, 'package-lock.json')

/** Manifest'te bagimlilik tasiyan alanlar — lock girdisiyle birebir eslesmeli */
const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']

const problems = []

function problem(message, detail) {
  problems.push({ message, detail })
}

/**
 * Bir paketin `loc` konumundan `dep` adini node_modules yuruyusuyle cozer.
 *
 * npm'in cozumleme sirasini taklit eder: once kendi node_modules'u, sonra
 * yukari dogru her dizin. Kasten genis tutuldu — npm'in bakmayacagi bir yerde
 * bulmasi yanlis alarma degil, yalnizca kacirilmis bir bulguya yol acar.
 * Bu script commit blokladigi icin yanlis alarm en pahali hatadir.
 */
function resolveDep(loc, dep, packages) {
  let dir = loc
  for (;;) {
    const candidate = dir ? `${dir}/node_modules/${dep}` : `node_modules/${dep}`
    if (packages[candidate]) return candidate
    if (!dir) return null
    const slash = dir.lastIndexOf('/')
    dir = slash === -1 ? '' : dir.slice(0, slash)
  }
}

/** Bir lock girdisinin dogrulanmasi gereken bagimlilik kenarlari */
function edgesOf(entry, loc) {
  const edges = []
  // devDependencies kok ve workspace girdilerinde (node_modules disi) kurulur;
  // node_modules altindaki bir paketin dev bagimliligi agaca hic girmez.
  const fields = loc.includes('node_modules/')
    ? ['dependencies', 'optionalDependencies']
    : ['dependencies', 'devDependencies', 'optionalDependencies']
  for (const field of fields) {
    for (const name of Object.keys(entry[field] ?? {})) edges.push(name)
  }
  // Peer bagimliliklar: npm 7+ bunlari agaca kurar, yani kilitte bulunmalari
  // gerekir. `peerDependenciesMeta.optional` isaretli olanlar haric — onlarin
  // yoklugu mesru.
  const peerMeta = entry.peerDependenciesMeta ?? {}
  for (const name of Object.keys(entry.peerDependencies ?? {})) {
    if (peerMeta[name]?.optional === true) continue
    edges.push(name)
  }
  return edges
}

/**
 * Bir manifest ile kilitteki girdisi ayni bagimliliklari ayni araliklarla mi
 * soyluyor? Anahtar anahtar bakilir: npm alanlari kendi sirasiyla yazar, sira
 * farki uyusmazlik degildir.
 */
function compareDeps(manifest, entry, fields, file, label) {
  for (const field of fields) {
    const fromManifest = manifest[field] ?? {}
    const fromLock = entry[field] ?? {}
    for (const [name, spec] of Object.entries(fromManifest)) {
      if (!(name in fromLock)) {
        problem(`${name} ${file}'da var, kilidin ${label} girdisinde yok`, `${field}: "${spec}"`)
      } else if (fromLock[name] !== spec) {
        problem(`${name} surum araligi uyusmuyor`, `${file}: "${spec}" · kilit: "${fromLock[name]}"`)
      }
    }
    for (const name of Object.keys(fromLock)) {
      if (!(name in fromManifest)) {
        problem(`${name} kilidin ${label} girdisinde var, ${file}'da yok`, field)
      }
    }
  }
}

/**
 * Kok manifest'in `workspaces` desenlerini dizinlere acar. Yalniz duz yol ve
 * sonu `/*` olan desen (packages/@ahmet/*) acilir; daha karmasik bir glob ya
 * da `!` dislamasi varsa liste bos doner. Acilamayan desen kacirilmis bulgudur,
 * yanlis acilan desen ise commit'i bloklayan yanlis alarm.
 */
function workspaceDirs(manifest) {
  const patterns = Array.isArray(manifest.workspaces) ? manifest.workspaces : (manifest.workspaces?.packages ?? [])
  if (patterns.some((p) => p.startsWith('!'))) return []
  const dirs = []
  for (const raw of patterns) {
    const pattern = raw.replace(/^\.\//, '').replace(/\/+$/, '')
    const wildcard = pattern.endsWith('/*')
    const parent = wildcard ? pattern.slice(0, -2) : pattern
    if (/[*?[\]{}]/.test(parent)) continue
    const candidates = !wildcard
      ? [parent]
      : existsSync(resolve(ROOT, parent))
        ? readdirSync(resolve(ROOT, parent), { withFileTypes: true })
            .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
            .map((d) => `${parent}/${d.name}`)
        : []
    for (const dir of candidates) {
      if (existsSync(resolve(ROOT, dir, 'package.json'))) dirs.push(dir)
    }
  }
  return dirs
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function main() {
  if (!existsSync(LOCKFILE)) {
    console.error('❌ package-lock.json bulunamadi')
    process.exit(1)
  }

  const manifest = await readJson(MANIFEST)
  const lock = await readJson(LOCKFILE)
  const packages = lock.packages ?? {}

  if (!packages['']) {
    problem('Kilit dosyasinda kok girdi (packages[""]) yok', 'lockfileVersion 2+ bekleniyor')
  }

  // ── 1. Kok manifest ile kilidin kok girdisi ayni mi? ───────────────────────
  // `npm ci`nin en sik verdigi EUSAGE nedeni: package.json'a bagimlilik
  // eklenip kilit yenilenmemesi.
  compareDeps(manifest, packages[''] ?? {}, DEP_FIELDS, 'package.json', 'kok')

  // ── 1b. Her workspace manifest'i kilitteki kendi girdisiyle ayni mi? ───────
  // Kok karsilastirmasi packages/@ahmet/ui/package.json'a eklenen bagimliligi
  // gormez; adim 2 de kilidin kendi (eski) kayitlarini yurudugu icin onu hic
  // bilmez. Sonuc: ✅ ve ardindan npm ci "Missing: ... from lock file".
  for (const dir of workspaceDirs(manifest)) {
    if (!packages[dir]) {
      problem(`${dir} workspace ama kilitte girdisi yok`, 'npm ci "Missing: ... from lock file" ile patlar')
    }
  }
  for (const [loc, entry] of Object.entries(packages)) {
    if (loc === '' || entry.link === true || loc.includes('node_modules/')) continue
    const wsManifest = resolve(ROOT, loc, 'package.json')
    if (!existsSync(wsManifest)) {
      problem(`${loc} kilitte workspace olarak var, package.json'u yok`, 'npm install kilidi yeniden yazar')
      continue
    }
    compareDeps(await readJson(wsManifest), entry, [...DEP_FIELDS, 'peerDependencies'], `${loc}/package.json`, loc)
  }

  // ── 2. Kilitteki her bagimlilik kenari kilit icinde cozulebiliyor mu? ──────
  // CI'i dusuren kontrol bu: kilit puppeteer'i tutuyordu ama onun
  // devtools-protocol bagimliligini tutmuyordu.
  let edgeCount = 0
  for (const [loc, entry] of Object.entries(packages)) {
    // Symlink girdileri (workspace linkleri) bagimliliklarini hedef girdide
    // tasir; burada tekrar dogrulamak cift sayim olur.
    if (entry.link === true) continue

    for (const dep of edgesOf(entry, loc)) {
      edgeCount++
      if (!resolveDep(loc, dep, packages)) {
        const from = loc === '' ? '(kok)' : loc
        problem(`${dep} kilitte yok ama ${from} onu istiyor`, 'npm ci "Missing: ... from lock file" ile patlar')
      }
    }
  }

  // ── Rapor ──────────────────────────────────────────────────────────────────
  if (problems.length > 0) {
    console.error('❌ package-lock.json manifest ile senkron degil\n')
    for (const { message, detail } of problems) {
      console.error(`   • ${message}`)
      if (detail) console.error(`     ${detail}`)
    }
    console.error('\n   Cozum: npm install  (ardindan degisen kilidi commit et)')
    console.error('   Node surumu .nvmrc ile ayni olmali — farkli npm major\'lari')
    console.error('   farkli kilit uretir ve CI reddeder.')
    process.exit(1)
  }

  const count = Object.keys(packages).length - 1
  console.log(`✅ package-lock.json tutarli — ${count} paket, ${edgeCount} bagimlilik kenari cozuldu`)

  // Kilit gecerli olsa bile, yerel Node major'i .nvmrc'den farkliysa bir sonraki
  // `npm install` CI'in reddedecegi bir kilit yazabilir. Bloklamaz, uyarir.
  await warnOnNodeMajorSkew()
}

async function warnOnNodeMajorSkew() {
  const nvmrc = resolve(ROOT, '.nvmrc')
  if (!existsSync(nvmrc)) return
  const wanted = (await readFile(nvmrc, 'utf8')).trim().replace(/^v/, '').split('.')[0]
  const actual = process.versions.node.split('.')[0]
  if (!wanted || wanted === actual) return
  console.warn(
    `⚠️  Node ${actual} kullaniyorsun, .nvmrc Node ${wanted} istiyor. Farkli npm ` +
      `major'lari farkli kilit uretir — kilidi .nvmrc surumuyle yenile.`
  )
}

main().catch((err) => {
  console.error(`❌ Kilit dogrulamasi calistirilamadi: ${err.message}`)
  process.exit(1)
})
