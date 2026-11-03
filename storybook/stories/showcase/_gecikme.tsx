"use client";

import { ArrowRight, PackageX, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DELAYED, TICKETS, TODAY, customer, daysBetween, shortDate, tl } from "./_data";
import { href } from "./_ui";

/**
 * Gecikme kartı (Pano). Eski hali tam genişlikte kahverengi bir uyarı
 * şeridiydi: uzun cümlede üç müşteri adı, küçük ikon, iki temada iki ayrı
 * turuncu. Apple'ın sistem uyarılarındaki düzene göre yeniden kuruldu:
 *
 *   - ZEMİN NÖTR, RENK TEK NOKTADA: kart board dilinin gri kuyusu, içi beyaz
 *     karolar. Turuncu yalnız ikon karosunda, gecikme rozetinde ve yolculuk
 *     çizgisinin takıldığı adımda; üçü de `warning-fill`, iki temada BİREBİR
 *     aynı ton. Metin hiçbir yerde turuncu dolguya yazılmaz, `on-warning-fill`
 *     ile (9,6:1).
 *   - TEK BAKIŞTA SAYI: rakam display puntoda, cümle onun altında.
 *   - LİSTE CÜMLE DEĞİL: her sipariş kendi satırında; müşteri, sipariş no,
 *     tutar ve kaç gün geciktiği taranabilir. Satır, o siparişin talebine
 *     gider.
 *   - NEREDE TAKILDI: dört adımlı yolculuk (Sipariş → Kargoda → Aktarma →
 *     Teslim) "aktarma merkezinde bekliyor" cümlesini görsele çevirir.
 *     Çizgi süs (`aria-hidden`); aynı bilgi ekran okuyucuya metinle söylenir.
 *     Takılan adımın noktası nabız atar, hareketi azaltanda durağan.
 *
 * Söz verilen süre 4 gün (siparişler 4 günden sonra "Yolda"dan çıkar;
 * `_data.ts`). Sayılar ÖRNEKTİR.
 */

const PROMISE_DAYS = 4;
const STEPS = ["Sipariş", "Kargoda", "Aktarma", "Teslim"] as const;
const STUCK = 2;

export function DelayCard() {
  const rows = DELAYED.map((o) => {
    const c = customer(o.customerId);
    const age = daysBetween(o.date, TODAY);
    const promised = new Date(o.date.getTime() + PROMISE_DAYS * 86_400_000);
    const ticket = TICKETS.find((t) => t.orderId === o.id);
    return { o, c, late: age - PROMISE_DAYS, promised, ticket };
  }).sort((a, b) => b.late - a.late);
  const longest = Math.max(...rows.map((r) => r.late));

  return (
    <section aria-labelledby="pano-gecikme" className="edge-lit rounded-2xl bg-surface p-2">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between gap-6 rounded-xl bg-overlay p-5 shadow-raised">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-9 place-items-center rounded-md bg-warning-fill text-on-warning-fill shadow-raised">
                <PackageX className="size-[1.125rem]" strokeWidth={2.25} />
              </span>
              <span className="text-small font-semibold text-warning">Teslimat Gecikmesi</span>
            </div>
            <h2 id="pano-gecikme" className="mt-5 text-title font-semibold text-strong">
              <span className="block text-display font-semibold tabular-nums">{rows.length}</span>
              Sipariş Teslim Tarihini Geçti
            </h2>
            <p className="mt-2 text-base text-body">
              Hepsi kargo aktarma merkezinde bekliyor. En uzun bekleyen söz verilen tarihi {longest} gün geçti.
            </p>
          </div>
          <div className="grid gap-2">
            <a href={href("inbox", { tag: "gecikme" })} className={buttonClass({ variant: "primary", className: "w-full" })}>
              Talepleri Gör
              <ArrowRight aria-hidden />
            </a>
            <a href={href("assistant")} className={buttonClass({ variant: "ghost", className: "w-full" })}>
              <Sparkles aria-hidden />
              E-postaları Yazdır
            </a>
          </div>
        </div>

        <ol aria-label="Geciken siparişler" className="grid auto-rows-fr grid-cols-1 gap-2">
          {rows.map(({ o, c, late, promised, ticket }) => (
            <li key={o.id} className="grid">
              <a
                href={ticket ? href("inbox", { ticket: ticket.id }) : href("inbox", { tag: "gecikme" })}
                className="group grid gap-4 rounded-xl bg-overlay p-4 shadow-raised transition-[box-shadow] duration-200 hover:shadow-floating sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold text-strong">{c.name}</span>
                      <span className="shrink-0 rounded-full bg-warning-fill px-2 py-0.5 text-micro font-bold text-on-warning-fill tabular-nums">
                        +{late} Gün
                      </span>
                    </p>
                    <p className="truncate text-small text-muted">
                      {o.id} · {c.city} · {tl.format(o.total)} · Söz {shortDate.format(promised)}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="sr-only">
                    Durum: aktarma merkezinde bekliyor, {late} gün gecikti.{ticket ? ` Talep ${ticket.id}.` : ""}
                  </span>
                  <div aria-hidden className="grid grid-cols-4 gap-1">
                    {STEPS.map((step, i) => (
                      <span key={step} className="relative grid gap-1.5">
                        <span
                          className={cn(
                            "h-1.5 rounded-full",
                            i < STUCK ? "bg-primary" : i === STUCK ? "bg-warning-fill" : "bg-chart-track",
                          )}
                        />
                        {i === STUCK ? (
                          <span className="absolute -top-[3px] right-0 grid size-3 place-items-center">
                            <span className="absolute size-3 rounded-full bg-warning-fill opacity-60 motion-safe:animate-ping" />
                            <span className="size-3 rounded-full border-2 border-overlay bg-warning-fill" />
                          </span>
                        ) : null}
                        <span className={cn("text-micro", i === STUCK ? "font-semibold text-strong" : "text-muted")}>{step}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
