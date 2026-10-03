/**
 * agent-approval — Geri alinamaz aksiyonlar icin onay (Human-in-the-Loop)
 *
 * Agent kritik bir isleme geldiginde durur ve kullaniciya sorar. AG-UI'da bu
 * "interrupt"tir: run TEMIZCE BITER, kullanicinin cevabi bir SONRAKI run'a
 * resume verisi olarak girer. Duraklatilmis baglanti yok — stateless HTTP'ye
 * oturan bir model.
 *
 * Geri ALINABILIR aksiyonlarda bunu kullanma -> snippets/action-card.tsx
 * Kirmizi cizgilerde (hesap silme) hicbirini kullanma -> tool'u agent'a verme.
 *
 * Kullanim:
 *   function TicketingApprovals() {
 *     useCancelFlightApproval()
 *     return null
 *   }
 *
 * Kural: rules/agentic-ui.md — 4 (aksiyon sinifina gore kontrol seviyesi)
 */

'use client'

import { m } from 'motion/react'
import { useHumanInTheLoop, ToolCallStatus } from '@copilotkit/react-core/v2'
import { z } from 'zod'

const EASE = [0.22, 1, 0.36, 1] as const

// Sunucu, sorusunu ve secenekleri BURADAN gonderir. Istemci secenekleri
// bilmez — bu sayede yeni tool'lar ve yeni secenekler ISTEMCI DEGISIKLIGI
// GEREKTIRMEZ.
const approvalParams = z.object({
  message: z.string().describe('kullaniciya sorulacak soru'),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        payload: z.record(z.string(), z.unknown()),
        variant: z.enum(['default', 'danger']).optional(),
      }),
    )
    .optional()
    .describe('secenekler; verilmezse Onayla/Vazgec kullanilir'),
})

const FALLBACK_OPTIONS = [
  { id: 'accept', label: 'Onayla', payload: { approved: true }, variant: 'default' as const },
  { id: 'decline', label: 'Vazgec', payload: { approved: false }, variant: 'default' as const },
]

export function useCancelFlightApproval() {
  useHumanInTheLoop(
    {
      name: 'cancelFlight',
      description:
        'Rezerve edilmis bir ucusu iptal eder. Geri alinamaz, o yuzden ' +
        'kullanicidan onay ister.',
      parameters: approvalParams,
      render: ({ status, args, respond }) => {
        // Executing = soru soruldu, cevap bekleniyor. respond SADECE burada var.
        if (status !== ToolCallStatus.Executing) {
          return (
            <p className="text-base text-muted">
              {status === ToolCallStatus.Complete ? 'Yanitlandi.' : 'Hazirlaniyor...'}
            </p>
          )
        }

        const options = args.options?.length ? args.options : FALLBACK_OPTIONS

        return (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="rounded-lg border border-line bg-surface p-4"
          >
            <p className="text-base text-body">{args.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  // respond() cevabi resume olarak yollar ve YENI bir run baslatir
                  onClick={() => void respond(option.payload)}
                  className={
                    option.variant === 'danger'
                      ? 'min-h-11 rounded-md bg-danger px-3 text-base text-on-primary transition hover:opacity-90'
                      : 'min-h-11 rounded-md border border-line-strong px-3 text-base text-body transition hover:bg-surface-raised'
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </m.div>
        )
      },
    },
    [],
  )
}
