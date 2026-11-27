"use client";

import { MessageCircle, Play, Repeat2 } from "lucide-react";
import { Children, useId, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { LikeButton } from "@/components/ui/like-button";
import { cn } from "@/lib/utils";

/**
 * Not kartı: kısa düşünce, kısa gönderi, çalışma günlüğü satırı. Üstte avatar
 * + ad + "@kullanıcı · 12 sa", sağ üstte isteğe kaynak ikonu (notun ilk
 * yayımlandığı yer); altında metin, isteğe medya (oynat butonlu poster ya da
 * canlı sahne), en altta eylem satırı (yanıt, yeniden paylaş, beğeni).
 *
 * NE ZAMAN: kişisel sitede "Notlar/Düşünceler" sekmesi, ürün değişiklik
 * günlüğünde kısa duyuru, ekip içi pano. NE ZAMAN DEĞİL: başlıklı uzun yazı
 * (makale listesi daha iyi), sohbet (→ `chat-thread`), yorum dizisi (iç içe
 * yanıt bu kartın işi değil).
 *
 * NASIL: metin dizeyse boş satırlarda paragraflara bölünür, tek satır sonları
 * korunur (`whitespace-pre-line`). Göreli zaman `relativeTime()` ile kısa
 * biçimde ("3 dk", "12 sa", "2 gün", eskiyse "16 Kas"); sunucuda ve istemcide farklı çıkabilir,
 * bu yüzden `now` ver ya da `timeLabel` ile hazır metin gönder. Beğeni
 * `like-button` (iyimser, geri alınabilir).
 *
 * ERİŞİLEBİLİRLİK: her kart `<article>`, adı yazar + zaman
 * (`aria-labelledby`), başlık düzeyi yok (akışta başlık yığını olmasın).
 * `<time dateTime>` makine okunur tarih taşır. Yanıt/paylaş butonları sayıyı
 * adında söyler; kaynak ikonu `sourceLabel` ile adlanır. `NoteList` kartları
 * 8 px aralıkla dizer.
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili, Kasım 2026); yalnız davranış, kod alınmadı.
 *
 *   <NoteList label="Notlar">
 *     <NoteCard author={{ name: "Derin Aksoy", handle: "derinaksoy" }} time="2026-11-26T09:00" now={NOW} likes={14}>
 *       {"sekmeler kayınca daha yumuşak hissettiriyor.\n\nbir şeyi oynat, gerisi takip etsin."}
 *     </NoteCard>
 *   </NoteList>
 */

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/** Akışta alışılan kısa biçim: "3 dk", "12 sa", "2 gün"; bir haftadan eskiyse "16 Kas". (`Intl.RelativeTimeFormat` "12 sa. önce", "evvelsi gün" verir.) */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return "şimdi";
  if (s < 3600) return `${Math.floor(s / 60)} dk`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} gün`;
  return DATE.format(date);
}

type NoteCardProps = {
  author: { name: string; handle?: string; src?: string | null };
  /** ISO tarih ya da Date. */
  time: string | Date;
  /** Hazır göreli metin (sunucu/istemci farkı olmasın). */
  timeLabel?: string;
  now?: Date;
  /** Sağ üst köşedeki kaynak ikonu (ör. lucide ikonu). */
  source?: ReactNode;
  sourceLabel?: string;
  sourceHref?: string;
  children: ReactNode;
  media?: ReactNode;
  replies?: number;
  onReply?: () => void;
  reposts?: number;
  onRepost?: () => void;
  likes?: number;
  liked?: boolean;
  onLike?: (liked: boolean) => Promise<unknown> | void;
  /** Eylem satırını gizle (yalnız okuma). */
  actions?: boolean;
  className?: string;
};

const ACTION = "-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-small text-muted transition-colors duration-200 hover:text-strong";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

function Text({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <div className="grid gap-3">{children}</div>;
  const parts = children.split(/\n{2,}/);
  return (
    <div className="grid gap-3">
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

export function NoteCard({
  author,
  time,
  timeLabel,
  now,
  source,
  sourceLabel = "Kaynak",
  sourceHref,
  children,
  media,
  replies,
  onReply,
  reposts,
  onRepost,
  likes = 0,
  liked,
  onLike,
  actions = true,
  className,
}: NoteCardProps) {
  const nameId = useId();
  const timeId = useId();
  const date = typeof time === "string" ? new Date(time) : time;
  const label = timeLabel ?? relativeTime(date, now);

  return (
    <article
      aria-labelledby={`${nameId} ${timeId}`}
      className={cn("rounded-2xl border border-line bg-overlay px-4 pt-4 pb-3 text-base text-body", className)}
    >
      <header className="flex items-start gap-3">
        <Avatar name={author.name} src={author.src} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <p id={nameId} className="truncate font-medium text-strong">
            {author.name}
          </p>
          <p className="truncate text-small text-muted">
            {author.handle ? <span>@{author.handle} · </span> : null}
            <time id={timeId} dateTime={date.toISOString()} suppressHydrationWarning={!timeLabel && !now}>
              {label}
            </time>
          </p>
        </div>
        {source ? (
          sourceHref ? (
            <a href={sourceHref} target="_blank" rel="noopener noreferrer" aria-label={`${sourceLabel} (yeni sekmede açılır)`} className="-m-2 inline-grid size-11 place-items-center rounded-full text-soft hover:text-strong [&_svg]:size-4">
              {source}
            </a>
          ) : (
            <span role="img" aria-label={sourceLabel} className="inline-grid size-7 place-items-center text-soft [&_svg]:size-4">
              {source}
            </span>
          )
        ) : null}
      </header>
      <div className="mt-3">
        <Text>{children}</Text>
      </div>
      {media ? <div className="mt-3">{media}</div> : null}
      {actions ? (
        <div className="mt-2 flex items-center gap-3">
          <button type="button" className={ACTION} onClick={onReply} aria-label={`Yanıtla${replies ? `, ${fmt(replies)} yanıt` : ""}`}>
            <MessageCircle aria-hidden className="size-4" strokeWidth={1.8} />
            {replies ? <span aria-hidden className="tabular-nums">{fmt(replies)}</span> : null}
          </button>
          <button type="button" className={ACTION} onClick={onRepost} aria-label={`Yeniden Paylaş${reposts ? `, ${fmt(reposts)} paylaşım` : ""}`}>
            <Repeat2 aria-hidden className="size-4" strokeWidth={1.8} />
            <span aria-hidden>{reposts ? fmt(reposts) : "Paylaş"}</span>
          </button>
          <LikeButton count={likes} liked={liked} onToggle={onLike} />
        </div>
      ) : null}
    </article>
  );
}

type NoteMediaProps = {
  /** Oynatılacak şeyin adı; buton "Oynat: <label>" olur. */
  label: string;
  onPlay?: () => void;
  /** Poster: görsel ya da token'la çizilmiş sahne. */
  children: ReactNode;
  className?: string;
};

/** Oynat butonlu poster. Tıklanınca `onPlay` (ör. `media-lightbox` açar). */
export function NoteMedia({ label, onPlay, children, className }: NoteMediaProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line-soft bg-surface", className)}>
      {children}
      {onPlay ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Oynat: ${label}`}
          className="group absolute inset-0 grid place-items-center"
        >
          <span className="grid size-11 place-items-center rounded-full bg-scrim text-on-brand shadow-floating backdrop-blur transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
            <Play aria-hidden className="size-4 translate-x-px" fill="currentColor" />
          </span>
        </button>
      ) : null}
    </div>
  );
}

type NoteListProps = { label: string; children: ReactNode; className?: string };

/** Kartları 8 px aralıkla dizer; bölgenin adı `label`. */
export function NoteList({ label, children, className }: NoteListProps) {
  return (
    <section aria-label={label} className={cn("flex flex-col gap-2", className)}>
      {Children.toArray(children)}
    </section>
  );
}
