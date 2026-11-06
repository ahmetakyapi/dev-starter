// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Basılı tut onayı: yıkıcı ama GERİ ALINABİLİR eylemde onay diyaloğunun
 * yerine ("Arşivle", "Listeden Çıkar", "Oturumu Kapat"). Basılı tutunca
 * düğme soldan sağa dolar; süre dolmadan bırakılırsa geri sarılır, hiçbir
 * şey olmaz. Kazara tıklama eylemi tetiklemez, kasıtlı olan diyalog
 * açmadan biter. Geri alınamaz eylemde (hesap silme) `confirm` diyaloğu
 * kullan: orada sonucun yazıyla okunması gerekir.
 *
 * KLAVYE: Boşluk ya da Enter BASILI tutulur (tekrar eden `keydown` yok
 * sayılır); bırakınca iptal. Tıklama tek başına onaylamaz, bu yüzden düğme
 * altındaki ipucu (`aria-describedby`) bunu her kullanıcıya söyler:
 * "Onaylamak için basılı tut".
 *
 * DOLGU `clip-path` ile: dolgu katmanı (dolgu rengi + ters renk metin) asıl
 * yüzün üstünde ve soldan açılır; metin hiçbir anda iki rengin arasında
 * kontrastsız kalmaz. Süre CSS geçişinde (`--hold`), onay zamanlayıcıyla.
 * Geri sarma hızlı (200 ms): bırakan kullanıcı beklemez.
 *
 * Hareketi azaltan kullanıcıda da dolum görünür: süs değil, ilerlemenin
 * kendisi. Bitince "Arşivlendi" + onay işareti 1,6 sn kalır ve ekran
 * okuyucuya söylenir (`role="status"`).
 *
 *   <HoldButton onConfirm={() => archive(t)} doneLabel="Arşivlendi">Basılı Tutarak Arşivle</HoldButton>
 */

const TONES = {
  danger: { face: "bg-danger-wash text-danger", fill: "bg-danger text-on-primary" },
  neutral: { face: "bg-overlay text-strong shadow-raised", fill: "bg-strong text-page" },
} as const;

type HoldButtonProps = {
  children: ReactNode;
  onConfirm: () => void;
  /** Basılı tutma süresi (ms). 800-1600 arası: kısası kazara, uzunu yorucu. */
  holdMs?: number;
  doneLabel?: string;
  hint?: string;
  tone?: keyof typeof TONES;
  disabled?: boolean;
  className?: string;
};

export function HoldButton({
  children,
  onConfirm,
  holdMs = 1200,
  doneLabel = "Tamamlandı",
  hint = "Onaylamak için basılı tut",
  tone = "danger",
  disabled = false,
  className,
}: HoldButtonProps) {
  const hintId = useId();
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const reset = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(reset.current);
    },
    [],
  );

  function start() {
    if (disabled || done || holding) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      setDone(true);
      onConfirm();
      reset.current = window.setTimeout(() => setDone(false), 1600);
    }, holdMs);
  }

  function cancel() {
    window.clearTimeout(timer.current);
    setHolding(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) start();
  }

  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    cancel();
  }

  const t = TONES[tone];
  const content = done ? (
    <>
      <Check aria-hidden className="size-4" strokeWidth={2.5} />
      {doneLabel}
    </>
  ) : (
    children
  );

  return (
    <span className={cn("inline-grid justify-items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        onPointerDown={(event) => {
          if (event.button === 0) start();
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={cancel}
        style={{ "--hold": `${holdMs}ms` } as CSSProperties}
        className={cn(
          "relative isolate inline-flex min-h-11 touch-none items-center justify-center overflow-hidden rounded-md px-4 text-base font-semibold select-none [-webkit-touch-callout:none]",
          "transition-[scale] duration-150 active:scale-[0.98] disabled:opacity-50",
          t.face,
        )}
      >
        <span className="inline-flex items-center gap-2">{content}</span>
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center gap-2",
            t.fill,
            holding || done
              ? "[clip-path:inset(0_0_0_0)] transition-[clip-path] duration-(--hold) ease-linear"
              : "[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-(--ease-brand)",
          )}
        >
          {content}
        </span>
      </button>
      <span id={hintId} className="text-micro text-muted">
        {hint}
      </span>
      <span role="status" className="sr-only">
        {done ? doneLabel : ""}
      </span>
    </span>
  );
}
