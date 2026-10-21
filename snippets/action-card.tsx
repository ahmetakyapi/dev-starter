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
 *     useBookFlightCard(undoBooking)   // 'use server' eylemi — yetki ORADA
 *     useDefaultRenderTool()   // kendi karti olmayan tool'lar icin varsayilan
 *     return null
 *   }
 *
 * Kural: rules/agentic-ui.md — 4 (aksiyon sinifi), 5 (tool sonucu string'dir)
 * Desen: knowledge/patterns.md -> Action Card + Undo
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { useRenderTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

const EASE = [0.22, 1, 0.36, 1] as const

// Sunucudaki tool'un inputSchema'sinin ISTEMCI KARSILIGI.
// Ayri projelerdeyseler bilincli olarak cogaltilir; monorepo'da paylasilir.
// Render'a gelen argumani CopilotKit semaya karsi DOGRULAMAZ -> kartta safeParse.
const bookFlightParams = z.object({ flightId: z.number().int().positive() })

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

/**
 * `undoBooking` bir sunucu eylemi olmali ve yetkiyi KENDISI kurmali: oturumdaki
 * kullanici bu rezervasyonun sahibi mi, rezervasyon hala iptal edilebilir mi.
 * Geri almayi idempotent yap (ikinci cagri ikinci iptal olmasin). Daha saglami:
 * sunucu tool'u sonucunda tek kullanimlik bir `undoToken` dondursun ve geri alma
 * onu atomik tuketsin — app/akis/actions.ts (nextjs-fullstack) bu deseni uygular.
 */
export function useBookFlightCard(undoBooking: (flightId: number) => Promise<void>) {
  // CopilotKit deps'i JSON.stringify ile karsilastirir: fonksiyon "null" olur,
  // [undoBooking] yeniden kaydi HICBIR ZAMAN tetiklemez. Render bir kez kaydolur,
  // guncel callback ref'ten okunur.
  const undoRef = useRef(undoBooking)
  useEffect(() => {
    undoRef.current = undoBooking
  })
  const undo = useCallback((flightId: number) => undoRef.current(flightId), [])

  useRenderTool(
    {
      name: 'bookFlight', // sunucudaki tool adiyla BIREBIR ayni olmali
      parameters: bookFlightParams,
      render: (props) => <BookFlightCard {...props} undoBooking={undo} />,
    },
    [],
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
  const [undoFailed, setUndoFailed] = useState(false)

  const parsed = status === 'complete' ? parseToolResult(result) : undefined
  // Streaming sirasinda parametreler yarimdir; gecmeyen id ile Geri Al sunulmaz
  const args = bookFlightParams.safeParse(parameters)
  const flightId = args.success ? args.data.flightId : undefined

  const label = undone
    ? 'Geri alındı'
    : status !== 'complete'
      ? 'İşleniyor…'
      : parsed === undefined
        ? 'Sonuç okunamadı'
        : parsed.ok
          ? 'Rezerve edildi'
          : `Başarısız${parsed.code ? ` (${parsed.code})` : ''}`

  // `pending` burada YOK, bilerek: dugme tik aninda kalkarsa odak <body>'ye
  // duser ve disabled gorunumu hic cizilmez. Dugme kalir, istek bitene dek kilitli;
  // kilit `disabled` degil `aria-disabled`: odakli dugme disabled olunca da odak <body>'ye duser.
  const canUndo = !undone && parsed?.ok === true && flightId !== undefined

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
        {flightId !== undefined ? `Uçuş #${flightId}` : 'Uçuş'}
      </p>
      <p role="status" className="mt-1 text-base text-soft">
        {label}
      </p>

      {canUndo && (
        <button
          type="button"
          aria-disabled={pending || undefined}
          aria-busy={pending}
          onClick={async () => {
            if (pending) return
            setPending(true)
            setUndoFailed(false)
            try {
              await undoBooking(flightId)
              setUndone(true)
            } catch {
              // Async onClick'in hatasini React yakalamaz: catch'siz, hata
              // "Uncaught (in promise)" olur ve kullanici hicbir sey gormez.
              setUndoFailed(true)
            } finally {
              setPending(false)
            }
          }}
          className="mt-3 min-h-11 rounded-md border border-line-strong px-3 text-base text-body
                     transition hover:bg-surface-raised aria-disabled:opacity-50"
        >
          Geri Al
        </button>
      )}

      {undoFailed && !undone && (
        <p role="alert" className="mt-2 text-small text-danger">
          Geri alınamadı. Tekrar dene.
        </p>
      )}
    </m.article>
  )
}
