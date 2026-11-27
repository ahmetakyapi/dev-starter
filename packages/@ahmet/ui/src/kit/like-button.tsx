// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Heart } from "lucide-react";
import { useRef, useState } from "react";
import { DigitRoll } from "./digit-roll";
import { cn } from "../utils";

/**
 * Beğeni butonu: kalp + sayaç. Basınca kalp dolar ve küçük bir "pop" yapar
 * (0,82 → 1,18 → 1,04; 420 ms), sayaçta yalnız değişen rakam yuvarlanır
 * (`digit-roll`). Kaldırınca kalp sessizce boşalır; geri alma kutlanmaz.
 *
 * NE ZAMAN: tek tür, herkese açık onay sayısı (portfolyo çalışması, not,
 * gönderi, galeri karesi). NE ZAMAN DEĞİL: ekip içinde ANLAMI farklı
 * tepkiler (Bakıyorum, Tamam) → `reactions`; yer imi / kaydet (kişisel liste,
 * sayaç yok) → `toggle-group` ya da ikon butonu.
 *
 * İYİMSER GÜNCELLEME: durum basar basmaz değişir, `onToggle(next)` çağrılır.
 * Promise reddederse durum geri alınır ve hata gizli canlı bölgede okunur
 * ("Beğeni kaydedilemedi"). İstek sürerken ikinci basış yok sayılmaz:
 * son basış kazanır (eski yanıtın hatası yenisini geri almaz).
 *
 * ERİŞİLEBİLİRLİK: `aria-pressed`; ad sayıyı söyler ("Beğen, 220 beğeni"),
 * görünen rakam `aria-hidden`. Renk tek işaret değil: dolu/boş kalp şekli de
 * değişir. 44 px dokunma alanı (görsel daha küçük). Hareket azaltmada pop
 * yok, rakam yerinde değişir.
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili, Kasım 2026); yalnız davranış, kod alınmadı.
 *
 *   <LikeButton count={220} onToggle={(liked) => fetch(`/api/begen?l=${liked}`, { method: "POST" })} />
 */

const CSS = `
@keyframes ui-like-pop { 0% { scale: .82; } 58% { scale: 1.18; } 100% { scale: 1.04; } }
.ui-like-heart[data-pop] { animation: ui-like-pop 420ms var(--ease-brand) both; }
@media (prefers-reduced-motion: reduce) { .ui-like-heart[data-pop] { animation: none; } }`;

type LikeButtonProps = {
  /** Başlangıç sayısı (kullanıcının kendi beğenisi DAHİL). */
  count: number;
  /** Başlangıçta kullanıcı beğenmiş mi. */
  liked?: boolean;
  /** Sunucuya yaz; reddederse durum geri alınır. */
  onToggle?: (liked: boolean) => Promise<unknown> | void;
  /** Eylemin adı; ad "Beğen, 12 beğeni" olur. */
  label?: string;
  /** Sayının birimi (ekran okuyucu için). */
  unit?: string;
  errorText?: string;
  /** Sayı 0 iken rakam gizlensin mi (yalnız kalp). */
  hideZero?: boolean;
  className?: string;
};

export function LikeButton({
  count,
  liked: initialLiked = false,
  onToggle,
  label = "Beğen",
  unit = "beğeni",
  errorText = "Beğeni kaydedilemedi",
  hideZero = true,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [value, setValue] = useState(count);
  const [pop, setPop] = useState(0);
  const [error, setError] = useState("");
  const seq = useRef(0);

  function toggle() {
    const next = !liked;
    const prev = { liked, value };
    setLiked(next);
    setValue((v) => Math.max(0, v + (next ? 1 : -1)));
    setError("");
    if (next) setPop((p) => p + 1);
    const mine = ++seq.current;
    const result = onToggle?.(next);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      (result as Promise<unknown>).catch(() => {
        if (mine !== seq.current) return; // daha yeni bir basış var
        setLiked(prev.liked);
        setValue(prev.value);
        setError(errorText);
      });
    }
  }

  return (
    <>
      <style href="ui-like-button" precedence="default">
        {CSS}
      </style>
      <button
        type="button"
        aria-pressed={liked}
        aria-label={`${label}, ${new Intl.NumberFormat("tr-TR").format(value)} ${unit}`}
        onClick={toggle}
        className={cn(
          "group relative -my-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-small transition-colors duration-200",
          liked ? "text-danger" : "text-muted hover:text-strong",
          className,
        )}
      >
        <span key={pop} data-pop={liked && pop > 0 ? "" : undefined} className="ui-like-heart inline-grid">
          <Heart aria-hidden className="size-4" fill={liked ? "currentColor" : "none"} strokeWidth={1.8} />
        </span>
        {hideZero && value === 0 ? null : (
          <span aria-hidden>
            <DigitRoll value={value} />
          </span>
        )}
      </button>
      <span role="status" className="sr-only">
        {error}
      </span>
    </>
  );
}
