/**
 * Protokol contract testi — rules/agentic-ui.md "Test Zorunluluklari" #2
 *
 * Gercek HttpAgent calisir; yalnizca `fetch` degistirilir. Boylece IKI YON de
 * dogrulanir:
 *   giden  -> istemcinin gonderdigi RunAgentInput'un bicimi
 *   gelen  -> gercek SSE byte'larinin cozulup mesaja donmesi
 *
 * Bu test bir IC DAVRANISI degil, TEL UZERINDEKI BICIMI sabitler. CopilotKit
 * veya @ag-ui/client guncellemesi kodlamayi bozarsa burasi patlar — staging'de
 * bir sunucunun fark etmesinden cok once.
 *
 * Sunucu yok, model yok, API anahtari yok.
 */

import { HttpAgent } from '@ag-ui/client'
import { EventType, type RunAgentInput } from '@ag-ui/core'
import { describe, expect, it } from 'vitest'

import { buildScenario, encodeSse, type ScenarioName } from '@/lib/agui-scenarios'

/** Senaryoyu gercek SSE yaniti olarak donduren sahte fetch. */
function mockTransport(scenario: ScenarioName) {
  let sent: RunAgentInput | undefined

  const fetchFn = async (_url: string, init: RequestInit): Promise<Response> => {
    sent = JSON.parse(init.body as string) as RunAgentInput

    let seq = 0
    const events = buildScenario(scenario, {
      threadId: sent.threadId,
      runId: sent.runId,
      id: (label) => `${scenario}-${label}-${seq++}`,
    })

    // Gercek byte'lar — string degil. Stream cozumu de test edilmis olur.
    const payload = new TextEncoder().encode(encodeSse(events))
    return new Response(
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(payload)
          c.close()
        },
      }),
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    )
  }

  return { fetch: fetchFn as never, sent: () => sent }
}

function makeAgent(scenario: ScenarioName) {
  const transport = mockTransport(scenario)
  const agent = new HttpAgent({
    url: 'http://mock.invalid/agent',
    threadId: 'thread-test',
    fetch: transport.fetch,
  })
  return { agent, sent: transport.sent }
}

describe('AG-UI contract', () => {
  it('GIDEN: iyi bicimli bir RunAgentInput gonderir ve kullanici mesajini tasir', async () => {
    const { agent, sent } = makeAgent('text')

    agent.addMessage({ id: 'm-1', role: 'user', content: 'Graz Hamburg ucusu var mi?' })
    await agent.runAgent({ runId: 'run-test' })

    const input = sent()
    expect(input).toBeDefined()
    expect(input!.threadId).toBe('thread-test')
    expect(input!.runId).toBe('run-test')

    const userMessage = input!.messages.find((m) => m.role === 'user')
    expect(userMessage?.content).toBe('Graz Hamburg ucusu var mi?')
  })

  it('GELEN: SSE byte akisi cozulup asistan mesajina donusur', async () => {
    const { agent } = makeAgent('text')

    agent.addMessage({ id: 'm-1', role: 'user', content: 'merhaba' })
    await agent.runAgent({ runId: 'run-test' })

    const assistant = agent.messages.find((m) => m.role === 'assistant')
    // Parca parca gelen delta'lar tek metinde birlesmis olmali
    expect(assistant?.content).toBe('Merhaba. Nasil yardimci olabilirim?')
  })

  it('GELEN: sunucu tool cagrisi ve sonucu gecmise duser', async () => {
    const { agent } = makeAgent('card')

    agent.addMessage({ id: 'm-1', role: 'user', content: 'ucusu rezerve et' })
    await agent.runAgent({ runId: 'run-test' })

    const toolCalls = agent.messages
      .filter((m) => m.role === 'assistant')
      .flatMap((m) => ('toolCalls' in m ? (m.toolCalls ?? []) : []))
    expect(toolCalls.map((c) => c.function.name)).toContain('bookFlight')

    // Sonuc TEL UZERINDE STRING'dir — burasi mistakes.md #58'in kaynagi
    const toolMessage = agent.messages.find((m) => m.role === 'tool')
    expect(typeof toolMessage?.content).toBe('string')
    expect(JSON.parse(toolMessage!.content as string)).toMatchObject({ ok: true })
  })

  it('abone olay akisini sirayla gorur', async () => {
    const { agent } = makeAgent('steps')
    const seen: string[] = []

    agent.addMessage({ id: 'm-1', role: 'user', content: 'plan yap' })
    await agent.runAgent({ runId: 'run-test' }, {
      onEvent: ({ event }) => {
        seen.push(event.type)
      },
    })

    expect(seen[0]).toBe(EventType.RUN_STARTED)
    expect(seen).toContain(EventType.STEP_STARTED)
    expect(seen).toContain(EventType.STEP_FINISHED)
    expect(seen[seen.length - 1]).toBe(EventType.RUN_FINISHED)
  })
})
