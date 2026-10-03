/**
 * action-card — Sunucu tarafi tool cagrisini kart olarak goster + Geri Al
 *
 * Onay yorgunluguna panzehir: her aksiyondan once soran uygulama, kullaniciyi
 * tiklayip gecmeye egitir. GERI ALINABILIR aksiyonlarda sorma — yap, goster,
 * geri almayi sun. Geri alma MODELE UGRAMAZ: dogrudan, deterministik, token'siz.
 *
 * Geri ALINAMAZ aksiyonlarda bunu kullanma -> snippets/agent-approval.tsx
 *
 * Kullanim:
 *   function TicketingCards() {
 *     useBookFlightCard()
 *     useDefaultRenderTool()   // kendi karti olmayan tool'lar icin varsayilan
 *     return null
 *   }
 *
 * Kural: rules/agentic-ui.md — 4 (aksiyon sinifi), 5 (tool sonucu string'dir)
 * Desen: knowledge/patterns.md -> Action Card + Undo
 */

'use client'

import { useState } from 'react'
import { m } from 'motion/react'
import { useRenderTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

const EASE = [0.22, 1, 0.36, 1] as const

// Sunucudaki tool'un inputSchema'sinin ISTEMCI KARSILIGI.
// Ayri projelerdeyseler bilincli olarak cogaltilir; monorepo'da paylasilir.
const bookFlightParams = z.object({ flightId: z.number() })

// --- Tool sonucunu GUVENLI cozumle -----------------------------------------
// Tel uzerinde sonuc sadece bir string'dir. JSON.parse -> unknown.
// Cast etmek temenniden ibarettir. -> mistakes.md #58
type MutationResult = { ok: boolean; result: string; code?: string }

function parseToolResult(raw: string | undefined): MutationResult | undefined {
  if (raw === undefined) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Gecerli JSON degil — kullanici bos karta bakmasin, geleni goster
    return { ok: false, result: raw, code: 'INVALID_RESULT' }
  }

  const c = parsed as { ok?: unknown; result?: unknown; code?: unknown } | null
  if (typeof c?.ok !== 'boolean' || typeof c.result !== 'string') {
    return undefined // beklenen alanlar yok — "basarili" deme
  }
  return {
    ok: c.ok,
    result: c.result,
    code: typeof c.code === 'string' ? c.code : undefined,
  }
}

// --- Kart -------------------------------------------------------------------

export function useBookFlightCard(undoBooking: (flightId: number) => Promise<void>) {
  useRenderTool(
    {
      name: 'bookFlight', // sunucudaki tool adiyla BIREBIR ayni olmali
      parameters: bookFlightParams,
      render: (props) => <BookFlightCard {...props} undoBooking={undoBooking} />,
    },
    [undoBooking],
  )
}

// DIKKAT: useRenderTool'un render props'u status'u STRING LITERAL verir.
// useFrontendTool'un render'i ise ToolCallStatus ENUM'u verir. Ayni kutuphane,
// iki farkli tip — enum'u buraya tasirsan tsc patlar. -> mistakes.md #70
type ToolStatus = 'inProgress' | 'executing' | 'complete'

type CardProps = {
  status: ToolStatus
  parameters: Partial<z.infer<typeof bookFlightParams>>
  result: string | undefined
  undoBooking: (flightId: number) => Promise<void>
}

function BookFlightCard({ status, parameters, result, undoBooking }: CardProps) {
  // Geri alma tool cagrisindan SONRA olur, o yuzden `result` icinde hic gorunmez.
  // Kartin kendi yerel state'i yalnizca bunun icin var.
  const [undone, setUndone] = useState(false)
  const [pending, setPending] = useState(false)

  const parsed = status === 'complete' ? parseToolResult(result) : undefined
  const flightId = parameters.flightId

  const label = undone
    ? 'Geri alindi'
    : status !== 'complete'
      ? 'Isleniyor...'
      : parsed === undefined
        ? 'Sonuc okunamadi'
        : parsed.ok
          ? 'Rezerve edildi'
          : `Basarisiz${parsed.code ? ` (${parsed.code})` : ''}`

  const canUndo = !undone && !pending && parsed?.ok === true && flightId !== undefined

  return (
    <m.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="rounded-lg border border-line bg-surface p-4"
    >
      <p className="font-mono text-micro uppercase tracking-[0.14em] text-muted">
        Rezervasyon
      </p>
      <p className="mt-1 text-read font-semibold text-strong">
        {flightId !== undefined ? `Ucus #${flightId}` : 'Ucus'}
      </p>
      <p className="mt-1 text-base text-soft">{label}</p>

      {canUndo && (
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              await undoBooking(flightId)
              setUndone(true)
            } finally {
              setPending(false)
            }
          }}
          className="mt-3 min-h-11 rounded-md border border-line-strong px-3 text-base text-body
                     transition hover:bg-surface-raised disabled:opacity-50"
        >
          Geri Al
        </button>
      )}
    </m.article>
  )
}
