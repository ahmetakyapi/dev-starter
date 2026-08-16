#!/usr/bin/env node
/**
 * Lockfile Integrity Verification
 *
 * package-lock.json'un `npm ci` tarafindan KABUL EDILEBILIR oldugunu dogrular:
 * manifest ile kilidin ayni seyi soyledigini ve kilitteki her bagimlilik
 * kenarinin kilit icinde cozulebildigini kontrol eder.
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

import { existsSync } from 'node:fs'
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
function edgesOf(entry) {
  const edges = []
  for (const field of ['dependencies', 'optionalDependencies']) {
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
  const rootEntry = packages[''] ?? {}
  for (const field of DEP_FIELDS) {
    const fromManifest = manifest[field] ?? {}
    const fromLock = rootEntry[field] ?? {}
    for (const [name, spec] of Object.entries(fromManifest)) {
      if (!(name in fromLock)) {
        problem(`${name} package.json'da var, kilidin kok girdisinde yok`, `${field}: "${spec}"`)
      } else if (fromLock[name] !== spec) {
        problem(`${name} surum araligi uyusmuyor`, `package.json: "${spec}" · kilit: "${fromLock[name]}"`)
      }
    }
    for (const name of Object.keys(fromLock)) {
      if (!(name in fromManifest)) {
        problem(`${name} kilidin kok girdisinde var, package.json'da yok`, field)
      }
    }
  }

  // ── 2. Kilitteki her bagimlilik kenari kilit icinde cozulebiliyor mu? ──────
  // CI'i dusuren kontrol bu: kilit puppeteer'i tutuyordu ama onun
  // devtools-protocol bagimliligini tutmuyordu.
  let edgeCount = 0
  for (const [loc, entry] of Object.entries(packages)) {
    // Symlink girdileri (workspace linkleri) bagimliliklarini hedef girdide
    // tasir; burada tekrar dogrulamak cift sayim olur.
    if (entry.link === true) continue

    for (const dep of edgesOf(entry)) {
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
