import type { ElementType, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Sistem durumu listesi: ürünün bileşenleri (gönderim, API, ödemeler) ve
 * her birinin şu anki hali; başlıkta genel durum, dipte son olay. MailPulse
 * yardım merkezinin "Sistem durumu" bloğundan alındı (yapı).
 *
 * DÖRT DURUM, renk + METİN: `operational` "Çalışıyor" (yeşil),
 * `degraded` "Yavaş" (uyarı), `outage` "Kesinti" (tehlike), `maintenance`
 * "Bakımda" (nötr). Renk tek işaret değil: hapın metni durumu söyler.
 *
 * GENEL DURUM bileşenlerden TÜRER, elle yazılmaz: hepsi çalışıyorsa
 * `allOkText`, aksi halde en kötü durumun adı + sayısı ("1 bileşende
 * kesinti"). Böylece başlık listeyle çelişemez.
 *
 * BOŞ LİSTE ve BİLİNMEYEN DURUM: boş listede genel durum YAZILMAZ ("tüm
 * sistemler çalışıyor" demek kanıtsız güvence olurdu); çalışma zamanında
 * tanımsız bir `status` dizgisi (API'den gelen) "Bilinmiyor" sayılır ve genel
 * özeti "yavaş" seviyesine çeker, sayfa çökmez. `headingLevel`: başlık
 * düzeyi (varsayılan 3).
 *
 * Statik metin: `role="status"`/canlı bölge YOK. Durum sayfası okunmak için
 * açılır; sayfa açıkken yenilenen bir değer ekran okuyucuyu bölmez (sürekli
 * canlı güncelleme gerekiyorsa üst sayfa kendi canlı bölgesini kurar).
 * `ul`; son olay satırı (`incident`) hazır metin: tarih biçimi çağıranın.
 *
 *   <StatusList title="Sistem durumu" items={[{ id: "g", label: "Gönderim", status: "operational" }]} incident="Son olay 3 Ara · 18 dakikada çözüldü" />
 */

export type SystemStatus = "operational" | "degraded" | "outage" | "maintenance";

const STATUS = {
  operational: { label: "Çalışıyor", tone: "success", rank: 0, phrase: "" },
  maintenance: { label: "Bakımda", tone: "neutral", rank: 1, phrase: "bileşende bakım" },
  degraded: { label: "Yavaş", tone: "warning", rank: 2, phrase: "bileşende yavaşlık" },
  outage: { label: "Kesinti", tone: "danger", rank: 3, phrase: "bileşende kesinti" },
} as const;

const UNKNOWN = { label: "Bilinmiyor", tone: "neutral", rank: 2, phrase: "bileşenin durumu bilinmiyor" } as const;
const info = (status: string) => (status in STATUS ? STATUS[status as SystemStatus] : UNKNOWN);

const DOT = { success: "bg-success", neutral: "bg-muted", warning: "bg-warning", danger: "bg-danger" } as const;

export type StatusItem = { id: string; label: ReactNode; status: SystemStatus };

export function StatusList({
  title,
  items,
  incident,
  allOkText = "Tüm sistemler çalışıyor",
  headingLevel = 3,
  className,
}: {
  title: ReactNode;
  items: readonly StatusItem[];
  /** Dipteki son olay özeti. */
  incident?: ReactNode;
  allOkText?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const H = `h${headingLevel}` as ElementType;
  // Her öğenin durum bilgisi; en kötüsü genel durumu belirler.
  const worstInfo = items.map((i) => info(i.status)).reduce<(typeof STATUS)[SystemStatus] | typeof UNKNOWN>((w, s) => (s.rank > w.rank ? s : w), STATUS.operational);
  const count = items.filter((i) => info(i.status) === worstInfo).length;
  const summary = worstInfo.rank === 0 ? allOkText : `${count} ${worstInfo.phrase}`;
  const dot = DOT[worstInfo.tone];
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <H className="text-read font-semibold text-strong">{title}</H>
        {items.length > 0 ? (
          <p className="flex items-center gap-1.5 text-small text-body">
            <span aria-hidden className={cn("size-2 rounded-full", dot)} />
            {summary}
          </p>
        ) : null}
      </div>
      <ul role="list" className="mt-2 divide-y divide-line-soft">
        {items.map((item) => {
          const s = info(item.status);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-small text-body">
              <span className="min-w-0 truncate">{item.label}</span>
              <Badge tone={s.tone} dot>
                {s.label}
              </Badge>
            </li>
          );
        })}
      </ul>
      {incident ? <p className="mt-2 text-micro text-muted">{incident}</p> : null}
    </section>
  );
}
