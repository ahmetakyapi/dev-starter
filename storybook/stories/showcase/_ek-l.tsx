"use client";

import { useMemo, useState } from "react";
import { ActiveFilters, type ActiveFilter } from "@/components/ui/active-filters";
import { AuditLog, type AuditEntry } from "@/components/ui/audit-log";
import { ChartCard } from "@/components/ui/chart-card";
import { RegionMap, type MapRegion } from "@/components/ui/region-map";
import { SavedViews, type SavedView } from "@/components/ui/saved-views";
import { MAP_SHAPES, MAP_VIEWBOX } from "../kuzeyova/_harita";
import { ME, TEAM, customer, tl, type PeriodStats } from "./_data";
import { CARD, Well, WellTitle, useApp } from "./_ui";
import { cn } from "@/lib/utils";

/**
 * Üçüncü ek (Kuzeyova portalı turu parçaları Pusula'da): bölge haritası (Pano), kayıtlı
 * görünüm + etkin süzgeç çipleri (Görevler), denetim kaydı (Ayarlar).
 * Harita ŞEMATİKTİR: satış bölgeleri gerçek coğrafya değil, beş stilize alan.
 */

/* ── Pano: satış bölgesine göre ciro ───────────────────────────────────── */

const SALES_REGIONS = [
  { id: "marmara", label: "Marmara", cities: ["İstanbul"], shape: "yayla" },
  { id: "ege", label: "Ege", cities: ["İzmir", "Denizli", "Muğla", "Bodrum"], shape: "vadi" },
  { id: "akdeniz", label: "Akdeniz", cities: ["Antalya"], shape: "kiyi" },
  { id: "ic", label: "İç Anadolu", cities: ["Ankara", "Eskişehir"], shape: "merkez" },
  { id: "karadeniz", label: "Karadeniz", cities: ["Trabzon"], shape: "ova" },
] as const;

export function RegionCard({ s, className }: { s: PeriodStats; className?: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const data = useMemo(
    () =>
      SALES_REGIONS.map((r) => {
        const orders = s.orders.filter((o) => (r.cities as readonly string[]).includes(customer(o.customerId).city));
        return { r, orders: orders.length, revenue: orders.reduce((sum, o) => sum + o.total, 0) };
      }),
    [s.orders],
  );
  const total = data.reduce((sum, d) => sum + d.revenue, 0) || 1;
  const regions: MapRegion[] = data.map(({ r, orders, revenue }) => {
    const shape = MAP_SHAPES.find((m) => m.id === r.shape)!;
    return { id: r.id, label: r.label, path: shape.path, at: shape.at, value: revenue, note: `${orders} sipariş · %${Math.round((revenue / total) * 100)}` };
  });
  const top = data.reduce((best, d) => (d.revenue > best.revenue ? d : best), data[0]);
  const picked = data.find((d) => d.r.id === sel);
  return (
    <ChartCard className={cn(CARD, className)} id="pano-bolge" label="Satış Bölgesine Göre Ciro" value={`${top.r.label} önde`}>
      <RegionMap title="Satış bölgesine göre ciro" regions={regions} viewBox={MAP_VIEWBOX} format={(v) => tl.format(v)} legend={["Az ciro", "Çok ciro"]} selectedId={sel} onSelect={setSel} />
      <p className="mt-2 text-small text-muted" role="status">
        {picked ? `${picked.r.label}: ${tl.format(picked.revenue)}, ${picked.orders} sipariş (şehirler: ${picked.r.cities.join(", ")}).` : "Bir bölge seç: ciro ve şehirleri burada yazılır. Harita şematiktir, gerçek coğrafya değil."}
      </p>
    </ChartCard>
  );
}

/* ── Görevler: kayıtlı görünümler ve etkin süzgeçler ──────────────────── */

type ViewDef = SavedView & { filters: readonly ActiveFilter[] };

export function TaskViewsWell() {
  const { board } = useApp();
  const open = useMemo(() => board.filter((c) => !c.done).flatMap((c) => c.cards.map((card) => ({ ...card, column: c.title }))), [board]);
  const mine = ME.name;
  const base: ViewDef[] = [
    { id: "hepsi", label: "Hepsi", builtin: true, filters: [] },
    { id: "benim", label: "Bana Atananlar", builtin: true, filters: [{ id: "assignee", label: "Sorumlu", value: mine }] },
    { id: "satis", label: "Satış İşleri", builtin: true, filters: [{ id: "area", label: "Alan", value: "Satış" }] },
  ];
  const [custom, setCustom] = useState<ViewDef[]>([]);
  const [viewId, setViewId] = useState("hepsi");
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const views = [...base, ...custom];
  const view = views.find((v) => v.id === viewId) ?? views[0];
  const filters = view.filters.filter((f) => !removed.has(f.id));

  const match = (card: (typeof open)[number], list: readonly ActiveFilter[]) =>
    list.every((f) => (f.id === "assignee" ? card.assignee?.name === f.value : card.tags?.some((t) => t.label === f.value)));
  const shown = open.filter((c) => match(c, filters));
  const countOf = (v: ViewDef) => open.filter((c) => match(c, v.filters)).length;

  return (
    <Well labelledBy="gorev-gorunum" className="lg:col-span-2">
      <WellTitle id="gorev-gorunum" hint="Sık baktığın süzgeçleri görünüm olarak kaydet; etkin süzgeç çipleri neyi görüntülediğini söyler.">
        Görevlere Bakış
      </WellTitle>
      <SavedViews
        views={views.map((v) => ({ id: v.id, label: v.label, builtin: v.builtin, count: countOf(v) }))}
        value={viewId}
        onValueChange={(id) => {
          setViewId(id);
          setRemoved(new Set());
        }}
        onSave={(name) => {
          const id = `v-${custom.length + 1}`;
          setCustom((list) => [...list, { id, label: name, filters }]);
          setViewId(id);
          setRemoved(new Set());
        }}
        onDelete={(id) => {
          setCustom((list) => list.filter((v) => v.id !== id));
          setViewId("hepsi");
        }}
      />
      <ActiveFilters className="mt-3" filters={filters} onRemove={(id) => setRemoved((r) => new Set(r).add(id))} onClear={() => setRemoved(new Set(view.filters.map((f) => f.id)))} summary={`${shown.length} görev`} />
      <ul role="list" className="mt-3 divide-y divide-line-soft">
        {shown.slice(0, 6).map((c) => (
          <li key={c.id} className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 py-2 text-base">
            <span className="min-w-0 truncate font-medium text-strong">{c.title}</span>
            <span className="text-small text-muted">{c.column}{c.assignee ? ` · ${c.assignee.name}` : ""}</span>
          </li>
        ))}
        {shown.length === 0 ? <li className="py-4 text-center text-base text-muted">Bu görünümde görev yok.</li> : null}
      </ul>
    </Well>
  );
}

/* ── Ayarlar: hesap etkinliği ─────────────────────────────────────────── */

const ACTIVITY: readonly AuditEntry[] = [
  { id: "a1", at: "2026-11-02T10:12:00+03:00", when: "2 Kas, 10:12", actor: TEAM[0].name, actorDetail: "Yönetici", action: "SLA hedefini güncelledi", target: "ilk-yanıt", before: "%75 · 30 dk", after: "%80 · 30 dk" },
  { id: "a2", at: "2026-11-02T09:47:00+03:00", when: "2 Kas, 09:47", actor: TEAM[1].name, action: "talebi çözüldü işaretledi", target: "T-1042", before: "Açık", after: "Çözüldü" },
  { id: "a3", at: "2026-11-02T09:20:00+03:00", when: "2 Kas, 09:20", actor: TEAM[2].name, actorDetail: "Destek", action: "API anahtarı oluşturmayı denedi", target: "api-anahtari", after: "Yalnızca yönetici anahtar oluşturabilir", denied: true },
  { id: "a4", at: "2026-11-01T17:05:00+03:00", when: "1 Kas, 17:05", actor: TEAM[0].name, actorDetail: "Yönetici", action: "Kargo Takip entegrasyonunu bağladı", target: "entegrasyon" },
];

export function ActivityWell() {
  return (
    <Well labelledBy="ayar-etkinlik" className="lg:col-span-2">
      <WellTitle id="ayar-etkinlik" hint="Hesapta yapılan değişiklikler değişmez bir günlüğe yazılır; yetkisiz deneme de görünür.">
        Hesap Etkinliği
      </WellTitle>
      <AuditLog label="Hesap etkinliği" entries={ACTIVITY} />
    </Well>
  );
}
