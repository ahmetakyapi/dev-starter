"use client";

import { useState, type ReactNode } from "react";
import {
  AlarmClock,
  Bell,
  BellOff,
  CalendarPlus,
  Check,
  CircleCheck,
  Compass,
  HardDrive,
  Mail,
  MailOpen,
  MessageSquareReply,
  Moon,
  MoreHorizontal,
  Plug,
  Settings2,
  Smartphone,
  Sparkles,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { ChannelMatrix, type MatrixValue } from "@/components/ui/channel-matrix";
import { ConnectionHero } from "@/components/ui/connection-hero";
import { Dialog } from "@/components/ui/dialog";
import { dissolveOut } from "@/components/ui/dissolve";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import type { NotificationItem } from "@/components/ui/notification-center";
import { cn } from "@/lib/utils";
import { DELAYED, OPEN_TICKETS, TICKETS, WORKSPACE, customer, member, num, periodStats, tl } from "./_data";
import { IconTile, PageBar, useApp } from "./_ui";

/**
 * Bildirimler (Axon referans turu, 2026-11): sekmeli ve gün gün gruplu akış;
 * satırda işin kendisi (Onayla, Yanıtla, Yeniden Bağla), ⋯ menüsünde
 * okunma, erteleme ve sessize alma. Sağda teslimat kanalları ve ertelenenler;
 * Tercihler yan panelde olay × kanal tablosu. Bütün sayılar Pusula'nın
 * verisinden: geciken sipariş, dosya alanı, haftalık ciro, indirim sınırı.
 */

export type Kind = "onay" | "bahsedilme" | "sistem" | "bilgi";
/** Uygulamanın TEK bildirim kaydı: zil kutusu da, bu sayfa da, kenar çubuğu rozeti de bunu okur. */
export type FeedItem = {
  id: string;
  kind: Kind;
  day: "bugun" | "dun";
  title: ReactNode;
  /** Ekran okuyucu ve menü için düz ad. */
  label: string;
  meta: string;
  read: boolean;
  /** Satırın solunda: kişi avatarı ya da ikon karosu. */
  actor?: string;
  icon?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  /** Satırdaki eylem bitince ("Onaylandı", "Bağlandı"). */
  done?: string;
  /** Zil kutusundaki göreli zaman için (ISO). */
  at: string;
};
type Item = FeedItem;

const MAX_DISCOUNT = 12;
const ASKED_DISCOUNT = 15;

const Mono = ({ children }: { children: ReactNode }) => <span className="font-mono text-small text-strong">{children}</span>;

export function buildItems(now = Date.now()): Item[] {
  const ago = (min: number) => new Date(now - min * 60_000).toISOString();
  const quote = OPEN_TICKETS.find((t) => t.customerId === "atlas" && t.tags.includes("Teklif")) ?? OPEN_TICKETS[0];
  const late = TICKETS[0];
  const invoice = TICKETS[1];
  const week = periodStats("hafta");
  const storagePct = Math.round((WORKSPACE.storage.usedGb / WORKSPACE.storage.totalGb) * 100);
  return [
    {
      id: "b1",
      at: ago(4),
      kind: "onay",
      day: "bugun",
      actor: "Mert Aksoy",
      label: `Mert Aksoy ${customer(quote.customerId).name} teklifinde %${ASKED_DISCOUNT} indirim için onayını istiyor`,
      title: (
        <>
          <b className="font-medium">Mert Aksoy</b> <Mono>{quote.id}</Mono> teklifinde %{ASKED_DISCOUNT} indirim için onayını istiyor
        </>
      ),
      meta: `Onay · Satış kuralının %${MAX_DISCOUNT} sınırını aşıyor · 4 dk önce`,
      read: false,
    },
    {
      id: "b2",
      at: ago(25),
      kind: "bahsedilme",
      day: "bugun",
      actor: "Can Demir",
      label: `Can Demir senden bahsetti: ${late.id}`,
      title: (
        <>
          <b className="font-medium">Can Demir</b> senden bahsetti: “@Ahmet {customer(late.customerId).name}’nın kargosu hala aktarmada, müşteriyi sen arar mısın?”
        </>
      ),
      meta: `Gelen Kutusu · ${late.id} · 25 dk önce`,
      read: false,
    },
    {
      id: "b3",
      at: ago(40),
      kind: "sistem",
      day: "bugun",
      icon: <Plug />,
      tone: "danger",
      label: `Kargo bağlantısının anahtarının süresi doldu, ${DELAYED.length} siparişin takibi bekliyor`,
      title: (
        <>
          Kargo bağlantısının anahtarının süresi doldu: <b className="font-medium">{num.format(DELAYED.length)} siparişin</b> takibi bekliyor
        </>
      ),
      meta: "Sistem · Entegrasyonlar · 40 dk önce",
      read: false,
    },
    {
      id: "b4",
      // Talep 09.47'de geldi, ilk yanıt 18 dk sonra; düzeltme ondan sonra (eskiden "1 sa önce": şikayetten önceydi).
      at: ago(15),
      kind: "bilgi",
      day: "bugun",
      actor: member(invoice.assignee).name,
      label: `${member(invoice.assignee).name} düzeltilmiş proformayı yükledi`,
      title: (
        <>
          <b className="font-medium">{member(invoice.assignee).name}</b> düzeltilmiş proformayı <Mono>{invoice.id}</Mono> talebine yükledi
        </>
      ),
      meta: `Gelen Kutusu · ${customer(invoice.customerId).name} · 15 dk önce`,
      read: true,
    },
    {
      id: "b5",
      at: ago(100),
      kind: "sistem",
      day: "bugun",
      icon: <Sparkles />,
      tone: "primary",
      label: `Haftalık özet: ${week.orderCount} sipariş, ${tl.format(week.revenue)} ciro`,
      title: (
        <>
          Haftalık özet: son 7 günde <b className="font-medium">{num.format(week.orderCount)} sipariş</b> ve <b className="font-medium">{tl.format(week.revenue)}</b> ciro
        </>
      ),
      meta: "Özet · Pazartesi 09.00",
      read: true,
    },
    {
      id: "b6",
      at: ago(1100),
      kind: "bilgi",
      day: "dun",
      icon: <CalendarPlus />,
      tone: "neutral",
      label: "Selin Arslan bir randevu ekledi",
      title: (
        <>
          <b className="font-medium">Selin Arslan</b> bir randevu ekledi: Peştemal kartelası sunumu, 4 Kas 15.30
        </>
      ),
      meta: "Takvim · Dün 16.20",
      read: true,
    },
    {
      id: "b7",
      at: ago(1528),
      kind: "sistem",
      day: "dun",
      icon: <HardDrive />,
      tone: "warning",
      label: `Dosya alanının %${storagePct}'i dolu`,
      title: (
        <>
          Dosya alanının <b className="font-medium">%{storagePct}</b>’i dolu ({WORKSPACE.storage.usedGb.toLocaleString("tr-TR")} / {WORKSPACE.storage.totalGb} GB)
        </>
      ),
      meta: `${WORKSPACE.plan} · Dün 09.12`,
      read: true,
    },
  ];
}

export const SNOOZED_START: Item = {
  id: "b0",
  at: new Date().toISOString(),
  kind: "sistem",
  day: "bugun",
  icon: <AlarmClock />,
  tone: "neutral",
  label: "Kargo bağlantısı hız sınırı uyarıları",
  title: "Kargo bağlantısı hız sınırı uyarıları",
  meta: "Yarın 09.00",
  read: true,
};

const TABS: readonly { value: "tum" | Kind; label: string; match: (i: Item) => boolean }[] = [
  { value: "tum", label: "Tümü", match: () => true },
  { value: "bahsedilme", label: "Bahsedenler", match: (i) => i.kind === "bahsedilme" },
  { value: "onay", label: "Onaylar", match: (i) => i.kind === "onay" },
  { value: "sistem", label: "Sistem", match: (i) => i.kind === "sistem" },
];

const CHANNELS = [
  { id: "app", label: "Uygulama İçi" },
  { id: "mail", label: "E-Posta" },
  { id: "sms", label: "SMS" },
] as const;

const EVENTS = [
  { id: "acil", label: "Acil Talep", hint: "Öncelik Acil olan yeni talep" },
  { id: "bahsedilme", label: "Senden Bahsedildiğinde", hint: "@ahmet yorumlarda ve notlarda" },
  { id: "onay", label: "Onay İstekleri", hint: "İndirim ve iade onayları" },
  { id: "gecikme", label: "Geciken Sipariş", hint: "Kargo teslim tarihini geçince" },
  { id: "sla", label: "Yanıt Süresi Doluyor", hint: "İlk yanıt hedefine 10 dakika kala" },
  { id: "baglanti", label: "Bağlantı Sorunları", hint: "Süresi dolan ya da hata veren entegrasyon" },
  { id: "ozet", label: "Haftalık Özet", hint: "Pazartesi 09.00" },
  { id: "guvenlik", label: "Güvenlik", hint: "Yeni cihazdan giriş; kapatılamaz", locked: true },
] as const;

const DEFAULTS: MatrixValue = {
  acil: ["app", "mail", "sms"],
  bahsedilme: ["app", "mail"],
  onay: ["app", "mail"],
  gecikme: ["app", "mail"],
  sla: ["app", "sms"],
  baglanti: ["app", "mail"],
  ozet: ["mail"],
  guvenlik: ["app", "mail"],
};

const QUIET = [
  { value: "kapali", label: "Kapalı" },
  { value: "20-08", label: "20.00 – 08.00" },
  { value: "22-08", label: "22.00 – 08.00" },
];
const DIGEST = [
  { value: "aninda", label: "Anında" },
  { value: "gunluk", label: "Günlük 08.30" },
  { value: "haftalik", label: "Haftalık, Pazartesi" },
];

/** Zil kutusunun satırı: aynı kayıt, düz başlıkla. */
export function toBell(item: Item): NotificationItem {
  return { id: item.id, title: item.label, body: item.meta.replace(/ · [^·]*önce$/, ""), at: item.at, read: item.read, actor: item.actor };
}

export function BildirimPage() {
  const { navigate, notify, feed: items, setFeed: setItems, snoozed, setSnoozed } = useApp();
  const [tab, setTab] = useState<string>("tum");
  const [prefsOpen, setPrefsOpen] = useState(false);
  // Kaydedilen tercih ve paneldeki taslak ayrı: Vazgeç ya da kapatma taslağı atar, yalnız Kaydet uygular.
  type Prefs = { matrix: MatrixValue; quiet: string | null; digest: string | null };
  const [saved, setSaved] = useState<Prefs>({ matrix: DEFAULTS, quiet: "20-08", digest: "gunluk" });
  const [draft, setDraft] = useState<Prefs>(saved);
  const { quiet, digest } = saved;
  const openPrefs = () => {
    setDraft(saved);
    setPrefsOpen(true);
  };

  const unread = items.filter((i) => !i.read).length;
  const patch = (id: string, change: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));
  const quote = OPEN_TICKETS.find((t) => t.customerId === "atlas" && t.tags.includes("Teklif")) ?? OPEN_TICKETS[0];

  const approve = (item: Item) => {
    patch(item.id, { done: "Onaylandı", read: true });
    notify({
      tone: "success",
      title: `%${ASKED_DISCOUNT} İndirim Onaylandı`,
      body: `${quote.id} · ${customer(quote.customerId).name}; teklif Mert’e döndü.`,
      undo: () => patch(item.id, { done: undefined, read: false }),
    });
  };
  // Yeniden bağlama penceresi: önce ne bağlandığını ve hangi izinleri aldığını gösterir, sonra bağlar.
  const [connect, setConnect] = useState<{ item: Item; status: "idle" | "connecting" | "connected" } | null>(null);
  const reconnect = (item: Item) => setConnect({ item, status: "idle" });
  const runConnect = () => {
    if (!connect) return;
    const item = connect.item;
    setConnect({ item, status: "connecting" });
    window.setTimeout(() => {
      setConnect({ item, status: "connected" });
      window.setTimeout(() => {
        setConnect(null);
        patch(item.id, { done: "Bağlandı", read: true });
        notify({ tone: "success", title: "Kargo Bağlantısı Yenilendi", body: `${num.format(DELAYED.length)} siparişin takibi yeniden başladı.` });
      }, 700);
    }, 1200);
  };
  const snooze = (item: Item, when: string) => {
    setItems((list) => list.filter((i) => i.id !== item.id));
    setSnoozed((list) => [{ ...item, meta: when }, ...list]);
    notify({ tone: "info", title: "Bildirim Ertelendi", body: `${when} yeniden gelecek.`, undo: () => unsnooze(item.id, item) });
  };
  /** Ertelemeyi geri al: kayıt akışın başına okunmamış döner. Güncelleyicide yan etki yok (katı modda iki kez çalışmasın). */
  const unsnooze = (id: string, original?: Item) => {
    const found = original ?? snoozed.find((i) => i.id === id);
    setSnoozed((list) => list.filter((i) => i.id !== id));
    if (!found) return;
    const back = id === "b0" ? { ...found, meta: "Sistem · Entegrasyonlar · ertelemeden döndü" } : found;
    setItems((all) => [{ ...back, read: false }, ...all.filter((i) => i.id !== id)]);
  };

  const actions = (item: Item): ReactNode => {
    if (item.done) {
      return (
        <Badge tone="success" dot>
          {item.done}
        </Badge>
      );
    }
    if (item.id === "b1") {
      return (
        <>
          <Button size="sm" onClick={() => approve(item)}>
            <Check aria-hidden />
            Onayla
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate("inbox", { ticket: quote.id })}>
            Teklifi Aç
          </Button>
        </>
      );
    }
    if (item.id === "b2") {
      return (
        <Button size="sm" variant="secondary" onClick={() => navigate("inbox", { ticket: TICKETS[0].id })}>
          <MessageSquareReply aria-hidden />
          Yanıtla
        </Button>
      );
    }
    if (item.id === "b3") {
      return (
        <Button size="sm" variant="secondary" onClick={() => reconnect(item)}>
          <Plug aria-hidden />
          Yeniden Bağla
        </Button>
      );
    }
    return null;
  };

  const feed = (filter: (i: Item) => boolean) => {
    const shown = items.filter(filter);
    if (!shown.length) {
      return (
        <div className="grid place-items-center gap-2 px-6 py-14 text-center">
          <IconTile tone="neutral">
            <CircleCheck />
          </IconTile>
          <p className="text-base font-medium text-strong">Burada Okunacak Bir Şey Yok</p>
          <p className="text-small text-muted">Yeni bildirim gelince bu sekmede görünür.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 pt-3">
        {(["bugun", "dun"] as const).map((day) => {
          const list = shown.filter((i) => i.day === day);
          if (!list.length) return null;
          const head = `feed-${day}`;
          return (
            <section key={day} aria-labelledby={head}>
              <h3 id={head} className="px-3 pb-1 text-small font-medium text-muted">
                {day === "bugun" ? "Bugün" : "Dün"}
              </h3>
              <ul className="grid gap-0.5">
                {list.map((item) => (
                  <Row key={item.id} item={item} actions={actions(item)}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`${item.label}: eylemler`}
                        className="inline-grid size-11 place-items-center pointer-fine:size-9 rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-4"
                      >
                        <MoreHorizontal aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem icon={item.read ? <Mail /> : <MailOpen />} onClick={() => patch(item.id, { read: !item.read })}>
                            {item.read ? "Okunmadı Say" : "Okundu Say"}
                          </DropdownMenuItem>
                          <DropdownMenuItem icon={<AlarmClock />} onClick={() => snooze(item, "1 saat sonra")}>
                            1 Saat Ertele
                          </DropdownMenuItem>
                          <DropdownMenuItem icon={<AlarmClock />} onClick={() => snooze(item, "Yarın 09.00")}>
                            Yarına Ertele
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            icon={<BellOff />}
                            onClick={async () => {
                              // Kalıcı kaldırma: satır dağılarak gider (dissolve), sonra listeden çıkar.
                              const row = [...document.querySelectorAll<HTMLElement>(`[data-feed-row="${item.id}"]`)].find((el) => el.offsetParent);
                              if (row) await dissolveOut(row);
                              setItems((list) => list.filter((i) => i.id !== item.id));
                              notify({ tone: "info", title: "Bu Konu Sessize Alındı", body: "Yeni gelişmeler akışa düşmez; tercihlerden geri açılır." });
                            }}
                          >
                            Bu Konuyu Sessize Al
                          </DropdownMenuItem>
                          <DropdownMenuItem icon={<Settings2 />} onClick={openPrefs}>
                            Bildirim Tercihleri…
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Row>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Bildirimler"
        description={`${num.format(unread)} Okunmamış · Uygulama İçi, E-Posta ve SMS`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled={!unread} onClick={() => setItems((list) => list.map((i) => ({ ...i, read: true })))}>
              <MailOpen aria-hidden />
              Tümünü Okundu Say
            </Button>
            <Button variant="secondary" size="sm" onClick={openPrefs}>
              <Settings2 aria-hidden />
              Tercihler
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Bildirim Akışı" className="rounded-xl bg-overlay p-3 shadow-raised ring-1 ring-line sm:p-4">
          <Tabs
            aria-label="Bildirim Türü"
            value={tab}
            onValueChange={setTab}
            items={TABS.map((t) => ({
              value: t.value,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  <span className="text-small text-muted tabular-nums">{num.format(items.filter(t.match).length)}</span>
                </span>
              ),
              panel: feed(t.match),
            }))}
          />
        </section>

        <div className="grid gap-4">
          <section aria-labelledby="bildirim-teslim" className="rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line">
            <h2 id="bildirim-teslim" className="text-base font-semibold text-strong">
              Teslimat
            </h2>
            <p className="mt-0.5 text-small text-muted">Bildirimler nereye gitsin</p>
            <div className="mt-3 divide-y divide-line-soft">
              <Channel icon={<Bell />} label="Uygulama İçi" hint="Her şey" defaultChecked />
              <Channel icon={<Mail />} label="E-Posta" hint={digest === "aninda" ? "Anında" : digest === "haftalik" ? "Haftalık özet, Pazartesi" : "Günlük özet 08.30"} defaultChecked />
              <Channel icon={<Smartphone />} label="SMS" hint="Yalnız acil talepler" defaultChecked />
              <Channel icon={<Moon />} label="Sessiz Saatler" hint={quiet === "kapali" ? "Kapalı" : `${QUIET.find((q) => q.value === quiet)?.label} · yalnız acil`} defaultChecked={quiet !== "kapali"} />
            </div>
          </section>

          <section aria-labelledby="bildirim-erteleme" className="rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line">
            <h2 id="bildirim-erteleme" className="text-base font-semibold text-strong">
              Ertelenenler
            </h2>
            <p className="mt-0.5 text-small text-muted">
              {snoozed.length ? `${num.format(snoozed.length)} bildirim sonra yeniden gelecek` : "Ertelenmiş bildirim yok"}
            </p>
            {snoozed.length ? (
              <ul className="mt-3 grid gap-1">
                {snoozed.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                    <AlarmClock aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small text-strong">{s.label}</span>
                      <span className="block text-micro text-muted">{s.meta}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => unsnooze(s.id)}
                      aria-label={`${s.label}: ertelemeyi geri al`}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-small pointer-fine:min-h-7 font-medium text-primary-ink transition-colors hover:bg-primary-wash"
                    >
                      Geri Al
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>

      <Dialog
        open={Boolean(connect)}
        onOpenChange={(next) => !next && connect?.status === "idle" && setConnect(null)}
        title="Kargo Bağlantısı"
        description="Pusula Kargo Entegrasyonu · anahtarın süresi bugün 10.00’da doldu."
        footer={
          <>
            <Button variant="secondary" disabled={connect?.status !== "idle"} onClick={() => setConnect(null)}>
              Vazgeç
            </Button>
            <Button disabled={connect?.status !== "idle"} onClick={runConnect}>
              <Plug aria-hidden />
              {connect?.status === "connecting" ? "Bağlanıyor…" : connect?.status === "connected" ? "Bağlandı" : "Yeniden Bağla"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <ConnectionHero
            from={{ label: "Pusula", icon: <Compass /> }}
            to={{ label: "Kargo", icon: <Truck /> }}
            status={connect?.status ?? "idle"}
          />
          <p aria-live="polite" className="sr-only">
            {connect?.status === "connecting" ? "Bağlanıyor" : connect?.status === "connected" ? "Bağlandı" : ""}
          </p>
          <div className="grid gap-4 rounded-xl p-4 ring-1 ring-line">
            <div>
              <h3 className="text-base font-semibold text-strong">Hakkında</h3>
              <p className="mt-1 text-base text-body">
                Yoldaki ve geciken siparişlerin kargo durumunu 15 dakikada bir çeker; söz verilen tarih geçince talebi gecikme etiketiyle açar. Şu an {num.format(DELAYED.length)} siparişin takibi bekliyor.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-strong">İzinler</h3>
              <ul aria-label="İzinler" className="mt-2 flex flex-wrap gap-1.5">
                {["Kargo Takibi", "Sipariş Durumu", "Teslim Bildirimi", "Yalnız Okuma"].map((p) => (
                  <li key={p}>
                    <Badge shape="rounded" variant="outline">
                      {p}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Dialog>

      <Sheet
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
        side="right"
        size="lg"
        icon={<Settings2 />}
        title="Bildirim Tercihleri"
        description="Yalnız senin için; çalışma alanı varsayılanını yöneticiler belirler."
        footerStart={
          <Button variant="ghost" className="text-primary-ink" onClick={() => setDraft((d) => ({ ...d, matrix: DEFAULTS }))}>
            Varsayılanlara Dön
          </Button>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPrefsOpen(false)}>
              Vazgeç
            </Button>
            <Button
              onClick={() => {
                setSaved(draft);
                setPrefsOpen(false);
                notify({ tone: "success", title: "Bildirim Tercihleri Kaydedildi" });
              }}
            >
              Tercihleri Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <ChannelMatrix caption="Olaylara Göre Bildirim Kanalları" channels={CHANNELS} rows={EVENTS} value={draft.matrix} onValueChange={(matrix) => setDraft((d) => ({ ...d, matrix }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Sessiz Saatler" items={QUIET} value={draft.quiet} onValueChange={(v) => setDraft((d) => ({ ...d, quiet: v }))} />
            <Select label="E-Posta Özeti" items={DIGEST} value={draft.digest} onValueChange={(v) => setDraft((d) => ({ ...d, digest: v }))} />
          </div>
          <Switch label="Acil talepler sessiz saatlerde de gelir" hint="İlk yanıt hedefine 10 dakikadan az kalan Acil talepler SMS’le gelir." defaultChecked />
        </div>
      </Sheet>
    </div>
  );
}

function Row({ item, actions, children }: { item: Item; actions: ReactNode; children: ReactNode }) {
  return (
    <li
      data-feed-row={item.id}
      className={cn(
        "relative flex gap-3 rounded-lg px-3 py-3 transition-colors duration-200",
        item.done ? "bg-success-wash" : "hover:bg-surface",
      )}
    >
      {/* Okunmadı noktası: renk tek işaret değil, metin ekran okuyucuda. */}
      <span className="flex w-2 shrink-0 justify-center pt-3">
        {item.read ? null : (
          <>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <span className="sr-only">Okunmadı:</span>
          </>
        )}
      </span>
      <span className="shrink-0 pt-0.5">
        {item.actor ? (
          <Avatar name={item.actor} size="sm" />
        ) : (
          <IconTile tone={item.tone ?? "neutral"}>{item.icon ?? <TriangleAlert />}</IconTile>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-base text-body", !item.read && "text-strong")}>{item.title}</p>
        <p className="mt-0.5 text-small text-muted">{item.meta}</p>
        {actions ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

function Channel({ icon, label, hint, defaultChecked }: { icon: ReactNode; label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <IconTile tone="neutral">{icon}</IconTile>
      <Switch label={label} hint={hint} defaultChecked={defaultChecked} className="min-w-0 flex-1" />
    </div>
  );
}


