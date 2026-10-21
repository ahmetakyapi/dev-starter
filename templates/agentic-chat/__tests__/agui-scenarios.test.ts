/**
 * Senaryo fixture'lari AG-UI'in KENDI semasina uyuyor mu?
 *
 * Elle yazilmis olay dizileri sessizce bozulur: bir alan adi degisir, protokol
 * bir alani zorunlu yapar, fixture eskir. Test kutuphanenin RUNTIME semalarina
 * karsi dogrular — tip kontrolunun goremedigi seyi gorur.
 */

import { describe, expect, it } from 'vitest'
import * as agui from '@ag-ui/core'

import { buildScenario, encodeSse, SCENARIOS, isScenario, pickScenario } from '@/lib/agui-scenarios'

// EventType degerinden ilgili Zod semasina: TOOL_CALL_START -> ToolCallStartEventSchema
function schemaFor(type: string): { safeParse: (v: unknown) => { success: boolean; error?: unknown } } | undefined {
  const pascal = type
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
  return (agui as unknown as Record<string, never>)[`${pascal}EventSchema`]
}

const ctx = { threadId: 't-1', runId: 'r-1', id: (l: string) => `id-${l}` }

describe('agui-scenarios', () => {
  it.each(SCENARIOS)('“%s” senaryosunun her olayi semaya uyar', (name) => {
    const events = buildScenario(name, ctx)
    expect(events.length).toBeGreaterThan(0)

    for (const event of events) {
      const schema = schemaFor(event.type)
      expect(schema, `${event.type} icin sema bulunamadi`).toBeDefined()
      const parsed = schema!.safeParse(event)
      expect(parsed.success, `${event.type} semaya uymuyor: ${JSON.stringify(parsed.error)}`).toBe(true)
    }
  })

  it.each(SCENARIOS)('“%s” RUN_STARTED ile baslar, RUN_FINISHED ile biter', (name) => {
    const events = buildScenario(name, ctx)
    expect(events[0].type).toBe(agui.EventType.RUN_STARTED)
    expect(events[events.length - 1].type).toBe(agui.EventType.RUN_FINISHED)
  })

  it('her TOOL_CALL_START kendi TOOL_CALL_END ile kapanir', () => {
    for (const name of SCENARIOS) {
      const events = buildScenario(name, ctx)
      const opened = events.filter((e) => e.type === agui.EventType.TOOL_CALL_START)
      const closed = events.filter((e) => e.type === agui.EventType.TOOL_CALL_END)
      expect(closed.length, `${name}: acilan/kapanan tool cagrisi sayisi`).toBe(opened.length)
    }
  })

  it('frontend tool cagrisi sonuc TASIMAZ, sunucu tool cagrisi tasir', () => {
    // widget = frontend tool -> sonucu istemci uretir, sunucu gondermez
    const widget = buildScenario('widget', ctx)
    expect(widget.some((e) => e.type === agui.EventType.TOOL_CALL_RESULT)).toBe(false)

    // card = sunucu tool'u -> sonuc akista gelir
    const card = buildScenario('card', ctx)
    expect(card.some((e) => e.type === agui.EventType.TOOL_CALL_RESULT)).toBe(true)
  })

  it('onay senaryosu useHumanInTheLoop sozlesmesine uyar: sonucsuz cagri, outcome yok', () => {
    const events = buildScenario('interrupt', ctx)
    // Cevabi istemci uretir (tool mesaji) — sunucu sonuc GONDERMEZ
    expect(events.some((e) => e.type === agui.EventType.TOOL_CALL_RESULT)).toBe(false)
    // Acik interrupt outcome'u, resume gondermeyen istemcide thread'i kilitler
    const last = events[events.length - 1] as unknown as { outcome?: unknown }
    expect(last.outcome).toBeUndefined()

    // Argumanlar onay kartinin semasina uyar: hedef + aciklama, secenek YOK
    // (dugmeler ve id -> anlam istemcide sabit; snippets/agent-approval.tsx)
    const start = events.find((e) => e.type === agui.EventType.TOOL_CALL_START) as unknown as {
      toolCallName: string
    }
    const args = events.find((e) => e.type === agui.EventType.TOOL_CALL_ARGS) as unknown as { delta: string }
    expect(start.toolCallName).toBe('cancelFlight')
    expect(JSON.parse(args.delta)).toEqual({ flightId: expect.any(Number), message: expect.any(String) })
  })

  it('tool sonucuyla gelen takip run i metinle kapanir — onay sonsuz donguye girmez', () => {
    expect(pickScenario('interrupt', 'tool')).toBe('text')
    expect(pickScenario('interrupt', 'user')).toBe('interrupt')
    expect(pickScenario('gecersiz', 'user')).toBe('text')
    expect(pickScenario(null, undefined)).toBe('text')
  })

  it('SSE kodlamasi tel bicimine uyar (data: + bos satir)', () => {
    const encoded = encodeSse(buildScenario('text', ctx))
    expect(encoded.endsWith('\n\n')).toBe(true)
    const frames = encoded.split('\n\n').filter(Boolean)
    for (const frame of frames) {
      expect(frame.startsWith('data: ')).toBe(true)
      expect(() => JSON.parse(frame.slice(6))).not.toThrow()
    }
  })

  it('bilinmeyen senaryo adi reddedilir', () => {
    expect(isScenario('tool')).toBe(true)
    expect(isScenario('gecersiz')).toBe(false)
    expect(isScenario(null)).toBe(false)
  })
})
