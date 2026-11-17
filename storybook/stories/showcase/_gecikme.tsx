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
 *   - SAYI BAĞLAMIYLA: başlık ne olduğunu söyler ("Teslim Tarihi Geçen
 *     Siparişler"), sayı birimiyle aynı satırda ("3 sipariş"), altında iki
 *     özet satırı: en uzun gecikme · bekleyen tutar. (2026-11-17: önceden "3" başlığın üstünde tek başına
 *     duruyordu; sahibi "tuhaf" buldu. Tek sayı bağlamsız kalınca okunmuyor.)
 *   - SATIR KARTIN GENİŞLİĞİNE GÖRE (container query): yolculuk çizgisi
 *     yalnız satır yeterince genişse yanda, değilse altta. Ekran genişliğine
 *     bağlıyken 1024 px'te müşteri adı kayboluyor, rozet iki satıra kırılıyordu.
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
  const waiting = rows.reduce((a, r) => a + r.o.total, 0);
  const facts = [
    { value: String(rows.length), label: "sipariş" },
    { value: `${longest} gün`, label: "en uzun gecikme" },
    { value: tl.format(waiting), label: "bekleyen tutar" },
  ];

  return (
    <section aria-labelledby="pano-gecikme" data-tour="gecikme" className="edge-lit overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between gap-6 border-b border-line-soft bg-surface p-5 lg:border-r lg:border-b-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-warning-wash text-warning ring-1 ring-inset ring-warning/20">
                <PackageX className="size-[1.125rem]" strokeWidth={2.25} />
              </span>
              <span className="text-small font-semibold text-warning">Teslimat Gecikmesi</span>
            </div>
            <h2 id="pano-gecikme" className="mt-4 text-title font-semibold tracking-tight text-strong">
              Teslim Tarihi Geçen Siparişler
            </h2>
            {/* Sayı birimiyle aynı satırda ("3 sipariş"), altında iki özet satırı: sayı tek başına durmaz, dar panelde de kesilmez. */}
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-display font-semibold tracking-tight text-strong tabular-nums">{rows.length}</span>
              <span className="text-title font-semibold text-strong">sipariş</span>
            </p>
            <dl className="mt-3 divide-y divide-line-soft border-y border-line-soft text-base">
              {facts.slice(1).map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-muted first-letter:uppercase">{f.label}</dt>
                  <dd className="font-semibold text-strong tabular-nums">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-base text-body">Hepsi kargo aktarma merkezinde bekliyor; satıra basınca talebi açılır.</p>
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

        <ol aria-label="Geciken siparişler" className="grid auto-rows-fr grid-cols-1 divide-y divide-line-soft">
          {rows.map(({ o, c, late, promised, ticket }) => (
            <li key={o.id} className="@container grid">
              <a
                href={ticket ? href("inbox", { ticket: ticket.id }) : href("inbox", { tag: "gecikme" })}
                className="group grid h-full content-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface @xl:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] @xl:items-center @xl:gap-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    {/* Rozet adın ardından değil KENDİ SÜTUNUNDA: ad uzunluğu değişse de "+N Gün" alt alta aynı hizada (hizalama kuralı). */}
                    <p className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="truncate text-base font-semibold text-strong">{c.name}</span>
                      <span className="rounded-full bg-warning-fill px-2 py-0.5 text-micro font-bold whitespace-nowrap text-on-warning-fill tabular-nums">
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
