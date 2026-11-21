"use client";

import "./edas.css";
import { Gauge, Receipt, Users } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ActiveFilter } from "@/components/ui/active-filters";
import type { SavedView } from "@/components/ui/saved-views";
import type { FilterValue } from "@/components/ui/filter-sheet";
import { setViewAs, useSession, ROLES } from "./_permissions";
import {
  BarTarget,
  DemoBadge,
  EmptyStateX,
  ErrorState,
  FilterBar,
  Forbidden,
  Metric,
  PageHero,
  RowAnchor,
  RowLink,
  StepCountChart,
  TodayBand,
  UnitLegend,
  fmtDec,
  fmtDur,
  fmtKwh,
  fmtNum,
  fmtPct,
  fmtTl,
  fmtTlCompact,
  useListKeys,
} from "./_kit";
import { MetricStrip, Panel } from "./_ui";

/**
 * Edaş Kit galerisi: sayfa fork'larının kullandığı ortak parçaların tek yerde
 * örneği (açık/koyu). Kabuk dışında çizilir: `AppContext` yoksa bağlantılar
 * sessiz kalır, adres değişmez.
 */

const SPARK = [4, 5, 5, 7, 6, 8, 9, 8, 11, 10, 12, 13] as const;
const DAILY = Array.from({ length: 14 }, (_, i) => ({ label: `${i + 8} Kas`, value: [0, 1, 1, 2, 2, 1, 0, 0, 1, 3, 2, 2, 4, 2][i] }));

const VIEWS: SavedView[] = [
  { id: "hepsi", label: "Hepsi", builtin: true, count: 360 },
  { id: "bugun", label: "Bugün Aranacaklar", count: 14 },
];
const GROUPS = [
  { id: "durum", label: "Durum", options: [{ value: "gecikti", label: "Geciken", count: 37 }, { value: "kismi", label: "Kısmi Ödenen", count: 6 }] },
  { id: "bolge", label: "Bölge", multiple: true, options: [{ value: "kiyi", label: "Kıyı" }, { value: "ova", label: "Ova" }, { value: "yayla", label: "Yayla" }] },
];
const LABELS: Record<string, Record<string, string>> = { durum: { gecikti: "Geciken", kismi: "Kısmi Ödenen" }, bolge: { kiyi: "Kıyı", ova: "Ova", yayla: "Yayla" } };

function FilterDemo() {
  const [q, setQ] = useState("");
  const [value, setValue] = useState<FilterValue>({ durum: ["gecikti"], bolge: ["kiyi"] });
  const [view, setView] = useState("hepsi");
  const [views, setViews] = useState(VIEWS);
  const filters: ActiveFilter[] = GROUPS.flatMap((g) => (value[g.id] ?? []).map((v) => ({ id: `${g.id}:${v}`, label: g.label, value: LABELS[g.id][v] })));
  const remove = (id: string) => {
    const [g, v] = id.split(":");
    setValue((cur) => ({ ...cur, [g]: (cur[g] ?? []).filter((x) => x !== v) }));
  };
  return (
    <FilterBar
      search={{ value: q, onChange: setQ, placeholder: "Abone, tesisat ya da fatura no ara", label: "Fatura ara" }}
      filters={filters}
      onRemoveFilter={remove}
      onClearFilters={() => setValue({})}
      views={{ items: views, value: view, onChange: setView, onSave: (name) => setViews((l) => [...l, { id: `v${l.length}`, label: name }]), onDelete: (id) => setViews((l) => l.filter((v) => v.id !== id)) }}
      drawer={{ groups: GROUPS, value, onChange: setValue, resultCount: 37 }}
      summary="37 fatura"
    />
  );
}

function RoleSwitch() {
  const session = useSession();
  const current = session.viewAs ?? "yonetici";
  return (
    <div role="radiogroup" aria-label="Rolü seç" className="flex flex-wrap gap-2">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          role="radio"
          aria-checked={current === r.id}
          onClick={() => setViewAs(r.id)}
          className={`min-h-9 cursor-pointer rounded-full border px-3 text-base font-medium ${current === r.id ? "border-transparent bg-primary-wash text-primary-ink" : "border-line bg-overlay text-body shadow-raised"}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function KitGallery() {
  const list = useRef<HTMLUListElement>(null);
  useListKeys(list);
  const rows = useMemo(() => ["C-10001 · Aksungur Market", "C-10008 · Karlıdere Çiftliği", "C-10015 · Sulakova Tarım"], []);
  return (
    <div data-product="edas" className="mx-auto grid max-w-5xl gap-6 bg-page p-4 text-body sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading font-semibold text-strong">Edaş Kit</h1>
        <DemoBadge />
      </header>

      <Panel title="Sayı Biçimi" note="Ondalık virgül, binlik nokta, birim her zaman yazılır.">
        <ul role="list" className="grid gap-x-8 gap-y-1 p-4 text-base sm:grid-cols-2 sm:p-5">
          {[
            ["fmtNum(12345)", fmtNum(12345)],
            ["fmtDec(25.4)", fmtDec(25.4)],
            ["fmtPct(94.4)", fmtPct(94.4)],
            ["fmtKwh(1273)", fmtKwh(1273)],
            ["fmtKwh(12_400_000)", fmtKwh(12_400_000)],
            ["fmtTl(620237)", fmtTl(620237)],
            ["fmtTlCompact(1_129_284_428)", fmtTlCompact(1_129_284_428)],
            ["fmtDur(85)", fmtDur(85)],
          ].map(([call, out]) => (
            <li key={call} className="flex justify-between gap-4 border-b border-line-soft py-1.5">
              <code className="text-small text-muted">{call}</code>
              <span className="font-medium text-strong tabular-nums">{out}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <section aria-labelledby="kit-hero" className="grid gap-3">
        <h2 id="kit-hero" className="text-read font-semibold text-strong">PageHero ve Metric</h2>
        <PageHero
          primary={{ label: "Tahsilat Oranı", value: fmtPct(94.4), delta: -2.5, deltaLabel: "önceki 3 aya göre", goodWhen: "up", spark: SPARK, foot: "Vadesi gelen faturalarda", icon: <Receipt /> }}
          secondary={[
            { label: "Aktif Abone", value: "328", delta: 0.6, goodWhen: "up", foot: "Konut 180 · Ticarethane 75" },
            { label: "Tüketim", value: "2,6", unit: "GWh", delta: -9.6, goodWhen: "neutral", foot: "Okunan sayaçlar" },
            { label: "Kayıp / Kaçak", value: fmtPct(7.7), delta: -0.3, goodWhen: "down", foot: "Giriş enerjisine oranla" },
            { label: "Açık Arıza", value: "2", foot: "10 abone etkileniyor" },
            { label: "Okunamayan", value: "26", delta: 4, goodWhen: "down", foot: "20 iletişim yok" },
          ]}
        />
        <MetricStrip>
          <Metric label="Faturalar" value="234" foot="Geciken, tüm dönemler" icon={<Receipt />} to={{ page: "invoices", params: { status: "gecikti" } }} />
          <Metric label="Sayaçlar" value="360" foot="313 uzaktan okunuyor" icon={<Gauge />} to={{ page: "meters" }} />
          <Metric label="Müşteriler" value="360" foot="57 serbest tüketici" icon={<Users />} to={{ page: "customers" }} />
        </MetricStrip>
      </section>

      <section aria-labelledby="kit-bugun" className="grid gap-3">
        <h2 id="kit-bugun" className="text-read font-semibold text-strong">TodayBand: rol değişince içerik değişir</h2>
        <RoleSwitch />
        <TodayBand />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="BarTarget" note="Etiket solda, değer sağda, hedef çizgisi; aşım metinle de söylenir.">
          <div className="p-4 sm:p-5">
            <BarTarget
              aria-label="Bölgeye göre kayıp/kaçak"
              format={(v) => fmtPct(v)}
              rows={[
                { id: "yayla", label: "Yayla", value: 13.6, target: 12 },
                { id: "kiyi", label: "Kıyı", value: 8.9, target: 8 },
                { id: "merkez", label: "Merkez", value: 6.4, target: 7 },
                { id: "sanayi", label: "Sanayi Havzası", value: 5.9, target: 5 },
              ]}
            />
          </div>
        </Panel>
        <Panel title="StepCountChart" note="Ayrık sayım (günlük açık arıza) basamaklı; yumuşatılmış eğri sahte tepecik çizer.">
          <div className="p-4 sm:p-5">
            <StepCountChart data={DAILY} title="Günlük açık arıza sayısı" unit=" arıza" />
            <UnitLegend className="mt-2" items={[{ label: "Açık arıza", series: 1, value: "2 bugün" }]} />
          </div>
        </Panel>
      </div>

      <Panel title="RowLink ve j/k" note="Satırın tamamı tek bağlantı; j / k ile gez, Enter aç.">
        <ul ref={list} role="list" className="divide-y divide-line-soft">
          {rows.map((r) => (
            <li key={r}>
              <RowLink className="px-4 py-3 sm:px-5">
                <RowAnchor to={{ page: "customers", params: { id: r.split(" ")[0] } }}>{r}</RowAnchor>
              </RowLink>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="FilterBar" note="Arama + Süzgeçler çekmecesi tek satır; altında kayıtlı görünümler ve etkin süzgeç çipleri.">
        <div className="p-4 sm:p-5">
          <FilterDemo />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="EmptyStateX">
          <EmptyStateX title="Bu süzgeçle fatura yok" hint="Süzgeçleri gevşetmeyi dene." />
        </Panel>
        <Panel title="ErrorState">
          <ErrorState onRetry={() => {}} />
        </Panel>
        <Panel title="Forbidden">
          <Forbidden what="Ham Veri" permission="Ham Veri Görüntüleme" className="py-8" />
        </Panel>
      </div>
    </div>
  );
}
