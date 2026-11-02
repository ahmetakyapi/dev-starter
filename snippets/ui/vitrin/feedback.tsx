"use client";

import {
  Copy,
  Download,
  Eye,
  FileText,
  FolderInput,
  Folder,
  Link2,
  MoreHorizontal,
  PencilLine,
  Share2,
  Star,
  Trash2,
  CreditCard,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { DismissibleAnnouncement, Announcement } from "@/components/ui/announcement";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Carousel } from "@/components/ui/carousel";
import { ChipGroup, FilterChip, RemovableChip } from "@/components/ui/chip";
import { CloseButton } from "@/components/ui/close-button";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Divider } from "@/components/ui/divider";
import { Meter, SegmentedMeter } from "@/components/ui/meter";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { Progress } from "@/components/ui/progress";

/* Vitrin: her bileşen büyük yuvarlak bir kuyuda, altında adı ve tek cümle. */
function Showcase({
  name,
  summary,
  children,
  wide = false,
  stage = "center",
}: {
  name: string;
  summary: string;
  children: ReactNode;
  wide?: boolean;
  stage?: "center" | "stretch";
}) {
  return (
    <figure className={wide ? "flex h-full flex-col md:col-span-2" : "flex h-full flex-col"}>
      <div
        className={
          stage === "center"
            ? "grid min-h-64 flex-1 place-items-center rounded-2xl bg-surface p-5 sm:p-8"
            : "flex-1 rounded-2xl bg-surface p-5 sm:p-8"
        }
      >
        {children}
      </div>
      <figcaption className="mt-3 px-1">
        <p className="text-base font-semibold text-strong">{name}</p>
        <p className="mt-0.5 text-base text-muted">{summary}</p>
      </figcaption>
    </figure>
  );
}

const SECONDARY =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-overlay px-3.5 text-base font-medium text-strong shadow-raised transition-[border-color] hover:border-line-strong pointer-fine:min-h-9";

function makeNotifications(): NotificationItem[] {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60_000).toISOString();
  return [
    { id: "1", actor: "Elif Yıldız", title: "Elif Yıldız Q3 raporuna yorum yaptı", body: "“Kasım satırındaki artış kampanyadan mı geliyor?”", at: ago(3), read: false },
    { id: "2", actor: "Mert Aksoy", title: "Mert Aksoy sizi “Bütçe 2027” panosuna ekledi", at: ago(42), read: false },
    { id: "3", icon: Download, title: "Dışa aktarma hazır", body: "Ekim müşteri listesi (2.418 satır) indirilebilir.", at: ago(130), read: false },
    { id: "4", icon: CreditCard, title: "Kasım faturası ödendi", body: "₺1.249,00 · Kurumsal plan", at: ago(60 * 20), read: true },
    { id: "5", actor: "Deniz Kaya", title: "Deniz Kaya “Ürün Yol Haritası” belgesini paylaştı", at: ago(60 * 26), read: true },
    { id: "6", icon: CalendarClock, title: "Deneme süreniz 4 gün sonra bitiyor", at: ago(60 * 24 * 3), read: true },
  ];
}

const SLIDES = [
  { tag: "Grafikler", title: "Huni ve sütun grafikleri panoya geldi", body: "Kayıttan ödemeye her aşamayı tek kartta karşılaştırın.", series: "bg-chart-1" },
  { tag: "Ekip", title: "Panoya misafir davet edin", body: "Düzenleme yetkisi vermeden yalnızca okuma bağlantısı paylaşın.", series: "bg-chart-2" },
  { tag: "Dışa Aktarma", title: "CSV ve PDF tek tıkla", body: "Filtrelenmiş görünüm neyse dosyaya o yazılır.", series: "bg-chart-3" },
  { tag: "Bildirimler", title: "Günlük özet e-postası", body: "Her sabah 09.00'da yalnızca değişenler.", series: "bg-chart-4" },
  { tag: "Mobil", title: "Telefondan onay verin", body: "Bekleyen harcamalar tek ekranda, iki dokunuşla.", series: "bg-chart-5" },
];

const CITIES = ["İstanbul", "İzmir", "Ankara", "Eskişehir"];

export default function Page() {
  const [notifications, setNotifications] = useState(makeNotifications);
  const [empty, setEmpty] = useState<NotificationItem[]>([]);
  const [filters, setFilters] = useState<Record<string, boolean>>({ Açık: true, "Bana Atanan": false, "Bu Hafta": true, Arşiv: false });
  const [cities, setCities] = useState(CITIES);
  const [banner, setBanner] = useState(true);
  const [starred, setStarred] = useState(true);
  const [upload, setUpload] = useState(64);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-10 grid gap-4">
        <DismissibleAnnouncement href="/vitrin" tag="Yeni" storageKey="duyuru:vitrin-geri-bildirim">
          Grafikler panoya geldi
        </DismissibleAnnouncement>
        <h1 className="text-display font-bold tracking-tight">Katman, Geri Bildirim, Gezinme</h1>
        <p className="max-w-xl text-lead text-body">
          Sağ tık menüsünden bildirim ziline, küçük parçaların doğru yapılmış hâli. Her biri ayrı dosya, kendi token’larımızla.
        </p>
      </header>

      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
        <Showcase name="Bağlam Menüsü" summary="Sağ tık ya da uzun basma; alt menü, kısayol, yıkıcı öğe ayrı grupta.">
          <ContextMenu>
            <ContextMenuTrigger className="w-full max-w-72 rounded-xl bg-overlay p-3 shadow-raised outline-none select-none focus-visible:outline-2 focus-visible:outline-line-focus">
              <div className="grid aspect-[16/9] place-items-center rounded-lg bg-chart-2/15">
                <FileText aria-hidden className="size-8 text-primary-ink" strokeWidth={1.5} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-strong">Q3 raporu.pdf</p>
                  <p className="text-small text-muted">2,4 MB · 12 Eki</p>
                </div>
                {starred ? (
                  <>
                    <Star aria-hidden className="size-4 fill-current text-accent-warm" />
                    <span className="sr-only">Yıldızlı</span>
                  </>
                ) : null}
                <MoreHorizontal aria-hidden className="size-4 text-muted" />
              </div>
              <p className="mt-3 rounded-md bg-surface px-2.5 py-1.5 text-center text-small text-muted">
                Sağ tıklayın ya da basılı tutun
              </p>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem icon={<Eye />} shortcut={["⌘", "O"]}>
                Aç
              </ContextMenuItem>
              <ContextMenuItem icon={<PencilLine />} shortcut={["F2"]}>
                Yeniden Adlandır
              </ContextMenuItem>
              <ContextMenuItem icon={<Copy />} shortcut={["⌘", "D"]}>
                Kopyasını Oluştur
              </ContextMenuItem>
              <ContextMenuSub label="Taşı" icon={<FolderInput />}>
                <ContextMenuItem icon={<Folder />}>Finans</ContextMenuItem>
                <ContextMenuItem icon={<Folder />}>Yönetim Kurulu</ContextMenuItem>
                <ContextMenuItem icon={<Folder />}>Arşiv 2026</ContextMenuItem>
              </ContextMenuSub>
              <ContextMenuSub label="Paylaş" icon={<Share2 />}>
                <ContextMenuItem icon={<Link2 />} shortcut={["⌘", "L"]}>
                  Bağlantıyı Kopyala
                </ContextMenuItem>
                <ContextMenuItem>Ekiple Paylaş</ContextMenuItem>
              </ContextMenuSub>
              <ContextMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>
                Yıldızla
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem tone="danger" icon={<Trash2 />} shortcut={["⌘", "⌫"]}>
                  Çöp Kutusuna Taşı
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </Showcase>

        <Showcase name="Bildirim Merkezi" summary="Zil, okunmamış sayacı, güne göre gruplar ve “3 dk önce” biçiminde göreli zaman.">
          <div className="flex w-full max-w-sm items-center justify-between rounded-xl bg-overlay py-1.5 pr-2 pl-4 shadow-raised">
            <span className="text-base font-semibold text-strong">Pano</span>
            <div className="flex items-center gap-1">
              <NotificationCenter
                items={empty}
                onMarkRead={(ids) => setEmpty((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))}
              />
              <NotificationCenter
                items={notifications}
                onMarkRead={(ids) =>
                  setNotifications((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
                }
              />
            </div>
          </div>
        </Showcase>

        <Showcase name="Uyarı Satırı" summary="Dört ton wash zeminde; ikon, başlık, açıklama ve eylem. Tek kenar şeridi yok." wide stage="stretch">
          <div className="grid gap-3">
            {banner ? (
              <BannerAlert
                tone="warning"
                title="Deneme süreniz 4 gün sonra bitiyor"
                description="Panolarınız silinmez; yalnızca düzenleme kapanır."
                actions={<button className={SECONDARY}>Plan Seç</button>}
                onDismiss={() => setBanner(false)}
              />
            ) : (
              <button className={SECONDARY + " justify-self-start"} onClick={() => setBanner(true)}>
                Uyarıyı Geri Getir
              </button>
            )}
            <BannerAlert
              tone="danger"
              title="Banka senkronu başarısız"
              description="Garanti BBVA bağlantısının süresi doldu; son işlemler 28 Eki’den beri gelmiyor."
              actions={
                <button className={SECONDARY}>
                  <RefreshCw aria-hidden className="size-4" /> Yeniden Bağla
                </button>
              }
            />
            <BannerAlert tone="success" title="Ekim kapanışı tamamlandı" description="214 işlem eşleşti, fark yok." />
            <BannerAlert tone="info" title="Kur bilgisi TCMB’den 15.30’da güncellenir" />
          </div>
        </Showcase>

        <Showcase name="İlerleme" summary="Belirli ve belirsiz; bitince yeşil ✓ ve “Tamamlandı”." stage="stretch">
          <div className="grid gap-6">
            <Progress label="Q3 raporu.pdf yükleniyor" value={upload} hint="Yaklaşık 20 saniye kaldı" />
            <Progress label="Müşteri listesi hazırlanıyor" value={null} hint="Satır sayısı bilinmiyor" />
            <Progress label="Ekim yedeği" value={100} />
            <div className="flex gap-2">
              <button className={SECONDARY} onClick={() => setUpload((v) => Math.max(0, v - 18))}>
                Geri
              </button>
              <button className={SECONDARY} onClick={() => setUpload((v) => Math.min(100, v + 18))}>
                İlerlet
              </button>
            </div>
          </div>
        </Showcase>

        <Showcase name="Ölçer" summary="Doluluk; %75 ve %90 eşiklerinde ton ve durum metni değişir." stage="stretch">
          <div className="grid gap-6">
            <Meter label="Depolama" value={38.4} max={50} valueText="38,4 GB / 50 GB" />
            <Meter label="Ekip Koltukları" value={9} max={10} valueText="9 / 10" statusText={{ warn: "Az Koltuk Kaldı", danger: "Bir Koltuk Kaldı" }} />
            <Meter label="API Kotası" value={4100} max={10000} valueText="4.100 / 10.000" />
            <Divider tone="soft" decorative />
            <SegmentedMeter
              label="Kullanım Dağılımı"
              max={50}
              format={(n) => `${n.toLocaleString("tr-TR")} GB`}
              segments={[
                { label: "Belgeler", value: 14.2, series: 2 },
                { label: "Görseller", value: 17.6, series: 3 },
                { label: "Yedek", value: 6.6, series: 1 },
              ]}
            />
          </div>
        </Showcase>

        <Showcase name="Kart Kaydırıcı" summary="Scroll-snap ile JS’siz kayar; oklar, uzayan hap nokta, klavye." wide stage="stretch">
          <Carousel
            label="Yeni Neler Var"
            slides={SLIDES.map((slide) => (
              <article key={slide.title} className="h-full rounded-xl bg-overlay p-5 shadow-raised">
                <div className={`mb-6 h-24 rounded-lg ${slide.series}`} aria-hidden />
                <p className="text-micro font-semibold text-muted">{slide.tag}</p>
                <h3 className="mt-1 text-title font-semibold">{slide.title}</h3>
                <p className="mt-1 text-base text-body">{slide.body}</p>
              </article>
            ))}
          />
        </Showcase>

        <Showcase name="Süzgeç Etiketi" summary="Süzgeç çipi aria-pressed taşır; kaldırılabilir çipte yalnızca × bir düğme.">
          <div className="grid w-full gap-5">
            <ChipGroup aria-label="Durum Süzgeci">
              {Object.entries(filters).map(([name, on], index) => (
                <FilterChip
                  key={name}
                  selected={on}
                  count={[24, 7, 12, 138][index]}
                  onClick={() => setFilters((f) => ({ ...f, [name]: !f[name] }))}
                >
                  {name}
                </FilterChip>
              ))}
            </ChipGroup>
            <Divider label="Seçili Şehirler" align="start" tone="soft" />
            <ChipGroup aria-label="Seçili Şehirler">
              {cities.map((city) => (
                <RemovableChip key={city} label={city} onRemove={() => setCities((c) => c.filter((x) => x !== city))}>
                  {city}
                </RemovableChip>
              ))}
              {cities.length === 0 ? (
                <button className={SECONDARY} onClick={() => setCities(CITIES)}>
                  Şehirleri Geri Getir
                </button>
              ) : null}
            </ChipGroup>
          </div>
        </Showcase>

        <Showcase name="Kapat Düğmesi" summary="Görsel 28–32 piksel, dokunma alanı 44; halka dairenin çevresinde.">
          <div className="flex items-center gap-8">
            <div className="relative w-56 rounded-xl bg-overlay p-4 shadow-raised">
              <div className="absolute top-3 right-3">
                <CloseButton aria-label="Kartı Kapat" />
              </div>
              <p className="pr-8 text-base font-semibold text-strong">Haftalık özet</p>
              <p className="mt-1 text-small text-muted">Satışlar geçen haftaya göre %6,2 arttı.</p>
            </div>
            <div className="flex items-center gap-3">
              <CloseButton aria-label="Paneli Kapat" size="sm" />
              <CloseButton aria-label="Devre Dışı Kapat" disabled />
            </div>
          </div>
        </Showcase>

        <Showcase name="Ayırıcı" summary="Yatay, dikey ve ortasında etiketli; etiket ekran okuyucuda kaybolmaz.">
          <div className="grid w-full max-w-xs gap-4">
            <button className={SECONDARY + " justify-center"}>Google ile Giriş Yap</button>
            <Divider label="ya da" />
            <button className={SECONDARY + " justify-center"}>E-postayla Devam Et</button>
            <div className="mt-2 flex h-9 items-center justify-center gap-3 text-small text-muted">
              <span>Taslak</span>
              <Divider orientation="vertical" />
              <span>12 Eki</span>
              <Divider orientation="vertical" />
              <span>3 düzenleyen</span>
            </div>
          </div>
        </Showcase>

        <Showcase name="Duyuru" summary="Kahramanın üstünde tek satır haber; kapatılabilir hâli tarayıcıda hatırlanır." wide>
          <div className="grid justify-items-center gap-4">
            <Announcement href="/vitrin" tag="Yeni">
              Grafikler geldi
            </Announcement>
            <Announcement href="/vitrin" tag="Sürüm 2.4">
              Panolarda çoklu seçim ve toplu taşıma
            </Announcement>
            <Announcement href="/vitrin">Ekim bülteni yayında</Announcement>
          </div>
        </Showcase>
      </div>
    </main>
  );
}
