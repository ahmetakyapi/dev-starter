/**
 * OpenGraph görsel üretici
 *
 * Kullanım: app/opengraph-image.tsx (dosya kuralı) ya da app/api/og/route.tsx
 * olarak kopyala. `next/og` Next'in içinde gelir; ayrı paket gerekmez.
 *
 *   /api/og?title=Başlık&subtitle=Alt+Başlık
 *
 * RENKLER NEDEN JS'TEN: OG görselini Satori çiziyor ve Satori CSS değişkeni
 * çözmüyor; `var(--page-bg)` yazılırsa zemin boş çıkar. Değerler
 * @ahmetakyapi/theme'in `roles` (sistem) ve `palettes` (palet) aynasından
 * gelir; theme.css ile ayrışmadıkları tests/contract.test.ts'te doğrulanır.
 * Projenin paleti `signature` değilse `PALETTE`'i değiştir. Paket kurulu değilse
 * aynı değerleri projenin lib/theme.ts'inden oku, buraya hex yazma.
 */

import { ImageResponse } from 'next/og'
import { palettes, roles } from '@ahmetakyapi/theme'

const SIZE = { width: 1200, height: 630 } as const
// Paylaşılan görsel koyu zeminde: sosyal akışların çoğu koyu ya da nötr
const THEME = 'dark'
const PALETTE = 'signature'
const C = roles[THEME]
const P = palettes[PALETTE][THEME]

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'PROJECT_NAME'
  const subtitle = searchParams.get('subtitle') ?? 'PROJECT_DESCRIPTION'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.pageBg,
          // .app-bg ile aynı: köşede paletin düşük opaklıklı ışığı
          backgroundImage: `radial-gradient(circle at 12% 0%, ${P.appGlow}, transparent 45%)`,
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        {/* Marka döşemesi: imza degradesinin üç izinli yerinden biri */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundImage: P.brandGradient,
            marginBottom: 40,
            fontSize: 28,
            fontWeight: 800,
            color: P.onPrimary,
          }}
        >
          P
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: C.textStrong,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: '-2px',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
            color: C.textSoft,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        <div style={{ position: 'absolute', bottom: 48, fontSize: 20, color: P.primaryInk }}>
          PROJECT_NAME.com
        </div>
      </div>
    ),
    SIZE,
  )
}
