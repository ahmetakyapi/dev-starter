"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Download,
  Eye,
  EyeOff,
  Gauge,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Power,
  PowerOff,
  Receipt,
  Repeat,
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
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { TabLinks } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TickMeter } from "@/components/ui/tick-meter";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
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
  TODAY_KEY,
  balanceOf,
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
  isRisky,
  findCustomer,
  metersFor,
  notesOf,
  patchCustomer,
  patchOf,
  validEmail,
  validPhone,
  useCustomerStore,
  type ListQuery,
} from "./_data-musteri";
import { InvoiceBadge, CustomerBadge, MeterBadge, PageBody, PageHead, Panel, ReadingBadge, SampleNote, href, useApp, type PageProps, type Params } from "./_ui";

const PAGE_SIZE = 20;

const TABS = [
  { id: "", label: "Hepsi" },
  { id: "serbest", label: "Serbest Tüketici" },
  { id: "gorevli", label: "Görevli Tedarik" },
  { id: "riskli", label: "Riskli" },
  { id: "kesik", label: "Enerjisi Kesik" },
] as const;

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
      <PageHead title="Müşteriler" description="Abone kayıtları, tesisat ve sözleşme bilgileri." />
      <PageBody>
        <EmptyState
          icon={<Users />}
          title={`${id} numaralı abone bulunamadı`}
          hint="Numara yanlış olabilir ya da kayıt arşive alınmıştır."
          action={
            <a className={buttonClass({ variant: "secondary" })} href={href("customers")}>
              Müşteri listesine dön
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

function Cell({ icon, label, value, foot }: { icon: ReactNode; label: string; value: ReactNode; foot?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 p-4">
      <div className="flex items-center gap-2 text-small font-medium text-muted">
        <span aria-hidden className="text-muted [&_svg]:size-4">
          {icon}
        </span>
        {label}
      </div>
      <div className="text-heading font-semibold tracking-tight text-strong tabular-nums">{value}</div>
      {foot ? <div className="text-small text-muted">{foot}</div> : null}
    </div>
  );
}

function MusteriListesi({ params, go }: { params: Params; go: PageProps["go"] }) {
  const { notify } = useApp();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<"sms" | "tag" | null>(null);
  const [reset, setReset] = useState(0);

  const all = allCustomers();
  const query: ListQuery = {
    q: params.q ?? "",
    status: params.status ?? "",
    kind: params.kind ?? "",
    volt: params.volt ?? "",
    region: params.region ?? "",
    supplier: params.supplier ?? "",
    sort: params.sort ?? "id",
    dir: params.dir === "desc" ? "desc" : "asc",
  };
  const rows = useMemo(() => filterCustomers(all, query), [all, query.q, query.status, query.kind, query.volt, query.region, query.supplier, query.sort, query.dir]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    "": all.length,
    serbest: all.filter((c) => c.free).length,
    gorevli: all.filter((c) => !c.free).length,
    riskli: all.filter(isRisky).length,
    kesik: all.filter((c) => c.status === "kesik").length,
  } as Record<string, number>;
  const autoPay = all.filter((c) => c.autoPay).length;
  const filtered = Boolean(query.q || query.kind || query.volt || query.region || query.supplier || query.status);

  const set = (patch: Record<string, string | undefined>) => go("customers", { ...params, id: undefined, page: undefined, ...patch });
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
    notify({ title: "Liste indirildi", body: `${chosen.length} abone, KVKK gereği kimlik ve iletişim alanları olmadan.`, tone: "success" });
  }

  const columns: Column<Customer>[] = [
    {
      key: "select",
      width: "3rem",
      header: (
        <Checkbox
          aria-label="Bu sayfadaki bütün aboneleri seç"
          checked={pageAllSelected}
          onChange={(e) => setSelected((prev) => {
            const next = new Set(prev);
            for (const c of pageRows) (e.target.checked ? next.add(c.id) : next.delete(c.id));
            return next;
          })}
        />
      ),
      render: (c) => <Checkbox aria-label={`${c.name} aboneliğini seç`} checked={selected.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} />,
    },
    {
      key: "name",
      header: "Müşteri",
      sortable: true,
      sortValue: (c) => c.name,
      width: "17rem",
      render: (c) => (
        <div className="min-w-0">
          <a href={href("customers", { id: c.id })} className="block truncate font-medium text-strong hover:underline">
            {c.name}
          </a>
          <span className="edas-mono text-small text-muted">
            {c.id} · Tesisat {c.installation}
          </span>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Tür",
      render: (c) => (
        <div>
          <span className="text-body">{KIND_LABEL[c.kind]}</span>
          <span className="block text-small text-muted">{c.voltage === "OG" ? "Orta gerilim" : "Alçak gerilim"}</span>
        </div>
      ),
    },
    { key: "region", header: "Bölge", sortable: true, sortValue: (c) => c.regionId, render: (c) => `${region(c.regionId).name} · ${c.district}` },
    {
      key: "supplier",
      header: "Tedarikçi",
      render: (c) => (
        <div className="min-w-0">
          <span className="block truncate text-body">{supplier(c.supplierId).name}</span>
          <span className="text-small text-muted">{c.free ? "Serbest tüketici" : "Görevli tedarik"}</span>
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
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          <CustomerBadge status={c.status} />
          {isRisky(c) && c.status === "aktif" ? <Badge tone="warning">Riskli</Badge> : null}
        </div>
      ),
    },
  ];

  const items: RecordItem[] = pageRows.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: `${c.id} · ${KIND_LABEL[c.kind]} · ${c.voltage}`,
    leading: <Avatar name={c.name} size="sm" />,
    value: accountOf(c.id).balance > 0 ? tl(accountOf(c.id).balance) : kwh(c.baseKwh),
    meta: `${region(c.regionId).name} · ${c.district}`,
    status: <CustomerBadge status={c.status} />,
    href: href("customers", { id: c.id }),
    actions: <Checkbox aria-label={`${c.name} aboneliğini seç`} checked={selected.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} />,
  }));

  return (
    <>
      <PageHead
        title="Müşteriler"
        description={`${num.format(all.length)} abone kaydı. Tesisat, sayaç, fatura ve sözleşme tek yerden.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => notify({ title: "Rapor hazırlanıyor", body: "Müşteri envanteri raporu Raporlar sayfasında hazır olacak.", tone: "info" })}>
              <Download /> Envanter Raporu
            </Button>
            <a className={buttonClass({ variant: "primary" })} href={href("register")}>
              <UserPlus /> Yeni Müşteri
            </a>
          </>
        }
      />
      <PageBody>
        <div className="edas-strip overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line [&>*]:min-w-0">
          <Cell icon={<Users />} label="Toplam Abone" value={num.format(all.length)} foot={KINDS.map((k) => `${KIND_LABEL[k]} ${all.filter((c) => c.kind === k).length}`).join(" · ")} />
          <Cell icon={<Building2 />} label="Serbest Tüketici" value={num.format(counts.serbest)} foot={`${Math.round((counts.serbest / all.length) * 100)}% tedarikçisini seçmiş`} />
          <Cell icon={<Wallet />} label="Otomatik Ödeme" value={`%${Math.round((autoPay / all.length) * 100)}`} foot={`${num.format(autoPay)} talimat`} />
          <Cell icon={<TriangleAlert />} label="Riskli Abone" value={num.format(counts.riskli)} foot="Geciken fatura ya da sayaç şüphesi" />
          <Cell icon={<PowerOff />} label="Enerjisi Kesik" value={num.format(counts.kesik)} foot="Yeniden bağlama bekleyenler dahil" />
          <Cell icon={<Gauge />} label="Okunan Sayaç" value={`%${Math.round((all.filter((c) => metersFor(c.id).every((m) => m.status === "okunuyor")).length / all.length) * 100)}`} foot="Tüm sayaçları sağlıklı aboneler" />
        </div>

        <Panel
          title="Abone Listesi"
          note={filtered ? `${num.format(rows.length)} sonuç, ${num.format(all.length)} abone içinde` : "Arama, süzgeç ve sıralama adresle birlikte durur."}
          id="musteri-liste"
        >
          <div className="space-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
            <TabLinks
              aria-label="Abone grupları"
              current={listHref(params, { status: query.status || undefined, page: undefined })}
              items={TABS.map((t) => ({ href: listHref(params, { status: t.id || undefined, page: undefined }), label: `${t.label} ${num.format(counts[t.id])}` }))}
              className="max-w-full"
            />
            <SearchField
              key={`q-${reset}`}
              label="Abone ara"
              placeholder="Ad, abone no, tesisat no, sayaç seri no, kimlik/VKN"
              defaultValue={query.q}
              resultCount={filtered ? rows.length : undefined}
              onSearch={(value) => set({ q: value || undefined })}
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Select
                label="Tür"
                value={query.kind || "all"}
                onValueChange={(v) => set({ kind: v && v !== "all" ? v : undefined })}
                items={[{ value: "all", label: "Hepsi" }, ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))]}
              />
              <Select
                label="Gerilim"
                value={query.volt || "all"}
                onValueChange={(v) => set({ volt: v && v !== "all" ? v : undefined })}
                items={[{ value: "all", label: "Hepsi" }, { value: "AG", label: "Alçak (AG)" }, { value: "OG", label: "Orta (OG)" }]}
              />
              <Select
                label="Bölge"
                value={query.region || "all"}
                onValueChange={(v) => set({ region: v && v !== "all" ? v : undefined })}
                items={[{ value: "all", label: "Hepsi" }, ...REGIONS.map((r) => ({ value: r.id, label: r.name }))]}
              />
              <Select
                label="Tedarikçi"
                value={query.supplier || "all"}
                onValueChange={(v) => set({ supplier: v && v !== "all" ? v : undefined })}
                items={[{ value: "all", label: "Hepsi" }, ...SUPPLIERS.map((s) => ({ value: s.id, label: s.name }))]}
              />
            </div>
            {filtered ? (
              <div className="flex flex-wrap items-center gap-2 text-small text-muted">
                <span>{num.format(rows.length)} abone listeleniyor.</span>
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-medium text-primary-ink hover:underline"
                  onClick={() => {
                    setReset((n) => n + 1);
                    go("customers", {});
                  }}
                >
                  <X className="size-3.5" /> Süzgeçleri temizle
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-md:hidden">
            <DataTable<Customer>
              caption="Abone listesi"
              columns={columns}
              rows={pageRows}
              rowKey={(c) => c.id}
              sort={{ key: query.sort, dir: query.dir }}
              sortHref={(key, dir) => listHref(params, { sort: key, dir, page: undefined })}
              density="comfortable"
              on="surface"
              stickyFirst={false}
              minWidth="64rem"
              empty={
                <EmptyState
                  variant="inline"
                  title="Bu süzgece uyan abone yok."
                  hint="Aramayı kısaltın ya da süzgeçleri temizleyin."
                  action={
                    <a className={buttonClass({ variant: "secondary", size: "sm" })} href={href("customers")}>
                      Süzgeçleri temizle
                    </a>
                  }
                />
              }
            />
          </div>
          <div className="md:hidden">
            {items.length ? <RecordList label="Abone listesi" items={items} /> : <EmptyState variant="inline" title="Bu süzgece uyan abone yok." hint="Süzgeçleri temizleyin." className="px-4" />}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
            <p className="text-small text-muted">
              {rows.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} / ${num.format(rows.length)}` : "0 sonuç"}
              {selected.size ? ` · ${selected.size} seçili` : ""}
            </p>
            <Pagination page={page} pageCount={pageCount} hrefFor={(n) => listHref(params, { page: n > 1 ? String(n) : undefined })} scroll={false} />
          </div>
        </Panel>
        <SampleNote />
      </PageBody>

      {selected.size > 0 ? (
        <SelectionBar count={selected.size} noun="abone" onClear={() => setSelected(new Set())}>
          <SelectionAction icon={<MessageSquare />} onClick={() => setDialog("sms")}>
            SMS Gönder
          </SelectionAction>
          <SelectionAction icon={<Tag />} onClick={() => setDialog("tag")}>
            Etiketle
          </SelectionAction>
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
  { value: "fatura", label: "Fatura hatırlatma", text: "Sayın abonemiz, son ödeme tarihi yaklaşan elektrik faturanız bulunmaktadır. Ödeme için portalımızı ya da yetkili noktaları kullanabilirsiniz." },
  { value: "okuma", label: "Okuma günü bilgilendirme", text: "Sayın abonemiz, sayacınız bu hafta okunacaktır. Sayaca erişimin açık olması işlemin zamanında tamamlanmasını sağlar." },
  { value: "kesinti", label: "Planlı kesinti duyurusu", text: "Sayın abonemiz, bölgenizde şebeke bakım çalışması yapılacaktır. Ayrıntılar için çağrı merkezimizi arayabilirsiniz." },
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
              for (const c of customers.slice(0, 40)) addHistory(c.id, { title: "SMS gönderildi", description: text.length > 60 ? `${text.slice(0, 60)}…` : text, tone: "neutral" });
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
              for (const c of customers.slice(0, 40)) addHistory(c.id, { title: "Etiket eklendi", description: picked.join(", "), tone: "primary" });
              notify({ title: "Etiketler eklendi", body: `${customers.length} aboneye ${picked.length} etiket uygulandı.`, tone: "success" });
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
 *  MÜŞTERİ 360 AYRINTISI
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

type DetailDialog = "contact" | "supplier" | "work" | "tariff" | "close" | "merge" | null;

function MusteriDetay({ customer: c, go }: { customer: Customer; go: PageProps["go"] }) {
  const { notify } = useApp();
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState<DetailDialog>(null);
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState("");

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

  const usageByPeriod = PERIODS_12.map((p) => readings.filter((r) => r.period === p).reduce((sum, r) => sum + r.usage.total, 0));
  const hasUsage = usageByPeriod.some((v) => v > 0);
  const lastUsage = usageByPeriod[usageByPeriod.length - 1] || usageByPeriod[usageByPeriod.length - 2] || 0;
  const avg12 = hasUsage ? Math.round(usageByPeriod.reduce((a, b) => a + b, 0) / usageByPeriod.filter((v) => v > 0).length) : 0;
  const lastInvoice = invoices.at(-1);
  const dup = useMemo(
    () => allCustomers().find((o) => o.id !== c.id && o.status !== "kapali" && o.name.toLocaleLowerCase("tr-TR") === c.name.toLocaleLowerCase("tr-TR")),
    [c.id, c.name],
  );

  const shown = revealed ? unmasked(c) : { phone: c.phone, email: c.email };
  const events: TimelineEvent[] = [
    ...historyOf(c.id).map((h) => ({ id: h.id, at: h.at, when: h.when, title: h.title, description: h.description, tone: h.tone })),
    ...invoices.slice(-3).reverse().map((i) => ({ id: `i-${i.id}`, at: i.issued, when: dayLabel(i.issued), title: `${i.id} numaralı fatura kesildi`, description: `${tl(i.total)} · vade ${dayLabel(i.due)}`, tone: (i.status === "gecikti" ? "danger" : "neutral") as TimelineEvent["tone"] })),
    ...payments.slice(-2).reverse().map((p) => ({ id: `p-${p.id}`, at: p.date, when: dayLabel(p.date), title: "Ödeme alındı", description: `${tl(p.amount)} · ${CHANNEL_LABEL[p.channel]}`, tone: "success" as const })),
    { id: "since", at: c.since, when: fullDate.format(parseDay(c.since)), title: "Abonelik açıldı", description: `${region(c.regionId).name}, ${c.district}`, tone: "primary" as const },
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const actions: { id: Exclude<DetailDialog, null>; icon: ReactNode; title: string; hint: string; disabled?: boolean }[] = [
    { id: "contact", icon: <Pencil />, title: "İletişim bilgilerini güncelle", hint: "Telefon ve e-posta; doğrulama koduyla teyit edilir." },
    { id: "tariff", icon: <Receipt />, title: "Tarife ve adres değişikliği", hint: "Zaman dilimi tarifesi ve fatura adresi." },
    { id: "supplier", icon: <Repeat />, title: "Tedarikçi değişikliği başlat", hint: c.free ? "Serbest tüketici: perakende satış şirketi seçilebilir." : "Serbest tüketici değil: görevli tedarik şirketi.", disabled: !c.free || closed },
    { id: "work", icon: c.status === "kesik" ? <Power /> : <PowerOff />, title: c.status === "kesik" ? "Yeniden bağlama talebi" : "Enerji kesme talebi", hint: "İş emri oluşturur; onay gerektirir.", disabled: closed },
    { id: "merge", icon: <Users />, title: "Yinelenen kayıt kontrolü", hint: dup ? `Aynı adla başka kayıt var: ${dup.id}.` : "Olası yinelenen kayıt bulunmadı." },
    { id: "close", icon: <X />, title: "Aboneliği kapat", hint: "Geri alınamaz; bakiye ve sayaç durumu kontrol edilir.", disabled: closed },
  ];

  return (
    <>
      <PageHead
        title="Müşteriler"
        crumb={`${c.id} · ${c.name}`}
        description={`${KIND_LABEL[c.kind]} aboneliği · ${c.voltage === "OG" ? "Orta" : "Alçak"} gerilim · ${region(c.regionId).name}, ${c.district}`}
        actions={
          <>
            <a className={buttonClass({ variant: "ghost" })} href={href("customers")}>
              <ArrowLeft /> Listeye Dön
            </a>
            <Button variant="secondary" onClick={() => setDialog("contact")}>
              <Pencil /> Bilgileri Güncelle
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                addHistory(c.id, { title: "SMS gönderildi", description: "Fatura bilgilendirme mesajı", tone: "neutral" });
                notify({ title: "SMS gönderildi", body: "Kayıtlı telefona fatura bilgilendirmesi iletildi.", tone: "success" });
              }}
            >
              <MessageSquare /> SMS Gönder
            </Button>
          </>
        }
      />
      <PageBody>
        {patch?.pendingWork ? (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-wash px-4 py-3 text-base text-body ring-1 ring-warning/20">
            <CalendarClock aria-hidden className="size-5 shrink-0 text-warning" />
            <p className="min-w-0 flex-1">
              <strong className="font-semibold text-strong">{patch.pendingWork.kind === "kesme" ? "Enerji kesme" : "Yeniden bağlama"} talebi açık.</strong> Planlanan tarih {dayLabel(patch.pendingWork.date)}. Neden: {patch.pendingWork.reason}.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const w = patch.pendingWork!;
                patchCustomer(c.id, { pendingWork: null, status: w.kind === "kesme" ? "kesik" : "aktif" }, { title: w.kind === "kesme" ? "Enerji kesildi" : "Enerji yeniden bağlandı", description: "Saha ekibi iş emrini tamamladı (demo).", tone: w.kind === "kesme" ? "danger" : "success" });
                notify({ title: w.kind === "kesme" ? "Enerji kesildi" : "Enerji bağlandı", body: "İş emri tamamlandı olarak işaretlendi.", tone: "success" });
              }}
            >
              İş Emrini Tamamla (demo)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => patchCustomer(c.id, { pendingWork: null }, { title: "Talep iptal edildi", tone: "neutral" })}>
              Talebi İptal Et
            </Button>
          </div>
        ) : null}
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
                patchCustomer(c.id, { supplierId: s.supplierId, supplierChange: null }, { title: "Tedarikçi değişti", description: supplier(s.supplierId).name, tone: "success" });
                notify({ title: "Tedarikçi değişikliği tamamlandı", body: supplier(s.supplierId).name, tone: "success" });
              }}
            >
              Yürürlüğe Al (demo)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => patchCustomer(c.id, { supplierChange: null }, { title: "Tedarikçi değişikliği iptal edildi", tone: "neutral" })}>
              İptal Et
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-3">
          <section aria-label="Abone kartı" className="flex min-w-0 flex-col gap-4 rounded-xl bg-overlay p-5 shadow-raised ring-1 ring-line xl:col-span-1">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-read font-semibold text-strong">{c.name}</h2>
                <p className="edas-mono text-small text-muted">
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
              <div className="flex items-start gap-2.5">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-small text-muted">Telefon</dt>
                  <dd className="edas-mono text-strong">{shown.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-small text-muted">E-posta</dt>
                  <dd className="break-all text-strong">{shown.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-small text-muted">Adres</dt>
                  <dd className="text-strong">{c.address}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Receipt aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <dt className="text-small text-muted">{c.kind === "bireysel" ? "T.C. Kimlik No" : "Vergi Kimlik No"}</dt>
                  <dd className="edas-mono text-strong">{c.taxMasked}</dd>
                </div>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
              <p className="text-small text-muted">{revealed ? "Maskesiz gösteriliyor, erişim kaydedildi." : "KVKK: kimlik ve iletişim alanları maskeli."}</p>
              <Button
                size="sm"
                variant="secondary"
                aria-pressed={revealed}
                onClick={() => {
                  if (!revealed) addHistory(c.id, { title: "İletişim bilgisi görüntülendi", description: "Aylin Yıldırım, KVKK erişim kaydı", tone: "warning" });
                  setRevealed((v) => !v);
                }}
              >
                {revealed ? <EyeOff /> : <Eye />} {revealed ? "Maskele" : "Göster"}
              </Button>
            </div>
            <Switch
              label="Otomatik ödeme talimatı"
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
            <div className="grid grid-cols-1 divide-y divide-line-soft overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 [&>*]:min-w-0">
              <Cell icon={<Wallet />} label="Açık Bakiye" value={account.balance > 0 ? tl(account.balance) : "Yok"} foot={account.overdue ? `${account.overdue} geciken fatura` : "Gecikme yok"} />
              <Cell icon={<Receipt />} label="Son Fatura" value={lastInvoice ? tl(lastInvoice.total) : "—"} foot={lastInvoice ? `${lastInvoice.id} · vade ${dayLabel(lastInvoice.due)}` : "Henüz fatura yok"} />
              <Cell icon={<Gauge />} label="Son Dönem Tüketim" value={hasUsage ? kwh(lastUsage) : "—"} foot={hasUsage ? `12 ay ortalama ${kwh(avg12)}` : "Henüz okuma yok"} />
            </div>

            <Tabs
              aria-label="Müşteri ayrıntıları"
              value={tab}
              onValueChange={setTab}
              items={[
                {
                  value: "overview",
                  label: "Genel Bakış",
                  panel: (
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5">
                      {account.overdue > 0 ? (
                        <Alert tone="danger" title={`${account.overdue} faturası vadesini geçti`}>
                          Toplam gecikmiş bakiye {tl(account.balance)}. Ödeme planı önerilebilir ya da kesme süreci başlatılabilir.
                        </Alert>
                      ) : null}
                      {meters.some((m) => m.status !== "okunuyor") ? (
                        <Alert tone="warning" title="Sayaçta sorun var">
                          {meters.filter((m) => m.status !== "okunuyor").map((m) => `${m.serial}: ${m.status === "iletisim-yok" ? "iletişim yok" : m.status === "arizali" ? "arızalı" : "müdahale şüphesi"}`).join("; ")}.
                        </Alert>
                      ) : null}
                      <Panel title="Aylık Tüketim" note="Son 12 dönem, kWh (çarpan dahil)" id="detay-tuketim">
                        <div className="p-4 sm:p-5">
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
                                  <a href={href("meters", { id: m.id })} className="edas-mono font-medium text-strong hover:underline">
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
                                    <td className="edas-mono px-2 py-2.5 text-right text-body">{kwh(r.usage.total)}</td>
                                    <td className="edas-mono px-2 py-2.5 text-right text-body">{num.format(r.demandKw)} kW</td>
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
                                  <a href={href("invoices", { id: i.id })} className="edas-mono font-medium text-strong hover:underline">
                                    {i.id}
                                  </a>
                                  <p className="text-small text-muted">
                                    {monthShort.format(parseDay(`${i.period}-01`))} {i.period.slice(0, 4)} · {kwh(i.usageKwh)} · vade {dayLabel(i.due)}
                                  </p>
                                </div>
                                <span className="edas-mono text-strong">{tl(i.total)}</span>
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
                            <TickMeter label="Ödenen taksit" value={Math.round((plan.paid / plan.total) * plan.installments)} max={plan.installments} text={`${tl(plan.paid)} / ${tl(plan.total)}`} />
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
                                  <p className="edas-mono text-small text-muted">
                                    {dayLabel(p.date)} · {p.reference} · fatura {p.invoiceId}
                                  </p>
                                </div>
                                <span className="edas-mono text-strong">{tl(p.amount)}</span>
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
                    </div>
                  ),
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
                          <Textarea label="Yeni not" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} hint="Müşteri görüşmesi, saha bilgisi, takip kararı." />
                          <div>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!note.trim()}
                              onClick={() => {
                                addNote(c.id, note.trim());
                                setNote("");
                                notify({ title: "Not eklendi", tone: "success" });
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
        <p className="flex items-center gap-2 text-small text-muted">
          <History aria-hidden className="size-4" />
          Bu ekrandaki değişiklikler yalnız demo oturumunda tutulur.
        </p>
        <SampleNote />
      </PageBody>

      <ContactDialog open={dialog === "contact"} onClose={() => setDialog(null)} customer={c} />
      <TariffDialog open={dialog === "tariff"} onClose={() => setDialog(null)} customer={c} />
      <SupplierDialog open={dialog === "supplier"} onClose={() => setDialog(null)} customer={c} />
      <WorkDialog open={dialog === "work"} onClose={() => setDialog(null)} customer={c} balance={account.balance} />
      <MergeDialog open={dialog === "merge"} onClose={() => setDialog(null)} customer={c} other={dup} go={go} />
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
      { title: "İletişim bilgisi güncellendi", description: [phone && "telefon", email && "e-posta"].filter(Boolean).join(" ve "), tone: "primary" },
    );
    notify({ title: "İletişim bilgisi güncellendi", body: "Yeni bilgi doğrulama koduyla teyit edilecek.", tone: "success" });
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
        <Input label="Yeni telefon" inputMode="tel" placeholder="05XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError} data-autofocus />
        <Input label="Yeni e-posta" type="email" placeholder="ad@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
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
              patchCustomer(c.id, { tariff, address: address.trim() }, { title: "Tarife ve adres güncellendi", description: tariff === "tek-zamanli" ? "Tek zamanlı tarife" : "Çok zamanlı tarife", tone: "primary" });
              notify({ title: "Değişiklik kaydedildi", body: "Sayaç tarife tablosu bir sonraki okumada güncellenir.", tone: "success" });
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
          label="Tarife tipi"
          value={tariff}
          onValueChange={(v) => v && setTariff(v as Customer["tariff"])}
          items={[{ value: "tek-zamanli", label: "Tek zamanlı" }, { value: "cok-zamanli", label: "Çok zamanlı (T1 gündüz, T2 puant, T3 gece)" }]}
        />
        <Textarea label="Fatura adresi" value={address} onChange={(e) => setAddress(e.target.value)} minRows={2} error={bad ? "Adres en az 8 karakter olmalı." : undefined} />
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
              patchCustomer(c.id, { supplierChange: { supplierId: pick, date: "2026-12-01" } }, { title: "Tedarikçi değişikliği başlatıldı", description: chosen?.name, tone: "primary" });
              notify({ title: "Değişiklik başlatıldı", body: `${chosen?.name} · yürürlük 1 Ara`, tone: "success" });
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
          label="Yeni tedarikçi"
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

function WorkDialog({ open, onClose, customer: c, balance }: { open: boolean; onClose: () => void; customer: Customer; balance: number }) {
  const { notify } = useApp();
  const kind = c.status === "kesik" ? "baglama" : "kesme";
  const [reason, setReason] = useState<string>(WORK_REASONS[kind][0]);
  const [date, setDate] = useState("2026-11-23");
  const [ack, setAck] = useState(false);
  const dateError = date < TODAY_KEY ? "Tarih bugünden önce olamaz." : undefined;
  const risky = kind === "kesme" && reason === "Ödenmemiş fatura" && balance === 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={kind === "kesme" ? "Enerji Kesme Talebi" : "Yeniden Bağlama Talebi"}
      description="Talep bir saha iş emri oluşturur. Basılı tutarak onaylayın."
      dismissible={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <HoldButton
            tone={kind === "kesme" ? "danger" : "neutral"}
            disabled={!ack || Boolean(dateError)}
            hint="Onaylamak için basılı tut"
            doneLabel="Talep açıldı"
            onConfirm={() => {
              patchCustomer(c.id, { pendingWork: { id: `W-${Date.now() % 100000}`, kind, reason, date } }, { title: kind === "kesme" ? "Enerji kesme talebi açıldı" : "Yeniden bağlama talebi açıldı", description: `${reason} · ${dayLabel(date)}`, tone: kind === "kesme" ? "warning" : "primary" });
              notify({ title: "İş emri oluşturuldu", body: `${kind === "kesme" ? "Kesme" : "Bağlama"} · ${dayLabel(date)}`, tone: "success" });
              setAck(false);
              onClose();
            }}
          >
            {kind === "kesme" ? "Basılı Tutarak Kes" : "Basılı Tutarak Bağla"}
          </HoldButton>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Neden" value={reason} onValueChange={(v) => v && setReason(v)} items={WORK_REASONS[kind].map((r) => ({ value: r, label: r }))} />
        <Input label="Planlanan tarih" type="date" value={date} min={TODAY_KEY} onChange={(e) => setDate(e.target.value)} error={dateError} />
        {risky ? <Alert tone="warning" title="Açık borç görünmüyor">Bu abonenin açık bakiyesi yok; kesme nedeni ile kayıt çelişiyor olabilir.</Alert> : null}
        {kind === "kesme" && c.kind === "bireysel" ? <Alert tone="warning" title="Hassas abone kontrolü">Kesmeden önce tıbbi cihaz bağımlılığı ve tebligat sürelerinin tamamlandığı doğrulanmalıdır (örnek kural).</Alert> : null}
        <Checkbox label={kind === "kesme" ? "Tebligat süresi doldu ve borç hâlâ açık." : "Bağlama nedeni doğrulandı."} checked={ack} onChange={(e) => setAck(e.target.checked)} />
      </div>
    </Dialog>
  );
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
                  addHistory(c.id, { title: "Birleştirme talebi", description: `${other.id} ile`, tone: "warning" });
                  notify({ title: "Birleştirme talebi oluşturuldu", body: "Veri yönetimi ekibi iki kaydı inceleyecek.", tone: "success" });
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
              <p className="edas-mono text-small text-muted">
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
              patchCustomer(c.id, { closed: true, pendingWork: null, supplierChange: null }, { title: "Abonelik kapatıldı", description: "Sayaç söküm iş emri oluşturuldu.", tone: "danger" });
              notify({ title: "Abonelik kapatıldı", body: `${c.id} · sayaç söküm iş emri açıldı.`, tone: "success" });
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
