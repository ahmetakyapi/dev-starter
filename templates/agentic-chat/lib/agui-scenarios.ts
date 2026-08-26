/**
 * agui-scenarios — Anahtarsiz, modelsiz AG-UI olay dizileri
 *
 * Protokolun kelime dagarcigini calisir halde uretir. Iki yerde kullanilir:
 *   1) app/api/agent/route.ts  -> tarayicida gercek SSE olarak yayinlanir
 *   2) __tests__/*             -> testlerde fixture olarak kullanilir
 *
 * Ayni kaynak iki yeri beslediginden test ile calisan uygulama ayrisamaz.
 */

import {
  EventType,
  type BaseEvent,
  type Message,
} from '@ag-ui/core'

export type ScenarioName =
  | 'text'      // duz akan metin
  | 'tool'      // sunucu tool'u: cagri + sonuc + metin  (seffaflik)
  | 'widget'    // frontend tool cagrisi -> useFrontendTool render
  | 'card'      // sunucu tool'u + sonuc  -> useRenderTool (action card)
  | 'interrupt' // RUN_FINISHED + outcome -> useHumanInTheLoop
  | 'steps'     // STEP_* workflow ilerlemesi
  | 'state'     // STATE_SNAPSHOT paylasilan state

export const SCENARIOS: readonly ScenarioName[] = [
  'text', 'tool', 'widget', 'card', 'interrupt', 'steps', 'state',
] as const

export function isScenario(value: string | null): value is ScenarioName {
  return value !== null && (SCENARIOS as readonly string[]).includes(value)
}

interface Ctx {
  threadId: string
  runId: string
  /** Deterministik id uretici — testlerin sabit id beklemesi icin. */
  id: (label: string) => string
}

const started = (c: Ctx): BaseEvent =>
  ({ type: EventType.RUN_STARTED, threadId: c.threadId, runId: c.runId }) as BaseEvent

const finished = (c: Ctx, outcome?: unknown): BaseEvent =>
  ({
    type: EventType.RUN_FINISHED,
    threadId: c.threadId,
    runId: c.runId,
    ...(outcome ? { outcome } : {}),
  }) as BaseEvent

/** Metni parca parca yayinlar — streaming'i gorunur kilar. */
function textMessage(c: Ctx, text: string, chunks = 3): BaseEvent[] {
  const messageId = c.id('msg')
  const size = Math.ceil(text.length / chunks)
  const parts: BaseEvent[] = [
    { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' } as BaseEvent,
  ]
  for (let i = 0; i < text.length; i += size) {
    parts.push({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: text.slice(i, i + size),
    } as BaseEvent)
  }
  parts.push({ type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent)
  return parts
}

/** Bir tool cagrisini basindan sonuna yayinlar. */
function toolCall(
  c: Ctx,
  name: string,
  args: Record<string, unknown>,
  result?: unknown,
): BaseEvent[] {
  const toolCallId = c.id(`call-${name}`)
  const events: BaseEvent[] = [
    { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: name } as BaseEvent,
    { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(args) } as BaseEvent,
    { type: EventType.TOOL_CALL_END, toolCallId } as BaseEvent,
  ]
  // Sonuc YALNIZCA sunucu tool'lari icin gelir. Frontend tool'unun sonucunu
  // istemci uretir ve bir SONRAKI run'da geri gonderir.
  if (result !== undefined) {
    events.push({
      type: EventType.TOOL_CALL_RESULT,
      toolCallId,
      messageId: c.id('tool-msg'),
      role: 'tool',
      content: JSON.stringify(result),
    } as BaseEvent)
  }
  return events
}

const DEMO_FLIGHT = {
  id: 284, from: 'Graz', to: 'Hamburg', date: '2026-09-14', status: 'available',
} as const

export function buildScenario(name: ScenarioName, ctx: Ctx): BaseEvent[] {
  switch (name) {
    case 'text':
      return [started(ctx), ...textMessage(ctx, 'Merhaba. Nasil yardimci olabilirim?'), finished(ctx)]

    case 'tool':
      return [
        started(ctx),
        ...toolCall(ctx, 'findBookedFlights', {}, [DEMO_FLIGHT]),
        ...textMessage(ctx, 'Bir rezervasyonun var: Graz - Hamburg.'),
        finished(ctx),
      ]

    case 'widget':
      // Frontend tool: sonuc YOK. Istemci calistirir, render eder.
      return [
        started(ctx),
        ...textMessage(ctx, 'Iste ucusun:'),
        ...toolCall(ctx, 'flightWidget', DEMO_FLIGHT),
        finished(ctx),
      ]

    case 'card':
      // Sunucu tool'u: sonuc string olarak gelir -> action card onu cozmeli
      return [
        started(ctx),
        ...toolCall(ctx, 'bookFlight', { flightId: DEMO_FLIGHT.id }, {
          ok: true,
          result: `Ucus ${DEMO_FLIGHT.id} rezerve edildi.`,
        }),
        ...textMessage(ctx, 'Rezervasyonu tamamladim.'),
        finished(ctx),
      ]

    case 'interrupt':
      // Run TEMIZCE biter; cevap bir SONRAKI run'a resume olarak girer.
      return [
        started(ctx),
        ...toolCall(ctx, 'cancelFlight', { flightId: DEMO_FLIGHT.id }),
        finished(ctx, {
          type: 'interrupt',
          interrupts: [
            {
              id: `suspend:${ctx.runId}:${ctx.id('call-cancelFlight')}`,
              reason: 'tool_suspended',
              responseSchema: {
                type: 'object',
                properties: { approved: { type: 'boolean' } },
                required: ['approved'],
                additionalProperties: false,
              },
              metadata: {
                suspendPayload: {
                  message: `Ucus ${DEMO_FLIGHT.id} iptal edilsin mi?`,
                  options: [
                    { id: 'accept', label: 'Onayla', payload: { approved: true }, variant: 'danger' },
                    { id: 'decline', label: 'Vazgec', payload: { approved: false } },
                  ],
                },
              },
            },
          ],
        }),
      ]

    case 'steps':
      return [
        started(ctx),
        { type: EventType.STEP_STARTED, stepName: 'findFlights' } as BaseEvent,
        ...toolCall(ctx, 'searchFlights', { from: 'Graz', to: 'Roma' }, [DEMO_FLIGHT]),
        { type: EventType.STEP_FINISHED, stepName: 'findFlights' } as BaseEvent,
        { type: EventType.STEP_STARTED, stepName: 'findHotels' } as BaseEvent,
        { type: EventType.STEP_FINISHED, stepName: 'findHotels' } as BaseEvent,
        { type: EventType.STEP_STARTED, stepName: 'finalize' } as BaseEvent,
        ...textMessage(ctx, 'Plan hazir.'),
        { type: EventType.STEP_FINISHED, stepName: 'finalize' } as BaseEvent,
        finished(ctx),
      ]

    case 'state':
      // Plan mutasyonu tool KARTI olarak degil, yeni STATE olarak gelir.
      return [
        started(ctx),
        ...toolCall(ctx, 'findHotels', { city: 'Roma' }, [{ id: 'grand-hotel-rom', stars: 5 }]),
        {
          type: EventType.STATE_SNAPSHOT,
          snapshot: {
            summary: 'Graz -> Roma, 3 gun',
            flights: [DEMO_FLIGHT],
            hotels: [{ id: 'grand-hotel-rom', city: 'Roma', stars: 5 }],
          },
        } as BaseEvent,
        ...textMessage(ctx, 'Oteli degistirdim.'),
        finished(ctx),
      ]
  }
}

/** AG-UI tel bicimi: her olay bir `data:` satiri, bos satirla biter. */
export function encodeSse(events: readonly BaseEvent[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
}

export type { Message }
