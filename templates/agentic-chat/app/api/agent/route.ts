/**
 * AG-UI mock endpoint — anahtarsiz, modelsiz.
 *
 * Gecerli AG-UI olaylarini SSE olarak yayinlar. Amaci protokolu GORUNUR
 * kilmak: devtools > Network > EventStream ile her olayi izleyebilirsin.
 *
 * Senaryo secimi:  POST /api/agent?scenario=tool
 * Varsayilan:      text
 *
 * Gercek agent'a gecis: NEXT_PUBLIC_AGENT_URL doldur, bu dosyayi sil.
 */

import type { RunAgentInput } from '@ag-ui/core'

import { buildScenario, encodeSse, isScenario } from '@/lib/agui-scenarios'

// Agent run'lari uzayabilir. Gercek bir agent baglamadan ONCE bu degeri
// hesabinin fonksiyon sure limitiyle karsilastir. -> templates README
export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  const input = (await request.json()) as RunAgentInput

  const requested = new URL(request.url).searchParams.get('scenario')
  const scenario = isScenario(requested) ? requested : 'text'

  let seq = 0
  const events = buildScenario(scenario, {
    threadId: input.threadId,
    runId: input.runId,
    // Deterministik id: ayni senaryo her zaman ayni akisi uretir, boylece
    // testler sabit degerlere karsi iddia kurabilir.
    id: (label) => `${scenario}-${label}-${seq++}`,
  })

  const payload = new TextEncoder().encode(encodeSse(events))
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(payload)
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
