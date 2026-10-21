/**
 * OpenGraph görsel üretici (rota ucu)
 *
 * Kullanım: `app/api/og/route.tsx` olarak kopyala. `next/og` Next'in içinde
 * gelir; ayrı paket gerekmez. `opengraph-image.tsx` dosya kuralı
 * varsayılan dışa aktarım ister ve sorgu parametresi okumaz; bu dosya `GET`
 * verir. Dosya kuralının örneği şablondaki `app/opengraph-image.tsx`.
 *
 *   /api/og?title=Başlık&subtitle=Alt+Başlık
 *
 * Mümkünse serbest metin alma: sayfa başına `opengraph-image.tsx` başlığı
 * sayfanın kendi verisinden okur (`knowledge/tech-radar.md`). Serbest metin
 * şartsa parametreleri imzala (`sig`, HMAC) ya da `lib/rate-limit` uygula;
 * aşağıdaki kırpma yalnızca en ucuz savunma.
 *
 * RENKLER NEDEN JS'TEN: OG görselini Satori çiziyor ve Satori CSS değişkeni
 * çözmüyor; `var(--page-bg)` yazılırsa zemin boş çıkar. Değerler
 * @ahmetakyapi/theme'in `roles` (sistem) ve `palettes` (palet) aynasından
 * gelir; theme.css ile ayrışmadıkları tests/contract.test.ts'te doğrulanır.
 * Projenin paleti `signature` değilse `PALETTE`'i değiştir. Paket kurulu
 * değilse (şablon projeleri) değerleri `app/globals.css`teki paletin koyu
 * bloğundan sabit yaz ve kaynağını yorumda söyle, şablondaki
 * `app/opengraph-image.tsx` gibi.
 *
 * KALINLIK: `next/og` yalnızca Geist Regular gömer; `fonts` verilmezse
 * `fontWeight` yok sayılır. Kalın başlık için fontu projeden oku, `GET`i
 * `async` yap ve ver:
 *   const bold = await readFile(join(process.cwd(), 'assets/Brand-Bold.ttf'))
 *   new ImageResponse(el, { ...SIZE, fonts: [{ name: 'Brand', data: bold, weight: 700 }] })
 * sonra başlığa `fontWeight: 700` ekle.
 */

import { ImageResponse } from 'next/og'
import { palettes, roles } from '@ahmetakyapi/theme'

const SIZE = { width: 1200, height: 630 } as const
// Paylaşılan görsel koyu zeminde: sosyal akışların çoğu koyu ya da nötr
const THEME = 'dark'
const PALETTE = 'signature'
const C = roles[THEME]
const P = palettes[PALETTE][THEME]

// Sorgu metni güvenilmez ve uzunluğu bedava değil: Satori + resvg her
// istekte senkron CPU yakar (kısa başlık ≈ 15 ms, 5 000 karakter ≈ 250 ms)
// ve her farklı sorgu önbelleği ıskalar. Kod noktasıyla kırpılır, emoji
// ortadan bölünmez; kontrol karakterleri atılır.
function clip(value: string | null, max: number) {
  return Array.from(value?.trim() ?? '')
    .filter((ch) => ch >= ' ' && ch !== '\u007f')
    .slice(0, max)
    .join('')
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // 90 karakter 64 pikselde zaten üç satır; fazlası kartı taşırır
  const title = clip(searchParams.get('title'), 90) || 'PROJECT_NAME'
  const subtitle = clip(searchParams.get('subtitle'), 160) || 'PROJECT_DESCRIPTION'

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
            color: P.onPrimary,
          }}
        >
          P
        </div>

        <div
          style={{
            fontSize: 64,
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
