"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  CheckCheck,
  Columns3,
  Download,
  Eye,
  Folder,
  FolderOpen,
  Hash,
  Inbox,
  Link2,
  Mail,
  Phone,
  Radio,
  SearchX,
  Share2,
  SlidersHorizontal,
  Tag,
  UserRoundCheck,
} from "lucide-react";
import { AssigneePicker, type Person } from "@/components/ui/assignee-picker";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipGroup, FilterChip, RemovableChip } from "@/components/ui/chip";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CopyButton } from "@/components/ui/copy-button";
import { DataTable, parseSort, sortRows, type Column } from "@/components/ui/data-table";
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
import { PatternBackground } from "@/components/ui/pattern-bg";
import { SlotText } from "@/components/ui/slot-text";
import { HoldButton } from "@/components/ui/hold-button";
import { HoverCard, ProfilePreview } from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Rating } from "@/components/ui/rating";
import { Reactions, type Reaction } from "@/components/ui/reactions";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { Select, type SelectItem } from "@/components/ui/select";
import { SelectionAction, SelectionBar } from "@/components/ui/selection-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DateRangePresets, rangeOf, type DateRangeValue, type RangePreset } from "@/components/ui/date-range-presets";
import { FilterSheet, type FilterGroup, type FilterValue } from "@/components/ui/filter-sheet";
import { RecordList } from "@/components/ui/record-list";
import { Sheet } from "@/components/ui/sheet";
import { CloseTicketDialog, TicketPriorityFactors } from "./_ek-n";
import { Timeline } from "@/components/ui/timeline";
import { Tabs } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TreeTable } from "@/components/ui/tree-table";
import { TreeView, type TreeNode } from "@/components/ui/tree-view";
import { Button } from "@/components/ui/Button";
import {
  CUSTOMERS,
  ME,
  PRIORITIES,
  STATUSES,
  STATUS_SLUG,
  TEAM,
  TODAY,
  TICKETS,
  TICKET_CHANNELS,
  clock,
  customer,
  dateTime,
  member,
  num,
  order,
  shortDate,
  starsOf,
  ticket,
  ticketEvents,
  tl,
  type Priority,
  type Ticket,
  type TicketStatus,
} from "./_data";
import { PageBar, fromSlug, href, useApp, type Params } from "./_ui";

const PER_PAGE = 8;

const STATUS_TONE = { Açık: "primary", Beklemede: "warning", Çözüldü: "success" } as const;
const PRIORITY_TONE = { Acil: "danger", Yüksek: "warning", Normal: "neutral", Düşük: "neutral" } as const;
const PRIORITY_RANK: Record<Priority, number> = { Acil: 4, Yüksek: 3, Normal: 2, Düşük: 1 };
const CHANNEL_ICON = { "E-Posta": <Mail />, Telefon: <Phone />, "Canlı Sohbet": <Radio />, "Web Formu": <Hash /> } as const;

const TAGS = [...new Set(TICKETS.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, "tr-TR"));
const CUSTOMER_ITEMS: ComboboxItem[] = CUSTOMERS.map((c) => ({ value: c.id, label: c.name }));

/** Ağaçtaki klasör kimliği: "tum", "durum:Açık", "etiket:Kargo", "kanal:Telefon". */
type FolderId = string;

function folderLabel(folder: FolderId) {
  const [kind, value] = folder.split(":");
  if (kind === "durum") return value;
  if (kind === "etiket") return `Etiket: ${value}`;
  if (kind === "kanal") return `Kanal: ${value}`;
  return "Bütün Talepler";
}

function matchesFolder(t: Ticket, folder: FolderId) {
  const [kind, value] = folder.split(":");
  if (kind === "durum") return t.status === value;
  if (kind === "etiket") return t.tags.includes(value);
  if (kind === "kanal") return t.channel === value;
  return true;
}

/** Adresteki `tag`/`status` slug'ını ağaç klasörüne çevirir: `?tag=web-magaza` → "etiket:Web Mağaza". */
function initialFolder(params: Params): FolderId {
  const tag = fromSlug([...new Set(TICKETS.flatMap((t) => t.tags))], params.tag);
  if (tag) return `etiket:${tag}`;
  const status = STATUSES.find((st) => STATUS_SLUG[st] === params.status);
  return status ? `durum:${status}` : "tum";
}

/** Ağacın düz hali: ağacın gizlendiği genişlikte araç çubuğundaki seçici. */
const FOLDER_ITEMS: SelectItem[] = [
  { value: "tum", label: "Bütün Talepler" },
  ...STATUSES.map((st) => ({ value: `durum:${st}`, label: st })),
  ...TAGS.map((tag) => ({ value: `etiket:${tag}`, label: `Etiket: ${tag}` })),
  ...TICKET_CHANNELS.map((ch) => ({ value: `kanal:${ch}`, label: `Kanal: ${ch}` })),
];

/** "Geldi" filtresinin hazır aralıkları; örnek verinin bugünü `TODAY` (2 Kasım). */
const WHEN: readonly RangePreset[] = [
  { id: "bugun", label: "Bugün", days: 1 },
  { id: "3", label: "Son 3 Gün", days: 3 },
  { id: "7", label: "Son 7 Gün", days: 7 },
  { id: "tum", label: "Tümü", days: null },
];
const ALL_TIME: DateRangeValue = { kind: "preset", id: "tum" };

/** Telefondaki filtre çekmecesinin sıralama seçenekleri → adresteki `sort`/`dir`. */
const SORTS = [
  { value: "yeni", label: "En Yeni", sort: "tarih", dir: "desc" },
  { value: "eski", label: "En Eski", sort: "tarih", dir: "asc" },
  { value: "oncelik", label: "Önceliğe Göre", sort: "oncelik", dir: "desc" },
] as const;

function Count({ n }: { n: number }) {
  return <span className="ml-auto pl-3 text-small text-body tabular-nums">{num.format(n)}</span>;
}

export function GelenPage() {
  const { params, navigate, notify } = useApp();
  const [overrides, setOverrides] = useState<Record<string, Partial<Ticket>>>({});
  const [archived, setArchived] = useState<readonly string[]>([]);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [folder, setFolder] = useState<FolderId>(initialFolder(params));
  const [who, setWho] = useState<ComboboxItem | null>(null);
  const [priorities, setPriorities] = useState<readonly Priority[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"liste" | "musteri">("liste");
  // Kanal sütunu geniş ekranda açık; 1280 px altında kapalı başlar (konu sütunu ~10 harfe iniyordu).
  // "Görünüm" menüsünden her genişlikte açılır.
  const [showChannel, setShowChannel] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 80rem)").matches);
  const [showMessages, setShowMessages] = useState(false);
  const [when, setWhen] = useState<DateRangeValue>(ALL_TIME);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tickets = useMemo(
    () => TICKETS.filter((t) => !archived.includes(t.id)).map((t) => ({ ...t, ...overrides[t.id] }) as Ticket),
    [overrides, archived],
  );

  /** Konu, numara, müşteri ve yetkili adında; Türkçe harfler düzlenir ("cinar" → Çınar). */
  const matchesQuery = (t: Ticket) => matchesTr(`${t.id} ${t.subject} ${customer(t.customerId).name} ${customer(t.customerId).contact}`, query, { fold: true });
  const span = rangeOf(when, WHEN, TODAY);
  const inSpan = (t: Ticket) => !span || (t.date >= span.start && t.date <= span.end);
  const rows = tickets.filter(
    (t) =>
      matchesFolder(t, folder) && (!who || t.customerId === who.value) && (!priorities.length || priorities.includes(t.priority)) && inSpan(t) && matchesQuery(t),
  );

  /** Filtre değişince ilk sayfaya dön (adresteki sayfa numarası eskir). */
  const resetPage = () => {
    if (params.page || params.tag || params.status) navigate("inbox", { sort: params.sort, dir: params.dir });
  };
  const clearAll = () => {
    setFolder("tum");
    setWho(null);
    setPriorities([]);
    setWhen(ALL_TIME);
    setText("");
    setQuery("");
    resetPage();
  };

  const setStatus = (t: Ticket, status: TicketStatus) => {
    setOverrides((o) => ({ ...o, [t.id]: { ...o[t.id], status, resolved: status === "Çözüldü" } }));
    notify({ tone: "success", title: `${t.id} → ${status}`, body: t.subject });
  };
  const assignToMe = (t: Ticket) => {
    setOverrides((o) => ({ ...o, [t.id]: { ...o[t.id], assignee: ME.id } }));
    notify({ tone: "info", title: `${t.id} Sana Atandı`, body: t.subject });
  };
  const archive = (t: Ticket) => {
    setArchived((a) => [...a, t.id]);
    notify({
      tone: "info",
      title: `${t.id} Arşivlendi`,
      body: "Arşivdeki talepler raporlarda sayılmaya devam eder.",
      undo: () => setArchived((a) => a.filter((id) => id !== t.id)),
    });
    if (params.ticket === t.id) navigate("inbox", { ...params, ticket: undefined });
  };
  const open = (t: Ticket) => navigate("inbox", { ...params, ticket: t.id });
  const [closing, setClosing] = useState(false);

  /* Toplu işlemler: seçim çubuğundan. Tek bildirim, tek geri alma. */
  const bulkAssign = () => {
    setOverrides((o) => Object.fromEntries([...Object.entries(o), ...picked.map((id) => [id, { ...o[id], assignee: ME.id }])]));
    notify({ tone: "info", title: `${picked.length} Talep Sana Atandı` });
    setPicked([]);
  };
  const bulkResolve = () => {
    setOverrides((o) => Object.fromEntries([...Object.entries(o), ...picked.map((id) => [id, { ...o[id], status: "Çözüldü" as TicketStatus, resolved: true }])]));
    notify({ tone: "success", title: `${picked.length} Talep Çözüldü` });
    setPicked([]);
  };
  const bulkArchive = () => {
    const ids = picked;
    setArchived((a) => [...a, ...ids]);
    notify({ tone: "info", title: `${ids.length} Talep Arşivlendi`, body: "Arşivdeki talepler raporlarda sayılmaya devam eder.", undo: () => setArchived((a) => a.filter((id) => !ids.includes(id))) });
    setPicked([]);
  };

  const columns: Column<Ticket>[] = [
    {
      key: "talep",
      header: "Talep",
      width: "19rem",
      render: (t) => (
        <ContextMenu>
          <ContextMenuTrigger className="-my-1 rounded-md py-1 outline-none">
            <button
              type="button"
              onClick={() => open(t)}
              className="grid grid-cols-1 w-full cursor-pointer gap-0.5 rounded-md text-start outline-offset-2"
            >
              <span className="truncate font-medium text-strong">{t.subject}</span>
              <span className="truncate text-small text-muted">
                <span className="font-mono text-micro tracking-tight">{t.id}</span> · {customer(t.customerId).name}
              </span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent aria-label={`${t.id} eylemleri`}>
            <ContextMenuItem icon={<Eye />} shortcut={["↵"]} onClick={() => open(t)}>
              Aç
            </ContextMenuItem>
            <ContextMenuItem icon={<UserRoundCheck />} onClick={() => assignToMe(t)}>
              Bana Ata
            </ContextMenuItem>
            <ContextMenuSub label="Durumu Değiştir" icon={<CheckCheck />}>
              {STATUSES.map((st) => (
                <ContextMenuItem key={st} onClick={() => setStatus(t, st)} disabled={t.status === st}>
                  {st}
                </ContextMenuItem>
              ))}
            </ContextMenuSub>
            <ContextMenuItem
              icon={<Link2 />}
              shortcut={["⌘", "L"]}
              onClick={() => {
                navigator.clipboard?.writeText(t.id).catch(() => undefined);
                notify({ tone: "info", title: `${t.id} Panoya Kopyalandı` });
              }}
            >
              Numarayı Kopyala
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem tone="danger" icon={<Archive />} onClick={() => archive(t)}>
                Arşivle
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ),
    },
    { key: "durum", header: "Durum", render: (t) => <Badge tone={STATUS_TONE[t.status]} dot>{t.status}</Badge> },
    {
      key: "oncelik",
      header: "Öncelik",
      sortable: true,
      sortValue: (t) => PRIORITY_RANK[t.priority],
      render: (t) => (
        <Badge tone={PRIORITY_TONE[t.priority]} variant={t.priority === "Düşük" ? "outline" : "soft"}>
          {t.priority}
        </Badge>
      ),
    },
    ...(showChannel
      ? [
          {
            key: "kanal",
            header: "Kanal",
            render: (t: Ticket) => (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-body [&_svg]:size-4 [&_svg]:text-muted">
                <span aria-hidden>{CHANNEL_ICON[t.channel]}</span>
                {t.channel}
              </span>
            ),
          } satisfies Column<Ticket>,
        ]
      : []),
    {
      key: "atanan",
      header: "Atanan",
      sortable: true,
      sortValue: (t) => member(t.assignee).name,
      render: (t) => {
        const m = member(t.assignee);
        return (
          <span className="inline-flex items-center gap-2">
            <Avatar name={m.name} size="sm" />
            <HoverCard href={href("reports", { tab: "support" })} trigger={m.name.split(" ")[0]} side="bottom" align="start">
              <ProfilePreview
                name={m.name}
                role={m.role}
                handle={m.email}
                stats={[
                  { label: "Açık Talep", value: tickets.filter((x) => x.assignee === m.id && x.status !== "Çözüldü").length },
                  { label: "Son 8 Günde Çözülen", value: tickets.filter((x) => x.assignee === m.id && x.status === "Çözüldü").length },
                ]}
                meta="Ekip yükü Raporlar › Destek sekmesinde"
              />
            </HoverCard>
          </span>
        );
      },
    },
    ...(showMessages
      ? [{ key: "mesaj", header: "Mesaj", numeric: true, render: (t: Ticket) => num.format(t.messages) } satisfies Column<Ticket>]
      : []),
    {
      key: "tarih",
      header: "Geldi",
      numeric: true,
      sortable: true,
      sortValue: (t) => t.date.getTime(),
      render: (t) => <time dateTime={t.date.toISOString()}>{dateTime(t.date)}</time>,
    },
  ];

  const sort = parseSort(params, ["oncelik", "atanan", "tarih"], { key: "tarih", dir: "desc" });
  const sorted = sortRows(rows, columns, sort);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, Number(params.page) || 1));
  const visible = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageIds = visible.map((t) => t.id);
  const pickedOnPage = pageIds.filter((id) => picked.includes(id)).length;
  const tableColumns: Column<Ticket>[] = [
    {
      key: "sec",
      width: "3rem",
      header: (
        <Checkbox
          aria-label="Bu sayfadaki talepleri seç"
          checked={pickedOnPage > 0 && pickedOnPage === pageIds.length}
          ref={(el) => {
            if (el) el.indeterminate = pickedOnPage > 0 && pickedOnPage < pageIds.length;
          }}
          onChange={(event) =>
            setPicked((p) => (event.target.checked ? [...new Set([...p, ...pageIds])] : p.filter((id) => !pageIds.includes(id))))
          }
        />
      ),
      render: (t) => (
        <Checkbox
          aria-label={`${t.id} talebini seç`}
          checked={picked.includes(t.id)}
          onChange={(event) => setPicked((p) => (event.target.checked ? [...p, t.id] : p.filter((id) => id !== t.id)))}
        />
      ),
    },
    ...columns,
  ];
  const current = params.ticket ? tickets.find((t) => t.id === params.ticket) : undefined;
  const openCount = tickets.filter((t) => t.status === "Açık").length;
  const waitCount = tickets.filter((t) => t.status === "Beklemede").length;

  const tree: TreeNode[] = [
    {
      id: "tum",
      label: (
        <span className="flex w-full items-center">
          Bütün Talepler <Count n={tickets.length} />
        </span>
      ),
      textValue: "Bütün Talepler",
      icon: <Inbox />,
      children: STATUSES.map((st) => ({
        id: `durum:${st}`,
        textValue: st,
        label: (
          <span className="flex w-full items-center">
            {st} <Count n={tickets.filter((t) => t.status === st).length} />
          </span>
        ),
      })),
    },
    {
      id: "etiketler",
      label: "Etiketler",
      icon: folder.startsWith("etiket:") ? <FolderOpen /> : <Folder />,
      children: TAGS.map((tag) => ({
        id: `etiket:${tag}`,
        textValue: tag,
        icon: <Tag />,
        label: (
          <span className="flex w-full items-center">
            {tag} <Count n={tickets.filter((t) => t.tags.includes(tag)).length} />
          </span>
        ),
      })),
    },
    {
      id: "kanallar",
      label: "Kanallar",
      icon: <Folder />,
      children: TICKET_CHANNELS.map((ch) => ({
        id: `kanal:${ch}`,
        textValue: ch,
        icon: CHANNEL_ICON[ch],
        label: (
          <span className="flex w-full items-center">
            {ch} <Count n={tickets.filter((t) => t.channel === ch).length} />
          </span>
        ),
      })),
    },
  ];

  // Telefondaki filtre çekmecesi: masaüstü araç çubuğuyla AYNI durumu değiştirir, sayı gerçek.
  const sortNow = SORTS.find((o) => o.sort === (params.sort ?? "tarih") && o.dir === (params.dir ?? "desc"))?.value ?? "yeni";
  const filterGroups: readonly FilterGroup[] = [
    { id: "sira", label: "Sıralama", options: SORTS.map((o) => ({ value: o.value, label: o.label })) },
    {
      id: "durum",
      label: "Durum",
      options: [
        { value: "tum", label: "Tümü", count: tickets.length },
        ...STATUSES.map((st) => ({ value: st, label: st, count: tickets.filter((t) => t.status === st).length })),
      ],
    },
    { id: "oncelik", label: "Öncelik", multiple: true, options: PRIORITIES.map((p) => ({ value: p, label: p, count: tickets.filter((t) => t.priority === p).length })) },
    { id: "tarih", label: "Geldi", options: WHEN.map((w) => ({ value: w.id, label: w.label })) },
  ];
  const filterValue: FilterValue = {
    sira: [sortNow],
    durum: [folder.startsWith("durum:") ? folder.slice(6) : "tum"],
    oncelik: priorities,
    tarih: when.kind === "preset" ? [when.id] : [],
  };
  const activeFilters = (folder !== "tum" ? 1 : 0) + priorities.length + (when.kind === "preset" && when.id === "tum" ? 0 : 1) + (who ? 1 : 0);
  const applyFilters = (next: FilterValue) => {
    const st = next.durum?.[0] ?? "tum";
    if ((filterValue.durum[0] ?? "tum") !== st) setFolder(st === "tum" ? "tum" : `durum:${st}`);
    setPriorities((next.oncelik ?? []) as Priority[]);
    const w = next.tarih?.[0];
    if (w && w !== filterValue.tarih[0]) setWhen({ kind: "preset", id: w });
    const o = SORTS.find((x) => x.value === next.sira?.[0]);
    if (o && o.value !== sortNow) navigate("inbox", { sort: o.sort, dir: o.dir });
    else if (params.page) resetPage();
  };

  const byCustomer = CUSTOMERS.map((c) => ({ c, list: rows.filter((t) => t.customerId === c.id) })).filter((g) => g.list.length);

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Gelen Kutusu"
        description={`${num.format(openCount + waitCount)} Talep Yanıt Bekliyor · ${num.format(openCount)} Açık, ${num.format(waitCount)} Beklemede`}
        actions={
          <>
            <Popover>
              <PopoverTrigger render={<Button variant="secondary" size="sm" />}>
                <Share2 aria-hidden />
                Paylaş
              </PopoverTrigger>
              <PopoverContent title="Görünümü Paylaş" description="Bağlantıyı alan ekip arkadaşı aynı filtreleri görür.">
                <div className="flex items-center gap-2 rounded-md bg-surface py-1 pr-1 pl-3 text-small text-body">
                  <span className="min-w-0 flex-1 truncate">lidya.pusula.app/{href("inbox", { sort: params.sort, dir: params.dir })}</span>
                  <CopyButton value={`https://lidya.pusula.app/${href("inbox", { sort: params.sort, dir: params.dir })}`} label="Bağlantıyı Kopyala" />
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
                <Columns3 aria-hidden />
                Görünüm
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Sütunlar</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={showChannel} onCheckedChange={setShowChannel}>
                    Kanal
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showMessages} onCheckedChange={setShowMessages}>
                    Mesaj Sayısı
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  icon={<Download />}
                  shortcut="E"
                  onClick={() => notify({ tone: "success", title: "Talepler Dışa Aktarıldı", body: `${num.format(rows.length)} satır · talepler-kasim.csv` })}
                >
                  CSV Olarak İndir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* Klasör ağacı yalnız geniş ekranda yanda (xl): 1024'te 240 px ağaç tabloyu sıkıştırıp konuyu
          ~10 harfe kısaltıyordu. Daha darda aynı klasörler araç çubuğunda "Klasör" seçicisi. */}
      <div className="grid grid-cols-1 flex-1 gap-4 p-4 sm:p-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Klasörler" className="hidden xl:block">
          <div className="sticky top-4 rounded-xl bg-overlay p-2 shadow-raised ring-1 ring-line">
            <TreeView
              aria-label="Talep Klasörleri"
              nodes={tree}
              defaultExpanded={["tum", "etiketler"]}
              selectedId={folder}
              onSelect={(node) => {
                if (node.id === "etiketler" || node.id === "kanallar") return;
                setFolder(node.id);
                resetPage();
              }}
            />
          </div>
        </aside>

        {/* Ingot turu: filtre çubuğu, tablo ve sayfalama TEK kartta; araç
            çubuğu kartın başı, sayfalama dibi (ince çizgilerle ayrılır). */}
        <div className="grid min-w-0 grid-cols-1 content-start overflow-hidden rounded-xl bg-overlay shadow-raised ring-1 ring-line">
          <div className="grid grid-cols-1 gap-3 border-b border-line-soft p-3 sm:p-4">
            <div className="flex flex-wrap items-end gap-3">
              <SearchField
                label="Talep Ara"
                showLabel
                placeholder="Konu, numara ya da yetkili"
                value={text}
                onValueChange={setText}
                onSearch={(q) => {
                  setQuery(q);
                  resetPage();
                }}
                resultCount={query ? rows.length : undefined}
                shortcut="/"
                className="w-full sm:w-72"
              />
              <Combobox
                label="Müşteri"
                items={CUSTOMER_ITEMS}
                value={who}
                onValueChange={(v) => {
                  setWho(v);
                  resetPage();
                }}
                placeholder="Müşteri ara"
                emptyText="Bu adla müşteri yok."
                className="w-full max-md:hidden sm:w-64"
              />
              <Select
                label="Klasör"
                hideLabel
                items={FOLDER_ITEMS}
                value={folder}
                onValueChange={(v) => {
                  setFolder(v ?? "tum");
                  resetPage();
                }}
                className="w-full max-md:hidden sm:w-52 xl:hidden"
              />
              <DateRangePresets
                label="Geldi"
                presets={WHEN}
                value={when}
                onValueChange={(v) => {
                  setWhen(v);
                  resetPage();
                }}
                today={TODAY}
                className="max-md:hidden"
              />
              <Button variant="secondary" size="sm" className="md:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal aria-hidden />
                Filtreler
                {activeFilters ? (
                  <span className="rounded-full bg-primary px-1.5 text-micro font-semibold text-on-primary tabular-nums">
                    <span className="sr-only">, etkin: </span>
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
              <FilterSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                groups={filterGroups}
                value={filterValue}
                onValueChange={applyFilters}
                resultCount={rows.length}
                resultLabel={(n) => (n ? `${num.format(n)} Talebi Göster` : "Uyan Talep Yok")}
                canClear={activeFilters > 0 || sortNow !== "yeni"}
                onClear={() => {
                  clearAll();
                  if (sortNow !== "yeni") navigate("inbox", {});
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ChipGroup aria-label="Öncelik Filtresi" className="max-md:hidden">
                {PRIORITIES.map((p) => (
                  <FilterChip
                    key={p}
                    selected={priorities.includes(p)}
                    count={tickets.filter((t) => t.priority === p && matchesFolder(t, folder) && (!who || t.customerId === who.value)).length}
                    onClick={() => {
                      setPriorities((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));
                      resetPage();
                    }}
                  >
                    {p}
                  </FilterChip>
                ))}
              </ChipGroup>
                <SegmentedControl
                  aria-label="Gruplama"
                  size="sm"
                  className="ml-auto"
                  value={view}
                  onValueChange={setView}
                  options={[
                    { value: "liste", label: "Liste" },
                    { value: "musteri", label: "Müşteriye Göre" },
                  ]}
                />
            </div>
            {folder !== "tum" || who || query ? (
              <ChipGroup aria-label="Etkin Filtreler">
                {folder !== "tum" ? (
                  <RemovableChip label={`Kaldır: ${folderLabel(folder)}`} onRemove={() => setFolder("tum")}>
                    {folderLabel(folder)}
                  </RemovableChip>
                ) : null}
                {query ? (
                  <RemovableChip
                    label={`Kaldır: “${query}” araması`}
                    onRemove={() => {
                      setText("");
                      setQuery("");
                    }}
                  >
                    “{query}”
                  </RemovableChip>
                ) : null}
                {who ? (
                  <RemovableChip label={`Kaldır: ${who.label}`} leading={<Avatar name={who.label} size="sm" className="-ml-1.5 size-6" />} onRemove={() => setWho(null)}>
                    {who.label}
                  </RemovableChip>
                ) : null}
              </ChipGroup>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <div className="relative isolate overflow-hidden">
              <PatternBackground pattern="dots" fade="center" size={18} intensity={0.45} />
              <EmptyState
                className="bg-transparent"
                icon={<SearchX />}
                titleAs="h2"
                title="Bu Filtrelere Uyan Talep Yok"
                hint={`${folderLabel(folder)}${who ? `, ${who.label}` : ""}${priorities.length ? `, ${priorities.join(" / ")} öncelik` : ""}${query ? `, “${query}” araması` : ""} için kayıt bulunamadı.`}
                action={
                  <Button variant="secondary" size="sm" onClick={clearAll}>
                    Filtreleri Temizle
                  </Button>
                }
              />
            </div>
          ) : view === "liste" ? (
            <div className="grid grid-cols-1">
              <DataTable
                className="px-2 pt-2 max-md:hidden [&_thead_tr]:border-0 [&_thead_tr]:bg-surface [&_thead_th:first-child]:rounded-l-md [&_thead_th:last-child]:rounded-r-md"
                caption="Talepler"
                columns={tableColumns}
                rows={visible}
                rowKey={(t) => t.id}
                sort={sort}
                sortHref={(key, dir) => href("inbox", { sort: key, dir })}
                stickyFirst={false}
                minWidth="46rem"
              />
              {/* Telefonda tablo yerine kart listesi: altı sütun yana kaydırılmaz, bir bakışta okunur. */}
              <RecordList
                className="md:hidden"
                label="Talepler"
                items={visible.map((t) => {
                  const m = member(t.assignee);
                  return {
                    id: t.id,
                    title: t.subject,
                    subtitle: (
                      <>
                        <span className="font-mono text-micro">{t.id}</span> · {customer(t.customerId).name}
                      </>
                    ),
                    value: <time dateTime={t.date.toISOString()} className="text-small font-medium text-body">{dateTime(t.date)}</time>,
                    meta: (
                      <span className="inline-flex items-center gap-1.5 [&_svg]:size-3.5">
                        <span aria-hidden>{CHANNEL_ICON[t.channel]}</span>
                        {t.channel}
                      </span>
                    ),
                    status: (
                      <>
                        <Badge tone={STATUS_TONE[t.status]} dot>{t.status}</Badge>
                        {/* Sabit genişlik: sağa yaslı grupta öncelik değişse de durum rozeti alt alta aynı hizada (hizalama kuralı). */}
                        <Badge tone={PRIORITY_TONE[t.priority]} variant={t.priority === "Düşük" ? "outline" : "soft"} className="min-w-18 justify-center">
                          {t.priority}
                        </Badge>
                      </>
                    ),
                    people: [
                      { role: "Atanan", name: m.name.split(" ")[0], avatar: <Avatar name={m.name} size="sm" /> },
                      { role: "Yetkili", name: customer(t.customerId).contact },
                    ],
                    onSelect: () => open(t),
                  };
                })}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3">
                <p className="text-small text-muted tabular-nums">
                  {num.format(sorted.length)} talepten {num.format((page - 1) * PER_PAGE + 1)}–{num.format(Math.min(page * PER_PAGE, sorted.length))}
                </p>
                {pageCount > 1 ? (
                  <Pagination
                    page={page}
                    pageCount={pageCount}
                    scroll={false}
                    hrefFor={(n) => href("inbox", { sort: params.sort, dir: params.dir, page: n > 1 ? String(n) : undefined })}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <TreeTable
              className="p-2"
              caption="Müşteriye Göre Talepler"
              defaultExpanded={byCustomer.slice(0, 2).map((g) => g.c.id)}
              minWidth="36rem"
              columns={[
                { key: "ad", header: "Müşteri / Talep" },
                { key: "durum", header: "Durum" },
                { key: "adet", header: "Talep", numeric: true },
                { key: "son", header: "Son Talep", numeric: true },
              ]}
              rows={byCustomer.map((g) => ({
                id: g.c.id,
                cells: {
                  ad: (
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={g.c.name} size="sm" />
                      <span className="font-medium text-strong">{g.c.name}</span>
                    </span>
                  ),
                  durum: `${num.format(g.list.filter((t) => t.status !== "Çözüldü").length)} açık`,
                  adet: num.format(g.list.length),
                  son: dateTime(g.list[0].date),
                },
                children: g.list.map((t) => ({
                  id: t.id,
                  cells: {
                    ad: `${t.id} · ${t.subject}`,
                    durum: <Badge tone={STATUS_TONE[t.status]} dot>{t.status}</Badge>,
                    adet: `${num.format(t.messages)} mesaj`,
                    son: dateTime(t.date),
                  },
                })),
              }))}
            />
          )}
        </div>
      </div>

      <SelectionBar count={picked.length} noun="talep" onClear={() => setPicked([])}>
        <SelectionAction icon={<UserRoundCheck />} onClick={bulkAssign}>
          Bana Ata
        </SelectionAction>
        <SelectionAction icon={<CheckCheck />} onClick={bulkResolve}>
          Çözüldü
        </SelectionAction>
        <SelectionAction tone="danger" icon={<Archive />} onClick={bulkArchive}>
          Arşivle
        </SelectionAction>
      </SelectionBar>
      <Sheet
        open={Boolean(current)}
        onOpenChange={(next) => {
          if (!next) navigate("inbox", { ...params, ticket: undefined });
        }}
        side="right"
        size="lg"
        icon={current ? CHANNEL_ICON[current.channel] : undefined}
        status={
          current ? (
            <Badge tone={STATUS_TONE[current.status]} dot>
              <SlotText text={current.status} live />
            </Badge>
          ) : undefined
        }
        title={current?.subject ?? "Talep"}
        description={current ? `${customer(current.customerId).name} · ${current.channel} · ${dateTime(current.date)}` : undefined}
        footerStart={
          current ? (
            <HoldButton onConfirm={() => archive(current)} doneLabel="Arşivlendi" hint="Kazara arşivlenmesin diye basılı tut; bildirimden geri alınır." hideHint>
              Basılı Tutarak Arşivle
            </HoldButton>
          ) : undefined
        }
        footer={
          current ? (
            <>
              <Button variant="secondary" disabled={current.assignee === ME.id} onClick={() => assignToMe(current)}>
                <Icon icon={UserRoundCheck} />
                Bana Ata
              </Button>
              <Button disabled={current.status === "Çözüldü"} aria-haspopup="dialog" onClick={() => setClosing(true)}>
                Talebi Sonuçlandır
              </Button>
            </>
          ) : null
        }
      >
        {current ? (
          <TicketDetail
            key={current.id}
            t={current}
            onAssign={(assignee) => {
              setOverrides((o) => ({ ...o, [current.id]: { ...o[current.id], assignee } }));
              notify({ tone: "info", title: `${current.id}, ${member(assignee).name.split(" ")[0]} Üstlendi`, body: current.subject });
            }}
          />
        ) : null}
      </Sheet>
      {current ? (
        <CloseTicketDialog
          key={current.id}
          t={current}
          open={closing}
          onOpenChange={setClosing}
          mine={current.assignee === ME.id}
          onConfirm={(outcome) => {
            if (outcome === "cozuldu") {
              setStatus(current, "Çözüldü");
              navigate("inbox", { ...params, ticket: undefined });
            } else if (outcome === "beklemede") {
              setStatus(current, "Beklemede");
            } else {
              assignToMe(current);
            }
          }}
        />
      ) : null}
    </div>
  );
}

/** Ekibin bu talebe tepkisi: acil olanı "Bakıyorum", çözüleni "Tamam" ile işaretlemiş. Örnek. */
function teamReactions(t: Ticket): Reaction[] {
  if (t.status === "Çözüldü") return [{ kind: "tamam", count: 2 }, { kind: "kalp", count: 1 }];
  if (t.priority === "Acil") return [{ kind: "goz", count: 2, mine: t.assignee === ME.id }];
  return t.watchers.length ? [{ kind: "begen", count: t.watchers.length }] : [];
}

const PEOPLE: readonly Person[] = TEAM.map((m) => ({ id: m.id, name: m.name, detail: m.role }));

/** Yan panelin bölüm etiketi: büyük harf, geniş aralık, soluk (Auton referansı). */
function PanelLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2 text-micro font-semibold tracking-widest text-muted uppercase">
      {children}
    </h3>
  );
}

/** İnce çizgili bilgi satırı: solda ad, sağda değer. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2">
      <dt className="shrink-0 text-base text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 text-base text-strong">{children}</dd>
    </div>
  );
}

/** Ölçü karosu: üç karo yan yana, gömük zemin; `bar` verilirse altında ilerleme çizgisi. */
function Metric({ label, value, note, bar }: { label: string; value: ReactNode; note?: ReactNode; bar?: { pct: number; tone: "success" | "danger" } }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface p-3 ring-1 ring-inset ring-line-soft">
      <p className="truncate text-small text-muted">{label}</p>
      <p className="mt-1 truncate text-title font-semibold tracking-tight text-strong tabular-nums">{value}</p>
      {bar ? (
        <span aria-hidden className="mt-2 block h-1 rounded-full bg-chart-track">
          <span className={cn("block h-full rounded-full", bar.tone === "success" ? "bg-success" : "bg-danger")} style={{ width: `${Math.max(6, Math.min(100, bar.pct))}%` }} />
        </span>
      ) : null}
      {note ? <p className="mt-1.5 truncate text-small text-muted">{note}</p> : null}
    </div>
  );
}

/** İlk yanıt hedefi (dakika): panodaki "30 Dakikada Yanıt" ile aynı. */
const REPLY_TARGET_MIN = 30;

function TicketDetail({ t, onAssign }: { t: Ticket; onAssign: (id: string) => void }) {
  const c = customer(t.customerId);
  const [watchers, setWatchers] = useState<string[]>([...t.watchers]);
  const [tab, setTab] = useState("genel");
  const o = t.orderId ? order(t.orderId) : undefined;
  const events = ticketEvents(t);
  const first = t.firstResponseMin;

  const genel = (
    <div className="grid grid-cols-1 gap-6 pt-4">
      <div className="grid grid-cols-3 gap-2">
        <Metric
          label="İlk Yanıt"
          value={first === null ? "—" : `${first} dk`}
          note={first === null ? "Henüz yanıtlanmadı" : first <= REPLY_TARGET_MIN ? "Hedef içinde" : "Hedefi aştı"}
          bar={first === null ? undefined : { pct: (first / REPLY_TARGET_MIN) * 100, tone: first <= REPLY_TARGET_MIN ? "success" : "danger" }}
        />
        <Metric label="Mesaj" value={num.format(t.messages)} note="Yazışmada" />
        <Metric label="Geldi" value={clock.format(t.date)} note={shortDate.format(t.date)} />
      </div>

      <figure className="rounded-xl p-4 ring-1 ring-line">
        <figcaption className="flex items-center gap-2.5">
          <Avatar name={c.contact} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-base font-medium text-strong">{c.contact}</span>
            <span className="block truncate text-small text-muted">
              {c.name} · {c.city}
            </span>
          </span>
        </figcaption>
        <blockquote className="mt-3 text-base text-body">{t.preview}</blockquote>
        <Reactions label="Ekip tepkileri" defaultValue={teamReactions(t)} className="mt-3" />
      </figure>

      <TicketPriorityFactors t={t} />

      <section aria-labelledby="talep-bilgi">
        <PanelLabel id="talep-bilgi">Talep Bilgileri</PanelLabel>
        <dl className="divide-y divide-line-soft rounded-xl ring-1 ring-line">
          <InfoRow label="Numara">
            <span className="font-mono text-small">{t.id}</span>
            <CopyButton value={t.id} label="Talep Numarasını Kopyala" />
          </InfoRow>
          <InfoRow label="Öncelik">
            <Badge tone={PRIORITY_TONE[t.priority]} variant={t.priority === "Düşük" ? "outline" : "soft"}>
              {t.priority}
            </Badge>
          </InfoRow>
          <InfoRow label="Atanan">
            <span className="truncate">{member(t.assignee).name}</span>
            <AssigneePicker label="Atanan" multiple={false} people={PEOPLE} value={[t.assignee]} onValueChange={([id]) => id && id !== t.assignee && onAssign(id)} />
          </InfoRow>
          <InfoRow label="İzleyenler">
            <AssigneePicker label="İzleyenler" people={PEOPLE} value={watchers} onValueChange={setWatchers} />
          </InfoRow>
          <InfoRow label="Etiketler">
            {t.tags.map((tag) => (
              <Badge key={tag} shape="rounded">
                {tag}
              </Badge>
            ))}
          </InfoRow>
          {o ? (
            <InfoRow label="Bağlı Sipariş">
              <span className="font-mono text-small">{o.id}</span>
              <span className="text-muted tabular-nums">{tl.format(o.total)}</span>
              <Badge tone={o.status === "Gecikti" ? "danger" : o.status === "Teslim Edildi" ? "success" : "warning"}>{o.status}</Badge>
            </InfoRow>
          ) : null}
          {t.status === "Çözüldü" ? (
            <InfoRow label="Kapanış Anketi">
              {/* Anket yalnız önceden kapanmış talepte var; şimdi kapatılanınki henüz gelmedi. */}
              {ticket(t.id)?.status === "Çözüldü" ? <Rating value={starsOf(t)} size="sm" showValue /> : <span className="text-muted">Yanıt Bekleniyor</span>}
            </InfoRow>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="talep-bildirim">
        <PanelLabel id="talep-bildirim">Bu Talep İçin Bildirimler</PanelLabel>
        <div className="divide-y divide-line-soft">
          <Switch label="Müşteri yanıtlayınca haber ver" hint="Uygulama içi zil ve e-posta" defaultChecked />
          <Switch
            label="Sipariş durumu değişince haber ver"
            hint={o ? `${o.id} kargo takibinden` : "Bu talebe bağlı sipariş yok"}
            defaultChecked={Boolean(o)}
            disabled={!o}
          />
          <Switch label="Yanıt süresi dolmadan uyar" hint={`İlk yanıt hedefi ${REPLY_TARGET_MIN} dakika; 10 dakika kala`} defaultChecked={first === null} />
        </div>
      </section>
    </div>
  );

  const akis = (
    <section aria-labelledby="talep-akis" className="grid grid-cols-1 gap-3 pt-4">
      <PanelLabel id="talep-akis">Olay Akışı</PanelLabel>
      <Timeline
        events={events.map((e) => ({
          id: e.id,
          at: e.at.toISOString(),
          when: dateTime(e.at),
          title: e.title,
          description: e.description,
          tone: e.tone,
        }))}
      />
    </section>
  );

  return (
    <Tabs
      aria-label="Talep Ayrıntısı"
      value={tab}
      onValueChange={setTab}
      className="[&>[role=tablist]]:w-full"
      items={[
        { value: "genel", label: "Genel", panel: genel },
        {
          value: "akis",
          label: (
            <span className="inline-flex items-center gap-1.5">
              Olay Akışı
              <span className="rounded-full bg-surface-raised px-1.5 text-micro font-semibold text-body tabular-nums">{events.length}</span>
            </span>
          ),
          panel: akis,
        },
      ]}
    />
  );
}
