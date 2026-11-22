"use client";

import { Building2, FileSpreadsheet, HardHat, Plus, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ContactList } from "@/components/ui/contact-list";
import { DetailSection } from "@/components/ui/detail-panel";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Dialog } from "@/components/ui/dialog";
import { InsightCallout } from "@/components/ui/insight-callout";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SetupCard } from "@/components/ui/setup-card";
import { Toaster, toast } from "@/components/ui/toast";
import { TrackBarChart } from "@/components/ui/track-bar-chart";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";
import { BrandMark, CARD, MetricStrip, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Bina yönetimi örneği (Fixora referansı: yapı ve davranış; ad, metin, rakam
 * ve ikonlar kurgusal, ÖRNEK VERİ). İki görünüm kenar çubuğundan seçilir
 * (Mülkler, Satıcılar): sol tabloda satıra basınca sağda ayrıntı paneli açılır;
 * "Mülk Ekle" penceresi seçilen bina sistemlerine göre başlangıç planını
 * canlı yazar ve eklenen mülk listeye düşer. Sol altta kurulum kartı.
 */

type View = "mulkler" | "saticilar";
type Health = "risk" | "izleme" | "saglikli" | "yeni";

type Property = {
  id: string;
  name: string;
  address: string;
  district: string;
  units: number;
  health: number | null;
  orders: number;
  cost: number;
  built: number;
  type: string;
};

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
const healthOf = (p: Property): Health => (p.health === null ? "yeni" : p.health < 65 ? "risk" : p.health < 80 ? "izleme" : "saglikli");

const BASE: readonly Property[] = [
  { id: "p1", name: "Çınarlı Sitesi", address: "Ardıç Sokak 14", district: "Merkez", units: 64, health: 58, orders: 14, cost: 98400, built: 1998, type: "Çok Aileli Konut" },
  { id: "p2", name: "Kıyıcı Apartmanı", address: "Tuz Sokak 8", district: "Kıyı", units: 72, health: 63, orders: 12, cost: 79300, built: 2001, type: "Çok Aileli Konut" },
  { id: "p3", name: "Dereağzı Evleri", address: "Kavak Sokak 9", district: "Vadi", units: 18, health: 61, orders: 6, cost: 34700, built: 1994, type: "Çok Aileli Konut" },
  { id: "p4", name: "Limanlı Loftlar", address: "Rıhtım Caddesi 2", district: "Kıyı", units: 48, health: 66, orders: 11, cost: 81200, built: 2008, type: "Karma Kullanım" },
  { id: "p5", name: "Meşelik Konutları", address: "Meşe Sokak 31", district: "Merkez", units: 36, health: 71, orders: 9, cost: 54600, built: 2004, type: "Çok Aileli Konut" },
  { id: "p6", name: "Rıhtım Hanı", address: "Hanlar Caddesi 3", district: "Kıyı", units: 52, health: 76, orders: 7, cost: 40600, built: 1989, type: "Karma Kullanım" },
  { id: "p7", name: "Dokuma Sıraevleri", address: "Dokuma Sokak 17", district: "Merkez", units: 30, health: 84, orders: 5, cost: 27800, built: 2012, type: "Çok Aileli Konut" },
  { id: "p8", name: "Kuyucak Daireleri", address: "Kuyu Sokak 120", district: "Vadi", units: 40, health: 88, orders: 4, cost: 23100, built: 2015, type: "Çok Aileli Konut" },
  { id: "p9", name: "Papatya Evleri", address: "Papatya Sokak 44", district: "Merkez", units: 28, health: 90, orders: 3, cost: 16200, built: 2018, type: "Çok Aileli Konut" },
  { id: "p10", name: "Güneşli Teras", address: "Güneş Sokak 5", district: "Vadi", units: 24, health: 92, orders: 2, cost: 11400, built: 2021, type: "Çok Aileli Konut" },
];

const STATUS: Record<Health, { label: string; tone: "danger" | "warning" | "success" | "neutral" }> = {
  risk: { label: "Riskli", tone: "danger" },
  izleme: { label: "İzlemede", tone: "warning" },
  saglikli: { label: "Sağlıklı", tone: "success" },
  yeni: { label: "Yeni", tone: "neutral" },
};

const SYSTEMS: readonly { label: string; offset: number }[] = [
  { label: "Isıtma ve Sıcak Su", offset: -24 },
  { label: "Tesisat", offset: -3 },
  { label: "Elektrik", offset: 12 },
  { label: "Bina Kabuğu", offset: -6 },
  { label: "Yangın Güvenliği", offset: 21 },
];

const ORDER_POOL = ["Kazan Basıncı Düşüyor", "3C Dairesinde Radyatör Soğuk", "2. Kattaki Yangın Kapısı Kapanmıyor", "Asansör Kapı Sensörü Arızalı", "Otopark Aydınlatması Yanmıyor", "Çatı Giderinde Tıkanıklık"];
const ORDER_STATE = ["Sürüyor", "Yeni", "Planlandı"] as const;
const ASSET_POOL = [
  { name: "Gazlı Kazan, Kazan Dairesi", age: 14 },
  { name: "Yolcu Asansörü", age: 9 },
  { name: "Çatı Membranı", age: 21 },
];
const INSIGHTS = [
  { title: "Kazan Dairesi Kazanının 21 Gün İçinde Arızalanması Olası", body: "30 Ekim'den önce servis yapmak, yaklaşık ₺6.400 tutarındaki acil onarımı önler." },
  { title: "Asansör Kumandasında Aşınma Belirtisi", body: "Son 30 günde üç kez durma kaydı var. Planlı bakım, arıza kaynaklı kat kapanışını önler." },
  { title: "Çatı Membranında Sızıntı Riski Artıyor", body: "Kış öncesi denetim yaklaşık ₺3.900 tutarındaki iç mekân onarımını önler." },
];

const MANAGERS = ["Defne Arkadaş", "Kerem Yalçın", "Selin Ortaç", "Emre Kutlu"];
const TYPES = ["Çok Aileli Konut", "Karma Kullanım", "Ofis Binası", "Ticari Merkez"];
const DISTRICTS = ["Merkez", "Kıyı", "Vadi"];

const SYSTEM_PLAN: Record<string, string> = {
  gaz: "kazan servisi",
  asansor: "asansör denetimi",
  kazan: "sıcak su kazanı temizliği",
  yagmurlama: "yağmurlama testi",
  hvac: "çatı klima bakımı",
  gunes: "güneş paneli kontrolü",
  sarj: "şarj istasyonu denetimi",
};
const SYSTEM_CHOICES = [
  { value: "gaz", label: "Gazlı Isıtma" },
  { value: "asansor", label: "Yolcu Asansörü" },
  { value: "kazan", label: "Sıcak Su Kazanı" },
  { value: "yagmurlama", label: "Yağmurlama" },
  { value: "hvac", label: "Çatı HVAC" },
  { value: "gunes", label: "Güneş Paneli" },
  { value: "sarj", label: "EV Şarj" },
];

type Vendor = {
  id: string;
  name: string;
  trade: string;
  jobs: number;
  resp: number;
  onTime: number;
  rating: number;
  spend: number;
  insurance: { tone: "success" | "warning" | "danger"; label: string };
  preferred: boolean;
};

const VENDORS: readonly Vendor[] = [
  { id: "v1", name: "Soğukpınar Isıtma", trade: "Isıtma ve Soğutma", jobs: 31, resp: 4.6, onTime: 88, rating: 4.3, spend: 14920, insurance: { tone: "success", label: "Geçerli" }, preferred: true },
  { id: "v2", name: "Akar Tesisat", trade: "Tesisat", jobs: 42, resp: 2.1, onTime: 96, rating: 4.8, spend: 12460, insurance: { tone: "success", label: "Geçerli" }, preferred: true },
  { id: "v3", name: "Yükseliş Asansör", trade: "Asansör", jobs: 9, resp: 5.2, onTime: 81, rating: 4.0, spend: 8640, insurance: { tone: "success", label: "Geçerli" }, preferred: false },
  { id: "v4", name: "Işık Elektrik", trade: "Elektrik", jobs: 27, resp: 2.8, onTime: 94, rating: 4.7, spend: 7380, insurance: { tone: "warning", label: "2 Kasım'da Doluyor" }, preferred: true },
  { id: "v5", name: "Kubbe Çatı", trade: "Çatı", jobs: 6, resp: 6.0, onTime: 92, rating: 4.6, spend: 5210, insurance: { tone: "success", label: "Geçerli" }, preferred: false },
  { id: "v6", name: "Pınar Beyaz Eşya", trade: "Beyaz Eşya", jobs: 19, resp: 3.1, onTime: 90, rating: 4.5, spend: 3970, insurance: { tone: "success", label: "Geçerli" }, preferred: false },
  { id: "v7", name: "Cam Dünyası", trade: "Cam ve Doğrama", jobs: 8, resp: 7.4, onTime: 85, rating: 4.2, spend: 2880, insurance: { tone: "warning", label: "9 Kasım'da Doluyor" }, preferred: false },
  { id: "v8", name: "Temizsan", trade: "Temizlik", jobs: 22, resp: 4.2, onTime: 91, rating: 4.4, spend: 2250, insurance: { tone: "danger", label: "Süresi Doldu" }, preferred: false },
  { id: "v9", name: "Kilitçi Sinan", trade: "Çilingir", jobs: 14, resp: 1.6, onTime: 98, rating: 4.9, spend: 1940, insurance: { tone: "success", label: "Geçerli" }, preferred: true },
];

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Operasyon",
    items: [
      { href: "#mulkler", label: "Mülkler", icon: <Building2 aria-hidden /> },
      { href: "#saticilar", label: "Satıcılar", icon: <Users aria-hidden /> },
    ],
  },
];

const bar = (v: number) => (v < 60 ? "bg-danger" : v < 75 ? "bg-warning" : "bg-success");

function Cell({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <p className="truncate text-small font-medium text-muted">{label}</p>
      <p className="mt-1 text-title font-semibold tracking-tight text-strong tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
    </div>
  );
}

function HealthBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">Veri bekleniyor</span>;
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-7 font-medium text-strong tabular-nums">{value}</span>
      <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-chart-track">
        <span className={cn("block h-full rounded-full", value < 65 ? "bg-danger" : value < 80 ? "bg-warning" : "bg-success")} style={{ width: `${value}%` }} />
      </span>
    </span>
  );
}

/* ── Kenar çubuğunda kurulum kartı ────────────────────────────────────────
 * AppShell'in kenar çubuğu dibinde alan yok; kart, kullanıcı satırının hemen
 * önüne bir yuva açılarak oraya yerleştirilir (daraltılınca gizli). */
function SidebarSlot({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const aside = document.querySelector<HTMLElement>("aside[aria-label='Kenar Çubuğu']");
    if (!aside) return;
    const el = document.createElement("div");
    el.setAttribute("data-setup-slot", "");
    aside.insertBefore(el, aside.lastElementChild);
    setSlot(el);
    return () => {
      setSlot(null);
      el.remove();
    };
  }, []);
  return (
    <>
      <style href="ui-mulk-slot" precedence="default">{`aside[aria-label="Kenar Çubuğu"][class*="4.25rem"] [data-setup-slot]{display:none}`}</style>
      {slot ? createPortal(children, slot) : null}
    </>
  );
}

/* ── Mülk ekle penceresi ──────────────────────────────────────────────── */

type Draft = { name: string; type: string; address: string; units: string; floors: string; built: string; manager: string; systems: string[] };
const EMPTY: Draft = { name: "", type: TYPES[0], address: "", units: "36", floors: "5", built: "2004", manager: MANAGERS[0], systems: ["gaz", "asansor"] };

function planText(systems: readonly string[]) {
  if (systems.length === 0) return "Bina sistemi seçince ilk 60 günün bakım planı burada belirir.";
  const tasks = systems.map((s) => SYSTEM_PLAN[s]);
  const last = tasks.at(-1);
  const head = tasks.slice(0, -1);
  const list = head.length ? `${head.join(", ")} ve ${last}` : `${last}`;
  return `Başlangıçta ${list} ilk 60 gün içinde planlanır; bina sensörleri bağlanınca plan sağlık skoruna göre güncellenir.`;
}

function AddProperty({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (p: Property) => void }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const [csv, setCsv] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setDraft(EMPTY);
      setErrors({});
      setCsv(false);
    }
  }

  function submit() {
    const found: { name?: string; address?: string } = {};
    if (draft.name.trim().length < 2) found.name = "Mülk adını yaz.";
    if (draft.address.trim().length < 4) found.address = "Adresi yaz.";
    setErrors(found);
    if (found.name || found.address) return;
    onAdd({
      id: `p${Date.now()}`,
      name: draft.name.trim(),
      address: draft.address.trim(),
      district: DISTRICTS[0],
      units: Math.max(1, Number(draft.units) || 1),
      health: null,
      orders: 0,
      cost: 0,
      built: Number(draft.built) || 2000,
      type: draft.type,
    });
    close(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Mülk Ekle"
      description="Sağlık takibi ve her yeni bina için bir başlangıç bakım planı kurulur."
      size="lg"
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={() => setCsv(true)}>
            <FileSpreadsheet aria-hidden /> CSV'den İçe Aktar
          </Button>
          <Button variant="ghost" onClick={() => close(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={submit}>
            <Plus aria-hidden /> Mülk Ekle
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Mülk Adı" value={draft.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="Örnek: Gül Sitesi" />
          <Select label="Mülk Türü" value={draft.type} onValueChange={(v) => v && set("type", v)} items={TYPES.map((t) => ({ value: t, label: t }))} />
        </div>
        <Input label="Adres" value={draft.address} onChange={(e) => set("address", e.target.value)} error={errors.address} placeholder="Sokak, numara, mahalle" />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Birim Sayısı" value={Number(draft.units) || 1} min={1} max={500} onValueChange={(v) => set("units", String(v ?? 1))} />
          <NumberField label="Kat Sayısı" value={Number(draft.floors) || 1} min={1} max={60} onValueChange={(v) => set("floors", String(v ?? 1))} />
          <Input label="Yapım Yılı" inputMode="numeric" value={draft.built} onChange={(e) => set("built", e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </div>
        <Select label="Mülk Yöneticisi" value={draft.manager} onValueChange={(v) => v && set("manager", v)} items={MANAGERS.map((m) => ({ value: m, label: m }))} />
        <ChoiceChips legend="Bina Sistemleri" options={SYSTEM_CHOICES} value={draft.systems} onValueChange={(next) => set("systems", next)} />
        <InsightCallout title="Başlangıç Planı" label="Öneri" headingLevel={3}>
          {planText(draft.systems)}
        </InsightCallout>
        {csv ? (
          <p role="status" className="text-small text-soft">
            CSV içe aktarma bu örnekte kapalı. Beklenen sütunlar: Mülk Adı, Adres, Birim, Yapım Yılı.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

/* ── Mülkler ──────────────────────────────────────────────────────────── */

function PropertyDetail({ p }: { p: Property }) {
  const idx = Math.max(0, BASE.findIndex((b) => b.id === p.id));
  const status = healthOf(p);
  const insight = INSIGHTS[idx % INSIGHTS.length];
  const delta = p.health === null ? null : p.health < 65 ? -9 : p.health < 80 ? -3 : 2;
  return (
    <Panel
      id="mulk-ayrinti"
      title={p.name}
      note={`${p.address}, ${p.district}`}
      actions={<Badge tone={STATUS[status].tone} dot>{STATUS[status].label}</Badge>}
      className="xl:sticky xl:top-4 xl:self-start"
      bodyClassName="grid gap-5"
    >
      <p className="text-small text-muted">
        {p.units} birim · Yapım yılı {p.built} · {p.type}
      </p>
      {p.health === null ? (
        <InsightCallout title="Sensör Verisi Bekleniyor" label="Kurulum" headingLevel={3}>
          Bina sensörleri bağlanınca sağlık skoru ve sistem puanları burada oluşur. O zamana dek başlangıç planı geçerlidir.
        </InsightCallout>
      ) : (
        <>
          <div>
            <p className="text-small font-medium text-muted">Sağlık Skoru</p>
            <p className="mt-0.5 flex items-baseline gap-2 text-title font-semibold tracking-tight text-strong tabular-nums">
              {p.health}
              <span className="text-base font-normal text-muted">/ 100</span>
              {delta !== null ? (
                <span className={cn("text-small font-medium", delta < 0 ? "text-danger" : "text-success")}>
                  {delta < 0 ? "−" : "+"}
                  {Math.abs(delta)} puan, Eylül'den beri
                </span>
              ) : null}
            </p>
          </div>
          <ul role="list" aria-label="Sistem Puanları" className="grid gap-2.5">
            {SYSTEMS.map((s) => {
              const v = Math.max(8, Math.min(98, p.health! + s.offset));
              return (
                <li key={s.label} className="grid grid-cols-[minmax(0,1fr)_2rem_5rem] items-center gap-3 text-base">
                  <span className="truncate text-strong">{s.label}</span>
                  <span className="text-end font-medium text-strong tabular-nums">{v}</span>
                  <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-chart-track">
                    <span className={cn("block h-full rounded-full", bar(v))} style={{ width: `${v}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
          {status === "saglikli" ? (
            <InsightCallout kind="success" title="Önümüzdeki 60 Günde Acil Bakım Gerekmiyor" label="Sonuç" headingLevel={3}>
              Tüm sistemler eşiğin üzerinde. Planlı bakımlar takvimde.
            </InsightCallout>
          ) : (
            <InsightCallout
              title={insight.title}
              label="Öneri"
              headingLevel={3}
              actions={
                <Button variant="secondary" size="sm" onClick={() => toast.success("Servis planlandı", { description: `${p.name}: tarih seçimi için yönetici bilgilendirildi.` })}>
                  Servis Planla
                </Button>
              }
            >
              {insight.body}
            </InsightCallout>
          )}
        </>
      )}
      <DetailSection title="Açık İş Emirleri" count={p.orders}>
        {p.orders === 0 ? (
          <p className="mt-2 text-small text-muted">Açık iş emri yok.</p>
        ) : (
          <KeyValueList
            items={ORDER_POOL.slice(0, Math.min(3, p.orders)).map((o, i) => ({
              label: o,
              value: <span className="text-small font-normal text-body">{ORDER_STATE[(i + idx) % 3]}</span>,
            }))}
          />
        )}
      </DetailSection>
      {p.health !== null ? (
        <DetailSection title="Kilit Varlıklar">
          <KeyValueList
            items={ASSET_POOL.map((a, i) => {
              const age = a.age + Math.round((100 - p.health!) / 12) - 3 + (i === 1 ? -3 : 0);
              const worn = age > 12;
              return {
                label: a.name,
                value: (
                  <span className="flex items-center gap-2">
                    <span className="text-small font-normal text-body tabular-nums">{Math.max(1, age)} yıl</span>
                    <Badge tone={age > 18 ? "danger" : worn ? "warning" : "success"}>{age > 18 ? "Yakında Değiştir" : worn ? "İncele" : "İyi"}</Badge>
                  </span>
                ),
              };
            })}
          />
        </DetailSection>
      ) : null}
    </Panel>
  );
}

function Properties({ added, onAdd, openAdd }: { added: readonly Property[]; onAdd: () => void; openAdd: () => void }) {
  const [tab, setTab] = useState<"tumu" | Health>("tumu");
  const [district, setDistrict] = useState("hepsi");
  const [sort, setSort] = useState("health");
  const all = useMemo(() => [...added, ...BASE], [added]);
  const [selected, setSelected] = useState<string>(BASE[0].id);

  const counts = useMemo(() => {
    const c = { tumu: all.length, risk: 0, izleme: 0, saglikli: 0, yeni: 0 };
    for (const p of all) c[healthOf(p)]++;
    return c;
  }, [all]);

  const rows = useMemo(() => {
    const filtered = all.filter((p) => (tab === "tumu" || healthOf(p) === tab) && (district === "hepsi" || p.district === district));
    const key = sort === "health" ? (p: Property) => p.health ?? 101 : sort === "cost" ? (p: Property) => -p.cost : (p: Property) => -p.orders;
    return [...filtered].sort((a, b) => key(a) - key(b));
  }, [all, tab, district, sort]);

  const units = all.reduce((s, p) => s + p.units, 0);
  const occupied = all.reduce((s, p) => s + Math.round(p.units * 0.94), 0);
  const orders = all.reduce((s, p) => s + p.orders, 0);
  const cost = all.reduce((s, p) => s + p.cost, 0);
  const scored = all.filter((p) => p.health !== null);
  const avgHealth = Math.round(scored.reduce((s, p) => s + (p.health ?? 0), 0) / Math.max(1, scored.length));
  const detail = all.find((p) => p.id === selected) ?? all[0];

  return (
    <Page>
      <PageHead
        title="Mülkler"
        description={`${all.length} mülk · ${units.toLocaleString("tr-TR")} birim · ${counts.risk} mülk bu hafta dikkat istiyor`}
        badge={<SampleStamp />}
        actions={
          <Button variant="primary" onClick={() => { onAdd(); openAdd(); }}>
            <Plus aria-hidden /> Mülk Ekle
          </Button>
        }
      />
      <MetricStrip>
        <Cell label="Portföy Sağlığı" value={avgHealth} hint="Puanlı mülklerin ortalaması" />
        <Cell label="Dolu Birim" value={occupied.toLocaleString("tr-TR")} hint={`%${Math.round((occupied / units) * 100)} doluluk`} />
        <Cell label="Açık İş Emri" value={orders} hint={`${counts.risk} riskli mülkte yoğunlaşıyor`} />
        <Cell label="Birim Başı Maliyet" value={tl(Math.round(cost / units))} hint="Son 30 gün" />
      </MetricStrip>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="mulk-liste" className={cn(CARD, "min-w-0")}>
          <h2 id="mulk-liste" className="sr-only">
            Mülk Listesi
          </h2>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line-soft p-4">
            <SegmentedControl
              aria-label="Duruma Göre Süz"
              size="sm"
              value={tab}
              onValueChange={setTab}
              options={[
                { value: "tumu", label: `Tümü ${counts.tumu}` },
                { value: "risk", label: `Riskli ${counts.risk}` },
                { value: "izleme", label: `İzlemede ${counts.izleme}` },
                { value: "saglikli", label: `Sağlıklı ${counts.saglikli}` },
              ]}
            />
            <div className="flex flex-wrap items-end gap-3">
              <Select label="İlçe" value={district} onValueChange={(v) => v && setDistrict(v)} items={[{ value: "hepsi", label: "Tüm İlçeler" }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]} />
              <Select
                label="Sırala"
                value={sort}
                onValueChange={(v) => v && setSort(v)}
                items={[
                  { value: "health", label: "Sağlık Skoru" },
                  { value: "cost", label: "Maliyet" },
                  { value: "orders", label: "Açık İş Emri" },
                ]}
              />
            </div>
          </div>
          <div role="region" aria-label="Mülk Tablosu" tabIndex={0} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset">
            <table className="w-full min-w-[44rem] border-collapse text-base">
              <caption className="sr-only">Mülkler: sağlık skoru, açık iş emri ve maliyet</caption>
              <thead>
                <tr className="border-b border-line-soft text-start text-small font-medium text-muted">
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">Mülk</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Birim</th>
                  <th scope="col" className="px-3 py-2.5 text-start font-medium">Sağlık</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Açık İş Emri</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Maliyet (30 Gün)</th>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = STATUS[healthOf(p)];
                  const on = p.id === selected;
                  return (
                    <tr key={p.id} className={cn("border-b border-line-soft last:border-0", on && "bg-surface")}>
                      <th scope="row" className="px-4 py-2.5 text-start font-normal">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setSelected(p.id)}
                          className="flex min-h-11 w-full items-center gap-3 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-line-focus pointer-fine:min-h-10"
                        >
                          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-overlay text-body shadow-raised [&_svg]:size-4">
                            <Building2 />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-strong">{p.name}</span>
                            <span className="block truncate text-small text-muted">
                              {p.address}, {p.district}
                            </span>
                          </span>
                        </button>
                      </th>
                      <td className="px-3 py-2.5 text-end tabular-nums">{p.units}</td>
                      <td className="px-3 py-2.5">
                        <HealthBar value={p.health} />
                      </td>
                      <td className="px-3 py-2.5 text-end tabular-nums">{p.orders}</td>
                      <td className="px-3 py-2.5 text-end tabular-nums">{p.cost ? tl(p.cost) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Bu süzgece uyan mülk yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line-soft px-4 py-3 text-small text-muted">
            {rows.length} / {all.length} mülk gösteriliyor
          </p>
        </section>
        {detail ? <PropertyDetail p={detail} /> : null}
      </div>
    </Page>
  );
}

/* ── Satıcılar ────────────────────────────────────────────────────────── */

function VendorDetail({ v }: { v: Vendor }) {
  const weeks = [0.7, 0.75, 0.72, 0.85, 0.8, 1.15, 1.3, 1.2].map((m, i) => ({ label: `H${i + 1}`, value: Math.round(v.resp * m * 10) / 10 }));
  const slow = v.resp > 4;
  return (
    <Panel
      id="satici-ayrinti"
      title={v.name}
      note={`${v.trade}${v.preferred ? " · Tercihli satıcı" : ""}`}
      actions={<Badge tone={v.insurance.tone} dot>{v.insurance.label}</Badge>}
      className="xl:sticky xl:top-4 xl:self-start"
      bodyClassName="grid gap-5"
    >
      <p className="flex items-center gap-1.5 text-base text-strong">
        <Star aria-hidden className="size-4 fill-warning text-warning" />
        <span className="font-semibold tabular-nums">{v.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}</span>
        <span className="text-muted">· bu ay {v.jobs} iş</span>
      </p>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line-soft">
        {[
          ["Ort. Yanıt", `${v.resp.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} sa`],
          ["Zamanında", `%${v.onTime}`],
          ["İş (30 Gün)", String(v.jobs)],
          ["Harcama (30 Gün)", tl(v.spend)],
        ].map(([k, val]) => (
          <div key={k} className="bg-overlay p-3">
            <dt className="text-small text-muted">{k}</dt>
            <dd className="mt-0.5 text-read font-semibold text-strong tabular-nums">{val}</dd>
          </div>
        ))}
      </dl>
      {v.id === "v1" ? (
        <InsightCallout
          title="Olağan Dışı Maliyet: Limanlı Loftlar"
          label="Dikkat"
          kind="warning"
          headingLevel={3}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => toast.success("Teklif istendi", { description: "Satıcıdan kalem kalem teklif bekleniyor." })}>
                Teklif İste
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast("Faturalar açıldı (örnek)")}>
                Faturaları Gör
              </Button>
            </>
          }
        >
          Kompresör onarım faturaları bu iş türü için ölçütün yüzde 42 üstünde. Bir sonraki ziyareti onaylamadan önce kalem kalem teklif iste.
        </InsightCallout>
      ) : slow ? (
        <InsightCallout title="Yanıt Süresi Hedefin Üstünde" label="Dikkat" kind="warning" headingLevel={3}>
          Son iki haftada ortalama yanıt 4 saatlik hedefi aştı. Acil işleri yedek satıcıya yönlendirmeyi düşün.
        </InsightCallout>
      ) : (
        <InsightCallout title="Yanıt Süresi Hedefin Altında" label="Sonuç" kind="success" headingLevel={3}>
          Son sekiz haftada ortalama yanıt 4 saatlik hedefin altında kaldı.
        </InsightCallout>
      )}
      <div>
        <h3 className="text-base font-semibold text-strong">Son 8 Hafta Ort. Yanıt</h3>
        <TrackBarChart title="Haftalık Ortalama Yanıt" data={weeks} threshold={{ value: 4, label: "Hedef" }} format={(n) => `${n.toLocaleString("tr-TR")} sa`} height="h-32" className="mt-3" />
      </div>
      <DetailSection title="İletişim">
        <ContactList
          items={[
            { kind: "phone", label: "Ofis", value: `0 212 555 01 ${String(10 + (parseInt(v.id.slice(1), 10) || 0) * 7).padStart(2, "0")}` },
            { kind: "email", value: `destek@${v.id}.example` },
          ]}
        />
      </DetailSection>
      <DetailSection title="Son İşler">
        <KeyValueList
          items={[
            ["Kompresör Gürültüsü, Limanlı Loftlar", "Sürüyor"],
            ["Filtre Değişimi, Rıhtım Hanı", "Planlandı"],
            ["Termostat Arızası, Dokuma Sıraevleri", "Tamamlandı"],
          ].map(([t, st]) => ({ label: t, value: <span className="text-small font-normal text-body">{st}</span> }))}
        />
      </DetailSection>
    </Panel>
  );
}

function Vendors() {
  const [tab, setTab] = useState<"tumu" | "tercihli" | "inceleme">("tumu");
  const [sort, setSort] = useState("spend");
  const [selected, setSelected] = useState(VENDORS[0].id);
  const review = (v: Vendor) => v.insurance.tone !== "success";
  const rows = useMemo(() => {
    const f = VENDORS.filter((v) => (tab === "tumu" ? true : tab === "tercihli" ? v.preferred : review(v)));
    const key = sort === "spend" ? (v: Vendor) => -v.spend : sort === "resp" ? (v: Vendor) => v.resp : (v: Vendor) => -v.rating;
    return [...f].sort((a, b) => key(a) - key(b));
  }, [tab, sort]);
  const totalJobs = VENDORS.reduce((s, v) => s + v.jobs, 0);
  const avgResp = VENDORS.reduce((s, v) => s + v.resp * v.jobs, 0) / totalJobs;
  const spend = VENDORS.reduce((s, v) => s + v.spend, 0);
  const clean = VENDORS.filter((v) => !review(v)).length;
  const detail = VENDORS.find((v) => v.id === selected) ?? VENDORS[0];

  return (
    <Page>
      <PageHead
        title="Satıcılar"
        description={`${VENDORS.length} aktif satıcı · ${new Set(VENDORS.map((v) => v.trade)).size} meslek grubu`}
        badge={<SampleStamp />}
        actions={
          <Button variant="primary" onClick={() => toast("Satıcı ekleme formu bu örnekte kapalı")}>
            <HardHat aria-hidden /> Satıcı Ekle
          </Button>
        }
      />
      <MetricStrip>
        <Cell label="Aktif Satıcı" value={VENDORS.length} hint={`${VENDORS.filter(review).length} incelemede`} />
        <Cell label="Ort. Yanıt" value={`${avgResp.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa`} hint="İş sayısına göre ağırlıklı" />
        <Cell label="Satıcı Harcaması" value={tl(spend)} hint="Son 30 gün" />
        <Cell label="Uyum" value={`%${Math.round((clean / VENDORS.length) * 100)}`} hint={`${VENDORS.length - clean} satıcıda sigorta sorunu`} />
      </MetricStrip>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="satici-liste" className={cn(CARD, "min-w-0")}>
          <h2 id="satici-liste" className="sr-only">
            Satıcı Listesi
          </h2>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line-soft p-4">
            <SegmentedControl
              aria-label="Satıcıları Süz"
              size="sm"
              value={tab}
              onValueChange={setTab}
              options={[
                { value: "tumu", label: `Tümü ${VENDORS.length}` },
                { value: "tercihli", label: `Tercihli ${VENDORS.filter((v) => v.preferred).length}` },
                { value: "inceleme", label: `İncelemede ${VENDORS.filter(review).length}` },
              ]}
            />
            <Select
              label="Sırala"
              value={sort}
              onValueChange={(v) => v && setSort(v)}
              items={[
                { value: "spend", label: "Harcama" },
                { value: "resp", label: "Yanıt Süresi" },
                { value: "rating", label: "Puan" },
              ]}
            />
          </div>
          <div role="region" aria-label="Satıcı Tablosu" tabIndex={0} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset">
            <table className="w-full min-w-[46rem] border-collapse text-base">
              <caption className="sr-only">Satıcılar: iş sayısı, yanıt süresi, puan, harcama ve sigorta durumu</caption>
              <thead>
                <tr className="border-b border-line-soft text-small font-medium text-muted">
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">Satıcı</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">İş</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Ort. Yanıt</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Zamanında</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Puan</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">Harcama (30 Gün)</th>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">Sigorta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const on = v.id === selected;
                  return (
                    <tr key={v.id} className={cn("border-b border-line-soft last:border-0", on && "bg-surface")}>
                      <th scope="row" className="px-4 py-2.5 text-start font-normal">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setSelected(v.id)}
                          className="flex min-h-11 w-full items-center gap-3 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-line-focus pointer-fine:min-h-10"
                        >
                          <Avatar name={v.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-strong">{v.name}</span>
                            <span className="block truncate text-small text-muted">{v.trade}</span>
                          </span>
                        </button>
                      </th>
                      <td className="px-3 py-2.5 text-end tabular-nums">{v.jobs}</td>
                      <td className="px-3 py-2.5 text-end tabular-nums">{v.resp.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} sa</td>
                      <td className="px-3 py-2.5 text-end tabular-nums">%{v.onTime}</td>
                      <td className="px-3 py-2.5 text-end tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Star aria-hidden className="size-3.5 fill-warning text-warning" />
                          {v.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1 })}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-end tabular-nums">{tl(v.spend)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={v.insurance.tone} dot>{v.insurance.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line-soft px-4 py-3 text-small text-muted">
            {rows.length} / {VENDORS.length} satıcı gösteriliyor
          </p>
        </section>
        <VendorDetail v={detail} />
      </div>
    </Page>
  );
}

/* ── Sayfa ────────────────────────────────────────────────────────────── */

export function MulkYonetimiPage() {
  const [view, setView] = useState<View>("mulkler");
  const [added, setAdded] = useState<readonly Property[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(3);

  // Kenar çubuğu bağlantıları `#...`: tıklamayı yakala, görünümü iç durumla değiştir.
  function onNavClick(event: React.MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
    if (!link) return;
    const next = link.getAttribute("href")?.slice(1);
    if (next === "mulkler" || next === "saticilar") {
      event.preventDefault();
      setView(next);
    }
  }

  return (
    <div onClickCapture={onNavClick}>
      <Shell
        brand={{ name: "Bina Yönetimi", href: "#mulkler", logo: <BrandMark><Building2 /></BrandMark> }}
        groups={NAV}
        current={`#${view}`}
        user={{ name: "Nizam", detail: "Portföy Yöneticisi" }}
      >
        {view === "mulkler" ? <Properties added={added} onAdd={() => undefined} openAdd={() => setOpen(true)} /> : <Vendors />}
      </Shell>
      <SidebarSlot>
        <SetupCard
          title="Kurulumu Bitir"
          description="Bina sensörlerini bağla, arızalar daha erken öngörülsün."
          step={step}
          total={4}
          onSkip={() => setStep(4)}
          onNext={() => setStep((s) => Math.min(4, s + 1))}
          className="mb-1"
        />
      </SidebarSlot>
      <AddProperty
        open={open}
        onOpenChange={setOpen}
        onAdd={(p) => {
          setAdded((a) => [p, ...a]);
          setView("mulkler");
          toast.success(`${p.name} eklendi`, { description: "Başlangıç bakım planı oluşturuldu." });
        }}
      />
      <Toaster />
    </div>
  );
}
