/**
 * Frontend tool birim testi — rules/agentic-ui.md "Test Zorunluluklari" #1
 *
 * CIFT IDDIA: her tool testi iki seyi birden dogrular
 *   1) donus degeri  -> modelin gordugu
 *   2) yan etki      -> kullanicinin gordugu
 * Ikisi de dogru olmali. Yalniz birini test etmek, tool'un aciklamasinin
 * vaat ettiginden farkli davranmasina kapi birakir.
 */

import { describe, expect, it, vi } from 'vitest'

import { createFindFlightsHandler } from './agent-tool'

describe('findFlights tool', () => {
  it('aramayi tetikler (yan etki) VE modele ozet doner (donus degeri)', async () => {
    const onSearch = vi.fn()
    const handler = createFindFlightsHandler(onSearch)

    const result = await handler({ from: 'Graz', to: 'Hamburg' })

    // 1) modelin gordugu
    expect(result).toEqual({ ok: true, searched: 'Graz -> Hamburg' })
    // 2) kullanicinin gordugu
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Graz', 'Hamburg')
  })

  it('donus degeri ham veri TASIMAZ — context maliyeti', async () => {
    const handler = createFindFlightsHandler(() => {})
    const result = await handler({ from: 'Graz', to: 'Roma' })

    // Tool sonucu modelin context'ine geri girer. Ucus listesini buradan
    // dondurmek her arama icin token yakar; liste zaten ekranda.
    expect(JSON.stringify(result).length).toBeLessThan(120)
  })
})
