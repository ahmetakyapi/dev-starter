// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Kaydırınca çekilen yüzen çubuk: ekranın altında (ya da üstünde) hap
 * biçimli araç çubuğu. Okur AŞAĞI kaydırınca (içerik okuyor) kayıp
 * gizlenir, YUKARI kaydırınca (bir şey arıyor) geri gelir. Sakin Akış turu
 * (kişisel portfolyo dili); yalnız davranış, kod alınmadı.
 *
 * NE ZAMAN: uzun akışın süzgeç / görünüm çubuğu (`ShotGridToolbar`),
 * makale okurken yazı boyu ve paylaş, galeride "Karıştır".
 * NE ZAMAN DEĞİL: birincil gezinme (kaybolan menü yön bulmayı bozar),
 * seçim yapılınca beliren toplu işlem adası (`selection-bar`: o seçime
 * bağlıdır, kaydırmaya değil), tek eylemli yüzen buton.
 *
 * NASIL: `scroll` dinleyicisi (passive); 6 px'ten küçük oynamalar yok
 * sayılır, `dy > 0 && scrollY > 80` gizler, yukarı her kaydırma gösterir.
 * Çubuğun içinde ODAK varken ya da `open` doğruyken (açık menü, açılır
 * liste) gizlenmez; gizlenirken içerideki odak kaybolmasın diye çubuk
 * odak alınca anında geri gelir. Yerleşimi değiştiren eylemler sayfayı
 * kendileri kaydırır (görünüm değişimi, karıştır): çubuğun bunu "aşağı
 * kaydırma" sanmaması için `useScrollHideBar().hold()` çubuğu 900 ms
 * sabit tutar.
 *
 * ROL: bileşen ROL VERMEZ; yalnız konum ve davranış. İçerik bir araç
 * çubuğuysa `role="toolbar"` + `aria-label` ve ok tuşu gezinmesi
 * içeriğin sorumluluğu (`ShotGridToolbar` bunu yapar). Gizliyken
 * `inert`: ekran okuyucu ve Tab görünmeyen butonlara gitmez.
 *
 * HAREKET: 320 ms `--ease-brand` ile kenara kayar; hareketi azaltan
 * kullanıcıda kayma yerine solar.
 *
 *   <ScrollHideBar edge="bottom">
 *     <ShotGridToolbar … />
 *   </ScrollHideBar>
 */

const CSS = `
.ui-shb {
  transition: translate 320ms var(--ease-brand), opacity 240ms var(--ease-brand);
}
.ui-shb[data-hidden][data-edge="bottom"] { translate: -50% calc(100% + 1.5rem); opacity: 0; }
.ui-shb[data-hidden][data-edge="top"] { translate: -50% calc(-100% - 1.5rem); opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .ui-shb { transition: opacity 200ms linear; }
  .ui-shb[data-hidden][data-edge] { translate: -50% 0; }
}`;

type Ctx = { hold: (ms?: number) => void; hidden: boolean };
const BarContext = createContext<Ctx>({ hold: () => {}, hidden: false });

/** Çubuğun içinden: `hold()` yerleşim değiştiren eylemden önce çağrılır. */
export function useScrollHideBar() {
  return useContext(BarContext);
}

type ScrollHideBarProps = {
  children: ReactNode;
  edge?: "bottom" | "top";
  /** Açık menü / liste: doğruyken hiç gizlenmez. */
  open?: boolean;
  /** Kaydırma kabı (varsayılan pencere). Storybook ya da iç kaydırmalı panel için. */
  scrollContainer?: HTMLElement | null;
  /** `fixed` (varsayılan) ya da kabın içinde `sticky`/`absolute` için "absolute". */
  position?: "fixed" | "absolute";
  className?: string;
};

export function ScrollHideBar({ children, edge = "bottom", open = false, scrollContainer, position = "fixed", className }: ScrollHideBarProps) {
  const [scrolledAway, setHidden] = useState(false);
  // Açık menüde hiç gizlenmez: durumdan türetilir, efektte eşitlenmez.
  const hidden = scrolledAway && !open;
  const ref = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const hold = useCallback((ms = 900) => {
    holdUntil.current = performance.now() + ms;
    setHidden(false);
  }, []);

  useEffect(() => {
    const target: HTMLElement | Window = scrollContainer ?? window;
    const read = () => (scrollContainer ? scrollContainer.scrollTop : window.scrollY);
    let last = read();
    const onScroll = () => {
      const y = read();
      if (performance.now() < holdUntil.current) {
        last = y;
        return;
      }
      const dy = y - last;
      if (Math.abs(dy) < 6) return;
      last = y;
      const focusedInside = ref.current?.contains(document.activeElement) ?? false;
      if (dy > 0 && y > 80 && !openRef.current && !focusedInside) setHidden(true);
      else if (dy < 0) setHidden(false);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [scrollContainer]);

  return (
    <BarContext.Provider value={{ hold, hidden }}>
      <style href="ui-scroll-hide-bar" precedence="default">
        {CSS}
      </style>
      <div
        ref={ref}
        data-edge={edge}
        data-hidden={hidden || undefined}
        inert={hidden}
        onFocus={() => setHidden(false)}
        className={cn(
          "ui-shb left-1/2 z-40 -translate-x-1/2",
          position === "fixed" ? "fixed" : "absolute",
          edge === "bottom" ? "bottom-[max(1rem,env(safe-area-inset-bottom))]" : "top-4",
          className,
        )}
      >
        <div className="flex items-center gap-1 rounded-full bg-overlay/90 p-1 shadow-floating ring-1 ring-line backdrop-blur-md">{children}</div>
      </div>
    </BarContext.Provider>
  );
}
