#!/usr/bin/env node
/**
 * Package Export Verification
 *
 * Her workspace paketinin package.json'da VAAT ETTİĞİ giriş noktalarının
 * gerçekten var olduğunu ve yüklenebildiğini doğrular.
 *
 * Neden var: @ahmetakyapi/theme npm'de 5 ay boyunca kırık durdu — build
 * `dist/tokens.*` üretiyordu ama manifest `dist/index.*` işaret ediyordu.
 * Build başarılıydı, CI de `dist/tokens.js`'i doğruluyordu; yani ikisi de
 * manifest'e hiç bakmadı. Artefaktı değil, manifest'in vaadini doğrula.
 * Bkz. knowledge/mistakes.md #48
 *
 * Kullanım:
 *   node scripts/verify-package-exports.mjs
 *   npm run verify:exports
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PACKAGES = ['packages/@ahmet/theme', 'packages/@ahmet/ui']

/** exports alanındaki tüm string hedefleri topla (iç içe koşullar dahil) */
function collectExportTargets(exportsField, acc = []) {
  if (typeof exportsField === 'string') {
    acc.push(exportsField)
  } else if (exportsField && typeof exportsField === 'object') {
    for (const value of Object.values(exportsField)) collectExportTargets(value, acc)
  }
  return acc
}

let failures = 0
const fail = (msg) => {
  failures++
  console.error(`  ❌ ${msg}`)
}
const pass = (msg) => console.log(`  ✅ ${msg}`)

for (const pkgDir of PACKAGES) {
  const manifestPath = join(pkgDir, 'package.json')
  if (!existsSync(manifestPath)) {
    fail(`${manifestPath} bulunamadı`)
    continue
  }

  const pkg = JSON.parse(await readFile(manifestPath, 'utf8'))
  console.log(`\n━━━ ${pkg.name}@${pkg.version} ━━━`)

  // 1. main / module / types dosyaları var mı?
  for (const field of ['main', 'module', 'types']) {
    const target = pkg[field]
    if (!target) continue
    if (existsSync(resolve(pkgDir, target))) pass(`${field} → ${target}`)
    else fail(`${pkg.name}: "${field}" → ${target} YOK (build çıktısıyla uyuşmuyor)`)
  }

  // 2. exports alanındaki her hedef var mı?
  for (const target of collectExportTargets(pkg.exports)) {
    if (!target.startsWith('.')) continue
    if (existsSync(resolve(pkgDir, target))) pass(`exports → ${target}`)
    else fail(`${pkg.name}: exports → ${target} YOK`)
  }

  // 3. files listesindeki girdiler var mı? (npm pack'e ne gireceği)
  for (const entry of pkg.files ?? []) {
    if (existsSync(resolve(pkgDir, entry))) pass(`files → ${entry}`)
    else fail(`${pkg.name}: files → ${entry} YOK (tarball'da eksik olacak)`)
  }

  // 4. Giriş noktaları gerçekten yükleniyor mu? — dosya var ama bozuk olabilir
  if (pkg.main) {
    try {
      const require = createRequire(import.meta.url)
      const mod = require(resolve(pkgDir, pkg.main))
      pass(`CJS yüklendi — ${Object.keys(mod).length} export`)
    } catch (err) {
      fail(`${pkg.name}: CJS girişi yüklenemedi — ${err.message}`)
    }
  }
  if (pkg.module) {
    try {
      const mod = await import(pathToFileURL(resolve(pkgDir, pkg.module)).href)
      pass(`ESM yüklendi — ${Object.keys(mod).length} export`)
    } catch (err) {
      fail(`${pkg.name}: ESM girişi yüklenemedi — ${err.message}`)
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (failures > 0) {
  console.error(`  SONUC: ${failures} hata — paketler yayına HAZIR DEĞİL`)
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  process.exit(1)
}
console.log('  SONUC: tum giris noktalari dogrulandi')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
