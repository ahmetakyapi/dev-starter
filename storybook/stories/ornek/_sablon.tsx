"use client";

import {
  ArrowRight,
  Bell,
  Bot,
  Eye,
  FlaskConical,
  GitBranch,
  GitFork,
  LayoutTemplate,
  LayoutDashboard,
  ListChecks,
  Plus,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  Upload,
  UserCheck,
  Users,
  Workflow,
  Zap,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { RequirementList, type Requirement } from "@/components/ui/requirement-list";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";
import { APPS, AppGlyph, AppTile, PageHead, SampleNote, SampleShell, type AppId } from "./_p3-ortak";

/**
 * Şablon galerisi (Axon referansı: yapı ve davranış; ad, metin, ikon ve
 * sayılar kurgusal). Kart ızgarası + filtre/arama/sıralama + kartın ayrıntı
 * penceresi: adımlar, gereken bağlantılar, etki ölçüleri. Eksik bağlantı
 * "Bağla" ile bağlanınca özet ve "Şablonu kullan" durumu güncellenir.
 */

type StepKind = "trigger" | "ai" | "logic" | "action" | "human";

const KIND: Record<StepKind, { label: string; icon: LucideIcon; tile: string }> = {
  trigger: { label: "Tetik", icon: Zap, tile: "bg-warning-wash text-warning" },
  ai: { label: "Yapay zeka", icon: Sparkles, tile: "bg-primary-wash text-primary-ink" },
  logic: { label: "Mantık", icon: GitBranch, tile: "bg-chart-2/22 text-strong" },
  action: { label: "Eylem", icon: Workflow, tile: "bg-success-wash text-success" },
  human: { label: "İnsan", icon: UserCheck, tile: "bg-chart-4/22 text-strong" },
};

type Step = { kind: StepKind; title: string; detail: string };

type Template = {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: "Finans" | "Destek" | "Satış" | "Operasyon" | "BT";
  apps: readonly [AppId, AppId];
  requires: readonly AppId[];
  teams: number;
  setupMin: number;
  savesHours: number;
  rating: number;
  reviews: number;
  tags: readonly string[];
  isNew?: boolean;
  steps: readonly Step[];
};

const TEMPLATES: readonly Template[] = [
  {
    id: "fatura-yakala",
    title: "Faturayı yakala, muhasebeye işle",
    description: "Gelen kutusundaki fatura PDF'lerini siparişle eşleştirir, faturayı kaydeder; emin olmadığını bir insana bırakır.",
    summary: "Gelen kutusundaki fatura PDF'lerini okur, siparişlerle eşleştirir ve faturayı kaydeder. Emin olmadığı her şey için insan kontrolü ister.",
    category: "Finans",
    apps: ["posta", "muhasebe"],
    requires: ["posta", "muhasebe", "sohbet"],
    teams: 2431,
    setupMin: 6,
    savesHours: 11,
    rating: 4.8,
    reviews: 312,
    tags: ["Finans", "Yapay zeka", "İnsan kontrolü"],
    steps: [
      { kind: "trigger", title: "PDF ekli e-posta gelir", detail: "Tetik · fatura@ornek.test · yalnız ekli iletiler" },
      { kind: "ai", title: "Fatura alanlarını çıkar", detail: "Yapay zeka · firma, tutar, sipariş no, vade, kalemler" },
      { kind: "logic", title: "Güven ≥ %92 ve sipariş bulundu mu?", detail: "Mantık · iki dal" },
      { kind: "action", title: "Siparişi eşle ve faturayı kaydet", detail: "Eylem · üçlü eşleme, onay bekleyen olarak kaydeder" },
      { kind: "human", title: "İstisnaları İnceleme Sırasına gönder", detail: "İnsan · 8 saat süre, sorumlu = ön muhasebe" },
      { kind: "action", title: "Günlük özeti paylaş", detail: "Eylem · #finans-ops, 17:00" },
    ],
  },
  {
    id: "sozlesme-yenileme",
    title: "Sözleşme yenileme hatırlatıcıları",
    description: "Sahiplere yenilemeden 60/30/7 gün önce hazır bir e-posta taslağıyla hatırlatır.",
    summary: "Yenileme tarihi yaklaşan sözleşmelerin sahibine taslak e-postayla birlikte hatırlatma gönderir.",
    category: "Satış",
    apps: ["tablo", "posta"],
    requires: ["tablo", "posta"],
    teams: 870,
    setupMin: 2,
    savesHours: 3,
    rating: 4.6,
    reviews: 140,
    tags: ["Satış", "Zamanlanmış"],
    steps: [
      { kind: "trigger", title: "Her sabah 08:00", detail: "Tetik · zamanlanmış" },
      { kind: "logic", title: "Yenilemeye 60, 30 ya da 7 gün mü var?", detail: "Mantık · üç dal" },
      { kind: "ai", title: "Hatırlatma taslağını yaz", detail: "Yapay zeka · sözleşme özetinden" },
      { kind: "action", title: "Sahibe taslağı gönder", detail: "Eylem · e-posta" },
    ],
  },
  {
    id: "destek-yonlendir",
    title: "Destek talebini etiketle ve yönlendir",
    description: "Talepleri öncelik ve konuya göre etiketler; acil olanlar nöbetçiye ses getirir.",
    summary: "Gelen destek taleplerini konu ve aciliyete göre etiketler, acil olanları nöbetçi kanalına yazar.",
    category: "Destek",
    apps: ["sohbet", "tablo"],
    requires: ["sohbet", "tablo"],
    teams: 2200,
    setupMin: 9,
    savesHours: 8,
    rating: 4.7,
    reviews: 260,
    tags: ["Destek", "Yapay zeka"],
    steps: [
      { kind: "trigger", title: "Yeni talep açılır", detail: "Tetik · destek kuyruğu" },
      { kind: "ai", title: "Konu ve aciliyeti belirle", detail: "Yapay zeka · etiket önerisi" },
      { kind: "logic", title: "Acil mi?", detail: "Mantık · iki dal" },
      { kind: "action", title: "Nöbetçiye yaz", detail: "Eylem · sohbet kanalı" },
    ],
  },
  {
    id: "maas-banka",
    title: "Bordro çıktısını banka kaydıyla karşılaştır",
    description: "Bordro dosyasını banka hareketleriyle karşılaştırır ve uyuşmayanları işaretler.",
    summary: "Her bordro çalışmasını banka hareketleriyle kıyaslar, farkları listeler.",
    category: "Finans",
    apps: ["tablo", "rapor"],
    requires: ["tablo", "rapor"],
    teams: 410,
    setupMin: 5,
    savesHours: 5,
    rating: 4.5,
    reviews: 62,
    tags: ["Finans"],
    steps: [
      { kind: "trigger", title: "Bordro dosyası yüklenir", detail: "Tetik · tablo" },
      { kind: "action", title: "Banka hareketlerini çek", detail: "Eylem · son 3 gün" },
      { kind: "logic", title: "Tutarlar eşleşiyor mu?", detail: "Mantık · iki dal" },
      { kind: "human", title: "Farkları ön muhasebeye gönder", detail: "İnsan · gün sonu" },
    ],
  },
  {
    id: "iade-bildirim",
    title: "İadeyi muhasebeye yansıt, büyüklere haber ver",
    description: "Mağaza iadelerini ödeme kaydına işler; büyük tutarlarda finansa haber verir.",
    summary: "İade olunca ödeme kaydını günceller ve belirlenen tutarın üstündekileri finans kanalına yazar.",
    category: "Operasyon",
    apps: ["site", "odeme"],
    requires: ["site", "odeme", "sohbet"],
    teams: 730,
    setupMin: 7,
    savesHours: 3,
    rating: 4.4,
    reviews: 88,
    tags: ["Operasyon"],
    steps: [
      { kind: "trigger", title: "İade oluşturulur", detail: "Tetik · site" },
      { kind: "action", title: "Ödeme kaydını güncelle", detail: "Eylem · ödeme" },
      { kind: "logic", title: "Tutar eşiği aştı mı?", detail: "Mantık · iki dal" },
      { kind: "action", title: "Finans kanalına yaz", detail: "Eylem · sohbet" },
    ],
  },
  {
    id: "hata-bildirim",
    title: "Destekten gelen hatayı iş kaydına çevir",
    description: "Büyüyen talepleri günlük ve müşteri etkisiyle birlikte hata kaydına dönüştürür.",
    summary: "Üst seviyeye çıkan talepleri günlük ve müşteri etkisini ekleyerek hata kaydına çevirir.",
    category: "BT",
    apps: ["notlar", "sohbet"],
    requires: ["notlar", "sohbet"],
    teams: 980,
    setupMin: 4,
    savesHours: 4,
    rating: 4.6,
    reviews: 101,
    tags: ["BT", "Yapay zeka"],
    isNew: true,
    steps: [
      { kind: "trigger", title: "Talep üst seviyeye çıkar", detail: "Tetik · destek" },
      { kind: "ai", title: "Günlükten özet çıkar", detail: "Yapay zeka · hata özeti" },
      { kind: "action", title: "Hata kaydı aç", detail: "Eylem · notlar" },
    ],
  },
  {
    id: "satis-skor",
    title: "Yeni kişiyi puanla ve doğru satışçıya yönlendir",
    description: "Yeni kayıtları uygunluk ve niyete göre puanlar; sıcak olanı doğru temsilciye atar.",
    summary: "Yeni kişileri uygunluk ve niyete göre puanlar, sıcak olanları doğru temsilciye yönlendirir.",
    category: "Satış",
    apps: ["tablo", "analiz"],
    requires: ["tablo", "analiz", "posta"],
    teams: 760,
    setupMin: 8,
    savesHours: 9,
    rating: 4.7,
    reviews: 119,
    tags: ["Satış", "Yapay zeka"],
    steps: [
      { kind: "trigger", title: "Yeni kişi eklenir", detail: "Tetik · tablo" },
      { kind: "ai", title: "Uygunluk ve niyeti puanla", detail: "Yapay zeka · 0-100" },
      { kind: "logic", title: "Puan ≥ 70 mi?", detail: "Mantık · iki dal" },
      { kind: "action", title: "Temsilciye ata ve haber ver", detail: "Eylem · e-posta" },
    ],
  },
  {
    id: "toplanti-ozet",
    title: "Toplantı notlarından görev çıkar",
    description: "Toplantı notlarını okur, karar ve görevleri ayıklayıp takvime ve notlara işler.",
    summary: "Toplantı notundaki karar ve görevleri ayıklar, sahiplerine yazar.",
    category: "Operasyon",
    apps: ["notlar", "takvim"],
    requires: ["notlar", "takvim"],
    teams: 1260,
    setupMin: 3,
    savesHours: 6,
    rating: 4.8,
    reviews: 205,
    tags: ["Operasyon", "Yapay zeka"],
    steps: [
      { kind: "trigger", title: "Toplantı biter", detail: "Tetik · takvim" },
      { kind: "ai", title: "Karar ve görevleri ayıkla", detail: "Yapay zeka · notlardan" },
      { kind: "action", title: "Görevleri sahiplerine yaz", detail: "Eylem · notlar" },
    ],
  },
  {
    id: "erisim-talep",
    title: "Erişim talebini onaya götür",
    description: "Uygulama erişim taleplerini sorumluya onaya gönderir, kararı kayda geçirir.",
    summary: "Erişim taleplerini ilgili sorumluya onaya götürür ve sonucu denetim kaydına yazar.",
    category: "BT",
    apps: ["sohbet", "tablo"],
    requires: ["sohbet", "tablo"],
    teams: 640,
    setupMin: 5,
    savesHours: 2,
    rating: 4.5,
    reviews: 77,
    tags: ["BT", "İnsan kontrolü"],
    steps: [
      { kind: "trigger", title: "Talep formu gönderilir", detail: "Tetik · tablo" },
      { kind: "human", title: "Sorumlu onaylar", detail: "İnsan · 24 saat süre" },
      { kind: "action", title: "Kararı kayda yaz", detail: "Eylem · tablo" },
    ],
  },
];

const CATEGORIES = ["Hepsi", "Finans", "Destek", "Satış", "Operasyon", "BT"] as const;

const SORTS = [
  { value: "used", label: "En çok kullanılan" },
  { value: "fast", label: "En hızlı kurulum" },
  { value: "rating", label: "En yüksek puan" },
] as const;

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Çalışma Alanı",
    items: [
      { href: "/genel", label: "Genel Bakış", icon: <LayoutDashboard /> },
      { href: "/akislar", label: "Akışlar", icon: <Workflow /> },
      { href: "/sablonlar", label: "Şablonlar", icon: <LayoutTemplate />, badge: TEMPLATES.length },
      { href: "/olusturucu", label: "Akış Oluşturucu", icon: <GitFork /> },
      { href: "/yapay-zeka", label: "Yapay Zeka Ayarı", icon: <Bot /> },
      { href: "/test", label: "Deneme Çalıştırması", icon: <FlaskConical /> },
      { href: "/inceleme", label: "İnceleme Sırası", icon: <ListChecks /> },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { href: "/ekip", label: "Ekip", icon: <Users /> },
      { href: "/bildirimler", label: "Bildirimler", icon: <Bell />, badge: 78 },
      { href: "/kayit", label: "Denetim Kaydı", icon: <ScrollText /> },
      { href: "/ayarlar", label: "Ayarlar", icon: <Settings /> },
    ],
  },
];

const nf = new Intl.NumberFormat("tr-TR");

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-base">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-strong tabular-nums">{value}</dd>
    </div>
  );
}

function AppPair({ apps }: { apps: readonly [AppId, AppId] }) {
  return (
    <span className="flex items-center gap-1.5">
      <AppTile id={apps[0]} />
      <AppTile id={apps[1]} />
    </span>
  );
}

function Meta({ t }: { t: Template }) {
  return (
    <span className="flex items-center gap-3 text-small text-muted tabular-nums">
      <span className="flex items-center gap-1">
        <Users aria-hidden className="size-3.5" />
        <span className="sr-only">Kullanan ekip: </span>
        {nf.format(t.teams)}
      </span>
      <span className="flex items-center gap-1">
        <Clock aria-hidden className="size-3.5" />
        <span className="sr-only">Kurulum süresi: </span>
        {t.setupMin} dk
      </span>
    </span>
  );
}

/** Öne çıkan kart: üstte renkli bant, iki uygulama karosu ve ok. */
function FeaturedCard({ t, onOpen }: { t: Template; onOpen: () => void }) {
  return (
    <article className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-overlay shadow-raised transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-line-focus focus-within:outline-solid hover:bg-surface">
      <div aria-hidden className="flex h-24 items-center justify-center gap-3 bg-primary-wash">
        <AppTile id={t.apps[0]} className="size-10" />
        <ArrowRight className="size-4 text-primary-ink" />
        <AppTile id={t.apps[1]} className="size-10" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="flex items-center gap-2 text-read font-semibold text-strong">
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0">
            {t.title}
          </button>
          {t.tags.includes("Yapay zeka") ? (
            <Badge tone="primary" className="shrink-0">
              Yapay zekâ
            </Badge>
          ) : null}
        </h3>
        <p className="line-clamp-2 text-small leading-relaxed text-muted">{t.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Meta t={t} />
          <span className="text-small font-semibold text-primary-ink">Şablonu kullan</span>
        </div>
      </div>
    </article>
  );
}

function GridCard({ t, onOpen }: { t: Template; onOpen: () => void }) {
  return (
    <article className="relative flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-overlay p-4 shadow-raised transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-line-focus focus-within:outline-solid hover:bg-surface">
      <div className="flex items-center justify-between gap-2">
        <AppPair apps={t.apps} />
        {t.isNew ? <Badge tone="success">Yeni</Badge> : null}
      </div>
      <div className="min-w-0">
        <h3 className="text-read font-semibold text-strong">
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0">
            {t.title}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-small leading-relaxed text-muted">{t.description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <Badge tone="neutral">{t.category}</Badge>
        <Meta t={t} />
      </div>
    </article>
  );
}

/** Adım listesi: numara + tür karosu + dikey çizgi. `<ol>`, tür ve numara metinle de yazılı. */
function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const kind = KIND[step.kind];
        const Icon = kind.icon;
        const last = i === steps.length - 1;
        return (
          <li key={i} className={cn("relative flex gap-3", last ? "" : "pb-4")}>
            {last ? null : <span aria-hidden className="absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 bg-line" />}
            <span aria-hidden className={cn("relative grid size-8 shrink-0 place-items-center rounded-md [&_svg]:size-4", kind.tile)}>
              <Icon />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-base font-semibold text-strong">
                <span className="mr-1.5 font-mono text-small font-normal text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {step.title}
              </p>
              <p className="mt-0.5 text-small text-muted">
                <span className="sr-only">{kind.label}: </span>
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TemplateDialog({
  t,
  connected,
  onConnect,
  onClose,
}: {
  t: Template | null;
  connected: ReadonlySet<AppId>;
  onConnect: (id: AppId) => void;
  onClose: () => void;
}) {
  const items: Requirement[] = (t?.requires ?? []).map((id) => ({
    id,
    name: APPS[id].name,
    icon: <AppGlyph id={id} />,
    status: connected.has(id) ? "connected" : "missing",
  }));
  const missing = items.filter((i) => i.status === "missing").length;
  return (
    <Dialog
      open={t !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      title={t?.title ?? ""}
      description={t?.summary}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="max-sm:hidden">
            <Eye aria-hidden />
            Oluşturucuda önizle
          </Button>
          {/* İlk odak footer'daki Kapat'a: tarayıcı varsayılanı gövdedeki ilk butona (Gerekenler → Bağla) gidip telefonda gövdeyi aşağı kaydırıyordu. */}
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Kapat
          </Button>
          <Button variant="brand" disabled={missing > 0} aria-describedby="sablon-eksik">
            <ArrowRight aria-hidden />
            Şablonu kullan
          </Button>
        </>
      }
    >
      {t ? (
        <div className="grid gap-6 md:grid-cols-[1.35fr_1fr]">
          <section aria-labelledby="sablon-adimlar">
            <h3 id="sablon-adimlar" className="mb-3 text-small font-medium text-muted">
              Adımlar
            </h3>
            <StepList steps={t.steps} />
          </section>
          <div className="min-w-0 md:border-l md:border-line-soft md:pl-6">
            <RequirementList items={items} onConnect={(id) => onConnect(id as AppId)} title="Gerekenler" />
            <p id="sablon-eksik" className="mt-2 text-small text-muted">
              {missing > 0 ? `${missing} bağlantı eksik: hepsi bağlanınca şablon kullanılabilir.` : "Bütün bağlantılar hazır."}
            </p>
            <section aria-labelledby="sablon-etki" className="mt-5">
              <h3 id="sablon-etki" className="text-small font-medium text-muted">
                Etki
              </h3>
              <dl className="mt-1 divide-y divide-line-soft">
                <Stat label="Kullanan ekip" value={nf.format(t.teams)} />
                <Stat label="Ort. kurulum" value={`${t.setupMin} dk`} />
                <Stat label="Haftalık kazanç" value={`~${t.savesHours} sa`} />
                <Stat
                  label="Puan"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Star aria-hidden className="size-3.5 fill-current" />
                      {t.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} ({nf.format(t.reviews)})
                    </span>
                  }
                />
              </dl>
            </section>
            <ul aria-label="Etiketler" className="mt-4 flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <li key={tag}>
                  <Badge tone={tag === "Yapay zeka" ? "primary" : tag === "İnsan kontrolü" ? "warning" : "neutral"}>{tag}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

export function SablonGalerisiPage({ initialOpen }: { initialOpen?: string }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Hepsi");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("used");
  const [openId, setOpenId] = useState<string | null>(initialOpen ?? null);
  const [connected, setConnected] = useState<ReadonlySet<AppId>>(new Set<AppId>(["posta", "muhasebe", "tablo", "takvim"]));

  const counts = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c, c === "Hepsi" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === c).length])),
    [],
  );

  const list = useMemo(() => {
    const filtered = TEMPLATES.filter(
      (t) => (category === "Hepsi" || t.category === category) && (query.trim() === "" || matchesTr(`${t.title} ${t.description}`, query, { fold: true })),
    );
    return [...filtered].sort((a, b) =>
      sort === "fast" ? a.setupMin - b.setupMin : sort === "rating" ? b.rating - a.rating : b.teams - a.teams,
    );
  }, [category, query, sort]);

  const featured = TEMPLATES.slice(0, 3);
  const open = TEMPLATES.find((t) => t.id === openId) ?? null;

  return (
    <SampleShell
      brand="Akışhane"
      logo={<Workflow />}
      nav={NAV}
      current="/sablonlar"
      user={{ name: "Ayşe Demir", detail: "Operasyon" }}
      crumbs={["Çalışma Alanı", "Şablonlar"]}
    >
      <PageHead
        title="Şablonlar"
        subtitle={`${TEMPLATES.length} sınanmış şablon, kategoriye ve uygulamaya göre`}
        actions={
          <>
            <Button variant="secondary">
              <Upload aria-hidden />
              Şablon gönder
            </Button>
            <Button variant="brand">
              <Plus aria-hidden />
              Akış oluştur
            </Button>
          </>
        }
      />

      <section aria-labelledby="sablon-one" className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="sablon-one" className="text-read font-semibold text-strong">
            Bu hafta öne çıkanlar
          </h2>
          <a href="#sablon-tum" className="text-small font-medium text-primary-ink underline-offset-4 hover:underline">
            Hepsini gör ({TEMPLATES.length})
          </a>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {featured.map((t) => (
            <FeaturedCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="sablon-tum" className="mt-8">
        <h2 id="sablon-tum" className="sr-only">
          Bütün şablonlar
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Kategori" className="flex min-w-0 flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <FilterChip key={c} selected={category === c} count={counts[c]} onClick={() => setCategory(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchField
              label="Şablon ara"
              placeholder="Şablon ara"
              value={query}
              onValueChange={setQuery}
              resultCount={list.length}
              className="w-full sm:w-64"
            />
            <Select
              label="Sırala"
              hideLabel
              items={SORTS}
              value={sort}
              onValueChange={(v) => setSort((v ?? "used") as typeof sort)}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {list.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <GridCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl bg-surface p-6 text-center text-base text-muted">Eşleşen şablon yok. Aramayı ya da kategoriyi değiştir.</p>
        )}
      </section>

      <SampleNote className="mt-8" />

      <TemplateDialog
        t={open}
        connected={connected}
        onConnect={(id) => setConnected((prev) => new Set(prev).add(id))}
        onClose={() => setOpenId(null)}
      />
    </SampleShell>
  );
}

