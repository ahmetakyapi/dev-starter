// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "../utils";

/**
 * Bölüm gezintisi (içindekiler): uzun bir sayfanın üstünde yapışkan hap.
 * Bölümler yan yana; okunan bölüm vurgulu, hapın altında sayfanın ne
 * kadarının okunduğunu gösteren ince çizgi. Ayarlar, belge, rapor gibi beş
 * ve daha fazla bölümlü sayfalarda; kısa sayfada gürültüdür.
 *
 * ETKİN BÖLÜM GÖZLEMCİYLE: başlıklar `IntersectionObserver` ile izlenir
 * (görüş alanının üst %40'ına giren son başlık etkin); kaydırma dinleyicisi
 * yok. Bağlantı `aria-current="location"` taşır.
 *
 * İLERLEME ÇİZGİSİ KAYDIRMAYA BAĞLI CSS: `animation-timeline: scroll(nearest)`
 * ile `scale-x` 0 → 1; sayfa pencerede ya da bir kabın içinde kaysa da en
 * yakın kaydırma kabını izler. Desteklemeyen tarayıcıda çizgi görünmez,
 * gezinme çalışır.
 *
 * TIKLAMA: hedef başlığa yumuşak kaydırır (hareketi azaltanda anında),
 * başlığa odak verir (`tabIndex={-1}` yoksa eklenir): klavye kullanıcısı
 * bölümün başından devam eder. Adres `#id` ile güncellenir, geri tuşu çalışır.
 *
 *   <TocNav label="Bu Sayfada" sections={[{ id: "ayar-profil", label: "Profil" }, …]} />
 */

export type TocSection = { id: string; label: string };

const CSS = `
@supports (animation-timeline: scroll()) {
  .ui-toc-progress { animation: ui-toc-progress linear both; animation-timeline: scroll(nearest); }
}
@keyframes ui-toc-progress { from { scale: 0 1; } to { scale: 1 1; } }`;

type TocNavProps = {
  sections: readonly TocSection[];
  label?: string;
  /** Yapışkan üst boşluk (başlık çubuğu varsa onun boyu). */
  top?: string;
  className?: string;
};

export function TocNav({ sections, label = "Bu Sayfada", top = "0.75rem", className }: TocNavProps) {
  const [active, setActive] = useState(sections[0]?.id);
  const list = useRef<HTMLUListElement>(null);
  // Tıklanan bölüm görünür kaldıkça etkin kalır: iki sütunlu düzende yan yana
  // duran iki başlıktan gözlemci soldakini seçerdi.
  const pinned = useRef<string | null>(null);
  const reached = useRef(false);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        if (pinned.current) {
          if (seen.get(pinned.current)) {
            reached.current = true;
            setActive(pinned.current);
            return;
          }
          // Kaydırma hâlâ yolda: aradan geçen bölümler etkin olmasın.
          if (!reached.current) return;
          pinned.current = null;
        }
        const current = sections.filter((s) => seen.get(s.id)).at(0);
        if (current) setActive(current.id);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections]);

  // Etkin hap şeridin dışında kaldıysa şeridi YATAYDA kaydır (telefonda şerit
  // taşar). `scrollIntoView` KULLANMA: bütün ataları kaydırır ve tıklamanın
  // başlattığı sayfa kaydırmasını yarıda keser (ölçüldü: hedef 2000 px aşağıda
  // kalıyordu).
  useEffect(() => {
    const ul = list.current;
    const li = ul?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!ul || !li) return;
    const left = li.offsetLeft - ul.offsetLeft;
    if (left < ul.scrollLeft || left + li.offsetWidth > ul.scrollLeft + ul.clientWidth) {
      ul.scrollTo({ left: left - (ul.clientWidth - li.offsetWidth) / 2 });
    }
  }, [active]);

  function go(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    history.replaceState(null, "", `#${id}`);
    pinned.current = id;
    reached.current = false;
    setActive(id);
  }

  return (
    <nav aria-label={label} className={cn("sticky z-30", className)} style={{ top }}>
      <style href="ui-toc-nav" precedence="default">
        {CSS}
      </style>
      <div className="glass relative mx-auto w-fit max-w-full overflow-hidden rounded-xl shadow-floating">
        <ul ref={list} className="flex gap-0.5 overflow-x-auto p-1 [scrollbar-width:none]">
          {sections.map((s, i) => {
            const on = s.id === active;
            return (
              <li key={s.id} data-id={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-current={on ? "location" : undefined}
                  onClick={(event) => go(event, s.id)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-small font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-200",
                    on ? "bg-overlay text-strong shadow-raised" : "text-muted hover:text-strong",
                  )}
                >
                  <span aria-hidden className="font-mono text-micro text-muted tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
        <span aria-hidden className="ui-toc-progress absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary" />
      </div>
    </nav>
  );
}
