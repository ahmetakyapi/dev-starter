"use client";

import { Coffee, Compass, LayoutGrid, Mountain, ShoppingBag, SlidersHorizontal, Sunrise, Truck, Waves } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ArcCarousel } from "@/components/ui/arc-carousel";
import { ChannelMatrix, type MatrixValue } from "@/components/ui/channel-matrix";
import { ConnectionHero } from "@/components/ui/connection-hero";
import { DateRangePresets, type DateRangeValue } from "@/components/ui/date-range-presets";
import { dissolveOut } from "@/components/ui/dissolve";
import { FilterSheet, type FilterValue } from "@/components/ui/filter-sheet";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { MorphNav, MorphNavGrid } from "@/components/ui/morph-nav";
import { PasswordField } from "@/components/ui/password-field";
import { QuickPoll } from "@/components/ui/quick-poll";
import { RecordList } from "@/components/ui/record-list";
import { SharePanel } from "@/components/ui/share-panel";
import { BRAND, CAFES, TODAY, num } from "./_data";

/** Kafe siparişleri (kayıt listesi kuyusu): aynı kafe adları, örnek tutarlar. */
const CAFE_ORDERS = [
  { revenue: 18_420, orders: 12, status: "Teslim Edildi", tone: "success" },
  { revenue: 9_860, orders: 7, status: "Kavruluyor", tone: "warning" },
  { revenue: 6_240, orders: 4, status: "Sırada", tone: "neutral" },
] as const;
import { Cell } from "./_ui";

/**
 * Sonradan eklenen bileşenlerin kuyuları (2026-11 turları): her biri kendi
 * grubunun ızgarasına, grubun son satırı olarak girer. Aynı Kıyı Kahve
 * kurgusu ve verisi; ikişer ikişer (span 3) ya da tek başına tam satır.
 */

/* ── Seçim ──────────────────────────────────────────────────────────────── */
export function SecimEk() {
  const [matrix, setMatrix] = useState<MatrixValue>({ siparis: ["app", "mail"], kavrum: ["app"], stok: ["app", "sms"] });
  const [vote, setVote] = useState<string | null>(null);
  return (
    <>
      <Cell file="channel-matrix" name="Kanal Tablosu" note="Olay × kanal; satır başlığı ve sütun her hücrenin adında." span={3} align="stretch">
        <ChannelMatrix
          caption="Bildirim Kanalları"
          channels={[
            { id: "app", label: "Uygulama" },
            { id: "mail", label: "E-Posta" },
            { id: "sms", label: "SMS" },
          ]}
          rows={[
            { id: "siparis", label: "Yeni Sipariş" },
            { id: "kavrum", label: "Lot Kavruldu" },
            { id: "stok", label: "Stok Azaldı", hint: "Çekirdek 5 kg altı" },
          ]}
          value={matrix}
          onValueChange={setMatrix}
        />
      </Cell>
      <Cell file="quick-poll" name="Hızlı Oylama" note="Sonuç oy verince açılır; kendi oyuna yeniden basmak geri alır." span={3} align="stretch">
        <QuickPoll
          question="Kış harmanı hangi çekirdekle açılsın?"
          meta="Kavurucu ekibi · cumaya kadar"
          options={[
            { id: "etiyopya", label: "Etiyopya Yirgacheffe" },
            { id: "kolombiya", label: "Kolombiya Huila" },
            { id: "brezilya", label: "Brezilya Cerrado" },
          ]}
          counts={{ etiyopya: 4, kolombiya: 2, brezilya: 1 }}
          value={vote}
          onValueChange={setVote}
        />
      </Cell>
    </>
  );
}

/* ── Form ───────────────────────────────────────────────────────────────── */
const PRESETS = [
  { id: "7", label: "Son 7 Gün", days: 7 },
  { id: "30", label: "Son 30 Gün", days: 30 },
  { id: "90", label: "Son 90 Gün", days: 90 },
  { id: "tum", label: "Tümü", days: null },
] as const;

export function FormEk() {
  const [range, setRange] = useState<DateRangeValue>({ kind: "preset", id: "30" });
  return (
    <>
      <Cell file="date-range-presets" name="Tarih Aralığı Filtresi" note="Hazır aralıklar tek dokunuşta; özel aralık iki ayrı takvimde." span={3}>
        <div className="grid justify-items-center gap-3">
          <DateRangePresets label="Sipariş Tarihi" presets={PRESETS} value={range} onValueChange={setRange} today={TODAY} />
          <p className="text-small text-muted">Tabloyu ve grafikleri birlikte filtreler.</p>
        </div>
      </Cell>
      <Cell file="password-field" name="Kurallı Şifre" note="Kurallar yazdıkça yeşerir; göster butonu alanın içinde." span={3} align="stretch">
        <PasswordField label="Yeni Şifre" name="yeni-sifre" autoComplete="new-password" />
      </Cell>
    </>
  );
}

/* ── Katmanlar ──────────────────────────────────────────────────────────── */
const ROAST = [
  { value: "acik", label: "Açık", count: 3 },
  { value: "orta", label: "Orta", count: 5 },
  { value: "koyu", label: "Koyu", count: 2 },
];
const ORIGIN = [
  { value: "afrika", label: "Afrika", count: 4 },
  { value: "amerika", label: "Latin Amerika", count: 5 },
  { value: "asya", label: "Asya", count: 1 },
];

export function KatmanEk() {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({ kavrum: ["orta"], koken: [] });
  const [team, setTeam] = useState(true);
  const [anyone, setAnyone] = useState(false);
  const picked = Object.values(filters).flat().length;
  const result = 10 - (filters.kavrum?.length ? 5 : 0) - (filters.koken?.length ? 2 : 0);
  return (
    <>
      <Cell file="filter-sheet" name="Filtre Çekmecesi" note="Telefonda filtreler alttan açılır; buton kaç kayıt kalacağını söyler." span={3}>
        <div className="grid justify-items-center gap-3">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <SlidersHorizontal aria-hidden />
            Filtreler{picked ? ` · ${picked}` : ""}
          </Button>
          <p className="text-small text-muted">{num.format(result)} çekirdek listeleniyor</p>
        </div>
        <FilterSheet
          open={open}
          onOpenChange={setOpen}
          groups={[
            { id: "kavrum", label: "Kavrulma", options: ROAST, multiple: true },
            { id: "koken", label: "Köken", options: ORIGIN, multiple: true },
          ]}
          value={filters}
          onValueChange={setFilters}
          resultCount={result}
          resultLabel={(n) => `${num.format(n)} Kahveyi Göster`}
          onClear={() => setFilters({ kavrum: [], koken: [] })}
        />
      </Cell>
      <Cell file="share-panel" name="Paylaşım Paneli" note="Bağlantı ve kopyala; kimlerin gördüğü satır satır aç-kapa." span={3} align="stretch">
        <SharePanel
          link={`https://${BRAND.domain}/r/kasim`}
          access={[
            { id: "ekip", label: "Kavurucu Ekibi", tag: "Ekip", people: ["Kerem Arıkan", "Selin Başaran", "Onur Tekin"], checked: team, onCheckedChange: setTeam },
            { id: "herkes", label: "Bağlantıya Sahip Herkes", tag: "Herkese Açık", icon: <Compass />, checked: anyone, onCheckedChange: setAnyone },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Veri ───────────────────────────────────────────────────────────────── */
export function VeriEk() {
  return (
    <Cell file="record-list" name="Kayıt Listesi" note="Telefonda tablonun yerine: başlık, tutar, durum ve kişiler kart satırında." span={6} align="stretch">
      <RecordList
        label="Kafe Siparişleri"
        className="mx-auto w-full max-w-xl"
        items={CAFES.slice(0, 3).map((c, i) => ({
          id: c.value,
          title: c.label,
          subtitle: BRAND.city,
          leading: (
            <span className="grid size-10 place-items-center rounded-lg bg-primary-wash text-primary-ink [&_svg]:size-5">
              <Coffee aria-hidden />
            </span>
          ),
          value: `₺${num.format(CAFE_ORDERS[i].revenue)}`,
          meta: `${num.format(CAFE_ORDERS[i].orders)} sipariş`,
          status: <Badge tone={CAFE_ORDERS[i].tone}>{CAFE_ORDERS[i].status}</Badge>,
        }))}
      />
    </Cell>
  );
}

/* ── Tanıtım ────────────────────────────────────────────────────────────── */
const SCENE = ["bg-primary-wash", "bg-surface-raised", "bg-primary-soft/40", "bg-surface-sunken", "bg-primary/25"] as const;

export function TanitimEk() {
  const icons = [Sunrise, Mountain, Waves, Coffee, ShoppingBag];
  return (
    <>
      <Cell file="connection-hero" name="Bağlantı Başlığı" note="İki uygulama arasında bağlantının durumu: noktalar akar, dolar ya da kırmızıya döner." span={3} className="p-0" align="stretch">
        <ConnectionHero from={{ label: BRAND.name, icon: <Coffee /> }} to={{ label: "Kargo", icon: <Truck /> }} status="connecting" className="h-full rounded-2xl" />
      </Cell>
      <Cell file="mesh-gradient" name="Hareketli Renk Zemini" note="Kapanış bandının zemini; lekeler yavaş kayar, üstünde metin okunur." span={3} className="p-0" align="stretch">
        <MeshGradient texture="grain" scrim className="grid h-full place-items-center rounded-2xl px-6 py-14 text-center">
          <p className="font-display text-heading font-bold text-strong text-balance">Kasım Harmanı Yolda</p>
        </MeshGradient>
      </Cell>
      <Cell file="arc-carousel" name="Kavisli Galeri" note="Kartlar bir yay üstünde döner; ortadaki öne çıkar, bağlantısı açılır." span={3} className="overflow-hidden px-0" align="stretch">
        <ArcCarousel
          label="Harmanlar"
          visible={2}
          items={["Sabah", "Dağ", "Kıyı", "Ev", "Dükkan"].map((title, i) => {
            const Icon = icons[i];
            return {
              id: title,
              title: `${title} Harmanı`,
              meta: "250 g",
              media: (
                <span className={`grid size-full place-items-center ${SCENE[i]} text-primary-ink [&_svg]:size-10`}>
                  <Icon aria-hidden strokeWidth={1.5} />
                </span>
              ),
            };
          })}
        />
      </Cell>
      <Cell file="morph-nav" name="Biçim Değiştiren Menü" note="Üst menünün açılan paneli sekmeden sekmeye biçim değiştirerek kayar." span={3} align="start">
        <MorphNav
          brand={<span className="font-display font-bold text-strong">{BRAND.name}</span>}
          items={[
            {
              label: "Ürünler",
              content: <MorphNavGrid links={[{ href: "#b-morph-nav", title: "Çekirdekler", description: "Tek köken ve harmanlar", icon: Coffee }, { href: "#b-morph-nav", title: "Abonelik", description: "Ayda iki paket", icon: LayoutGrid }]} />,
            },
            { label: "Kafeler", href: "#b-morph-nav" },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Hareket ────────────────────────────────────────────────────────────── */
const NOTES = ["Etiyopya çuvalı 5 kg altına indi", "Kolombiya lotu kavruldu", "Kargo 14.00'te alacak"];

export function HareketEk() {
  const [items, setItems] = useState(NOTES);
  const list = useRef<HTMLUListElement>(null);
  return (
    <Cell file="dissolve" name="Dağılarak Çıkış" note="Onaylanmış kaldırmada satır tanecik tanecik dağılır; hareket azaltmada solar." span={6} size="sm">
      <div className="mx-auto grid w-full max-w-md gap-2">
        <ul ref={list} className="grid gap-2">
          {items.map((text) => (
            <li key={text} data-note={text} className="flex items-center justify-between gap-3 rounded-lg bg-overlay px-3 py-2 shadow-raised">
              <span className="min-w-0 truncate text-base text-strong">{text}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const row = list.current?.querySelector<HTMLElement>(`[data-note="${text}"]`);
                  if (row) await dissolveOut(row);
                  setItems((all) => all.filter((t) => t !== text));
                }}
              >
                Kaldır
              </Button>
            </li>
          ))}
        </ul>
        {items.length === 0 ? (
          <Button variant="secondary" className="justify-self-center" onClick={() => setItems(NOTES)}>
            Notları Geri Getir
          </Button>
        ) : null}
      </div>
    </Cell>
  );
}
