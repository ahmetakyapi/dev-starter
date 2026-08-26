/**
 * agent-tool — Agent'a acilan frontend tool'lari
 *
 * LLM'in tarayicida calistirdigi iki tool bicimi:
 *   1) Veri toplayan tool  -> donus degeri modele geri gider, model devam eder
 *   2) Terminal widget     -> ekrana bir sey cizer, turu BITIRIR (followUp: false)
 *
 * Kullanim:
 *   function TicketingTools() {
 *     useFindFlightsTool()
 *     useFlightWidget()
 *     return null            // hook'lar UI dondurmez, kayit yapar
 *   }
 *   // <CopilotKitProvider> agacinin ICINDE render et
 *
 * Kural: rules/agentic-ui.md — Least privilege, tool sonucu string'dir
 * Desen: knowledge/patterns.md -> Atomik Agent Tool'lari
 */

'use client'

import { useFrontendTool, ToolCallStatus } from '@copilotkit/react-core/v2'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1) Veri toplayan / aksiyon alan tool
// ---------------------------------------------------------------------------
// `description` prompt'un parcasidir — model tool'u BUNA bakarak secer.
// Ne yaptigini ve NE ZAMAN cagrilmasi gerektigini yaz.

const findFlightsParams = z.object({
  from: z.string().describe('kalkis sehri (havalimani kodu degil)'),
  to: z.string().describe('varis sehri (havalimani kodu degil)'),
})

export function useFindFlightsTool(onSearch: (from: string, to: string) => void) {
  useFrontendTool(
    {
      name: 'findFlights',
      description:
        'Ucus arar ve kullaniciyi sonuc listesine yonlendirir. ' +
        'Kullanici belirli bir rota sordugunda cagir.',
      parameters: findFlightsParams,
      // Donus degeri MODELE gider — kisa ve yapisal tut, ham veri bosaltma.
      handler: async ({ from, to }) => {
        onSearch(from, to)
        return { ok: true, searched: `${from} -> ${to}` }
      },
    },
    [onSearch],
  )
}

// ---------------------------------------------------------------------------
// 2) Widget = render'i olan tool
// ---------------------------------------------------------------------------
// Ayri bir "generative UI" kavrami YOK. Sema hem parametre tanimi hem de
// bilesenin veri sozlesmesidir.

const flightWidgetParams = z.object({
  id: z.number().describe('ucus id'),
  from: z.string(),
  to: z.string(),
  date: z.string().describe('ISO tarih'),
  status: z.enum(['booked', 'available']),
})

export function useFlightWidget() {
  useFrontendTool(
    {
      name: 'flightWidget',
      description:
        'Bir ucusu etkilesimli kart olarak gosterir. Belirli ucuslardan ' +
        'bahsederken kullan.\n\n' +
        // KRITIK: followUp: false yalnizca ISTEMCIYI kontrol eder. Modelin de
        // turu bitirmesi icin bunu ACIKLAMAYA yazmak sart. -> mistakes.md #59
        'Bu tool cagrisi turunu BITIRIR — sonrasinda metin yazma.',
      parameters: flightWidgetParams,
      followUp: false,
      handler: async () => ({ shown: true }),
      render: ({ status, args }) => {
        // Streaming sirasinda args PARTIAL gelir — alan alan doldugu icin
        // her alani ayri kontrol et, `args.from &&` gibi.
        if (status === ToolCallStatus.InProgress) {
          return <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        }
        return (
          <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-lg">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
              {args.status === 'booked' ? 'Rezerve' : 'Musait'}
            </p>
            <p className="mt-1 text-base font-semibold">
              {args.from} &rarr; {args.to}
            </p>
            <p className="text-sm text-white/60">{args.date}</p>
          </article>
        )
      },
    },
    [],
  )
}
