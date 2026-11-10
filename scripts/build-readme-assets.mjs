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

// Sıra ve Türkçe adlar Storybook'un araç çubuğuyla aynı (storybook/.storybook/palettes.ts);
// kullanım cümleleri guides/00-brand-identity.md § 2. tokens.ts'e yeni palet
// eklenirse burada adı yoksa kod adıyla, listenin sonunda çizilir (görsel eksik kalmaz).
const PALETTE_COPY = {
  signature: { title: 'Signature', use: 'Araç, finans, editoryal' },
  cobalt: { title: 'Kobalt', use: 'SaaS, pano' },
  violet: { title: 'Menekşe', use: 'Yaratıcı araç, yapay zekâ' },
  rose: { title: 'Gül', use: 'Tüketici, sosyal' },
  ruby: { title: 'Yakut', use: 'Medya, spor' },
  tangerine: { title: 'Mandalina', use: 'Yemek, alışveriş' },
  jade: { title: 'Yeşim', use: 'Finans, sağlık' },
  verdant: { title: 'Zümrüt', use: 'Sağlık, terapi, doğa' },
  ember: { title: 'Kehribar', use: 'Oyun, topluluk' },
  iris: { title: 'İris', use: 'Yapay zekâ, yaratıcı ürün' },
}
const PALETTE_ORDER = [
  ...Object.keys(PALETTE_COPY).filter((name) => name in palettes),
  ...Object.keys(palettes).filter((name) => !(name in PALETTE_COPY)),
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n1 = (v) => Number(v.toFixed(1))

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

// Ortak çerçeve: sayfa zemini, 28 px köşe, kıl kenar. Dört görsel aynı kabukta.
const R = 28
function frame(W, H, r, inner) {
  return `<rect width="${W}" height="${H}" rx="${R}" fill="${r.pageBg}"/>
${inner}
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${R - 0.5}" fill="none" ${stroke(r.line)}/>`
}

// Marka işareti: degrade karo + kısalarak solan üç çubuk (Storybook kabuğu ve kapakla aynı).
function mark(x, y, size, fillId) {
  const u = size / 64
  const bar = (i, w, o) =>
    `<rect x="${n1(16 * u)}" y="${n1((18 + i * 11) * u)}" width="${n1(w * u)}" height="${n1(7 * u)}" rx="${n1(3.5 * u)}" fill="#fff" fill-opacity="${o}"/>`
  return `<g transform="translate(${x} ${y})"><rect width="${size}" height="${size}" rx="${n1(16 * u)}" fill="url(#${fillId})"/>${bar(0, 32, 0.95)}${bar(1, 24, 0.75)}${bar(2, 16, 0.55)}</g>`
}

// ── Afiş ────────────────────────────────────────────────────────────────
// Sol: işaret, ad, tek cümle. Sağ: paletlerin numune yelpazesi (boya
// kartelası): tokens.ts'teki BÜTÜN paletler, sayısı kaç olursa olsun sığar.
function banner(theme) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const W = 1280
  const H = 400
  const PAD = 88
  const stack = ['Next 16', 'React 19', 'Tailwind v4', 'motion', 'Drizzle', 'Neon', 'Auth.js v5']

  // Numuneler: sağ kenara yaslı; ilk numune (varsayılan palet) bir basamak yukarıda.
  const AREA = 520
  const GAP = 10
  const count = PALETTE_ORDER.length
  const cw = Math.min(46, (AREA - GAP * (count - 1)) / count)
  const total = count * cw + (count - 1) * GAP
  const x0 = W - PAD - total
  const chipTop = 92
  const chipH = 216
  const chips = PALETTE_ORDER.map((name, i) => {
    const x = n1(x0 + i * (cw + GAP))
    const y = i === 0 ? chipTop - 18 : chipTop
    return `<g transform="translate(${x} ${y})">
  <rect width="${n1(cw)}" height="${chipH}" rx="${n1(cw / 3.2)}" fill="url(#chip-${name})"/>
  <rect x="0.5" y="0.5" width="${n1(cw - 1)}" height="${chipH - 1}" rx="${n1(cw / 3.2)}" fill="none" stroke="#fff" stroke-opacity="${theme === 'dark' ? 0.14 : 0.28}"/>
  <circle cx="${n1(cw / 2)}" cy="${n1(cw / 2)}" r="${n1(cw / 9)}" fill="${r.pageBg}"/>
</g>`
  }).join('\n')

  // Nokta ızgarası: sağ üstten sola doğru söner (maske), numunelerin arkasında.
  const dots = `<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" ${paint(r.lineStrong)}/></pattern>
<linearGradient id="fade" x1="1" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="fade-mask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="dev-starter: Fikirden Canlıya, Aynı Kimlikle. ${count} palet, tek token mimarisi.">
<defs>
${gradient('display', p.displayGradient)}
${gradient('brand', p.brandGradient)}
${PALETTE_ORDER.map((name) => gradient(`chip-${name}`, palettes[name][theme].brandGradient)).join('\n')}
${dots}
<radialGradient id="glow" cx="0.86" cy="0.1" r="0.7"><stop offset="0" stop-color="${p.primary}" stop-opacity="${theme === 'dark' ? 0.2 : 0.1}"/><stop offset="1" stop-color="${p.primary}" stop-opacity="0"/></radialGradient>
<clipPath id="card"><rect width="${W}" height="${H}" rx="${R}"/></clipPath>
</defs>
${frame(
  W,
  H,
  r,
  `<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#fade-mask)"/>
</g>
${mark(PAD, 84, 56, 'brand')}
<text x="${PAD + 74}" y="126" font-family="${FONT}" font-size="46" font-weight="800" letter-spacing="-1.7" fill="${r.textStrong}">dev-starter</text>
<text x="${PAD}" y="222" font-family="${FONT}" font-size="40" font-weight="800" letter-spacing="-1.5" fill="url(#display)">Fikirden Canlıya,</text>
<text x="${PAD}" y="268" font-family="${FONT}" font-size="40" font-weight="800" letter-spacing="-1.5" fill="${r.textStrong}">Aynı Kimlikle</text>
<text x="${PAD}" y="316" font-family="${MONO}" font-size="13" fill="${r.textMuted}">${esc(stack.join('  ·  '))}</text>
${chips}
<text x="${W - PAD}" y="${chipTop + chipH + 30}" text-anchor="end" font-family="${MONO}" font-size="13" fill="${r.textMuted}">${count} palet  ·  açık + koyu  ·  tek token mimarisi</text>`,
)}
</svg>
`
}

// ── Palet kartları ─────────────────────────────────────────────────────
// Beşli sıralar: palet sayısı artınca yeni satır açılır, kart taşmaz
// (dört palet için yazılmış eski tek sıra on palette tuvalden taşıyordu).
function paletteBoard(theme) {
  const r = roles[theme]
  const names = PALETTE_ORDER
  const W = 1280
  const PAD = 32
  const GAP = 14
  const COLS = 5
  const CARD_W = (W - PAD * 2 - GAP * (COLS - 1)) / COLS
  const CARD_H = 266
  const rows = Math.ceil(names.length / COLS)
  const H = PAD * 2 + rows * CARD_H + (rows - 1) * GAP
  const IN = 20
  const SW = (CARD_W - IN * 2 - 3 * 8) / 4

  const cards = names
    .map((name, i) => {
      const c = palettes[name][theme]
      const copy = PALETTE_COPY[name] ?? { title: name, use: '' }
      const x = PAD + (i % COLS) * (CARD_W + GAP)
      const y = PAD + Math.floor(i / COLS) * (CARD_H + GAP)
      const swatches = [
        ['primary', c.primary],
        ['hover', c.primaryHover],
        ['soft', c.primarySoft],
        ['ink', c.primaryInk],
      ]
        .map(
          ([label, color], j) =>
            `<g transform="translate(${n1(IN + j * (SW + 8))} 136)"><rect width="${n1(SW)}" height="40" rx="10" fill="${color}"/><text y="56" font-family="${MONO}" font-size="9.5" fill="${r.textMuted}">${label}</text></g>`,
        )
        .join('')
      return `<g transform="translate(${n1(x)} ${y})">
  <defs>${gradient(`d-${name}`, c.displayGradient)}${gradient(`b-${name}`, c.brandGradient)}${gradient(`c-${name}`, c.ctaGradient ?? c.brandGradient)}</defs>
  <rect width="${n1(CARD_W)}" height="${CARD_H}" rx="20" ${paint(r.surface)}/>
  ${mark(IN, IN, 34, `b-${name}`)}
  <text x="${IN + 46}" y="${IN + 15}" font-family="${FONT}" font-size="16" font-weight="700" letter-spacing="-0.2" fill="${r.textStrong}">${esc(copy.title)}</text>
  <text x="${IN + 46}" y="${IN + 31}" font-family="${MONO}" font-size="10.5" fill="${r.textMuted}">${esc(name)}</text>
  <text x="${IN}" y="112" font-family="${FONT}" font-size="42" font-weight="800" letter-spacing="-1.6" fill="url(#d-${name})">Başlık</text>
  ${swatches}
  <g transform="translate(${IN} 208)"><rect width="92" height="34" rx="10" fill="url(#c-${name})"/><text x="46" y="22" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600" fill="#fff">Başla</text></g>
  <g transform="translate(${IN + 100} 208)"><rect width="${n1(CARD_W - IN * 2 - 100)}" height="34" rx="17" ${paint(c.primaryWash)}/><text x="${n1((CARD_W - IN * 2 - 100) / 2)}" y="22" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" fill="${c.primaryInk}">${esc(copy.use.split(',')[0])}</text></g>
</g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${names.length} palet: ${esc(names.join(', '))}. ${theme === 'dark' ? 'Koyu' : 'Açık'} tema.">
${frame(W, H, r, cards)}
</svg>
`
}

// ── Hareket eğrisi ─────────────────────────────────────────────────────
function motionBoard(theme) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const [x1, y1, x2, y2] = motion.ease
  const W = 1280
  const H = 380
  const S = 232 // eğri kutusu
  const ox = 72
  const oy = 56
  const pt = (x, y) => `${(ox + x * S).toFixed(1)} ${(oy + S - y * S).toFixed(1)}`
  const curve = `M ${pt(0, 0)} C ${pt(x1, y1)} ${pt(x2, y2)} ${pt(1, 1)}`
  const linear = `M ${pt(0, 0)} L ${pt(1, 1)}`
  const quarters = [0.25, 0.5, 0.75]
    .map((q) => `<line x1="${n1(ox + q * S)}" y1="${oy}" x2="${n1(ox + q * S)}" y2="${oy + S}"/><line x1="${ox}" y1="${n1(oy + q * S)}" x2="${ox + S}" y2="${n1(oy + q * S)}"/>`)
    .join('')

  // Süreler ortak bir zaman ekseninde: çubuğun boyu milisaniyenin kendisi.
  const durs = Object.entries(motion.dur)
  const max = Math.max(...durs.map(([, v]) => v))
  const usage = { fast: 'Hover, odak, mikro geri bildirim', base: 'Panel, menü, sekme geçişi', slow: 'Bölüm girişi, Reveal', page: 'Sayfa ve sahne geçişi' }
  const bx = 396
  const BW = 500
  const ROW = 62
  const axisY = oy + durs.length * ROW + 6
  const step = max <= 0.6 ? 0.1 : 0.2
  const axis = Array.from({ length: Math.floor(max / step + 1e-9) + 1 }, (_, i) => i * step)
    .map((t) => {
      const x = n1(bx + (t / max) * BW)
      return `<line x1="${x}" y1="${oy - 8}" x2="${x}" y2="${axisY}" ${stroke(r.lineSoft)}/><text x="${x}" y="${axisY + 20}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${r.textMuted}">${Math.round(t * 1000)}</text>`
    })
    .join('')
  const bars = durs
    .map(([name, v], i) => {
      const y = oy + i * ROW
      const w = (v / max) * BW
      return `<g transform="translate(${bx} ${y})">
  <text y="12" font-family="${MONO}" font-size="13" fill="${r.textStrong}">DUR.${name}</text>
  <text x="${BW}" y="12" font-family="${MONO}" font-size="13" text-anchor="end" fill="${r.textMuted}">${Math.round(v * 1000)} ms</text>
  <rect y="24" width="${BW}" height="14" rx="7" ${paint(r.surfaceRaised)}/>
  <rect y="24" width="${w.toFixed(1)}" height="14" rx="7" fill="${p.primary}"/>
  <text x="${BW + 28}" y="36" font-family="${FONT}" font-size="13.5" fill="${r.textBody}">${esc(usage[name] ?? '')}</text>
</g>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Marka eğrisi cubic-bezier(${motion.ease.join(', ')}) ve süre tablosu: ${esc(durs.map(([k, v]) => `${k} ${Math.round(v * 1000)} ms`).join(', '))}">
${frame(
  W,
  H,
  r,
  `<rect x="${ox}" y="${oy}" width="${S}" height="${S}" rx="14" ${paint(r.surface)}/>
<g ${stroke(r.lineSoft)}>${quarters}</g>
<path d="${linear}" fill="none" ${stroke(r.lineStrong)} stroke-dasharray="3 6" stroke-width="1.5" stroke-linecap="round"/>
<line x1="${ox}" y1="${oy + S}" x2="${(ox + x1 * S).toFixed(1)}" y2="${(oy + S - y1 * S).toFixed(1)}" ${stroke(r.lineStrong)} stroke-width="1.5"/>
<line x1="${ox + S}" y1="${oy}" x2="${(ox + x2 * S).toFixed(1)}" y2="${(oy + S - y2 * S).toFixed(1)}" ${stroke(r.lineStrong)} stroke-width="1.5"/>
<path d="${curve}" fill="none" stroke="${p.primary}" stroke-width="4" stroke-linecap="round"/>
<circle cx="${(ox + x1 * S).toFixed(1)}" cy="${(oy + S - y1 * S).toFixed(1)}" r="6" fill="${r.pageBg}" stroke="${p.primary}" stroke-width="2.5"/>
<circle cx="${(ox + x2 * S).toFixed(1)}" cy="${(oy + S - y2 * S).toFixed(1)}" r="6" fill="${r.pageBg}" stroke="${p.primary}" stroke-width="2.5"/>
<circle cx="${ox}" cy="${oy + S}" r="4.5" fill="${p.primary}"/>
<circle cx="${ox + S}" cy="${oy}" r="4.5" fill="${p.primary}"/>
<text x="${ox}" y="${oy + S + 30}" font-family="${MONO}" font-size="13" fill="${r.textStrong}">cubic-bezier(${motion.ease.join(', ')})</text>
<text x="${ox}" y="${oy + S + 50}" font-family="${FONT}" font-size="13" fill="${r.textMuted}">Tek eğri  ·  --ease-brand  ·  EASE</text>
${axis}
<text x="${bx + BW + 28}" y="${axisY + 20}" font-family="${MONO}" font-size="11" fill="${r.textMuted}">ms</text>
${bars}`,
)}
</svg>
`
}

// ── Sayaç şeridi ───────────────────────────────────────────────────────
// Sayılar DEPODAN sayılır: README'de elle yazılmış sayı bayatlıyordu ve
// GitHub tablo genişliğini uygulamadığı için iki kelimelik etiketler
// ("Kayıtlı Agent") satıra kırılıp rakamları aynı hizadan çıkarıyordu
// (3 Ekim 2026). SVG'de hizayı biz kuruyoruz; rakamlar tek taban çizgisinde.
// `source`: sayının sayıldığı yer, görselde künye olarak yazılır.
async function countRepo() {
  const list = async (dir, re) => (await readdir(join(ROOT, dir))).filter((f) => re.test(f)).length
  const mistakes = (await readFile(join(ROOT, 'knowledge/mistakes.md'), 'utf8')).match(/^### \d+\./gm)?.length ?? 0
  return [
    { value: await list('guides', /^\d{2}-.*\.md$/), label: 'Rehber', source: 'guides/' },
    { value: await list('snippets/ui', /\.tsx$/), label: 'Bileşen', source: 'snippets/ui/' },
    { value: await list('.claude/agents', /\.md$/), label: 'Kayıtlı Agent', source: '.claude/agents/' },
    { value: await list('.claude/commands', /\.md$/), label: 'Komut', source: '.claude/commands/' },
    { value: mistakes, label: 'Kayıtlı Hata', source: 'knowledge/mistakes.md' },
  ]
}

// Defter satırı: tek kabuk, sütunlar kıl çizgiyle ayrılır (beş ayrı kart değil).
function statsBoard(theme, stats) {
  const r = roles[theme]
  const p = palettes.signature[theme]
  const W = 1280
  const H = 212
  const PAD = 40
  const COL = (W - PAD * 2) / stats.length
  const cols = stats
    .map(({ value, label, source }, i) => {
      const x = PAD + i * COL
      return `<g transform="translate(${n1(x)} 0)">
  ${i ? `<line x1="0" y1="40" x2="0" y2="${H - 40}" ${stroke(r.line)}/>` : ''}
  <text x="${i ? 28 : 8}" y="108" font-family="${FONT}" font-size="76" font-weight="800" letter-spacing="-3.4" fill="url(#stat-ink)">${value}</text>
  <text x="${i ? 30 : 10}" y="144" font-family="${FONT}" font-size="18" font-weight="650" fill="${r.textStrong}">${esc(label)}</text>
  <text x="${i ? 30 : 10}" y="168" font-family="${MONO}" font-size="12" fill="${r.textMuted}">${esc(source)}</text>
</g>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(stats.map((s) => `${s.value} ${s.label}`).join(', '))}">
<defs>${gradient('stat-ink', p.displayGradientTight)}</defs>
${frame(W, H, r, `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${R - 8}" ${paint(r.surface)}/>\n${cols}`)}
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
