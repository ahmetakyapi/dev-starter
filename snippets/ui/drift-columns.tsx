import { Children, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Süzülen sütunlar: görsel kartları birkaç dikey sütunda, komşu sütunlar ZIT
 * yönde, çok yavaş ve sonsuz akar (offscreen.wtf'in kahramanı: duvar kâğıdı
 * galerisi kendi kendine kayan bir vitrin). Galeri, şablon, tema ya da
 * portfolyo sitesinin kahramanında "burada çok şey var" demenin sakin yolu.
 * İçerik sayfası ve veri ekranında değil.
 *
 * NASIL: her sütun içeriğini iki kez dizer ve `translateY(0 → -50%)` döner
 * (dikiş görünmez). Tek CSS animasyonu, JavaScript yok, sunucu bileşeni.
 * Üst ve alt kenar maske ile solar. Üzerine gelince ya da içinde odak
 * varken sütun durur (kart tıklanabilirse hedef kaçmasın).
 *
 * ERİŞİLEBİLİRLİK: ikinci kopya `aria-hidden` ve `inert` (ekran okuyucu ve
 * Tab bir kez gezer). Hareketi azaltan kullanıcıda akış durur, sütunlar
 * kaydırılabilir dururlar. Sonsuz hareket WCAG 2.2.2'ye göre 5 saniyeden uzun
 * sürerse durdurulabilmeli: üzerine gelme/odak durdurur; kahramanda yalnızca
 * süs olarak kullan, okunacak metin koyma.
 *
 *   <DriftColumns columns={3} className="h-[38rem]">
 *     {wallpapers.map((w) => <img key={w.id} src={w.thumb} alt={w.title} className="rounded-lg" />)}
 *   </DriftColumns>
 */

const CSS = `
@keyframes ui-drift-up { to { transform: translateY(-50%); } }
@keyframes ui-drift-down { from { transform: translateY(-50%); } to { transform: translateY(0); } }
.ui-drift { -webkit-mask-image: linear-gradient(transparent, black 12%, black 88%, transparent); mask-image: linear-gradient(transparent, black 12%, black 88%, transparent); }
.ui-drift-track { animation: ui-drift-up var(--drift-dur) linear infinite; }
.ui-drift-col[data-dir="down"] .ui-drift-track { animation-name: ui-drift-down; }
.ui-drift-col:hover .ui-drift-track, .ui-drift-col:focus-within .ui-drift-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ui-drift-track { animation: none; }
  .ui-drift-col { overflow-y: auto; }
  .ui-drift-copy { display: none; }
}`;

type DriftColumnsProps = {
  children: ReactNode;
  /** Sütun sayısı (2-4). Öğeler sırayla sütunlara dağıtılır. */
  columns?: 2 | 3 | 4;
  /** Bir turun süresi, saniye. Büyüdükçe yavaşlar; 50-90 sakin. */
  duration?: number;
  /** Öğeler arası ve sütunlar arası boşluk (Tailwind gap sınıfı değil, piksel). */
  gap?: number;
  className?: string;
};

export function DriftColumns({ children, columns = 3, duration = 70, gap = 16, className }: DriftColumnsProps) {
  const items = Children.toArray(children);
  const cols = Array.from({ length: columns }, (_, c) => items.filter((_, i) => i % columns === c));

  return (
    <div
      className={cn("ui-drift grid overflow-hidden", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap, "--drift-dur": `${duration}s` } as CSSProperties}
    >
      <style href="ui-drift-columns" precedence="default">
        {CSS}
      </style>
      {cols.map((col, c) => (
        <div key={c} className="ui-drift-col h-full overflow-hidden" data-dir={c % 2 ? "down" : "up"}>
          {/* Komşu sütunlar farklı hızda: eşit hız duvar gibi görünür. */}
          <div className="ui-drift-track flex flex-col" style={{ gap, animationDuration: `${duration * (1 + c * 0.12)}s` }}>
            <div className="flex flex-col" style={{ gap }}>
              {col}
            </div>
            <div className="ui-drift-copy flex flex-col" style={{ gap }} aria-hidden inert>
              {col}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
