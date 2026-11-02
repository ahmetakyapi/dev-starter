/**
 * scripts/add-ui.mjs davranış testi: geçici bir "proje"ye kurulum.
 *
 * Kurulum aracının asıl vaadi kopyalamak değil, YANLIŞ şey yapmamak: eksik
 * bağımlılık bırakmamak, kullanıcının dosyasını ezmemek, gereken paketi ve
 * CSS satırını söylemek. Her biri burada başarısız olması gereken durumla
 * birlikte sınanır.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collectClosure, parseImports, readCatalog } from '../scripts/lib/ui-graph.mjs'

const REPO = fileURLToPath(new URL('..', import.meta.url))
const SCRIPT = join(REPO, 'scripts', 'add-ui.mjs')
const src = (rel: string) => readFileSync(join(REPO, rel), 'utf8')

let dir = ''

/** Şablon düzeninde en küçük proje: package.json, tsconfig `@/*`, globals.css, LazyMotion'lı layout. */
function makeProject(opts: { srcDir?: boolean; deps?: Record<string, string> } = {}) {
  dir = mkdtempSync(join(tmpdir(), 'add-ui-'))
  const base = opts.srcDir ? join(dir, 'src') : dir
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'deneme', dependencies: { next: '16.3.8', react: '19.2.4', ...opts.deps } }),
  )
  // Yorumlu tsconfig (JSONC) ve include'daki yıldız-eğik-yıldız: okuyucu bunlara takılmamalı
  writeFileSync(
    join(dir, 'tsconfig.json'),
    `{
  // Next tsconfig'i
  "compilerOptions": { "paths": { "@/*": ["./${opts.srcDir ? 'src/' : ''}*"] }, },
  "include": ["**/*.ts", "**/*.tsx"]
}`,
  )
  mkdirSync(join(base, 'app'), { recursive: true })
  copyFileSync(join(REPO, 'templates/landing/app/globals.css'), join(base, 'app/globals.css'))
  writeFileSync(join(base, 'app/layout.tsx'), 'import { LazyMotion, domAnimation } from "motion/react";\n')
  return base
}

function run(...args: string[]) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

beforeEach(() => {
  dir = ''
})
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('add-ui: kurulum', () => {
  it('bileşeni ve TRANSİTİF bağımlılığını kaynakla birebir kopyalar', () => {
    const base = makeProject()
    const r = run(dir, 'stage-bars')
    expect(r.code).toBe(0)
    expect(readFileSync(join(base, 'components/ui/stage-bars.tsx'), 'utf8')).toBe(src('snippets/ui/stage-bars.tsx'))
    // stage-bars → @/components/ui/chart-card
    expect(readFileSync(join(base, 'components/ui/chart-card.tsx'), 'utf8')).toBe(src('snippets/ui/chart-card.tsx'))
    // @/lib/utils hedefte yoktu → şablondan
    expect(readFileSync(join(base, 'lib/utils.ts'), 'utf8')).toBe(src('templates/landing/lib/utils.ts'))
  })

  it('zincirin her halkasını çözer (date-picker → date-calendar + popover → Base UI)', () => {
    const base = makeProject()
    const r = run(dir, 'date-picker')
    expect(r.code).toBe(0)
    for (const f of ['date-picker', 'date-calendar', 'popover']) expect(existsSync(join(base, `components/ui/${f}.tsx`))).toBe(true)
    // npm: Base UI eksik, sürüm şablon/storybook'tan; next ve react zaten var
    expect(r.out).toMatch(/npm install @base-ui\/react@\S*\d/)
    expect(r.out).toMatch(/react\s+var/)
  })

  it('tsconfig "@/*" → "./src/*" ise src/ altına kurar', () => {
    const base = makeProject({ srcDir: true })
    expect(run(dir, 'kbd').code).toBe(0)
    expect(existsSync(join(base, 'components/ui/kbd.tsx'))).toBe(true)
    expect(existsSync(join(dir, 'components/ui/kbd.tsx'))).toBe(false)
  })

  it('kurulu paketi tekrar kurdurmaz', () => {
    makeProject({ deps: { '@base-ui/react': '1.8.0', 'lucide-react': '1.51.0', clsx: '2', 'tailwind-merge': '3' } })
    const r = run(dir, 'popover')
    expect(r.out).not.toMatch(/Paketleri kur/)
  })
})

describe('add-ui: var olan dosya', () => {
  it('farklı dosyanın üstüne yazmaz, farkı söyler; --force ile yazar', () => {
    const base = makeProject()
    mkdirSync(join(base, 'components/ui'), { recursive: true })
    const mine = '// projenin kendi chart-card dosyası\nexport const SERIES_BG = []\n'
    writeFileSync(join(base, 'components/ui/chart-card.tsx'), mine)

    const r = run(dir, 'stage-bars')
    expect(r.code).toBe(0)
    expect(readFileSync(join(base, 'components/ui/chart-card.tsx'), 'utf8')).toBe(mine)
    expect(r.out).toMatch(/components\/ui\/chart-card\.tsx.*farklı.*\+\d+ −\d+ satır/)

    expect(run(dir, 'stage-bars', '--force').code).toBe(0)
    expect(readFileSync(join(base, 'components/ui/chart-card.tsx'), 'utf8')).toBe(src('snippets/ui/chart-card.tsx'))
  })

  it('aynı dosyayı "aynı" sayar, ikinci kurulum hiçbir şey değiştirmez', () => {
    makeProject()
    run(dir, 'kbd')
    const r = run(dir, 'kbd')
    expect(r.out).toMatch(/0 yeni, 0 üzerine yazıldı, 2 aynı/)
  })

  it('atlanan yardımcıda bileşenin istediği dışa aktarım yoksa uyarır', () => {
    const base = makeProject()
    mkdirSync(join(base, 'lib'), { recursive: true })
    writeFileSync(join(base, 'lib/motion.ts'), 'export const EASE = [0.2, 0, 0, 1] as const\n')
    const r = run(dir, 'tabs') // tabs → SPRING
    expect(r.out).toMatch(/lib\/motion\.ts atlandı ama .*SPRING/)
  })

  it('harf çakışması: Skeleton.tsx varken skeleton.tsx yazılmaz (macOS/Windows aynı dosya)', () => {
    const base = makeProject()
    mkdirSync(join(base, 'components/ui'), { recursive: true })
    writeFileSync(join(base, 'components/ui/Skeleton.tsx'), 'export {}\n')
    const r = run(dir, 'skeleton')
    expect(r.out).toMatch(/çakışma/)
    expect(existsSync(join(base, 'components/ui/skeleton.tsx'))).toBe(false)
  })
})

describe('add-ui: palettes.css, kuru çalışma, hata', () => {
  it('palette-switcher: palettes.css + ThemeToggle + lib/theme gelir, globals satırı söylenir', () => {
    const base = makeProject()
    const r = run(dir, 'palette-switcher')
    expect(r.code).toBe(0)
    expect(readFileSync(join(base, 'app/palettes.css'), 'utf8')).toBe(src('templates/landing/app/palettes.css'))
    expect(existsSync(join(base, 'components/ui/ThemeToggle.tsx'))).toBe(true)
    expect(existsSync(join(base, 'lib/theme.ts'))).toBe(true)
    expect(r.out).toContain('@import "./palettes.css";')
  })

  it('globals.css zaten içe aktarıyorsa satırı tekrar istemez', () => {
    const base = makeProject()
    const g = join(base, 'app/globals.css')
    writeFileSync(g, readFileSync(g, 'utf8').replace('@import "tailwindcss";', '@import "tailwindcss";\n@import "./palettes.css";'))
    expect(run(dir, 'palette-switcher').out).not.toContain('satırının altına')
  })

  it('palettes gerektirmeyen bileşen palettes.css kopyalamaz', () => {
    const base = makeProject()
    run(dir, 'stage-bars')
    expect(existsSync(join(base, 'app/palettes.css'))).toBe(false)
  })

  it('--dry-run hiçbir dosya yazmaz', () => {
    const base = makeProject()
    const r = run(dir, 'date-picker', '--dry-run')
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/Deneme/)
    expect(existsSync(join(base, 'components'))).toBe(false)
    expect(existsSync(join(base, 'lib'))).toBe(false)
  })

  it('globals.css token\'ı eksikse uyarır', () => {
    const base = makeProject()
    writeFileSync(join(base, 'app/globals.css'), '@import "tailwindcss";\n')
    expect(run(dir, 'stage-bars').out).toMatch(/token yok: .*--color-surface/)
  })

  it('bilinmeyen bileşende exit 1 ve öneri', () => {
    makeProject()
    const r = run(dir, 'chart')
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/Bileşen yok: "chart".*chart-card/)
  })

  it('--list her bileşeni sayar', () => {
    const r = run('--list')
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/\d+ bileşen\./)
    expect(r.out).toContain('stage-bars')
  })
})

describe('ui-graph', () => {
  it('çok satırlı, type ve as içeren içe aktarımı ayrıştırır; yorumdakini saymaz', () => {
    const code = `import {\n  a,\n  type B,\n  c as d,\n} from "@/lib/motion";\n/* import "../palettes.css"; */\n// import x from "y"\nimport Link from 'next/link'\n`
    expect(parseImports(code)).toEqual([
      { spec: '@/lib/motion', names: ['a', 'B', 'c'] },
      { spec: 'next/link', names: [] },
    ])
  })

  it('kapanış npm paketlerini paket adına indirger (motion/react → motion)', () => {
    const c = collectClosure(['area-chart'])
    expect(c.npm).toContain('motion')
    expect(c.npm.some((p: string) => p.includes('/') && !p.startsWith('@'))).toBe(false)
  })

  it('README kataloğu bileşeni kategorisine bağlar', () => {
    expect(readCatalog().get('stage-bars')?.category).toBe('Grafik')
  })
})
