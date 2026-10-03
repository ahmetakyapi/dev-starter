#!/usr/bin/env node
// README görsellerini (afiş, palet kartları, hareket eğrisi) doğrudan
// packages/@ahmet/theme/tokens.ts'ten üretir. Elle çizilmiş bir palet görseli
// token değiştiğinde sessizce bayatlar; buradan üretilen görsel bayatlayamaz,
// çünkü `--check` CI'da üretilen ile depodakini karşılaştırır.
//
//   node scripts/build-readme-assets.mjs          # yaz
//   node scripts/build-readme-assets.mjs --check  # farklıysa çık(1)
//
// Node 24 TypeScript'i tip silerek doğrudan yükler; ek araç gerekmez.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palettes, roles, motion } from '../packages/@ahmet/theme/tokens.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '.github', 'readme')
const CHECK = process.argv.includes('--check')

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
const THEMES = ['light', 'dark']

const PALETTE_COPY = {
  signature: { title: 'Signature', use: 'İmza · araç, finans, editoryal' },
  verdant: { title: 'Verdant', use: 'Sağlık, terapi, doğa' },
  ember: { title: 'Ember', use: 'Oyun, topluluk, eğlence' },
  iris: { title: 'Iris', use: 'Yaratıcı ürünler, yapay zekâ' },
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// CSS `linear-gradient(112deg, #a 0%, #b 100%)` → SVG <linearGradient>.
// CSS açısı 0deg = yukarı, 90deg = sağa; objectBoundingBox içinde merkezden
// o yöne bir doğru çizilir.
function gradient(id, css) {
  const angle = Number(/(-?\d+(?:\.\d+)?)deg/.exec(css)?.[1] ?? 180)
  const rad = (angle * Math.PI) / 180
  const dx = Math.sin(rad) / 2
  const dy = -Math.cos(rad) / 2
  const stops = [...css.matchAll(/(#[0-9a-f]{3,8})\s+(\d+(?:\.\d+)?)%/gi)]
    .map(([, color, at]) => `<stop offset="${at}%" stop-color="${color}"/>`)
    .join('')
  const f = (n) => n.toFixed(3)
  return `<linearGradient id="${id}" x1="${f(0.5 - dx)}" y1="${f(0.5 - dy)}" x2="${f(0.5 + dx)}" y2="${f(0.5 + dy)}">${stops}</linearGradient>`
}

// "rgb(13 116 196 / 0.1)" → fill + fill-opacity; hex olduğu gibi.
function paint(value) {
  const m = /rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)/.exec(value)
  if (!m) return `fill="${value}"`
  return `fill="rgb(${m[1]},${m[2]},${m[3]})" fill-opacity="${m[4]}"`
}

function stroke(value) {
  const m = /rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)/.exec(value)
  if (!m) return `stroke="${value}"`
  return `stroke="rgb(${m[1]},${m[2]},${m[3]})" stroke-opacity="${m[4]}"`
}

// ── Afiş ────────────────────────────────────────────────────────────────
function banner(theme) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const W = 1280
  const H = 360
  const stack = ['Next 16', 'React 19', 'Tailwind v4', 'motion', 'Drizzle', 'Neon', 'Auth.js v5']
  let x = 96
  const chips = stack
    .map((label) => {
      const w = label.length * 8.6 + 28
      const chip = `<g transform="translate(${x} 262)"><rect width="${w}" height="32" rx="16" ${paint(r.surfaceRaised)}/><text x="${w / 2}" y="21" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${r.textBody}">${esc(label)}</text></g>`
      x += w + 10
      return chip
    })
    .join('')
  const dots = Object.keys(palettes)
    .map((name, i) => {
      const c = palettes[name][theme]
      return `<g transform="translate(${1000 + i * 52} 284)"><circle r="16" fill="${c.primary}"/><circle r="16" fill="none" ${stroke(r.lineStrong)}/></g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="dev-starter — Ahmet Akyapı ekosisteminin başlangıç kiti">
<defs>
${gradient('display', p.displayGradient)}
${gradient('brand', p.brandGradient)}
<radialGradient id="glow" cx="0.92" cy="0.05" r="0.75"><stop offset="0" stop-color="${p.primary}" stop-opacity="${theme === 'dark' ? 0.22 : 0.12}"/><stop offset="1" stop-color="${p.primary}" stop-opacity="0"/></radialGradient>
<clipPath id="card"><rect width="${W}" height="${H}" rx="28"/></clipPath>
</defs>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="${r.pageBg}"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<g ${stroke(r.lineSoft)} stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<line x1="${(i + 1) * 106}" y1="0" x2="${(i + 1) * 106}" y2="${H}"/>`).join('')}</g>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="28" fill="none" ${stroke(r.line)}/>
<g transform="translate(96 72)">
  <rect width="64" height="64" rx="16" fill="url(#brand)"/>
  <rect x="16" y="18" width="32" height="7" rx="3.5" fill="#fff" fill-opacity="0.95"/>
  <rect x="16" y="29" width="24" height="7" rx="3.5" fill="#fff" fill-opacity="0.75"/>
  <rect x="16" y="40" width="16" height="7" rx="3.5" fill="#fff" fill-opacity="0.55"/>
</g>
<text x="184" y="124" font-family="${FONT}" font-size="64" font-weight="800" letter-spacing="-2.4" fill="url(#display)">dev-starter</text>
<text x="96" y="204" font-family="${FONT}" font-size="26" font-weight="600" fill="${r.textStrong}">Fikirden Canlıya, Aynı Kimlikle</text>
<text x="96" y="236" font-family="${FONT}" font-size="17" fill="${r.textBody}">Şablonlar, token sistemi, bileşenler, rehberler ve ajanlar · Ahmet Akyapı ekosistemi</text>
${chips}
${dots}
</svg>
`
}

// ── Palet kartları ─────────────────────────────────────────────────────
function paletteBoard(theme) {
  const r = roles[theme]
  const names = Object.keys(palettes)
  const W = 1280
  const CARD_W = 290
  const GAP = 16
  const PAD = (W - names.length * CARD_W - (names.length - 1) * GAP) / 2
  const H = 430

  const cards = names
    .map((name, i) => {
      const c = palettes[name][theme]
      const copy = PALETTE_COPY[name] ?? { title: name, use: '' }
      const x = PAD + i * (CARD_W + GAP)
      const swatches = [
        ['primary', c.primary],
        ['hover', c.primaryHover],
        ['soft', c.primarySoft],
        ['ink', c.primaryInk],
      ]
        .map(
          ([label, color], j) =>
            `<g transform="translate(${24 + j * 62} 196)"><rect width="52" height="52" rx="12" fill="${color}"/><text y="70" font-family="${MONO}" font-size="10.5" fill="${r.textMuted}">${label}</text><text y="84" font-family="${MONO}" font-size="10.5" fill="${r.textBody}">${esc(color)}</text></g>`,
        )
        .join('')
      return `<g transform="translate(${x} 32)">
  <defs>${gradient(`d-${name}`, c.displayGradient)}${gradient(`b-${name}`, c.brandGradient)}</defs>
  <rect width="${CARD_W}" height="${H - 64}" rx="20" ${paint(r.surface)}/>
  <rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${H - 65}" rx="20" fill="none" ${stroke(r.line)}/>
  <rect x="24" y="24" width="40" height="40" rx="11" fill="url(#b-${name})"/>
  <text x="78" y="42" font-family="${FONT}" font-size="18" font-weight="700" fill="${r.textStrong}">${esc(copy.title)}</text>
  <text x="78" y="61" font-family="${FONT}" font-size="12.5" fill="${r.textMuted}">${esc(copy.use)}</text>
  <text x="24" y="140" font-family="${FONT}" font-size="50" font-weight="800" letter-spacing="-1.6" fill="url(#d-${name})">Aa Başlık</text>
  <text x="24" y="170" font-family="${FONT}" font-size="12.5" fill="${r.textBody}">.display-ink · yalnız kısa başlıkta</text>
  ${swatches}
  <g transform="translate(24 312)"><rect width="104" height="36" rx="10" fill="${c.primary}"/><text x="52" y="23" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="${c.onPrimary}">Hemen Başla</text></g>
  <g transform="translate(140 312)"><rect width="126" height="36" rx="18" ${paint(c.primaryWash)}/><text x="63" y="23" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600" fill="${c.primaryInk}">Rozet · Etiket</text></g>
</g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dört palet: signature, verdant, ember, iris — ${theme === 'dark' ? 'koyu' : 'açık'} tema">
<rect width="${W}" height="${H}" rx="28" fill="${r.pageBg}"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="28" fill="none" ${stroke(r.line)}/>
${cards}
</svg>
`
}

// ── Hareket eğrisi ─────────────────────────────────────────────────────
function motionBoard(theme) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const [x1, y1, x2, y2] = motion.ease
  const W = 1280
  const H = 340
  const S = 220 // eğri kutusu
  const ox = 96
  const oy = 60
  const pt = (x, y) => `${(ox + x * S).toFixed(1)} ${(oy + S - y * S).toFixed(1)}`
  const curve = `M ${pt(0, 0)} C ${pt(x1, y1)} ${pt(x2, y2)} ${pt(1, 1)}`
  const linear = `M ${pt(0, 0)} L ${pt(1, 1)}`

  const durs = Object.entries(motion.dur)
  const max = Math.max(...durs.map(([, v]) => v))
  const usage = { fast: 'Hover, odak, mikro geri bildirim', base: 'Panel, menü, sekme geçişi', slow: 'Bölüm girişi, Reveal', page: 'Sayfa ve sahne geçişi' }
  const bars = durs
    .map(([name, v], i) => {
      const y = 72 + i * 56
      const w = (v / max) * 560
      return `<g transform="translate(470 ${y})">
  <text font-family="${MONO}" font-size="13" fill="${r.textMuted}">DUR.${name}</text>
  <text x="560" font-family="${MONO}" font-size="13" text-anchor="end" fill="${r.textStrong}">${Math.round(v * 1000)} ms</text>
  <rect y="10" width="560" height="10" rx="5" ${paint(r.surfaceRaised)}/>
  <rect y="10" width="${w.toFixed(1)}" height="10" rx="5" fill="url(#bar)"/>
  <text x="580" y="20" font-family="${FONT}" font-size="13" fill="${r.textBody}">${esc(usage[name] ?? '')}</text>
</g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Marka eğrisi cubic-bezier(${motion.ease.join(', ')}) ve süre tablosu">
<defs>${gradient('bar', p.displayGradientTight)}</defs>
<rect width="${W}" height="${H}" rx="28" fill="${r.pageBg}"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="28" fill="none" ${stroke(r.line)}/>
<rect x="${ox}" y="${oy}" width="${S}" height="${S}" rx="6" ${paint(r.surface)} ${stroke(r.lineSoft)}/>
<path d="${linear}" fill="none" ${stroke(r.lineStrong)} stroke-dasharray="4 6" stroke-width="1.5"/>
<line x1="${ox}" y1="${oy + S}" x2="${(ox + x1 * S).toFixed(1)}" y2="${(oy + S - y1 * S).toFixed(1)}" ${stroke(r.lineStrong)}/>
<line x1="${ox + S}" y1="${oy}" x2="${(ox + x2 * S).toFixed(1)}" y2="${(oy + S - y2 * S).toFixed(1)}" ${stroke(r.lineStrong)}/>
<circle cx="${(ox + x1 * S).toFixed(1)}" cy="${(oy + S - y1 * S).toFixed(1)}" r="5" fill="${p.primary}"/>
<circle cx="${(ox + x2 * S).toFixed(1)}" cy="${(oy + S - y2 * S).toFixed(1)}" r="5" fill="${p.primary}"/>
<path d="${curve}" fill="none" stroke="${p.primary}" stroke-width="3.5" stroke-linecap="round"/>
<text x="${ox}" y="${oy + S + 32}" font-family="${MONO}" font-size="13" fill="${r.textStrong}">cubic-bezier(${motion.ease.join(', ')})</text>
<text x="${ox}" y="${oy + S + 52}" font-family="${FONT}" font-size="12.5" fill="${r.textMuted}">Tek eğri · --ease-brand · EASE</text>
${bars}
</svg>
`
}

// ── Sayaç şeridi ───────────────────────────────────────────────────────
// Sayılar DEPODAN sayılır: README'de elle yazılmış sayı bayatlıyordu ve
// GitHub tablo genişliğini uygulamadığı için iki kelimelik etiketler
// ("Kayıtlı Ajan") satıra kırılıp rakamları aynı hizadan çıkarıyordu
// (3 Ekim 2026). SVG'de hizayı biz kuruyoruz; rakamlar tek taban çizgisinde.
async function countRepo() {
  const list = async (dir, re) => (await readdir(join(ROOT, dir))).filter((f) => re.test(f)).length
  const mistakes = (await readFile(join(ROOT, 'knowledge/mistakes.md'), 'utf8')).match(/^### \d+\./gm)?.length ?? 0
  return [
    { value: await list('guides', /^\d{2}-.*\.md$/), label: 'Rehber' },
    { value: await list('snippets/ui', /\.tsx$/), label: 'Bileşen' },
    { value: await list('.claude/agents', /\.md$/), label: 'Kayıtlı Ajan' },
    { value: await list('.claude/commands', /\.md$/), label: 'Komut' },
    { value: mistakes, label: 'Kayıtlı Hata' },
  ]
}

function statsBoard(theme, stats) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const W = 1280
  const H = 168
  const GAP = 16
  const CARD_W = (W - GAP * (stats.length - 1)) / stats.length
  const cards = stats
    .map(({ value, label }, i) => {
      const x = i * (CARD_W + GAP)
      return `<g transform="translate(${x.toFixed(1)} 0)">
  <rect x="0.5" y="0.5" width="${(CARD_W - 1).toFixed(1)}" height="${H - 1}" rx="20" fill="${r.pageBg}"/>
  <rect x="0.5" y="0.5" width="${(CARD_W - 1).toFixed(1)}" height="${H - 1}" rx="20" ${paint(r.surface)} ${stroke(r.line)}/>
  <text x="28" y="92" font-family="${FONT}" font-size="64" font-weight="800" letter-spacing="-2" fill="url(#stat-ink)">${value}</text>
  <text x="30" y="132" font-family="${FONT}" font-size="18" font-weight="600" fill="${r.textBody}">${esc(label)}</text>
</g>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(stats.map((s) => `${s.value} ${s.label}`).join(', '))}">
<defs>${gradient('stat-ink', p.displayGradientTight)}</defs>
${cards}
</svg>
`
}

const stats = await countRepo()
const files = {}
for (const t of THEMES) {
  files[`banner-${t}.svg`] = banner(t)
  files[`palettes-${t}.svg`] = paletteBoard(t)
  files[`motion-${t}.svg`] = motionBoard(t)
  files[`stats-${t}.svg`] = statsBoard(t, stats)
}

let stale = 0
if (!CHECK) await mkdir(OUT, { recursive: true })
for (const [name, svg] of Object.entries(files)) {
  const path = join(OUT, name)
  if (CHECK) {
    const current = await readFile(path, 'utf8').catch(() => '')
    if (current !== svg) {
      stale++
      console.error(`✗ ${name} token'larla uyuşmuyor`)
    }
  } else {
    await writeFile(path, svg)
    console.log(`✓ ${name}`)
  }
}
if (CHECK && stale) {
  console.error(`\n${stale} görsel bayat — npm run readme:assets çalıştırıp commit'le.`)
  process.exit(1)
}
if (CHECK) console.log('✓ README görselleri token\'larla güncel')
