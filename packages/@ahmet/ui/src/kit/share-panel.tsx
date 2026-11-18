// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { Switch } from "./switch";
import { cn } from "../utils";

/**
 * Paylaşım paneli: bağlantı + kopyala ve "kimlerle paylaşılıyor" satırları
 * (ekip, bağlantıya sahip herkes…); her satır bir aç/kapa. Bir rapor, görünüm
 * ya da belge paylaşılırken diyaloğun (`dialog.tsx`) gövdesi. Önizlemeyi
 * (paylaşılan şeyin küçük kartı) çağıran üstüne koyar.
 *
 * NE ZAMAN DEĞİL: tek tek kişi davet etmek (e-posta alanı + rol) o bir
 * davet formu; burada erişim KİTLE düzeyinde (ekip / herkes).
 *
 * Neden satır başına anahtar: paylaşımın kapsamı bir bakışta okunur ve geri
 * alınabilir; açılır menüdeki "Kimler görebilir: …" seçimi durumu gizler.
 * Hiçbir satır açık değilken bağlantı kopyalanabilir ama işe yaramaz: alan
 * bunu söyler ("Önce erişimi aç"), kopyala butonu kapanmaz (bağlantıyı
 * sonra açmak isteyen olabilir). Yöntem referans turundan (2026-11; dil ve
 * davranış, kod değil).
 *
 * Erişilebilirlik: satırın tamamı anahtarın etiketi (`switch.tsx`): ada,
 * kitle etiketine ya da avatarlara tıklamak da değiştirir; ekran okuyucu
 * "Pusula Ekibi, Ekip, 6 kişi, anahtar, açık" der. Bağlantı salt okunur
 * metin, kopyalama sonucu canlı bölgede (`copy-button`).
 *
 * Örnek:
 *   <SharePanel link="https://pusula.app/r/r1" access={[
 *     { id: "ekip", label: "Pusula Ekibi", tag: "Ekip", people: names, checked, onCheckedChange },
 *   ]} />
 */

export type ShareAccess = {
  id: string;
  label: string;
  /** Kitle etiketi: "Ekip", "Herkese Açık". */
  tag?: string;
  /** Solda ikon (ör. küre); verilmezse adın baş harfi. */
  icon?: ReactNode;
  /** Kitlenin kişileri: baş harf yığını (en çok 4 + "+N"). */
  people?: readonly string[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

type SharePanelProps = {
  link: string;
  access: readonly ShareAccess[];
  linkLabel?: string;
  heading?: string;
  className?: string;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");

export function SharePanel({ link, access, linkLabel = "Bağlantı", heading = "Paylaşılanlar", className }: SharePanelProps) {
  const open = access.some((a) => a.checked);
  return (
    <div className={cn("grid gap-5", className)}>
      <div>
        <div className="flex min-h-12 items-center gap-2.5 rounded-lg bg-surface py-1.5 pr-1.5 pl-3 ring-1 ring-inset ring-line-soft">
          <Link2 aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="sr-only">{linkLabel}: </span>
          <span className="min-w-0 flex-1 truncate font-mono text-small text-strong">{link}</span>
          <CopyButton value={link} label="Bağlantıyı Kopyala" className="shrink-0" />
        </div>
        {!open ? <p className="mt-1.5 px-1 text-small text-muted">Erişim kapalı: bağlantıyı açan kimse içeriği göremez. Önce aşağıdan erişimi aç.</p> : null}
      </div>

      <div>
        <p className="mb-1 px-1 text-small font-medium text-muted">{heading}</p>
        <div className="divide-y divide-line-soft">
          {access.map((a) => (
            <Switch
              key={a.id}
              checked={a.checked}
              onChange={(e) => a.onCheckedChange(e.currentTarget.checked)}
              // Etiket satırı doldursun: avatar yığını sağa, anahtarın hemen soluna yaslanır.
              className="px-1 [&>span:first-of-type]:flex-1"
              label={
                <span className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="inline-grid size-8 shrink-0 place-items-center rounded-full bg-surface text-small font-semibold text-body ring-1 ring-inset ring-line-soft [&_svg]:size-4">
                    {a.icon ?? initials(a.label)}
                  </span>
                  <span className="min-w-0 truncate">{a.label}</span>
                  {a.tag ? (
                    <span className="shrink-0 rounded-md px-1.5 py-0.5 text-micro font-medium text-body ring-1 ring-inset ring-line">{a.tag}</span>
                  ) : null}
                  {a.people?.length ? (
                    <span className="ml-auto flex shrink-0 items-center pl-2">
                      <span className="sr-only">, {a.people.length} kişi</span>
                      {a.people.slice(0, 4).map((name, i) => (
                        <span
                          key={name}
                          aria-hidden
                          className={cn("grid size-7 place-items-center rounded-full bg-surface-raised text-micro font-semibold text-body ring-2 ring-overlay", i > 0 && "-ml-1.5")}
                        >
                          {initials(name)}
                        </span>
                      ))}
                      {a.people.length > 4 ? (
                        <span aria-hidden className="-ml-1.5 grid size-7 place-items-center rounded-full bg-surface-raised text-micro text-body ring-2 ring-overlay">
                          +{a.people.length - 4}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
