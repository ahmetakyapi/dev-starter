'use client'

import { Avatar as Base } from '@base-ui/react/avatar'
import { cn } from '@/lib/utils'

/**
 * Avatar: görsel, yüklenemezse baş harfler. `AvatarGroup`: üst üste binen
 * küçük avatarlar ("Ekip", "Katılımcılar"), fazlası "+3" hapında.
 *
 * Base UI Avatar görselin yüklenip yüklenmediğini izler ve yalnızca
 * yüklendiyse gösterir; kırık görsel ikonu hiç çıkmaz. Yükleme sürerken ve
 * hata olursa baş harf yedeği durur, ikisi aynı kutuda: sayfa zıplamaz.
 * (Ayrıca `next/image` gerektirmeden `<img>` basar; uzak avatar adresleri
 * için `remotePatterns`a joker host yazmak `/_next/image`ı herkese açık bir
 * görsel vekiline çevirirdi.)
 *
 * PASTEL YEDEK ("board" dili, 2026-11): baş harf zemini grafik paletinin
 * yıkaması (`--chart-N` %30, sayfa zeminiyle karışık), renk ADDAN türetilir: aynı kişi her ekranda
 * aynı renkte, komşu satırlar birbirinden ayrışır. Grafik rengi metin
 * rengi olamadığından harf `text-strong` (açık temada pastel üstünde koyu,
 * koyu temada koyulaşmış yıkama üstünde açık; iki temada da AA).
 *
 * BAŞ HARFLER TÜRKÇE BÜYÜK HARFLE: `toLocaleUpperCase("tr-TR")`. "ilker"
 * → "İ", "ışık" → "I". `toUpperCase()` "ilker"den "I" üretir.
 *
 * `alt`: avatar bir adın YANINDA duruyorsa (liste satırı) görsel süstür,
 * `alt=""` doğru; ad yalnızca avatarda ise `alt={ad}`. Grupta adlar
 * görünmediği için grubun kendisi adlanır (`role="group"` + "Ayşe, Mert ve
 * 3 kişi daha"), tek tek avatarlar susar.
 */

const SIZES = {
  sm: 'size-8 text-micro',
  md: 'size-10 text-small',
  lg: 'size-14 text-read',
} as const

/* Sınıf adları TAM yazılır: Tailwind kaynağı tarar, birleştirilmiş dizeyi
   görmez. Yıkama sayfa zeminiyle KARIŞTIRILIR (saydam değil, opak): grupta
   üst üste binen avatar alttakini göstermesin. */
const TINTS = [
  'bg-[color-mix(in_srgb,var(--chart-1)_30%,var(--page-bg))]',
  'bg-[color-mix(in_srgb,var(--chart-2)_30%,var(--page-bg))]',
  'bg-[color-mix(in_srgb,var(--chart-3)_30%,var(--page-bg))]',
  'bg-[color-mix(in_srgb,var(--chart-4)_30%,var(--page-bg))]',
  'bg-[color-mix(in_srgb,var(--chart-5)_30%,var(--page-bg))]',
  'bg-[color-mix(in_srgb,var(--chart-6)_30%,var(--page-bg))]',
] as const

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0][0], parts.at(-1)![0]] : [parts[0]?.[0] ?? '?']
  return letters.join('').toLocaleUpperCase('tr-TR')
}

/** Addan kararlı bir renk: basit karakter toplamı, sunucuda ve istemcide aynı. */
function tint(name: string) {
  let sum = 0
  for (const char of name) sum = (sum * 31 + char.charCodeAt(0)) >>> 0
  return TINTS[sum % TINTS.length]
}

type AvatarProps = {
  name: string
  src?: string | null
  /** Varsayılan boş: avatar genellikle adın yanında durur. */
  alt?: string
  size?: keyof typeof SIZES
  className?: string
}

export function Avatar({ name, src, alt = '', size = 'md', className }: AvatarProps) {
  return (
    <Base.Root
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-strong select-none',
        tint(name),
        SIZES[size],
        className,
      )}
    >
      {src ? <Base.Image src={src} alt={alt} className="size-full object-cover" /> : null}
      <Base.Fallback aria-hidden={alt === '' ? true : undefined}>{initials(name)}</Base.Fallback>
    </Base.Root>
  )
}

type AvatarGroupProps = {
  people: readonly { name: string; src?: string | null }[]
  /** Gösterilecek en fazla avatar; fazlası "+N" hapında. */
  max?: number
  size?: keyof typeof SIZES
  /** Grubun okunan adının başı: "Ekip" → "Ekip: Ayşe, Mert ve 3 kişi daha". */
  label?: string
  className?: string
}

const OVERLAP = { sm: '-space-x-2', md: '-space-x-2.5', lg: '-space-x-3.5' } as const

export function AvatarGroup({ people, max = 4, size = 'md', label, className }: AvatarGroupProps) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  const names = shown.map((person) => person.name).join(', ')
  const spoken = `${label ? `${label}: ` : ''}${names}${rest > 0 ? ` ve ${rest} kişi daha` : ''}`
  return (
    <div
      role="group"
      aria-label={spoken}
      className={cn('flex items-center [&>*]:ring-2 [&>*]:ring-page', OVERLAP[size], className)}
    >
      {shown.map((person, index) => (
        // Halka (kapta) zeminle aynı renkte: avatarlar birbirinden kesilmiş
        // görünür. Beyaz karo üstündeyse `className="[&>*]:ring-overlay"`.
        <Avatar key={`${person.name}-${index}`} name={person.name} src={person.src} size={size} />
      ))}
      {rest > 0 ? (
        <span
          aria-hidden
          className={cn(
            'inline-grid shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--text-strong)_8%,var(--page-bg))] font-semibold text-body tabular-nums',
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
