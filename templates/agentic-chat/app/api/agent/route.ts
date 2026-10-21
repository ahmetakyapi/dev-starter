/**
 * AG-UI mock endpoint — anahtarsiz, modelsiz.
 *
 * Gecerli AG-UI olaylarini SSE olarak yayinlar. Amaci protokolu GORUNUR
 * kilmak: devtools > Network > EventStream ile her olayi izleyebilirsin.
 *
 * Senaryo secimi:  POST /api/agent?scenario=tool
 * Varsayilan:      text
 *
 * Gercek agent'a gecis: bu dosya SILINMEZ, kimlik dogrulayan VEKILE donusur.
 * Tarayici hep ayni kokene (/api/agent) konusur; route `await auth()` (yoksa
 * 401), kullanici basina hiz siniri + token butcesi uygular ve istegi sunucu
 * tarafi `AGENT_URL`e sunucu sirri ve kullanici kimligiyle iletir
 * (rules/agentic-ui.md 1, 2, 9). Dis adresi NEXT_PUBLIC_ degiskenine yazmak
 * agent'i kimliksiz ve butcesiz herkese acar.
 */

import { RunAgentInputSchema } from '@ag-ui/core'

import { buildScenario, encodeSse, pickScenario } from '@/lib/agui-scenarios'

// Agent run'lari uzayabilir. Gercek bir agent baglamadan ONCE bu degeri
// hesabinin fonksiyon sure limitiyle karsilastir. -> templates README
export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  // Govde bir cast degil, protokolun KENDI semasiyla dogrulanir: bozuk JSON
  // 500 olmasin, kimliksiz govde gecersiz olay akisi uretmesin.
  const parsed = RunAgentInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new Response('Geçersiz istek', { status: 400 })
  const input = parsed.data

  const scenario = pickScenario(
    new URL(request.url).searchParams.get('scenario'),
    input.messages.at(-1)?.role,
  )

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
