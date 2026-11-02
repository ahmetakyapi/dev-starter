"use client";

import {
  Bell,
  Bold,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  House,
  Italic,
  LayoutDashboard,
  Moon,
  Package,
  Pencil,
  Search,
  Settings,
  Share2,
  Trash2,
  Truck,
  Underline,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { CommandPalette, openCommandPalette, type Command } from "@/components/ui/command-palette";
import { CopyButton } from "@/components/ui/copy-button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd, KbdCombo } from "@/components/ui/kbd";
import { LoadingMark } from "@/components/ui/loading-mark";
import { Pagination } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup } from "@/components/ui/radio-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { Spinner } from "@/components/ui/spinner";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import { InfoTip, Tooltip } from "@/components/ui/tooltip";
import { TreeTable } from "@/components/ui/tree-table";
import { TreeView } from "@/components/ui/tree-view";
import { cn } from "@/lib/utils";

/* Vitrin: her bileşen büyük yuvarlak bir kuyuda, altında adı ve tek cümle. */
function Showcase({ name, note, children, wide, className }: { name: string; note: string; children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <figure className={cn("flex h-full min-w-0 flex-col", wide && "md:col-span-2")}>
      <div className={cn("flex min-h-56 flex-1 items-center justify-center rounded-2xl bg-surface p-5 sm:p-8", className)}>
        <div className="w-full min-w-0">{children}</div>
      </div>
      <figcaption className="mt-3 px-1">
        <span className="block text-base font-semibold text-strong">{name}</span>
        <span className="mt-0.5 block text-small text-muted">{note}</span>
      </figcaption>
    </figure>
  );
}

type Order = { id: string; customer: string; city: string; total: number; status: "done" | "pending" | "late" };

const ORDERS: Order[] = [
  { id: "SP-2041", customer: "Elif Karaca", city: "İzmir", total: 4820, status: "done" },
  { id: "SP-2042", customer: "Mert Aydın", city: "Ankara", total: 1260, status: "pending" },
  { id: "SP-2043", customer: "Zeynep Öztürk", city: "Bursa", total: 9375, status: "done" },
  { id: "SP-2044", customer: "Can Yıldız", city: "Trabzon", total: 640, status: "late" },
];

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const STATUS = {
  done: <Badge tone="success" dot>Tamamlandı</Badge>,
  pending: <Badge tone="warning" dot>Bekliyor</Badge>,
  late: <Badge tone="danger" dot>Gecikti</Badge>,
} as const;

const COLUMNS: Column<Order>[] = [
  { key: "customer", header: "Müşteri", sortable: true, sortValue: (r) => r.customer },
  { key: "city", header: "Şehir" },
  { key: "status", header: "Durum", render: (r) => STATUS[r.status] },
  { key: "total", header: "Tutar", numeric: true, sortable: true, sortValue: (r) => r.total, render: (r) => money.format(r.total), bar: { value: (r) => r.total } },
];

const CITIES = ["Adana", "Ankara", "Antalya", "Bursa", "Diyarbakır", "Eskişehir", "Iğdır", "İstanbul", "İzmir", "Kayseri", "Trabzon", "Van"].map((c) => ({
  value: c.toLocaleLowerCase("tr-TR"),
  label: c,
}));

const TEAM = [
  { name: "Ayşe Demir" },
  { name: "Mert Aydın" },
  { name: "İlker Şahin" },
  { name: "Zeynep Öztürk" },
  { name: "Can Yıldız" },
  { name: "Ece Koç" },
  { name: "Burak Ural" },
];

export default function Vitrin() {
  const [range, setRange] = useState<"gun" | "hafta" | "ay">("hafta");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [format, setFormat] = useState({ bold: true, italic: false, underline: false });
  const [showGrid, setShowGrid] = useState(true);
  const partial = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (partial.current) partial.current.indeterminate = true;
  }, []);

  const commands: Command[] = [
    { id: "pano", label: "Panoya Git", group: "Gezinme", icon: <LayoutDashboard />, shortcut: ["G", "P"], onSelect: () => {} },
    { id: "siparis", label: "Siparişler", hint: "Son 30 günün siparişleri", group: "Gezinme", icon: <Package />, shortcut: ["G", "S"], onSelect: () => {} },
    { id: "ekip", label: "Ekip Üyeleri", group: "Gezinme", icon: <Users />, onSelect: () => {} },
    { id: "tema", label: "Koyu Temaya Geç", group: "Ayarlar", icon: <Moon />, keywords: ["görünüm"], onSelect: () => {} },
    { id: "bildirim", label: "Bildirim Ayarları", group: "Ayarlar", icon: <Bell />, onSelect: () => {} },
  ];

  return (
    <main id="icerik" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-small font-medium text-muted">Bileşen Kütüphanesi</p>
        <h1 className="mt-2 text-display font-semibold tracking-tight">Board Dili Vitrini</h1>
        <p className="mt-3 text-read text-body">
          Mevcut otuz yedi bileşenin yeni görünüşü: gri kuyular, beyaz karolar, yumuşak gri vurgu ve yayla gelen küçük hareketler.
        </p>
      </header>

      <div className="grid gap-x-5 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
        <Showcase name="Açılır Menü" note="Vurgulu öğe yumuşak gri, seçili öğede sağda tik, kısayol hapları.">
          <div className="flex justify-center pb-56">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger render={<Button variant="secondary" />}>Eylemler</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Belge</DropdownMenuLabel>
                  <DropdownMenuItem icon={<Pencil />} shortcut="E">
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={<Copy />} shortcut="D">
                    Çoğalt
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuItem icon={<Share2 />}>Paylaş</DropdownMenuItem>
                <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
                  Izgarayı Göster
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<Trash2 />} tone="danger">
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Showcase>

        <Showcase name="Açılır Liste" note="Beyaz karo tetikleyici; liste rounded-xl, seçili öğede sağda tik.">
          <Select
            label="Teslimat Şehri"
            defaultValue="izmir"
            items={CITIES.slice(0, 9).map((c) => ({ value: c.value, label: c.label }))}
          />
        </Showcase>

        <Showcase name="Aramalı Seçim" note="Türkçe süzgeç: “istanbul” yazınca İstanbul bulunur.">
          <Combobox label="Şube" items={CITIES} placeholder="Şehir yazın" />
        </Showcase>

        <Showcase name="Onay Kutusu" note="Tik çizilerek gelir, belirsiz durum çizgiyle.">
          <div className="grid">
            <Checkbox label="Haftalık Rapor" hint="Pazartesi sabahı e-postayla gelir." defaultChecked />
            <Checkbox label="Fatura Bildirimleri" />
            <Checkbox ref={partial} label="Bütün Şubeler" hint="12 şubeden 5'i seçili." />
          </div>
        </Showcase>

        <Showcase name="Seçenek Grubu" note="İç nokta yayla büyür; tarayıcı ok tuşlarıyla gezilir.">
          <RadioGroup
            name="kargo"
            legend="Kargo Seçeneği"
            defaultValue="standart"
            options={[
              { value: "standart", label: "Standart", hint: "2-4 iş günü, ücretsiz" },
              { value: "hizli", label: "Hızlı", hint: "Ertesi gün, ₺89" },
              { value: "magaza", label: "Mağazadan Teslim" },
            ]}
          />
        </Showcase>

        <Showcase name="Aç-Kapa Düğmesi" note="Tutamak yayla kayar, basılıyken gideceği yöne uzar.">
          <div className="grid divide-y divide-line-soft">
            <Switch label="Bildirimler" hint="Yeni sipariş gelince haber ver." defaultChecked />
            <Switch label="Sessiz Saatler" />
            <Switch label="Otomatik Fatura" disabled />
          </div>
        </Showcase>

        <Showcase name="Bölmeli Seçici" note="Gri kuyu üstünde beyaz karo kayar.">
          <div className="grid justify-items-center gap-4">
            <SegmentedControl
              aria-label="Zaman Aralığı"
              value={range}
              onValueChange={setRange}
              options={[
                { value: "gun", label: "Gün" },
                { value: "hafta", label: "Hafta" },
                { value: "ay", label: "Ay" },
              ]}
            />
            <SegmentedControl
              aria-label="Görünüm"
              size="sm"
              value="liste"
              onValueChange={() => {}}
              options={[
                { value: "liste", label: "Liste" },
                { value: "kart", label: "Kart" },
              ]}
            />
          </div>
        </Showcase>

        <Showcase name="Sekmeler" note="Kuyu görünüşü varsayılan; alt çizgi seçenek olarak duruyor." wide>
          <div className="grid gap-6">
            <Tabs
              aria-label="Proje Bölümleri"
              items={[
                { value: "genel", label: "Genel Bakış", panel: <p className="text-base text-body">Bu hafta 128 sipariş, 4 iade.</p> },
                { value: "ekip", label: "Ekip", panel: <p className="text-base text-body">7 kişi, 2 davet bekliyor.</p> },
                { value: "ayar", label: "Ayarlar", panel: <p className="text-base text-body">Bildirim ve fatura tercihleri.</p> },
              ]}
            />
            <Tabs
              aria-label="Rapor Türü"
              variant="underline"
              items={[
                { value: "satis", label: "Satış", panel: null },
                { value: "stok", label: "Stok", panel: null },
                { value: "iade", label: "İade", panel: null },
              ]}
            />
          </div>
        </Showcase>

        <Showcase name="Rozet" note="Durum tonları wash + mürekkep, kategori tonları grafik pasteli.">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge tone="success" dot>
              Tamamlandı
            </Badge>
            <Badge tone="warning" dot>
              Bekliyor
            </Badge>
            <Badge tone="danger">Gecikti</Badge>
            <Badge tone="primary">Yeni</Badge>
            <Badge>Taslak</Badge>
            <Badge tone="chart-3" shape="rounded">
              Tasarım
            </Badge>
            <Badge tone="chart-1" shape="rounded">
              Pazarlama
            </Badge>
            <Badge tone="chart-4" shape="rounded">
              Destek
            </Badge>
            <Badge tone="success" variant="outline">
              Yayında
            </Badge>
          </div>
        </Showcase>

        <Showcase name="Avatar" note="Baş harf zemini addan türeyen pastel; grup üst üste biner.">
          <div className="grid justify-items-center gap-5">
            <div className="flex items-center gap-3">
              <Avatar name="Ayşe Demir" size="lg" />
              <Avatar name="ilker şahin" />
              <Avatar name="Ece Koç" size="sm" />
            </div>
            <AvatarGroup people={TEAM} max={4} label="Ekip" />
          </div>
        </Showcase>

        <Showcase name="Gezinti Yolu" note="İkonlu öğeler, soluk chevron ayraç; telefonda tek geri bağlantısı.">
          <Breadcrumb
            items={[
              { label: "Ana Sayfa", href: "/", icon: <House /> },
              { label: "Ayarlar", href: "/vitrin", icon: <Settings /> },
              { label: "Profil", icon: <User /> },
            ]}
          />
        </Showcase>

        <Showcase name="Düğme Grubu" note="Kuyuda kaynaşmış satır; basılı düğme beyaz karo.">
          <div className="grid justify-items-center gap-4">
            <ButtonGroup aria-label="Metin Biçimi" variant="well">
              {(
                [
                  ["bold", Bold, "Kalın"],
                  ["italic", Italic, "İtalik"],
                  ["underline", Underline, "Altı Çizili"],
                ] as const
              ).map(([key, Glyph, label]) => (
                <IconButton
                  key={key}
                  icon={Glyph}
                  aria-label={label}
                  size="sm"
                  aria-pressed={format[key]}
                  onClick={() => setFormat((f) => ({ ...f, [key]: !f[key] }))}
                />
              ))}
            </ButtonGroup>
            <ButtonGroup aria-label="Tarih Gezinmesi">
              <Button variant="secondary" size="sm">
                Önceki
              </Button>
              <Button variant="secondary" size="sm">
                Bugün
              </Button>
              <Button variant="secondary" size="sm">
                Sonraki
              </Button>
            </ButtonGroup>
          </div>
        </Showcase>

        <Showcase name="İletişim Penceresi ve Yan Panel" note="rounded-2xl karo, 0,96'dan ölçekle gelir; eylemler gri kuyuda.">
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Diyaloğu Aç
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Çekmeceyi Aç
            </Button>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            size="sm"
            title="Siparişi İptal Et"
            description="SP-2042 iptal edilir ve müşteriye bildirim gider. Bu işlem geri alınamaz."
            footer={
              <>
                <Button variant="secondary" data-autofocus onClick={() => setDialogOpen(false)}>
                  Vazgeç
                </Button>
                <Button variant="danger" onClick={() => setDialogOpen(false)}>
                  İptal Et
                </Button>
              </>
            }
          />
          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title="Filtreler"
            description="Sipariş listesini daralt."
            footer={<Button onClick={() => setSheetOpen(false)}>Uygula</Button>}
          >
            <RadioGroup
              name="durum"
              legend="Durum"
              defaultValue="hepsi"
              options={[
                { value: "hepsi", label: "Hepsi" },
                { value: "bekleyen", label: "Bekleyen" },
                { value: "tamam", label: "Tamamlanan" },
              ]}
            />
          </Sheet>
        </Showcase>

        <Showcase name="Komut Paleti" note="Üstte arama, altta Gezin ↑ ↓ · Seç ↵ künyesi; ⌘K ile açılır.">
          <div className="grid justify-items-center gap-3">
            <button
              type="button"
              onClick={openCommandPalette}
              className="flex min-h-11 w-full max-w-72 items-center gap-2.5 rounded-md border border-line bg-overlay px-3 text-base text-muted shadow-raised transition-colors hover:border-line-strong"
            >
              <Search aria-hidden className="size-4" strokeWidth={1.75} />
              <span className="flex-1 text-start">Komut ya da sayfa ara</span>
              <KbdCombo keys={["⌘", "K"]} label="Command K" className="hidden pointer-fine:inline-flex" />
            </button>
            <CommandPalette commands={commands} />
          </div>
        </Showcase>

        <Showcase name="Açılır Kart ve Araç İpucu" note="Beyaz karo, kıl çizgisi, tetikleyiciden 0,96 ölçekle çıkar.">
          <div className="flex items-center justify-center gap-4">
            <Popover>
              <PopoverTrigger render={<Button variant="secondary" />}>Paylaş</PopoverTrigger>
              <PopoverContent title="Bağlantıyı Paylaş" description="Bağlantıya sahip olan herkes raporu görür.">
                <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-small text-body">
                  <span className="min-w-0 flex-1 truncate">rapor.ornek.com.tr/q3</span>
                  <CopyButton value="https://rapor.ornek.com.tr/q3" />
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip label="Ayarları Aç">
              <IconButton icon={Settings} aria-label="Ayarları Aç" variant="secondary" showTitle={false} />
            </Tooltip>
            <span className="inline-flex items-center gap-2 text-base text-body">
              Dönüşüm
              <InfoTip label="Dönüşüm Nedir">Sepete ekleyip ödemeyi tamamlayan ziyaretçilerin oranı.</InfoTip>
            </span>
          </div>
        </Showcase>

        <Showcase name="Veri Tablosu" note="Soluk başlık, kıl çizgili satırlar, üzerine gelince yumuşak gri." wide className="items-start">
          <DataTable caption="Son Siparişler" columns={COLUMNS} rows={ORDERS} rowKey={(r) => r.id} sort={{ key: "total", dir: "desc" }} sortHref={(k, d) => `?sort=${k}&dir=${d}`} minWidth="34rem" />
        </Showcase>

        <Showcase name="Sayfalama" note="Geçerli sayfa beyaz karo; telefonda “3 / 12”.">
          <Pagination page={3} pageCount={12} hrefFor={(n) => `?sayfa=${n}`} scroll={false} />
        </Showcase>

        <Showcase name="Adım Göstergesi" note="Tamamlanan dolu, bulunulan halkalı beyaz karo." wide>
          <Stepper
            current={1}
            steps={[
              { label: "Sepet", description: "3 ürün" },
              { label: "Teslimat", description: "Adres ve kargo" },
              { label: "Ödeme", description: "Kart ya da havale" },
            ]}
          />
        </Showcase>

        <Showcase name="Zaman Çizelgesi" note="Nokta kendi tonunun yıkamasında; ikonlu olay beyaz karo.">
          <Timeline
            events={[
              { id: "1", at: "2026-10-28T09:12", when: "28 Ekim, 09.12", title: "Sipariş Alındı", tone: "primary" },
              { id: "2", at: "2026-10-28T14:40", when: "28 Ekim, 14.40", title: "Kargoya Verildi", tone: "neutral", icon: <Truck /> },
              { id: "3", at: "2026-10-30T11:05", when: "30 Ekim, 11.05", title: "Teslim Edildi", description: "Kapıda imzayla teslim alındı.", tone: "success" },
            ]}
          />
        </Showcase>

        <Showcase name="Boş Durum" note="Gri kuyu, ikon beyaz karoda, tek eylem.">
          <EmptyState
            className="bg-overlay shadow-raised"
            icon={<FileText />}
            title="Henüz Fatura Yok"
            hint="İlk siparişin tamamlandığında faturası burada listelenecek."
            action={<Button size="sm">Fatura Oluştur</Button>}
          />
        </Showcase>

        <Showcase name="Açılır Bölümler" note="Kuyu görünüşünde her soru beyaz karo; chevron yuvarlakta döner.">
          <Accordion variant="well" className="bg-transparent p-0">
            <AccordionItem title="Kargo Ne Kadar Sürer?" defaultOpen exclusive="sss">
              Standart gönderim 2-4 iş günü sürer; hızlı kargo ertesi gün kapında.
            </AccordionItem>
            <AccordionItem title="İade Nasıl Yapılır?" exclusive="sss">
              Teslimden sonraki 14 gün içinde Siparişlerim sayfasından iade talebi aç.
            </AccordionItem>
          </Accordion>
        </Showcase>

        <Showcase name="Dosya Bırakma Alanı" note="Kesikli kuyu, ikon beyaz karoda; reddedilen dosya nedeniyle.">
          <FileDropzone label="Fatura Yükle" />
        </Showcase>

        <Showcase name="Ağaç Görünümü" note="Seçili öğe yumuşak gri; tam klavye haritası.">
          <TreeView
            aria-label="Proje Dosyaları"
            defaultExpanded={["rapor"]}
            selectedId="q3"
            nodes={[
              {
                id: "rapor",
                label: "Raporlar",
                icon: <FolderOpen />,
                children: [
                  { id: "q3", label: "Üçüncü Çeyrek.pdf", icon: <FileText /> },
                  { id: "q2", label: "İkinci Çeyrek.pdf", icon: <FileText /> },
                ],
              },
              { id: "fatura", label: "Faturalar", icon: <Folder />, children: [{ id: "f1", label: "Ekim.xlsx", icon: <FileText /> }] },
            ]}
          />
        </Showcase>

        <Showcase name="Ağaç Tablo" note="Treegrid; alt kalemler girintiyle geri çekilir." wide className="items-start">
          <TreeTable
            caption="Bütçe"
            defaultExpanded={["pazarlama"]}
            columns={[
              { key: "kalem", header: "Kalem" },
              { key: "plan", header: "Plan", numeric: true },
              { key: "gercek", header: "Gerçekleşen", numeric: true },
            ]}
            rows={[
              {
                id: "pazarlama",
                cells: { kalem: "Pazarlama", plan: "₺120.000", gercek: "₺98.400" },
                children: [
                  { id: "reklam", cells: { kalem: "Dijital Reklam", plan: "₺80.000", gercek: "₺71.200" } },
                  { id: "etkinlik", cells: { kalem: "Etkinlik", plan: "₺40.000", gercek: "₺27.200" } },
                ],
              },
              { id: "altyapi", cells: { kalem: "Altyapı", plan: "₺45.000", gercek: "₺46.900" }, children: [{ id: "sunucu", cells: { kalem: "Sunucu", plan: "₺45.000", gercek: "₺46.900" } }] },
            ]}
          />
        </Showcase>

        <Showcase name="İstatistik ve Mini Grafik" note="Değişim işaret, ok ve renkle; eğri yalnızca eğilim.">
          {/* Eğri dl'nin DIŞINDA: dl yalnız dt/dd (ya da onları saran div) alır (axe definition-list). */}
          <div className="flex items-end justify-between gap-4">
            <StatGrid className="grid-cols-1 sm:grid-cols-1">
              <Stat label="Haftalık Ciro" value="₺84.120" change={6.4} changeLabel="geçen haftaya göre" />
            </StatGrid>
            <Sparkline title="Son 12 Hafta Ciro" values={[42, 48, 45, 52, 58, 55, 61, 66, 63, 70, 74, 79]} />
          </div>
        </Showcase>

        <Showcase name="Yükleme" note="Spinner, marka halkası ve parıltılı iskelet; hareket azaltmada durağan.">
          <div className="grid gap-5">
            <div className="flex items-center justify-center gap-6">
              <Spinner size="sm" />
              <Spinner />
              <LoadingMark size="sm" />
              <Button disabled size="sm">
                <Spinner size="sm" tone="current" label={null} />
                Kaydediliyor
              </Button>
            </div>
            <div aria-busy="true" className="grid gap-1">
              <SkeletonRow />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </Showcase>

        <Showcase name="Klavye Tuşu ve Kopyala" note="Beyaz küçük karo tuşlar; kopyalayınca ikon yerinde döner.">
          <div className="grid justify-items-center gap-4">
            <p className="flex items-center gap-2 text-base text-body">
              Ara <KbdCombo keys={["⌘", "K"]} label="Command K" /> · Kaydet <Kbd>S</Kbd>
            </p>
            <div className="flex items-center gap-2">
              <CopyButton value="SP-2042" />
              <CopyButton value="SP-2042">Kodu Kopyala</CopyButton>
            </div>
          </div>
        </Showcase>

        <Showcase name="İkon Düğmesi" note="Hayalet, ikincil, birincil ve tehlike; basınca 0,95'e çöker.">
          <div className="flex justify-center gap-2">
            <IconButton icon={Bell} aria-label="Bildirimler" />
            <IconButton icon={Settings} aria-label="Ayarlar" variant="secondary" />
            <IconButton icon={Pencil} aria-label="Düzenle" variant="primary" />
            <IconButton icon={Trash2} aria-label="Sil" variant="danger" />
          </div>
        </Showcase>
      </div>
    </main>
  );
}
