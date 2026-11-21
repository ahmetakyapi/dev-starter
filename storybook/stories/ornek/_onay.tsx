"use client";

import {
  BookCheck,
  Clock,
  CreditCard,
  FileSearch,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Repeat,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { ImpactBar } from "@/components/ui/impact-bar";
import { Input } from "@/components/ui/input";
import { KbdCombo } from "@/components/ui/kbd";
import { OptionCards } from "@/components/ui/option-cards";
import { PolicyChecks, type PolicyCheck } from "@/components/ui/policy-checks";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { TickMeter } from "@/components/ui/tick-meter";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Onay kuyruğu (Spendix görselinden YAPI ve davranış; ad, metin ve veri kurgusal):
 * harcama taleplerini bütçe ve politika bağlamıyla hızlı karara bağlayan ekran.
 *
 * - Kuyruk: onay kutusu, talep eden, bütçe kullanımı (çentikli çubuk), SLA
 *   rozeti, satırda "Reddet" / "Onayla". Satırın adına basınca sağdaki panel
 *   o talebi gösterir.
 * - Seçili talep: tutar, bütçe etkisi (`ImpactBar` + haftalık sütunlar),
 *   politika kontrolleri, geçmiş. ⌘/Ctrl + Enter seçili talebi onaylar.
 * - "Reddet": neden `OptionCards`, talep edene mesaj, bildirim anahtarı.
 * - "Vekil Ata": vekil, tarih aralığı, kapsam, ofis dışı anahtarı.
 * - "Seçilenleri Onayla": toplu özet ve onay sonrası bütçe (`ImpactBar`).
 *
 * Durum bileşenin içinde: onaylanan satır kuyruktan çıkar, bildirimde
 * "Geri Al" vardır. Sayfada `dark:` yok; açık ve koyu tema token'la döner.
 */

/* ── Biçim ve kurgusal veri ───────────────────────────────────────────── */

export const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

type Team = "Pazarlama" | "Satış" | "Tasarım" | "Mühendislik";

/** Takım bütçeleri (aylık, ₺). Kuyruktaki "kullanım" bu sayılardan türer. */
const BUDGETS: Record<Team, { limit: number; spent: number }> = {
  Pazarlama: { limit: 60000, spent: 19200 },
  "Satış": { limit: 50000, spent: 13000 },
  "Tasarım": { limit: 40000, spent: 14000 },
  "Mühendislik": { limit: 70000, spent: 15400 },
};

const usedPct = (team: Team) => Math.round((BUDGETS[team].spent / BUDGETS[team].limit) * 100);

type Request = {
  id: string;
  title: string;
  vendor: string;
  team: Team;
  requester: string;
  amount: number;
  cadence: "aylık" | "yıllık" | "tek sefer";
  /** Bekleme süresi (saat). */
  waitHours: number;
  submitted: string;
  /** Çakışan kayıt varsa açıklaması. */
  duplicate?: string;
  newVendor?: boolean;
  approvedSince?: string;
};

const REQUESTS: readonly Request[] = [
  { id: "T-1029", title: "Müşteri İlişkileri Aracı · 3 Koltuk", vendor: "Müşteri Araç", team: "Satış", requester: "Kaan Ersoy", amount: 8900, cadence: "aylık", waitHours: 27, submitted: "20 Kas, 07:48", approvedSince: "2023" },
  { id: "T-1031", title: "Tasarım Atölyesi · Yıllık Plan", vendor: "Tasarım Atölyesi", team: "Tasarım", requester: "Pelin Sarı", amount: 5998, cadence: "yıllık", waitHours: 26, submitted: "20 Kas, 08:30", approvedSince: "2022" },
  { id: "T-1039", title: "Bulut Kredisi · Test Ortamı", vendor: "Bulut Kredisi", team: "Mühendislik", requester: "Efe Tuna", amount: 2400, cadence: "tek sefer", waitHours: 5, submitted: "21 Kas, 05:12", approvedSince: "2021" },
  { id: "T-1047", title: "Grafik Aracı · 2 Koltuk", vendor: "Grafik Aracı", team: "Pazarlama", requester: "Lale Çınar", amount: 2400, cadence: "aylık", waitHours: 2, submitted: "21 Kas, 08:12", duplicate: "Kartta 1 koltuk kayıtlı", approvedSince: "2024" },
  { id: "T-1048", title: "Webinar Eklentisi", vendor: "Webinar Eklentisi", team: "Pazarlama", requester: "Lale Çınar", amount: 2400, cadence: "tek sefer", waitHours: 1, submitted: "21 Kas, 09:02", approvedSince: "2022" },
  { id: "T-1052", title: "Veri Etiketleme Hizmeti", vendor: "Veri Etiketleme", team: "Mühendislik", requester: "Burak Demir", amount: 12400, cadence: "aylık", waitHours: 3, submitted: "21 Kas, 07:20", newVendor: true },
  { id: "T-1055", title: "Etkinlik Standı Kirası", vendor: "Etkinlik Standı", team: "Pazarlama", requester: "Defne Kılıç", amount: 18500, cadence: "tek sefer", waitHours: 6, submitted: "21 Kas, 04:40", approvedSince: "2025" },
  { id: "T-1058", title: "Hızlı Teklif Şablonları", vendor: "Teklif Şablonları", team: "Satış", requester: "Cem Yalçın", amount: 1450, cadence: "aylık", waitHours: 4, submitted: "21 Kas, 06:10", approvedSince: "2024" },
];

const BIG_LIMIT = 5000;
const OVER_HOURS = 24;

const checksFor = (r: Request): PolicyCheck[] => {
  const b = BUDGETS[r.team];
  const remaining = b.limit - b.spent - r.amount;
  return [
    { id: "butce", label: `Bütçe içinde: ${r.team}`, detail: remaining >= 0 ? `${tl(remaining)} kalır` : `${tl(-remaining)} aşar`, state: remaining >= 0 ? "pass" : "fail" },
    { id: "satici", label: r.newVendor ? "Yeni satıcı" : "Onaylı satıcı", detail: r.newVendor ? "İlk talep, 30 gün inceleme" : `${r.vendor} · ${r.approvedSince}'den beri`, state: r.newVendor ? "warn" : "pass" },
    { id: "kopya", label: r.duplicate ? "Kopya kayıt var" : "Çakışan kayıt yok", detail: r.duplicate ? "Kartta 1 koltuk kayıtlı" : "Başka kartta görünmüyor", state: r.duplicate ? "warn" : "pass" },
  ];
};

const eventsFor = (r: Request): TimelineEvent[] => {
  const checks = checksFor(r);
  const clean = checks.filter((c) => c.state === "pass").length;
  return [
    { id: "g", at: "2026-11-20T08:12", when: r.submitted, title: "Talep Gönderildi", description: `${r.requester} · teklif eklendi`, tone: "primary", icon: <Send /> },
    { id: "k", at: "2026-11-20T08:12", when: r.submitted, title: "Otomatik Kontroller Tamamlandı", description: `${checks.length} kontrolden ${clean}'i temiz`, tone: clean === checks.length ? "success" : "warning", icon: <ShieldCheck /> },
    { id: "b", at: "2026-11-21T10:40", when: "Şimdi", title: "Sende Bekliyor", description: `Finans adımı · ${r.waitHours} saattir bekliyor`, tone: "warning", icon: <Clock /> },
  ];
};

/* ── Kenarsız kabuk: iki örnek sayfa ortak kullanır ──────────────────── */

export const FLAT_SHELL =
  "[&>aside]:sticky [&>aside]:top-0 [&>aside]:h-dvh [&>aside]:self-start [&>div:has(>#icerik)]:p-0 [&_#icerik]:rounded-none [&_#icerik]:shadow-none [&_#icerik]:ring-0 lg:[&_#icerik]:border-s lg:[&_#icerik]:border-line";

export function FlatShell({
  brand,
  logo,
  groups,
  current,
  user,
  children,
}: {
  brand: string;
  logo: ReactNode;
  groups: readonly ShellNavGroup[];
  current: string;
  user: { name: string; detail: string };
  children: ReactNode;
}) {
  return (
    <>
      <AppShell
        brand={{ name: brand, href: current, logo: <span aria-hidden className="inline-grid size-7 place-items-center rounded-lg bg-strong text-page [&_svg]:size-4">{logo}</span> }}
        groups={groups}
        current={current}
        user={user}
        searchLabel="Ara"
        className={FLAT_SHELL}
      >
        {children}
      </AppShell>
      <Toaster />
    </>
  );
}

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Çalışma Alanı",
    items: [
      { href: "#pano", label: "Pano", icon: <LayoutDashboard /> },
      { href: "#yeni", label: "Yeni Talep", icon: <PlusCircle /> },
      { href: "#inceleme", label: "İnceleme", icon: <FileSearch /> },
      { href: "#kartlar", label: "Kartlar", icon: <CreditCard /> },
      { href: "#onaylar", label: "Onaylar", icon: <BookCheck />, badge: undefined },
      { href: "#abonelikler", label: "Abonelikler", icon: <Repeat /> },
      { href: "#islemler", label: "İşlemler", icon: <Receipt /> },
    ],
  },
  {
    label: "Hesabım",
    items: [
      { href: "#taleplerim", label: "Taleplerim", icon: <Send /> },
      { href: "#kartim", label: "Kartım", icon: <Wallet /> },
      { href: "#takim", label: "Takım Harcaması", icon: <Users /> },
    ],
  },
  { items: [{ href: "#ayarlar", label: "Sistem Ayarları", icon: <Settings2 /> }] },
];

/* ── Küçük parçalar ───────────────────────────────────────────────────── */

const CARD = "rounded-xl bg-overlay shadow-raised ring-1 ring-line";

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3.5 sm:px-5">
      <dt className="text-small font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-title font-semibold tracking-tight text-strong tabular-nums">{value}</dd>
      <dd className="mt-0.5 truncate text-small text-muted">{hint}</dd>
    </div>
  );
}

function SlaBadge({ hours }: { hours: number }) {
  const over = hours >= OVER_HOURS;
  return (
    <Badge tone={over ? "danger" : "neutral"} dot>
      {over ? "Süresi Aştı" : "Bekliyor"} · {hours} sa
    </Badge>
  );
}

const WEEKS = ["1–7", "8–14", "15–21", "22–28", "29–30"] as const;
const WEEK_WEIGHTS = [0.25, 0.32, 0.43, 0, 0] as const;

/** Haftalık harcama sütunları; bu talebin ekleyeceği tutar vurgulu sütunda üst üste biner. */
function WeeklyImpact({ team, added }: { team: Team; added: number }) {
  const base = WEEK_WEIGHTS.map((w) => Math.round(BUDGETS[team].spent * w));
  const addIndex = 3;
  const max = Math.max(...base, added, 1) * 1.15;
  const summary = `${team} haftalık harcama, Kasım: ${WEEKS.map((w, i) => `${w}. hafta ${tl(base[i] + (i === addIndex ? added : 0))}`).join(", ")}. Bu talep 22–28 haftasına ${tl(added)} ekler.`;
  return (
    <figure className="min-w-0">
      <div role="img" aria-label={summary} className="grid grid-cols-5 items-end gap-2">
        {WEEKS.map((w, i) => {
          const h = (n: number) => `${Math.max((n / max) * 100, n > 0 ? 3 : 0)}%`;
          return (
            <div key={w} className="flex min-w-0 flex-col items-center gap-1.5">
              <div className="relative flex h-20 w-full items-end overflow-hidden rounded-md bg-chart-track">
                <div className="absolute inset-x-0 bottom-0 bg-line-strong" style={{ height: h(base[i]) }} />
                {i === addIndex ? <div className="absolute inset-x-0 bg-primary" style={{ height: h(added), bottom: h(base[i]) }} /> : null}
              </div>
              <span aria-hidden className={cn("text-micro tabular-nums", i === addIndex ? "font-semibold text-strong" : "text-muted")}>
                {w}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-muted">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm bg-line-strong" />Harcanan</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm bg-primary" />Bu talep</span>
      </figcaption>
    </figure>
  );
}

/* ── Ret nedenleri ────────────────────────────────────────────────────── */

type Reason = "butce" | "kopya" | "teklif" | "gider";

const REASON_TEXT: Record<Reason, string> = {
  butce: "Takım bütçesini aşıyor. Bütçe yenilenince ya da tutar düşünce yeniden gönderebilirsin.",
  kopya: "Bu araç için ekip kartında zaten bir koltuk var. O koltuğu paylaş; gerçekten ikinci koltuk gerekiyorsa gerekçesiyle yeniden gönder.",
  teklif: "Teklif ya da makbuz eksik. Belgeyi ekleyip yeniden gönder.",
  gider: "Bu harcama iş gideri olarak görünmüyor. Kişisel ya da kurum dışı harcamalar bu akıştan geçmez.",
};

function recommended(r: Request): Reason {
  return r.duplicate ? "kopya" : BUDGETS[r.team].spent + r.amount > BUDGETS[r.team].limit ? "butce" : "teklif";
}

function RejectDialog({ request, onClose, onReject }: { request: Request | null; onClose: () => void; onReject: (r: Request, text: string) => void }) {
  return request ? <RejectBody key={request.id} request={request} onClose={onClose} onReject={onReject} /> : null;
}

function RejectBody({ request, onClose, onReject }: { request: Request; onClose: () => void; onReject: (r: Request, text: string) => void }) {
  const best = recommended(request);
  const [reason, setReason] = useState<Reason>(best);
  const [message, setMessage] = useState(REASON_TEXT[best]);
  const [touched, setTouched] = useState(false);
  const [notify, setNotify] = useState(true);
  const [resubmit, setResubmit] = useState(true);

  const options = (
    [
      { value: "butce", title: "Takım Bütçesini Aşıyor", description: `${request.team} bütçesinde ${tl(BUDGETS[request.team].limit - BUDGETS[request.team].spent)} kalmış.` },
      { value: "kopya", title: "Mevcut Aracı Kopyalıyor", description: "Aynı araç için kartta zaten bir koltuk var." },
      { value: "teklif", title: "Eksik Teklif ya da Makbuz", description: "Belgeyi iste ve yeniden gönderilsin." },
      { value: "gider", title: "İş Gideri Değil", description: "Kişisel ya da kurum dışı harcama." },
    ] as const
  ).map((o) => ({ ...o, badge: o.value === best ? "Önerilen" : undefined }));

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Talebi Reddet"
      description={`${request.title} · ${tl(request.amount)} · ${request.id}`}
      size="md"
      dismissible={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="danger" onClick={() => onReject(request, notify ? `${request.requester} bilgilendirildi` : "Bildirim gönderilmedi")}>
            Talebi Reddet
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <OptionCards
          legend="Ret Nedeni"
          options={options}
          value={reason}
          onValueChange={(v) => {
            const next = v as Reason;
            setReason(next);
            if (!touched) setMessage(REASON_TEXT[next]);
          }}
        />
        <Textarea
          label={`Mesaj: ${request.requester}`}
          hint="Talep eden bunu görür."
          value={message}
          onChange={(e) => {
            setTouched(true);
            setMessage(e.target.value);
          }}
          minRows={3}
        />
        <div className="grid gap-1 rounded-xl bg-surface p-3">
          <Switch label={`Talep edeni bilgilendir: ${request.requester}`} hint="E-posta ve mesajlaşma, yukarıdaki mesajla birlikte." checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        </div>
        <Checkbox label="Yeniden gönderime izin ver" checked={resubmit} onChange={(e) => setResubmit(e.target.checked)} />
      </div>
    </Dialog>
  );
}

/* ── Vekil ata ────────────────────────────────────────────────────────── */

type Delegation = { who: string; range: string; away: boolean };

const DELEGATES = [
  { value: "Selin Aras", label: "Selin Aras · Finans Direktörü" },
  { value: "Orhan Bulut", label: "Orhan Bulut · Operasyon Müdürü" },
  { value: "Işıl Kaplan", label: "Işıl Kaplan · Bütçe Sorumlusu" },
] as const;

type Span = "yarin" | "hafta" | "ozel";
const SPANS: readonly { value: Span; label: string }[] = [
  { value: "yarin", label: "Yarın" },
  { value: "hafta", label: "Gelecek Hafta" },
  { value: "ozel", label: "Özel" },
];
const SPAN_TEXT: Record<Exclude<Span, "ozel">, string> = { yarin: "22 Kas 2026", hafta: "23–29 Kas 2026" };

function DelegateDialog({ open, pending, onClose, onSave }: { open: boolean; pending: number; onClose: () => void; onSave: (d: Delegation) => void }) {
  const [who, setWho] = useState<string>(DELEGATES[0].value);
  const [span, setSpan] = useState<Span>("hafta");
  const [from, setFrom] = useState("2026-11-23");
  const [to, setTo] = useState("2026-11-29");
  const [scopeSmall, setScopeSmall] = useState(true);
  const [scopeWaiting, setScopeWaiting] = useState(true);
  const [scopeLimit, setScopeLimit] = useState(false);
  const [away, setAway] = useState(true);
  const range = span === "ozel" ? `${from} – ${to}` : SPAN_TEXT[span];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Onayları Devret"
      description="Yokken biri senin yerine onay verir."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={() => onSave({ who, range, away })}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <Select label="Vekil" items={DELEGATES} value={who} onValueChange={(v) => v && setWho(v)} />
        <div className="grid gap-2">
          <SegmentedControl aria-label="Tarih Aralığı" options={SPANS} value={span} onValueChange={setSpan} />
          {span === "ozel" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Başlangıç" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="Bitiş" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          ) : (
            <p className="text-small text-muted">Tarihler: {range}</p>
          )}
        </div>
        <fieldset className="grid gap-1">
          <legend className="mb-1 text-small font-semibold text-strong">Kapsam</legend>
          <Checkbox label="1.000 ₺'ye kadar talepler" checked={scopeSmall} onChange={(e) => setScopeSmall(e.target.checked)} />
          <Checkbox label={`Şu an bekleyen ${pending} talebi dahil et`} checked={scopeWaiting} onChange={(e) => setScopeWaiting(e.target.checked)} />
          <Checkbox label="Kart limiti değişiklikleri" checked={scopeLimit} onChange={(e) => setScopeLimit(e.target.checked)} />
        </fieldset>
        <div className="rounded-xl bg-surface p-3">
          <Switch label="Ofis Dışında" hint={`Talep edenler "${who} vekil" bilgisini görür.`} checked={away} onChange={(e) => setAway(e.target.checked)} />
        </div>
      </div>
    </Dialog>
  );
}

/* ── Toplu onay ───────────────────────────────────────────────────────── */

function BulkDialog({ items, onClose, onApprove }: { items: readonly Request[]; onClose: () => void; onApprove: (items: readonly Request[]) => void }) {
  const [notify, setNotify] = useState(true);
  const total = items.reduce((s, r) => s + r.amount, 0);
  const teams = [...new Set(items.map((r) => r.team))];
  return (
    <Dialog
      open={items.length > 0}
      onOpenChange={(o) => !o && onClose()}
      title={`${items.length} Talebi Onayla`}
      description={`${tl(total)} toplam · ${teams.join(" ve ")} bütçesinden`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={() => onApprove(items)}>
            {tl(total)} Onayla
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <ul role="list" className="divide-y divide-line-soft rounded-xl ring-1 ring-line">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-strong">{r.title}</p>
                <p className="truncate text-small text-muted">
                  {r.requester} · {r.team}
                </p>
              </div>
              <span className="shrink-0 text-base font-semibold text-strong tabular-nums">{tl(r.amount)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 bg-surface px-3.5 py-2.5 text-base">
            <span className="text-muted">Toplam</span>
            <span className="font-semibold text-strong tabular-nums">{tl(total)}</span>
          </li>
        </ul>
        <section aria-labelledby="bulk-budget" className="grid gap-3">
          <h3 id="bulk-budget" className="text-small font-semibold text-strong">
            Onay Sonrası Bütçe
          </h3>
          {teams.map((t) => (
            <ImpactBar key={t} label={t} current={BUDGETS[t].spent} added={items.filter((r) => r.team === t).reduce((s, r) => s + r.amount, 0)} limit={BUDGETS[t].limit} format={tl} />
          ))}
        </section>
        <Checkbox label="Talep edenleri bilgilendir" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
      </div>
    </Dialog>
  );
}

/* ── Sayfa ────────────────────────────────────────────────────────────── */

type Tab = "tumu" | "asan" | "buyuk";
type Sort = "eski" | "yuksek" | "dusuk";

export function OnayKuyrugu({ initialTab = "tumu" }: { initialTab?: Tab } = {}) {
  const [queue, setQueue] = useState<readonly Request[]>(REQUESTS);
  const [selectedId, setSelectedId] = useState("T-1047");
  const [checked, setChecked] = useState<readonly string[]>([]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sort, setSort] = useState<Sort>("eski");
  const [approvedBefore] = useState(181);
  const [approvedNow, setApprovedNow] = useState(0);
  const [rejectFor, setRejectFor] = useState<Request | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegation, setDelegation] = useState<Delegation | null>(null);

  const visible = useMemo(() => {
    const list = queue.filter((r) => (tab === "asan" ? r.waitHours >= OVER_HOURS : tab === "buyuk" ? r.amount > BIG_LIMIT : true));
    return [...list].sort((a, b) => (sort === "eski" ? b.waitHours - a.waitHours : sort === "yuksek" ? b.amount - a.amount : a.amount - b.amount));
  }, [queue, tab, sort]);

  const selected = queue.find((r) => r.id === selectedId) ?? visible[0] ?? null;
  const chosen = queue.filter((r) => checked.includes(r.id));
  const overCount = queue.filter((r) => r.waitHours >= OVER_HOURS).length;
  const bigCount = queue.filter((r) => r.amount > BIG_LIMIT).length;
  const requested = queue.reduce((s, r) => s + r.amount, 0);

  const resolve = useCallback((items: readonly Request[], kind: "approved" | "rejected", title: string, description: string) => {
    const ids = new Set(items.map((i) => i.id));
    setQueue((q) => q.filter((r) => !ids.has(r.id)));
    setChecked((c) => c.filter((id) => !ids.has(id)));
    if (kind === "approved") setApprovedNow((n) => n + items.length);
    toast.undo(
      title,
      () => {
        setQueue((q) => REQUESTS.filter((r) => q.some((x) => x.id === r.id) || ids.has(r.id)));
        if (kind === "approved") setApprovedNow((n) => n - items.length);
      },
      { description },
    );
  }, []);

  const approve = useCallback(
    (items: readonly Request[]) => {
      if (items.length === 0) return;
      const sum = items.reduce((s, r) => s + r.amount, 0);
      resolve(items, "approved", items.length === 1 ? `${items[0].id} Onaylandı` : `${items.length} Talep Onaylandı`, `${tl(sum)} · ${[...new Set(items.map((i) => i.team))].join(", ")} bütçesine işlendi`);
    },
    [resolve],
  );

  // ⌘/Ctrl + Enter: seçili talebi onayla (iletişim kutusu açıkken değil).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter" || rejectFor || bulkOpen || delegateOpen || !selected) return;
      e.preventDefault();
      approve([selected]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, rejectFor, bulkOpen, delegateOpen, approve]);

  const toggle = (id: string, on: boolean) => setChecked((c) => (on ? [...c, id] : c.filter((x) => x !== id)));

  return (
    <FlatShell brand="Harcama Onayı" logo={<ShieldCheck />} groups={NAV} current="#onaylar" user={{ name: "Ethan Cole", detail: "Finans Adımı" }}>
      <div className="flex w-full min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 lg:py-7">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-[min(100%,18rem)] flex-1">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-heading font-semibold tracking-tight text-strong">
              Onaylar
              <span className="rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-micro tracking-wide text-body">ÖRNEK VERİ</span>
            </h1>
            <p className="mt-1 text-base text-muted">Harcama taleplerini bütçe ve politika bağlamıyla hızlıca karara bağla.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {delegation ? (
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-surface px-3 text-small text-body">
                Vekil: {delegation.who} · {delegation.range}
                <button
                  type="button"
                  onClick={() => setDelegation(null)}
                  aria-label="Vekili kaldır"
                  className="inline-grid size-6 place-items-center rounded-sm text-muted hover:bg-surface-raised hover:text-strong"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => setDelegateOpen(true)}>
              <UserRoundCog aria-hidden />
              Vekil Ata
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast.info("Onay kuralları bu örnekte gösterilmiyor")}>
              <SlidersHorizontal aria-hidden />
              Onay Kuralları
            </Button>
            <Button variant="primary" size="sm" disabled={chosen.length === 0} onClick={() => setBulkOpen(true)}>
              Seçilenleri Onayla{chosen.length ? ` (${chosen.length})` : ""}
            </Button>
          </div>
        </header>

        <dl className={cn(CARD, "grid grid-cols-2 divide-line-soft max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(2n)]:border-s lg:grid-cols-4 lg:[&>*+*]:border-s [&>*]:border-line-soft")}>
          <Stat label="Sende Bekleyen" value={queue.length} hint={`${tl(requested)} talep edildi`} />
          <Stat label="Ort. Onay Süresi" value="3,2 sa" hint="Geçen aya göre 0,6 sa hızlı" />
          <Stat label="Bu Ay Onaylanan" value={approvedBefore + approvedNow} hint="%96'sı ilk seferde onaylandı" />
          <Stat label="Süresi Aşan" value={overCount} hint="24 saatten uzun bekleyen" />
        </dl>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <section aria-labelledby="kuyruk" className={cn(CARD, "min-w-0")}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
              <h2 id="kuyruk" className="text-read font-semibold text-strong">
                Kuyruk <span className="ms-1 text-small font-normal text-muted tabular-nums">{queue.length}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  aria-label="Kuyruk Süzgeci"
                  size="sm"
                  value={tab}
                  onValueChange={setTab}
                  options={[
                    { value: "tumu", label: `Tümü ${queue.length}` },
                    { value: "asan", label: `Süresi Aşan ${overCount}` },
                    { value: "buyuk", label: `5.000 ₺ Üstü ${bigCount}` },
                  ]}
                />
                <Select
                  label="Sıralama"
                  hideLabel
                  className="w-44"
                  value={sort}
                  onValueChange={(v) => v && setSort(v as Sort)}
                  items={[
                    { value: "eski", label: "En Eski Önce" },
                    { value: "yuksek", label: "Tutar: Yüksekten" },
                    { value: "dusuk", label: "Tutar: Düşükten" },
                  ]}
                />
              </div>
            </header>
            {visible.length === 0 ? (
              <p className="px-5 py-10 text-center text-base text-muted">
                {queue.length === 0 ? "Bekleyen talep kalmadı. Kuyruk temiz." : "Bu süzgeçle eşleşen talep yok."}
              </p>
            ) : (
              <ul role="list" className="divide-y divide-line-soft">
                {visible.map((r) => {
                  const isSel = selected?.id === r.id;
                  return (
                    <li key={r.id} aria-current={isSel ? "true" : undefined} className={cn("px-4 py-3.5 sm:px-5", isSel && "bg-surface")}>
                      <div className="flex items-start gap-3">
                        <Checkbox aria-label={`Seç: ${r.title}`} checked={checked.includes(r.id)} onChange={(e) => toggle(r.id, e.target.checked)} className="mt-1" />
                        <Avatar name={r.vendor} size="md" />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => setSelectedId(r.id)} className="block max-w-full truncate text-start text-base font-semibold text-strong hover:underline">
                            {r.title}
                          </button>
                          <p className="truncate text-small text-muted">
                            {r.requester} · {r.team} · {r.id}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="text-base font-semibold text-strong tabular-nums">{tl(r.amount)}</p>
                          <p className="text-small text-muted">{r.cadence}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 ps-[3.75rem]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-small text-muted">{r.team} Bütçesi</span>
                          <TickMeter label={`${r.team} bütçesi`} value={usedPct(r.team)} max={100} ticks={14} size="sm" text={`%${usedPct(r.team)}`} className="w-36" />
                        </div>
                        <SlaBadge hours={r.waitHours} />
                        <div className="ms-auto flex items-center gap-2">
                          <Button variant="secondary" size="sm" aria-label={`Reddet: ${r.title}`} onClick={() => setRejectFor(r)}>
                            Reddet
                          </Button>
                          <Button variant="primary" size="sm" aria-label={`Onayla: ${r.title}`} onClick={() => approve([r])}>
                            Onayla
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside aria-labelledby="secili" className={cn(CARD, "min-w-0 xl:sticky xl:top-6")}>
            {selected ? (
              <div className="grid gap-5 p-4 sm:p-5">
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 id="secili" className="text-small font-semibold text-muted">
                      Seçili Talep
                    </h2>
                    <p className="mt-1 text-read font-semibold text-strong">{selected.title}</p>
                    <p className="text-small text-muted">
                      {selected.id} · {selected.requester} · {selected.submitted}
                    </p>
                  </div>
                  <SlaBadge hours={selected.waitHours} />
                </header>
                <p className="flex items-baseline gap-2 text-heading font-semibold tracking-tight text-strong tabular-nums">
                  {tl(selected.amount)}
                  <span className="text-base font-normal text-muted">{selected.cadence}</span>
                </p>
                <section aria-labelledby="etki" className="grid gap-3">
                  <h3 id="etki" className="text-small font-semibold text-strong">
                    {selected.team} Bütçe Etkisi
                  </h3>
                  <ImpactBar label={selected.team} current={BUDGETS[selected.team].spent} added={selected.amount} limit={BUDGETS[selected.team].limit} format={tl} />
                  <WeeklyImpact team={selected.team} added={selected.amount} />
                </section>
                <PolicyChecks title="Politika Kontrolleri" checks={checksFor(selected)} />
                <section aria-labelledby="gecmis" className="grid gap-3">
                  <h3 id="gecmis" className="text-read font-semibold text-strong">
                    Geçmiş
                  </h3>
                  <Timeline events={eventsFor(selected)} />
                </section>
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                  <span className="inline-flex items-center gap-1.5 text-small text-muted">
                    <KbdCombo keys={["⌘", "Enter"]} label="Command Enter" />
                    ile onayla
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setRejectFor(selected)}>
                      Reddet
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => approve([selected])}>
                      {tl(selected.amount)} Onayla
                    </Button>
                  </div>
                </footer>
              </div>
            ) : (
              <div className="p-5">
                <h2 id="secili" className="text-small font-semibold text-muted">
                  Seçili Talep
                </h2>
                <p className="mt-3 text-base text-muted">Kuyrukta talep kalmadı.</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <RejectDialog
        request={rejectFor}
        onClose={() => setRejectFor(null)}
        onReject={(r, note) => {
          setRejectFor(null);
          resolve([r], "rejected", `${r.id} Reddedildi`, note);
        }}
      />
      <DelegateDialog
        key={delegateOpen ? "open" : "closed"}
        open={delegateOpen}
        pending={queue.length}
        onClose={() => setDelegateOpen(false)}
        onSave={(d) => {
          setDelegation(d);
          setDelegateOpen(false);
          toast.success("Vekil Atandı", { description: `${d.who} · ${d.range}${d.away ? " · Ofis dışı bilgisi açık" : ""}` });
        }}
      />
      <BulkDialog
        items={bulkOpen ? chosen : []}
        onClose={() => setBulkOpen(false)}
        onApprove={(items) => {
          setBulkOpen(false);
          approve(items);
        }}
      />
    </FlatShell>
  );
}
