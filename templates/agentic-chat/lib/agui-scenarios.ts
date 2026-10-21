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
  | 'interrupt' // onay: sonucsuz frontend tool cagrisi -> useHumanInTheLoop
  | 'steps'     // STEP_* workflow ilerlemesi
  | 'state'     // STATE_SNAPSHOT paylasilan state

export const SCENARIOS: readonly ScenarioName[] = [
  'text', 'tool', 'widget', 'card', 'interrupt', 'steps', 'state',
] as const

export function isScenario(value: string | null): value is ScenarioName {
  return value !== null && (SCENARIOS as readonly string[]).includes(value)
}

/**
 * Istenen senaryo + gelen gecmis -> yayinlanacak senaryo.
 *
 * Son mesaj bir TOOL sonucuysa bu, frontend tool'unun (onay cevabi, arama)
 * takip run'idir: metinle kapat. Yoksa `?scenario=interrupt` sabitken her onay
 * cevabi YENI bir onay sorusu dogurur ve sohbet sonsuz donguye girer.
 */
export function pickScenario(requested: string | null, lastRole: string | undefined): ScenarioName {
  if (lastRole === 'tool') return 'text'
  return isScenario(requested) ? requested : 'text'
}

interface Ctx {
  threadId: string
  runId: string
  /** Deterministik id uretici — testlerin sabit id beklemesi icin. */
  id: (label: string) => string
}

const started = (c: Ctx): BaseEvent =>
  ({ type: EventType.RUN_STARTED, threadId: c.threadId, runId: c.runId }) as BaseEvent

const finished = (c: Ctx): BaseEvent =>
  ({ type: EventType.RUN_FINISHED, threadId: c.threadId, runId: c.runId }) as BaseEvent

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
      return [started(ctx), ...textMessage(ctx, 'Merhaba. Nasıl yardımcı olabilirim?'), finished(ctx)]

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
        ...textMessage(ctx, 'İşte uçuşun:'),
        ...toolCall(ctx, 'flightWidget', DEMO_FLIGHT),
        finished(ctx),
      ]

    case 'card':
      // Sunucu tool'u: sonuc string olarak gelir -> action card onu cozmeli
      return [
        started(ctx),
        ...toolCall(ctx, 'bookFlight', { flightId: DEMO_FLIGHT.id }, {
          ok: true,
          result: `Uçuş ${DEMO_FLIGHT.id} rezerve edildi.`,
        }),
        ...textMessage(ctx, 'Rezervasyonu tamamladım.'),
        finished(ctx),
      ]

    case 'interrupt':
      // Onay = SONUCSUZ frontend tool cagrisi (snippets/agent-approval.tsx).
      // Istemci soruyu cizer; cevap ({ optionId }) bir SONRAKI run'a TOOL
      // MESAJI olarak girer, anlami sunucu sabit eslemeyle cozer (accept = onay).
      // Argumanlar onay semasina uyar: hedef + aciklama; dugmeler istemcide sabit.
      // RUN_FINISHED'a interrupt outcome KONMAZ: useHumanInTheLoop `resume`
      // gondermez, acik kalan interrupt sonraki her run'i "pending interrupt(s)
      // not addressed by resume" ile durdurur (CopilotKit 1.69.2'de olculdu).
      return [
        started(ctx),
        ...toolCall(ctx, 'cancelFlight', {
          flightId: DEMO_FLIGHT.id,
          message: 'Kullanıcı bu rezervasyonun iptalini istedi.',
        }),
        finished(ctx),
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
        ...textMessage(ctx, 'Plan hazır.'),
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
            summary: 'Graz → Roma, 3 gün',
            flights: [DEMO_FLIGHT],
            hotels: [{ id: 'grand-hotel-rom', city: 'Roma', stars: 5 }],
          },
        } as BaseEvent,
        ...textMessage(ctx, 'Oteli değiştirdim.'),
        finished(ctx),
      ]
  }
}

/** AG-UI tel bicimi: her olay bir `data:` satiri, bos satirla biter. */
export function encodeSse(events: readonly BaseEvent[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
}

export type { Message }
