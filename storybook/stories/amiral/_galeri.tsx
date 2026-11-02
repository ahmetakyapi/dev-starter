"use client";

/* token-ok-file: renk seçicideki hex değerler kullanıcı VERİSİ (etiket rengi), sistem rengi değil. */

import {
  Bean,
  Bell,
  Coffee,
  FileText,
  Flame,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Printer,
  RotateCcw,
  Settings,
  Share2,
  Store,
  Trash2,
  Truck,
  Copy,
  Eye,
  Tag,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Announcement } from "@/components/ui/announcement";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonGroup } from "@/components/ui/button-group";
import { Carousel } from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipGroup, FilterChip, RemovableChip } from "@/components/ui/chip";
import { CloseButton } from "@/components/ui/close-button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Combobox } from "@/components/ui/combobox";
import { openCommandPalette } from "@/components/ui/command-palette";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CopyButton } from "@/components/ui/copy-button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { Divider } from "@/components/ui/divider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { InputOTP } from "@/components/ui/input-otp";
import { Kbd, KbdCombo } from "@/components/ui/kbd";
import { LoadingMark } from "@/components/ui/loading-mark";
import { Meter, SegmentedMeter } from "@/components/ui/meter";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { NumberField } from "@/components/ui/number-field";
import { Pagination } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup } from "@/components/ui/radio-group";
import { startRouteProgress, stopRouteProgress } from "@/components/ui/route-progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Sparkline } from "@/components/ui/sparkline";
import { Spinner } from "@/components/ui/spinner";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { TimeField } from "@/components/ui/time-field";
import { Timeline } from "@/components/ui/timeline";
import { InfoTip, Tooltip } from "@/components/ui/tooltip";
import { TreeTable } from "@/components/ui/tree-table";
import { TreeView } from "@/components/ui/tree-view";
import {
  CAFES,
  NOTIFICATIONS,
  OCTOBER_ORDERS,
  ORDERS,
  ORDER_CHANGE,
  ORDER_TIMELINE,
  REVENUE_NOW,
  ROAST_TOTAL,
  ROAST_WEEK,
  SUBSCRIBERS,
  TEAM,
  change,
  fromK,
  num,
  tl,
  type Order,
  type OrderStatus,
} from "./_data";
import { Cell, CellGrid, GroupHead } from "./_ui";

const NOV = (d: number) => new Date(2026, 10, d);

/* --- Temel --------------------------------------------------------------- */

const GLYPHS = [
  { icon: Bean, label: "Çekirdek" },
  { icon: Flame, label: "Kavurma" },
  { icon: Package, label: "Paket" },
  { icon: Truck, label: "Kargo" },
] as const;

function TemelGroup() {
  const [view, setView] = useState<"liste" | "izgara">("izgara");
  const [tip, setTip] = useState(true);
  return (
    <CellGrid>
      <Cell file="icon" name="İkon" note="Tek boyut ölçeği, ince çizgi; varsayılan olarak ekran okuyucudan gizli." size="sm">
        <ul className="grid grid-cols-4 gap-2">
          {GLYPHS.map((g, i) => (
            <li key={g.label} className="grid justify-items-center gap-2 rounded-xl bg-overlay px-1 py-3 shadow-raised">
              <Icon icon={g.icon} size={i % 2 ? "lg" : "md"} className="text-strong" />
              <span className="text-micro text-muted">{g.label}</span>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell file="icon-button" name="İkon Düğmesi" note="Adı tipte zorunlu; dört ton, dokunmatikte 44 piksel." size="sm">
        <div className="flex justify-center gap-2">
          <IconButton icon={Bell} aria-label="Bildirimler" />
          <IconButton icon={Settings} aria-label="Ayarlar" variant="secondary" />
          <IconButton icon={Pencil} aria-label="Düzenle" variant="primary" />
          <IconButton icon={Trash2} aria-label="Sil" variant="danger" />
        </div>
      </Cell>
      <Cell file="button-group" name="Düğme Grubu" note="Kuyuda kaynaşmış satır; basılı düğme beyaz karoya çıkar." size="sm">
        <div className="grid justify-items-center gap-3">
          <ButtonGroup aria-label="Görünüm" variant="well">
            <IconButton icon={LayoutGrid} aria-label="Izgara" size="sm" aria-pressed={view === "izgara"} onClick={() => setView("izgara")} />
            <IconButton icon={List} aria-label="Liste" size="sm" aria-pressed={view === "liste"} onClick={() => setView("liste")} />
          </ButtonGroup>
          <ButtonGroup aria-label="Hafta Gezinmesi">
            <Button variant="secondary" size="sm">
              Önceki
            </Button>
            <Button variant="secondary" size="sm">
              Bu Hafta
            </Button>
            <Button variant="secondary" size="sm">
              Sonraki
            </Button>
          </ButtonGroup>
        </div>
      </Cell>
      <Cell file="copy-button" name="Kopyala" note="Sonuç canlı bölgede okunur; ikon yerinde döner." size="sm">
        <div className="mx-auto flex max-w-64 items-center gap-3 rounded-xl bg-overlay py-2 pr-2 pl-4 shadow-raised">
          <span className="min-w-0 flex-1">
            <span className="block text-micro text-muted">İndirim Kodu</span>
            <span className="block font-mono text-base font-semibold text-strong">KIYI10</span>
          </span>
          <CopyButton value="KIYI10" label="İndirim kodunu kopyala" />
        </div>
      </Cell>
      <Cell file="kbd" name="Klavye Tuşu" note="Beyaz küçük karo; kombinasyon tek bir adla okunur." size="sm">
        <dl className="mx-auto grid max-w-60 gap-2 text-base">
          {(
            [
              ["Ara", <KbdCombo key="k" keys={["⌘", "K"]} label="Command K" />],
              ["Yeni Sipariş", <Kbd key="n">N</Kbd>],
              ["Kenar Çubuğu", <KbdCombo key="b" keys={["⌘", "B"]} label="Command B" />],
            ] as const
          ).map(([label, keys]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-body">{label}</dt>
              <dd>{keys}</dd>
            </div>
          ))}
        </dl>
      </Cell>
      <Cell file="close-button" name="Kapat Düğmesi" note="Görsel 28–32 piksel, dokunma alanı 44; halka dairede." size="sm">
        {tip ? (
          <div className="relative mx-auto max-w-64 rounded-xl bg-overlay p-4 shadow-raised">
            <div className="absolute top-2.5 right-2.5">
              <CloseButton aria-label="İpucunu Kapat" onClick={() => setTip(false)} />
            </div>
            <p className="pr-8 text-base font-semibold text-strong">Demleme İpucu</p>
            <p className="mt-1 text-small text-muted">V60 için 15 g kahveye 250 ml, 93 °C su.</p>
          </div>
        ) : (
          <div className="grid justify-items-center">
            <Button variant="secondary" size="sm" onClick={() => setTip(true)}>
              <RotateCcw /> İpucunu Geri Getir
            </Button>
          </div>
        )}
      </Cell>
      <Cell file="badge" name="Rozet" note="Durum tonu yıkama + mürekkep; kategori tonu grafik pasteli." size="sm">
        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone="success" dot>
            Teslim Edildi
          </Badge>
          <Badge tone="warning" dot>
            Yolda
          </Badge>
          <Badge tone="danger">Gecikti</Badge>
          <Badge tone="primary">Yeni</Badge>
          <Badge tone="chart-2" shape="rounded">
            Tek Köken
          </Badge>
          <Badge tone="chart-3" shape="rounded">
            Espresso
          </Badge>
        </div>
      </Cell>
      <Cell file="avatar" name="Avatar" note="Baş harf zemini addan türeyen pastel; grup üst üste biner." size="sm">
        <div className="grid justify-items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={TEAM[0].name} size="lg" />
            <Avatar name={TEAM[1].name} />
            <Avatar name={TEAM[2].name} size="sm" />
          </div>
          <AvatarGroup people={TEAM.map((t) => ({ name: t.name }))} max={4} label="Kıyı Kahve Ekibi" />
        </div>
      </Cell>
      <Cell file="divider" name="Ayırıcı" note="Yatay, dikey ve etiketli; etiket ekran okuyucuda kaybolmaz." size="sm">
        <div className="mx-auto grid max-w-64 gap-3">
          <Button variant="secondary" size="sm">
            Mağazadan Teslim Al
          </Button>
          <Divider label="ya da" />
          <div className="flex h-8 items-center justify-center gap-3 text-small text-muted">
            <span>Kargo</span>
            <Divider orientation="vertical" />
            <span>2-3 gün</span>
            <Divider orientation="vertical" />
            <span>Ücretsiz</span>
          </div>
        </div>
      </Cell>
    </CellGrid>
  );
}

/* --- Seçim --------------------------------------------------------------- */

const ORIGINS = ["Brezilya", "Burundi", "El Salvador", "Endonezya", "Etiyopya", "Guatemala", "Hindistan", "Kenya", "Kolombiya", "Kosta Rika", "Peru", "Ruanda", "Yemen"].map((c) => ({
  value: c.toLocaleLowerCase("tr-TR"),
  label: c,
}));

function SecimGroup() {
  const [roast, setRoast] = useState<"acik" | "orta" | "koyu">("orta");
  const [filters, setFilters] = useState<Record<string, boolean>>({ Yolda: true, Gecikti: true, Teslim: false });
  const [notes, setNotes] = useState(["Çikolata", "Fındık", "Karamel"]);
  const partial = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (partial.current) partial.current.indeterminate = true;
  }, []);
  return (
    <CellGrid>
      <Cell file="switch" name="Aç-Kapa" note="Anında etki eder; tutamak yayla kayar." align="stretch">
        <div className="grid divide-y divide-line-soft rounded-xl bg-overlay px-4 shadow-raised">
          <Switch label="Yeni Sipariş Bildirimi" hint="Toptan siparişte telefon titrer." defaultChecked />
          <Switch label="Sessiz Saatler" hint="22.00 – 08.00" />
          <Switch label="Otomatik Fatura" disabled />
        </div>
      </Cell>
      <Cell file="checkbox" name="Onay Kutusu" note="Tik çizilerek gelir; belirsiz durum çizgiyle." align="stretch">
        <div className="grid">
          <Checkbox label="Haftalık Kavurma Raporu" hint="Pazartesi sabahı e-postayla." defaultChecked />
          <Checkbox label="Stok Uyarıları" />
          <Checkbox ref={partial} label="Bütün Kafeler" hint="8 kafeden 5'i seçili." />
        </div>
      </Cell>
      <Cell file="radio-group" name="Seçenek Grubu" note="2-6 görünür seçenek; tarayıcı ok tuşlarıyla gezilir." align="stretch">
        <RadioGroup
          name="ogutme"
          legend="Öğütme"
          defaultValue="filtre"
          options={[
            { value: "cekirdek", label: "Çekirdek", hint: "En uzun tazelik" },
            { value: "filtre", label: "Filtre", hint: "V60, Chemex" },
            { value: "espresso", label: "Espresso" },
          ]}
        />
      </Cell>
      <Cell file="select" name="Açılır Liste" note="5-15 seçenek, dar yer; seçili öğede sağda tik." span={3}>
        <div className="mx-auto max-w-sm">
          <Select label="Teslim Edilecek Kafe" defaultValue="alsancak" items={CAFES.map((c) => ({ value: c.value, label: c.label }))} />
        </div>
      </Cell>
      <Cell file="combobox" name="Aramalı Seçim" note="Türkçe süzgeç: “etiyop” yazınca Etiyopya bulunur." span={3}>
        <div className="mx-auto max-w-sm">
          <Combobox label="Menşe Ülke" items={ORIGINS} placeholder="Ülke yazın" />
        </div>
      </Cell>
      <Cell file="segmented-control" name="Bölmeli Seçici" note="2-5 seçenekten biri; gri kuyu üstünde beyaz karo kayar." span={3}>
        <div className="grid justify-items-center gap-4">
          <SegmentedControl
            aria-label="Kavurma Derecesi"
            value={roast}
            onValueChange={setRoast}
            options={[
              { value: "acik", label: "Açık" },
              { value: "orta", label: "Orta" },
              { value: "koyu", label: "Koyu" },
            ]}
          />
          <p className="text-small text-muted" aria-live="polite">
            {roast === "acik" ? "Meyvemsi, yüksek asidite" : roast === "orta" ? "Dengeli, karamel tatlılığı" : "Yoğun gövde, bitter çikolata"}
          </p>
        </div>
      </Cell>
      <Cell file="chip" name="Süzgeç Etiketi" note="Süzgeç çipi basılı durum taşır; kaldırılabilir çipte yalnız × düğme." span={3}>
        <div className="grid gap-4">
          <ChipGroup aria-label="Sipariş Durumu">
            {Object.entries(filters).map(([name, on], i) => (
              <FilterChip key={name} selected={on} count={[14, 3, 212][i]} onClick={() => setFilters((f) => ({ ...f, [name]: !f[name] }))}>
                {name}
              </FilterChip>
            ))}
          </ChipGroup>
          <ChipGroup aria-label="Tat Notaları">
            {notes.map((n) => (
              <RemovableChip key={n} label={n} onRemove={() => setNotes((list) => list.filter((x) => x !== n))}>
                {n}
              </RemovableChip>
            ))}
            {notes.length === 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setNotes(["Çikolata", "Fındık", "Karamel"])}>
                Notaları Geri Getir
              </Button>
            ) : null}
          </ChipGroup>
        </div>
      </Cell>
    </CellGrid>
  );
}

/* --- Form ---------------------------------------------------------------- */

const LABEL_COLORS = [
  { value: "#7c4a2d", label: "Kavrulmuş" },
  { value: "#c8a165", label: "Krema" },
  { value: "#3f6b4f", label: "Zeytin" },
  { value: "#d9663a", label: "Kiremit" },
  { value: "#2f4858", label: "Gece" },
];

function FormGroup() {
  const [range, setRange] = useState<DateRange | null>({ start: NOV(9), end: NOV(13) });
  const [note, setNote] = useState("Arka kapıdan teslim; sabah 08.00'den önce gelirseniz zili çalın, kavurma odasındayız.");
  return (
    <CellGrid>
      <Cell file="date-calendar" name="Takvim" note="Pazartesi başlayan ay; aralık uçları dolgulu, Pazar günleri kapalı." span={4} size="lg">
        <div className="flex flex-wrap items-start justify-center gap-4">
          <div className="w-full max-w-[21rem] rounded-xl bg-overlay p-3 shadow-raised">
            <DateCalendar
              mode="range"
              label="Tadım Atölyesi"
              value={range}
              onValueChange={setRange}
              defaultMonth={NOV(1)}
              isDateDisabled={(d) => d.getDay() === 0}
            />
          </div>
          <div className="flex w-full max-w-[16rem] flex-col gap-2 self-stretch rounded-xl bg-overlay p-4 shadow-raised">
            <p className="text-small font-medium text-muted">Seçilen Aralık</p>
            <p className="text-title font-semibold text-strong tabular-nums">
              {range?.start && range.end
                ? `${range.start.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} – ${range.end.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`
                : "Bir aralık seçin"}
            </p>
            <p className="mt-auto text-small text-body">Her gün 10.00'da iki saatlik tadım; en fazla sekiz kişi.</p>
          </div>
        </div>
      </Cell>
      <Cell file="date-picker" name="Tarih Seçici" note="Alan + açılır takvim; açılınca odak seçili güne gider." span={2} size="lg">
        <div className="grid gap-6">
          <DatePicker label="Teslim Tarihi" defaultValue={NOV(6)} defaultMonth={NOV(1)} name="teslim" />
          <DatePicker mode="range" label="Rapor Dönemi" placeholder="Başlangıç – Bitiş" defaultMonth={NOV(1)} />
        </div>
      </Cell>
      <Cell file="slider" name="Kaydırıcı" note="Aralıkta yaklaşık değer; tek tutamak ya da iki uçlu aralık." span={3}>
        <div className="mx-auto grid max-w-sm gap-8">
          <Slider label="Öğütme İnceliği" defaultValue={0.42} format={{ style: "percent" }} min={0} max={1} step={0.01} />
          <Slider
            label="Paket Fiyatı"
            defaultValue={[350, 900]}
            min={0}
            max={1500}
            step={50}
            minStepsBetweenValues={2}
            marks={[0, 500, 1000, 1500]}
            showMarkLabels
            format={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }}
            thumbLabels={["En Düşük Fiyat", "En Yüksek Fiyat"]}
          />
        </div>
      </Cell>
      <Cell file="number-field" name="Sayı Alanı" note="Kesin küçük sayı; Shift ile on katı, sınırda düğme kapanır." span={3}>
        <div className="mx-auto grid max-w-xs gap-6">
          <NumberField label="Paket Adedi" defaultValue={12} min={1} max={60} hint="Toptanda en az 12 paket." />
          <NumberField label="Kilo Fiyatı" defaultValue={2640} min={0} step={20} format={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }} />
        </div>
      </Cell>
      <Cell file="input-otp" name="Doğrulama Kodu" note="Yapıştırınca hanelere dağılır, yazdıkça ilerler.">
        <InputOTP label="Doğrulama Kodu" defaultValue="5810" hint="0532 *** ** 18 numarasına gönderdik." />
      </Cell>
      <Cell file="textarea" name="Metin Alanı" note="İçeriğe göre büyür; sınıra yaklaşınca sayaç uyarır.">
        <Textarea label="Teslimat Notu" maxLength={120} minRows={3} value={note} onChange={(e) => setNote(e.target.value)} hint="Kurye yalnızca bunu görür." />
      </Cell>
      <Cell file="tag-input" name="Etiket Girişi" note="Enter ya da virgülle ekle, Backspace ile geri al.">
        <TagInput
          label="Tat Notaları"
          defaultValue={["Bergamot", "Yasemin", "Şeftali"]}
          suggestions={["Bergamot", "Yasemin", "Şeftali", "Çikolata", "Fındık", "Karamel", "Kırmızı Meyve", "Narenciye"]}
          maxTags={6}
          hint="En fazla 6 nota."
        />
      </Cell>
      <Cell file="color-picker" name="Renk Seçici" note="Kullanıcının kendi rengi: alan, ton şeridi, hex ve hazır renkler.">
        <div className="mx-auto max-w-xs rounded-xl bg-overlay p-4 shadow-raised">
          <ColorPicker label="Paket Etiketi Rengi" defaultValue="#7c4a2d" presets={LABEL_COLORS} />
        </div>
      </Cell>
      <Cell file="time-field" name="Saat Alanı" note="SS:DD segmentleri; oklarla artır, rakamla yaz.">
        <div className="mx-auto grid max-w-xs gap-6">
          <TimeField label="Teslim Saati" defaultValue="08:30" minuteStep={15} />
          <TimeField label="Kavurma Başlangıcı" defaultValue="06:45" hint="24 saat düzeninde." />
        </div>
      </Cell>
      <Cell file="file-dropzone" name="Dosya Bırakma Alanı" note="Klavyeyle açılır; reddedilen dosya nedeniyle okunur.">
        <FileDropzone label="Yeşil Çekirdek Faturası" />
      </Cell>
    </CellGrid>
  );
}

/* --- Katmanlar ----------------------------------------------------------- */

/** Katman hücrelerinde tetikleyicinin bağlamı: düğme boşlukta değil, ait olduğu nesnenin karosunda. */
function ContextTile({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-wrap items-center justify-between gap-3 rounded-xl bg-overlay py-3 pr-3 pl-4 shadow-raised">
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-strong">{title}</span>
        <span className="block truncate text-small text-muted">{meta}</span>
      </span>
      {children}
    </div>
  );
}

function KatmanGroup() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(() => NOTIFICATIONS.map((n) => ({ ...n })));
  return (
    <CellGrid>
      <Cell file="dropdown-menu" name="Açılır Menü" note="Oklar, Home/End, harfle atlama; yıkıcı öğe ayrı grupta." span={3}>
        <ContextTile title="KK-3192 · Alsancak Demlik" meta="24 kg Kıyı Harmanı · ₺15.840">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>Eylemler</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>KK-3192</DropdownMenuLabel>
                <DropdownMenuItem icon={<Pencil />} shortcut="E">
                  Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem icon={<Printer />} shortcut="P">
                  İrsaliye Yazdır
                </DropdownMenuItem>
                <DropdownMenuItem icon={<Share2 />}>Kafeyle Paylaş</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 />} tone="danger">
                Siparişi İptal Et
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContextTile>
      </Cell>
      <Cell file="context-menu" name="Bağlam Menüsü" note="Sağ tık ya da uzun basma; kısayollar ve ayrı yıkıcı grup." span={3}>
        <ContextMenu>
          <ContextMenuTrigger className="mx-auto block w-full max-w-72 rounded-xl bg-overlay p-3 shadow-raised outline-none select-none focus-visible:outline-2 focus-visible:outline-line-focus">
            <div className="grid aspect-[16/7] place-items-center rounded-xl bg-chart-1/25">
              <FileText aria-hidden className="size-7 text-strong" strokeWidth={1.5} />
            </div>
            <p className="mt-3 truncate text-base font-semibold text-strong">Kıyı Harmanı etiketi.pdf</p>
            <p className="text-small text-muted">Sağ tıklayın ya da basılı tutun</p>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem icon={<Eye />} shortcut={["⌘", "O"]}>
              Aç
            </ContextMenuItem>
            <ContextMenuItem icon={<Copy />} shortcut={["⌘", "D"]}>
              Kopyasını Oluştur
            </ContextMenuItem>
            <ContextMenuItem icon={<Printer />}>Matbaaya Gönder</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem tone="danger" icon={<Trash2 />}>
              Çöp Kutusuna Taşı
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Cell>
      <Cell file="dialog" name="İletişim Penceresi" note="Yerel dialog: odak tuzağı, Escape ve odak dönüşü tarayıcıdan.">
        <ContextTile title="KK-3192" meta="Hazırlanıyor · bugün kargoda">
          <Button variant="danger" size="sm" onClick={() => setDialog(true)}>
            İptal Et
          </Button>
        </ContextTile>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          size="sm"
          title="Siparişi İptal Et"
          description="KK-3192 iptal edilir ve Alsancak Demlik'e bildirim gider. Bu işlem geri alınamaz."
          footer={
            <>
              <Button variant="secondary" data-autofocus onClick={() => setDialog(false)}>
                Vazgeç
              </Button>
              <Button variant="danger" onClick={() => setDialog(false)}>
                İptal Et
              </Button>
            </>
          }
        />
      </Cell>
      <Cell file="sheet" name="Yan Panel" note="Telefonda alttan çekmece, masaüstünde sağdan panel.">
        <ContextTile title="Siparişler" meta="14 açık · 3 kanal">
          <Button variant="secondary" size="sm" onClick={() => setSheet(true)}>
            Süzgeçler
          </Button>
        </ContextTile>
        <Sheet
          open={sheet}
          onOpenChange={setSheet}
          title="Süzgeçler"
          description="Sipariş listesini daralt."
          footer={<Button onClick={() => setSheet(false)}>Uygula</Button>}
        >
          <RadioGroup
            name="kanal-suzgec"
            legend="Kanal"
            defaultValue="hepsi"
            options={[
              { value: "hepsi", label: "Hepsi" },
              { value: "web", label: "Web Mağaza" },
              { value: "toptan", label: "Kafelere Toptan" },
              { value: "abone", label: "Abonelik" },
            ]}
          />
        </Sheet>
      </Cell>
      <Cell file="popover" name="Açılır Kart" note="Sayfayı kilitlemez; dış tıklama ve Escape kapatır.">
        <ContextTile title="Toptan Fiyat Listesi" meta="Kasım 2026 · 8 kafe">
          <Popover>
            <PopoverTrigger render={<Button variant="secondary" size="sm" />}>Paylaş</PopoverTrigger>
            <PopoverContent title="Toptan Fiyat Listesi" description="Bağlantıya sahip olan her kafe listeyi görür.">
              <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-small text-body">
                <span className="min-w-0 flex-1 truncate">kiyikahve.com.tr/toptan</span>
                <CopyButton value="https://kiyikahve.com.tr/toptan" />
              </div>
            </PopoverContent>
          </Popover>
        </ContextTile>
      </Cell>
      <Cell file="tooltip" name="Araç İpucu" note="Görsel etiket üzerine gelince; açıklama InfoTip'le tıklanınca.">
        <div className="flex items-center justify-center gap-4">
          <Tooltip label="Kavurma Ayarları">
            <IconButton icon={Flame} aria-label="Kavurma Ayarları" variant="secondary" showTitle={false} />
          </Tooltip>
          <span className="inline-flex items-center gap-2 text-base text-body">
            Ağırlık Kaybı
            <InfoTip label="Ağırlık Kaybı Nedir">Kavurmada çekirdeğin yitirdiği su; orta kavurmada yüzde 14 civarı.</InfoTip>
          </span>
        </div>
      </Cell>
      <Cell file="command-palette" name="Komut Paleti" note="⌘K ile her yerden; Türkçe arama, ok tuşları, Enter.">
        <button
          type="button"
          onClick={openCommandPalette}
          className="mx-auto flex min-h-11 w-full max-w-72 items-center gap-2.5 rounded-xl border border-line bg-overlay px-3 text-base text-muted shadow-raised transition-colors hover:border-line-strong"
        >
          <Coffee aria-hidden className="size-4" strokeWidth={1.75} />
          <span className="flex-1 text-start">Bölüm ya da palet ara</span>
          <KbdCombo keys={["⌘", "K"]} label="Command K" className="hidden pointer-fine:inline-flex" />
        </button>
      </Cell>
      <Cell file="notification-center" name="Bildirim Merkezi" note="Zil okunmamış sayısını söyler; güne göre gruplar.">
        <div className="mx-auto flex max-w-xs items-center justify-between rounded-xl bg-overlay py-1.5 pr-2 pl-4 shadow-raised">
          <span className="text-base font-semibold text-strong">Atölye</span>
          <NotificationCenter items={items} onMarkRead={(ids) => setItems((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))} />
        </div>
      </Cell>
    </CellGrid>
  );
}

/* --- Veri ---------------------------------------------------------------- */

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "danger" | "neutral"> = {
  "Teslim Edildi": "success",
  Yolda: "warning",
  Gecikti: "danger",
  Hazırlanıyor: "neutral",
};

const COLUMNS: Column<Order>[] = [
  { key: "id", header: "Sipariş", render: (r) => <span className="font-mono text-small text-strong">{r.id}</span> },
  { key: "customer", header: "Müşteri", sortable: true, sortValue: (r) => r.customer },
  {
    key: "status",
    header: "Durum",
    render: (r) => (
      <Badge tone={STATUS_TONE[r.status]} dot>
        {r.status}
      </Badge>
    ),
  },
  { key: "total", header: "Tutar", numeric: true, sortable: true, sortValue: (r) => r.total, render: (r) => tl.format(r.total), bar: { value: (r) => r.total } },
];

const SPARK = [
  { name: "Kıyı Harmanı", values: [31, 34, 33, 38, 41, 40, 44, 47, 46, 52, 55, 58] },
  { name: "Etiyopya Yirgacheffe", values: [22, 25, 24, 28, 27, 31, 30, 34, 36, 35, 39, 42] },
  { name: "Brezilya Cerrado", values: [40, 38, 39, 36, 37, 35, 36, 34, 33, 34, 32, 31] },
] as const;

function VeriGroup() {
  const lastMonth = REVENUE_NOW[REVENUE_NOW.length - 1];
  const prevMonth = REVENUE_NOW[REVENUE_NOW.length - 2];
  return (
    <CellGrid>
      <Cell file="data-table" name="Veri Tablosu" note="Sıralanır; tutarın arkasında karşılaştırma çubuğu, dar ekranda kayar." span={4} align="stretch">
        <DataTable caption="Son Siparişler" columns={COLUMNS} rows={ORDERS} rowKey={(r) => r.id} sort={{ key: "total", dir: "desc" }} sortHref={(k, d) => `?sort=${k}&dir=${d}`} minWidth="32rem" on="surface" density="compact" />
      </Cell>
      <Cell file="stat" name="İstatistik" note="Değişim işaret, ok ve sözle; renk tek işaret değil." span={2} align="stretch">
        <StatGrid className="grid-cols-1 sm:grid-cols-1">
          <Stat label="Ekim Cirosu" value={fromK(lastMonth)} change={change(lastMonth, prevMonth)} changeLabel="Eylül'e göre" />
          <Stat label="Web Siparişi" value={num.format(OCTOBER_ORDERS)} change={ORDER_CHANGE} changeLabel="Eylül'e göre" />
          <Stat label="Aktif Abone" value={num.format(SUBSCRIBERS)} />
        </StatGrid>
      </Cell>
      <Cell file="tree-table" name="Ağaç Tablo" note="Açılır satırlar; alt kalemler girintiyle geri çekilir." span={4} align="stretch">
        <TreeTable
          caption="Ekim Giderleri"
          defaultExpanded={["cekirdek"]}
          columns={[
            { key: "kalem", header: "Kalem" },
            { key: "plan", header: "Bütçe", numeric: true },
            { key: "gercek", header: "Gerçekleşen", numeric: true },
          ]}
          rows={[
            {
              id: "cekirdek",
              cells: { kalem: "Yeşil Çekirdek", plan: "₺142.000", gercek: "₺138.600" },
              children: [
                { id: "etiyopya", cells: { kalem: "Etiyopya", plan: "₺58.000", gercek: "₺61.200" } },
                { id: "brezilya", cells: { kalem: "Brezilya", plan: "₺52.000", gercek: "₺47.900" } },
                { id: "kolombiya", cells: { kalem: "Kolombiya", plan: "₺32.000", gercek: "₺29.500" } },
              ],
            },
            { id: "ambalaj", cells: { kalem: "Ambalaj", plan: "₺18.000", gercek: "₺19.400" }, children: [{ id: "valf", cells: { kalem: "Valfli Paket", plan: "₺18.000", gercek: "₺19.400" } }] },
            { id: "kargo", cells: { kalem: "Kargo", plan: "₺24.000", gercek: "₺22.150" } },
          ]}
        />
      </Cell>
      <Cell file="tree-view" name="Ağaç Görünümü" note="Klasör ağacı; oklar, Home/End ve yazarak arama." span={2} align="stretch">
        <TreeView
          aria-label="Kavurma Reçeteleri"
          defaultExpanded={["espresso"]}
          selectedId="kiyi"
          nodes={[
            {
              id: "espresso",
              label: "Espresso",
              icon: <FolderOpen />,
              children: [
                { id: "kiyi", label: "Kıyı Harmanı", icon: <FileText /> },
                { id: "gece", label: "Gece Harmanı", icon: <FileText /> },
              ],
            },
            { id: "filtre", label: "Filtre", icon: <Folder />, children: [{ id: "yirga", label: "Yirgacheffe Açık", icon: <FileText /> }] },
            { id: "arsiv", label: "Arşiv", icon: <Folder />, children: [{ id: "eski", label: "Yaz 2025", icon: <FileText /> }] },
          ]}
        />
      </Cell>
      <Cell file="timeline" name="Zaman Çizelgesi" note="Tarihli olaylar; nokta kendi tonunun yıkamasında." span={3}>
        <Timeline events={ORDER_TIMELINE} />
      </Cell>
      <Cell file="sparkline" name="Mini Grafik" note="Eksensiz eğilim; tablo satırında yer kaplamaz." span={3} align="stretch">
        <ul className="grid gap-1.5">
          {SPARK.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-4 rounded-xl bg-overlay px-4 py-3 shadow-raised">
              <span className="min-w-0">
                <span className="block truncate text-base font-medium text-strong">{s.name}</span>
                <span className="text-small text-muted tabular-nums">{s.values[s.values.length - 1]} paket / hafta</span>
              </span>
              <Sparkline title={`${s.name}, son 12 hafta`} values={s.values} tone="auto" />
            </li>
          ))}
        </ul>
      </Cell>
    </CellGrid>
  );
}

/* --- Geri Bildirim ------------------------------------------------------- */

function GeriGroup() {
  const [upload, setUpload] = useState(64);
  return (
    <CellGrid>
      <Cell file="banner-alert" name="Uyarı Satırı" note="Dört ton yıkama zeminde; ikon, başlık, eylem. Tek kenar şeridi yok." span={4} align="stretch">
        <div className="grid gap-3">
          <BannerAlert
            tone="warning"
            title="Urla Bağ Evi teslimatı bir gün gecikti"
            description="Seferihisar aktarmasında bekledi; yeni tahmin 3 Kasım öğleden önce."
            actions={
              <Button variant="secondary" size="sm">
                Kafeye Haber Ver
              </Button>
            }
          />
          <BannerAlert tone="success" title="Ekim kapanışı tamamlandı" description="214 fatura eşleşti, fark yok." />
          <BannerAlert tone="info" title="Yeşil çekirdek kuru her gün 15.30'da güncellenir" />
        </div>
      </Cell>
      <Cell file="meter" name="Ölçer" note="Doluluk; eşikte ton ve durum metni birlikte değişir." span={2} align="stretch">
        <div className="grid gap-6">
          <Meter label="Çekirdek Deposu" value={3.4} max={4} valueText="3,4 / 4 ton" />
          <Meter label="Kavurma Kapasitesi" value={1147} max={1600} valueText="1.147 / 1.600 kg" />
          <SegmentedMeter
            label="Depo Dağılımı"
            max={4}
            format={(n) => `${n.toLocaleString("tr-TR")} ton`}
            segments={[
              { label: "Etiyopya", value: 1.4, series: 2 },
              { label: "Brezilya", value: 1.3, series: 5 },
              { label: "Kolombiya", value: 0.7, series: 3 },
            ]}
          />
        </div>
      </Cell>
      <Cell file="progress" name="İlerleme" note="Belirli ve belirsiz; bitince “Tamamlandı” der." align="stretch">
        <div className="grid gap-5">
          <Progress label="Etiket baskısı" value={upload} hint="240 etiketten sırada olanlar" />
          <Progress label="Kafe listesi eşitleniyor" value={null} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setUpload((v) => Math.max(0, v - 18))}>
              Geri
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setUpload((v) => Math.min(100, v + 18))}>
              İlerlet
            </Button>
          </div>
        </div>
      </Cell>
      <Cell file="empty-state" name="Boş Durum" note="İkon beyaz karoda, tek cümle, tek eylem.">
        <EmptyState
          className="bg-overlay shadow-raised"
          icon={<Store />}
          title="Bekleyen İade Yok"
          hint="Bir müşteri iade açınca burada görünür."
          action={
            <Button variant="secondary" size="sm">
              İade Kurallarını Aç
            </Button>
          }
        />
      </Cell>
      <Cell file="announcement" name="Duyuru" note="Kahramanın üstünde tek satırlık haber; hap tek bağlantı.">
        <div className="grid justify-items-center gap-3">
          <Announcement href="#grafikler" tag="Yeni">
            Kavurma raporu panoda
          </Announcement>
          <Announcement href="#tema" tag="Sürüm 3.0">
            On palet, iki tema
          </Announcement>
        </div>
      </Cell>
    </CellGrid>
  );
}

/* --- Gezinme ------------------------------------------------------------- */

const SLIDES = [
  { tag: "Kasım Kahvesi", title: "Etiyopya Guji", body: "Şeftali, yasemin, bal. Açık kavrum, filtre için.", series: "bg-chart-2/30" },
  { tag: "Harman", title: "Kıyı Harmanı", body: "Fındık ve sütlü çikolata; espressoda kremalı.", series: "bg-chart-3/30" },
  { tag: "Sınırlı Parti", title: "Kenya Nyeri AA", body: "Frenk üzümü ve greyfurt; yalnızca 60 paket.", series: "bg-chart-4/30" },
  { tag: "Kafeler İçin", title: "Gece Harmanı", body: "Koyu kavrum, sütle güçlü; 5 kg toptan torba.", series: "bg-chart-1/30" },
];

const PEAK = ROAST_WEEK.reduce((a, d) => (d.value > a.value ? d : a));

/** Sekme paneli: üç küçük karo. */
function Facts({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-4 grid grid-cols-3 gap-1.5">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-overlay px-3 py-3 shadow-raised">
          <dt className="truncate text-small text-muted">{k}</dt>
          <dd className="mt-1 text-title font-semibold text-strong tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function GezinmeGroup() {
  return (
    <CellGrid>
      <Cell file="tabs" name="Sekmeler" note="Kuyu görünüşü varsayılan; oklarla sekme, panel aynı sayfada." span={3} align="stretch">
        <Tabs
          aria-label="Atölye Bölümleri"
          items={[
              { value: "genel", label: "Genel", panel: <Facts items={[["Kavrum", `${num.format(ROAST_TOTAL)} kg`], ["Web Siparişi", num.format(OCTOBER_ORDERS)], ["Abone", num.format(SUBSCRIBERS)]]} /> },
            { value: "kavurma", label: "Kavurma", panel: <Facts items={[["En Yoğun Gün", "Perşembe"], ["O Gün", `${num.format(PEAK.value)} kg`], ["Parti", "44"]]} /> },
            { value: "toptan", label: "Toptan", panel: <Facts items={[["Kafe", num.format(CAFES.length)], ["Ort. Sipariş", "18 kg"], ["Geciken", "1"]]} /> },
          ]}
        />
      </Cell>
      <Cell file="stepper" name="Adım Göstergesi" note="Tamamlanan dolu, bulunulan halkalı; gizli “Tamamlandı” metni." span={3}>
        <Stepper
          current={2}
          steps={[
            { label: "Sepet", description: "3 paket" },
            { label: "Öğütme", description: "Filtre" },
            { label: "Teslimat", description: "Adres ve saat" },
            { label: "Ödeme" },
          ]}
        />
      </Cell>
      <Cell file="carousel" name="Kart Kaydırıcı" note="Kaydırma yakalamalı; oklar, uzayan hap nokta, klavye. Otomatik oynamaz." span={4} align="stretch">
        <Carousel
          label="Bu Ayın Kahveleri"
          slides={SLIDES.map((s) => (
            <article key={s.title} className="h-full rounded-xl bg-overlay p-4 shadow-raised">
              <div aria-hidden className={`mb-5 grid h-20 place-items-center rounded-xl ${s.series}`}>
                <Coffee className="size-6 text-strong" strokeWidth={1.5} />
              </div>
              <p className="text-micro font-semibold text-muted">{s.tag}</p>
              <h4 className="mt-1 text-title font-semibold text-strong">{s.title}</h4>
              <p className="mt-1 text-base text-body">{s.body}</p>
            </article>
          ))}
        />
      </Cell>
      <Cell file="accordion" name="Açılır Bölümler" note="Yerel details; Ctrl+F kapalı içeriği de bulur." span={2} align="stretch">
        <Accordion variant="well" className="bg-transparent p-0">
          <AccordionItem title="Kahve Ne Kadar Taze?" defaultOpen exclusive="sss">
            Sipariş gelince kavrulur; paket kavurmadan en geç iki gün sonra yola çıkar.
          </AccordionItem>
          <AccordionItem title="Toptan En Az Ne Kadar?" exclusive="sss">
            Kafeler için en az 12 paket ya da 5 kg torba.
          </AccordionItem>
          <AccordionItem title="Abonelik Nasıl Durur?" exclusive="sss">
            Hesabından tek dokunuşla; ceza yok.
          </AccordionItem>
        </Accordion>
      </Cell>
      <Cell file="breadcrumb" name="Gezinti Yolu" note="Son öğe bulunulan sayfa; telefonda tek geri bağlantısı." span={3} size="sm">
        <Breadcrumb
          items={[
            { label: "Mağaza", href: "#bilesenler", icon: <Store /> },
            { label: "Tek Köken", href: "#bilesenler", icon: <Bean /> },
            { label: "Etiyopya Yirgacheffe", icon: <Tag /> },
          ]}
        />
      </Cell>
      <Cell file="pagination" name="Sayfalama" note="Geçerli sayfa beyaz karo; telefonda “3 / 12”." span={3} size="sm">
        <Pagination page={3} pageCount={12} hrefFor={(n) => `?sayfa=${n}`} scroll={false} />
      </Cell>
    </CellGrid>
  );
}

/* --- Yükleme ------------------------------------------------------------- */

function YuklemeGroup() {
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      stopRouteProgress();
    },
    [],
  );
  function navigate() {
    setRunning(true);
    startRouteProgress();
    timer.current = window.setTimeout(() => {
      stopRouteProgress();
      setRunning(false);
    }, 1600);
  }
  return (
    <CellGrid className="lg:grid-cols-4">
      <Cell file="spinner" name="Dönen Gösterge" note="Satır içi ve düğme içi kısa bekleme." span={1} size="sm">
        <div className="grid justify-items-center gap-4">
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner />
          </div>
          <Button disabled size="sm">
            <Spinner size="sm" tone="current" label={null} />
            Kaydediliyor
          </Button>
        </div>
      </Cell>
      <Cell file="loading-mark" name="Marka Halkası" note="Sayfa ya da kart düzeyinde bekleme." span={1} size="sm">
        <div className="grid justify-items-center">
          <LoadingMark showLabel label="Rapor hazırlanıyor" />
        </div>
      </Cell>
      <Cell file="skeleton" name="İskelet" note="Gelecek içeriğin şeklinde; kap aria-busy taşır." span={1} size="sm">
        <div aria-busy="true" className="grid gap-2 rounded-xl bg-overlay p-4 shadow-raised">
          <SkeletonRow />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Cell>
      <Cell file="route-progress" name="Gezinme Çubuğu" note="Sayfanın üstünde ince çubuk; gecikirse “Yükleniyor” hapı." span={1} size="sm">
        <div className="grid justify-items-center gap-2">
          <Button variant="secondary" size="sm" onClick={navigate} disabled={running}>
            {running ? "Gidiliyor" : "Gezinmeyi Canlandır"}
          </Button>
          <p className="text-center text-small text-muted">Çubuk sayfanın en üstünde belirir.</p>
        </div>
      </Cell>
    </CellGrid>
  );
}

/* --- Galeri ------------------------------------------------------------- */

export const GALLERY_GROUPS = [
  { id: "temel", Group: TemelGroup },
  { id: "secim", Group: SecimGroup },
  { id: "form", Group: FormGroup },
  { id: "katman", Group: KatmanGroup },
  { id: "veri", Group: VeriGroup },
  { id: "geri", Group: GeriGroup },
  { id: "gezinme", Group: GezinmeGroup },
  { id: "yukleme", Group: YuklemeGroup },
] as const;

export { GroupHead };
