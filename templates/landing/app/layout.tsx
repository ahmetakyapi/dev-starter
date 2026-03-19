import type { Metadata } from 'next'
import { Manrope, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Pulse — Product Analytics (Demo)',
    template: '%s | Pulse',
  },
  description: 'Real-time product analytics for modern teams. Track users, revenue and engagement from one beautiful dashboard.',
  openGraph: {
    title:       'Pulse — Product Analytics',
    description: 'Real-time product analytics for modern teams.',
    type:        'website',
    locale:      'tr_TR',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Pulse — Product Analytics',
    description: 'Real-time product analytics for modern teams.',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body className={manrope.className}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <div className="flex items-center justify-center gap-2 bg-indigo-600 px-4 py-2 text-center text-xs font-medium text-white">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Demo</span>
            <span>Bu sayfa bir şablon demosu — tüm içerik örnek amaçlıdır.</span>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
