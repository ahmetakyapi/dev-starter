"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Power,
  PowerOff,
  Receipt,
  Repeat,
  ShieldCheck,
  StickyNote,
  Tag,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-sheet";
import { FactorList } from "@/components/ui/factor-list";
import { HoldButton } from "@/components/ui/hold-button";
import { PolicyChecks, type PolicyCheck } from "@/components/ui/policy-checks";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import type { SavedView } from "@/components/ui/saved-views";
import { Select } from "@/components/ui/select";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TickMeter } from "@/components/ui/tick-meter";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { useDerived } from "./_core";
import { audit, useAuditLog } from "./_audit";
import { cutEligibility } from "./_cutpolicy";
import {
  COMM_LABEL,
  FLAG_LABEL,
  KINDS,
  KIND_LABEL,
  PAYMENT_PLANS,
  PERIODS_12,
  REGIONS,
  SOURCE_LABEL,
  SUPPLIERS,
  dayKey,
  dayLabel,
  fullDate,
  invoicesOf,
  kwh,
  monthShort,
  num,
  parseDay,
  paymentsOf,
  readingsForCustomer,
  region,
  supplier,
  tl,
  CHANNEL_LABEL,
  type Customer,
} from "./_data";
import { CONSENT_LABEL, DATA_REQUEST_LABEL, type ConsentKind } from "./_data-yeni";
import {
  TAGS,
  accountOf,
  addHistory,
  addNote,
  allCustomers,
  contractOf,
  filterCustomers,
  historyOf,
  isAdded,
  findCustomer,
  metersFor,
  notesOf,
  patchCustomer,
  patchOf,
  riskReason,
  validEmail,
  validPhone,
  useCustomerStore,
  type ListQuery,
} from "./_data-musteri";
import { BUILTIN_VIEWS, FILTER_KEYS, activeViewId, deleteCustomerView, saveCustomerView, useSavedCustomerViews } from "./_data-musteri2";
import { EmptyStateX, FilterBar, Metric, PageHero, fmtNum, fmtPct, fmtTl, useListKeys } from "./_kit";
import { useCan } from "./_permissions";
import { riskyCustomers } from "./_selectors";
import {
  advanceWorkOrder,
  cancelWorkOrder,
  createDataRequest,
  createWorkOrder,
  requestCut,
  requestReconnect,
  revealMasked,
  sendNotice,
  setConsent,
  useConsents,
  useDataRequests,
  useWorkOrders,
  WORK_FLOW,
  WORK_STATUS_LABEL,
  type WorkOrderX,
} from "./_store";
import { InvoiceBadge, CustomerBadge, MeterBadge, MetricStrip, PageBody, PageHead, Panel, ReadingBadge, href, useApp, type PageProps, type Params } from "./_ui";

const PAGE_SIZE = 20;

/** Liste adresi: mevcut süzgeçleri korur, verilenleri değiştirir, boşları atar. */
const listHref = (params: Params, patch: Record<string, string | undefined>) => href("customers", { ...params, id: undefined, ...patch });

export function MusterilerPage({ params, go }: PageProps) {
  useCustomerStore();
  const id = params.id;
  const detail = id ? findCustomer(id) : undefined;
  if (id) {
    return detail ? <MusteriDetay customer={detail} go={go} /> : <Bulunamadi id={id} />;
  }
  return <MusteriListesi params={params} go={go} />;
}

function Bulunamadi({ id }: { id: string }) {
  return (
    <>
      <PageHead title="Aboneler" description="Abone kayıtları, tesisat ve sözleşme bilgileri." />
      <PageBody>
        <EmptyState
          icon={<Users />}
          title={`${id} numaralı abone bulunamadı`}
          hint="Numara yanlış olabilir ya da kayıt arşive alınmıştır."
          action={
            <a className={buttonClass({ variant: "secondary" })} href={href("customers")}>
              Abone Listesine Dön
            </a>
          }
        />
      </PageBody>
    </>
  );
}

/* ====================================================================== *
 *  LİSTE
 * ====================================================================== */

/** Satırın tamamı tıklanır: tablo hücresi içindeki adı bağlantısını (`data-row`) tetikler; asıl bağlantı klavye için durur. */
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

const STATUS_LABEL: Record<string, string> = { riskli: "Riskli", serbest: "Serbest tüketici", gorevli: "Görevli tedarik", kesik: "Enerjisi kesik" };
const VOLT_LABEL: Record<string, string> = { AG: "Alçak gerilim", OG: "Orta gerilim" };

function MusteriListesi({ params, go }: { params: Params; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canEdit = useCan("musteri");
  const savedViews = useSavedCustomerViews();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<"sms" | "tag" | null>(null);
  const [q, setQ] = useState(params.q ?? "");

  // Arama yazıldıkça listeyi hemen süzer; adrese kısa bir gecikmeyle yazılır (geri tuşu şişmesin).
  useEffect(() => {
    if ((params.q ?? "") === q.trim()) return;
    const t = window.setTimeout(() => go("customers", { ...params, id: undefined, page: undefined, q: q.trim() || undefined }), 350);
    return () => window.clearTimeout(t);
  }, [q, params, go]);

  const all = allCustomers();
  const hasSort = Boolean(params.sort);
  const query: ListQuery = {
    q,
    status: params.status ?? "",
    kind: params.kind ?? "",
    volt: params.volt ?? "",
    region: params.region ?? "",
    supplier: params.supplier ?? "",
    tag: params.tag ?? "",
    sort: params.sort ?? "risk",
    dir: hasSort ? (params.dir === "desc" ? "desc" : "asc") : "desc",
  };
  const rows = useMemo(() => filterCustomers(all, query), [all, query.q, query.status, query.kind, query.volt, query.region, query.supplier, query.tag, query.sort, query.dir]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useDerived(() => {
    const cs = allCustomers();
    const sensitive = cs.filter((c) => (c.tags ?? []).some((t) => t.startsWith("Hassas"))).length;
    return {
      total: cs.length,
      free: cs.filter((c) => c.free).length,
      risky: riskyCustomers().length,
      cut: cs.filter((c) => c.status === "kesik").length,
      autoPay: cs.filter((c) => c.autoPay).length,
      healthy: cs.filter((c) => metersFor(c.id).every((m) => m.status === "okunuyor")).length,
      sensitive,
      kinds: KINDS.map((k) => `${KIND_LABEL[k]} ${fmtNum(cs.filter((c) => c.kind === k).length)}`).join(" · "),
    };
  });

  const filterParams = Object.fromEntries(FILTER_KEYS.flatMap((k) => (params[k] ? [[k, params[k]]] : []))) as Record<string, string>;
  const set = (patch: Record<string, string | undefined>) => go("customers", { ...params, id: undefined, page: undefined, ...patch });

  // Görünümler: sabit olanlar + kullanıcının kaydettikleri
  const allViews = [...BUILTIN_VIEWS, ...savedViews];
  const viewId = activeViewId({ ...params, q: q.trim() }, allViews);
  const viewItems: SavedView[] = allViews.map((v) => ({
    id: v.id,
    label: v.label,
    builtin: v.builtin,
    count: filterCustomers(all, { q: "", status: "", kind: "", volt: "", region: "", supplier: "", tag: "", sort: "id", dir: "asc", ...v.params }).length,
  }));

  const chips = [
    ...(params.status ? [{ id: "status", label: "Grup", value: STATUS_LABEL[params.status] ?? params.status }] : []),
    ...(params.kind ? [{ id: "kind", label: "Tür", value: KIND_LABEL[params.kind as keyof typeof KIND_LABEL] ?? params.kind }] : []),
    ...(params.volt ? [{ id: "volt", label: "Gerilim", value: VOLT_LABEL[params.volt] ?? params.volt }] : []),
    ...(params.region ? [{ id: "region", label: "Bölge", value: REGIONS.find((r) => r.id === params.region)?.name ?? params.region }] : []),
    ...(params.supplier ? [{ id: "supplier", label: "Tedarikçi", value: SUPPLIERS.find((s) => s.id === params.supplier)?.name ?? params.supplier }] : []),
    ...(params.tag ? [{ id: "tag", label: "Etiket", value: params.tag }] : []),
    ...(q.trim() ? [{ id: "q", label: "Arama", value: q.trim() }] : []),
  ];

  const groups: FilterGroup[] = [
    { id: "kind", label: "Tür", options: KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] })) },
    { id: "volt", label: "Gerilim", options: [{ value: "AG", label: "Alçak Gerilim (AG)" }, { value: "OG", label: "Orta Gerilim (OG)" }] },
    { id: "region", label: "Bölge", options: REGIONS.map((r) => ({ value: r.id, label: r.name })) },
    { id: "supplier", label: "Tedarikçi", options: SUPPLIERS.map((s) => ({ value: s.id, label: s.name })) },
    { id: "tag", label: "Etiket", options: TAGS.map((t) => ({ value: t, label: t })) },
  ];
  const drawerValue: FilterValue = { kind: params.kind ? [params.kind] : [], volt: params.volt ? [params.volt] : [], region: params.region ? [params.region] : [], supplier: params.supplier ? [params.supplier] : [], tag: params.tag ? [params.tag] : [] };

  const clearFilters = () => {
    setQ("");
    go("customers", { sort: params.sort, dir: params.dir });
  };

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const pageAllSelected = pageRows.length > 0 && pageRows.every((c) => selected.has(c.id));
  const chosen = all.filter((c) => selected.has(c.id));

  function exportCsv() {
    const head = ["Abone No", "Ad", "Tür", "Gerilim", "Bölge", "Tedarikçi", "Aylık Ort. kWh", "Açık Bakiye (TL)", "Durum"];
    const lines = chosen.map((c) =>
      [c.id, `"${c.name}"`, KIND_LABEL[c.kind], c.voltage, region(c.regionId).name, `"${supplier(c.supplierId).name}"`, c.baseKwh, (accountOf(c.id).balance / 100).toFixed(2), c.status].join(";"),
    );
    const blob = new Blob(["﻿", [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "musteri-listesi.csv";
    a.click();
    URL.revokeObjectURL(url);
    audit("Abone listesini dışa aktardı", `${chosen.length} abone`, undefined, "CSV (kimlik ve iletişim alanları olmadan)");
    notify({ title: "Liste İndirildi", body: `${chosen.length} abone, KVKK gereği kimlik ve iletişim alanları olmadan.`, tone: "success" });
  }

  const columns: Column<Customer>[] = [
    {
      key: "risk",
      header: <span className="sr-only">Risk</span>,
      width: "1rem",
      render: (c) => {
        const reason = riskReason(c);
        return (
          <>
            <span aria-hidden className={`block h-10 w-1 rounded-full ${reason ? (reason.startsWith("Sayaç") ? "bg-warning" : "bg-danger") : "bg-line"}`} />
            <span className="sr-only">{reason ?? "Risk işareti yok"}</span>
          </>
        );
      },
    },
    {
      key: "select",
      width: "3rem",
      header: (
        <Checkbox
          aria-label="Bu Sayfadaki Bütün Aboneleri Seç"
          checked={pageAllSelected}
          onChange={(e) =>
            setSelected((prev) => {
              const next = new Set(prev);
              for (const c of pageRows) (e.target.checked ? next.add(c.id) : next.delete(c.id));
              return next;
            })
          }
        />
      ),
      render: (c) => <Checkbox aria-label={`${c.name} aboneliğini seç`} checked={selected.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} />,
    },
    {
      key: "name",
      header: "Abone",
      sortable: true,
      sortValue: (c) => c.name,
      width: "17rem",
      render: (c) => (
        <div className="min-w-0">
          <a data-row href={href("customers", { id: c.id })} className="block truncate font-medium text-strong hover:underline">
            {c.name}
          </a>
          {/* Abone no kırpılıp "C-1…" kalıyordu; ayrıntıda ve aramada var. */}
          <span className="sr-only">{c.id}</span>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Tür",
      render: (c) => (
        <div>
          <span className="block whitespace-nowrap text-body">{KIND_LABEL[c.kind]}</span>
          <span className="text-small text-muted" title={c.voltage === "OG" ? "Orta gerilim" : "Alçak gerilim"}>{c.voltage}</span>
        </div>
      ),
    },
    { key: "region", width: "11.5rem", header: "Bölge", sortable: true, sortValue: (c) => c.regionId, render: (c) => (
        <div>
          <span className="text-body">{region(c.regionId).name}</span>
          <span className="text-small text-muted">{c.district}</span>
        </div>
      ) },
    {
      key: "supplier",
      width: "13rem",
      header: "Tedarikçi",
      render: (c) => (
        <div className="min-w-0">
          <span className="text-body">{supplier(c.supplierId).name}</span>
          <span className="sr-only">{c.free ? ", serbest tüketici" : ", görevli tedarik"}</span>
        </div>
      ),
    },
    { key: "usage", header: "Aylık Ort.", numeric: true, sortable: true, sortValue: (c) => c.baseKwh, render: (c) => kwh(c.baseKwh) },
    {
      key: "balance",
      header: "Açık Bakiye",
      numeric: true,
      sortable: true,
      sortValue: (c) => accountOf(c.id).balance,
      render: (c) => {
        const a = accountOf(c.id);
        return a.balance > 0 ? <span className={a.overdue ? "font-medium text-danger" : "text-body"}>{tl(a.balance)}</span> : <span className="text-muted">—</span>;
      },
    },
    {
      key: "status",
      header: "Durum",
      render: (c) => {
        const reason = riskReason(c);
        if (!reason || c.status !== "aktif") return <CustomerBadge status={c.status} />;
        // Gerekçe rozetin İÇİNDE: "Riskli" + kesilen gerekçe metni yerine tek, okunur rozet
        // ("6 Gecikme", "Sayaç Arızalı"). Tam cümle title ve ekran okuyucuda.
        const short = reason.startsWith("Sayaçta") ? "Müdahale Şüphesi" : reason.startsWith("Sayaç") ? "Sayaç Arızalı" : `${reason.split(" ")[0]} Gecikme`;
        return (
          <span title={reason}>
            <Badge tone={reason.startsWith("Sayaç") ? "warning" : "danger"} dot>
              {short}
              <span className="sr-only">, riskli: {reason}</span>
            </Badge>
          </span>
        );
      },
    },
  ];

  const items: RecordItem[] = pageRows.map((c) => {
    const reason = riskReason(c);
    return {
      id: c.id,
      title: c.name,
      subtitle: `${c.id} · ${KIND_LABEL[c.kind]} · ${c.voltage}`,
      leading: <Avatar name={c.name} size="sm" />,
      value: accountOf(c.id).balance > 0 ? tl(accountOf(c.id).balance) : kwh(c.baseKwh),
      meta: reason ? `${reason} · ${region(c.regionId).name}` : `${region(c.regionId).name} · ${c.district}`,
      status: (
        <span className="flex flex-wrap gap-1">
          <CustomerBadge status={c.status} />
          {reason ? <Badge tone={reason.startsWith("Sayaç") ? "warning" : "danger"}>Riskli</Badge> : null}
        </span>
      ),
      href: href("customers", { id: c.id }),
      actions: <Checkbox aria-label={`${c.name} aboneliğini seç`} checked={selected.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} />,
    };
  });

  return (
    <>
      <PageHead
        title="Aboneler"
        description={`${fmtNum(stats.total)} abone kaydı. Risk öne alınır: önce ilgilenilmesi gerekenler.`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const everyone = rows;
                const head = ["Abone No", "Ad", "Tür", "Bölge", "Tedarikçi", "Açık Bakiye (TL)", "Durum", "Risk"];
                const lines = everyone.map((c) => [c.id, `"${c.name}"`, KIND_LABEL[c.kind], region(c.regionId).name, `"${supplier(c.supplierId).name}"`, (accountOf(c.id).balance / 100).toFixed(2), c.status, riskReason(c) ?? ""].join(";"));
                const blob = new Blob(["﻿", [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "musteri-envanteri.csv";
                a.click();
                URL.revokeObjectURL(url);
                audit("Abone envanterini dışa aktardı", `${everyone.length} abone`, undefined, "CSV");
                notify({ title: "Envanter İndirildi", body: `${fmtNum(everyone.length)} abone, mevcut süzgeçle.`, tone: "success" });
              }}
            >
              <Download /> Envanter CSV
            </Button>
            {canEdit ? (
              <a className={buttonClass({ variant: "primary" })} href={href("register")}>
                <UserPlus /> Yeni Abone
              </a>
            ) : null}
          </>
        }
      />
      <PageBody>
        <PageHero
          primary={{ label: "Riskli Abone", value: fmtNum(stats.risky), foot: "İki ya da daha çok geciken fatura, ya da sayaç şüphesi", icon: <TriangleAlert />, goodWhen: "down", to: { page: "customers", params: { status: "riskli" } } }}
          secondary={[
            { label: "Toplam Abone", value: fmtNum(stats.total), foot: stats.kinds },
            { label: "Serbest Tüketici", value: fmtNum(stats.free), foot: `${fmtPct((stats.free / stats.total) * 100, 0)} tedarikçisini seçmiş`, to: { page: "customers", params: { status: "serbest" } } },
            { label: "Enerjisi Kesik", value: fmtNum(stats.cut), foot: "Yeniden bağlama bekleyenler dahil", to: { page: "customers", params: { status: "kesik" } } },
            { label: "Hassas Abone", value: fmtNum(stats.sensitive), foot: "Kesme listesine alınmaz", to: { page: "customers", params: { tag: "Hassas Abone (Tıbbi Cihaz)" } } },
            { label: "Otomatik Ödeme", value: fmtPct((stats.autoPay / stats.total) * 100, 0), foot: `${fmtNum(stats.autoPay)} talimat` },
            { label: "Sağlıklı Sayaç", value: fmtPct((stats.healthy / stats.total) * 100, 0), foot: "Tüm sayaçları okunan aboneler" },
          ]}
        />

        <Panel title="Abone Listesi" note={chips.length ? `${fmtNum(rows.length)} sonuç, ${fmtNum(stats.total)} abone içinde` : "Varsayılan sıra: riskli önce. Süzgeç ve sıralama adresle birlikte durur."} id="musteri-liste">
          <div className="space-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
            <FilterBar
              search={{ value: q, onChange: setQ, placeholder: "Ad, abone no, tesisat no, sayaç seri no, kimlik/VKN", label: "Abone Ara" }}
              filters={chips}
              onRemoveFilter={(id) => {
                if (id === "q") setQ("");
                else set({ [id]: undefined });
              }}
              onClearFilters={clearFilters}
              summary={chips.length ? `${fmtNum(rows.length)} abone` : undefined}
              views={{
                items: viewItems,
                value: viewId,
                onChange: (id) => {
                  const view = allViews.find((v) => v.id === id);
                  if (!view) return;
                  setQ("");
                  go("customers", { ...view.params, sort: params.sort, dir: params.dir });
                },
                onSave: (name) => {
                  saveCustomerView(name, { ...filterParams, ...(q.trim() ? { q: q.trim() } : {}) });
                  notify({ title: "Görünüm Kaydedildi", body: name, tone: "success" });
                },
                onDelete: (id) => {
                  deleteCustomerView(id);
                  notify({ title: "Görünüm Silindi", tone: "info" });
                },
              }}
              drawer={{
                groups,
                value: drawerValue,
                onChange: (value) => set({ kind: value.kind?.[0], volt: value.volt?.[0], region: value.region?.[0], supplier: value.supplier?.[0], tag: value.tag?.[0] }),
                resultCount: rows.length,
                resultLabel: (n) => `${fmtNum(n)} Aboneyi Göster`,
              }}
            />
          </div>

          <div className="max-md:hidden">
            <RowClickable>
              <DataTable<Customer>
                caption="Abone listesi"
                columns={columns}
                rows={pageRows}
                rowKey={(c) => c.id}
                sort={{ key: query.sort, dir: query.dir }}
                sortHref={(key, dir) => listHref(params, { sort: key, dir, page: undefined })}
                density="compact"
                on="surface"
                stickyFirst={false}
                minWidth="64rem"
                empty={
                  <EmptyStateX
                    title="Bu süzgece uyan abone yok."
                    hint="Aramayı kısaltın, bir süzgeci kaldırın ya da görünümü değiştirin."
                    action={
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        Süzgeçleri Temizle
                      </Button>
                    }
                  />
                }
              />
            </RowClickable>
          </div>
          <div className="md:hidden">
            {items.length ? (
              <RecordList label="Abone Listesi" items={items} />
            ) : (
              <EmptyStateX title="Bu süzgece uyan abone yok." hint="Süzgeçleri temizleyin." action={<Button variant="secondary" size="sm" onClick={clearFilters}>Süzgeçleri Temizle</Button>} />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
            <p className="text-small text-muted">
              {rows.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} / ${num.format(rows.length)}` : "0 sonuç"}
              {selected.size ? ` · ${selected.size} seçili` : ""}
            </p>
            <Pagination page={page} pageCount={pageCount} hrefFor={(n) => listHref(params, { page: n > 1 ? String(n) : undefined })} scroll={false} />
          </div>
        </Panel>
      </PageBody>

      {selected.size > 0 ? (
        <SelectionBar count={selected.size} noun="abone" onClear={() => setSelected(new Set())}>
          {canEdit ? (
            <>
              <SelectionAction icon={<MessageSquare />} onClick={() => setDialog("sms")}>
                SMS Gönder
              </SelectionAction>
              <SelectionAction icon={<Tag />} onClick={() => setDialog("tag")}>
                Etiketle
              </SelectionAction>
            </>
          ) : null}
          <SelectionAction icon={<Download />} onClick={exportCsv}>
            CSV
          </SelectionAction>
        </SelectionBar>
      ) : null}

      <SmsDialog open={dialog === "sms"} onClose={() => setDialog(null)} customers={chosen} onSent={() => setSelected(new Set())} />
      <TagDialog open={dialog === "tag"} onClose={() => setDialog(null)} customers={chosen} onDone={() => setSelected(new Set())} />
    </>
  );
}

const SMS_TEMPLATES = [
  { value: "fatura", label: "Fatura Hatırlatma", text: "Sayın abonemiz, son ödeme tarihi yaklaşan elektrik faturanız bulunmaktadır. Ödeme için portalımızı ya da yetkili noktaları kullanabilirsiniz." },
  { value: "okuma", label: "Okuma Günü Bilgilendirme", text: "Sayın abonemiz, sayacınız bu hafta okunacaktır. Sayaca erişimin açık olması işlemin zamanında tamamlanmasını sağlar." },
  { value: "kesinti", label: "Planlı Kesinti Duyurusu", text: "Sayın abonemiz, bölgenizde şebeke bakım çalışması yapılacaktır. Ayrıntılar için çağrı merkezimizi arayabilirsiniz." },
] as const;

function SmsDialog({ open, onClose, customers, onSent }: { open: boolean; onClose: () => void; customers: readonly Customer[]; onSent: () => void }) {
  const { notify } = useApp();
  const [template, setTemplate] = useState<string>(SMS_TEMPLATES[0].value);
  const [text, setText] = useState<string>(SMS_TEMPLATES[0].text);
  const over = text.length > 320;
  const empty = text.trim().length === 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Toplu SMS Gönder"
      description={`${customers.length} aboneye, kayıtlı telefon numarasına gönderilir.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={empty || over}
            onClick={() => {
              for (const c of customers) addHistory(c.id, { title: "SMS Gönderildi", description: text.length > 60 ? `${text.slice(0, 60)}…` : text, tone: "neutral" });
              audit("Toplu SMS gönderdi", `${customers.length} abone`, undefined, SMS_TEMPLATES.find((t) => t.value === template)?.label);
              notify({ title: `${customers.length} aboneye SMS kuyruğa alındı`, body: "Gönderim durumu Raporlar sayfasında izlenir.", tone: "success" });
              onSent();
              onClose();
            }}
          >
            Gönder
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select
          label="Şablon"
          value={template}
          onValueChange={(v) => {
            const next = SMS_TEMPLATES.find((t) => t.value === v);
            if (next) {
              setTemplate(next.value);
              setText(next.text);
            }
          }}
          items={SMS_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <Textarea
          label="Mesaj"
          value={text}
          onChange={(e) => setText(e.target.value)}
          minRows={4}
          hint={`${text.length} / 320 karakter. Kişiye özel alanlar (ad, tutar) gönderimde doldurulur.`}
          error={over ? "Mesaj 320 karakteri geçemez." : empty ? "Mesaj boş olamaz." : undefined}
          data-autofocus
        />
      </div>
    </Dialog>
  );
}

function TagDialog({ open, onClose, customers, onDone }: { open: boolean; onClose: () => void; customers: readonly Customer[]; onDone: () => void }) {
  const { notify } = useApp();
  const [picked, setPicked] = useState<readonly string[]>([]);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Aboneleri Etiketle"
      description={`${customers.length} aboneye uygulanır. Etiketler listede süzgeç olarak kullanılır.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={picked.length === 0}
            onClick={() => {
              for (const c of customers) patchCustomer(c.id, { tags: [...new Set([...(c.tags ?? []), ...picked])] }, { title: "Etiket Eklendi", description: picked.join(", "), tone: "primary" });
              notify({ title: "Etiketler Eklendi", body: `${customers.length} aboneye ${picked.length} etiket uygulandı.`, tone: "success" });
              setPicked([]);
              onDone();
              onClose();
            }}
          >
            Uygula
          </Button>
        </>
      }
    >
      <div className="grid gap-1">
        {TAGS.map((tag, i) => (
          <Checkbox
            key={tag}
            label={tag}
            checked={picked.includes(tag)}
            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, tag] : p.filter((x) => x !== tag)))}
            data-autofocus={i === 0 ? true : undefined}
          />
        ))}
      </div>
    </Dialog>
  );
}

/* ====================================================================== *
 *  ABONE 360 AYRINTISI
 * ====================================================================== */

/** KVKK: maskeli alanın açılmış hali (demo; deterministik, gerçek değil). */
function unmasked(c: Customer) {
  const n = Number(c.id.slice(2));
  const tail = c.phone.replace(/\D/g, "").slice(-4);
  return {
    phone: `0${530 + (n % 29)} ${String(100 + (n % 800))} ${tail.slice(0, 2)} ${tail.slice(2)}`,
    email: `${c.email.split("•")[0]}${n % 97}@example.com`,
  };
}

type DetailDialog = "contact" | "supplier" | "work" | "tariff" | "close" | "merge" | "reveal" | null;

function MusteriDetay({ customer: c, go }: { customer: Customer; go: PageProps["go"] }) {
  const { notify } = useApp();
  const canEdit = useCan("musteri");
  const canCut = useCan("kesme");
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState<DetailDialog>(null);
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState("");
  const workOrders = useWorkOrders();
  const auditLog = useAuditLog();
  const activeWork = workOrders.filter((w) => w.customerId === c.id && (w.type === "kesme" || w.type === "baglama") && w.status !== "tamamlandi" && w.status !== "iptal");

  const meters = metersFor(c.id);
  const invoices = invoicesOf(c.id);
  const payments = paymentsOf(c.id);
  const readings = readingsForCustomer(c.id).filter((r) => r.status !== "bekliyor");
  const account = accountOf(c.id);
  const patch = patchOf(c.id);
  const contract = contractOf(c);
  const sup = supplier(c.supplierId);
  const plan = PAYMENT_PLANS.find((p) => p.customerId === c.id && p.status === "devam");
  const closed = c.status === "kapali";
  const fresh = isAdded(c.id);

  const demandRows = PERIODS_12.slice(-6).flatMap((p) => {
    const rs = readings.filter((r) => r.period === p);
    return rs.length ? [{ period: p, label: `${monthShort.format(parseDay(`${p}-01`))} ${p.slice(0, 4)}`, demand: Math.max(...rs.map((r) => r.demandKw)) }] : [];
  });
  const usageByPeriod = PERIODS_12.map((p) => readings.filter((r) => r.period === p).reduce((sum, r) => sum + r.usage.total, 0));
  const hasUsage = usageByPeriod.some((v) => v > 0);
  const anomaly = usageAnomaly(usageByPeriod, readings, c.kind);
  const riskFactors = (() => {
    const bad = meters.filter((m) => m.status !== "okunuyor");
    if (account.overdue === 0 && bad.length === 0) return null;
    const noComm = bad.filter((m) => m.status === "iletisim-yok").length;
    const faulty = bad.filter((m) => m.status === "arizali").length;
    const tamper = bad.filter((m) => m.status === "mudahale").length;
    const severity: "medium" | "high" | "critical" = account.overdue >= 3 || tamper > 0 || faulty > 0 ? "critical" : account.overdue >= 2 ? "high" : "medium";
    const factors = [
      { label: "Geciken Fatura", value: account.overdue > 0 ? `${account.overdue} fatura` : "Yok", tone: account.overdue >= 2 ? ("danger" as const) : account.overdue === 1 ? ("warning" as const) : ("neutral" as const) },
      { label: "Açık Bakiye", value: account.balance > 0 ? tl(account.balance) : "Yok", hint: account.balance > 0 ? "Gecikme zammı dahil değil" : undefined, tone: account.balance > 0 ? ("warning" as const) : ("neutral" as const) },
      { label: "Sayaç Durumu", value: bad.length ? `${bad.length} sayaçta sorun` : "Sorun yok", hint: bad.length ? bad.map((m) => `${m.serial}: ${m.status === "iletisim-yok" ? "iletişim yok" : m.status === "arizali" ? "arızalı" : "müdahale şüphesi"}`).join("; ") : undefined, tone: faulty + tamper > 0 ? ("danger" as const) : bad.length ? ("warning" as const) : ("neutral" as const) },
      { label: "Haberleşme", value: noComm > 0 ? `${noComm} sayaçta kesik` : "Sağlıklı", tone: noComm > 0 ? ("warning" as const) : ("neutral" as const) },
    ];
    return { severity, factors };
  })();
  const lastUsage = usageByPeriod[usageByPeriod.length - 1] || usageByPeriod[usageByPeriod.length - 2] || 0;
  const avg12 = hasUsage ? Math.round(usageByPeriod.reduce((a, b) => a + b, 0) / usageByPeriod.filter((v) => v > 0).length) : 0;
  const lastInvoice = invoices.at(-1);
  const dup = useMemo(
    () => allCustomers().find((o) => o.id !== c.id && o.status !== "kapali" && o.name.toLocaleLowerCase("tr-TR") === c.name.toLocaleLowerCase("tr-TR")),
    [c.id, c.name],
  );

  const shown = revealed ? unmasked(c) : { phone: c.phone, email: c.email };
  const auditEvents = auditLog
    .filter((a) => a.origin === "portal" && a.target.startsWith(c.id))
    .map((a) => ({ id: `a-${a.id}`, at: dayKey(a.at), when: `Bugün, ${hhmm(a.at)}`, title: a.action, description: [a.before, a.after].filter(Boolean).join(" → ") || `${a.user}${a.ok ? "" : " · reddedildi"}`, tone: (a.ok ? "primary" : "danger") as TimelineEvent["tone"] }));
  const audited = new Set(auditEvents.map((e) => e.title));
  const events: TimelineEvent[] = [
    ...auditEvents,
    ...historyOf(c.id).filter((h) => !audited.has(h.title)).map((h) => ({ id: h.id, at: h.at, when: h.when, title: h.title, description: h.description, tone: h.tone })),
    ...invoices.slice(-3).reverse().map((i) => ({ id: `i-${i.id}`, at: i.issued, when: dayLabel(i.issued), title: `${i.id} numaralı fatura kesildi`, description: `${tl(i.total)} · vade ${dayLabel(i.due)}`, tone: (i.status === "gecikti" ? "danger" : "neutral") as TimelineEvent["tone"] })),
    ...payments.slice(-2).reverse().map((p) => ({ id: `p-${p.id}`, at: p.date, when: dayLabel(p.date), title: "Ödeme Alındı", description: `${tl(p.amount)} · ${CHANNEL_LABEL[p.channel]}`, tone: "success" as const })),
    { id: "since", at: c.since, when: fullDate.format(parseDay(c.since)), title: "Abonelik Açıldı", description: `${region(c.regionId).name}, ${c.district}`, tone: "primary" as const },
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const actions: { id: Exclude<DetailDialog, null>; icon: ReactNode; title: string; hint: string; disabled?: boolean }[] = [
    { id: "contact", icon: <Pencil />, title: "İletişim Bilgilerini Güncelle", hint: canEdit ? "Telefon ve e-posta; doğrulama koduyla teyit edilir." : "Bu işlem için abone düzenleme yetkisi gerekir.", disabled: !canEdit || closed },
    { id: "tariff", icon: <Receipt />, title: "Tarife ve Adres Değişikliği", hint: canEdit ? "Zaman dilimi tarifesi ve fatura adresi." : "Bu işlem için abone düzenleme yetkisi gerekir.", disabled: !canEdit || closed },
    { id: "supplier", icon: <Repeat />, title: "Tedarikçi Değişikliği Başlat", hint: c.free ? "Serbest tüketici: perakende satış şirketi seçilebilir." : "Serbest tüketici değil: görevli tedarik şirketi.", disabled: !c.free || closed || !canEdit },
    { id: "work", icon: c.status === "kesik" ? <Power /> : <PowerOff />, title: c.status === "kesik" ? "Yeniden bağlama talebi" : "Enerji kesme talebi", hint: canCut ? "Kural denetlenir; iş emri oluşturur, iki göz onayı ister." : "Bu işlem için kesme ve bağlama yetkisi gerekir.", disabled: closed || !canCut },
    { id: "merge", icon: <Users />, title: "Yinelenen Kayıt Kontrolü", hint: dup ? `Aynı adla başka kayıt var: ${dup.id}.` : "Olası yinelenen kayıt bulunmadı." },
    { id: "close", icon: <X />, title: "Aboneliği Kapat", hint: canEdit ? "Geri alınamaz; bakiye ve sayaç durumu kontrol edilir." : "Bu işlem için abone düzenleme yetkisi gerekir.", disabled: closed || !canEdit },
  ];

  return (
    <>
      <PageHead
        title="Aboneler"
        crumb={`${c.id} · ${c.name}`}
        description={`${KIND_LABEL[c.kind]} aboneliği · ${c.voltage === "OG" ? "Orta" : "Alçak"} gerilim · ${region(c.regionId).name}, ${c.district}`}
        actions={
          <>
            <a className={buttonClass({ variant: "ghost" })} href={href("customers")}>
              <ArrowLeft /> Listeye Dön
            </a>
            {canEdit ? (
              <Button variant="secondary" onClick={() => setDialog("contact")}>
                <Pencil /> Bilgileri Güncelle
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={() => {
                addHistory(c.id, { title: "SMS Gönderildi", description: "Fatura bilgilendirme mesajı", tone: "neutral" });
                audit("SMS gönderdi", c.id, undefined, "Fatura bilgilendirme");
                notify({ title: "SMS Gönderildi", body: "Kayıtlı telefona fatura bilgilendirmesi iletildi.", tone: "success" });
              }}
            >
              <MessageSquare /> SMS Gönder
            </Button>
          </>
        }
      />
      <PageBody>
        {activeWork.map((w) => (
          <WorkOrderBanner key={w.id} work={w} canAct={canCut} />
        ))}
        {patch?.supplierChange ? (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-primary-wash px-4 py-3 text-base text-body ring-1 ring-primary/20">
            <Repeat aria-hidden className="size-5 shrink-0 text-primary-ink" />
            <p className="min-w-0 flex-1">
              <strong className="font-semibold text-strong">Tedarikçi değişikliği süreçte:</strong> {supplier(patch.supplierChange.supplierId).name}, yürürlük {dayLabel(patch.supplierChange.date)}.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const s = patch.supplierChange!;
                patchCustomer(c.id, { supplierId: s.supplierId, supplierChange: null }, { title: "Tedarikçi Değişti", description: supplier(s.supplierId).name, tone: "success" });
                notify({ title: "Tedarikçi Değişikliği Tamamlandı", body: supplier(s.supplierId).name, tone: "success" });
              }}
            >
              Yürürlüğe Al
            </Button>
            <Button size="sm" variant="ghost" onClick={() => patchCustomer(c.id, { supplierChange: null }, { title: "Tedarikçi Değişikliği İptal Edildi", tone: "neutral" })}>
              İptal Et
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-3">
          <section aria-label="Abone Kartı" className="flex min-w-0 flex-col gap-4 rounded-xl bg-overlay p-5 shadow-raised ring-1 ring-line xl:col-span-1">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-read font-semibold text-strong">{c.name}</h2>
                <p className="kz-mono text-small text-muted">
                  {c.id} · Tesisat {c.installation}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <CustomerBadge status={c.status} />
                  <Badge tone="neutral">{KIND_LABEL[c.kind]}</Badge>
                  <Badge tone={c.free ? "primary" : "neutral"}>{c.free ? "Serbest tüketici" : "Görevli tedarik"}</Badge>
                  {fresh ? <Badge tone="success">Yeni kayıt</Badge> : null}
                </div>
              </div>
            </div>
            <dl className="grid gap-3 text-base">
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5">
                <Phone aria-hidden className="col-start-1 row-span-2 mt-0.5 size-4 text-muted" />
                <dt className="col-start-2 min-w-0 text-small text-muted">Telefon</dt>
                <dd className="col-start-2 min-w-0 kz-mono text-strong">{shown.phone}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5">
                <Mail aria-hidden className="col-start-1 row-span-2 mt-0.5 size-4 text-muted" />
                <dt className="col-start-2 min-w-0 text-small text-muted">E-posta</dt>
                <dd className="col-start-2 min-w-0 break-all text-strong">{shown.email}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5">
                <MapPin aria-hidden className="col-start-1 row-span-2 mt-0.5 size-4 text-muted" />
                <dt className="col-start-2 min-w-0 text-small text-muted">Adres</dt>
                <dd className="col-start-2 min-w-0 text-strong">{c.address}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5">
                <Receipt aria-hidden className="col-start-1 row-span-2 mt-0.5 size-4 text-muted" />
                <dt className="col-start-2 min-w-0 text-small text-muted">{c.kind === "bireysel" ? "T.C. Kimlik No" : "Vergi Kimlik No"}</dt>
                <dd className="col-start-2 min-w-0 kz-mono text-strong">{c.taxMasked}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
              <p className="text-small text-muted">{revealed ? "Maskesiz gösteriliyor, erişim kaydedildi." : "KVKK: kimlik ve iletişim alanları maskeli."}</p>
              <Button
                size="sm"
                variant="secondary"
                aria-pressed={revealed}
                disabled={!canEdit && !revealed}
                onClick={() => {
                  if (revealed) setRevealed(false);
                  else setDialog("reveal");
                }}
              >
                {revealed ? <EyeOff /> : <Eye />} {revealed ? "Maskele" : "Göster"}
              </Button>
            </div>
            <Switch
              label="Otomatik Ödeme Talimatı"
              hint={c.autoPay ? "Fatura vadesinde bankadan tahsil edilir." : "Talimat yok; fatura elle ödenir."}
              checked={c.autoPay}
              disabled={closed}
              onChange={(e) => {
                patchCustomer(c.id, { autoPay: e.target.checked }, { title: e.target.checked ? "Otomatik ödeme açıldı" : "Otomatik ödeme kapatıldı", tone: e.target.checked ? "success" : "warning" });
                notify({ title: e.target.checked ? "Otomatik ödeme açıldı" : "Otomatik ödeme kapatıldı", tone: "success" });
              }}
            />
          </section>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:col-span-2">
            <MetricStrip>
              <Metric icon={<Wallet />} label="Açık Bakiye" value={account.balance > 0 ? fmtTl(account.balance) : "Yok"} foot={account.overdue ? `${account.overdue} geciken fatura` : "Gecikme yok"} to={account.balance > 0 ? { page: "invoices", params: { customer: c.id } } : undefined} />
              <Metric icon={<Receipt />} label="Son Fatura" value={lastInvoice ? fmtTl(lastInvoice.total) : "—"} foot={lastInvoice ? `${lastInvoice.id} · vade ${dayLabel(lastInvoice.due)}` : "Henüz fatura yok"} />
              <Metric icon={<Gauge />} label="Son Dönem Tüketim" value={hasUsage ? kwh(lastUsage) : "—"} foot={hasUsage ? `12 ay ortalama ${kwh(avg12)}` : "Henüz okuma yok"} />
            </MetricStrip>

            <Tabs
              aria-label="Abone Ayrıntıları"
              value={tab}
              onValueChange={setTab}
              items={[
                {
                  value: "overview",
                  label: "Genel Bakış",
                  panel: (
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5">
                      {riskFactors ? (
                        <div className="rounded-xl bg-surface p-4 sm:p-5">
                          <FactorList title="Neden Riskli" severity={riskFactors.severity} factors={riskFactors.factors} headingLevel={3} />
                          <p className="mt-3 text-small text-muted">
                            {account.overdue > 0 ? "Ödeme planı önerilebilir ya da kesme süreci başlatılabilir." : "Saha ekibi sayaç kaydını kontrol etmeli."}
                          </p>
                        </div>
                      ) : null}
                      <Panel title="Aylık Tüketim" note="Son 12 dönem, kWh (çarpan dahil)" id="detay-tuketim">
                        <div className="grid gap-3 p-4 sm:p-5">
                          {anomaly ? (
                            <Alert tone="warning" title={`${anomaly.label}: tüketim ortalamanın ${fmtPct(anomaly.dropPct, 0)} altında`}>
                              {anomaly.explanation}
                            </Alert>
                          ) : null}
                          {hasUsage ? (
                            <AreaChart
                              title={`${c.name} aylık tüketim`}
                              labels={PERIODS_12.map((p) => monthShort.format(parseDay(`${p}-01`)))}
                              series={[{ label: "Tüketim", values: usageByPeriod, series: 1 }]}
                              unit="kWh"
                              valueFormat={{ maximumFractionDigits: 0 }}
                              height="h-44"
                            />
                          ) : (
                            <EmptyState variant="inline" title="Henüz tüketim verisi yok." hint="İlk okuma sonrasında grafik oluşur." />
                          )}
                        </div>
                      </Panel>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface p-4 text-base sm:grid-cols-4">
                        <Fact label="Sayaç Sayısı" value={String(meters.length)} />
                        <Fact label="Tarife" value={c.tariff === "tek-zamanli" ? "Tek zamanlı" : "Çok zamanlı"} />
                        <Fact label="Sözleşme Gücü" value={`${contract.power} kW`} />
                        <Fact label="Abonelik Başlangıcı" value={fullDate.format(parseDay(c.since))} />
                      </dl>
                    </div>
                  ),
                },
                {
                  value: "meters",
                  label: `Sayaçlar ${meters.length}`,
                  panel: (
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5">
                      <Panel title="Tesisat Sayaçları" note={`Tesisat ${c.installation}`} id="detay-sayac">
                        {meters.length === 0 ? (
                          <EmptyState variant="inline" title="Bu tesisata sayaç atanmamış." className="px-4" />
                        ) : (
                          <ul className="divide-y divide-line-soft">
                            {meters.map((m) => (
                              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                                <div className="min-w-0 flex-1">
                                  <a href={href("meters", { id: m.id })} className="kz-mono font-medium text-strong hover:underline">
                                    {m.serial}
                                  </a>
                                  <p className="text-small text-muted">
                                    {m.model} · {COMM_LABEL[m.comm]} · çarpan ×{m.multiplier}
                                  </p>
                                </div>
                                <MeterBadge status={m.status} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </Panel>
                      <Panel title="Son Okumalar" note="Doğrulanmış ve düzeltilmiş okumalar" id="detay-okuma">
                        {readings.length === 0 ? (
                          <EmptyState variant="inline" title="Henüz okuma yok." className="px-4" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] text-left text-base">
                              <caption className="sr-only">Son altı okuma</caption>
                              <thead>
                                <tr className="border-b border-line-soft text-small text-muted">
                                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">Dönem</th>
                                  <th scope="col" className="px-2 py-2 font-medium">Kaynak</th>
                                  <th scope="col" className="px-2 py-2 text-right font-medium">Tüketim</th>
                                  <th scope="col" className="px-2 py-2 text-right font-medium">Talep</th>
                                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">Durum</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-line-soft">
                                {[...readings].reverse().slice(0, 6).map((r) => (
                                  <tr key={r.id}>
                                    <th scope="row" className="px-4 py-2.5 font-medium text-strong sm:px-5">
                                      {monthShort.format(parseDay(`${r.period}-01`))} {r.period.slice(0, 4)}
                                    </th>
                                    <td className="px-2 py-2.5 text-body">{SOURCE_LABEL[r.source]}</td>
                                    <td className="kz-mono px-2 py-2.5 text-right text-body">{kwh(r.usage.total)}</td>
                                    <td className="kz-mono px-2 py-2.5 text-right text-body">{num.format(r.demandKw)} kW</td>
                                    <td className="px-4 py-2.5 sm:px-5">
                                      <div className="flex flex-wrap gap-1">
                                        <ReadingBadge status={r.status} />
                                        {r.flags.map((f) => (
                                          <Badge key={f} tone="warning">
                                            {FLAG_LABEL[f]}
                                          </Badge>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Panel>
                    </div>
                  ),
                },
                {
                  value: "invoices",
                  label: `Faturalar ${invoices.length}`,
                  panel: (
                    <div className="mt-4">
                      <Panel title="Fatura Geçmişi" note={account.balance > 0 ? `Açık bakiye ${tl(account.balance)}` : "Açık bakiye yok"} id="detay-fatura">
                        {invoices.length === 0 ? (
                          <EmptyState variant="inline" title="Bu aboneye henüz fatura kesilmedi." className="px-4" />
                        ) : (
                          <ul className="divide-y divide-line-soft">
                            {[...invoices].reverse().slice(0, 8).map((i) => (
                              <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                                <div className="min-w-0 flex-1">
                                  <a href={href("invoices", { id: i.id })} className="kz-mono font-medium text-strong hover:underline">
                                    {i.id}
                                  </a>
                                  <p className="text-small text-muted">
                                    {monthShort.format(parseDay(`${i.period}-01`))} {i.period.slice(0, 4)} · {kwh(i.usageKwh)} · vade {dayLabel(i.due)}
                                  </p>
                                </div>
                                <span className="kz-mono text-strong">{tl(i.total)}</span>
                                <InvoiceBadge status={i.status} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </Panel>
                    </div>
                  ),
                },
                {
                  value: "payments",
                  label: `Ödemeler ${payments.length}`,
                  panel: (
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5">
                      {plan ? (
                        <Panel title="Ödeme Planı" note={`${plan.installments} taksit · sonraki ${dayLabel(plan.next)}`} id="detay-plan">
                          <div className="p-4 sm:p-5">
                            <TickMeter label="Ödenen Taksit" value={Math.round((plan.paid / plan.total) * plan.installments)} max={plan.installments} text={`${tl(plan.paid)} / ${tl(plan.total)}`} />
                          </div>
                        </Panel>
                      ) : null}
                      <Panel title="Ödeme Hareketleri" note="Kanal, gecikme zammı ve mutabakat dahil" id="detay-odeme">
                        {payments.length === 0 ? (
                          <EmptyState variant="inline" title="Bu aboneye ait ödeme kaydı yok." className="px-4" />
                        ) : (
                          <ul className="divide-y divide-line-soft">
                            {[...payments].reverse().slice(0, 8).map((p) => (
                              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-strong">{CHANNEL_LABEL[p.channel]}</span>
                                  <p className="kz-mono text-small text-muted">
                                    {dayLabel(p.date)} · {p.reference} · fatura {p.invoiceId}
                                  </p>
                                </div>
                                <span className="kz-mono text-strong">{tl(p.amount)}</span>
                                {p.lateFee > 0 ? <Badge tone="warning">Gecikme zammı {tl(p.lateFee)}</Badge> : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </Panel>
                    </div>
                  ),
                },
                {
                  value: "contract",
                  label: "Sözleşme",
                  panel: (
                    <div className="mt-4">
                      <Panel title="Sözleşme ve Tedarikçi" note="Örnek sözleşme bilgisi" id="detay-sozlesme">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 text-base sm:grid-cols-2 sm:p-5">
                          <Fact label="Tedarikçi" value={sup.name} />
                          <Fact label="Lisans" value={sup.license} />
                          <Fact label="Birim Enerji Bedeli" value={`${sup.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL/kWh`} />
                          <Fact label="Sözleşme Dönemi" value={`${dayLabel(contract.start)} — ${dayLabel(contract.end)}`} />
                          <Fact label="Sözleşme Gücü" value={`${contract.power} kW`} />
                          <Fact label="Tarife" value={contract.tariffLabel} />
                          <Fact label="Otomatik Yenileme" value={contract.autoRenew ? "Açık" : "Görevli tedarik kapsamında"} />
                          <Fact label="Tedarikçi İletişim" value={sup.phone} />
                        </dl>
                      </Panel>
                      <Panel title="Talep Geçmişi ve Güç Aşımı" note={`Sözleşme gücü ${contract.power} kW; aşım olursa güç aşım bedeli faturaya yazılır`} id="detay-talep" className="mt-5">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[30rem] text-left text-base">
                            <caption className="sr-only">Son altı dönemin talep gücü</caption>
                            <thead>
                              <tr className="border-b border-line-soft text-small text-muted">
                                <th scope="col" className="px-4 py-2 font-medium sm:px-5">Dönem</th>
                                <th scope="col" className="px-2 py-2 text-right font-medium">En Yüksek Talep</th>
                                <th scope="col" className="px-2 py-2 font-medium">Sözleşme Gücü Kullanımı</th>
                                <th scope="col" className="px-4 py-2 font-medium sm:px-5">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                              {demandRows.map((r) => (
                                <tr key={r.period}>
                                  <th scope="row" className="px-4 py-2.5 font-medium text-strong sm:px-5">{r.label}</th>
                                  <td className="kz-mono px-2 py-2.5 text-right text-body">{num.format(r.demand)} kW</td>
                                  <td className="px-2 py-2.5"><TickMeter label={`${r.label} talep kullanımı`} value={Math.min(r.demand, contract.power)} max={contract.power} ticks={12} text={fmtPct((r.demand / contract.power) * 100, 0)} size="sm" /></td>
                                  <td className="px-4 py-2.5 sm:px-5">{r.demand > contract.power ? <Badge tone="danger">Aşım {num.format(r.demand - contract.power)} kW</Badge> : <Badge tone="success">Sınır içinde</Badge>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {demandRows.length === 0 ? <p className="px-4 py-4 text-small text-muted sm:px-5">Henüz talep kaydı yok.</p> : null}
                        </div>
                      </Panel>
                    </div>
                  ),
                },
                {
                  value: "kvkk",
                  label: "KVKK ve Rıza",
                  panel: <KvkkPanel customer={c} canEdit={canEdit} />,
                },
                {
                  value: "history",
                  label: "Geçmiş ve Notlar",
                  panel: (
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
                      <Panel title="İşlem Geçmişi" id="detay-gecmis" note="En yeni üstte">
                        <div className="p-4 sm:p-5">
                          <Timeline events={events.slice(0, 10)} />
                        </div>
                      </Panel>
                      <Panel title="Notlar" id="detay-not" note="Yalnız ekip içi görünür">
                        <div className="grid gap-4 p-4 sm:p-5">
                          <Textarea label="Yeni Not" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} hint="Abone görüşmesi, saha bilgisi, takip kararı." />
                          <div>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!note.trim()}
                              onClick={() => {
                                addNote(c.id, note.trim());
                                setNote("");
                                notify({ title: "Not Eklendi", tone: "success" });
                              }}
                            >
                              <StickyNote /> Notu Ekle
                            </Button>
                          </div>
                          {notesOf(c.id).length === 0 ? (
                            <p className="text-small text-muted">Bu abone için henüz not yok.</p>
                          ) : (
                            <ul className="grid gap-3">
                              {notesOf(c.id).map((n) => (
                                <li key={n.id} className="rounded-lg bg-surface p-3 text-base">
                                  <p className="text-body">{n.text}</p>
                                  <p className="mt-1 text-small text-muted">
                                    {n.author} · {n.when}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Panel>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <Panel title="İşlemler" note="Her işlem geçmişe yazılır; yıkıcı olanlar onay ister." id="detay-islemler">
          <ul className="grid divide-y divide-line-soft sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
            {actions.map((a) => (
              <li key={a.id} className="border-line-soft sm:border-b sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0">
                <button
                  type="button"
                  disabled={a.disabled}
                  onClick={() => setDialog(a.id)}
                  className="flex min-h-16 w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent sm:px-5"
                >
                  <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-body [&_svg]:size-4">
                    {a.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-strong">{a.title}</span>
                    <span className="block text-small text-muted">{a.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </PageBody>

      <ContactDialog open={dialog === "contact"} onClose={() => setDialog(null)} customer={c} />
      <TariffDialog open={dialog === "tariff"} onClose={() => setDialog(null)} customer={c} />
      <SupplierDialog open={dialog === "supplier"} onClose={() => setDialog(null)} customer={c} />
      <WorkDialog open={dialog === "work"} onClose={() => setDialog(null)} customer={c} balance={account.balance} />
      <MergeDialog open={dialog === "merge"} onClose={() => setDialog(null)} customer={c} other={dup} go={go} />
      <RevealDialog open={dialog === "reveal"} onClose={() => setDialog(null)} customer={c} onReveal={() => setRevealed(true)} />
      <CloseDialog open={dialog === "close"} onClose={() => setDialog(null)} customer={c} balance={account.balance} metersCount={meters.length} />
    </>
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

function Alert({ tone, title, children }: { tone: "danger" | "warning"; title: string; children: ReactNode }) {
  return (
    <div role="note" className={`flex items-start gap-3 rounded-xl px-4 py-3 text-base ring-1 ${tone === "danger" ? "bg-danger-wash ring-danger/20" : "bg-warning-wash ring-warning/20"}`}>
      <TriangleAlert aria-hidden className={`mt-0.5 size-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-warning"}`} />
      <div className="min-w-0">
        <p className="font-semibold text-strong">{title}</p>
        <p className="text-body">{children}</p>
      </div>
    </div>
  );
}

/* --- Diyaloglar --------------------------------------------------------------- */

function ContactDialog({ open, onClose, customer: c }: { open: boolean; onClose: () => void; customer: Customer }) {
  const { notify } = useApp();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const phoneError = phone && !validPhone(phone) ? "Telefon 05XX XXX XX XX biçiminde 11 hane olmalı." : undefined;
  const emailError = email && !validEmail(email) ? "E-posta adresi geçerli değil." : undefined;
  const nothing = !phone && !email;
  function save() {
    setTouched(true);
    if (nothing || phoneError || emailError) return;
    patchCustomer(
      c.id,
      { ...(phone ? { phone: `${phone.replace(/\s/g, "").slice(0, 4)} ••• ${phone.replace(/\s/g, "").slice(-4, -2)} ${phone.replace(/\s/g, "").slice(-2)}` } : {}), ...(email ? { email: `${email.split("@")[0].slice(0, 3)}•••@${email.split("@")[1]}` } : {}) },
      { title: "İletişim Bilgisi Güncellendi", description: [phone && "telefon", email && "e-posta"].filter(Boolean).join(" ve "), tone: "primary" },
    );
    notify({ title: "İletişim Bilgisi Güncellendi", body: "Yeni bilgi doğrulama koduyla teyit edilecek.", tone: "success" });
    setPhone("");
    setEmail("");
    setTouched(false);
    onClose();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="İletişim Bilgilerini Güncelle"
      description="Yalnız değiştirmek istediğiniz alanı doldurun."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input label="Yeni Telefon" inputMode="tel" placeholder="05XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError} data-autofocus />
        <Input label="Yeni E-Posta" type="email" placeholder="ad@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
        {touched && nothing ? <p role="alert" className="text-small text-danger">En az bir alan doldurulmalı.</p> : null}
      </div>
    </Dialog>
  );
}

function TariffDialog({ open, onClose, customer: c }: { open: boolean; onClose: () => void; customer: Customer }) {
  const { notify } = useApp();
  const [tariff, setTariff] = useState<Customer["tariff"]>(c.tariff);
  const [address, setAddress] = useState(c.address);
  const bad = address.trim().length < 8;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Tarife ve Adres Değişikliği"
      description="Tarife değişikliği bir sonraki okuma döneminden itibaren geçerli olur."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={bad}
            onClick={() => {
              patchCustomer(c.id, { tariff, address: address.trim() }, { title: "Tarife ve Adres Güncellendi", description: tariff === "tek-zamanli" ? "Tek zamanlı tarife" : "Çok zamanlı tarife", tone: "primary" });
              notify({ title: "Değişiklik Kaydedildi", body: "Sayaç tarife tablosu bir sonraki okumada güncellenir.", tone: "success" });
              onClose();
            }}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select
          label="Tarife Tipi"
          value={tariff}
          onValueChange={(v) => v && setTariff(v as Customer["tariff"])}
          items={[{ value: "tek-zamanli", label: "Tek Zamanlı" }, { value: "cok-zamanli", label: "Çok Zamanlı (T1 Gündüz / T2 Puant / T3 Gece)" }]}
        />
        <Textarea label="Fatura Adresi" value={address} onChange={(e) => setAddress(e.target.value)} minRows={2} error={bad ? "Adres en az 8 karakter olmalı." : undefined} />
      </div>
    </Dialog>
  );
}

function SupplierDialog({ open, onClose, customer: c }: { open: boolean; onClose: () => void; customer: Customer }) {
  const { notify } = useApp();
  const options = SUPPLIERS.filter((s) => s.id !== c.supplierId && s.kind === "perakende");
  const [pick, setPick] = useState(options[0]?.id ?? "");
  const chosen = options.find((s) => s.id === pick);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Tedarikçi Değişikliği Başlat"
      description="Serbest tüketici, perakende satış şirketini seçebilir. Süreç onay ve borç kontrolünden geçer."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={!chosen}
            onClick={() => {
              patchCustomer(c.id, { supplierChange: { supplierId: pick, date: "2026-12-01" } }, { title: "Tedarikçi Değişikliği Başlatıldı", description: chosen?.name, tone: "primary" });
              notify({ title: "Değişiklik Başlatıldı", body: `${chosen?.name} · yürürlük 1 Ara`, tone: "success" });
              onClose();
            }}
          >
            Süreci Başlat
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="rounded-lg bg-surface p-3 text-base text-body">
          Mevcut tedarikçi: <strong className="text-strong">{supplier(c.supplierId).name}</strong> ({supplier(c.supplierId).unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL/kWh)
        </p>
        <Select
          label="Yeni Tedarikçi"
          value={pick}
          onValueChange={(v) => v && setPick(v)}
          items={options.map((s) => ({ value: s.id, label: `${s.name} · ${s.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL/kWh` }))}
        />
        <p className="text-small text-muted">Yürürlük tarihi örnek olarak 1 Aralık. Gerçek süreç sözleşme ve mevzuat sürelerine göre belirlenir.</p>
      </div>
    </Dialog>
  );
}

const WORK_REASONS = {
  kesme: ["Ödenmemiş fatura", "Abone talebi", "Güvenlik ya da müdahale şüphesi", "Geçici bakım"],
  baglama: ["Borç ödendi", "Abone talebi", "Bakım tamamlandı", "Hatalı kesme düzeltmesi"],
} as const;

/** Kesme kuralları sonucunu denetim satırlarına çevirir (motorun `blockers` metinlerinden). */
function cutChecks(p: ReturnType<typeof cutEligibility>): PolicyCheck[] {
  const blocked = (prefix: string) => p.blockers.find((b) => b.startsWith(prefix));
  const row = (id: string, label: string, ok: string, bad: string | undefined): PolicyCheck => ({ id, label, state: bad ? "fail" : "pass", detail: bad ?? ok });
  const known = ["Gecikme ", "Yazılı ihtar", "İhtar bekleme", "Açık fatura itirazı", "Aktif ödeme planı", "Açık bakiye yok"];
  const hassas = p.blockers.find((b) => b.endsWith("kesme listesine alınmaz"));
  const checks: PolicyCheck[] = [
    row("ihtar", "Yazılı İhtar", p.noticeAt ? `Tebliğ edildi (${dayLabel(p.noticeAt)})` : "Yapıldı", blocked("Yazılı ihtar")),
    row("bekleme", "İhtar Bekleme Süresi", "Süre doldu", blocked("İhtar bekleme")),
    row("gecikme", "Gecikme Süresi", `${p.overdueDays} gün`, blocked("Gecikme ")),
    row("bakiye", "Açık Bakiye", "Borç açık", blocked("Açık bakiye yok")),
    row("hassas", "Hassas Abone", "Muaf değil", hassas),
    row("itiraz", "Açık İtiraz", "Yok", blocked("Açık fatura itirazı")),
    row("plan", "Ödeme Planı", "Aktif plan yok", blocked("Aktif ödeme planı")),
  ];
  for (const b of p.blockers) if (!known.some((k) => b.startsWith(k)) && b !== hassas) checks.push({ id: b, label: "Durum", state: "fail", detail: b });
  for (const w of p.warnings) checks.push({ id: w, label: "Not", state: "warn", detail: w });
  return checks;
}

function WorkDialog({ open, onClose, customer: c, balance }: { open: boolean; onClose: () => void; customer: Customer; balance: number }) {
  const { notify } = useApp();
  const kind = c.status === "kesik" ? "baglama" : "kesme";
  const [reason, setReason] = useState<string>(WORK_REASONS[kind][0]);
  const [ack, setAck] = useState(false);
  const [denied, setDenied] = useState<readonly string[]>([]);
  const policy = kind === "kesme" ? cutEligibility(c.id) : null;
  const canHold = ack && (kind === "baglama" || Boolean(policy?.eligible));
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={kind === "kesme" ? "Enerji Kesme Talebi" : "Yeniden Bağlama Talebi"}
      description={kind === "kesme" ? "Kural denetlenir; uygunsa iş emri oluşur ve ikinci göz onayına düşer." : "Bağlama emri 24 saatlik hedef süreyle açılır."}
      dismissible={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <HoldButton
            tone={kind === "kesme" ? "danger" : "neutral"}
            disabled={!canHold}
            hint="Onaylamak için basılı tut"
            doneLabel="Talep işlendi"
            onConfirm={() => {
              if (kind === "baglama") {
                const wo = requestReconnect(c.id, reason);
                if (!wo) {
                  setDenied(["Bağlama emri yetkiniz yok"]);
                  return;
                }
                notify({ title: "Bağlama İş Emri Açıldı", body: `${wo.id} · 24 saat hedef süre`, tone: "success" });
              } else {
                const r = requestCut(c.id, reason);
                if (!r.ok) {
                  setDenied(r.blockers);
                  return;
                }
                notify(
                  r.status === "onay-bekliyor"
                    ? { title: "İkinci Göz Onayı Bekleniyor", body: `${r.approval.id} · kesme emri onaylanınca iş emri açılır`, tone: "info" }
                    : { title: "Kesme İş Emri Açıldı", body: r.workOrder.id, tone: "success" },
                );
              }
              setAck(false);
              setDenied([]);
              onClose();
            }}
          >
            {kind === "kesme" ? "Basılı Tutarak Talep Et" : "Basılı Tutarak Bağla"}
          </HoldButton>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Neden" value={reason} onValueChange={(v) => v && setReason(v)} items={WORK_REASONS[kind].map((r) => ({ value: r, label: r }))} />
        {policy ? (
          <div className="grid gap-3">
            <PolicyChecks
              title={policy.eligible ? "Kesme Kurallarına Uygun" : "Kesme Kuralları: Şimdilik Kesilemez"}
              headingLevel={3}
              checks={cutChecks(policy)}
            />
            {policy.noticeAt ? (
              <p className="text-small text-muted">İhtar {dayLabel(policy.noticeAt)}{policy.earliest ? ` · en erken kesme ${dayLabel(policy.earliest)}` : ""}. Gecikme {policy.overdueDays} gün.</p>
            ) : balance > 0 ? (
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (sendNotice(c.id)) notify({ title: "Yazılı İhtar Gönderildi", body: "Bekleme süresi başladı; süre dolunca kesme emri verilebilir.", tone: "success" });
                    else notify({ title: "İhtar Gönderilemedi", body: "Kesme ve bağlama yetkisi gerekir.", tone: "info" });
                  }}
                >
                  <Mail /> Yazılı İhtar Gönder
                </Button>
              </div>
            ) : null}
          </div>
        ) : balance > 0 ? (
          <Alert tone="warning" title={`${tl(balance)} açık bakiye var`}>Borç kapanmadan bağlama için ödeme planı ya da ödeme kaydı beklenir.</Alert>
        ) : null}
        {denied.length ? <Alert tone="danger" title="Emir Verilemedi">{denied.join("; ")}.</Alert> : null}
        <Checkbox label={kind === "kesme" ? "Tebligat süresi doldu ve borç hala açık." : "Bağlama nedeni doğrulandı."} checked={ack} onChange={(e) => setAck(e.target.checked)} />
      </div>
    </Dialog>
  );
}

const REVEAL_REASONS = ["Abone telefonla aradı", "Fatura ya da borç görüşmesi", "Saha ekibine yönlendirme", "Şikayet incelemesi"] as const;

function RevealDialog({ open, onClose, customer: c, onReveal }: { open: boolean; onClose: () => void; customer: Customer; onReveal: () => void }) {
  const { notify } = useApp();
  const [reason, setReason] = useState<string>(REVEAL_REASONS[0]);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Maskeli Bilgiyi Görüntüle"
      description="KVKK: gerekçe yazılır, erişim denetim kaydına düşer."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              revealMasked(c.id, "telefon, e-posta", reason);
              addHistory(c.id, { title: "İletişim Bilgisi Görüntülendi", description: reason, tone: "warning" });
              onReveal();
              notify({ title: "Bilgi Gösteriliyor", body: "Erişim kaydedildi.", tone: "info" });
              onClose();
            }}
          >
            Göster ve Kaydet
          </Button>
        </>
      }
    >
      <Select label="Gerekçe" value={reason} onValueChange={(v) => v && setReason(v)} items={REVEAL_REASONS.map((r) => ({ value: r, label: r }))} />
    </Dialog>
  );
}

function WorkOrderBanner({ work: w, canAct }: { work: WorkOrderX; canAct: boolean }) {
  const { notify } = useApp();
  const label = w.type === "kesme" ? "Enerji kesme" : "Yeniden bağlama";
  const next = WORK_FLOW[Math.min(WORK_FLOW.indexOf(w.status) + 1, WORK_FLOW.length - 1)];
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-wash px-4 py-3 text-base text-body ring-1 ring-warning/20">
      <CalendarClock aria-hidden className="size-5 shrink-0 text-warning" />
      <p className="min-w-0 flex-1">
        <strong className="font-semibold text-strong">{label} iş emri {w.id}: {WORK_STATUS_LABEL[w.status]}.</strong> Planlanan {dayLabel(dayKey(w.scheduled))}. Neden: {w.reason}.{" "}
        <a href={href("workorders", { id: w.id })} className="font-medium text-primary-ink hover:underline">İş emrini aç</a>
      </p>
      {canAct ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              advanceWorkOrder(w.id);
              notify({ title: `İş emri ${WORK_STATUS_LABEL[next].toLocaleLowerCase("tr-TR")} durumuna geçti`, body: w.id, tone: "success" });
            }}
          >
            Sonraki Adım: {WORK_STATUS_LABEL[next]}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { cancelWorkOrder(w.id, "Abone kartından iptal"); notify({ title: "İş Emri İptal Edildi", body: w.id, tone: "info" }); }}>
            İptal Et
          </Button>
        </>
      ) : null}
    </div>
  );
}

/** KVKK sekmesi: açık rıza tercihleri (aç/kapa) ve 30 günlük veri talepleri. */
function KvkkPanel({ customer: c, canEdit }: { customer: Customer; canEdit: boolean }) {
  const { notify } = useApp();
  const consents = useConsents();
  const requests = useDataRequests().filter((r) => r.customerId === c.id);
  const [kind, setKind] = useState<keyof typeof DATA_REQUEST_LABEL>("erisim");
  const kinds = Object.keys(CONSENT_LABEL) as ConsentKind[];
  const give = (k: ConsentKind) => consents.find((x) => x.customerId === c.id && x.kind === k);
  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
      <Panel title="Açık Rıza ve Bilgilendirme" note="Her değişiklik denetim kaydına yazılır" id="detay-riza">
        <div className="grid gap-1 p-4 sm:p-5">
          {kinds.map((k) => {
            const row = give(k);
            return (
              <Switch
                key={k}
                label={CONSENT_LABEL[k]}
                hint={row ? `${row.given ? "Verildi" : "Geri alındı"} · ${dayLabel(row.at)} · ${row.channel === "sube" ? "şube" : row.channel === "web" ? "web" : row.channel === "cagri" ? "çağrı merkezi" : "mobil"}` : "Kayıt yok"}
                checked={row?.given ?? false}
                disabled={!canEdit}
                onChange={(e) => {
                  setConsent(c.id, k, e.target.checked);
                  notify({ title: e.target.checked ? "Rıza kaydedildi" : "Rıza geri alındı", body: CONSENT_LABEL[k], tone: "success" });
                }}
              />
            );
          })}
        </div>
      </Panel>
      <Panel title="Veri Talepleri" note="Yanıt süresi 30 gün (örnek parametre)" id="detay-veri-talebi">
        <div className="grid gap-4 p-4 sm:p-5">
          {requests.length === 0 ? (
            <p className="text-small text-muted">Bu abone için açık ya da kapanmış veri talebi yok.</p>
          ) : (
            <ul className="grid gap-2">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-base">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-strong">{DATA_REQUEST_LABEL[r.kind]}</span>
                    <span className="kz-mono text-small text-muted">{r.id} · son yanıt {dayLabel(r.dueAt)}</span>
                  </span>
                  <Badge tone={r.status === "tamam" ? "success" : r.status === "isleniyor" ? "primary" : "warning"}>{r.status === "tamam" ? "Tamam" : r.status === "isleniyor" ? "İşleniyor" : "Açık"}</Badge>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Select label="Yeni Veri Talebi" value={kind} onValueChange={(v) => v && setKind(v as keyof typeof DATA_REQUEST_LABEL)} items={Object.entries(DATA_REQUEST_LABEL).map(([value, label]) => ({ value, label }))} />
              <Button
                variant="secondary"
                onClick={() => {
                  const r = createDataRequest(c.id, kind);
                  notify({ title: "Veri Talebi Açıldı", body: `${r.id} · ${DATA_REQUEST_LABEL[kind]}`, tone: "success" });
                }}
              >
                <ShieldCheck /> Talebi Aç
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** 12 dönemlik tüketimde belirgin çöküş (medyanın %40 altı): nedeni okuma kaynağından ve bayraklardan açıklar. */
function usageAnomaly(usage: readonly number[], readings: readonly { period: string; source: keyof typeof SOURCE_LABEL; flags: readonly (keyof typeof FLAG_LABEL)[] }[], kind: Customer["kind"]) {
  const values = usage.filter((v) => v > 0).sort((a, b) => a - b);
  if (values.length < 6) return null;
  const median = values[Math.floor(values.length / 2)];
  const idx = usage.findIndex((v) => v > 0 && v < median * 0.4);
  if (idx < 0) return null;
  const period = PERIODS_12[idx];
  const label = `${monthShort.format(parseDay(`${period}-01`))} ${period.slice(0, 4)}`;
  const r = readings.find((x) => x.period === period);
  const explanation = r?.source === "tahmini"
    ? "Bu dönem tahmini okumayla faturalandı; sonraki gerçek okuma farkı düzeltme faturasıyla mahsup eder."
    : r?.flags.length
      ? `Okumada bayrak var: ${r.flags.map((f) => FLAG_LABEL[f]).join(", ")}. Saha kontrolü önerilir.`
      : kind === "tarim"
        ? "Sulama sezonu dışı bir dönem olabilir; mevsimsel düşüş beklenir."
        : "Okumada bayrak yok. Konut boşalmış, sayaç hatası ya da kaçak olasılığı için saha kontrolü açılabilir.";
  return { label, dropPct: ((median - usage[idx]) / median) * 100, explanation };
}

function MergeDialog({ open, onClose, customer: c, other, go }: { open: boolean; onClose: () => void; customer: Customer; other?: Customer; go: PageProps["go"] }) {
  const { notify } = useApp();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Yinelenen Kayıt Kontrolü"
      description={other ? "Aynı ada sahip başka bir aktif kayıt bulundu." : "Ad, kimlik ve adres eşleşmesi taranır."}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Kapat
          </Button>
          {other ? (
            <>
              <Button variant="secondary" onClick={() => { onClose(); go("customers", { id: other.id }); }}>
                Diğer Kaydı Aç
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  addHistory(c.id, { title: "Birleştirme Talebi", description: `${other.id} ile`, tone: "warning" });
                  notify({ title: "Birleştirme Talebi Oluşturuldu", body: "Veri yönetimi ekibi iki kaydı inceleyecek.", tone: "success" });
                  onClose();
                }}
              >
                Birleştirme Talebi Aç
              </Button>
            </>
          ) : null}
        </>
      }
    >
      {other ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[c, other].map((x, i) => (
            <div key={x.id} className="rounded-xl bg-surface p-4 text-base">
              <p className="text-small font-medium text-muted">{i === 0 ? "Bu kayıt" : "Eşleşen kayıt"}</p>
              <p className="mt-1 font-semibold text-strong">{x.name}</p>
              <p className="kz-mono text-small text-muted">
                {x.id} · Tesisat {x.installation}
              </p>
              <p className="mt-2 text-body">{x.address}</p>
              <p className="mt-1 text-small text-muted">{KIND_LABEL[x.kind]} · {region(x.regionId).name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-success-wash p-4 text-base text-body">Aynı ada sahip başka aktif kayıt yok. Kimlik karşılaştırması KVKK nedeniyle yalnız kayıt sırasında yapılır.</p>
      )}
    </Dialog>
  );
}

function CloseDialog({ open, onClose, customer: c, balance, metersCount }: { open: boolean; onClose: () => void; customer: Customer; balance: number; metersCount: number }) {
  const { notify } = useApp();
  const [settled, setSettled] = useState(false);
  const [meterOk, setMeterOk] = useState(false);
  const blocked = balance > 0 && !settled;
  const ready = !blocked && meterOk;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Aboneliği Kapat"
      description="Kapatılan abonelik geri açılamaz; yeni kayıt gerekir."
      dismissible={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <HoldButton
            tone="danger"
            disabled={!ready}
            doneLabel="Abonelik kapatıldı"
            hint="Kapatmak için basılı tut"
            onConfirm={() => {
              const orders = metersFor(c.id).map((m) => createWorkOrder({ type: "sokum", customerId: c.id, meterId: m.id, reason: `Abonelik kapanışı: ${m.serial} söküm ve son endeks`, scheduled: undefined }));
              patchCustomer(c.id, { closed: true, pendingWork: null, supplierChange: null }, { title: "Abonelik Kapatıldı", description: orders.length ? `Söküm iş emri: ${orders.map((o) => o.id).join(", ")}` : "Sayaç yok", tone: "danger" });
              notify({ title: "Abonelik Kapatıldı", body: `${c.id} · ${orders.length} sayaç için söküm iş emri açıldı.`, tone: "success" });
              onClose();
            }}
          >
            Basılı Tutarak Kapat
          </HoldButton>
        </>
      }
    >
      <div className="grid gap-4">
        {balance > 0 ? (
          <Alert tone="danger" title={`${tl(balance)} açık bakiye var`}>Kapatmadan önce tahsil edilmeli ya da kapanış faturasına mahsup edilmelidir.</Alert>
        ) : (
          <p className="rounded-lg bg-success-wash p-3 text-base text-body">Açık bakiye yok.</p>
        )}
        {balance > 0 ? <Checkbox label="Bakiye tahsil edildi ya da kapanış faturasına mahsup edildi." checked={settled} onChange={(e) => setSettled(e.target.checked)} /> : null}
        <Checkbox label={`${metersCount} sayacın son endeksi okundu ve söküm iş emri verilecek.`} checked={meterOk} onChange={(e) => setMeterOk(e.target.checked)} />
      </div>
    </Dialog>
  );
}
