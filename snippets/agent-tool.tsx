/**
 * agent-tool — Agent'a acilan frontend tool'lari
 *
 * LLM'in tarayicida calistirdigi iki tool bicimi:
 *   1) Veri toplayan tool  -> donus degeri modele geri gider, model devam eder
 *   2) Terminal widget     -> ekrana bir sey cizer, turu BITIRIR (followUp: false)
 *
 * Kullanim:
 *   function TicketingTools() {
 *     useFindFlightsTool(handleSearch)   // satir ici callback de olur: guncel olani cagrilir
 *     useFlightWidget()
 *     return null            // hook'lar UI dondurmez, kayit yapar
 *   }
 *   // <CopilotKitProvider> agacinin ICINDE render et
 *
 * Kural: rules/agentic-ui.md — Least privilege, tool sonucu string'dir
 * Desen: knowledge/patterns.md -> Atomik Agent Tool'lari
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useFrontendTool, ToolCallStatus } from '@copilotkit/react-core/v2'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1) Veri toplayan / aksiyon alan tool
// ---------------------------------------------------------------------------
// `description` prompt'un parcasidir — model tool'u BUNA bakarak secer.
// Ne yaptigini ve NE ZAMAN cagrilmasi gerektigini yaz.

const findFlightsParams = z.object({
  from: z.string().min(1).max(80).describe('kalkis sehri (havalimani kodu degil)'),
  to: z.string().min(1).max(80).describe('varis sehri (havalimani kodu degil)'),
})

export type FindFlightsArgs = z.infer<typeof findFlightsParams>

/**
 * Handler AYRI bir fonksiyon — hook'un icine gomulu degil.
 *
 * Sebep: `rules/agentic-ui.md` her frontend tool icin birim testi sart kosuyor
 * ve test CIFT iddia kurmali: donus degeri (modelin gordugu) + yan etki
 * (kullanicinin gordugu). Hook'un icine gomulu bir closure'i test etmek React
 * render etmeyi gerektirir; sade fonksiyon dogrudan cagrilir.
 *
 * Ornek test: snippets/agent-tool.test.ts
 */
export function createFindFlightsHandler(onSearch: (from: string, to: string) => void) {
  // Arguman `unknown`: CopilotKit semayi yalnizca MODELE gonderir, gelen
  // argumani ona karsi DOGRULAMAZ (yalnizca JSON.parse). Tip derleme
  // zamaninda kalir -> rules/agentic-ui.md 5. Yan etkiden ONCE safeParse.
  return async (raw: unknown) => {
    const parsed = findFlightsParams.safeParse(raw)
    // Bozuk argumanda arama YAPILMAZ ve modele "basardim" denmez: hata
    // modele doner, model duzeltip tekrar cagirabilir.
    if (!parsed.success) return { ok: false, error: 'from ve to zorunlu sehir adlaridir' }
    const { from, to } = parsed.data
    // Donus degeri MODELE gider — kisa ve yapisal tut, ham veri bosaltma.
    onSearch(from, to)
    return { ok: true, searched: `${from} -> ${to}` }
  }
}

export function useFindFlightsTool(onSearch: (from: string, to: string) => void) {
  // CopilotKit deps'i JSON.stringify ile karsilastirir: fonksiyon "null" olur,
  // [onSearch] yeniden kaydi HICBIR ZAMAN tetiklemez ve ilk render'in closure'i
  // kalir. Tool bir kez kaydolur, guncel callback ref'ten okunur.
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  })
  const handler = useCallback(
    (raw: unknown) => createFindFlightsHandler(onSearchRef.current)(raw),
    [],
  )

  useFrontendTool(
    {
      name: 'findFlights',
      description:
        'Ucus arar ve kullaniciyi sonuc listesine yonlendirir. ' +
        'Kullanici belirli bir rota sordugunda cagir.',
      parameters: findFlightsParams,
      handler,
    },
    [],
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
      // Render'la ayni olcut: kart cizilemediyse modele "gosterildi" denmez
      handler: async (raw: unknown) =>
        flightWidgetParams.safeParse(raw).success
          ? { shown: true }
          : { shown: false, error: 'ucus bilgisi okunamadi' },
      render: ({ status, args }) => {
        // Streaming sirasinda args PARTIAL gelir — iskelet goster.
        if (status === ToolCallStatus.InProgress) {
          return <div className="h-24 animate-pulse rounded-lg bg-surface-raised" />
        }
        // Tamamlanan args da dogrulanmamistir: `from` bir nesne gelirse JSX'e
        // koymak render'i (ve sohbeti) dusurur. Okunamayan kart yerine not.
        const parsed = flightWidgetParams.safeParse(args)
        if (!parsed.success) {
          return <p className="text-base text-muted">Uçuş bilgisi okunamadı.</p>
        }
        const flight = parsed.data
        return (
          <article className="rounded-lg border border-line bg-surface p-4">
            <p className="font-mono text-micro uppercase tracking-[0.14em] text-muted">
              {flight.status === 'booked' ? 'Rezerve' : 'Müsait'}
            </p>
            <p className="mt-1 text-read font-semibold text-strong">
              {flight.from} &rarr; {flight.to}
            </p>
            <p className="text-base text-soft">{flight.date}</p>
          </article>
        )
      },
    },
    [],
  )
}
