/**
 * agent-feed — Proaktif AI akisi: ajan hazirlar, kullanici karar verir
 *
 * Sohbet ekrani bos bir kutuyla baslar ve kullanicidan ne isteyecegini
 * bilmesini bekler. Akis, sistemin zaten bildigi isi (cakisan toplanti,
 * cevaplanmamis e-posta, gece gelen rakamlar) karara hazir kart olarak getirir.
 * Kullanici: Onayla · Duzenle · Simdi Degil · Sohbette Ac.
 *
 * Mantik ve sozlesme: snippets/agent-feed-core.ts (saf, testli). Bu dosya yalnizca
 * cizer ve sunucu aksiyonlarini cagirir.
 *
 * Kullanim (Server Component sayfasi):
 *   const items = (await getFeed(session.user.id)).map(parseFeedItem).filter(Boolean)
 *   <AgentFeed
 *     name={session.user.firstName}
 *     dateLabel={formatTr(now, tz)}          // "Salı, 14 Ekim" — sunucuda
 *     hour={hourIn(now, tz)}
 *     initialItems={items}
 *     sponsored={ads}
 *     runAction={runFeedAction}              // 'use server' — yetki ORADA
 *     undoAction={undoFeedAction}
 *     dismissAction={dismissFeedItem}
 *   />
 *
 * Guvenlik: runAction istemciden yalnizca { itemId, actionId, draftText } alir.
 * Sunucu ogeyi KENDI veritabanindan okur, sahibini ve aksiyonun o ogeye ait
 * oldugunu dogrular. Istemcinin "su e-postayi su adrese gonder" demesine izin
 * verilmez -> rules/agentic-ui.md 1, 2.
 *
 * Kok agacta <LazyMotion features={domAnimation} strict> olmali (m.* kullanir).
 */

'use client'

import { useId, useReducer, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'

import {
  feedHeadline,
  feedReducer,
  greetingFor,
  initFeed,
  parseActionResult,
  selectFeed,
  type FeedEntry,
  type FeedItem,
  type SponsoredItem,
} from './agent-feed-core'

const EASE = [0.22, 1, 0.36, 1] as const

type RunAction = (input: { itemId: string; actionId: string; draftText?: string }) => Promise<unknown>
type UndoAction = (input: { itemId: string; undoToken: string }) => Promise<unknown>

type AgentFeedProps = {
  name: string
  dateLabel: string
  hour: number
  initialItems: FeedItem[]
  sponsored?: SponsoredItem[]
  runAction: RunAction
  undoAction: UndoAction
  /**
   * Gecilen ogeyi sunucuda hatirla — ayni oneri yarin tekrar gelmesin.
   * "Simdi Degil" bir ertelemedir, silme degil: Geri Al yalnizca yerel listeyi
   * geri getirir; sunucu bu sinyali siralama icin kullanir, ogeyi yok etmez.
   */
  dismissAction?: (itemId: string) => Promise<void>
  /** "Sohbette Aç": ogeyi baglam olarak sohbete tasir */
  onOpenChat?: (item: FeedItem) => void
}

export function AgentFeed({
  name,
  dateLabel,
  hour,
  initialItems,
  sponsored = [],
  runAction,
  undoAction,
  dismissAction,
  onOpenChat,
}: AgentFeedProps) {
  const [state, dispatch] = useReducer(feedReducer, initialItems, initFeed)
  const [announcement, setAnnouncement] = useState('')
  const view = selectFeed(state, sponsored)

  async function act(entry: FeedEntry, actionId: string) {
    const id = entry.item.id
    dispatch({ type: 'start', id, actionId })
    let result
    try {
      result = parseActionResult(await runAction({ itemId: id, actionId, draftText: entry.draftText }))
    } catch {
      result = { ok: false as const, error: 'Bağlantı kurulamadı' }
    }
    if (result.ok) {
      dispatch({ type: 'succeed', id, summary: result.summary, undoToken: result.undoToken })
      setAnnouncement(result.summary)
    } else {
      dispatch({ type: 'fail', id, error: result.error })
      setAnnouncement(result.error)
    }
  }

  async function undo(entry: FeedEntry) {
    if (!entry.undoToken) return
    // Geri Al MODELE UGRAMAZ: dogrudan, deterministik, token'siz
    const result = parseActionResult(await undoAction({ itemId: entry.item.id, undoToken: entry.undoToken }).catch(() => null))
    if (result.ok) {
      dispatch({ type: 'undo', id: entry.item.id })
      setAnnouncement(result.summary)
    } else {
      setAnnouncement(result.error)
    }
  }

  function dismiss(entry: FeedEntry) {
    dispatch({ type: 'dismiss', id: entry.item.id })
    setAnnouncement('Geçildi')
    void dismissAction?.(entry.item.id)
  }

  const cardProps = {
    onAct: act,
    onDismiss: dismiss,
    onEdit: (id: string, text: string) => dispatch({ type: 'edit', id, text }),
    onOpenChat,
  }

  return (
    <section aria-labelledby="feed-heading" className="mx-auto w-full max-w-2xl px-4 py-10">
      <header>
        <p className="text-small text-muted">{dateLabel}</p>
        <h1 id="feed-heading" className="mt-1 text-heading font-semibold tracking-tight text-strong">
          {greetingFor(hour)}, {name}
        </h1>
        <p className="mt-1 text-base text-soft">{feedHeadline(view)}</p>
      </header>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {view.needsYou.map((entry) => (
            <FeedCard key={entry.item.id} entry={entry} {...cardProps} />
          ))}
          {view.suggestions.map((entry) => (
            <FeedCard key={entry.item.id} entry={entry} {...cardProps} />
          ))}
          {view.handled.map((entry) => (
            <HandledRow key={entry.item.id} entry={entry} onUndo={undo} />
          ))}
        </AnimatePresence>
      </ul>

      {view.lastDismissed && (
        <p className="mt-3 flex items-center gap-2 text-small text-muted">
          Son geçilen: {view.lastDismissed.item.title}
          <button
            type="button"
            onClick={() => view.lastDismissed && dispatch({ type: 'undo', id: view.lastDismissed.item.id })}
            className="min-h-11 rounded-md px-2 text-primary-ink underline-offset-4 hover:underline"
          >
            Geri Al
          </button>
        </p>
      )}

      {view.sponsored.length > 0 && <SponsoredRail items={view.sponsored} />}
    </section>
  )
}

// --- Karar karti -----------------------------------------------------------------

type CardProps = {
  entry: FeedEntry
  onAct: (entry: FeedEntry, actionId: string) => void
  onDismiss: (entry: FeedEntry) => void
  onEdit: (id: string, text: string) => void
  onOpenChat?: (item: FeedItem) => void
}

function FeedCard({ entry, onAct, onDismiss, onEdit, onOpenChat }: CardProps) {
  const { item, phase } = entry
  const reduce = useReducedMotion()
  const [editing, setEditing] = useState(false)
  const noteId = useId()
  const busy = phase === 'pending'
  const hasIrreversible = item.actions.some((a) => a.reversibility === 'irreversible')

  return (
    <m.li
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="rounded-lg border border-line bg-overlay p-5"
      aria-busy={busy}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-micro uppercase tracking-[0.14em] text-muted">
          <span>{item.source}</span>
          <span aria-hidden>·</span>
          <span className={item.lane === 'needs-you' ? 'text-primary-ink' : undefined}>{item.status}</span>
        </p>
        {item.timeLabel && <p className="text-micro text-muted">{item.timeLabel}</p>}
      </div>

      <h2 className="mt-2 text-read font-semibold text-strong">{item.title}</h2>

      {/* Seffaflik: NEDEN bu kart burada — kural 10 */}
      <p className="mt-1 flex gap-1.5 text-small text-soft">
        <BulbIcon />
        <span>{item.reason}</span>
      </p>

      <FeedBodyView entry={entry} editing={editing} onEdit={onEdit} />

      {phase === 'error' && entry.error && (
        <p role="alert" className="mt-3 rounded-md bg-danger-wash px-3 py-2 text-small text-danger">
          {entry.error}. Tekrar deneyebilirsin.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            aria-describedby={action.reversibility === 'irreversible' ? noteId : undefined}
            onClick={() => {
              setEditing(false)
              onAct(entry, action.id)
            }}
            className={
              action.emphasis === 'primary'
                ? 'min-h-11 rounded-full bg-primary px-4 text-base font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-60'
                : 'min-h-11 rounded-full border border-line-strong px-4 text-base text-body transition hover:bg-surface-raised disabled:opacity-60'
            }
          >
            {busy && entry.actionId === action.id ? 'Yapılıyor…' : action.label}
          </button>
        ))}

        {item.body.type === 'draft' && (
          <button
            type="button"
            disabled={busy}
            aria-pressed={editing}
            onClick={() => setEditing((v) => !v)}
            className="min-h-11 rounded-full border border-line-strong px-4 text-base text-body transition hover:bg-surface-raised disabled:opacity-60"
          >
            {editing ? 'Düzenlemeyi Bitir' : 'Düzenle'}
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => onDismiss(entry)}
          className="min-h-11 rounded-full px-3 text-base text-muted transition hover:text-body disabled:opacity-60"
        >
          Şimdi Değil
        </button>

        {onOpenChat && (
          <button
            type="button"
            onClick={() => onOpenChat(item)}
            className="ml-auto min-h-11 rounded-full px-3 text-base text-primary-ink underline-offset-4 hover:underline"
          >
            Sohbette Aç
          </button>
        )}
      </div>

      {hasIrreversible && (
        <p id={noteId} className="mt-2 text-micro text-muted">
          Bu işlem geri alınamaz; onaylamadan önce oku.
        </p>
      )}
    </m.li>
  )
}

function FeedBodyView({
  entry,
  editing,
  onEdit,
}: {
  entry: FeedEntry
  editing: boolean
  onEdit: (id: string, text: string) => void
}) {
  const { body } = entry.item
  const fieldId = useId()

  if (body.type === 'draft') {
    const text = entry.draftText ?? body.text
    return (
      <div className="mt-4 rounded-md bg-surface-sunken p-4 text-small">
        <p className="text-muted">
          Kime <span className="ml-2 font-medium text-strong">{body.to}</span>
        </p>
        {body.subject && <p className="mt-1 text-muted">Konu: {body.subject}</p>}
        {editing ? (
          <>
            <label htmlFor={fieldId} className="sr-only">
              Taslak metni
            </label>
            <textarea
              id={fieldId}
              value={text}
              onChange={(e) => onEdit(entry.item.id, e.target.value)}
              rows={Math.min(10, text.split('\n').length + 1)}
              className="mt-3 w-full resize-y rounded-md border border-line bg-overlay p-3 text-base text-strong focus-visible:outline-2 focus-visible:outline-line-focus"
            />
          </>
        ) : (
          <p className="mt-3 whitespace-pre-line text-base text-body">{text}</p>
        )}
      </div>
    )
  }

  if (body.type === 'metric') {
    const series = body.series ?? []
    const max = Math.max(...series, 0) || 1
    return (
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-display font-semibold tabular-nums tracking-tight text-strong">{body.value}</p>
          {body.delta && <p className="text-base font-medium text-primary-ink">{body.delta}</p>}
          {body.note && <p className="mt-2 text-small text-soft">{body.note}</p>}
        </div>
        {series.length > 1 && (
          <div role="img" aria-label={body.seriesLabels?.map((l, i) => `${l}: ${series[i]}`).join(', ') ?? 'Eğilim'} className="flex h-20 items-end gap-3">
            {series.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 rounded-sm ${i === series.length - 1 ? 'bg-primary' : 'bg-primary-wash'}`}
                  style={{ height: `${Math.max(8, (v / max) * 64)}px` }}
                />
                {body.seriesLabels && <span className="text-micro text-muted">{body.seriesLabels[i]}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

// --- Halledilenler: tek satir + Geri Al --------------------------------------------

function HandledRow({ entry, onUndo }: { entry: FeedEntry; onUndo: (entry: FeedEntry) => void }) {
  const reduce = useReducedMotion()
  const [pending, setPending] = useState(false)

  return (
    <m.li
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="flex items-center gap-3 rounded-lg border border-line bg-overlay px-5 py-3"
    >
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
        <CheckIcon />
      </span>
      <p className="min-w-0 flex-1 text-base font-medium text-strong">{entry.summary}</p>
      {entry.undoToken ? (
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              await onUndo(entry)
            } finally {
              setPending(false)
            }
          }}
          className="min-h-11 rounded-md px-2 text-small text-primary-ink underline-offset-4 hover:underline disabled:opacity-60"
        >
          Geri Al
        </button>
      ) : (
        <span className="text-small text-muted">Tamam</span>
      )}
    </m.li>
  )
}

// --- Sponsorlu: ayri bolum, her zaman etiketli, aksiyonsuz -----------------------

function SponsoredRail({ items }: { items: SponsoredItem[] }) {
  // https kontrolu parseSponsoredItem'da VAR ama prop tip olarak geldigi icin
  // parser'i atlayan bir cagiran (reklam verisini cast eden kod) javascript:
  // adresini karta tasiyabilirdi. Son savunma render'da: https disi adres
  // kart BASILMAZ (sessizce atlanir; reklamin eksigi hata degildir).
  const safe = items.filter((ad) => ad.href.startsWith('https://'))
  if (safe.length === 0) return null
  return (
    <section aria-labelledby="feed-sponsored" className="mt-10">
      <h2 id="feed-sponsored" className="text-read font-semibold text-strong">
        Senin İçin De{' '}
        <span className="ml-1 text-small font-normal text-muted">Planlarına göre iş ortaklarından öneriler</span>
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {safe.map((ad) => (
          <li key={ad.id}>
            <a
              href={ad.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="block h-full rounded-lg border border-line bg-surface p-4 transition hover:bg-surface-raised"
            >
              <span className="inline-block rounded-full bg-surface-raised px-2 py-0.5 text-micro font-medium text-body">
                Sponsorlu · {ad.sponsor}
              </span>
              <span className="mt-2 block text-base font-semibold text-strong">{ad.title}</span>
              <span className="mt-1 block text-small text-soft">{ad.reason}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

// --- Ikonlar ---------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" className="mt-0.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M6 13h4M6.5 15h3M8 1.5a4.5 4.5 0 0 0-2.6 8.2c.4.3.6.7.6 1.1V11h4v-.2c0-.4.2-.8.6-1.1A4.5 4.5 0 0 0 8 1.5z" />
    </svg>
  )
}
