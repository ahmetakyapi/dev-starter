"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Banknote, Download, FilePlus2, Scale, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { InsightCallout } from "@/components/ui/insight-callout";
import { OptionCards } from "@/components/ui/option-cards";
import { Switch } from "@/components/ui/switch";
import { ValueDiff } from "@/components/ui/value-diff";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import type { SavedView } from "@/components/ui/saved-views";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { TabLinks } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { audit } from "./_audit";
import { dayDiff, DEFAULT_LATE_RATES, lateInterest, owed } from "./_billing";
import { TODAY, TODAY_KEY, addDays, daysBetween, dayKey, dayLabel, parseDay } from "./_data";
import { allInvoices, buildDraft, getFinance, issueCorrection, cancelInvoice, fileDispute } from "./_data-finans";
import { effectiveReadings } from "./_ops";
import { findCustomer, metersFor, validIban } from "./_data-musteri";
import { CREDIT_SOURCE_LABEL, DISPUTE_KIND_LABEL, DISPUTE_STATUS_LABEL, type Credit, type CreditSource, type Dispute, type DisputeKind } from "./_data-yeni";
import { EmptyStateX, FilterBar, PageHero, fmtNum, fmtTl, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { disputeSlaBreaches, openCreditTotal, openCredits, openDisputes } from "./_selectors";
import { advanceDispute, applyCredit, createCredit, createDispute, decideDispute, refundCredit, useCredits, useDisputes } from "./_store";
import { PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ====================================================================== *
 *  Ortak
 * ====================================================================== */

function RowClickable({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useListKeys(root);
  return (
    <div
      ref={root}
      className="[&_tbody_tr]:cursor-pointer"
      onClick={(event) => {
        const el = event.target as HTMLElement;
        if (el.closest("a,button,input,label,[role=checkbox]")) return;
        el.closest("tr")?.querySelector<HTMLAnchorElement>("a[data-row]")?.click();
      }}
    >
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-strong">{value}</dd>
    </div>
  );
}

const customerName = (id: string) => findCustomer(id)?.name ?? id;

function csv(name: string, head: readonly string[], rows: readonly (readonly (string | number)[])[]) {
  const lines = rows.map((r) => r.map((c) => (typeof c === "string" && /[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";"));
  const blob = new Blob(["﻿", [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ItirazlarPage({ params, go }: PageProps) {
  const tab = params.tab === "alacak" ? "alacak" : "itiraz";
  const disputes = useDisputes();
  const credits = useCredits();
  const open = openDisputes();
  const sla = disputeSlaBreaches();
  const creditsOpen = openCredits();

  return (
    <>
      <PageHead title="İtirazlar ve Mahsup" description="Fatura, sayaç ve tutanak itirazları; fazla ödeme, mahsup ve iade tek yerden." />
      <PageBody>
        <PageHero
          primary={{ label: "Açık İtiraz", value: fmtNum(open.length), foot: `${sla.length} itiraz yanıt süresini aştı`, icon: <Scale />, goodWhen: "down", to: { page: "disputes", params: { g: "sla" } } }}
          secondary={[
            { label: "SLA Aşımı", value: fmtNum(sla.length), foot: "Yanıt süresi dolanlar", to: { page: "disputes", params: { g: "sla" } } },
            { label: "Karar Bekleyen", value: fmtNum(disputes.filter((d) => d.status === "karar").length), foot: "İnceleme tamam, karar yok", to: { page: "disputes", params: { g: "karar" } } },
            { label: "Sayaç Testi", value: fmtNum(open.filter((d) => d.meterTest).length), foot: "Doğruluk testi istenen", to: { page: "disputes", params: { g: "test" } } },
            { label: "Açık Alacak", value: fmtNum(creditsOpen.length), foot: "Mahsup ya da iade bekleyen", to: { page: "disputes", params: { tab: "alacak" } } },
            { label: "Alacak Tutarı", value: fmtTl(openCreditTotal(), 0), foot: "Abonelere borçlu olunan", to: { page: "disputes", params: { tab: "alacak" } } },
            { label: "Bu Dönem Kapanan", value: fmtNum(disputes.filter((d) => d.status === "kapandi").length), foot: "Kararı verilmiş itirazlar" },
          ]}
        />

        <TabLinks
          aria-label="İtirazlar ve Mahsup"
          current={href("disputes", { tab: tab === "alacak" ? "alacak" : undefined })}
          items={[
            { href: href("disputes"), label: `İtirazlar ${open.length}` },
            { href: href("disputes", { tab: "alacak" }), label: `Alacak ve Mahsup ${creditsOpen.length}` },
          ]}
        />

        {tab === "itiraz" ? <DisputesTab params={params} go={go} /> : <CreditsTab credits={credits} />}
      </PageBody>
    </>
  );
}

/* ====================================================================== *
 *  İTİRAZLAR
 * ====================================================================== */

const STATUS_TONE: Record<Dispute["status"], "warning" | "primary" | "success" | "neutral"> = { acik: "warning", inceleme: "primary", karar: "primary", kapandi: "success" };
const daysLeft = (d: Dispute) => daysBetween(TODAY, parseDay(d.dueAt));
const slaOver = (d: Dispute) => d.status !== "kapandi" && daysLeft(d) < 0;

const DVIEWS: readonly { id: string; label: string; match: (d: Dispute) => boolean }[] = [
  { id: "all", label: "Tümü", match: () => true },
  { id: "acik", label: "Açık", match: (d) => d.status !== "kapandi" },
  { id: "sla", label: "SLA Aşımı", match: slaOver },
  { id: "karar", label: "Karar Bekliyor", match: (d) => d.status === "karar" },
  { id: "test", label: "Sayaç Testi", match: (d) => d.meterTest && d.status !== "kapandi" },
  { id: "kapandi", label: "Kapanan", match: (d) => d.status === "kapandi" },
];

const subjectLink = (d: Dispute) =>
  d.kind === "fatura" ? href("invoices", { id: d.subjectId }) : d.kind === "sayac" ? href("meters", { id: d.subjectId }) : d.kind === "kacak" ? href("leaks", { id: d.subjectId }) : href("customers", { id: d.subjectId });

function DisputesTab({ params, go }: { params: PageProps["params"]; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canEdit = useCan("fatura");
  const disputes = useDisputes();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const viewId = DVIEWS.some((v) => v.id === params.g) ? params.g : "all";
  const view = DVIEWS.find((v) => v.id === viewId) ?? DVIEWS[0];
  const selected = params.id ? disputes.find((d) => d.id === params.id) : undefined;
  const set = (patch: Record<string, string | undefined>) => go("disputes", { ...params, id: undefined, ...patch });

  const rows = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    return disputes
      .filter((d) => view.match(d) && (!params.kind || d.kind === params.kind) && (!params.assigned || d.assignedTo === params.assigned))
      .filter((d) => !needle || `${d.id} ${customerName(d.customerId)} ${d.reason} ${d.subjectId}`.toLocaleLowerCase("tr-TR").includes(needle))
      .sort((a, b) => Number(b.status !== "kapandi") - Number(a.status !== "kapandi") || daysLeft(a) - daysLeft(b));
  }, [disputes, view, q, params.kind, params.assigned]);

  const assignees = [...new Set(disputes.map((d) => d.assignedTo))];
  const viewItems: SavedView[] = DVIEWS.map((v) => ({ id: v.id, label: v.label, count: disputes.filter(v.match).length, builtin: true }));
  const chips = [
    ...(params.kind ? [{ id: "kind", label: "Tür", value: DISPUTE_KIND_LABEL[params.kind as DisputeKind] ?? params.kind }] : []),
    ...(params.assigned ? [{ id: "assigned", label: "Atanan", value: params.assigned }] : []),
    ...(q.trim() ? [{ id: "q", label: "Arama", value: q.trim() }] : []),
  ];
  const groups: FilterGroup[] = [
    { id: "kind", label: "İtiraz Türü", options: (Object.keys(DISPUTE_KIND_LABEL) as DisputeKind[]).map((k) => ({ value: k, label: DISPUTE_KIND_LABEL[k] })) },
    { id: "assigned", label: "Atanan", options: assignees.map((a) => ({ value: a, label: a })) },
  ];
  const drawerValue: FilterValue = { kind: params.kind ? [params.kind] : [], assigned: params.assigned ? [params.assigned] : [] };
  const clear = () => {
    setQ("");
    go("disputes", { g: params.g });
  };

  const slaCell = (d: Dispute) =>
    d.status === "kapandi" ? (
      <span className="text-muted">Kapandı</span>
    ) : slaOver(d) ? (
      <Badge tone="danger">{Math.abs(daysLeft(d))} gün gecikti</Badge>
    ) : (
      <span className={daysLeft(d) <= 3 ? "font-medium text-warning" : "text-body"}>{daysLeft(d) === 0 ? "Bugün son gün" : `${daysLeft(d)} gün kaldı`}</span>
    );

  const columns: Column<Dispute>[] = [
    {
      key: "id",
      header: "İtiraz",
      width: "14rem",
      render: (d) => (
        <div className="min-w-0">
          <a data-row href={href("disputes", { ...params, id: d.id })} className="kz-mono block truncate font-medium text-strong hover:underline">
            {d.id}
          </a>
          <span className="block truncate text-small text-muted">{customerName(d.customerId)}</span>
        </div>
      ),
    },
    { key: "kind", header: "Tür", render: (d) => <Badge tone="neutral">{DISPUTE_KIND_LABEL[d.kind]}</Badge> },
    { key: "reason", header: "Gerekçe", render: (d) => <span className="block max-w-[20rem] truncate text-body" title={d.reason}>{d.reason}</span> },
    { key: "sla", header: "Yanıt Süresi", numeric: true, sortable: true, sortValue: (d) => daysLeft(d), render: slaCell },
    { key: "assigned", header: "Atanan", render: (d) => d.assignedTo },
    {
      key: "status",
      header: "Durum",
      render: (d) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={STATUS_TONE[d.status]}>{DISPUTE_STATUS_LABEL[d.status]}</Badge>
          {d.decision ? <Badge tone={d.decision === "red" ? "neutral" : "success"}>{d.decision === "kabul" ? "Kabul" : d.decision === "red" ? "Red" : "Kısmi kabul"}</Badge> : null}
        </div>
      ),
    },
  ];
  const items: RecordItem[] = rows.map((d) => ({
    id: d.id,
    title: `${d.id} · ${DISPUTE_KIND_LABEL[d.kind]}`,
    subtitle: customerName(d.customerId),
    value: d.status === "kapandi" ? "Kapandı" : slaOver(d) ? `${Math.abs(daysLeft(d))} gün gecikti` : `${daysLeft(d)} gün kaldı`,
    meta: d.reason,
    status: <Badge tone={STATUS_TONE[d.status]}>{DISPUTE_STATUS_LABEL[d.status]}</Badge>,
    href: href("disputes", { ...params, id: d.id }),
  }));

  return (
    <>
      <Panel
        title="İtiraz Listesi"
        note={viewId !== "all" || chips.length ? `${fmtNum(rows.length)} sonuç, ${fmtNum(disputes.length)} itiraz içinde` : "Yanıt süresi en kısa olan önce."}
        actions={canEdit ? <Button size="sm" variant="primary" onClick={() => setCreating(true)}><FilePlus2 /> Yeni İtiraz</Button> : undefined}
        id="itiraz-kuyruk"
      >
        <div className="space-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "İtiraz no, abone, gerekçe ya da konu", label: "İtiraz Ara" }}
            filters={chips}
            onRemoveFilter={(id) => (id === "q" ? setQ("") : set({ [id]: undefined }))}
            onClearFilters={clear}
            summary={chips.length ? `${fmtNum(rows.length)} itiraz` : undefined}
            views={{ items: viewItems, value: viewId, onChange: (id) => set({ g: id === "all" ? undefined : id }) }}
            drawer={{ groups, value: drawerValue, onChange: (v) => set({ kind: v.kind?.[0], assigned: v.assigned?.[0] }), resultCount: rows.length, resultLabel: (n) => `${fmtNum(n)} İtirazı Göster` }}
          />
        </div>
        <div className="max-md:hidden">
          <RowClickable>
            <DataTable<Dispute>
              caption="İtiraz listesi"
              columns={columns}
              rows={rows}
              rowKey={(d) => d.id}
              density="comfortable"
              on="surface"
              stickyFirst={false}
              minWidth="56rem"
              empty={<EmptyStateX title="Bu görünümde itiraz yok." hint="Başka bir görünüm seçin ya da yeni itiraz açın." action={<Button variant="secondary" size="sm" onClick={clear}>Süzgeçleri Temizle</Button>} />}
            />
          </RowClickable>
        </div>
        <div className="md:hidden">{items.length ? <RecordList label="İtiraz Listesi" items={items} /> : <EmptyStateX title="Bu görünümde itiraz yok." />}</div>
      </Panel>

      <DisputeSheet dispute={selected} onClose={() => go("disputes", { ...params, id: undefined })} />
      <NewDisputeDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(d) => {
          notify({ title: "İtiraz Kaydı Açıldı", body: `${d.id} · yanıt süresi ${dayLabel(d.dueAt)}`, tone: "success" });
          go("disputes", { id: d.id });
        }}
      />
    </>
  );
}

/* --- Ayrıntı ------------------------------------------------------------------ */

const FLOW = ["acik", "inceleme", "karar", "kapandi"] as const;
const FLOW_STEPS = [
  { label: "Alındı", description: "Kayıt açıldı" },
  { label: "İnceleme", description: "Belge ve veri" },
  { label: "Karar", description: "Kabul / red" },
  { label: "Kapandı", description: "Abone bilgilendirildi" },
];
const TEST_STEPS = [
  { label: "Talep", description: "Test istendi" },
  { label: "Randevu", description: "Ücret ve tarih" },
  { label: "Laboratuvar", description: "Doğruluk testi" },
  { label: "Sonuç", description: "Rapor ve karar" },
];

function DisputeSheet({ dispute: d, onClose }: { dispute: Dispute | undefined; onClose: () => void }) {
  const { notify } = useApp();
  const canEdit = useCan("fatura");
  const [deciding, setDeciding] = useState(false);
  if (!d) return <Sheet open={false} onOpenChange={onClose} title="İtiraz" />;
  const step = FLOW.indexOf(d.status);
  const closed = d.status === "kapandi";
  const invoice = d.kind === "fatura" ? allInvoices(getFinance()).find((i) => i.id === d.subjectId) : undefined;
  const meter = d.kind === "sayac" ? metersFor(d.customerId).find((m) => m.id === d.subjectId) : undefined;
  const blocksCut = !closed && d.kind === "fatura";

  return (
    <>
      <Sheet
        open
        onOpenChange={(o) => !o && onClose()}
        side="right"
        size="lg"
        title={`${d.id} · ${DISPUTE_KIND_LABEL[d.kind]}`}
        description={customerName(d.customerId)}
        status={<Badge tone={STATUS_TONE[d.status]}>{DISPUTE_STATUS_LABEL[d.status]}</Badge>}
        footer={
          closed ? (
            <Button variant="secondary" onClick={onClose}>Kapat</Button>
          ) : (
            <>
              {d.status === "acik" ? (
                <Button
                  variant="secondary"
                  disabled={!canEdit}
                  onClick={() => {
                    advanceDispute(d.id);
                    notify({ title: "İncelemeye Alındı", body: d.id, tone: "success" });
                  }}
                >
                  İncelemeye Al
                </Button>
              ) : null}
              {d.status === "inceleme" ? (
                <Button
                  variant="secondary"
                  disabled={!canEdit}
                  onClick={() => {
                    advanceDispute(d.id);
                    notify({ title: "Karara Hazır", body: d.id, tone: "success" });
                  }}
                >
                  Karara Hazırla
                </Button>
              ) : null}
              <Button variant="primary" disabled={!canEdit || d.status === "acik"} onClick={() => setDeciding(true)}>
                <Scale /> Karar Ver
              </Button>
            </>
          )
        }
      >
        <div className="grid gap-5">
          <Stepper steps={FLOW_STEPS} current={step} aria-label="İtiraz Süreci" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface p-4">
            <Fact label="Konu" value={<a className="kz-mono text-primary-ink hover:underline" href={subjectLink(d)}>{d.subjectId}</a>} />
            <Fact label="Abone" value={<a className="text-primary-ink hover:underline" href={href("customers", { id: d.customerId })}>{customerName(d.customerId)}</a>} />
            <Fact label="Açılış" value={dayLabel(d.openedAt)} />
            <Fact label="Yanıt Süresi" value={closed ? "Kapandı" : slaOver(d) ? `${Math.abs(daysLeft(d))} gün gecikti` : `${dayLabel(d.dueAt)} (${daysLeft(d)} gün)`} />
            <Fact label="Atanan" value={d.assignedTo} />
            <Fact label="Karar" value={d.decision ? (d.decision === "kabul" ? "Kabul" : d.decision === "red" ? "Red" : "Kısmi kabul") : "Henüz yok"} />
          </dl>
          <p className="rounded-xl bg-surface p-4 text-base text-body"><span className="block text-small font-medium text-muted">Abonenin gerekçesi</span>{d.reason}</p>

          {invoice ? (
            <Panel title="İtiraz Edilen Fatura" note={invoice.id} id="itiraz-fatura">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3 sm:p-5">
                <Fact label="Dönem" value={invoice.period} />
                <Fact label="Tutar" value={fmtTl(invoice.total)} />
                <Fact label="Tüketim" value={`${fmtNum(invoice.usageKwh)} kWh`} />
                <Fact label="Durum" value={invoice.cancelled ? "İptal edildi" : invoice.dispute ? "İtirazlı" : "Geçerli"} />
                <Fact label="Kalan" value={fmtTl(owed(invoice))} />
                <Fact label="Fatura" value={<a className="text-primary-ink hover:underline" href={href("invoices", { id: invoice.id })}>Faturayı aç</a>} />
              </dl>
            </Panel>
          ) : null}

          {d.kind === "sayac" ? (
            <Panel title="Sayaç Doğruluk Testi" note={meter ? meter.serial : d.subjectId} id="itiraz-test">
              <div className="grid gap-3 p-4 sm:p-5">
                <Stepper steps={TEST_STEPS} current={d.meterTest ? Math.min(step + 1, 3) : 0} aria-label="Sayaç Doğruluk Testi" />
                <InsightCallout title={d.meterTest ? "Doğruluk Testi İstendi" : "Test İstenmedi"} label="Bilgi" headingLevel={4}>
                  {d.meterTest ? "Söküm, laboratuvar testi ve sonuç raporu sonrası karar verilir. Sayaç doğruysa test ücreti aboneye yansır (örnek kural)." : "Abone test istemedi; saha kontrolüyle karar verilebilir."}
                </InsightCallout>
              </div>
            </Panel>
          ) : null}

          {blocksCut ? (
            <InsightCallout title="Kesme Engeli Aktif" kind="warning" label="Dikkat" icon={ShieldAlert} headingLevel={3}>
              Açık fatura itirazı olan abonenin enerjisi kesilmez; karar verilince engel kalkar.
            </InsightCallout>
          ) : null}
        </div>
      </Sheet>
      <DecisionDialog open={deciding} onClose={() => setDeciding(false)} dispute={d} onDone={() => setDeciding(false)} />
    </>
  );
}

const DECISION_TEMPLATES: Record<"kabul" | "red" | "kismi", readonly string[]> = {
  kabul: ["Okuma hatası saptandı, tüketim düzeltildi", "Sayaç testi sonucu sınır dışı", "Tutanakta usul eksikliği var"],
  red: ["Sayaç ve okuma doğru bulundu", "Test sonucu sayaç doğru", "İtiraz süresi geçti ya da belge yetersiz"],
  kismi: ["Tüketim kısmen düzeltildi", "Gecikme zammı silindi, anapara geçerli", "Taksitlendirme ile birlikte kısmi kabul"],
};

type Decision = "kabul" | "red" | "kismi";

/** Kararın sonuçları: seçenek kartının açıklaması olarak gösterilir. */
function decisionEffect(kind: DisputeKind, decision: Decision): string {
  if (kind === "fatura") {
    return decision === "red"
      ? "Fatura geçerli kalır, tahsilat sürer. Kesme engeli kalkar."
      : decision === "kismi"
        ? "Fatura iptal edilir, güncel okumayla düzeltme faturası kesilir. Gecikme zammı silinebilir."
        : "Fatura iptal edilir, güncel okumayla düzeltme faturası kesilir. Kesme engeli kalkar.";
  }
  if (kind === "sayac") {
    return decision === "red" ? "Sayaç doğru kabul edilir, test ücreti aboneye yansır (örnek kural)." : "Sayaç değişim iş emri önerilir, tüketim düzeltmesi için okuma yeniden değerlendirilir.";
  }
  return decision === "red" ? "Talep reddedilir, gerekçe aboneye bildirilir." : "Karar abone kartına ve denetim kaydına yazılır.";
}

/** Veriden türeyen öneri: fatura tüketimi aboneye özgü tipik tüketimle, sayaç durumu kayıtla karşılaştırılır. */
function recommendDecision(d: Dispute): { decision: Decision; why: string } | null {
  if (d.kind === "fatura") {
    const inv = allInvoices(getFinance()).find((i) => i.id === d.subjectId);
    const base = findCustomer(d.customerId)?.baseKwh;
    if (!inv || !base) return null;
    const ratio = inv.usageKwh / base;
    return ratio >= 1.5
      ? { decision: "kabul", why: `Faturadaki tüketim (${fmtNum(inv.usageKwh)} kWh), abonenin tipik aylık tüketiminin ${ratio.toFixed(1).replace(".", ",")} katı. Okumayı doğrulamadan geçerli saymak riskli.` }
      : { decision: "red", why: `Faturadaki tüketim (${fmtNum(inv.usageKwh)} kWh), abonenin tipik aylık tüketimiyle uyumlu (${ratio.toFixed(1).replace(".", ",")} kat). İtirazı destekleyen bir sapma yok.` };
  }
  if (d.kind === "sayac") {
    const m = metersFor(d.customerId).find((x) => x.id === d.subjectId);
    if (!m) return null;
    return m.status === "arizali" || m.status === "mudahale"
      ? { decision: "kabul", why: `Sayaç kaydında "${m.status === "arizali" ? "arızalı" : "müdahale şüphesi"}" durumu var; itiraz bu kayıtla örtüşüyor.` }
      : { decision: "red", why: "Sayaç kaydında arıza ya da müdahale işareti yok; itirazı destekleyen bir saha bulgusu görünmüyor." };
  }
  return null;
}

function DecisionDialog({ open, onClose, dispute: d, onDone }: { open: boolean; onClose: () => void; dispute: Dispute; onDone: () => void }) {
  const { notify } = useApp();
  const rec = useMemo(() => recommendDecision(d), [d]);
  const [decision, setDecision] = useState<Decision>(rec?.decision ?? "kabul");
  const [template, setTemplate] = useState<string>(DECISION_TEMPLATES[rec?.decision ?? "kabul"][0]);
  const [note, setNote] = useState("");
  const [inform, setInform] = useState(true);

  // Düzeltme önizlemesi: kabul ve kısmi kabulde kesilecek faturanın tutarı (motorun hesabıyla aynı).
  const preview = useMemo(() => {
    if (d.kind !== "fatura" || decision === "red") return null;
    const inv = allInvoices(getFinance()).find((i) => i.id === d.subjectId);
    const reading = inv ? effectiveReadings().find((r) => r.customerId === inv.customerId && r.period === inv.period) : undefined;
    if (!inv || !reading) return null;
    const next = buildDraft(reading).total;
    const split = (kurus: number) => fmtTl(kurus).split(/[.,]/);
    return { oldTotal: split(inv.total), newTotal: split(next), same: inv.total === next };
  }, [d, decision]);

  const label: Record<Decision, string> = { kabul: "Kabul", kismi: "Kısmi Kabul", red: "Red" };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="İtiraz Kararı"
      description={`${d.id} · ${customerName(d.customerId)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              decideDispute(d.id, decision);
              if (d.kind === "fatura" && decision !== "red") {
                cancelInvoice(d.subjectId, true);
                const correction = issueCorrection(d.subjectId);
                if (correction) notify({ title: "Düzeltme Faturası Kesildi", body: `${correction.id} · ${fmtTl(correction.total)}`, tone: "success" });
              }
              audit("İtiraz gerekçesini kaydetti", d.id, undefined, `${template}${note.trim() ? `. ${note.trim()}` : ""}${inform ? " · Abone bilgilendirilecek" : ""}`);
              notify({ title: decision === "kabul" ? "İtiraz Kabul Edildi" : decision === "red" ? "İtiraz Reddedildi" : "İtiraz Kısmen Kabul Edildi", body: inform ? `${d.id} · abone bilgilendirilecek` : d.id, tone: "success" });
              onDone();
            }}
          >
            Kararı Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {rec ? (
          <InsightCallout title={`Önerilen Karar: ${label[rec.decision]}`} label="Öneri" headingLevel={3}>
            {rec.why}
          </InsightCallout>
        ) : null}
        <OptionCards
          legend="Karar"
          value={decision}
          onValueChange={(v) => {
            const next = v as Decision;
            setDecision(next);
            setTemplate(DECISION_TEMPLATES[next][0]);
          }}
          options={(["kabul", "kismi", "red"] as const).map((v) => ({
            value: v,
            title: label[v],
            description: decisionEffect(d.kind, v),
            badge: rec?.decision === v ? "Önerilen" : undefined,
          }))}
        />
        {preview ? (
          preview.same ? (
            <p className="rounded-xl bg-surface px-4 py-3 text-base text-body">Güncel okumayla hesaplanan düzeltme faturası, mevcut tutarla aynı çıkıyor.</p>
          ) : (
            <ValueDiff
              rows={[
                { label: "Eski Fatura Toplamı", groups: preview.oldTotal, tone: "bad", note: `${d.subjectId} iptal edilir` },
                { label: "Düzeltilmiş Toplam", groups: preview.newTotal, tone: "good", note: "Güncel okumayla yeniden hesaplanır" },
              ]}
            />
          )
        ) : null}
        <Select label="Gerekçe Şablonu" value={template} onValueChange={(v) => v && setTemplate(v)} items={DECISION_TEMPLATES[decision].map((t) => ({ value: t, label: t }))} />
        <Textarea label="Ek Not (İsteğe Bağlı)" value={note} onChange={(e) => setNote(e.target.value)} minRows={2} />
        <Switch label="Aboneyi Bilgilendir" hint="Karar ve gerekçe SMS ile abonenin kayıtlı telefonuna gönderilir." checked={inform} onChange={(e) => setInform(e.target.checked)} />
      </div>
    </Dialog>
  );
}

function NewDisputeDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (d: Dispute) => void }) {
  const [kind, setKind] = useState<DisputeKind>("fatura");
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [test, setTest] = useState(false);
  const [touched, setTouched] = useState(false);
  const customer = findCustomer(customerId.trim().toUpperCase());
  const invoices = customer ? allInvoices(getFinance()).filter((i) => i.customerId === customer.id && !i.cancelled).slice(0, 12) : [];
  const meters = customer ? metersFor(customer.id) : [];
  const subjectOptions =
    kind === "fatura" ? invoices.map((i) => ({ value: i.id, label: `${i.id} · ${i.period} · ${fmtTl(i.total)}` })) : kind === "sayac" ? meters.map((m) => ({ value: m.id, label: `${m.serial} (${m.id})` })) : [];
  const subjectId = subjectOptions.length ? (subjectOptions.some((o) => o.value === subject) ? subject : subjectOptions[0].value) : subject.trim();
  const errors = {
    customer: customer ? undefined : "Abone numarası bulunamadı (örn. C-10001).",
    subject: subjectId ? undefined : "İtiraz konusunu seçin ya da yazın.",
    reason: reason.trim().length < 6 ? "Gerekçeyi en az 6 karakterle yazın." : undefined,
  };
  const bad = Object.values(errors).some(Boolean);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Yeni İtiraz"
      description="Kayıt açılır; yanıt süresi 15 gün sayılır (örnek parametre)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (bad || !customer) return;
              if (kind === "fatura") fileDispute(subjectId, reason.trim(), "");
              const d = createDispute({ kind, subjectId, customerId: customer.id, reason: reason.trim(), meterTest: kind === "sayac" && test });
              setReason("");
              setSubject("");
              setCustomerId("");
              setTouched(false);
              onClose();
              onCreated(d);
            }}
          >
            İtirazı Aç
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="İtiraz Türü" value={kind} onValueChange={(v) => v && setKind(v as DisputeKind)} items={(Object.keys(DISPUTE_KIND_LABEL) as DisputeKind[]).map((k) => ({ value: k, label: DISPUTE_KIND_LABEL[k] }))} />
        <Input label="Abone No" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="C-10001" error={touched ? errors.customer : undefined} hint={customer ? `${customer.name} · ${customer.district}` : undefined} data-autofocus />
        {subjectOptions.length ? (
          <Select label={kind === "fatura" ? "Fatura" : "Sayaç"} value={subjectId} onValueChange={(v) => v && setSubject(v)} items={subjectOptions} />
        ) : (
          <Input label={kind === "kacak" ? "Tutanak ya da Vaka No" : "Konu Kaydı"} value={subject} onChange={(e) => setSubject(e.target.value)} error={touched ? errors.subject : undefined} />
        )}
        <Textarea label="Gerekçe" value={reason} onChange={(e) => setReason(e.target.value)} minRows={3} error={touched ? errors.reason : undefined} />
        {kind === "sayac" ? <Checkbox label="Sayaç Doğruluk Testi Talep Ediliyor" checked={test} onChange={(e) => setTest(e.target.checked)} /> : null}
      </div>
    </Dialog>
  );
}

/* ====================================================================== *
 *  ALACAK VE MAHSUP
 * ====================================================================== */

const CREDIT_STATUS: Record<Credit["status"], { label: string; tone: "warning" | "success" | "neutral" }> = { acik: { label: "Açık", tone: "warning" }, mahsup: { label: "Mahsup Edildi", tone: "success" }, iade: { label: "İade Edildi", tone: "neutral" } };

function CreditsTab({ credits }: { credits: readonly Credit[] }) {
  const { notify } = useApp();
  const canPay = useCan("odeme");
  const [source, setSource] = useState("");
  const [settling, setSettling] = useState<Credit | null>(null);
  const [refunding, setRefunding] = useState<Credit | null>(null);
  const [creating, setCreating] = useState(false);
  const rows = credits.filter((c) => !source || c.source === source).sort((a, b) => Number(b.status === "acik") - Number(a.status === "acik") || (a.createdAt < b.createdAt ? 1 : -1));

  const columns: Column<Credit>[] = [
    { key: "id", header: "Alacak", width: "12rem", render: (c) => <div className="min-w-0"><span className="kz-mono block font-medium text-strong">{c.id}</span><a className="block truncate text-small text-primary-ink hover:underline" href={href("customers", { id: c.customerId })}>{customerName(c.customerId)}</a></div> },
    { key: "source", header: "Kaynak", render: (c) => CREDIT_SOURCE_LABEL[c.source] },
    { key: "amount", header: "Tutar", numeric: true, sortable: true, sortValue: (c) => c.amount, render: (c) => <span className="font-medium text-strong">{fmtTl(c.amount)}</span> },
    { key: "date", header: "Tarih", render: (c) => dayLabel(c.createdAt) },
    { key: "status", header: "Durum", render: (c) => <div className="flex flex-col items-start gap-1"><Badge tone={CREDIT_STATUS[c.status].tone}>{CREDIT_STATUS[c.status].label}</Badge>{c.note ? <span className="kz-mono text-small text-muted">{c.note}</span> : null}</div> },
    {
      key: "actions",
      header: <span className="sr-only">İşlemler</span>,
      width: "13rem",
      render: (c) =>
        c.status === "acik" ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button size="sm" variant="secondary" disabled={!canPay} onClick={() => setSettling(c)}>Mahsup Et</Button>
            <Button size="sm" variant="ghost" disabled={!canPay} onClick={() => setRefunding(c)}>İade</Button>
          </div>
        ) : null,
    },
  ];
  const items: RecordItem[] = rows.map((c) => ({
    id: c.id,
    title: `${c.id} · ${CREDIT_SOURCE_LABEL[c.source]}`,
    subtitle: customerName(c.customerId),
    value: fmtTl(c.amount),
    meta: dayLabel(c.createdAt),
    status: <Badge tone={CREDIT_STATUS[c.status].tone}>{CREDIT_STATUS[c.status].label}</Badge>,
    actions: c.status === "acik" && canPay ? <span className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => setSettling(c)}>Mahsup</Button><Button size="sm" variant="ghost" onClick={() => setRefunding(c)}>İade</Button></span> : undefined,
  }));

  return (
    <>
      <Panel
        title="Alacaklar"
        note="Fazla ödeme, çift ödeme, iptal faturası ve abonelik kapanışından doğan alacaklar. Güvence bedeli iadesi kapanış alacağıdır."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { csv("alacaklar.csv", ["Alacak No", "Abone", "Kaynak", "Tutar (TL)", "Tarih", "Durum"], rows.map((c) => [c.id, customerName(c.customerId), CREDIT_SOURCE_LABEL[c.source], (c.amount / 100).toFixed(2), c.createdAt, CREDIT_STATUS[c.status].label])); audit("Alacak listesini muhasebeye aktardı", `${rows.length} kayıt`, undefined, "CSV"); notify({ title: "Muhasebe Dosyası İndirildi", body: `${rows.length} alacak`, tone: "success" }); }}>
              <Download /> Muhasebe CSV
            </Button>
            {canPay ? <Button size="sm" variant="primary" onClick={() => setCreating(true)}><FilePlus2 /> Alacak Aç</Button> : null}
          </div>
        }
        id="alacak-liste"
      >
        <div className="border-b border-line-soft px-4 py-3 sm:px-5">
          <Select label="Kaynak" value={source || "all"} onValueChange={(v) => setSource(v && v !== "all" ? v : "")} items={[{ value: "all", label: "Hepsi" }, ...(Object.keys(CREDIT_SOURCE_LABEL) as CreditSource[]).map((s) => ({ value: s, label: CREDIT_SOURCE_LABEL[s] }))]} />
        </div>
        <div className="max-md:hidden">
          <DataTable<Credit> caption="Alacak listesi" columns={columns} rows={rows} rowKey={(c) => c.id} density="comfortable" on="surface" stickyFirst={false} minWidth="52rem" empty={<EmptyStateX title="Bu kaynakta alacak yok." />} />
        </div>
        <div className="md:hidden">{items.length ? <RecordList label="Alacak Listesi" items={items} /> : <EmptyStateX title="Bu kaynakta alacak yok." />}</div>
      </Panel>

      <LateInterestPanel />

      <SettleDialog credit={settling} onClose={() => setSettling(null)} />
      <RefundDialog credit={refunding} onClose={() => setRefunding(null)} />
      <NewCreditDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function SettleDialog({ credit: c, onClose }: { credit: Credit | null; onClose: () => void }) {
  const { notify } = useApp();
  const [pick, setPick] = useState("");
  if (!c) return <Dialog open={false} onOpenChange={onClose} title="Mahsup" footer={null}>{null}</Dialog>;
  const candidates = allInvoices(getFinance()).filter((i) => i.customerId === c.customerId && !i.cancelled && i.total - i.paid > 0);
  const fits = candidates.filter((i) => i.total - i.paid >= c.amount);
  const chosen = fits.find((i) => i.id === pick) ?? fits[0];
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Alacağı Mahsup Et"
      description={`${c.id} · ${customerName(c.customerId)} · ${fmtTl(c.amount)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              applyCredit(c.id, chosen.id);
              notify({ title: "Alacak Mahsup Edildi", body: `${c.id} → ${chosen.id}`, tone: "success" });
              onClose();
            }}
          >
            Mahsup Et
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {fits.length ? (
          <>
            <Select label="Mahsup Edilecek Fatura" value={chosen?.id ?? ""} onValueChange={(v) => v && setPick(v)} items={fits.map((i) => ({ value: i.id, label: `${i.id} · ${i.period} · kalan ${fmtTl(i.total - i.paid)}` }))} />
            {chosen ? (
              <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface p-4">
                <Fact label="Faturanın Kalanı" value={fmtTl(chosen.total - chosen.paid)} />
                <Fact label="Mahsuptan Sonra" value={fmtTl(chosen.total - chosen.paid - c.amount)} />
              </dl>
            ) : null}
            <p className="text-small text-muted">Mahsup, faturaya "MAHSUP" referanslı tahsilat olarak yazılır; vadesi geçmişse gecikme zammı da buna dahildir.</p>
          </>
        ) : (
          <p role="note" className="rounded-xl bg-warning-wash p-4 text-base text-body ring-1 ring-warning/20">
            {candidates.length ? "Alacak tutarı, açık faturaların hiçbirinin kalanına sığmıyor." : "Bu abonenin açık faturası yok."} İade önerilir.
          </p>
        )}
      </div>
    </Dialog>
  );
}

function RefundDialog({ credit: c, onClose }: { credit: Credit | null; onClose: () => void }) {
  const { notify } = useApp();
  const [iban, setIban] = useState("");
  const [touched, setTouched] = useState(false);
  if (!c) return <Dialog open={false} onOpenChange={onClose} title="İade" footer={null}>{null}</Dialog>;
  const error = validIban(iban) ? undefined : "IBAN geçersiz (TR ile başlayan 26 hane, sağlama tutmuyor).";
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={c.source === "kapanis" ? "Güvence Bedeli İadesi" : "Alacak İadesi"}
      description={`${c.id} · ${customerName(c.customerId)} · ${fmtTl(c.amount)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (error) return;
              refundCredit(c.id);
              audit("İade talimatı verdi", c.id, undefined, `IBAN ${iban.replace(/\s/g, "").slice(0, 4)} •••• ${iban.replace(/\s/g, "").slice(-4)}`);
              notify({ title: "İade Talimatı Verildi", body: `${c.id} · ${fmtTl(c.amount)}`, tone: "success" });
              setIban("");
              setTouched(false);
              onClose();
            }}
          >
            <Banknote /> İadeyi Onayla
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Input label="Abonenin IBAN'ı" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" error={touched ? error : undefined} hint="Talimat muhasebeye iletilir; ödeme banka gününde yapılır." data-autofocus />
      </div>
    </Dialog>
  );
}

function NewCreditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notify } = useApp();
  const [customerId, setCustomerId] = useState("");
  const [source, setSource] = useState<CreditSource>("fazla-odeme");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const customer = findCustomer(customerId.trim().toUpperCase());
  const value = Math.round(Number(amount.replace(",", ".")) * 100);
  const errors = { customer: customer ? undefined : "Abone numarası bulunamadı.", amount: value > 0 ? undefined : "Tutar sıfırdan büyük olmalı." };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Alacak Kaydı Aç"
      description="Aboneye borçlu olunan tutarı kaydeder."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (!customer || !(value > 0)) return;
              const c = createCredit(customer.id, source, value);
              notify({ title: "Alacak Kaydı Açıldı", body: `${c.id} · ${fmtTl(c.amount)}`, tone: "success" });
              setCustomerId("");
              setAmount("");
              setTouched(false);
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input label="Abone No" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="C-10001" error={touched ? errors.customer : undefined} hint={customer?.name} data-autofocus />
        <Select label="Kaynak" value={source} onValueChange={(v) => v && setSource(v as CreditSource)} items={(Object.keys(CREDIT_SOURCE_LABEL) as CreditSource[]).map((s) => ({ value: s, label: CREDIT_SOURCE_LABEL[s] }))} />
        <Input label="Tutar" suffix="TL" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={touched ? errors.amount : undefined} />
      </div>
    </Dialog>
  );
}

/* --- Gecikme zammı hesap dökümü --------------------------------------------- */

function LateInterestPanel() {
  const rates = DEFAULT_LATE_RATES; // hesap çekirdeğinin kullandığı örnek oran tablosu
  const overdue = allInvoices(getFinance()).filter((i) => !i.cancelled && i.status !== "odendi" && i.due < TODAY_KEY && i.total - i.paid > 0);
  const [pick, setPick] = useState("");
  const [daily, setDaily] = useState(false);
  const inv = overdue.find((i) => i.id === pick) ?? overdue[0];
  const principal = inv ? inv.total - inv.paid : 0;
  const days = inv ? Math.max(0, dayDiff(inv.due, TODAY_KEY)) : 0;
  const total = inv ? lateInterest(principal, inv.due, TODAY_KEY, rates) : 0;

  // Oran dönemlerine göre döküm (gün başı = anapara × o günkü aylık oran / 30)
  const segments = useMemo(() => {
    if (!inv) return [] as { from: string; to: string; days: number; pct: number; amount: number }[];
    const sorted = [...rates].sort((a, b) => (a.from < b.from ? -1 : 1));
    const out: { from: string; to: string; days: number; pct: number; amount: number }[] = [];
    for (let i = 1; i <= days; i++) {
      const key = dayKey(addDays(parseDay(inv.due), i));
      let pct = sorted[0]?.monthlyPct ?? 0;
      for (const r of sorted) if (r.from <= key) pct = r.monthlyPct;
      const day = (principal * pct) / 100 / 30;
      const last = out[out.length - 1];
      if (last && last.pct === pct) {
        last.to = key;
        last.days += 1;
        last.amount += day;
      } else out.push({ from: key, to: key, days: 1, pct, amount: day });
    }
    return out;
  }, [inv, days, principal, rates]);
  const dailyRows = useMemo(() => {
    if (!inv || !daily) return [];
    return Array.from({ length: Math.min(days, 90) }, (_, i) => {
      const key = dayKey(addDays(parseDay(inv.due), i + 1));
      const pct = [...rates].sort((a, b) => (a.from < b.from ? -1 : 1)).filter((r) => r.from <= key).at(-1)?.monthlyPct ?? 0;
      return { key, pct, amount: (principal * pct) / 100 / 30 };
    });
  }, [inv, daily, days, principal, rates]);

  return (
    <Panel title="Gecikme Zammı Hesap Dökümü" note="Vadeden bugüne gecikmiş anapara × gün × o günkü aylık oran ÷ 30 (ÖRNEK oran tablosu)" id="alacak-zam">
      <div className="grid gap-4 p-4 sm:p-5">
        {overdue.length === 0 ? (
          <EmptyStateX title="Vadesi geçmiş açık fatura yok." hint="Gecikme zammı dökümü vadesi geçen faturalar için gösterilir." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Select label="Fatura" value={inv?.id ?? ""} onValueChange={(v) => v && setPick(v)} items={overdue.slice(0, 40).map((i) => ({ value: i.id, label: `${i.id} · ${customerName(i.customerId)} · ${fmtTl(i.total - i.paid, 0)}` }))} />
              <Button variant="secondary" onClick={() => setDaily((v) => !v)} aria-pressed={daily}><Search /> {daily ? "Günlük Dökümü Gizle" : "Günlük Döküm"}</Button>
            </div>
            {inv ? (
              <>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface p-4 sm:grid-cols-4">
                  <Fact label="Gecikmiş Anapara" value={fmtTl(principal)} />
                  <Fact label="Vade" value={dayLabel(inv.due)} />
                  <Fact label="Gecikme" value={`${fmtNum(days)} gün`} />
                  <Fact label="Gecikme Zammı" value={fmtTl(total)} />
                </dl>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-base">
                    <caption className="sr-only">Oran dönemlerine göre gecikme zammı</caption>
                    <thead>
                      <tr className="border-b border-line-soft text-small text-muted">
                        <th scope="col" className="px-2 py-2 font-medium">Dönem</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Gün</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Aylık Oran</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {segments.map((s) => (
                        <tr key={s.from}>
                          <th scope="row" className="px-2 py-2.5 font-medium text-strong">{dayLabel(s.from)} – {dayLabel(s.to)}</th>
                          <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(s.days)}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums">%{String(s.pct).replace(".", ",")}</td>
                          <td className="kz-mono px-2 py-2.5 text-right">{fmtTl(Math.round(s.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line text-strong">
                        <th scope="row" colSpan={3} className="px-2 py-2.5 text-right font-semibold">Toplam (Hesap Çekirdeği)</th>
                        <td className="kz-mono px-2 py-2.5 text-right font-semibold">{fmtTl(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {daily ? (
                  <div className="max-h-72 overflow-auto rounded-xl bg-surface">
                    <table className="w-full text-left text-base">
                      <caption className="sr-only">Günlük gecikme zammı (ilk {dailyRows.length} gün)</caption>
                      <thead className="sticky top-0 bg-surface text-small text-muted">
                        <tr>
                          <th scope="col" className="px-3 py-2 font-medium">Gün</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Aylık Oran</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Günlük Zam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-soft">
                        {dailyRows.map((r) => (
                          <tr key={r.key}>
                            <th scope="row" className="px-3 py-1.5 font-medium text-strong">{dayLabel(r.key)}</th>
                            <td className="px-3 py-1.5 text-right tabular-nums">%{String(r.pct).replace(".", ",")}</td>
                            <td className="kz-mono px-3 py-1.5 text-right">{fmtTl(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <p className="text-small text-muted">Parça tutarların toplamı yuvarlama nedeniyle toplam satırdan en çok birkaç kuruş sapabilir; geçerli tutar hesap çekirdeğindeki toplamdır.</p>
              </>
            ) : null}
          </>
        )}
      </div>
    </Panel>
  );
}

