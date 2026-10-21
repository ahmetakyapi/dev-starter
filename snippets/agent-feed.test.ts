/**
 * agent-feed-core testleri — modelsiz, sunucusuz, bagimliliksiz.
 *
 * Akisin guvenini tasiyan uc sey burada sabitlenir:
 *   1) bozuk ya da tehlikeli oge kart olmaz (parse)
 *   2) siralama ve sponsorlu yerlesimi KOD belirler (selectFeed)
 *   3) "yapildi" yalnizca sunucu gercekten ozet dondurdugunde denir (reducer + parseActionResult)
 */

import { describe, expect, it } from 'vitest'

import {
  feedHeadline,
  feedReducer,
  greetingFor,
  initFeed,
  parseActionResult,
  parseFeedItem,
  parseSponsoredItem,
  selectFeed,
  type FeedItem,
  type SponsoredItem,
} from './agent-feed-core'

const conflict = {
  id: 'cal-1',
  lane: 'needs-you',
  source: 'Takvim',
  status: 'Seni Bekliyor',
  title: "14:00'teki Priya toplantın Contoso ziyaretiyle çakışıyor",
  reason: "Contoso ziyareti 13:30'a aldı. Priya perşembe 14:00'te boş.",
  createdAt: '2026-10-14T08:02:00Z',
  timeLabel: '08:02',
  priority: 3,
  body: { type: 'text' },
  actions: [
    { id: 'move', label: "Perşembe 14:00'e Taşı", emphasis: 'primary', reversibility: 'reversible' },
  ],
}

const draft = {
  id: 'mail-1',
  lane: 'needs-you',
  source: 'Posta',
  status: 'Taslak Hazır',
  title: 'Dana Q3 teklifini bekliyor',
  reason: 'Dün 16:12’de sordu. Cumaya kadar göndereceğini söylemiştin.',
  createdAt: '2026-10-14T07:48:00Z',
  priority: 2,
  body: { type: 'draft', to: 'Dana Liu', subject: 'Q3 teklifi', text: 'Merhaba Dana,\nTeklif ekte.' },
  actions: [{ id: 'send', label: 'Gönder', emphasis: 'primary', reversibility: 'irreversible' }],
}

const focus = {
  id: 'cal-2',
  lane: 'suggestion',
  source: 'Takvim',
  status: 'Öneri',
  title: 'Cuma sabahı odak bloğu açalım mı?',
  reason: 'Perşembe altı saat toplantı var, Contoso sunumu cuma teslim.',
  createdAt: '2026-10-14T09:00:00Z',
  priority: 1,
  actions: [{ id: 'add', label: 'Takvime Ekle', emphasis: 'primary', reversibility: 'reversible' }],
}

const autoHandled = {
  id: 'xls-1',
  lane: 'handled',
  source: 'Excel',
  status: 'Paylaşıldı',
  title: 'Q3 Batı özetini ekibinle paylaştım',
  reason: 'Pazartesi satış toplantısı takviminde.',
  createdAt: '2026-10-14T06:30:00Z',
  priority: 0,
  undoToken: 'u-xls-1',
  actions: [],
}

const ad: SponsoredItem = {
  id: 'ad-1',
  sponsor: 'Lokanta',
  title: 'Contoso ofisine 5 dakika',
  reason: 'Perşembe öğlen Contoso ziyaretin var.',
  href: 'https://example.com/lokanta',
}

const items = [conflict, draft, focus, autoHandled].map(parseFeedItem).filter((i): i is FeedItem => i !== null)

describe('parseFeedItem', () => {
  it('gecerli ogeleri kabul eder', () => {
    expect(items).toHaveLength(4)
    expect(items[1]?.body).toEqual(draft.body)
  })

  it('gerekcesiz ogeyi reddeder — seffaflik kurali', () => {
    expect(parseFeedItem({ ...conflict, reason: '' })).toBeNull()
  })

  it('karar bekleyen ama aksiyonsuz ogeyi reddeder', () => {
    expect(parseFeedItem({ ...conflict, actions: [] })).toBeNull()
  })

  it('tek bozuk aksiyon tum ogeyi reddeder — eksik dugmeli kart yaniltir', () => {
    expect(parseFeedItem({ ...conflict, actions: [...conflict.actions, { id: 'x', label: 'X' }] })).toBeNull()
  })

  it('handled ogeden aksiyonlari atar, karar ogesinden undoToken atar', () => {
    expect(parseFeedItem({ ...autoHandled, actions: conflict.actions })?.actions).toEqual([])
    expect(parseFeedItem({ ...conflict, undoToken: 'x' })?.undoToken).toBeUndefined()
  })

  it('kapanmis karar kulvarini ve aksiyonlarini korur, Geri Al tasir', () => {
    const closed = parseFeedItem({ ...conflict, resolvedSummary: 'Perşembeye taşıdım', undoToken: 'u1' })
    expect(closed).toMatchObject({ lane: 'needs-you', resolvedSummary: 'Perşembeye taşıdım', undoToken: 'u1' })
    expect(closed?.actions).toHaveLength(1)
    // handled ogede kapanis ozeti alani anlamsiz: baslik zaten ozettir
    expect(parseFeedItem({ ...autoHandled, resolvedSummary: 'x' })?.resolvedSummary).toBeUndefined()
  })

  it('onceligi 0..3 araligina kirpar', () => {
    expect(parseFeedItem({ ...conflict, priority: 99 })?.priority).toBe(3)
  })

  it('seri ile uyusmayan etiketleri atar', () => {
    const metric = parseFeedItem({
      ...focus,
      body: { type: 'metric', value: '4,2 Mn $', series: [1, 2, 3], seriesLabels: ['Ç1', 'Ç2'] },
    })
    expect(metric?.body.type === 'metric' && metric.body.seriesLabels).toBeUndefined()
  })
})

describe('parseSponsoredItem', () => {
  it('etiketli, https baglantili oneriyi kabul eder', () => {
    expect(parseSponsoredItem(ad)).toEqual(ad)
  })

  it('aksiyon tasiyan sponsorlu ogeyi reddeder — reklam kullanici adina is yapamaz', () => {
    expect(parseSponsoredItem({ ...ad, actions: conflict.actions })).toBeNull()
  })

  it('https olmayan baglantiyi reddeder', () => {
    expect(parseSponsoredItem({ ...ad, href: 'javascript:alert(1)' })).toBeNull()
    expect(parseSponsoredItem({ ...ad, href: 'http://example.com' })).toBeNull()
  })
})

describe('parseActionResult', () => {
  it('string JSON ve nesneyi ayni cozer', () => {
    const r = { ok: true, summary: "Priya ile 1:1'i perşembe 14:00'e taşıdım", undoToken: 'u1' }
    expect(parseActionResult(JSON.stringify(r))).toEqual(r)
    expect(parseActionResult(r)).toEqual(r)
  })

  it('ok:true ama ozetsiz sonuca "basarili" demez', () => {
    expect(parseActionResult({ ok: true })).toEqual({ ok: false, error: 'Sonuç okunamadı' })
  })

  it('gecersiz JSON ve beklenmeyen sekli hata sayar', () => {
    expect(parseActionResult('<html>')).toMatchObject({ ok: false })
    expect(parseActionResult(null)).toMatchObject({ ok: false })
  })
})

describe('selectFeed', () => {
  it('kulvarlari ayirir ve onceligi koda gore siralar', () => {
    const view = selectFeed(initFeed(items))
    expect(view.needsYou.map((e) => e.item.id)).toEqual(['cal-1', 'mail-1'])
    expect(view.suggestions.map((e) => e.item.id)).toEqual(['cal-2'])
    expect(view.handled.map((e) => e.item.id)).toEqual(['xls-1'])
  })

  it('sponsorlu ogeyi tavanla sinirlar', () => {
    const view = selectFeed(initFeed(items), [ad, { ...ad, id: 'ad-2' }, { ...ad, id: 'ad-3' }])
    expect(view.sponsored).toHaveLength(2)
  })

  it('bos akisi reklamla doldurmaz', () => {
    const view = selectFeed(initFeed(items.slice(0, 1)), [ad])
    expect(view.sponsored).toEqual([])
  })
})

describe('feedReducer', () => {
  it('onay → bekliyor → halledildi; ozet sunucudan gelir', () => {
    let s = initFeed(items)
    s = feedReducer(s, { type: 'start', id: 'cal-1', actionId: 'move' })
    expect(s.entries[0]?.phase).toBe('pending')
    s = feedReducer(s, { type: 'succeed', id: 'cal-1', summary: 'Taşındı', undoToken: 'u1' })
    const view = selectFeed(s)
    expect(view.needsYou.map((e) => e.item.id)).toEqual(['mail-1'])
    expect(view.handled.find((e) => e.item.id === 'cal-1')).toMatchObject({ summary: 'Taşındı', undoToken: 'u1' })
  })

  it('bekleyen ogeye ikinci tik ikinci istek baslatmaz', () => {
    const s1 = feedReducer(initFeed(items), { type: 'start', id: 'cal-1', actionId: 'move' })
    expect(feedReducer(s1, { type: 'start', id: 'cal-1', actionId: 'move' })).toBe(s1)
  })

  it('hata karti yerinde tutar, tekrar denenebilir', () => {
    let s = feedReducer(initFeed(items), { type: 'start', id: 'mail-1', actionId: 'send' })
    s = feedReducer(s, { type: 'fail', id: 'mail-1', error: 'Gönderilemedi' })
    expect(s.entries[1]).toMatchObject({ phase: 'error', error: 'Gönderilemedi' })
    expect(feedReducer(s, { type: 'start', id: 'mail-1', actionId: 'send' }).entries[1]?.phase).toBe('pending')
  })

  it('kullanicinin onayladigi isi geri alinca kart karar beklemeye doner', () => {
    let s = feedReducer(initFeed(items), { type: 'start', id: 'cal-1', actionId: 'move' })
    s = feedReducer(s, { type: 'succeed', id: 'cal-1', summary: 'Taşındı', undoToken: 'u1' })
    s = feedReducer(s, { type: 'undo', id: 'cal-1' })
    expect(selectFeed(s).needsYou.map((e) => e.item.id)).toContain('cal-1')
  })

  it('ajanin kendi yaptigi isi geri alinca satir kalir, Geri Al kaybolur', () => {
    const s = feedReducer(initFeed(items), { type: 'undo', id: 'xls-1' })
    const row = selectFeed(s).handled.find((e) => e.item.id === 'xls-1')
    expect(row?.undoToken).toBeUndefined()
    expect(row?.summary).toMatch(/^Geri alındı/)
  })

  it('undoToken olmadan geri alma yapmaz', () => {
    let s = feedReducer(initFeed(items), { type: 'start', id: 'cal-1', actionId: 'move' })
    s = feedReducer(s, { type: 'succeed', id: 'cal-1', summary: 'Taşındı' })
    expect(feedReducer(s, { type: 'undo', id: 'cal-1' })).toBe(s)
  })

  it('gecilen oge listeden cikar ve geri getirilebilir', () => {
    let s = feedReducer(initFeed(items), { type: 'dismiss', id: 'cal-2' })
    expect(selectFeed(s).suggestions).toEqual([])
    expect(selectFeed(s).lastDismissed?.item.id).toBe('cal-2')
    s = feedReducer(s, { type: 'undo', id: 'cal-2' })
    expect(selectFeed(s).suggestions.map((e) => e.item.id)).toEqual(['cal-2'])
  })

  it('son gecilen EN SON gecilendir, listedeki son oge degil', () => {
    // Ekranda yukaridan asagi gecmek liste sirasinin tersine gidebilir
    let s = feedReducer(initFeed(items), { type: 'dismiss', id: 'cal-2' })
    s = feedReducer(s, { type: 'dismiss', id: 'cal-1' })
    expect(selectFeed(s).lastDismissed?.item.id).toBe('cal-1')
    s = feedReducer(s, { type: 'undo', id: 'cal-1' })
    expect(selectFeed(s).lastDismissed?.item.id).toBe('cal-2')
  })

  it('yeniden yuklenen kapanmis karar Geri Al ile karara doner', () => {
    // Sunucu karari yeniden acar; istemci de acmali (sayfa yenilendikten sonra da)
    const closed = parseFeedItem({ ...conflict, resolvedSummary: 'Perşembeye taşıdım', undoToken: 'u1' })!
    let s = initFeed([closed])
    expect(selectFeed(s).handled[0]).toMatchObject({ summary: 'Perşembeye taşıdım', undoToken: 'u1' })
    expect(selectFeed(s).needsYou).toEqual([])
    s = feedReducer(s, { type: 'undo', id: 'cal-1' })
    expect(selectFeed(s).needsYou.map((e) => e.item.id)).toEqual(['cal-1'])
    expect(selectFeed(s).handled).toEqual([])
  })

  it('basarisiz Geri Al satirda gorunur hata birakir, basarili olan temizler', () => {
    let s = feedReducer(initFeed(items), { type: 'undo-fail', id: 'xls-1', error: 'Geri alma süresi doldu' })
    expect(selectFeed(s).handled[0]).toMatchObject({ error: 'Geri alma süresi doldu', undoToken: 'u-xls-1' })
    s = feedReducer(s, { type: 'undo', id: 'xls-1' })
    expect(selectFeed(s).handled[0]?.error).toBeUndefined()
    // Acik karta "geri alma hatasi" yazilmaz
    expect(feedReducer(s, { type: 'undo-fail', id: 'cal-1', error: 'x' }).entries[0]?.error).toBeUndefined()
  })

  it('yalnizca taslak ogeler duzenlenir', () => {
    let s = feedReducer(initFeed(items), { type: 'edit', id: 'mail-1', text: 'Yeni metin' })
    expect(s.entries[1]?.draftText).toBe('Yeni metin')
    s = feedReducer(s, { type: 'edit', id: 'cal-1', text: 'x' })
    expect(s.entries[0]?.draftText).toBeUndefined()
  })
})

describe('metin', () => {
  it('saate gore selamlar', () => {
    expect(greetingFor(8)).toBe('Günaydın')
    expect(greetingFor(14)).toBe('İyi Günler')
    expect(greetingFor(20)).toBe('İyi Akşamlar')
    expect(greetingFor(2)).toBe('İyi Geceler')
  })

  it('basligi kurar — sayidan sonra cogul eki yok', () => {
    const view = selectFeed(initFeed(items))
    expect(feedHeadline(view)).toBe('2 iş seni bekliyor. Gerisi halledildi.')
    expect(feedHeadline({ needsYou: [], handled: [] })).toBe('Seni bekleyen iş yok.')
  })
})
