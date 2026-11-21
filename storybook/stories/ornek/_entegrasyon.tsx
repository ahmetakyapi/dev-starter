"use client";

import {
  BarChart3,
  BookOpen,
  Copy,
  FileText,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MoreHorizontal,
  Pause,
  Plug,
  RefreshCw,
  Send,
  Settings,
  Unplug,
  Users,
  Workflow,
  Zap,
  Filter,
  GraduationCap,
  Mail,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { IntegrationCard } from "@/components/ui/integration-card";
import { PermissionList, type Permission } from "@/components/ui/permission-list";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/toast";
import { APPS, AppGlyph, AppTile, PageHead, SampleNote, SampleShell, type AppId } from "./_p3-ortak";

/**
 * Entegrasyonlar sayfası (MailPulse referansı: yapı ve davranış; ürün, uygulama
 * adları ve metinler kurgusal). Izgara: Bağla → izin dökümlü pencere, bağlanınca
 * kart bağlı olur ve bildirim çıkar; bağlı kartın menüsü; "Ayrıntılar" yan
 * panelde Ayarlar / Olaylar / Son hareket.
 */

type Category = "Ödemeler" | "Web sitesi" | "Analitik" | "Topluluk" | "Veri" | "İçerik" | "Ticaret";

type Integration = {
  id: AppId;
  name: string;
  category: Category;
  description: string;
  setup: string;
  scopes: readonly Permission[];
  events: readonly { id: string; label: string; hint: string; on: boolean }[];
  activity: readonly { id: string; text: string; when: string }[];
};

const INTEGRATIONS: readonly Integration[] = [
  {
    id: "odeme",
    name: "Ödeme",
    category: "Ödemeler",
    description: "Ücretli kademeleri tahsil et, müşterileri eşitle ve ödemeleri al.",
    setup: "Ücretsiz · 4 dk kurulum",
    scopes: [
      { id: "m", text: "Müşterileri ve abonelikleri okur", access: "read" },
      { id: "o", text: "Ödeme ve fatura oturumları oluşturur", access: "write" },
      { id: "p", text: "Ödeme ve iade güncellemelerini alır", access: "read" },
    ],
    events: [
      { id: "yeni", label: "Yeni ücretli abone", hint: "Ad, plan ve kaynak", on: true },
      { id: "iade", label: "İade yapıldı", hint: "Tutar ve gerekçe", on: true },
      { id: "kayip", label: "Abonelik iptali", hint: "İptal gerekçesiyle", on: false },
    ],
    activity: [
      { id: "1", text: "Eşitlendi: 14 müşteri güncellendi", when: "4 dk önce" },
      { id: "2", text: "Ödeme alındı: Yıllık plan", when: "1 sa önce" },
    ],
  },
  {
    id: "site",
    name: "Site",
    category: "Web sitesi",
    description: "Kayıt formlarını ve bülten yazılarını sitene göm.",
    setup: "Ücretsiz · 5 dk kurulum",
    scopes: [
      { id: "f", text: "Form gönderimlerini okur", access: "read" },
      { id: "y", text: "Sayfalara bülten parçası ekler", access: "write" },
    ],
    events: [
      { id: "form", label: "Form gönderildi", hint: "E-posta ve kaynak sayfa", on: true },
      { id: "yayin", label: "Yazı yayımlandı", hint: "Bülten arşivine ekle", on: true },
    ],
    activity: [{ id: "1", text: "Form gönderildi: /kayit", when: "18 dk önce" }],
  },
  {
    id: "analiz",
    name: "Analiz",
    category: "Analitik",
    description: "Her bağlantıya kampanya etiketi ekle, oturumları sayıya bağla.",
    setup: "Ücretsiz · 3 dk kurulum",
    scopes: [
      { id: "o", text: "Oturum ve olay sayılarını okur", access: "read" },
      { id: "e", text: "Bağlantılara kampanya etiketi ekler", access: "write" },
    ],
    events: [
      { id: "e", label: "Haftalık özet", hint: "Pazartesi 09:00", on: true },
    ],
    activity: [{ id: "1", text: "Eşitlendi: 3 kampanya etiketi", when: "1 sa önce" }],
  },
  {
    id: "sohbet",
    name: "Sohbet",
    category: "Topluluk",
    description: "Yeni ücretli aboneleri ve yanıtları bir kanala yaz.",
    setup: "Ücretsiz · 3 dk kurulum",
    scopes: [
      { id: "k", text: "Kanalları listeler", access: "read" },
      { id: "m", text: "Seçtiğin kanala ileti yazar", access: "write" },
    ],
    events: [
      { id: "yeni", label: "Yeni ücretli abone", hint: "Ad, plan ve kaynak", on: true },
      { id: "kamp", label: "Kampanya gönderildi", hint: "Bir saat sonra açılma oranı", on: true },
      { id: "cik", label: "Abonelikten çıkış artışı", hint: "Bir günde %2'nin üstü", on: false },
      { id: "ozet", label: "Haftalık özet", hint: "Pazartesi 09:00", on: true },
    ],
    activity: [
      { id: "1", text: "İleti yazıldı: Melis Yaman ücretliye geçti", when: "2 dk önce" },
      { id: "2", text: "İleti yazıldı: \"#48\" 18.420 kişiye gitti", when: "1 sa önce" },
      { id: "3", text: "İleti yazıldı: Haftalık özet · %47,8 açılma", when: "Pzt 09:00" },
    ],
  },
  {
    id: "webhook",
    name: "Webhook",
    category: "Veri",
    description: "Abone ve kampanya olaylarını istediğin bir adrese gönder.",
    setup: "Ücretsiz · 5 dk kurulum",
    scopes: [{ id: "o", text: "Olayları belirlediğin adrese gönderir", access: "write" }],
    events: [
      { id: "abone", label: "Abone olayları", hint: "Kayıt, çıkış, güncelleme", on: true },
      { id: "kamp", label: "Kampanya olayları", hint: "Gönderim, açılma, tıklama", on: true },
    ],
    activity: [{ id: "1", text: "Son olay 32 sn önce gönderildi", when: "32 sn önce" }],
  },
  {
    id: "kargo",
    name: "Kargo",
    category: "Ticaret",
    description: "Dijital ürün satışını ve alıcıları abone olarak eşitle.",
    setup: "Ücretsiz · 5 dk kurulum",
    scopes: [
      { id: "s", text: "Sipariş ve alıcıları okur", access: "read" },
      { id: "a", text: "Alıcıları abone olarak ekler", access: "write" },
    ],
    events: [{ id: "s", label: "Yeni sipariş", hint: "Alıcıyı aboneye çevir", on: true }],
    activity: [],
  },
  {
    id: "takvim",
    name: "Takvim",
    category: "İçerik",
    description: "Yayın takvimini kampanyalarınla eşle.",
    setup: "Ücretsiz · 2 dk kurulum",
    scopes: [{ id: "t", text: "Etkinlikleri okur ve yazar", access: "write" }],
    events: [{ id: "t", label: "Gönderim planlandı", hint: "Takvime etkinlik ekle", on: true }],
    activity: [],
  },
  {
    id: "notlar",
    name: "Notlar",
    category: "İçerik",
    description: "Notlardaki taslakları yazıya çevir ve tek tıkla içe aktar.",
    setup: "Ücretsiz · 2 dk kurulum",
    scopes: [{ id: "n", text: "Seçtiğin sayfaları okur", access: "read" }],
    events: [{ id: "n", label: "Taslak güncellendi", hint: "Bülten taslağını yenile", on: false }],
    activity: [],
  },
  {
    id: "tablo",
    name: "Tablo",
    category: "Veri",
    description: "Abone listesini canlı bir tabloya aktar.",
    setup: "Ücretsiz · 1 dk kurulum",
    scopes: [{ id: "t", text: "Tablolara satır yazar", access: "write" }],
    events: [{ id: "t", label: "Abone eklendi", hint: "Tabloya yeni satır", on: true }],
    activity: [],
  },
  {
    id: "video",
    name: "Video",
    category: "İçerik",
    description: "Son videolarını her sayıya katıl.",
    setup: "Ücretsiz · 1 dk kurulum",
    scopes: [{ id: "v", text: "Kanal videolarını okur", access: "read" }],
    events: [{ id: "v", label: "Yeni video", hint: "Sonraki sayıya ekle", on: false }],
    activity: [],
  },
  {
    id: "rapor",
    name: "Rapor",
    category: "Veri",
    description: "Aylık gelir ve büyüme raporunu dosya olarak al.",
    setup: "Ücretsiz · 2 dk kurulum",
    scopes: [{ id: "r", text: "Raporları oluşturur", access: "write" }],
    events: [{ id: "r", label: "Aylık rapor", hint: "Ayın ilk günü", on: false }],
    activity: [],
  },
  {
    id: "muhasebe",
    name: "Muhasebe",
    category: "Ödemeler",
    description: "Gelir kayıtlarını muhasebe yazılımına işle.",
    setup: "Ücretsiz · 6 dk kurulum",
    scopes: [
      { id: "g", text: "Gelir kayıtlarını okur", access: "read" },
      { id: "f", text: "Fatura taslağı oluşturur", access: "write" },
    ],
    events: [{ id: "f", label: "Fatura taslağı", hint: "Her ödeme için", on: false }],
    activity: [],
  },
];

const TABS = ["Hepsi", "Bağlı", "Ödemeler", "Web sitesi", "Analitik", "Topluluk"] as const;
type Tab = (typeof TABS)[number];

const CURRENCIES = [
  { value: "try", label: "TRY: Türk lirası" },
  { value: "usd", label: "USD: ABD doları" },
  { value: "eur", label: "EUR: Euro" },
];

const CHANNELS = [
  { value: "yeni", label: "#yeni-aboneler" },
  { value: "genel", label: "#genel" },
  { value: "buyume", label: "#buyume" },
];

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Ana Menü",
    items: [
      { href: "/genel", label: "Genel Bakış", icon: <LayoutDashboard /> },
      { href: "/kitle", label: "Kitle", icon: <Users /> },
      { href: "/kampanyalar", label: "Kampanyalar", icon: <Send /> },
      { href: "/icerik", label: "İçerik", icon: <FileText /> },
      { href: "/etkilesim", label: "Etkileşim", icon: <Megaphone /> },
    ],
  },
  {
    label: "Yönet",
    items: [
      { href: "/aboneler", label: "Aboneler", icon: <Inbox />, badge: "18,4 b" },
      { href: "/otomasyonlar", label: "Otomasyonlar", icon: <Zap /> },
      { href: "/segmentler", label: "Segmentler", icon: <Filter /> },
      { href: "/entegrasyonlar", label: "Entegrasyonlar", icon: <Workflow /> },
    ],
  },
  {
    label: "Kaynaklar",
    items: [
      { href: "/analitik", label: "Analitik", icon: <BarChart3 /> },
      { href: "/raporlar", label: "Raporlar", icon: <BookOpen /> },
      { href: "/ogren", label: "Öğren", icon: <GraduationCap /> },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { href: "/yardim", label: "Yardım Merkezi", icon: <LifeBuoy /> },
      { href: "/sistem", label: "Sistem Ayarları", icon: <Settings /> },
    ],
  },
];

type State = { connected: boolean; syncing: boolean; lastSync: string };

const START: Record<string, State> = {
  odeme: { connected: true, syncing: true, lastSync: "4 dk önce eşitlendi" },
  site: { connected: true, syncing: true, lastSync: "18 dk önce eşitlendi" },
  analiz: { connected: true, syncing: true, lastSync: "1 sa önce eşitlendi" },
  sohbet: { connected: true, syncing: true, lastSync: "2 dk önce eşitlendi" },
  webhook: { connected: true, syncing: true, lastSync: "Son olay 32 sn önce" },
};

/** Para birimi ve müşteri aktarımı yalnız ödeme uygulamalarında anlamlı. */
const isPayment = (i: Integration) => i.category === "Ödemeler";

const stateOf = (all: Record<string, State>, id: string): State => all[id] ?? { connected: false, syncing: true, lastSync: "" };

export function EntegrasyonlarPage({ initialDetail }: { initialDetail?: AppId }) {
  const [tab, setTab] = useState<Tab>("Hepsi");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Record<string, State>>(START);
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [detail, setDetail] = useState<AppId | null>(initialDetail ?? null);
  const [currency, setCurrency] = useState("try");
  const [importAll, setImportAll] = useState(true);

  const patch = (id: string, next: Partial<State>) => setState((prev) => ({ ...prev, [id]: { ...stateOf(prev, id), ...next } }));

  const connectedCount = INTEGRATIONS.filter((i) => stateOf(state, i.id).connected).length;
  const tabLabel = (t: Tab) =>
    t === "Hepsi" ? `Hepsi ${INTEGRATIONS.length}` : t === "Bağlı" ? `Bağlı ${connectedCount}` : t;

  const visible = useMemo(
    () =>
      INTEGRATIONS.filter((i) => {
        const s = stateOf(state, i.id);
        const inTab = tab === "Hepsi" || (tab === "Bağlı" ? s.connected : i.category === tab);
        return inTab && (query.trim() === "" || matchesTr(`${i.name} ${i.description} ${i.category}`, query, { fold: true }));
      }),
    [tab, query, state],
  );

  const detailItem = INTEGRATIONS.find((i) => i.id === detail) ?? null;

  const grid = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((i) => {
        const s = stateOf(state, i.id);
        return (
          <IntegrationCard
            key={i.id}
            name={i.name}
            category={i.category}
            description={i.description}
            icon={<AppGlyph id={i.id} />}
            connected={s.connected}
            syncing={s.syncing}
            lastSync={s.lastSync}
            setup={i.setup}
            onConnect={() => setConnecting(i)}
            onToggle={(next) => patch(i.id, { syncing: next })}
            menu={
              s.connected ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<IconButton icon={MoreHorizontal} aria-label={`${i.name} seçenekleri`} variant="ghost" />} />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem icon={<Plug />} onClick={() => setDetail(i.id)}>
                      Ayrıntılar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      icon={<RefreshCw />}
                      shortcut="S"
                      onClick={() => {
                        patch(i.id, { lastSync: "Az önce eşitlendi" });
                        toast.success(`${i.name} eşitlendi`);
                      }}
                    >
                      Şimdi eşitle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      icon={<Pause />}
                      onClick={() => {
                        patch(i.id, { syncing: false });
                        toast(`${i.name} eşitlemesi duraklatıldı`);
                      }}
                    >
                      Eşitlemeyi duraklat
                    </DropdownMenuItem>
                    <DropdownMenuItem icon={<Copy />} onClick={() => toast.info("Webhook adresi kopyalandı")}>
                      Webhook adresini kopyala
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      tone="danger"
                      icon={<Unplug />}
                      onClick={() => {
                        patch(i.id, { connected: false });
                        toast(`${i.name} bağlantısı kesildi`);
                      }}
                    >
                      Bağlantıyı kes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );

  const empty = <p className="rounded-xl bg-surface p-6 text-center text-base text-muted">Eşleşen entegrasyon yok.</p>;

  return (
    <SampleShell
      brand="Bültenci"
      logo={<Mail />}
      nav={NAV}
      current="/entegrasyonlar"
      user={{ name: "Ayşe Demir", detail: "Sahip" }}
      crumbs={["Çalışma Alanı", "Entegrasyonlar"]}
    >
      <PageHead
        title="Entegrasyonlar"
        subtitle="Bültenci'yi zaten kullandığın araçlara bağla."
        actions={
          <>
            <Button variant="secondary">API belgeleri</Button>
            <Button variant="brand">Entegrasyon iste</Button>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-0 max-w-full">
          <Tabs
            aria-label="Entegrasyon grubu"
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            items={TABS.map((t) => ({ value: t, label: tabLabel(t), panel: null }))}
          />
        </div>
        <SearchField label="Entegrasyon ara" placeholder="Entegrasyon ara" value={query} onValueChange={setQuery} resultCount={visible.length} className="w-full sm:ml-auto sm:w-64" />
      </div>

      <section aria-label="Entegrasyon listesi" className="mt-4">
        {visible.length > 0 ? grid : empty}
      </section>

      <SampleNote className="mt-8" />

      {/* Bağla penceresi */}
      <Dialog
        open={connecting !== null}
        onOpenChange={(open) => {
          if (!open) setConnecting(null);
        }}
        title={connecting ? `${connecting.name} uygulamasını bağla` : ""}
        description={connecting?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConnecting(null)}>
              Vazgeç
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                if (!connecting) return;
                patch(connecting.id, { connected: true, syncing: true, lastSync: "Az önce eşitlendi" });
                toast.success(`${connecting.name} bağlandı`, { description: importAll ? (isPayment(connecting) ? "Mevcut müşteriler e-postayla eşleniyor." : "Son 30 günün kayıtları eşitleniyor.") : undefined });
                setConnecting(null);
              }}
            >
              {connecting ? `${connecting.name} ile bağlan` : "Bağlan"}
            </Button>
          </>
        }
      >
        {connecting ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-2" aria-hidden>
              <span className="grid size-9 place-items-center rounded-md bg-brand text-on-brand [&_svg]:size-5">
                <Mail />
              </span>
              <span className="text-muted">···</span>
              <AppTile id={connecting.id} className="size-9" />
            </div>
            <PermissionList
              title="BÜLTENCİ ŞUNLARI YAPABİLECEK"
              items={connecting.scopes}
              footnote={`${connecting.name} sayfasında yetkilendirme (OAuth) ile güvenle bağlanır.`}
            />
            <PolicyChecks
              title="Bağlanmadan Önce"
              checks={[
                { id: "yetki", label: "Yetkilendirme (OAuth) ile bağlanır", detail: "Parola paylaşılmaz.", state: "pass" },
                { id: "kapsam", label: `${connecting.scopes.length} izin istenecek`, detail: "Ayrıntıdan her an geri alınır.", state: connecting.scopes.length > 3 ? "warn" : "pass" },
                { id: "para", label: isPayment(connecting) ? "Para birimi seçili" : "Eşitleme aralığı hazır", state: "pass" },
              ]}
            />
            {isPayment(connecting) ? (
              <>
                <Select label="Para birimi" items={CURRENCIES} value={currency} onValueChange={(v) => setCurrency(v ?? "try")} />
                <p className="-mt-2 text-micro text-muted">Fiyatlar, faturalar ve gelir raporları bu birimi kullanır.</p>
              </>
            ) : null}
            <div className="rounded-lg bg-surface px-3">
              <Switch
                label={isPayment(connecting) ? "Mevcut müşterileri içe aktar" : "Geçmiş kayıtları da eşitle"}
                hint={isPayment(connecting) ? "1.284 müşteri e-postayla eşlenir" : "Bağlandıktan sonra son 30 günün kayıtları alınır"}
                checked={importAll}
                onChange={(e) => setImportAll(e.currentTarget.checked)}
              />
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Ayrıntı paneli */}
      <Sheet
        open={detailItem !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        side="right"
        size="lg"
        title={detailItem?.name ?? ""}
        description={detailItem ? `Çalışma alanı · ${detailItem.category}` : undefined}
        icon={detailItem ? <AppGlyph id={detailItem.id} /> : undefined}
        status={<Badge tone="success" dot>Bağlı</Badge>}
        footerStart={
          <Button
            variant="ghost"
            className="text-danger hover:bg-danger-wash"
            onClick={() => {
              if (!detailItem) return;
              patch(detailItem.id, { connected: false });
              toast(`${detailItem.name} bağlantısı kesildi`);
              setDetail(null);
            }}
          >
            <Unplug aria-hidden />
            Bağlantıyı kes
          </Button>
        }
        footer={
          <Button
            variant="brand"
            onClick={() => {
              toast.success("Değişiklikler kaydedildi");
              setDetail(null);
            }}
          >
            Kaydet
          </Button>
        }
      >
        {detailItem ? <DetailBody item={detailItem} /> : null}
      </Sheet>

      <Toaster />
    </SampleShell>
  );
}

function DetailBody({ item }: { item: Integration }) {
  const [channel, setChannel] = useState("yeni");
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(item.events.map((e) => [e.id, e.on])));
  return (
    <Tabs
      aria-label={`${item.name} ayrıntıları`}
      variant="underline"
      items={[
        {
          value: "ayarlar",
          label: "Ayarlar",
          panel: (
            <div className="grid gap-3 pt-4">
              <Select label="Gönderilecek kanal" items={CHANNELS} value={channel} onValueChange={(v) => setChannel(v ?? "yeni")} />
              <p className="text-micro text-muted">Özel kanallara yazmadan önce uygulamayı kanala davet et.</p>
              <PermissionList title="İZİNLER" items={item.scopes} />
            </div>
          ),
        },
        {
          value: "olaylar",
          label: "Olaylar",
          panel: (
            <div className="pt-4">
              <h3 className="text-micro font-semibold tracking-wide text-muted">ŞU OLAYLARDA İLETİ GÖNDER</h3>
              <ul className="mt-2 divide-y divide-line-soft rounded-xl bg-surface px-3">
                {item.events.map((e) => (
                  <li key={e.id}>
                    <Switch
                      label={e.label}
                      hint={e.hint}
                      checked={on[e.id] ?? false}
                      onChange={(ev) => setOn((prev) => ({ ...prev, [e.id]: ev.currentTarget.checked }))}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ),
        },
        {
          value: "hareket",
          label: "Son hareket",
          panel: (
            <div className="pt-4">
              {item.activity.length > 0 ? (
                <ul className="divide-y divide-line-soft">
                  {item.activity.map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-3 py-2.5 text-base">
                      <span className="min-w-0 text-body">{a.text}</span>
                      <span className="shrink-0 text-small text-muted">{a.when}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-surface p-4 text-base text-muted">Henüz hareket yok.</p>
              )}
              <p className="mt-4 text-micro text-muted">Bağlayan: Ayşe Demir · {APPS[item.id].name} · ÖRNEK VERİ</p>
            </div>
          ),
        },
      ]}
    />
  );
}
