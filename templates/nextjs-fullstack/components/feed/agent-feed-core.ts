/**
 * agent-feed-core — Proaktif AI akisinin sozlesmesi ve saf mantigi
 *
 * Sohbet kullanicidan emek ister: agent'in ne yapabildigini kesfet, isi anlat,
 * baglami ver, tekrarla. Akis bunu tersine cevirir: kullaniciyi taniyan sistem
 * SIRADAKI YARARLI ISI hazirlayip getirir; kullanici onaylar, duzenler, geçer
 * ya da sohbete atlayip derinlesir. Prompt yazmadan agent'in neler yapabildigini
 * boyle kesfeder.
 *
 * Bu dosya UI'siz ve bagimliliksizdir (zod bile yok) — kok `npm test` ile
 * calisir. Arayuz: snippets/agent-feed.tsx
 *
 * Uc kulvar:
 *   needs-you  → kullanicinin karari olmadan ilerlemeyen is (cakisma, taslak)
 *   suggestion → yapilsa iyi olur, yapilmasa bir sey bozulmaz (odak blogu)
 *   handled    → agent GERI ALINABILIR isi kendisi yapti; Geri Al sunulur
 *
 * Sponsorlu oge AYRI tiptir ve tipi geregi aksiyon tasiyamaz: bir reklam,
 * kullanici adina hicbir sey tetikleyemez. Yalnizca https baglantisi acar.
 *
 * Kurallar: rules/agentic-ui.md — 4 (aksiyon sinifi), 5 (sonuc string'dir),
 *           7 (siralama koddur, model ciktisi degil), 10 (seffaflik: `reason`)
 * Desen:    knowledge/patterns.md -> AI Feed
 */

// --- Sozlesme -----------------------------------------------------------------

export type FeedLane = 'needs-you' | 'suggestion' | 'handled'

export type FeedAction = {
  id: string
  /** Title Case, fiille baslar: "Perşembe 14:00'e Taşı" */
  label: string
  emphasis: 'primary' | 'secondary'
  /**
   * Geri alinamaz aksiyon (e-posta gonderimi, odeme) kartta acikca isaretlenir.
   * Kartin kendisi onden onaydir: kullanici taslagin tamamini gorup basar.
   */
  reversibility: 'reversible' | 'irreversible'
}

export type FeedBody =
  | { type: 'text' }
  | { type: 'draft'; to: string; subject: string; text: string }
  | {
      type: 'metric'
      /** SUNUCUDA bicimlenmis deger ("4,2 Mn $"). Model hesaplamaz -> kural 7 */
      value: string
      delta?: string
      note?: string
      series?: number[]
      seriesLabels?: string[]
    }

export type FeedItem = {
  id: string
  lane: FeedLane
  /** Kaynak uygulama: "Takvim", "Posta", "Excel" */
  source: string
  /** Durum etiketi: "Seni Bekliyor", "Taslak Hazır", "Özet Hazır" */
  status: string
  title: string
  /** NEDEN burada? Seffaflik kurali — gerekcesiz oge akisa girmez */
  reason: string
  /** Siralama icin ISO zaman */
  createdAt: string
  /** Kullanicinin saat diliminde SUNUCUDA bicimlenir (hidrasyon farki olmasin) */
  timeLabel?: string
  /** 0..3 — uretici KOD belirler, model degil */
  priority: number
  body: FeedBody
  actions: FeedAction[]
  /**
   * handled kulvarinda ya da kapanmis kararda: yapilan is geri alinabiliyorsa
   */
  undoToken?: string
  /**
   * Kapanmis KARAR (needs-you/suggestion): kapanis ozeti. Oge kendi kulvarini,
   * basligini ve aksiyonlarini KORUR, 'handled' satiri olarak acilir; Geri Al
   * karti karara dondurur. Kulvar 'handled'a cevrilseydi sayfa yenilendikten
   * sonra geri alma, sunucunun yeniden actigi karari istemcide kaybederdi.
   */
  resolvedSummary?: string
}

export type SponsoredItem = {
  id: string
  sponsor: string
  title: string
  /** Neden bu oneri: "Perşembe Contoso ziyaretin var" */
  reason: string
  href: string
}

export type ActionResult =
  | { ok: true; summary: string; undoToken?: string }
  | { ok: false; error: string }

// --- Guvenli cozumleme (tel uzerinde her sey unknown) -> mistakes.md #58 -------

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
const optStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

const LANES: readonly FeedLane[] = ['needs-you', 'suggestion', 'handled']

function parseAction(raw: unknown): FeedAction | null {
  if (!isObj(raw)) return null
  const id = str(raw.id)
  const label = str(raw.label)
  if (!id || !label) return null
  if (raw.emphasis !== 'primary' && raw.emphasis !== 'secondary') return null
  if (raw.reversibility !== 'reversible' && raw.reversibility !== 'irreversible') return null
  return { id, label, emphasis: raw.emphasis, reversibility: raw.reversibility }
}

function parseBody(raw: unknown): FeedBody | null {
  if (!isObj(raw)) return null
  if (raw.type === 'text') return { type: 'text' }
  if (raw.type === 'draft') {
    const to = str(raw.to)
    const subject = optStr(raw.subject)
    const text = str(raw.text)
    if (!to || subject === undefined || !text) return null
    return { type: 'draft', to, subject, text }
  }
  if (raw.type === 'metric') {
    const value = str(raw.value)
    if (!value) return null
    const series = Array.isArray(raw.series) && raw.series.every((n) => typeof n === 'number' && Number.isFinite(n))
      ? (raw.series as number[])
      : undefined
    const labels = Array.isArray(raw.seriesLabels) && raw.seriesLabels.every((s) => typeof s === 'string')
      ? (raw.seriesLabels as string[])
      : undefined
    return {
      type: 'metric',
      value,
      delta: optStr(raw.delta),
      note: optStr(raw.note),
      series,
      // Etiket sayisi seriyle uyusmuyorsa hic gosterme — yanlis etiket, etiketsizden kotudur
      seriesLabels: labels && series && labels.length === series.length ? labels : undefined,
    }
  }
  return null
}

/** Gecersiz oge `null` doner — yarim kart cizmektense hic cizme. */
export function parseFeedItem(raw: unknown): FeedItem | null {
  if (!isObj(raw)) return null
  const id = str(raw.id)
  const source = str(raw.source)
  const status = str(raw.status)
  const title = str(raw.title)
  const reason = str(raw.reason)
  const createdAt = str(raw.createdAt)
  if (!id || !source || !status || !title || !reason || !createdAt) return null
  if (Number.isNaN(Date.parse(createdAt))) return null
  if (!LANES.includes(raw.lane as FeedLane)) return null
  const lane = raw.lane as FeedLane

  const body = parseBody(raw.body ?? { type: 'text' })
  if (!body) return null

  const rawActions = Array.isArray(raw.actions) ? raw.actions : []
  const actions = rawActions.map(parseAction)
  // Tek bir bozuk aksiyon varsa ogeyi reddet: eksik dugmeli kart yaniltir
  if (actions.some((a) => a === null)) return null

  const priority = typeof raw.priority === 'number' ? Math.min(3, Math.max(0, Math.round(raw.priority))) : 0
  const resolvedSummary = lane !== 'handled' ? str(raw.resolvedSummary) : undefined

  const item: FeedItem = {
    id,
    lane,
    source,
    status,
    title,
    reason,
    createdAt,
    timeLabel: optStr(raw.timeLabel),
    priority,
    body,
    actions: actions as FeedAction[],
    // Acik karar Geri Al tasimaz: geri alinacak bir sey henuz yapilmadi
    undoToken: lane === 'handled' || resolvedSummary ? str(raw.undoToken) : undefined,
    resolvedSummary,
  }

  // Karar bekleyen oge aksiyonsuz olamaz; handled oge aksiyon tasimaz
  if (lane !== 'handled' && item.actions.length === 0) return null
  if (lane === 'handled') item.actions = []
  return item
}

export function parseSponsoredItem(raw: unknown): SponsoredItem | null {
  if (!isObj(raw)) return null
  // Aksiyon tasiyan "sponsorlu" oge reddedilir: reklam kullanici adina is yapamaz
  if ('actions' in raw || 'undoToken' in raw) return null
  const id = str(raw.id)
  const sponsor = str(raw.sponsor)
  const title = str(raw.title)
  const reason = str(raw.reason)
  const href = str(raw.href)
  if (!id || !sponsor || !title || !reason || !href) return null
  try {
    if (new URL(href).protocol !== 'https:') return null
  } catch {
    return null
  }
  return { id, sponsor, title, reason, href }
}

/** Sunucu aksiyonunun ya da tool'un sonucu: string (JSON) veya nesne. */
export function parseActionResult(raw: unknown): ActionResult {
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'Sonuç okunamadı' }
    }
  }
  if (!isObj(value) || typeof value.ok !== 'boolean') return { ok: false, error: 'Sonuç okunamadı' }
  if (!value.ok) return { ok: false, error: str(value.error) ?? 'İşlem tamamlanamadı' }
  const summary = str(value.summary)
  // "ok: true" ama ozet yok: basarili DEME. Kullaniciya ne yapildigini soyleyemiyorsak
  // yapildigini da iddia edemeyiz.
  if (!summary) return { ok: false, error: 'Sonuç okunamadı' }
  return { ok: true, summary, undoToken: str(value.undoToken) }
}

// --- Istemci durumu (saf reducer) --------------------------------------------

export type FeedPhase = 'idle' | 'pending' | 'error' | 'handled' | 'dismissed'

export type FeedEntry = {
  item: FeedItem
  phase: FeedPhase
  /** pending iken basilan aksiyon */
  actionId?: string
  error?: string
  /** handled: kullaniciya gosterilen tek satir */
  summary?: string
  undoToken?: string
  /** Kullanicinin duzenledigi taslak metni */
  draftText?: string
  /** Gecilme sirasi: "Son gecilen" listedeki son ogeyi degil, EN SON geceni gostersin */
  dismissedSeq?: number
}

export type FeedState = { entries: FeedEntry[] }

export type FeedEvent =
  | { type: 'start'; id: string; actionId: string }
  | { type: 'succeed'; id: string; summary: string; undoToken?: string }
  | { type: 'fail'; id: string; error: string }
  | { type: 'dismiss'; id: string }
  | { type: 'undo'; id: string }
  | { type: 'undo-fail'; id: string; error: string }
  | { type: 'edit'; id: string; text: string }

export function initFeed(items: readonly FeedItem[]): FeedState {
  return {
    entries: items.map((item) =>
      item.lane === 'handled' || item.resolvedSummary !== undefined
        ? { item, phase: 'handled', summary: item.resolvedSummary ?? item.title, undoToken: item.undoToken }
        : { item, phase: 'idle' },
    ),
  }
}

function patch(state: FeedState, id: string, fn: (e: FeedEntry) => FeedEntry): FeedState {
  let changed = false
  const entries = state.entries.map((e) => {
    if (e.item.id !== id) return e
    const next = fn(e)
    if (next !== e) changed = true
    return next
  })
  return changed ? { entries } : state
}

export function feedReducer(state: FeedState, event: FeedEvent): FeedState {
  switch (event.type) {
    case 'start':
      return patch(state, event.id, (e) =>
        // Ayni ogeye ikinci tik ikinci istek atmaz
        e.phase === 'idle' || e.phase === 'error'
          ? { ...e, phase: 'pending', actionId: event.actionId, error: undefined }
          : e,
      )
    case 'succeed':
      return patch(state, event.id, (e) =>
        e.phase === 'pending'
          ? {
              ...e,
              phase: 'handled',
              summary: event.summary,
              undoToken: event.undoToken,
              actionId: undefined,
            }
          : e,
      )
    case 'fail':
      return patch(state, event.id, (e) =>
        e.phase === 'pending' ? { ...e, phase: 'error', error: event.error, actionId: undefined } : e,
      )
    case 'dismiss': {
      // Sayac state'ten gelir (Date.now degil): reducer saf kalir, test sabit
      const seq = Math.max(0, ...state.entries.map((e) => e.dismissedSeq ?? 0)) + 1
      return patch(state, event.id, (e) =>
        e.phase === 'idle' || e.phase === 'error'
          ? { ...e, phase: 'dismissed', error: undefined, dismissedSeq: seq }
          : e,
      )
    }
    case 'undo':
      return patch(state, event.id, (e) => {
        if (e.phase === 'dismissed') return { ...e, phase: 'idle', dismissedSeq: undefined }
        if (e.phase !== 'handled' || !e.undoToken) return e
        // Kullanicinin onayladigi is geri alininca kart karar beklemeye doner
        if (e.item.lane !== 'handled') {
          return { ...e, phase: 'idle', summary: undefined, undoToken: undefined, error: undefined }
        }
        // Agent'in kendi yaptigi is: satir yerinde kalir, geri alindigini soyler.
        // Acilan karar (ornegin cakisma) bir sonraki uretimde yeni oge olarak gelir.
        return { ...e, summary: `Geri alındı: ${e.summary ?? e.item.title}`, undoToken: undefined, error: undefined }
      })
    case 'undo-fail':
      // Satir yerinde kalir, hata GORUNUR olur: yalniz ekran okuyucuya soylenen
      // hata, gorende "dugme yanip sondu, bir sey olmadi" hissi birakir.
      return patch(state, event.id, (e) => (e.phase === 'handled' ? { ...e, error: event.error } : e))
    case 'edit':
      return patch(state, event.id, (e) =>
        e.item.body.type === 'draft' && (e.phase === 'idle' || e.phase === 'error') ? { ...e, draftText: event.text } : e,
      )
  }
}

// --- Gorunum: siralama ve gruplama KODDUR -> kural 7 ----------------------------

export type FeedView = {
  needsYou: FeedEntry[]
  suggestions: FeedEntry[]
  handled: FeedEntry[]
  sponsored: SponsoredItem[]
  /** Son gecilen oge — "Geri Al" bildirimi icin */
  lastDismissed?: FeedEntry
}

export type FeedViewOptions = {
  /** Sponsorlu oge tavani */
  sponsoredMax?: number
  /** Bu kadar organik oge yoksa sponsorlu gosterme: bos akis reklamla doldurulmaz */
  sponsoredMinOrganic?: number
}

const byPriorityThenRecent = (a: FeedEntry, b: FeedEntry) =>
  b.item.priority - a.item.priority || Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt)

export function selectFeed(
  state: FeedState,
  sponsored: readonly SponsoredItem[] = [],
  { sponsoredMax = 2, sponsoredMinOrganic = 2 }: FeedViewOptions = {},
): FeedView {
  const open = (e: FeedEntry) => e.phase === 'idle' || e.phase === 'pending' || e.phase === 'error'
  const needsYou = state.entries.filter((e) => open(e) && e.item.lane === 'needs-you').sort(byPriorityThenRecent)
  const suggestions = state.entries.filter((e) => open(e) && e.item.lane === 'suggestion').sort(byPriorityThenRecent)
  // handled: akista kalan sira korunur (yeni cozulen alta degil, listedeki yerine)
  const handled = state.entries.filter((e) => e.phase === 'handled')
  const organic = needsYou.length + suggestions.length + handled.length
  // Liste sirasi gecilme zamani DEGIL (ilk sira korunur): en son gecilen sayactan bulunur
  const dismissed = state.entries
    .filter((e) => e.phase === 'dismissed')
    .sort((a, b) => (a.dismissedSeq ?? 0) - (b.dismissedSeq ?? 0))

  return {
    needsYou,
    suggestions,
    handled,
    sponsored: organic >= sponsoredMinOrganic ? sponsored.slice(0, sponsoredMax) : [],
    lastDismissed: dismissed[dismissed.length - 1],
  }
}

// --- Metin ---------------------------------------------------------------------

/** Saat, kullanicinin saat diliminde SUNUCUDA hesaplanip verilir. */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Günaydın'
  if (hour >= 12 && hour < 18) return 'İyi Günler'
  if (hour >= 18 && hour < 23) return 'İyi Akşamlar'
  return 'İyi Geceler'
}

/** "3 iş seni bekliyor. Gerisi halledildi." — Turkcede sayidan sonra cogul eki yok. */
export function feedHeadline(view: Pick<FeedView, 'needsYou' | 'handled'>): string {
  const waiting = view.needsYou.length
  const first = waiting === 0 ? 'Seni bekleyen iş yok.' : `${waiting} iş seni bekliyor.`
  return view.handled.length > 0 ? `${first} Gerisi halledildi.` : first
}
