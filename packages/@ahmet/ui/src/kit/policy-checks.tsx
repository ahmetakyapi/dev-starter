// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check, TriangleAlert, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Politika kontrolleri: bir talebin onaydan ÖNCE geçtiği otomatik denetimler
 * ("Bütçe içinde", "Onaylı satıcı", "Mevcut aracı kopyalıyor"). Her satır tek
 * durum (geçti, uyarı, başarısız) ve sağda kısa gerekçe. Onaylayan kişi
 * ayrıntı panelinde "neden güvenli ya da şüpheli" sorusunu satırlara bakarak
 * yanıtlar. Spendix onay kuyruğunun "Policy checks" bloğundan alındı (yapı;
 * kod, metin, görsel alınmadı).
 *
 * `state`: `pass` onay işareti, `warn` üçgen, `fail` çarpı. Durum RENK TEK
 * İŞARET DEĞİL: üç ikonun şekli farklı ve her satırda ekran okuyucuya
 * "Geçti:", "Uyarı:" ya da "Başarısız:" öneki okunur (görünmez). Renk
 * (`success`, `warning`, `danger`) yalnız ikonda.
 *
 * ÖZET satırı kontrollerden TÜRER: "2 / 3 kontrol temiz · 1 uyarı"; elle
 * yazılan özet (`summary`) listeyle çelişebilir, bu yüzden yalnız ek bir cümle
 * (ör. "Onay için başka koşul yok") için verilir ve türeyen satırın yanına
 * eklenir. Boş listede özet yazılmaz.
 *
 * `headingLevel`: başlık düzeyi (varsayılan 3). `title` verilmezse başlık
 * çizilmez (üst bileşen kendi başlığını koyar). Sunucu bileşeni; `ul` +
 * `role="list"` (Safari liste semantiğini korusun).
 *
 *   <PolicyChecks title="Politika Kontrolleri" checks={[
 *     { id: "butce", label: "Pazarlama bütçesi içinde", detail: "₺3.860 kalıyor", state: "pass" },
 *     { id: "kopya", label: "Mevcut aracı kopyalıyor", detail: "1 koltuk kayıtlı", state: "warn" },
 *   ]} />
 */

export type CheckState = "pass" | "warn" | "fail";

const STATE = {
  pass: { Icon: Check, label: "Geçti", ink: "text-success" },
  warn: { Icon: TriangleAlert, label: "Uyarı", ink: "text-warning" },
  fail: { Icon: X, label: "Başarısız", ink: "text-danger" },
} as const;

export type PolicyCheck = { id: string; label: ReactNode; detail?: ReactNode; state: CheckState };

export function PolicyChecks({
  checks,
  title,
  summary,
  headingLevel = 3,
  className,
}: {
  checks: readonly PolicyCheck[];
  title?: ReactNode;
  /** Türeyen özetin yanına eklenen cümle. */
  summary?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const H = `h${headingLevel}` as ElementType;
  const clean = checks.filter((c) => c.state === "pass").length;
  const warns = checks.filter((c) => c.state === "warn").length;
  const fails = checks.filter((c) => c.state === "fail").length;
  const derived = `${clean} / ${checks.length} kontrol temiz${warns ? ` · ${warns} uyarı` : ""}${fails ? ` · ${fails} başarısız` : ""}`;
  return (
    <section className={cn("min-w-0", className)}>
      {title || checks.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {title ? <H className="text-read font-semibold text-strong">{title}</H> : <span />}
          {checks.length > 0 ? (
            <p className="text-small text-muted">
              {derived}
              {summary ? <> · {summary}</> : null}
            </p>
          ) : null}
        </div>
      ) : null}
      <ul role="list" className="mt-1 divide-y divide-line-soft">
        {checks.map((c) => {
          const s = STATE[c.state];
          return (
            <li key={c.id} className="flex items-center gap-2.5 py-2.5 text-base">
              <s.Icon aria-hidden strokeWidth={2.25} className={cn("size-4 shrink-0", s.ink)} />
              <span className="min-w-0 flex-1 text-strong">
                <span className="sr-only">{s.label}: </span>
                {c.label}
              </span>
              {c.detail ? <span className="shrink-0 text-end text-small text-muted tabular-nums">{c.detail}</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
