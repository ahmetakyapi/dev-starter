import { EventType, type BaseEvent, type RunAgentInput } from '@ag-ui/core'

export const maxDuration = 60

function sse(events: BaseEvent[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const e of events) c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`))
      c.close()
    },
  })
}

export async function POST(request: Request): Promise<Response> {
  const input = (await request.json()) as RunAgentInput
  const { threadId, runId } = input
  const messageId = crypto.randomUUID()

  const events: BaseEvent[] = [
    { type: EventType.RUN_STARTED, threadId, runId } as BaseEvent,
    { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' } as BaseEvent,
    { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: 'Merhaba' } as BaseEvent,
    { type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent,
    { type: EventType.RUN_FINISHED, threadId, runId } as BaseEvent,
  ]

  return new Response(sse(events), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
