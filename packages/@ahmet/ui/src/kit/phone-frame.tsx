// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Telefon maketi: ince çerçeve, kamera adası, durum çubuğu (saat, sinyal,
 * pil) ve içinde token'la çizilmiş ekran. `app-window`ın telefon karşılığı:
 * ürünü ekran görüntüsü yerine CANLI parçalarla anlatmak için. gethoy.app'in
 * "Soon on iPhone and iPad" bölümünden öğrenildi (kod ve görsel alınmadı):
 * orada telefon kaydırınca yandan kayıp yerine oturuyor, ekranındaki kanal
 * listesi sitenin geri kalanıyla aynı dilde.
 *
 * NE ZAMAN: mobil uygulamanın tanıtımı, "yakında telefonda" bölümü, masaüstü
 * maketinin yanında aynı verinin telefondaki hâli.
 * NE ZAMAN DEĞİL: gerçek ekran görüntüsünü çerçevelemek için zorunlu değil
 * (`children` bir `img` de olabilir, ama temayla dönmez); markalı cihaz
 * görseli (logo, düğme yerleşimi taklidi yok: çerçeve genel).
 *
 * RENK: çerçeve ve kamera adası donanımdır, iki temada AYNI koyu
 * (`--chart-ink`, iki temada sabit token); ekran sayfanın kendi zemini
 * (`bg-page`), içerik temayla döner. Koyu temada çerçeve kıl çizgiyle
 * zeminden ayrılır. Gölge `shadow-modal`.
 *
 * ÖLÇÜ: `width` piksel (varsayılan 280); oran 9 : 19,5. Bütün ölçüler tek
 * değişkenden (`--u` = genişliğin yüzde biri): her boyda aynı görünür. (`cqi`
 * kullanılmadı: kap birimi öğenin KENDİSİNDE değil yalnız çocuklarında
 * çalışır; ilk sürümde köşeler sayfaya göre büyüyüp telefon oval oldu.)
 *
 * ERİŞİLEBİLİRLİK: çerçeve ve durum çubuğu süs (`aria-hidden`). Maket bir
 * resimdir: `label` verilirse `role="img"` + ad, içerik okunmaz; verilmezse
 * içerik normal okunur (canlı demo).
 *
 *   <PhoneFrame width={260} label="Telefonda kanal listesi">
 *     <ChannelList />
 *   </PhoneFrame>
 */

type PhoneFrameProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  width?: number;
  /** Durum çubuğundaki saat. */
  time?: string;
  /** Verilirse maket tek resim olarak okunur. */
  label?: string;
};

const CSS = `
.ui-phone { --u: calc(var(--phone-w) / 100); aspect-ratio: 9 / 19.5; padding: calc(var(--u) * 3.2); border-radius: calc(var(--u) * 15);
  background: var(--chart-ink); box-shadow: inset 0 0 0 1px var(--line-strong); }
.ui-phone-screen { position: relative; height: 100%; overflow: hidden; border-radius: calc(var(--u) * 11.8); background: var(--page-bg); display: flex; flex-direction: column; }
.ui-phone-bar { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; height: calc(var(--u) * 12); padding: 0 calc(var(--u) * 7); flex-shrink: 0;
  font-size: calc(var(--u) * 4.4); line-height: 1; font-weight: 600; color: var(--text-strong); font-variant-numeric: tabular-nums; }
.ui-phone-island { position: absolute; z-index: 2; top: calc(var(--u) * 2.8); left: 50%; translate: -50% 0; width: calc(var(--u) * 28); height: calc(var(--u) * 8); border-radius: 9999px; background: var(--chart-ink); }
.ui-phone-icons { display: flex; align-items: center; gap: calc(var(--u) * 1.4); }
.ui-phone-sig { display: flex; align-items: flex-end; gap: calc(var(--u) * 0.6); height: calc(var(--u) * 3.2); }
.ui-phone-sig > span { width: calc(var(--u) * 0.9); border-radius: 1px; background: currentColor; }
.ui-phone-bat { position: relative; width: calc(var(--u) * 6.4); height: calc(var(--u) * 3.1); border-radius: calc(var(--u) * 1); box-shadow: inset 0 0 0 calc(var(--u) * 0.35) color-mix(in oklab, currentColor 45%, transparent); }
.ui-phone-bat::after { content: ""; position: absolute; inset: calc(var(--u) * 0.7) calc(var(--u) * 1.6) calc(var(--u) * 0.7) calc(var(--u) * 0.7); border-radius: calc(var(--u) * 0.5); background: currentColor; }
.ui-phone-body { position: relative; flex: 1; min-height: 0; overflow: hidden; }`;

export function PhoneFrame({ children, width = 280, time = "9:41", label, className, style, ...props }: PhoneFrameProps) {
  return (
    <div
      {...props}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ width, "--phone-w": `${width}px`, ...style } as CSSProperties}
      className={cn("ui-phone shrink-0 shadow-modal", className)}
    >
      <style href="ui-phone-frame" precedence="default">
        {CSS}
      </style>
      <div className="ui-phone-screen">
        <div aria-hidden className="ui-phone-island" />
        <div aria-hidden className="ui-phone-bar">
          <span>{time}</span>
          <span className="ui-phone-icons">
            <span className="ui-phone-sig">
              <span style={{ height: "40%" }} />
              <span style={{ height: "60%" }} />
              <span style={{ height: "80%" }} />
              <span style={{ height: "100%" }} />
            </span>
            <span className="ui-phone-bat" />
          </span>
        </div>
        <div className="ui-phone-body" aria-hidden={label ? true : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
