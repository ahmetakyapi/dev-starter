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
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PACKAGES = ['packages/@ahmet/theme', 'packages/@ahmet/ui']

/**
 * Sunucu-güvenli girişler ve dışa aktarmak ZORUNDA oldukları adlar.
 * Ana giriş `'use client'` banner'lı tek bundle; oradan gelen değer Server
 * Component'te istemci referansıdır (`cn()` prerender'da kırılır, `DUR.fast`
 * sessizce `undefined`). Bu girişler banner taşımaz — bkz. mistakes.md #84.
 */
const SERVER_SAFE = {
  '@ahmetakyapi/ui': { './core': ['cn', 'EASE', 'DUR', 'SPRING', 'STAGGER', 'stagger', 'fadeUp', 'fadeIn'] },
}

/** src/ altında herhangi bir dosya `'use client'` ile başlıyor mu? */
async function sourceDeclaresUseClient(srcDir) {
  if (!existsSync(srcDir)) return false
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    const full = join(srcDir, entry.name)
    if (entry.isDirectory()) {
      if (await sourceDeclaresUseClient(full)) return true
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const first = (await readFile(full, 'utf8')).split('\n')[0].trim()
      if (/^['"]use client['"]/.test(first)) return true
    }
  }
  return false
}

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

  // 5. v3: animasyon `motion/react`ten gelir. Dist'te `framer-motion` importu
  //    kalırsa tüketici iki ayrı motion kopyası kurar ve LazyMotion bağlamı
  //    paylaşılmaz (paketin `m.*` bileşenleri animasyonsuz kalır).
  for (const field of ['main', 'module']) {
    const target = pkg[field]
    if (!target || !existsSync(resolve(pkgDir, target))) continue
    const code = await readFile(resolve(pkgDir, target), 'utf8')
    if (/from\s*['"]framer-motion['"]|require\(['"]framer-motion['"]\)/.test(code)) {
      fail(`${pkg.name}: ${target} hâlâ 'framer-motion' import ediyor — 'motion/react' kullan`)
    }
  }

  // 6. Kaynak 'use client' istiyorsa dist'in İLK satırında da olmalı.
  //    tsup bundle ederken direktifi düşürür; banner ile geri konmazsa paket
  //    App Router'da kırılır ve build + tsc + yükleme testleri bunu GÖREMEZ
  //    (yayındaki 2.1.0 tam olarak böyleydi — bkz. mistakes.md #52).
  if (await sourceDeclaresUseClient(resolve(pkgDir, 'src'))) {
    for (const field of ['main', 'module']) {
      const target = pkg[field]
      if (!target) continue
      const firstLine = (await readFile(resolve(pkgDir, target), 'utf8')).split('\n')[0]
      if (/^['"]use client['"]/.test(firstLine.trim())) {
        pass(`${field} ilk satırında 'use client' — App Router güvenli`)
      } else {
        fail(
          `${pkg.name}: kaynakta 'use client' var ama ${target} ilk satırında YOK ` +
            `(bulunan: ${JSON.stringify(firstLine.slice(0, 40))}) — App Router'da kırılır. ` +
            `tsup.config.ts'e banner ekle.`
        )
      }
    }
  }

  // 7. Sunucu-güvenli giriş: ilk satırda 'use client' OLMAMALI ve vaat
  //    edilen adlar gerçek değer olarak yüklenmeli. Biri tsup.config.ts'te
  //    banner'ı bu girişe de verirse ya da core.ts'ten bir ad düşerse burada
  //    kırılır; build, tsc ve yukarıdaki yükleme testleri bunu GÖREMEZ.
  for (const [subpath, names] of Object.entries(SERVER_SAFE[pkg.name] ?? {})) {
    const entry = pkg.exports?.[subpath]
    if (!entry || typeof entry !== 'object') {
      fail(`${pkg.name}: exports["${subpath}"] YOK — sunucu bileşeni sabitleri istemci referansı olarak alır`)
      continue
    }
    for (const cond of ['import', 'require']) {
      const target = entry[cond]
      if (!target || !existsSync(resolve(pkgDir, target))) continue
      const firstLine = (await readFile(resolve(pkgDir, target), 'utf8')).split('\n')[0]
      if (/^['"]use client['"]/.test(firstLine.trim())) {
        fail(`${pkg.name}: ${subpath} (${target}) 'use client' ile başlıyor — sunucuda değerler referansa döner (#84)`)
      } else {
        pass(`${subpath} ${cond} 'use client' taşımıyor — sunucu güvenli`)
      }
    }
    try {
      const esm = await import(pathToFileURL(resolve(pkgDir, entry.import)).href)
      const cjs = createRequire(import.meta.url)(resolve(pkgDir, entry.require))
      const missing = names.filter((n) => esm[n] === undefined || cjs[n] === undefined)
      if (missing.length > 0) fail(`${pkg.name}: ${subpath} şunları dışa aktarmıyor: ${missing.join(', ')}`)
      else if (esm.cn('p-2', 'p-4') !== 'p-4') fail(`${pkg.name}: ${subpath} cn() çakışan sınıfı birleştirmiyor`)
      else pass(`${subpath} yüklendi — ${names.length} zorunlu ad gerçek değer`)
    } catch (err) {
      fail(`${pkg.name}: ${subpath} yüklenemedi — ${err.message}`)
    }
  }

  // 8. Tailwind kaynak kaydı: v4 node_modules'u taramaz. `./source.css`
  //    vaat edilip içinde `@source` yoksa bileşen sınıfları tüketicide hiç
  //    derlenmez ve Button düz metin gibi çizilir; hiçbir build bunu görmez.
  if (pkg.exports?.['./source.css']) {
    const css = await readFile(resolve(pkgDir, pkg.exports['./source.css']), 'utf8').catch(() => '')
    if (/@source\s+["']\.\/dist["']/.test(css)) pass(`source.css dist'i Tailwind'e taratıyor`)
    else fail(`${pkg.name}: source.css içinde @source "./dist" YOK — bileşen sınıfları derlenmez`)
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
