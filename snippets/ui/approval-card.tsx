"use client";

import { Check, X } from "lucide-react";
import { useId, useState, type ElementType, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * İnsan onayı: ajan (ya da bir iş akışı) etkili bir eylemden önce durur ve
 * kararı insana bırakır. "Ece Doğan'a Muhasebe klasörüne erişim verilsin mi?"
 * Kart ne olacağını (sonuç cümlesi), kimi etkilediğini (kişi çipleri) ve
 * kararın kayda geçtiğini ("Bu karar denetim günlüğüne yazılır.") tek bakışta
 * söyler; isteğe not alanı kararın gerekçesini taşır.
 *
 * Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod alınmadı.
 *
 * NE ZAMAN: geri alınması zor ya da başkasını etkileyen eylem: erişim verme,
 * para iadesi, toplu e-posta, kayıt silme. Konuşma ya da talep akışının
 * içinde tek satırlık hali `ApprovalStrip` ("Selin Başaran onayını bekliyor
 * · Reddet · Onayla").
 * NE ZAMAN DEĞİL: aracın çağrı kaydı (`tool-call`; onay yuvası orada da var,
 * bu kart onun zengin hali), bağlantı penceresinin izin dökümü
 * (`permission-list`), otomatik denetimler (`policy-checks`), araç başına
 * kalıcı politika (`tool-policy-list`). Basit "emin misin?" için `dialog`.
 *
 * KURAL (rules/agentic-ui.md § 2, "model asla yetkilendirme kararı vermez"):
 * kart kararı yalnız ÇAĞIRANA iletir: `onDecision("approved" | "rejected",
 * not)`. Eylemi sunucu, kullanıcının yetkisini kendisi denetleyerek yapar;
 * istemcideki buton yetki değildir. Model metni (başlık, sonuç cümlesi)
 * kullanıcıya gösterilir ama butonların ne yapacağını belirlemez.
 *
 * Durumlar: `pending` (butonlar), `submitting` (basılan butonda spinner,
 * ikisi de kapalı), `approved` / `rejected` (butonlar çekilir, yerine damga
 * satırı: "Onaylandı · az önce"; not varsa alıntı). Kontrollü (`state`) ya da
 * kendi kendine: `onDecision` Promise dönerse beklenir, reddedilirse kart
 * `pending`e döner ve hata `role="alert"` ile okunur.
 *
 * Erişilebilirlik: kart `section` + başlığa bağlı ad; sonuç `role="status"`
 * canlı bölgede ("Onaylandı"); not alanı görünür etiketli; kişi çipleri
 * `ul role="list"` + "Etkilenenler" adı; tik dairesi süs. Kitte kalır:
 * avatar Base UI'ya bağlanmasın diye baş harf karosu burada çizilir.
 *
 *   <ApprovalCard
 *     icon={<FolderLock />}
 *     title="Ece Doğan'a Muhasebe klasörüne erişim verilsin mi?"
 *     description="Ece klasördeki 214 faturayı görebilecek ve yeni dosya yükleyebilecek."
 *     people={[{ name: "Ece Doğan" }]}
 *     onDecision={(d, note) => kararıGönder(d, note)}
 *   />
 */

export type ApprovalDecision = "approved" | "rejected";
export type ApprovalState = "pending" | "submitting" | ApprovalDecision;
export type ApprovalPerson = { name: string; src?: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase("tr-TR"))
    .join("");

function Face({ person, className }: { person: ApprovalPerson; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-sunken text-[0.625rem] font-medium text-muted", className)}>
      {/* <picture>: kit next/image'e bağlanmaz; projede next/image ile değiştirilebilir. */}
      {person.src ? (
        <picture className="contents">
          <img src={person.src} alt="" className="size-full object-cover" />
        </picture>
      ) : (
        initials(person.name)
      )}
    </span>
  );
}

function useDecision(state: ApprovalState | undefined, onDecision: ((d: ApprovalDecision, note: string) => void | Promise<void>) | undefined, errorText: string) {
  const [own, setOwn] = useState<ApprovalState>("pending");
  const [pressed, setPressed] = useState<ApprovalDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = state ?? own;

  async function decide(d: ApprovalDecision, note: string) {
    if (current !== "pending") return;
    setError(null);
    setPressed(d);
    const result = onDecision?.(d, note);
    if (result && typeof (result as Promise<void>).then === "function") {
      setOwn("submitting");
      try {
        await result;
        setOwn(d);
      } catch {
        setOwn("pending");
        setError(errorText);
      }
    } else {
      setOwn(d);
    }
  }
  return { current, pressed, error, decide };
}

const BTN = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-small font-medium transition-[scale,background-color,box-shadow] duration-150 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 pointer-fine:min-h-9";

type ApprovalCardProps = {
  title: ReactNode;
  /** Sonuç cümlesi: onaylanırsa ne olacak. Birden çok paragraf için ReactNode. */
  description?: ReactNode;
  /** Uygulama ya da kaynak karosu (lucide ikonu, logo). */
  icon?: ReactNode;
  people?: readonly ApprovalPerson[];
  peopleLabel?: string;
  /** Denetim satırı; `false` gizler (yalnız gerçekten kayıt tutuluyorsa göster). */
  auditNote?: ReactNode | false;
  /** Not alanı. */
  note?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  /** Kontrollü durum; verilmezse kart kendi tutar. */
  state?: ApprovalState;
  /** Karar zamanı etiketi: "az önce", "14.32". */
  decidedAt?: string;
  /** Kararı veren (damga satırında): "Ahmet Yılmaz". */
  decidedBy?: string;
  onDecision?: (decision: ApprovalDecision, note: string) => void | Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
  approvedLabel?: string;
  rejectedLabel?: string;
  errorText?: string;
  titleAs?: ElementType;
  className?: string;
};

export function ApprovalCard({
  title,
  description,
  icon,
  people = [],
  peopleLabel = "Etkilenenler",
  auditNote = "Bu karar denetim günlüğüne yazılır.",
  note = true,
  noteLabel = "Not",
  notePlaceholder = "Kararın için kısa bir not bırak (isteğe bağlı)",
  state,
  decidedAt = "az önce",
  decidedBy,
  onDecision,
  approveLabel = "Onayla",
  rejectLabel = "Reddet",
  approvedLabel = "Onaylandı",
  rejectedLabel = "Reddedildi",
  errorText = "Karar gönderilemedi. Yeniden dene.",
  titleAs: Title = "h3",
  className,
}: ApprovalCardProps) {
  const id = useId();
  const [text, setText] = useState("");
  const { current, pressed, error, decide } = useDecision(state, onDecision, errorText);
  const decided = current === "approved" || current === "rejected";
  const busy = current === "submitting";

  return (
    <section aria-labelledby={`${id}-t`} className={cn("relative overflow-hidden rounded-[1.25rem] bg-overlay ring-1 ring-line shadow-raised", className)}>
      {/* Üst şerit: çok açık gri degrade, kartı "pencere" değil belge gibi açar. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-surface-sunken to-transparent" />
      <div className="relative grid gap-4 p-5">
        {icon && (
          <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-overlay text-strong ring-1 ring-line shadow-raised [&_svg]:size-5">
            {icon}
          </span>
        )}
        <div className="grid gap-2">
          <Title id={`${id}-t`} className="text-base font-medium text-strong text-pretty">
            {title}
          </Title>
          {description && <div className="grid gap-2 text-small text-body text-pretty">{description}</div>}
          {auditNote !== false && <p className="text-small text-muted">{auditNote}</p>}
        </div>

        {people.length > 0 && (
          <ul role="list" aria-label={peopleLabel} className="flex flex-wrap gap-1.5">
            {people.map((p) => (
              <li key={p.name} className="inline-flex items-center gap-1.5 rounded-lg bg-overlay py-1 pr-2.5 pl-1 text-small text-strong ring-1 ring-line">
                <Face person={p} />
                {p.name}
              </li>
            ))}
          </ul>
        )}

        {note && !decided && (
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-n`} className="text-small text-muted">
              {noteLabel}
            </label>
            <textarea
              id={`${id}-n`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder={notePlaceholder}
              className="min-h-20 w-full resize-y rounded-xl bg-overlay px-3 py-2.5 text-small text-strong ring-1 ring-line outline-none placeholder:text-soft focus-visible:ring-2 focus-visible:ring-line-focus disabled:opacity-60"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}

        <div role="status" className="contents">
          {decided && (
            <div className="grid gap-2 border-t border-line-soft pt-4">
              <p className="flex flex-wrap items-center gap-2 text-small">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 place-items-center rounded-full",
                    current === "approved" ? "bg-success-wash text-success" : "bg-danger-wash text-danger",
                  )}
                >
                  {current === "approved" ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                </span>
                <span className={cn("font-medium", current === "approved" ? "text-success" : "text-danger")}>
                  {current === "approved" ? approvedLabel : rejectedLabel}
                </span>
                <span className="text-muted">
                  {decidedBy ? `${decidedBy} · ` : ""}
                  {decidedAt}
                </span>
              </p>
              {text.trim() && <blockquote className="border-l-2 border-line pl-3 text-small text-body">{text.trim()}</blockquote>}
            </div>
          )}
        </div>

        {!decided && (
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => decide("rejected", text)} className={cn(BTN, "bg-overlay text-strong ring-1 ring-line hover:bg-surface")}>
              {busy && pressed === "rejected" && <Spinner size="sm" label="Gönderiliyor" tone="current" />}
              {rejectLabel}
            </button>
            <button type="button" disabled={busy} onClick={() => decide("approved", text)} className={cn(BTN, "bg-strong text-page shadow-raised hover:bg-strong/90")}>
              {busy && pressed === "approved" ? (
                <Spinner size="sm" label="Gönderiliyor" tone="current" />
              ) : (
                <span aria-hidden className="grid size-4 place-items-center rounded-full bg-success text-on-brand">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
              )}
              {approveLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type ApprovalStripProps = {
  person: ApprovalPerson;
  /** Varsayılan: "<ad> onayını bekliyor". */
  text?: ReactNode;
  state?: ApprovalState;
  onDecision?: (decision: ApprovalDecision, note: string) => void | Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
  approvedLabel?: string;
  rejectedLabel?: string;
  errorText?: string;
  className?: string;
};

/** Konuşma/talep akışında tek satır: kim bekliyor + iki küçük karar hapı. */
export function ApprovalStrip({
  person,
  text,
  state,
  onDecision,
  approveLabel = "Onayla",
  rejectLabel = "Reddet",
  approvedLabel = "Onaylandı",
  rejectedLabel = "Reddedildi",
  errorText = "Karar gönderilemedi. Yeniden dene.",
  className,
}: ApprovalStripProps) {
  const { current, pressed, error, decide } = useDecision(state, onDecision, errorText);
  const decided = current === "approved" || current === "rejected";
  const busy = current === "submitting";
  const PILL = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-small font-medium ring-1 ring-line bg-overlay transition-[scale,background-color] duration-150 hover:bg-surface active:scale-[0.97] disabled:opacity-60 pointer-fine:min-h-7";
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-surface px-3 py-2", className)}>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-small text-body">
        <Face person={person} className="size-6" />
        <span className="min-w-0 truncate">{text ?? `${person.name} onayını bekliyor`}</span>
      </span>
      <span role="status" className="contents">
        {decided && (
          <span className={cn("flex items-center gap-1 text-small font-medium", current === "approved" ? "text-success" : "text-danger")}>
            {current === "approved" ? <Check aria-hidden className="size-3.5" /> : <X aria-hidden className="size-3.5" />}
            {current === "approved" ? approvedLabel : rejectedLabel}
          </span>
        )}
      </span>
      {!decided && (
        <span className="flex gap-1.5">
          <button type="button" disabled={busy} onClick={() => decide("rejected", "")} className={cn(PILL, "text-danger")}>
            {busy && pressed === "rejected" && <Spinner size="sm" label="Gönderiliyor" tone="current" />}
            {rejectLabel}
          </button>
          <button type="button" disabled={busy} onClick={() => decide("approved", "")} className={cn(PILL, "text-success")}>
            {busy && pressed === "approved" && <Spinner size="sm" label="Gönderiliyor" tone="current" />}
            {approveLabel}
          </button>
        </span>
      )}
      {error && (
        <p role="alert" className="basis-full text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
