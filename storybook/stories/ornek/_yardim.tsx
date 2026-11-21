"use client";

import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ChevronRight,
  CreditCard,
  FileText,
  Filter,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Megaphone,
  MessageCircle,
  Rocket,
  Send,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  Workflow,
  Zap,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { CategoryCard, CategoryGrid, type CategoryTone } from "@/components/ui/category-card";
import { FilterChip } from "@/components/ui/chip";
import { SearchField, matchesTr, HighlightMatch } from "@/components/ui/search-field";
import { StatusList, type StatusItem } from "@/components/ui/status-list";
import { PageHead, SampleNote, SampleShell } from "./_p3-ortak";

/**
 * Yardım merkezi (MailPulse referansı: yapı ve davranış; ürün, makale ve
 * sayılar kurgusal, ÖRNEK VERİ). Arama kutusu (`/` kısayolu) makaleleri
 * yazdıkça süzer, "Popüler" çipleri aramayı doldurur; kategori kartları,
 * popüler makaleler, iletişim yolları ve sistem durumu.
 */

const CATEGORIES: readonly {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: CategoryTone;
  count: number;
}[] = [
  { id: "baslangic", title: "Başlarken", description: "Yayınını kur, okurlarını içe aktar ve ilk sayını gönder.", icon: Rocket, tone: "primary", count: 12 },
  { id: "gonderim", title: "Gönderim ve ulaşma", description: "Alan adı, DKIM, spam denetimi ve gelen kutusuna ulaşma.", icon: Mail, tone: "chart-2", count: 18 },
  { id: "aboneler", title: "Aboneler ve içe aktarma", description: "İçe aktarma, segmentler, etiketler ve abonelikten çıkış.", icon: Users, tone: "success", count: 14 },
  { id: "odemeler", title: "Ödemeler ve hak ediş", description: "Ücretli kademeler, ödeme bağlantısı, vergiler ve ödemeler.", icon: Wallet, tone: "warning", count: 11 },
  { id: "otomasyon", title: "Otomasyonlar", description: "Karşılama dizisi, tetikleyiciler ve koşullar.", icon: Zap, tone: "chart-3", count: 9 },
  { id: "hesap", title: "Hesap ve faturalama", description: "Planlar, faturalar, ekip koltukları ve güvenlik.", icon: CreditCard, tone: "chart-4", count: 10 },
];

const ARTICLES: readonly { id: string; title: string; category: string; minutes: number }[] = [
  { id: "dkim", title: "Alan adın için DKIM ve SPF kur", category: "Gönderim ve ulaşma", minutes: 4 },
  { id: "ice", title: "Okurları başka bir hizmetten içe aktar", category: "Aboneler ve içe aktarma", minutes: 3 },
  { id: "odeme", title: "Ödeme hizmetini bağla ve fiyat belirle", category: "Ödemeler ve hak ediş", minutes: 5 },
  { id: "acilma", title: "Bazı posta uygulamalarında açılma oranı neden düşük görünür?", category: "Gönderim ve ulaşma", minutes: 6 },
  { id: "paywall", title: "Bir sayıya ücretli duvar ekle", category: "Ödemeler ve hak ediş", minutes: 2 },
  { id: "karsilama", title: "Karşılama dizisi kur", category: "Otomasyonlar", minutes: 5 },
  { id: "alan", title: "Özel alan adını yayınına bağla", category: "Başlarken", minutes: 4 },
  { id: "segment", title: "Okurları davranışa göre segmentlere ayır", category: "Aboneler ve içe aktarma", minutes: 4 },
  { id: "fatura", title: "Faturalarını indir ve ekip koltuğu ekle", category: "Hesap ve faturalama", minutes: 3 },
];

const POPULAR = ["Okurları içe aktar", "DKIM kurulumu", "Ödeme", "Ücretli duvar", "Özel alan adı"] as const;

const STATUS: readonly StatusItem[] = [
  { id: "gonder", label: "Gönderim", status: "operational" },
  { id: "site", label: "Site ve formlar", status: "operational" },
  { id: "api", label: "API", status: "operational" },
  { id: "odeme", label: "Ödemeler", status: "operational" },
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

function ContactRow({ icon: Icon, title, detail, trailing }: { icon: LucideIcon; title: string; detail: string; trailing?: React.ReactNode }) {
  return (
    <li>
      <a href="#iletisim" className="flex min-h-14 items-center gap-3 rounded-md py-2 transition-colors hover:bg-surface">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-overlay text-strong shadow-raised [&_svg]:size-4">
          <Icon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-strong">{title}</span>
          <span className="block truncate text-small text-muted">{detail}</span>
        </span>
        {trailing ?? <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />}
      </a>
    </li>
  );
}

export function YardimMerkeziPage({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const searching = query.trim() !== "";

  const articles = useMemo(
    () => ARTICLES.filter((a) => !searching || matchesTr(`${a.title} ${a.category}`, query, { fold: true })),
    [query, searching],
  );

  return (
    <SampleShell
      brand="Bültenci"
      logo={<Mail />}
      nav={NAV}
      current="/yardim"
      user={{ name: "Ayşe Demir", detail: "Sahip" }}
      crumbs={["Çalışma Alanı", "Yardım Merkezi"]}
    >
      <PageHead
        title="Yardım Merkezi"
        subtitle="Yanıtlar, rehberler ve saatler içinde dönen bir ekip."
        actions={
          <>
            <Button variant="secondary">
              <Activity aria-hidden />
              Sistem durumu
            </Button>
            <Button variant="brand">
              <MessageCircle aria-hidden />
              Destekle konuş
            </Button>
          </>
        }
      />

      <section aria-labelledby="yardim-ara" className="mt-6 rounded-xl bg-surface px-4 py-8 text-center sm:px-6">
        <h2 id="yardim-ara" className="text-title font-semibold tracking-tight text-strong">
          Nasıl yardımcı olabiliriz, Ayşe?
        </h2>
        <div className="mx-auto mt-4 max-w-xl">
          <SearchField
            label="Yardım ara"
            placeholder="Yanıt ara, örneğin özel alan adı"
            value={query}
            onValueChange={setQuery}
            resultCount={articles.length}
            shortcut="/"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-small text-muted">Popüler:</span>
          {POPULAR.map((p) => (
            <FilterChip key={p} selected={query === p} onClick={() => setQuery(query === p ? "" : p)}>
              {p}
            </FilterChip>
          ))}
        </div>
      </section>

      {searching ? null : (
        <section aria-label="Kategoriler" className="mt-6">
          <CategoryGrid>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <CategoryCard
                  key={c.id}
                  href={`#kategori-${c.id}`}
                  title={c.title}
                  description={c.description}
                  meta={`${c.count} makale`}
                  icon={<Icon />}
                  tone={c.tone}
                />
              );
            })}
          </CategoryGrid>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="yardim-makaleler">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="yardim-makaleler" className="text-read font-semibold text-strong">
              {searching ? `${articles.length} sonuç` : "Popüler makaleler"}
            </h2>
            {searching ? (
              <button type="button" onClick={() => setQuery("")} className="text-small font-medium text-primary-ink underline-offset-4 hover:underline">
                Aramayı temizle
              </button>
            ) : (
              <a href="#makaleler" className="text-small font-medium text-primary-ink underline-offset-4 hover:underline">
                Bütün makaleler
              </a>
            )}
          </div>
          {articles.length > 0 ? (
            <ul className="mt-2 divide-y divide-line-soft">
              {articles.slice(0, searching ? undefined : 5).map((a) => (
                <li key={a.id}>
                  <a href={`#makale-${a.id}`} className="flex min-h-14 items-center gap-3 py-2.5 transition-colors hover:bg-surface sm:px-2 sm:-mx-2 sm:rounded-md">
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-overlay text-muted shadow-raised [&_svg]:size-4">
                      <FileText />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium text-strong">
                        <HighlightMatch text={a.title} query={query} fold />
                      </span>
                      <span className="block text-small text-muted">
                        {a.category} · {a.minutes} dk okuma
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-surface p-6 text-center text-base text-muted">
              “{query}” için makale bulunamadı. Başka bir sözcük dene ya da destek ekibine yaz.
            </p>
          )}
        </section>

        <aside className="grid content-start gap-6" aria-label="İletişim ve durum">
          <section aria-labelledby="yardim-iletisim" id="iletisim">
            <h2 id="yardim-iletisim" className="text-read font-semibold text-strong">
              Bize ulaş
            </h2>
            <ul className="mt-1">
              <ContactRow icon={MessageCircle} title="Canlı sohbet" detail="Genelde 2 sa içinde yanıt" trailing={<Badge tone="success" dot>Çevrimiçi</Badge>} />
              <ContactRow icon={Mail} title="E-posta desteği" detail="destek@ornek.test" />
              <ContactRow icon={CalendarClock} title="Görüşme planla" detail="Pro plan · 30 dk" />
            </ul>
          </section>
          <StatusList title="Sistem durumu" items={STATUS} incident="Son olay 3 Ara · 18 dakikada çözüldü" />
          <p className="flex items-center gap-1.5 text-micro text-muted">
            <ShieldCheck aria-hidden className="size-3.5" />
            Verilerin yalnız destek talebini çözmek için okunur.
          </p>
        </aside>
      </div>

      <SampleNote className="mt-8" />
    </SampleShell>
  );
}
