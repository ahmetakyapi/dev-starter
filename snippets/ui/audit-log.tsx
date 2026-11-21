import { ArrowRight, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Denetim kaydı görüntüleyici: "kim, ne zaman, neyi, neyden neye değiştirdi".
 * Her satır bir olay: yapan kişi, eylem, hedef (kayıt kimliği, mono), zaman
 * ve isteğe bağlı ÖNCE → SONRA farkı. Reddedilen deneme (yetkisiz işlem)
 * açıkça "Reddedildi" metniyle işaretlenir.
 *
 * NE ZAMAN: ayarlar, uyum ve yönetici ekranlarında "değişiklik geçmişi".
 * Bir kaydın kendi geçmişi (sipariş, sayaç) için `timeline.tsx`; bu bileşen
 * HESABIN/SİSTEMİN geçmişi: birden çok kişi, birden çok kayıt, süzülebilir.
 *
 * Günlük değişmezdir: bileşen yalnız OKUR (silme/düzenleme yok). Süzgeç ve
 * dışa aktarma çağıranın işi: `toolbar` yuvasına arama/`active-filters` ve
 * "Dışa aktar" konur. Zaman ÇAĞIRANDAN gelir (`at` ISO, `when` görünen metin):
 * göreli zaman sunucu ve istemcide farklı çıkar (hidrasyon uyuşmazlığı), burada
 * biçimleme yok.
 *
 * ERİŞİLEBİLİRLİK: `ol` + ad; her zaman `<time dateTime>`. Fark satırında
 * "Önce:" ve "Sonra:" görünmez etiketlerle okunur (ok yalnız süs); eski değer
 * üstü çizili ama okunur kalır. Reddedilen satır renkle değil "Reddedildi"
 * metni ve ikonla belli. Yeni kayıtlar listeye eklenince duyurmak istersen
 * çağıran canlı bölge kurar (liste kendisi canlı bölge değil). İçine
 * etkileşimli öğe koyma.
 *
 *   <AuditLog
 *     label="Denetim Günlüğü"
 *     entries={[{ id: "1", at: "2026-11-21T10:40:00+03:00", when: "21 Kas 10:40", actor: "Aylin Yıldırım",
 *       action: "Tarife güncelledi", target: "T-AG-KONUT", before: "₺3,12", after: "₺3,28" }]}
 *     toolbar={<ActiveFilters … />}
 *   />
 */

export type AuditEntry = {
  id: string;
  /** ISO zaman: `<time dateTime>`. */
  at: string;
  /** Görünen zaman: "21 Kas, 10:40". */
  when: ReactNode;
  actor: string;
  /** Rol ya da birim, ikinci satır: "Tahsilat Uzmanı". */
  actorDetail?: string;
  action: string;
  /** Hedef kayıt: "F-202610-0083" (mono). */
  target?: string;
  before?: string;
  after?: string;
  /** Reddedilen deneme: yetki yok, iki göz onayı reddi. */
  denied?: boolean;
};

type AuditLogProps = {
  entries: readonly AuditEntry[];
  label?: string;
  /** Üstte süzgeç ve dışa aktarma yuvası. */
  toolbar?: ReactNode;
  emptyText?: string;
  className?: string;
};

export function AuditLog({ entries, label = "Denetim Günlüğü", toolbar, emptyText = "Eşleşen kayıt yok.", className }: AuditLogProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {toolbar ? <div className="mb-3">{toolbar}</div> : null}
      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-base text-muted">{emptyText}</p>
      ) : (
        <ol role="list" aria-label={label} className="divide-y divide-line-soft">
          {entries.map((e) => (
            <li key={e.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3">
              <p className="min-w-0 text-base text-body">
                <span className="font-medium text-strong">{e.actor}</span>
                {e.actorDetail ? <span className="text-muted"> ({e.actorDetail})</span> : null} {e.action}
                {e.target ? <> <span className="font-mono text-small tabular-nums text-strong">{e.target}</span></> : null}
              </p>
              <time dateTime={e.at} className="text-small whitespace-nowrap text-muted tabular-nums">
                {e.when}
              </time>
              {e.denied ? (
                <p className="col-span-2 inline-flex items-center gap-1.5 text-small font-medium text-danger">
                  <ShieldX aria-hidden className="size-3.5" />
                  Reddedildi
                  {e.after ? <span className="font-normal text-muted">: {e.after}</span> : null}
                </p>
              ) : e.before !== undefined || e.after !== undefined ? (
                <p className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-small">
                  {e.before !== undefined ? (
                    <span className="text-muted">
                      <span className="sr-only">Önce: </span>
                      <del className="decoration-muted/60">{e.before}</del>
                    </span>
                  ) : null}
                  {e.before !== undefined && e.after !== undefined ? <ArrowRight aria-hidden className="size-3 text-muted" /> : null}
                  {e.after !== undefined ? (
                    <span className="font-medium text-strong">
                      <span className="sr-only">Sonra: </span>
                      {e.after}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
