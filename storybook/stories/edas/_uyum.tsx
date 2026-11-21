"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, Download, Eye, FileLock2, ShieldCheck, UserCog, X } from "lucide-react";
import { AuditLog, type AuditEntry } from "@/components/ui/audit-log";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { Select } from "@/components/ui/select";
import { StatusList } from "@/components/ui/status-list";
import { Switch } from "@/components/ui/switch";
import { TabLinks } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TODAY, TODAY_KEY, daysBetween, dateTime, parseDay } from "./_data";
import { CONSENT_LABEL, DATA_REQUEST_LABEL, type ConsentKind, type DataRequestKind } from "./_data-yeni";
import { findCustomer } from "./_data-musteri";
import { useAyar } from "./_data-ayar";
import { useAuditLog, type AuditRecord } from "./_audit";
import { useDerived } from "./_core";
import { PERMISSIONS, ROLES, USERS as ALL_USERS } from "./_data-operasyon";
import {
  APPROVAL_LABEL,
  currentRole,
  currentUser,
  setUser,
  setViewAs,
  useApprovalPolicy,
  useApprovals,
  usePermissionMatrix,
  useSession,
  setApprovalPolicy,
  type Approval,
  type ApprovalKind,
} from "./_permissions";
import { advanceDataRequest, createDataRequest, decide, revealMasked, setConsent, useConsents, useDataRequests } from "./_store";
import { dataRequestsDue } from "./_selectors";
import { audit } from "./_audit";
import { Metric, fmtNum, fmtPct } from "./_kit";
import { CARD, MetricStrip, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Sekmeler                                                                   */
/* ------------------------------------------------------------------------ */

type TabId = "yetki" | "denetim" | "kvkk" | "onaylar" | "oturum";
const TABS: readonly { id: TabId; label: string }[] = [
  { id: "onaylar", label: "İki Göz Onayları" },
  { id: "yetki", label: "Yetki ve Roller" },
  { id: "denetim", label: "Denetim İzi" },
  { id: "kvkk", label: "KVKK" },
  { id: "oturum", label: "Oturum ve Güvenlik" },
];

const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;
const dayLabel = (key: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(parseDay(key));

const DECIDE_ERROR: Record<string, string> = {
  "kendi-istegi": "İsteği açan kişi kendi isteğini onaylayamaz. Başka bir kullanıcı olarak giriş yapın (Oturum ve Güvenlik).",
  yetki: "Bu rolün bu işlemi onaylama yetkisi yok.",
  bulunamadi: "Onay kaydı bulunamadı.",
  "karar-verilmis": "Bu isteğe zaten karar verilmiş.",
};

/** Uyum Merkezi: iki göz onayları, yetki matrisi, denetim izi, KVKK ve oturum güvenliği tek yerde. */
export function UyumPage({ params }: PageProps) {
  const session = useSession();
  const approvals = useApprovals();
  const auditLog = useAuditLog();
  const requests = useDataRequests();
  const tab: TabId = (TABS.some((t) => t.id === params.tab) ? params.tab : "onaylar") as TabId;
  const role = currentRole();
  const pending = approvals.filter((a) => a.status === "bekliyor").length;
  const due = useDerived(() => dataRequestsDue().length);
  const denied = auditLog.filter((a) => !a.ok && a.origin === "portal").length;
  const { users } = useAyar();
  const noTwoFactor = users.filter((u) => u.active && !u.twoFactor).length;
  const openRequests = requests.filter((r) => r.status !== "tamam").length;

  const body: Record<TabId, ReactNode> = {
    onaylar: <ApprovalsTab />,
    yetki: <RolesTab />,
    denetim: <AuditTab />,
    kvkk: <KvkkTab />,
    oturum: <SessionTab />,
  };

  return (
    <>
      <PageHead
        title="Uyum Merkezi"
        description={`${currentUser().name} · ${roleLabel(role)}${session.viewAs ? " (rol simülasyonu)" : ""} · onaylar, yetki, denetim izi ve KVKK`}
        actions={
          session.viewAs ? (
            <Button size="sm" variant="secondary" onClick={() => setViewAs(null)}>
              <UserCog aria-hidden /> Kendi rolüme dön
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        <MetricStrip>
          <Metric label="Bekleyen onay" value={fmtNum(pending)} foot={pending ? "İkinci göz karar bekliyor" : "Bekleyen yok"} to={{ page: "compliance", params: { tab: "onaylar" } }} icon={<Check />} />
          <Metric label="Reddedilen deneme" value={fmtNum(denied)} foot="Yetkisiz işlem girişimi" to={{ page: "compliance", params: { tab: "denetim", sonuc: "red" } }} icon={<X />} />
          <Metric label="KVKK talebi" value={fmtNum(openRequests)} foot={due ? `${due} talebin süresi yaklaşıyor` : "Süresi yaklaşan yok"} to={{ page: "compliance", params: { tab: "kvkk" } }} icon={<FileLock2 />} />
          <Metric label="2FA kapalı kullanıcı" value={fmtNum(noTwoFactor)} foot="Etkin hesaplar" to={{ page: "compliance", params: { tab: "oturum" } }} icon={<ShieldCheck />} />
        </MetricStrip>

        <TabLinks
          aria-label="Uyum bölümleri"
          current={href("compliance", { tab })}
          items={TABS.map((t) => ({ href: href("compliance", { tab: t.id }), label: t.label }))}
          className="max-w-full"
        />
        {body[tab]}
      </PageBody>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 1. İki göz onayları                                                        */
/* ------------------------------------------------------------------------ */

function ApprovalsTab() {
  const { notify } = useApp();
  const approvals = useApprovals();
  const policy = useApprovalPolicy();
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");
  const me = currentUser();
  const { users } = useAyar();
  const matrix = usePermissionMatrix();
  const NEED: Record<ApprovalKind, string> = { kesme: "kesme", "fatura-iptal": "fatura", tarife: "tarife", mahsup: "odeme" };
  /** Bekleyen bir isteği onaylayabilecek BAŞKA aktif kullanıcı var mı (aynı kişi kendi isteğini onaylayamaz). */
  const approversFor = (a: Approval) => users.filter((u) => u.active && u.name !== a.requestedBy && matrix[NEED[a.kind]]?.includes(u.role));
  const stuck = approvals.filter((a) => a.status === "bekliyor" && approversFor(a).length === 0);

  const act = (a: Approval, ok: boolean, why?: string) => {
    const r = decide(a.id, ok, why);
    if (!r.ok) notify({ title: "Karar verilemedi", body: DECIDE_ERROR[r.reason] ?? r.reason, tone: "info" });
    else notify({ title: ok ? "Onaylandı, işlem uygulandı" : "Reddedildi", body: a.summary, tone: ok ? "success" : "info" });
  };

  const tone = (s: Approval["status"]) => (s === "bekliyor" ? "warning" : s === "onaylandi" ? "success" : "neutral");
  const statusText = (s: Approval["status"]) => (s === "bekliyor" ? "Bekliyor" : s === "onaylandi" ? "Onaylandı" : "Reddedildi");
  const actions = (a: Approval) =>
    a.status === "bekliyor" ? (
      <span className="flex gap-2">
        <Button size="sm" variant="primary" onClick={() => act(a, true)}>Onayla</Button>
        <Button size="sm" variant="secondary" onClick={() => { setRejecting(a); setReason(""); }}>Reddet</Button>
      </span>
    ) : (
      <span className="text-small text-muted">{a.decidedBy}{a.reason ? ` · ${a.reason}` : ""}</span>
    );

  const columns: Column<Approval>[] = [
    { key: "k", header: "İşlem", render: (a) => <span className="font-medium text-strong">{APPROVAL_LABEL[a.kind]}</span> },
    { key: "s", header: "Ayrıntı", render: (a) => <span className="block max-w-md truncate" title={a.summary}>{a.summary}</span> },
    { key: "i", header: "İsteyen", render: (a) => a.requestedBy },
    { key: "t", header: "Ne Zaman", render: (a) => dateTime(a.requestedAt) },
    { key: "d", header: "Durum", render: (a) => <Badge tone={tone(a.status)} dot>{statusText(a.status)}</Badge> },
    { key: "a", header: <span className="sr-only">Karar</span>, render: actions },
  ];
  const items: RecordItem[] = approvals.map((a) => ({
    id: a.id,
    title: APPROVAL_LABEL[a.kind],
    subtitle: a.summary,
    meta: `${a.requestedBy} · ${dateTime(a.requestedAt)}`,
    status: <Badge tone={tone(a.status)} dot>{statusText(a.status)}</Badge>,
    actions: actions(a),
  }));

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Panel id="uy-onay" title="Onay Kuyruğu" note={`Giriş yapan: ${me.name}. İsteği açan kişi kendi isteğini onaylayamaz; kararı veren, ilgili işlemin yetkisine sahip olmalı.`}>
        {stuck.length ? (
          <div role="note" className="m-3 rounded-lg bg-warning-wash p-3 text-base text-body sm:m-4">
            <span className="font-semibold text-strong">{stuck.length} istek için onaylayabilecek başka kullanıcı yok.</span> İlgili izin yalnız isteği açan kişide. Ayarlar → Kullanıcılar ve Roller'den başka bir role izin verin, ya da aşağıdaki "İkinci Göz" politikasını kapatın.
          </div>
        ) : null}
        {approvals.length === 0 ? (
          <p className="p-6 text-center text-base text-muted">Bekleyen ya da karara bağlanmış onay yok. Ayarlar'dan tarife değiştirmeyi, Faturalar'dan iptal istemeyi ya da Ödemeler'den kesme emri vermeyi deneyin: onay buraya düşer.</p>
        ) : (
          <>
            <div className="max-md:hidden">
              <DataTable<Approval> caption="İki göz onayları" columns={columns} rows={approvals} rowKey={(a) => a.id} density="comfortable" on="surface" stickyFirst={false} />
            </div>
            <div className="p-3 md:hidden">
              <RecordList label="İki göz onayları" items={items} />
            </div>
          </>
        )}
      </Panel>

      <Panel id="uy-politika" title="Hangi İşlemler İkinci Göz İster" note="Politika değişikliği denetim izine işlenir.">
        <div className="grid gap-3 p-4 sm:p-5">
          {(Object.keys(APPROVAL_LABEL) as ApprovalKind[]).map((kind) => (
            <Switch
              key={kind}
              label={APPROVAL_LABEL[kind]}
              hint={kind === "kesme" ? "Borçtan enerji kesme emri ikinci kullanıcının kararıyla iş emrine dönüşür." : kind === "fatura-iptal" ? "İptal ve düzeltme faturası karara kadar uygulanmaz." : kind === "tarife" ? "Yürürlük tarihli tarife değişikliği ikinci kullanıcı onayına kadar bekler." : "Alacak mahsubu."}
              checked={policy[kind]}
              onChange={(e) => {
                setApprovalPolicy(kind, e.target.checked);
                audit("Onay politikasını değiştirdi", APPROVAL_LABEL[kind], policy[kind] ? "Açık" : "Kapalı", e.target.checked ? "Açık" : "Kapalı");
              }}
            />
          ))}
        </div>
      </Panel>

      <Dialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="İsteği Reddet"
        description={rejecting?.summary}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Vazgeç</Button>
            <Button variant="primary" disabled={reason.trim().length < 5} onClick={() => { if (rejecting) act(rejecting, false, reason.trim()); setRejecting(null); }}>Reddet</Button>
          </>
        }
      >
        <Textarea label="Gerekçe" value={reason} onChange={(e) => setReason(e.target.value)} hint="En az 5 karakter; isteyen kişiye ve denetim izine yazılır." />
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Yetki ve roller                                                         */
/* ------------------------------------------------------------------------ */

function RolesTab() {
  const matrix = usePermissionMatrix();
  const session = useSession();
  const { notify } = useApp();
  const active = currentRole();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Panel id="uy-rol" title="Şu Rol Olarak Gör" note="Gerçek kullanıcı değişmez; yetkiler, Pano'daki 'Bugün Senin İşin' ve butonlar seçilen role göre hesaplanır.">
        <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
          {ROLES.map((r) => {
            const on = active === r.id;
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setViewAs(r.id === currentUser().role ? null : r.id);
                  notify({ title: `${r.label} olarak görüntüleniyor`, body: r.hint, tone: "info" });
                }}
                className={`min-h-16 rounded-lg p-3 text-left ring-1 transition-colors ${on ? "bg-primary-wash ring-primary/40" : "bg-surface ring-line hover:bg-surface-raised"}`}
              >
                <span className="flex items-center justify-between gap-2 text-base font-semibold text-strong">
                  {r.label}
                  {on ? <Badge tone="primary" dot>{session.viewAs ? "Simülasyon" : "Gerçek rol"}</Badge> : null}
                </span>
                <span className="mt-1 block text-small text-muted">{r.hint}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel id="uy-matris" title="Yetki Matrisi (Özet)" note="Değiştirmek için Ayarlar → Kullanıcılar ve Roller. Değişiklik anında etkilidir ve denetim izine yazılır.">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-base">
            <caption className="sr-only">Rollere göre yetkiler</caption>
            <thead>
              <tr className="border-b border-line-soft text-small text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">İşlem</th>
                {ROLES.map((r) => (
                  <th key={r.id} scope="col" className={`px-3 py-2.5 text-center font-medium ${r.id === active ? "text-strong" : ""}`}>{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-b-0">
                  <th scope="row" className="px-4 py-2.5 font-medium text-strong">
                    {p.label}
                    <span className="block text-small font-normal text-muted">{p.hint}</span>
                  </th>
                  {ROLES.map((r) => {
                    const on = matrix[p.id]?.includes(r.id);
                    return (
                      <td key={r.id} className={`px-3 py-2.5 text-center ${r.id === active ? "bg-surface" : ""}`}>
                        {on ? <Check aria-hidden className="mx-auto size-4 text-success" /> : <span aria-hidden className="text-muted">·</span>}
                        <span className="sr-only">{on ? "Var" : "Yok"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Denetim izi                                                             */
/* ------------------------------------------------------------------------ */

const toEntry = (a: AuditRecord): AuditEntry => ({
  id: a.id,
  at: a.at.toISOString(),
  when: dateTime(a.at),
  actor: a.user,
  actorDetail: roleLabel(a.role),
  action: a.action,
  target: a.target,
  before: a.before,
  after: a.after,
  denied: !a.ok,
});

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditTab() {
  const { notify } = useApp();
  const log = useAuditLog();
  const [q, setQ] = useState("");
  const [who, setWho] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>("hepsi");
  const people = useMemo(() => [...new Set(log.map((a) => a.user))].sort((a, b) => a.localeCompare(b, "tr")), [log]);

  const rows = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return log.filter((a) => {
      if (who && who !== "hepsi" && a.user !== who) return false;
      if (result === "red" && a.ok) return false;
      if (result === "basarili" && !a.ok) return false;
      if (result === "portal" && a.origin !== "portal") return false;
      if (query && !`${a.action} ${a.target} ${a.user} ${a.before ?? ""} ${a.after ?? ""}`.toLocaleLowerCase("tr-TR").includes(query)) return false;
      return true;
    });
  }, [log, q, who, result]);

  const exportCsv = () => {
    downloadCsv("denetim-izi.csv", [["Zaman", "Kullanıcı", "Rol", "İşlem", "Hedef", "Önce", "Sonra", "Sonuç", "Kaynak"], ...rows.map((a) => [dateTime(a.at), a.user, roleLabel(a.role), a.action, a.target, a.before ?? "", a.after ?? "", a.ok ? "Başarılı" : "Reddedildi", a.origin === "portal" ? "Bu oturum" : "Geçmiş"])]);
    audit("Denetim izini dışa aktardı", `${rows.length} kayıt`);
    notify({ title: "Denetim izi indirildi", body: `${rows.length} kayıt · CSV`, tone: "success" });
  };

  const toolbar = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <Input label="Ara" hideLabel type="search" placeholder="İşlem, hedef, kullanıcı ara" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="w-48">
        <Select label="Kullanıcı" hideLabel items={[{ value: "hepsi", label: "Bütün kullanıcılar" }, ...people.map((p) => ({ value: p, label: p }))]} value={who ?? "hepsi"} onValueChange={setWho} />
      </div>
      <div className="w-44">
        <Select label="Sonuç" hideLabel items={[{ value: "hepsi", label: "Bütün kayıtlar" }, { value: "portal", label: "Yalnız bu oturum" }, { value: "red", label: "Reddedilenler" }, { value: "basarili", label: "Başarılılar" }]} value={result} onValueChange={setResult} />
      </div>
      <Button size="sm" variant="secondary" onClick={exportCsv}><Download aria-hidden /> CSV</Button>
    </div>
  );

  return (
    <Panel id="uy-denetim" title="Denetim İzi" note={`${fmtNum(rows.length)} kayıt · portalda yapılan her değişiklik üste eklenir ve silinemez`}>
      <div className="grid gap-3 p-3 sm:p-4">
        <AuditLog entries={rows.slice(0, 80).map(toEntry)} toolbar={toolbar} label="Denetim Günlüğü" />
        {rows.length > 80 ? <p className="text-small text-muted">İlk 80 kayıt gösteriliyor; hepsi için CSV'yi indirin.</p> : null}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. KVKK                                                                    */
/* ------------------------------------------------------------------------ */

const FIELDS = [
  { value: "kimlik", label: "T.C. kimlik / vergi no" },
  { value: "telefon", label: "Telefon" },
  { value: "eposta", label: "E-posta" },
  { value: "iban", label: "IBAN" },
];

function KvkkTab() {
  const { notify } = useApp();
  const consents = useConsents();
  const requests = useDataRequests();
  const [newReq, setNewReq] = useState(false);
  const [cid, setCid] = useState("");
  const [kind, setKind] = useState<string | null>("erisim");
  const [reveal, setReveal] = useState(false);
  const [rcid, setRcid] = useState("");
  const [field, setField] = useState<string | null>("telefon");
  const [why, setWhy] = useState("");
  const [q, setQ] = useState("");

  const cust = findCustomer(cid.trim());
  const rcust = findCustomer(rcid.trim());

  const summary = (["aydinlatma", "ticari-ileti", "sms", "eposta"] as ConsentKind[]).map((k) => {
    const rows = consents.filter((c) => c.kind === k);
    const given = rows.filter((c) => c.given).length;
    return { kind: k, given, total: rows.length, pct: rows.length ? (given / rows.length) * 100 : 0 };
  });

  const left = (due: string) => daysBetween(TODAY, parseDay(due));
  const reqStatus = { acik: "Açık", isleniyor: "İşleniyor", tamam: "Tamamlandı" } as const;

  const reqColumns: Column<(typeof requests)[number]>[] = [
    { key: "id", header: "Talep", render: (r) => <span className="edas-mono font-medium text-strong">{r.id}</span> },
    { key: "c", header: "Abone", render: (r) => findCustomer(r.customerId)?.name ?? r.customerId },
    { key: "k", header: "Tür", render: (r) => DATA_REQUEST_LABEL[r.kind] },
    {
      key: "d",
      header: "Süre",
      render: (r) => {
        if (r.status === "tamam") return <span className="text-muted">Kapandı</span>;
        const n = left(r.dueAt);
        return <Badge tone={n < 0 ? "danger" : n <= 5 ? "warning" : "neutral"} dot>{n < 0 ? `${-n} gün gecikti` : n === 0 ? "Bugün son gün" : `${n} gün kaldı`} · {dayLabel(r.dueAt)}</Badge>;
      },
    },
    { key: "s", header: "Durum", render: (r) => reqStatus[r.status] },
    { key: "a", header: <span className="sr-only">İşlem</span>, render: (r) => (r.status === "tamam" ? null : <Button size="sm" variant="secondary" onClick={() => { advanceDataRequest(r.id); notify({ title: r.status === "acik" ? "İşleme alındı" : "Talep tamamlandı", body: r.id, tone: "success" }); }}>{r.status === "acik" ? "İşleme Al" : "Tamamla"}</Button>) },
  ];
  const reqItems: RecordItem[] = requests.map((r) => ({
    id: r.id,
    title: `${r.id} · ${DATA_REQUEST_LABEL[r.kind]}`,
    subtitle: findCustomer(r.customerId)?.name ?? r.customerId,
    meta: r.status === "tamam" ? "Kapandı" : `${left(r.dueAt)} gün kaldı`,
    status: <Badge tone={r.status === "tamam" ? "success" : left(r.dueAt) <= 5 ? "warning" : "neutral"} dot>{reqStatus[r.status]}</Badge>,
    actions: r.status === "tamam" ? undefined : <Button size="sm" variant="secondary" onClick={() => advanceDataRequest(r.id)}>{r.status === "acik" ? "İşleme Al" : "Tamamla"}</Button>,
  }));

  const filtered = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    const byCustomer = new Map<string, typeof consents>();
    for (const c of consents) byCustomer.set(c.customerId, [...(byCustomer.get(c.customerId) ?? []), c]);
    return [...byCustomer.entries()]
      .map(([id, list]) => ({ id, name: findCustomer(id)?.name ?? id, list }))
      .filter((r) => !query || `${r.id} ${r.name}`.toLocaleLowerCase("tr-TR").includes(query))
      .slice(0, 12);
  }, [consents, q]);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <section aria-label="Rıza özeti" className={CARD}>
        <div className="grid gap-px overflow-hidden rounded-lg bg-line-soft sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((s) => (
            <div key={s.kind} className="bg-overlay p-4">
              <p className="text-small text-muted">{CONSENT_LABEL[s.kind]}</p>
              <p className="mt-1 text-heading font-semibold tracking-tight text-strong tabular-nums">{fmtPct(s.pct, 0)}</p>
              <p className="text-small text-muted">{fmtNum(s.given)} / {fmtNum(s.total)} abone izin verdi</p>
            </div>
          ))}
        </div>
      </section>

      <Panel
        id="uy-talep"
        title="Veri Sahibi Talepleri"
        note="Her talep için 30 günlük süre (ÖRNEK parametre; yürürlükteki süre doğrulanmalı). Süresi yaklaşanlar işaretlenir."
        actions={<Button size="sm" variant="primary" onClick={() => setNewReq(true)}>Yeni Talep</Button>}
      >
        <div className="max-md:hidden">
          <DataTable<(typeof requests)[number]> caption="Veri sahibi talepleri" columns={reqColumns} rows={requests} rowKey={(r) => r.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <div className="p-3 md:hidden">
          <RecordList label="Veri sahibi talepleri" items={reqItems} />
        </div>
      </Panel>

      <Panel
        id="uy-riza"
        title="Rıza Kayıtları"
        note="Bir tercihi değiştirmek denetim izine yazılır."
        actions={<div className="w-56"><Input label="Abone ara" hideLabel type="search" placeholder="Abone adı ya da no" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
      >
        <ul role="list" className="divide-y divide-line-soft">
          {filtered.map((r) => (
            <li key={r.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center sm:px-5">
              <span className="min-w-0">
                <span className="block truncate font-medium text-strong">{r.name}</span>
                <span className="edas-mono text-small text-muted">{r.id}</span>
              </span>
              <span className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {r.list.map((c) => (
                  <Switch
                    key={c.id}
                    label={CONSENT_LABEL[c.kind]}
                    hint={`${dayLabel(c.at)} · ${({ sube: "Şube", web: "Web", cagri: "Çağrı", mobil: "Mobil" } as const)[c.channel]}`}
                    checked={c.given}
                    disabled={c.kind === "aydinlatma"}
                    onChange={(e) => setConsent(r.id, c.kind, e.target.checked)}
                  />
                ))}
              </span>
            </li>
          ))}
          {filtered.length === 0 ? <li className="p-6 text-center text-base text-muted">Eşleşen abone yok.</li> : null}
        </ul>
        <p className="border-t border-line-soft px-5 py-3 text-small text-muted">Aydınlatma metni bilgilendirmedir, geri alınamaz; ticari ileti, SMS ve e-posta tercihleri açılıp kapatılır.</p>
      </Panel>

      <Panel id="uy-maske" title="Maskeli Alanı Görüntüle" note="Kimlik, telefon, e-posta ve IBAN varsayılan maskelidir. Görmek için gerekçe yazılır ve erişim denetim izine düşer.">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <p className="max-w-xl text-base text-body">Gerekçesiz görüntüleme yoktur. Aynı alana kısa sürede tekrar bakmak da kayıt üretir.</p>
          <Button variant="secondary" onClick={() => setReveal(true)}><Eye aria-hidden /> Alanı Görüntüle</Button>
        </div>
      </Panel>

      <Dialog
        open={newReq}
        onOpenChange={setNewReq}
        title="Yeni Veri Sahibi Talebi"
        description="Kayıt açılınca 30 günlük süre başlar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewReq(false)}>Vazgeç</Button>
            <Button variant="primary" disabled={!cust} onClick={() => { const r = createDataRequest(cust!.id, (kind ?? "erisim") as DataRequestKind); notify({ title: "Talep açıldı", body: `${r.id} · ${cust!.name}`, tone: "success" }); setNewReq(false); setCid(""); }}>Talebi Aç</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Abone no" placeholder="Örn. C-10001" value={cid} onChange={(e) => setCid(e.target.value)} error={cid && !cust ? "Bu numarada abone yok" : undefined} hint={cust ? cust.name : undefined} />
          <Select label="Talep türü" items={(Object.keys(DATA_REQUEST_LABEL) as DataRequestKind[]).map((k) => ({ value: k, label: DATA_REQUEST_LABEL[k] }))} value={kind} onValueChange={setKind} />
        </div>
      </Dialog>

      <Dialog
        open={reveal}
        onOpenChange={setReveal}
        title="Maskeli Alanı Görüntüle"
        description="Gerekçe zorunlu; erişim kaydedilir."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReveal(false)}>Vazgeç</Button>
            <Button
              variant="primary"
              disabled={!rcust || why.trim().length < 10}
              onClick={() => {
                revealMasked(rcust!.id, FIELDS.find((f) => f.value === field)?.label ?? "", why.trim());
                notify({ title: "Erişim kaydedildi", body: `${rcust!.name} · ${FIELDS.find((f) => f.value === field)?.label}`, tone: "success" });
                setReveal(false);
                setWhy("");
                setRcid("");
              }}
            >
              Görüntüle ve Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Abone no" placeholder="Örn. C-10001" value={rcid} onChange={(e) => setRcid(e.target.value)} error={rcid && !rcust ? "Bu numarada abone yok" : undefined} hint={rcust ? rcust.name : undefined} />
          <Select label="Alan" items={FIELDS} value={field} onValueChange={setField} />
          <Textarea label="Gerekçe" value={why} onChange={(e) => setWhy(e.target.value)} hint="En az 10 karakter: neden bu alana bakıyorsunuz?" />
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Oturum ve güvenlik                                                      */
/* ------------------------------------------------------------------------ */

function SessionTab() {
  const { notify } = useApp();
  const { users, forceTwoFactor } = useAyar();
  const session = useSession();
  const log = useAuditLog();
  const failures = log.filter((a) => !a.ok).slice(0, 8);
  const me = currentUser();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Panel id="uy-oturum" title="Oturum" note="Demo: kullanıcı değiştirerek iki göz onayını deneyin; aynı kişi kendi isteğini onaylayamaz.">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-end">
          <dl className="grid gap-2 text-base sm:grid-cols-3">
            <div><dt className="text-small text-muted">Giriş yapan</dt><dd className="font-medium text-strong">{me.name}</dd></div>
            <div><dt className="text-small text-muted">Rol</dt><dd className="font-medium text-strong">{roleLabel(me.role)}</dd></div>
            <div><dt className="text-small text-muted">Görüntülenen rol</dt><dd className="font-medium text-strong">{session.viewAs ? roleLabel(session.viewAs) : "Kendi rolü"}</dd></div>
          </dl>
          <Select
            label="Şu kullanıcı olarak giriş yap (simülasyon)"
            items={users.filter((u) => u.active).map((u) => ({ value: u.id, label: `${u.name} · ${roleLabel(u.role)}` }))}
            value={session.userId}
            onValueChange={(v) => {
              if (!v) return;
              setUser(v);
              const u = ALL_USERS.concat(users).find((x) => x.id === v);
              audit("Kullanıcı değiştirdi (simülasyon)", u?.name ?? v);
              notify({ title: `${u?.name ?? "Kullanıcı"} olarak giriş yapıldı`, body: "Rol simülasyonu sıfırlandı", tone: "info" });
            }}
          />
        </div>
      </Panel>

      <Panel id="uy-2fa" title="İkinci Doğrulama" note={forceTwoFactor ? "Politika: bütün kullanıcılarda zorunlu." : "Politika: zorunlu değil. Ayarlar → Kullanıcılar ve Roller'den açılır."}>
        <ul role="list" className="divide-y divide-line-soft">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <span className="min-w-0">
                <span className="block truncate font-medium text-strong">{u.name}</span>
                <span className="block text-small text-muted">{roleLabel(u.role)} · {u.lastLogin ? `son giriş ${dateTime(new Date(u.lastLogin))}` : "henüz girmedi"}</span>
              </span>
              <span className="flex items-center gap-2">
                {!u.active ? <Badge tone="neutral" dot>Pasif hesap</Badge> : null}
                {u.twoFactor || forceTwoFactor ? <Badge tone="success" dot>2FA açık</Badge> : <Badge tone="warning" dot>2FA kapalı</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="uy-red" title="Başarısız ve Reddedilen Denemeler" note="Yetkisiz işlem, iki göz reddi ve başarısız giriş (denetim izinden).">
        <div className="p-3 sm:p-4">
          {failures.length === 0 ? (
            <p className="p-4 text-center text-base text-muted">Reddedilen deneme yok.</p>
          ) : (
            <StatusList
              title="Son reddedilenler"
              headingLevel={3}
              items={failures.map((f) => ({ id: f.id, label: `${f.action} · ${f.target}`, status: "degraded" as const }))}
            />
          )}
        </div>
      </Panel>
      <p className="text-small text-muted">{TODAY_KEY} itibarıyla. Başarısız giriş sayısı ve IP bilgileri örnektir.</p>
    </div>
  );
}
