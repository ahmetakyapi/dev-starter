import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Vitrin giriş sayfası (`app/vitrin/page.tsx`): beş grup, her biri büyük
 * yuvarlak kart. Sunucu bileşeni. Grup sayfaları içerideki örnek
 * bağlantılarda (`/vitrin?bolum=…`) buraya döner; bu sayfa olmadan o
 * bağlantıların ön yüklemesi 404 alır.
 */

export const metadata: Metadata = {
  title: "Bileşen Vitrini",
  robots: { index: false },
};

const GROUPS = [
  { href: "/vitrin/polish", title: "Temel Kütüphane", note: "Menü, seçim, onay kutusu, anahtar, sekmeler, rozet, tablo ve 25 bileşen daha.", count: 33 },
  { href: "/vitrin/form", title: "Form Girişleri", note: "Kaydırıcı, sayı alanı, doğrulama kodu, renk seçici, takvim, tarih ve saat.", count: 9 },
  { href: "/vitrin/feedback", title: "Katman ve Geri Bildirim", note: "Bağlam menüsü, bildirim merkezi, uyarı satırı, ilerleme, ölçer, atlıkarınca.", count: 10 },
  { href: "/vitrin/charts", title: "Grafikler", note: "Alan, gösterge, huni, ısı haritası, radar, sankey; ekrana girince çizilir.", count: 11 },
  { href: "/vitrin/blocks", title: "Bloklar", note: "Uygulama kabuğu ve yapay zekâ sohbeti, giriş kartı, ayarlar, palet seçici.", count: 7 },
] as const;

export default function VitrinPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-small font-medium text-muted">dev-starter · board dili</p>
      <h1 className="mt-2 max-w-2xl text-display font-semibold tracking-[-0.03em] text-strong sm:text-hero">Bileşen Vitrini</h1>
      <p className="mt-4 max-w-xl text-lead text-body">
        Sakin yüzey, renkli veri. Her parça kendi token&apos;larımızla, iki temada ve klavyeyle çalışır.
      </p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="group flex h-full flex-col rounded-2xl bg-surface p-6 transition-colors hover:bg-surface-raised"
            >
              <span className="flex items-start justify-between gap-4">
                <span className="text-title font-semibold text-strong">{g.title}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-overlay shadow-raised transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <ArrowUpRight aria-hidden className="size-4 text-strong" />
                </span>
              </span>
              <span className="mt-2 text-base text-body">{g.note}</span>
              <span className="mt-6 text-small font-medium text-muted tabular-nums">{g.count} bileşen</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
