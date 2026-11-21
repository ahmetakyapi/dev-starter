"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Download, Mail, MessageSquareText, Palette, Plug, Plus, Radio, Receipt, Route, ScrollText, ShieldCheck, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChannelMatrix, type MatrixValue } from "@/components/ui/channel-matrix";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IntegrationCard, IntegrationGrid } from "@/components/ui/integration-card";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { StatusList } from "@/components/ui/status-list";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/ui/timeline";
import { REGIONS, SYSTEMS, TODAY, TODAY_KEY, addDays, dateTime, dayKey, fullDate, num, parseDay } from "./_data";
import {
  AUDIT_ACTIONS,
  AUDIT_LOG,
  INTEGRATIONS,
  PERMISSIONS,
  PERMISSION_START,
  READERS,
  READ_ROUTES_START,
  ROLES,
  TARIFFS_START,
  TARIFF_HISTORY,
  TEMPLATES_START,
  TEMPLATE_SAMPLE,
  TEMPLATE_VARS,
  USERS,
  type AuditEntry,
  type RoleId,
  type SettingsUser,
  type Tariff,
  type Template,
} from "./_data-operasyon";
import { IconTile, PageBody, PageHead, Panel, SampleNote, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Bölümler                                                                  */
/* ------------------------------------------------------------------------ */

type SectionId = "kullanici" | "tarife" | "okuma" | "entegrasyon" | "sablon" | "denetim" | "gorunum";
const SECTIONS: readonly { id: SectionId; label: string; hint: string; icon: ReactNode }[] = [
  { id: "kullanici", label: "Kullanıcılar ve Roller", hint: "Kim neyi yapabilir", icon: <Users /> },
  { id: "tarife", label: "Tarifeler ve Bedeller", hint: "Dağıtım, YEKDEM, vergi", icon: <Receipt /> },
  { id: "okuma", label: "Okuma Tur Planı", hint: "Bölge, okuyucu, gün", icon: <Route /> },
  { id: "entegrasyon", label: "Entegrasyonlar", hint: "AMI, SMS, ödeme", icon: <Plug /> },
  { id: "sablon", label: "Bildirim Şablonları", hint: "SMS ve e-posta metinleri", icon: <MessageSquareText /> },
  { id: "denetim", label: "Denetim Günlüğü", hint: "Kim ne zaman ne yaptı", icon: <ScrollText /> },
  { id: "gorunum", label: "Görünüm", hint: "Tema, yoğunluk, dil", icon: <Palette /> },
];

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r.id, label: r.label }));
const roleLabel = (id: RoleId) => ROLES.find((r) => r.id === id)!.label;
const unitText = (t: Tariff) => `${t.value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${t.unit}`;
const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Her ayın ${i + 1}'i` }));
const READER_OPTIONS = READERS.map((r) => ({ value: r, label: r }));
const smsLength = (text: string) => (/^[\u0020-\u007E\n]*$/.test(text) ? 160 : 70);
const fill = (body: string) => TEMPLATE_VARS.reduce((s, v) => s.split(v).join(TEMPLATE_SAMPLE[v]), body);

/** Bölüm adresi: sekme `?tab=`. Kaydedilmemiş değişiklik varken bölüm değişirse onay sorulur. */
export function AyarlarPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const section: SectionId = (SECTIONS.some((s) => s.id === params.tab) ? params.tab : "kullanici") as SectionId;

  /* Her bölümün durumu sayfada tutulur: bölüm değişince kaybolmaz. */
  const [users, setUsers] = useState<readonly SettingsUser[]>(USERS);
  const [perms, setPerms] = useState<MatrixValue>(PERMISSION_START);
  const [forceTwoFactor, setForceTwoFactor] = useState(false);
  const [tariffs, setTariffs] = useState<readonly (Tariff & { draft?: boolean })[]>(TARIFFS_START);
  const [pendingHistory, setPendingHistory] = useState<readonly { id: string; label: string; from: number; to: number; effective: string }[]>([]);
  const [routes, setRoutes] = useState(READ_ROUTES_START);
  const [connected, setConnected] = useState<Readonly<Record<string, boolean>>>(() => Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected])));
  const [templates, setTemplates] = useState<readonly Template[]>(TEMPLATES_START);
  const [look, setLook] = useState<{ theme: "light" | "dark" | "system"; density: "comfortable" | "compact"; language: string }>({ theme: "system", density: "comfortable", language: "tr" });

  const [dirty, setDirty] = useState<ReadonlySet<SectionId>>(new Set());
  const [leaveTo, setLeaveTo] = useState<SectionId | null>(null);
  const mark = (id: SectionId) => setDirty((s) => (s.has(id) ? s : new Set(s).add(id)));

  const request = (id: SectionId) => {
    if (id === section) return;
    if (dirty.size) setLeaveTo(id);
    else go("settings", { tab: id });
  };
  const save = () => {
    if (look.theme !== "system") document.documentElement.dataset.theme = look.theme;
    else document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTariffs((all) => all.map(({ draft: _draft, ...t }) => t));
    notify({ title: "Ayarlar kaydedildi", body: `${dirty.size} bölümde değişiklik uygulandı · denetim günlüğüne işlendi`, tone: "success" });
    setDirty(new Set());
  };
  const discard = () => {
    setUsers(USERS);
    setPerms(PERMISSION_START);
    setForceTwoFactor(false);
    setTariffs(TARIFFS_START);
    setPendingHistory([]);
    setRoutes(READ_ROUTES_START);
    setConnected(Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected])));
    setTemplates(TEMPLATES_START);
    setLook({ theme: "system", density: "comfortable", language: "tr" });
    setDirty(new Set());
    notify({ title: "Değişiklikler geri alındı", body: "Ayarlar son kaydedilen hâline döndü", tone: "info" });
  };

  const body = {
    kullanici: <UsersSection users={users} setUsers={(u) => { setUsers(u); mark("kullanici"); }} perms={perms} setPerms={(p) => { setPerms(p); mark("kullanici"); }} force={forceTwoFactor} setForce={(v) => { setForceTwoFactor(v); mark("kullanici"); }} />,
    tarife: <TariffSection tariffs={tariffs} history={pendingHistory} onEdit={(t, value, effective) => {
      setPendingHistory((h) => [{ id: `p-${t.id}`, label: t.label, from: t.value, to: value, effective }, ...h.filter((x) => x.id !== `p-${t.id}`)]);
      setTariffs((all) => all.map((x) => (x.id === t.id ? { ...x, value, effective, draft: true } : x)));
      mark("tarife");
    }} />,
    okuma: <RoutesSection routes={routes} setRoutes={(r) => { setRoutes(r); mark("okuma"); }} />,
    entegrasyon: <IntegrationsSection connected={connected} setConnected={(c) => { setConnected(c); mark("entegrasyon"); }} />,
    sablon: <TemplatesSection templates={templates} setTemplates={(t) => { setTemplates(t); mark("sablon"); }} />,
    denetim: <AuditSection />,
    gorunum: <LookSection look={look} setLook={(l) => { setLook(l); mark("gorunum"); }} />,
  }[section];

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <>
      <PageHead title="Ayarlar" description="Kullanıcılar, tarifeler, entegrasyonlar ve bildirimler." actions={dirty.size ? <Badge tone="warning" dot>{dirty.size} bölümde kaydedilmemiş değişiklik</Badge> : undefined} />
      <PageBody className="pb-28">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Ayar bölümleri" className="min-w-0">
            <ul className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <li key={s.id} className="shrink-0">
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => request(s.id)}
                      className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left transition-colors lg:py-2 ${active ? "bg-overlay text-strong shadow-raised ring-1 ring-line" : "text-body hover:bg-surface-raised hover:text-strong"}`}
                    >
                      <span aria-hidden className="grid size-5 shrink-0 place-items-center text-muted [&_svg]:size-4">{s.icon}</span>
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-base font-medium">{s.label}</span>
                        <span className="hidden text-micro text-muted lg:block">{s.hint}</span>
                      </span>
                      {dirty.has(s.id) ? <span className="ml-auto size-2 shrink-0 rounded-full bg-warning" title="Kaydedilmemiş değişiklik"><span className="sr-only">Kaydedilmemiş değişiklik</span></span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">
            <h2 className="sr-only">{current.label}</h2>
            {body}
          </div>
        </div>
        <SampleNote />
      </PageBody>

      {dirty.size ? (
        <div role="region" aria-label="Kaydedilmemiş değişiklikler" className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl bg-overlay px-4 py-3 shadow-modal ring-1 ring-line sm:bottom-5 lg:ml-[calc(50%-18rem)]">
          <p className="text-small text-strong">
            <span className="font-semibold">{dirty.size} bölümde</span> kaydedilmemiş değişiklik var.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={discard}>Vazgeç</Button>
            <Button size="sm" variant="primary" onClick={save}>Kaydet</Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={!!leaveTo}
        onOpenChange={(o) => !o && setLeaveTo(null)}
        title="Kaydedilmemiş değişiklikler var"
        description="Başka bir bölüme geçerseniz değişiklikler bellekte kalır ama kaydedilmez; Kaydet'e basana kadar uygulanmaz."
        footer={
          <>
            <Button variant="ghost" data-autofocus onClick={() => setLeaveTo(null)}>Bu Bölümde Kal</Button>
            <Button variant="secondary" onClick={() => { discard(); const id = leaveTo; setLeaveTo(null); if (id) go("settings", { tab: id }); }}>Geri Al ve Geç</Button>
            <Button variant="primary" onClick={() => { const id = leaveTo; setLeaveTo(null); if (id) go("settings", { tab: id }); }}>Geç</Button>
          </>
        }
      />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Kullanıcılar ve roller                                                  */
/* ------------------------------------------------------------------------ */

function UsersSection({ users, setUsers, perms, setPerms, force, setForce }: { users: readonly SettingsUser[]; setUsers: (u: readonly SettingsUser[]) => void; perms: MatrixValue; setPerms: (p: MatrixValue) => void; force: boolean; setForce: (v: boolean) => void }) {
  const { notify } = useApp();
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>("okuma");
  const [twoFactor, setTwoFactor] = useState(true);

  const patch = (id: string, change: Partial<SettingsUser>) => setUsers(users.map((u) => (u.id === id ? { ...u, ...change } : u)));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const submit = () => {
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setUsers([...users, { id: `u-${users.length + 1}`, name, email, role: (role ?? "okuma") as RoleId, twoFactor: twoFactor || force, lastLogin: "", active: true }]);
    notify({ title: "Davet gönderildi", body: `${email} · ${roleLabel((role ?? "okuma") as RoleId)}`, tone: "success" });
    setInvite(false);
    setEmail("");
  };

  const columns: Column<SettingsUser>[] = [
    {
      key: "n",
      header: "Kullanıcı",
      render: (u) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-strong">{u.name}</span>
          <span className="block truncate text-small text-muted">{u.email}</span>
        </span>
      ),
    },
    { key: "r", header: "Rol", render: (u) => <div className="w-48"><Select label={`${u.name} rolü`} hideLabel items={ROLE_OPTIONS} value={u.role} onValueChange={(v) => v && patch(u.id, { role: v as RoleId })} /></div> },
    { key: "t", header: "İkinci Doğrulama", render: (u) => (u.twoFactor || force ? <Badge tone="success" dot>Açık</Badge> : <Badge tone="warning" dot>Kapalı</Badge>) },
    { key: "l", header: "Son Giriş", render: (u) => (u.lastLogin ? dateTime(new Date(u.lastLogin)) : "Henüz girmedi") },
    { key: "a", header: "Durum", render: (u) => <Switch label={<span className="sr-only">{u.name} hesabı</span>} checked={u.active} onChange={(e) => patch(u.id, { active: e.target.checked })} /> },
  ];
  const items: RecordItem[] = users.map((u) => ({
    id: u.id,
    title: u.name,
    subtitle: u.email,
    value: roleLabel(u.role),
    meta: u.lastLogin ? `Son giriş ${dateTime(new Date(u.lastLogin))}` : "Henüz girmedi",
    status: u.active ? <Badge tone="success" dot>Etkin</Badge> : <Badge tone="neutral" dot>Pasif</Badge>,
    actions: <Switch label={<span className="sr-only">{u.name} hesabı</span>} checked={u.active} onChange={(e) => patch(u.id, { active: e.target.checked })} />,
  }));

  return (
    <div className="grid gap-5">
      <Panel id="ay-kullanici" title="Kullanıcılar" note={`${users.filter((u) => u.active).length} etkin kullanıcı`} actions={<Button size="sm" variant="primary" onClick={() => setInvite(true)}><Plus aria-hidden /> Kullanıcı Davet Et</Button>}>
        <div className="max-md:hidden">
          <DataTable<SettingsUser> caption="Kullanıcılar" columns={columns} rows={users} rowKey={(u) => u.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <div className="p-3 md:hidden">
          <RecordList label="Kullanıcılar" items={items} />
        </div>
      </Panel>

      <Panel id="ay-2fa" title="Güvenlik Politikası">
        <div className="grid gap-3 p-4 sm:p-5">
          <Switch label="Bütün kullanıcılar için ikinci doğrulama zorunlu" hint="Açıkken ikinci doğrulaması kapalı kullanıcılar bir sonraki girişte kurulum yapmak zorunda kalır." checked={force} onChange={(e) => setForce(e.target.checked)} />
          <p className="flex items-center gap-2 text-small text-muted">
            <ShieldCheck aria-hidden className="size-4" /> {users.filter((u) => !u.twoFactor && !force && u.active).length} etkin kullanıcıda ikinci doğrulama kapalı.
          </p>
        </div>
      </Panel>

      <Panel id="ay-yetki" title="Yetki Matrisi" note="Her kutu bir rolün o işlemi yapıp yapamayacağını belirler. Sütun başlığındaki kutu bütün işlemleri açar ya da kapatır.">
        <div className="p-2 sm:p-3">
          <ChannelMatrix caption="Rollere göre yetkiler" rowHeader="İşlem" channels={ROLES.map((r) => ({ id: r.id, label: r.label }))} rows={PERMISSIONS.map((p) => ({ id: p.id, label: p.label, hint: p.hint, locked: p.locked }))} value={perms} onValueChange={setPerms} />
        </div>
      </Panel>

      <Dialog
        open={invite}
        onOpenChange={setInvite}
        title="Kullanıcı Davet Et"
        description="Davet bağlantısı e-posta ile gider ve 72 saat geçerlidir."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvite(false)}>Vazgeç</Button>
            <Button variant="primary" disabled={!emailOk} onClick={submit}>Daveti Gönder</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={email && !emailOk ? "Geçerli bir e-posta yazın" : undefined} />
          <Select label="Rol" items={ROLE_OPTIONS} value={role} onValueChange={setRole} />
          <p className="text-small text-muted">{ROLES.find((r) => r.id === role)?.hint}</p>
          <Switch label="İkinci doğrulamayı zorunlu tut" checked={twoFactor || force} disabled={force} onChange={(e) => setTwoFactor(e.target.checked)} />
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Tarifeler ve bedeller                                                   */
/* ------------------------------------------------------------------------ */

function TariffSection({ tariffs, history, onEdit }: { tariffs: readonly (Tariff & { draft?: boolean })[]; history: readonly { id: string; label: string; from: number; to: number; effective: string }[]; onEdit: (t: Tariff, value: number, effective: string) => void }) {
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [value, setValue] = useState("");
  const [effective, setEffective] = useState("");

  const open = (t: Tariff) => {
    setEditing(t);
    setValue(String(t.value).replace(".", ","));
    setEffective(dayKey(addDays(TODAY, 10)));
  };
  const parsed = Number(value.replace(",", "."));
  const valid = Number.isFinite(parsed) && parsed > 0 && effective >= TODAY_KEY;
  const confirm = () => {
    if (!editing || !valid) return;
    onEdit(editing, parsed, effective);
    setEditing(null);
  };

  const columns: Column<(typeof tariffs)[number]>[] = [
    { key: "l", header: "Kalem", render: (t) => <span className="font-medium text-strong">{t.label}{t.draft ? <Badge tone="warning" className="ml-2">Taslak</Badge> : null}</span> },
    { key: "v", header: "Değer", numeric: true, render: (t) => <span className="edas-mono">{unitText(t)}</span> },
    { key: "e", header: "Yürürlük", render: (t) => fullDate.format(parseDay(t.effective)) },
    { key: "n", header: "Not", render: (t) => <span className="text-muted">{t.note}</span> },
    { key: "a", header: <span className="sr-only">Düzenle</span>, render: (t) => <Button size="sm" variant="secondary" onClick={() => open(t)}>Düzenle</Button> },
  ];
  const events = [
    ...history.map((h) => ({ id: h.id, at: h.effective, when: `${fullDate.format(parseDay(h.effective))} · taslak`, title: `${h.label}: ${h.from.toLocaleString("tr-TR")} → ${h.to.toLocaleString("tr-TR")}`, description: "Kaydedilince yürürlük tarihinde uygulanır", tone: "warning" as const })),
    ...TARIFF_HISTORY.map((h) => ({ id: h.id, at: h.effective, when: fullDate.format(parseDay(h.effective)), title: `${h.label}: ${h.from.toLocaleString("tr-TR")} → ${h.to.toLocaleString("tr-TR")}`, description: `Düzenleyen: ${h.by}`, tone: "neutral" as const })),
  ];

  return (
    <div className="grid gap-5">
      <Panel id="ay-tarife" title="Tarifeler ve Bedeller" note="Değişiklik yürürlük tarihinde uygulanır; geçmiş dönem faturaları değişmez.">
        <div className="max-md:hidden">
          <DataTable caption="Tarife ve bedel tablosu" columns={columns} rows={tariffs} rowKey={(t) => t.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <ul className="grid gap-2 p-3 md:hidden" aria-label="Tarife ve bedel listesi">
          {tariffs.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
              <div className="min-w-0">
                <p className="font-medium text-strong">{t.label}{t.draft ? <Badge tone="warning" className="ml-2">Taslak</Badge> : null}</p>
                <p className="edas-mono text-small text-muted">{unitText(t)} · {fullDate.format(parseDay(t.effective))}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => open(t)}>Düzenle</Button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="ay-tarife-gecmis" title="Değişiklik Geçmişi" note="Kim neyi hangi tarihte değiştirdi.">
        <div className="p-4 sm:p-5">
          <Timeline events={events} />
        </div>
      </Panel>

      <Dialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing ? `${editing.label}` : ""}
        description={editing ? `Mevcut değer ${unitText(editing)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Vazgeç</Button>
            <Button variant="primary" disabled={!valid} onClick={confirm}>Taslak Olarak Ekle</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={`Yeni değer (${editing?.unit ?? ""})`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} error={value && !(parsed > 0) ? "Sıfırdan büyük bir sayı yazın" : undefined} />
          <Input label="Yürürlük tarihi" type="date" value={effective} min={TODAY_KEY} onChange={(e) => setEffective(e.target.value)} hint="Geçmişe dönük değişiklik yapılamaz." />
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Okuma tur planı                                                         */
/* ------------------------------------------------------------------------ */

function RoutesSection({ routes, setRoutes }: { routes: typeof READ_ROUTES_START; setRoutes: (r: typeof READ_ROUTES_START) => void }) {
  const patch = (regionId: string, change: Partial<(typeof READ_ROUTES_START)[number]>) => setRoutes(routes.map((r) => (r.regionId === regionId ? { ...r, ...change } : r)));
  const columns: Column<(typeof READ_ROUTES_START)[number]>[] = [
    { key: "r", header: "Bölge", render: (r) => <span className="font-medium text-strong">{REGIONS.find((x) => x.id === r.regionId)!.name}</span> },
    { key: "m", header: "Sayaç", numeric: true, render: (r) => num.format(r.meters) },
    { key: "o", header: "Okuyucu", render: (r) => <div className="w-48"><Select label={`${r.regionId} okuyucusu`} hideLabel items={READER_OPTIONS} value={r.reader} onValueChange={(v) => v && patch(r.regionId, { reader: v })} /></div> },
    { key: "d", header: "Okuma Günü", render: (r) => <div className="w-44"><Select label={`${r.regionId} okuma günü`} hideLabel items={DAY_OPTIONS} value={String(r.day)} onValueChange={(v) => v && patch(r.regionId, { day: Number(v) })} /></div> },
  ];
  const clash = READERS.filter((name) => routes.filter((r) => r.reader === name).length > 1);
  return (
    <Panel id="ay-okuma" title="Okuma Tur Planı" note="Her bölgenin okuma günü ve sorumlu okuyucusu. Aynı okuyucu aynı gün iki bölgeye atanamaz." actions={clash.length ? <Badge tone="warning" dot>{clash.length} okuyucu birden çok bölgede</Badge> : <Badge tone="success" dot>Çakışma yok</Badge>}>
      <div className="max-md:hidden">
        <DataTable caption="Bölge okuma planı" columns={columns} rows={routes} rowKey={(r) => r.regionId} density="comfortable" on="surface" stickyFirst={false} />
      </div>
      <ul className="grid gap-3 p-3 md:hidden" aria-label="Bölge okuma planı">
        {routes.map((r) => (
          <li key={r.regionId} className="grid gap-2 rounded-lg bg-surface p-3">
            <p className="font-medium text-strong">{REGIONS.find((x) => x.id === r.regionId)!.name} <span className="text-small font-normal text-muted">· {num.format(r.meters)} sayaç</span></p>
            <Select label="Okuyucu" items={READER_OPTIONS} value={r.reader} onValueChange={(v) => v && patch(r.regionId, { reader: v })} />
            <Select label="Okuma günü" items={DAY_OPTIONS} value={String(r.day)} onValueChange={(v) => v && patch(r.regionId, { day: Number(v) })} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Entegrasyonlar                                                          */
/* ------------------------------------------------------------------------ */

const INT_ICON: Record<string, ReactNode> = { ami: <Radio />, sms: <MessageSquareText />, pay: <Wallet />, efatura: <Receipt />, kurum: <CalendarClock /> };

function IntegrationsSection({ connected, setConnected }: { connected: Readonly<Record<string, boolean>>; setConnected: (c: Readonly<Record<string, boolean>>) => void }) {
  const { notify } = useApp();
  const [syncing, setSyncing] = useState<Readonly<Record<string, boolean>>>({ ami: true, sms: true, pay: true });
  return (
    <div className="grid gap-5">
      <Panel id="ay-entegrasyon" title="Entegrasyonlar" note={`${Object.values(connected).filter(Boolean).length} bağlı, ${Object.values(connected).filter((v) => !v).length} bağlanabilir`}>
        <div className="p-3 sm:p-4">
          <IntegrationGrid>
            {INTEGRATIONS.map((i) => (
              <IntegrationCard
                key={i.id}
                name={i.name}
                category={i.category}
                description={i.description}
                icon={<IconTile tone="neutral">{INT_ICON[i.id]}</IconTile>}
                connected={connected[i.id]}
                lastSync={`${i.lastSync || "Az önce"} eşitlendi`}
                setup={i.setup}
                syncing={syncing[i.id] ?? true}
                onToggle={(next) => { setSyncing({ ...syncing, [i.id]: next }); notify({ title: `${i.name}: eşitleme ${next ? "açıldı" : "durduruldu"}`, tone: "info" }); }}
                onConnect={() => { setConnected({ ...connected, [i.id]: true }); setSyncing({ ...syncing, [i.id]: true }); notify({ title: `${i.name} bağlandı`, body: "İlk eşitleme birkaç dakika sürebilir", tone: "success" }); }}
                menu={connected[i.id] ? <Button size="sm" variant="ghost" onClick={() => { setConnected({ ...connected, [i.id]: false }); notify({ title: `${i.name} bağlantısı kesildi`, body: "Mevcut veri korunur, yeni veri akmaz", tone: "info" }); }}>Bağlantıyı Kes</Button> : undefined}
              />
            ))}
          </IntegrationGrid>
        </div>
      </Panel>
      <Panel id="ay-saglik" title="Sistem Sağlığı" note="Bağlı entegrasyonların canlı durumu.">
        <div className="p-3 sm:p-4">
          <StatusList title="Bileşenler" items={SYSTEMS.map((s) => ({ id: s.id, label: s.label, status: s.status }))} incident="Son olay: 20 Kas, GSM ağ geçidi yavaşlığı" headingLevel={3} />
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Bildirim şablonları                                                     */
/* ------------------------------------------------------------------------ */

const CHANNEL_OPTIONS = [
  { value: "sms", label: "Yalnız SMS" },
  { value: "mail", label: "Yalnız e-posta" },
  { value: "both", label: "SMS ve e-posta" },
];

function TemplatesSection({ templates, setTemplates }: { templates: readonly Template[]; setTemplates: (t: readonly Template[]) => void }) {
  const [selected, setSelected] = useState(templates[0].id);
  const t = templates.find((x) => x.id === selected) ?? templates[0];
  const patch = (change: Partial<Template>) => setTemplates(templates.map((x) => (x.id === t.id ? { ...x, ...change } : x)));
  const preview = useMemo(() => fill(t.body), [t.body]);
  const limit = smsLength(preview);
  const parts = Math.max(1, Math.ceil(preview.length / limit));
  const unknown = (t.body.match(/\{[a-z_]+\}/g) ?? []).filter((v) => !(TEMPLATE_VARS as readonly string[]).includes(v));

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Panel id="ay-sablon-liste" title="Şablonlar" className="xl:col-span-2">
        <ul className="grid gap-1 p-2" aria-label="Bildirim şablonları">
          {templates.map((x) => (
            <li key={x.id}>
              <button type="button" aria-current={x.id === selected ? "true" : undefined} onClick={() => setSelected(x.id)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${x.id === selected ? "bg-surface text-strong ring-1 ring-line" : "text-body hover:bg-surface-raised"}`}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{x.label}</span>
                  <span className="block text-micro text-muted">{x.channel === "sms" ? "SMS" : x.channel === "mail" ? "E-posta" : "SMS ve e-posta"}</span>
                </span>
                <Badge tone={x.active ? "success" : "neutral"} dot>{x.active ? "Etkin" : "Pasif"}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="ay-sablon-duzen" title={t.label} note="Değişkenleri metne ekleyin; önizleme örnek değerlerle dolar." className="xl:col-span-3">
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Kanal" items={CHANNEL_OPTIONS} value={t.channel} onValueChange={(v) => v && patch({ channel: v as Template["channel"] })} />
            <Switch label="Şablon etkin" hint="Pasifken bu bildirim gönderilmez." checked={t.active} onChange={(e) => patch({ active: e.target.checked })} />
          </div>
          <Textarea label="Metin" value={t.body} onChange={(e) => patch({ body: e.target.value })} minRows={4} error={unknown.length ? `Tanımsız değişken: ${unknown.join(", ")}` : undefined} />
          <div>
            <p className="text-small text-muted">Değişken ekle</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button key={v} type="button" onClick={() => patch({ body: `${t.body}${t.body.endsWith(" ") || !t.body ? "" : " "}${v}` })} className="edas-mono min-h-9 rounded-md bg-surface px-2.5 text-small text-body ring-1 ring-line hover:bg-surface-raised hover:text-strong">
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center justify-between text-small text-muted">
              <span className="inline-flex items-center gap-1.5"><MessageSquareText aria-hidden className="size-4" /> Önizleme</span>
              <span>{preview.length} karakter · {parts} SMS</span>
            </p>
            <p className="mt-1.5 rounded-lg bg-surface p-3 text-small text-strong">{preview}</p>
            <p className="mt-1.5 text-micro text-muted">{limit === 70 ? "Türkçe karakter (ş, ğ, ı, İ) var: SMS 70 karakterlik parçalara bölünür. Karakter kullanmazsanız parça 160 karakter olur." : "Yalnız ASCII karakter: SMS 160 karakterlik parçalara bölünür."}</p>
          </div>
          <p className="inline-flex items-center gap-2 text-micro text-muted"><Mail aria-hidden className="size-3.5" /> E-posta için aynı metin sade şablonla gider.</p>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. Denetim günlüğü                                                         */
/* ------------------------------------------------------------------------ */

function AuditSection() {
  const { notify } = useApp();
  const [user, setUser] = useState<string | null>("hepsi");
  const [action, setAction] = useState<string | null>("hepsi");
  const [query, setQuery] = useState("");

  const userOptions = [{ value: "hepsi", label: "Bütün kullanıcılar" }, ...USERS.filter((u) => u.active).map((u) => ({ value: u.name, label: u.name }))];
  const actionOptions = [{ value: "hepsi", label: "Bütün işlemler" }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))];
  const rows = AUDIT_LOG.filter((r) => (user === "hepsi" || r.user === user) && (action === "hepsi" || r.action === action) && (!query || `${r.target} ${r.user} ${r.action}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))));

  const exportCsv = () => {
    const header = "Zaman;Kullanıcı;İşlem;Nesne;IP;Sonuç";
    const lines = rows.map((r) => [dateTime(r.at), r.user, r.action, r.target, r.ip, r.ok ? "Başarılı" : "Reddedildi"].join(";"));
    const blob = new Blob(["﻿" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "denetim-gunlugu.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    notify({ title: "Denetim günlüğü dışa aktarıldı", body: `${rows.length} kayıt · CSV`, tone: "success" });
  };

  const columns: Column<AuditEntry>[] = [
    { key: "t", header: "Zaman", render: (r) => <span className="edas-mono">{dateTime(r.at)}</span> },
    { key: "u", header: "Kullanıcı", render: (r) => r.user },
    { key: "a", header: "İşlem", render: (r) => <span className="font-medium text-strong">{r.action}</span> },
    { key: "o", header: "Nesne", render: (r) => r.target },
    { key: "i", header: "IP", render: (r) => <span className="edas-mono text-muted">{r.ip}</span> },
    { key: "s", header: "Sonuç", render: (r) => (r.ok ? <Badge tone="success" dot>Başarılı</Badge> : <Badge tone="danger" dot>Reddedildi</Badge>) },
  ];
  const items: RecordItem[] = rows.map((r) => ({ id: r.id, title: r.action, subtitle: `${r.user} · ${r.target}`, meta: dateTime(r.at), status: r.ok ? <Badge tone="success" dot>Başarılı</Badge> : <Badge tone="danger" dot>Reddedildi</Badge> }));

  return (
    <Panel id="ay-denetim" title="Denetim Günlüğü" note="Silinemeyen kayıt: kim, ne zaman, hangi nesne üzerinde ne yaptı." actions={<Button size="sm" variant="secondary" onClick={exportCsv}><Download aria-hidden /> Dışa Aktar (CSV)</Button>}>
      <div className="grid gap-3 border-b border-line-soft p-3 sm:grid-cols-3 sm:p-4">
        <Select label="Kullanıcı" items={userOptions} value={user} onValueChange={setUser} />
        <Select label="İşlem" items={actionOptions} value={action} onValueChange={setAction} />
        <Input label="Ara" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Müşteri, nesne ya da kullanıcı" />
      </div>
      <div className="max-md:hidden">
        <DataTable<AuditEntry> caption="Denetim günlüğü" columns={columns} rows={rows.slice(0, 40)} rowKey={(r) => r.id} density="comfortable" on="surface" stickyFirst={false} empty="Süzgece uyan kayıt yok" />
      </div>
      <div className="p-3 md:hidden">
        <RecordList label="Denetim günlüğü" items={items.slice(0, 40)} />
      </div>
      <p className="border-t border-line-soft px-4 py-3 text-micro text-muted">{rows.length} kayıt bulundu; en yeni 40'ı gösteriliyor. Dışa aktarma süzgeci uygular.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Görünüm                                                                 */
/* ------------------------------------------------------------------------ */

function LookSection({ look, setLook }: { look: { theme: "light" | "dark" | "system"; density: "comfortable" | "compact"; language: string }; setLook: (l: { theme: "light" | "dark" | "system"; density: "comfortable" | "compact"; language: string }) => void }) {
  return (
    <Panel id="ay-gorunum" title="Görünüm" note="Bu ayarlar yalnız sizin hesabınızı etkiler. Kaydet'e basınca uygulanır.">
      <div className="grid gap-5 p-4 sm:p-5">
        <div className="grid gap-2">
          <p className="text-small font-medium text-strong">Tema</p>
          <SegmentedControl<"light" | "dark" | "system"> aria-label="Tema" value={look.theme} onValueChange={(theme) => setLook({ ...look, theme })} options={[{ value: "light", label: "Açık" }, { value: "dark", label: "Koyu" }, { value: "system", label: "Sistem" }]} />
          <p className="text-micro text-muted">Sistem seçilirse cihazınızın tercihi izlenir.</p>
        </div>
        <div className="grid gap-2">
          <p className="text-small font-medium text-strong">Tablo yoğunluğu</p>
          <SegmentedControl<"comfortable" | "compact"> aria-label="Tablo yoğunluğu" value={look.density} onValueChange={(density) => setLook({ ...look, density })} options={[{ value: "comfortable", label: "Rahat" }, { value: "compact", label: "Sıkı" }]} />
          <p className="text-micro text-muted">Sıkı yoğunluk, uzun müşteri ve sayaç listelerinde ekrana daha çok satır sığdırır.</p>
        </div>
        <div className="max-w-sm">
          <Select label="Dil" items={[{ value: "tr", label: "Türkçe" }, { value: "en", label: "English", disabled: true }]} value={look.language} onValueChange={(language) => language && setLook({ ...look, language })} />
          <p className="mt-1.5 text-micro text-muted">İngilizce arayüz henüz hazır değil.</p>
        </div>
      </div>
    </Panel>
  );
}
