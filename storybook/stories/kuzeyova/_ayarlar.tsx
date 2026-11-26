"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Mail, MessageSquareText, Palette, Plug, Plus, Radio, Receipt, Route, ScrollText, ShieldCheck, Users, Wallet } from "lucide-react";
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
import { useAyar, saveAyar } from "./_data-ayar";
import { audit } from "./_audit";
import { setCutPolicy, useCutPolicy } from "./_cutpolicy";
import { setPermission, useApprovals, usePermissionMatrix } from "./_permissions";
import { useSettings } from "./_settings";
import { updateTariff } from "./_store";
import { AuditTab } from "./_uyum";
import { Timeline } from "@/components/ui/timeline";
import { REGIONS, SYSTEMS, TODAY, TODAY_KEY, addDays, dateTime, dayKey, fullDate, num, parseDay } from "./_data";
import {
  INTEGRATIONS,
  PERMISSIONS,
  READERS,
  READ_ROUTES_START,
  ROLES,
  TEMPLATE_SAMPLE,
  TEMPLATE_VARS,
  type RoleId,
  type SettingsUser,
  type Tariff,
  type Template,
} from "./_data-operasyon";
import { IconTile, PageBody, PageHead, Panel, SampleNote, useApp, type PageProps } from "./_ui";

/* ------------------------------------------------------------------------ */
/* Bölümler                                                                  */
/* ------------------------------------------------------------------------ */

type SectionId = "kullanici" | "tarife" | "politika" | "okuma" | "entegrasyon" | "sablon" | "denetim" | "gorunum";
const SECTIONS: readonly { id: SectionId; label: string; hint: string; icon: ReactNode }[] = [
  { id: "kullanici", label: "Kullanıcılar ve Roller", hint: "Kim neyi yapabilir", icon: <Users /> },
  { id: "tarife", label: "Tarifeler ve Bedeller", hint: "Dağıtım, YEKDEM, vergi", icon: <Receipt /> },
  { id: "politika", label: "Kurallar ve Takvim", hint: "Kesme, zam, dilimler", icon: <CalendarClock /> },
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

  /* Kayıtlı ayar tek depoda (`_data-ayar.ts`): sayfa değişince kaybolmaz. Taslak sayfada tutulur, Kaydet'e kadar uygulanmaz.
     Yetki matrisi, tarife ve kural ise ANINDA uygulanır (depoya yazılır, denetim izine düşer). */
  const saved = useAyar();
  const perms = usePermissionMatrix();
  const settings = useSettings();
  const approvals = useApprovals();
  const [users, setUsers] = useState<readonly SettingsUser[]>(saved.users);
  const [forceTwoFactor, setForceTwoFactor] = useState(saved.forceTwoFactor);
  const [routes, setRoutes] = useState(saved.routes);
  const [connected, setConnected] = useState<Readonly<Record<string, boolean>>>(saved.connected);
  const [templates, setTemplates] = useState<readonly Template[]>(saved.templates);
  const [look, setLook] = useState<{ theme: "light" | "dark" | "system"; density: "comfortable" | "compact"; language: string }>(saved.look);

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
    saveAyar({ users, forceTwoFactor, routes, connected, templates, look });
    for (const id of dirty) audit("Ayarları kaydetti", SECTIONS.find((s) => s.id === id)?.label ?? id);
    notify({ title: "Ayarlar Kaydedildi", body: `${dirty.size} bölümde değişiklik uygulandı · denetim izine işlendi`, tone: "success" });
    setDirty(new Set());
  };
  const discard = () => {
    setUsers(saved.users);
    setForceTwoFactor(saved.forceTwoFactor);
    setRoutes(saved.routes);
    setConnected(saved.connected);
    setTemplates(saved.templates);
    setLook(saved.look);
    setDirty(new Set());
    notify({ title: "Değişiklikler Geri Alındı", body: "Ayarlar son kaydedilen haline döndü", tone: "info" });
  };
  /** Yetki matrisi anında etkilidir: fark bulunur, her değişiklik depoya ve denetim izine yazılır. */
  const changePerms = (next: MatrixValue) => {
    for (const p of PERMISSIONS) {
      const before = new Set<string>(perms[p.id] ?? []);
      const after = new Set<string>(next[p.id] ?? []);
      for (const r of ROLES) {
        if (before.has(r.id) !== after.has(r.id)) {
          setPermission(p.id, r.id, after.has(r.id));
          audit("Yetkiyi değiştirdi", `${p.label} · ${roleLabel(r.id)}`, before.has(r.id) ? "Var" : "Yok", after.has(r.id) ? "Var" : "Yok");
        }
      }
    }
    notify({ title: "Yetki Güncellendi", body: "Anında etkili; rol simülasyonunda hemen görünür", tone: "success" });
  };

  const body = {
    kullanici: <UsersSection users={users} setUsers={(u) => { setUsers(u); mark("kullanici"); }} perms={perms as MatrixValue} setPerms={changePerms} force={forceTwoFactor} setForce={(v) => { setForceTwoFactor(v); mark("kullanici"); }} />,
    tarife: <TariffSection tariffs={settings.tariffs} applied={settings.history} pendingIds={approvals.filter((a) => a.kind === "tarife" && a.status === "bekliyor").map((a) => a.target)} onEdit={(t, value, effective) => {
      const r = updateTariff(t.id, value, effective);
      if (r.status === "uygulandi") notify({ title: "Tarife Uygulandı", body: `${t.label}: ${value.toLocaleString("tr-TR")} · yürürlük ${effective} · sonraki tahakkuk yeni değerle hesaplanır`, tone: "success" });
      else if (r.status === "onay-bekliyor") notify({ title: "İkinci Göz Onayı Bekleniyor", body: `${t.label} değişikliği Uyum Merkezi → İki Göz Onayları'nda`, tone: "info" });
      else notify({ title: "Yetkiniz Yok", body: "Tarife değiştirme yetkisi bu rolde kapalı; deneme denetim izine yazıldı", tone: "info" });
    }} />,
    politika: <PolicySection go={go} />,
    okuma: <RoutesSection routes={routes} setRoutes={(r) => { setRoutes(r); mark("okuma"); }} />,
    entegrasyon: <IntegrationsSection connected={connected} setConnected={(c) => { setConnected(c); mark("entegrasyon"); }} />,
    sablon: <TemplatesSection templates={templates} setTemplates={(t) => { setTemplates(t); mark("sablon"); }} />,
    denetim: <AuditTab />,
    gorunum: <LookSection look={look} setLook={(l) => { setLook(l); mark("gorunum"); }} />,
  }[section];

  const current = SECTIONS.find((s) => s.id === section)!;

  return (
    <>
      <PageHead title="Ayarlar" description="Kullanıcılar, tarifeler, entegrasyonlar ve bildirimler." actions={dirty.size ? <Badge tone="warning" dot>{dirty.size} bölümde kaydedilmemiş değişiklik</Badge> : undefined} />
      <PageBody className="pb-28">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Ayar Bölümleri" className="min-w-0">
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
                      {dirty.has(s.id) ? <span className="ml-auto size-2 shrink-0 rounded-full bg-warning" title="Kaydedilmemiş Değişiklik"><span className="sr-only">Kaydedilmemiş Değişiklik</span></span> : null}
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
        <div role="region" aria-label="Kaydedilmemiş Değişiklikler" className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl bg-overlay px-4 py-3 shadow-modal ring-1 ring-line sm:bottom-5 lg:ml-[calc(50%-18rem)]">
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
        title="Kaydedilmemiş Değişiklikler Var"
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
    notify({ title: "Davet Gönderildi", body: `${email} · ${roleLabel((role ?? "okuma") as RoleId)}`, tone: "success" });
    setInvite(false);
    setEmail("");
  };

  const columns: Column<SettingsUser>[] = [
    {
      key: "n",
      header: "Kullanıcı",
      render: (u) => (
        // Kişi hücresi iki katlı kalır (kz-stack): tek satırda e-posta "aylin.yil…" diye kesiliyordu;
        // 8 satırlık kullanıcı listesinde okunabilirlik yoğunluktan önemli.
        <span className="kz-stack block min-w-0">
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
      <Panel id="ay-kullanici" title="Kullanıcılar" note={`${users.filter((u) => u.active).length} etkin, ${users.filter((u) => !u.active).length} pasif hesap · toplam ${users.length}`} actions={<Button size="sm" variant="primary" onClick={() => setInvite(true)}><Plus aria-hidden /> Kullanıcı Davet Et</Button>}>
        <div className="max-md:hidden">
          <DataTable<SettingsUser> caption="Kullanıcılar" columns={columns} rows={users} rowKey={(u) => u.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <div className="p-3 md:hidden">
          <RecordList label="Kullanıcılar" items={items} />
        </div>
      </Panel>

      <Panel id="ay-2fa" title="Güvenlik Kuralları">
        <div className="grid gap-3 p-4 sm:p-5">
          <Switch label="Bütün Kullanıcılar İçin İkinci Doğrulama Zorunlu" hint="Açıkken ikinci doğrulaması kapalı kullanıcılar bir sonraki girişte kurulum yapmak zorunda kalır." checked={force} onChange={(e) => setForce(e.target.checked)} />
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
          <Switch label="İkinci Doğrulamayı Zorunlu Tut" checked={twoFactor || force} disabled={force} onChange={(e) => setTwoFactor(e.target.checked)} />
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Tarifeler ve bedeller                                                   */
/* ------------------------------------------------------------------------ */

function TariffSection({ tariffs, applied, pendingIds, onEdit }: { tariffs: readonly Tariff[]; applied: readonly { id: string; label: string; from: number; to: number; effective: string; by: string }[]; pendingIds: readonly string[]; onEdit: (t: Tariff, value: number, effective: string) => void }) {
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
    { key: "l", header: "Kalem", render: (t) => <span className="font-medium text-strong">{t.label}{pendingIds.includes(t.id) ? <Badge tone="warning" className="ml-2">Onay bekliyor</Badge> : null}</span> },
    { key: "v", header: "Değer", numeric: true, render: (t) => <span className="kz-mono">{unitText(t)}</span> },
    { key: "e", header: "Yürürlük", render: (t) => fullDate.format(parseDay(t.effective)) },
    { key: "n", header: "Not", render: (t) => <span className="text-muted">{t.note}</span> },
    { key: "a", header: <span className="sr-only">Düzenle</span>, render: (t) => <Button size="sm" variant="secondary" onClick={() => open(t)}>Düzenle</Button> },
  ];
  const events = applied.map((h) => ({ id: h.id, at: h.effective, when: fullDate.format(parseDay(h.effective)), title: `${h.label}: ${h.from.toLocaleString("tr-TR")} → ${h.to.toLocaleString("tr-TR")}`, description: `Düzenleyen: ${h.by}`, tone: "neutral" as const }));

  return (
    <div className="grid gap-5">
      <Panel id="ay-tarife" title="Tarifeler ve Bedeller" note="ÖRNEK PARAMETRELER (mevzuat sayısı değil, doğrulanmalı). Değişiklik depoya yazılır: sonraki tahakkuk yeni değerle hesaplanır, geçmiş faturalar değişmez. İkinci göz kuralı açıksa onay bekler.">
        <div className="max-md:hidden">
          <DataTable caption="Tarife ve bedel tablosu" columns={columns} rows={tariffs} rowKey={(t) => t.id} density="comfortable" on="surface" stickyFirst={false} />
        </div>
        <ul className="grid gap-2 p-3 md:hidden" aria-label="Tarife ve Bedel Listesi">
          {tariffs.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
              <div className="min-w-0">
                <p className="font-medium text-strong">{t.label}{pendingIds.includes(t.id) ? <Badge tone="warning" className="ml-2">Onay bekliyor</Badge> : null}</p>
                <p className="kz-mono text-small text-muted">{unitText(t)} · {fullDate.format(parseDay(t.effective))}</p>
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
            <Button variant="primary" disabled={!valid} onClick={confirm}>Uygula</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={`Yeni değer (${editing?.unit ?? ""})`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} error={value && !(parsed > 0) ? "Sıfırdan büyük bir sayı yazın" : undefined} />
          <Input label="Yürürlük Tarihi" type="date" value={effective} min={TODAY_KEY} onChange={(e) => setEffective(e.target.value)} hint="Geçmişe dönük değişiklik yapılamaz." />
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
      <ul className="grid gap-3 p-3 md:hidden" aria-label="Bölge Okuma Planı">
        {routes.map((r) => (
          <li key={r.regionId} className="grid gap-2 rounded-lg bg-surface p-3">
            <p className="font-medium text-strong">{REGIONS.find((x) => x.id === r.regionId)!.name} <span className="text-small font-normal text-muted">· {num.format(r.meters)} sayaç</span></p>
            <Select label="Okuyucu" items={READER_OPTIONS} value={r.reader} onValueChange={(v) => v && patch(r.regionId, { reader: v })} />
            <Select label="Okuma Günü" items={DAY_OPTIONS} value={String(r.day)} onValueChange={(v) => v && patch(r.regionId, { day: Number(v) })} />
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
  { value: "mail", label: "Yalnız E-posta" },
  { value: "both", label: "SMS ve E-posta" },
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
        <ul className="grid gap-1 p-2" aria-label="Bildirim Şablonları">
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
            <Switch label="Şablon Etkin" hint="Pasifken bu bildirim gönderilmez." checked={t.active} onChange={(e) => patch({ active: e.target.checked })} />
          </div>
          <Textarea label="Metin" value={t.body} onChange={(e) => patch({ body: e.target.value })} minRows={4} error={unknown.length ? `Tanımsız değişken: ${unknown.join(", ")}` : undefined} />
          <div>
            <p className="text-small text-muted">Değişken ekle</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button key={v} type="button" onClick={() => patch({ body: `${t.body}${t.body.endsWith(" ") || !t.body ? "" : " "}${v}` })} className="kz-mono min-h-9 rounded-md bg-surface px-2.5 text-small text-body ring-1 ring-line hover:bg-surface-raised hover:text-strong">
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
          <SegmentedControl<"comfortable" | "compact"> aria-label="Tablo Yoğunluğu" value={look.density} onValueChange={(density) => setLook({ ...look, density })} options={[{ value: "comfortable", label: "Rahat" }, { value: "compact", label: "Sıkı" }]} />
          <p className="text-micro text-muted">Sıkı yoğunluk, uzun abone ve sayaç listelerinde ekrana daha çok satır sığdırır.</p>
        </div>
        <div className="max-w-sm">
          <Select label="Dil" items={[{ value: "tr", label: "Türkçe" }, { value: "en", label: "English", disabled: true }]} value={look.language} onValueChange={(language) => language && setLook({ ...look, language })} />
          <p className="mt-1.5 text-micro text-muted">İngilizce arayüz henüz hazır değil.</p>
        </div>
      </div>
    </Panel>
  );
}


/* ------------------------------------------------------------------------ */
/* 8. Kurallar ve takvim                                                   */
/* ------------------------------------------------------------------------ */

const num0 = (s: string, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(s.replace(",", ".")));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Sayı alanı: yazarken yerel taslak, odak çıkınca ya da Enter'da depoya yazılır (her tuşta denetim kaydı düşmesin). */
function NumField({ label, hint, value, min, max, onCommit }: { label: string; hint: string; value: number; min: number; max: number; onCommit: (next: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = num0(draft, min, max, value);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };
  return <Input label={label} inputMode="numeric" hint={`${hint} (${min}–${max})`} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />;
}

function PolicySection({ go }: { go: PageProps["go"] }) {
  const { notify } = useApp();
  const policy = useCutPolicy();
  const settings = useSettings();
  const [holiday, setHoliday] = useState("");

  const edit = (label: string, patch: Parameters<typeof setCutPolicy>[0], before: string, after: string) => {
    setCutPolicy(patch);
    audit("Kesme kurallarını değiştirdi", label, before, after);
  };
  const field = (label: string, key: "remindAfterDays" | "noticeAfterDays" | "waitBusinessDays" | "reconnectSlaHours" | "workStart" | "workEnd", hint: string, min: number, max: number) => (
    <NumField key={key} label={label} hint={hint} value={policy[key]} min={min} max={max} onCommit={(next) => edit(label, { [key]: next } as Parameters<typeof setCutPolicy>[0], String(policy[key]), String(next))} />
  );
  const holidayOk = /^\d{4}-\d{2}-\d{2}$/.test(holiday) && !policy.holidays.includes(holiday);
  const zone = settings.params.zoneHours;
  const late = [...settings.lateRates].sort((a, b) => (a.from < b.from ? 1 : -1));

  return (
    <div className="grid gap-5">
      <Panel id="ay-kesme" title="Kesme ve Bağlama Kuralları" note="ÖRNEK süreler (yürürlükteki mevzuat doğrulanmalı). Değişiklik anında etkilidir; kesme emirleri iş gününe ve mesaiye oturur.">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {field("Hatırlatma (gecikme günü)", "remindAfterDays", "Vadeden kaç gün sonra SMS", 0, 10)}
          {field("İhtar (gecikme günü)", "noticeAfterDays", "Yazılı bildirim kaçıncı günde", 1, 60)}
          {field("İhtar sonrası bekleme (iş günü)", "waitBusinessDays", "Kesme emrinden önce en az", 1, 30)}
          {field("Bağlama hedef süresi (saat)", "reconnectSlaHours", "Ödeme bildiriminden enerjilendirmeye", 1, 168)}
          {field("Mesai başı (saat)", "workStart", "Kesme ve bağlama yalnız mesaide", 0, 12)}
          {field("Mesai sonu (saat)", "workEnd", "24 saatlik gösterim", 12, 23)}
        </div>
        <p className="border-t border-line-soft px-5 py-3 text-small text-muted">Muaf etiketler: {policy.exemptTags.join(", ")}. Muaf aboneler kesme listesine girmez, açık itirazı ya da aktif ödeme planı olan abone de.</p>
      </Panel>

      <Panel id="ay-tatil" title="Resmi Tatil Takvimi" note="Tatil ve hafta sonu iş günü sayılmaz; kesme ve planlı iş emri bir sonraki iş gününe kayar.">
        <div className="grid gap-4 p-4 sm:p-5">
          <ul role="list" className="flex flex-wrap gap-2">
            {policy.holidays.map((h) => (
              <li key={h} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-base ring-1 ring-line">
                <span className="kz-mono">{fullDate.format(parseDay(h))}</span>
                <button type="button" aria-label={`${h} tatilini kaldır`} className="grid size-6 place-items-center rounded-full text-muted hover:bg-surface-raised hover:text-strong" onClick={() => { setCutPolicy({ holidays: policy.holidays.filter((x) => x !== h) }); audit("Resmi tatil kaldırdı", h); }}>
                  ×
                </button>
              </li>
            ))}
            {policy.holidays.length === 0 ? <li className="text-base text-muted">Tanımlı tatil yok.</li> : null}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-48"><Input label="Tatil Ekle" type="date" value={holiday} onChange={(e) => setHoliday(e.target.value)} /></div>
            <Button variant="secondary" disabled={!holidayOk} onClick={() => { setCutPolicy({ holidays: [...policy.holidays, holiday].sort() }); audit("Resmi tatil ekledi", holiday); notify({ title: "Tatil Eklendi", body: fullDate.format(parseDay(holiday)), tone: "success" }); setHoliday(""); }}>Ekle</Button>
          </div>
        </div>
      </Panel>

      <Panel id="ay-zam" title="Gecikme Zammı Oran Tablosu" note="Tarih aralıklı ÖRNEK oranlar: gecikmiş anapara × gün sayısı. Yeni oran, Tarifeler'deki 'Gecikme Zammı' satırından yürürlük tarihiyle eklenir.">
        <ul role="list" className="divide-y divide-line-soft">
          {late.map((r) => (
            <li key={r.from} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <span className="text-base text-body">{fullDate.format(parseDay(r.from))} ve sonrası</span>
              <span className="kz-mono font-medium text-strong">%{r.monthlyPct.toLocaleString("tr-TR")} aylık</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line-soft p-3"><Button size="sm" variant="secondary" onClick={() => go("settings", { tab: "tarife" })}>Tarifeler'de Düzenle</Button></div>
      </Panel>

      <Panel id="ay-dilim" title="Zaman Dilimleri ve Sınır Değerler" note="ÖRNEK parametreler: faturalama çekirdeği bunları okur. Düzenleme Tarifeler bölümünde.">
        <dl className="grid gap-px overflow-hidden bg-line-soft sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Gündüz (T1)", zone.t1],
            ["Puant (T2)", zone.t2],
            ["Gece (T3)", zone.t3],
            ["Endüktif reaktif sınırı", `%${(settings.params.reactiveInductiveLimit * 100).toLocaleString("tr-TR")} (aktife oran)`],
            ["Kapasitif reaktif sınırı", `%${(settings.params.reactiveCapacitiveLimit * 100).toLocaleString("tr-TR")} (aktife oran)`],
            ["Serbest tüketici yıllık sınırı", `${settings.freeLimitKwh.toLocaleString("tr-TR")} kWh/yıl`],
          ].map(([k, v]) => (
            <div key={k} className="bg-overlay p-4">
              <dt className="text-small text-muted">{k}</dt>
              <dd className="mt-0.5 text-base font-medium text-strong">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-line-soft p-3"><Button size="sm" variant="secondary" onClick={() => go("settings", { tab: "tarife" })}>Tarifeler'de Düzenle</Button></div>
      </Panel>
    </div>
  );
}
