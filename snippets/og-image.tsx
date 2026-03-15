/**
 * OpenGraph Görsel Üretici
 * Kullanım: app/api/og/route.tsx olarak kopyala
 *
 * Kurulum:
 *   npm install @vercel/og
 *
 * Erişim:
 *   /api/og?title=Başlık&subtitle=Alt+başlık
 *
 * meta tag:
 *   <meta property="og:image" content="/api/og?title=..." />
 */

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    ?? 'PROJECT_NAME'
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
          background: '#04070d',
          fontFamily: 'sans-serif',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Arka plan radyal gradient'lar */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(79,70,229,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(34,211,238,0.15) 0%, transparent 50%)',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64, height: 64,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1, #3b82f6, #22d3ee)',
          marginBottom: 40,
          fontSize: 28,
          fontWeight: 800,
          color: 'white',
        }}>
          P
        </div>

        {/* Başlık */}
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#f1f5f9',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: '-2px',
        }}>
          {title}
        </div>

        {/* Alt başlık */}
        <div style={{
          fontSize: 28,
          color: 'rgba(148,163,184,0.8)',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          fontSize: 20,
          color: 'rgba(99,102,241,0.7)',
        }}>
          PROJECT_NAME.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
