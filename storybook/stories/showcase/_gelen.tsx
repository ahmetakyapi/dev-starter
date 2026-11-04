"use client";

import { useMemo, useState } from "react";
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
  Tag,
  UserRoundCheck,
} from "lucide-react";
import { AssigneePicker, type Person } from "@/components/ui/assignee-picker";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { HoldButton } from "@/components/ui/hold-button";
import { HoverCard, ProfilePreview } from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Pagination } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Rating } from "@/components/ui/rating";
import { Reactions, type Reaction } from "@/components/ui/reactions";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Timeline } from "@/components/ui/timeline";
import { Tooltip } from "@/components/ui/tooltip";
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
  TICKETS,
  TICKET_CHANNELS,
  customer,
  dateTime,
  member,
  num,
  order,
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
type Folder = string;

function folderLabel(folder: Folder) {
  const [kind, value] = folder.split(":");
  if (kind === "durum") return value;
  if (kind === "etiket") return `Etiket: ${value}`;
  if (kind === "kanal") return `Kanal: ${value}`;
  return "Bütün Talepler";
}

function matchesFolder(t: Ticket, folder: Folder) {
  const [kind, value] = folder.split(":");
  if (kind === "durum") return t.status === value;
  if (kind === "etiket") return t.tags.includes(value);
  if (kind === "kanal") return t.channel === value;
  return true;
}

/** Adresteki `tag`/`status` slug'ını ağaç klasörüne çevirir: `?tag=web-magaza` → "etiket:Web Mağaza". */
function initialFolder(params: Params): Folder {
  const tag = fromSlug([...new Set(TICKETS.flatMap((t) => t.tags))], params.tag);
  if (tag) return `etiket:${tag}`;
  const status = STATUSES.find((st) => STATUS_SLUG[st] === params.status);
  return status ? `durum:${status}` : "tum";
}

function Count({ n }: { n: number }) {
  return <span className="ml-auto pl-3 text-small text-body tabular-nums">{num.format(n)}</span>;
}

export function GelenPage() {
  const { params, navigate, notify } = useApp();
  const [overrides, setOverrides] = useState<Record<string, Partial<Ticket>>>({});
  const [archived, setArchived] = useState<readonly string[]>([]);
  const [folder, setFolder] = useState<Folder>(initialFolder(params));
  const [who, setWho] = useState<ComboboxItem | null>(null);
  const [priorities, setPriorities] = useState<readonly Priority[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"liste" | "musteri">("liste");
  const [showChannel, setShowChannel] = useState(true);
  const [showMessages, setShowMessages] = useState(false);

  const tickets = useMemo(
    () => TICKETS.filter((t) => !archived.includes(t.id)).map((t) => ({ ...t, ...overrides[t.id] }) as Ticket),
    [overrides, archived],
  );

  /** Konu, numara, müşteri ve yetkili adında; Türkçe harfler düzlenir ("cinar" → Çınar). */
  const matchesQuery = (t: Ticket) => matchesTr(`${t.id} ${t.subject} ${customer(t.customerId).name} ${customer(t.customerId).contact}`, query, { fold: true });
  const rows = tickets.filter(
    (t) => matchesFolder(t, folder) && (!who || t.customerId === who.value) && (!priorities.length || priorities.includes(t.priority)) && matchesQuery(t),
  );

  /** Süzgeç değişince ilk sayfaya dön (adresteki sayfa numarası eskir). */
  const resetPage = () => {
    if (params.page || params.tag || params.status) navigate("inbox", { sort: params.sort, dir: params.dir });
  };
  const clearAll = () => {
    setFolder("tum");
    setWho(null);
    setPriorities([]);
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
                {t.id} · {customer(t.customerId).name}
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
              <PopoverContent title="Görünümü Paylaş" description="Bağlantıyı alan ekip arkadaşı aynı süzgeçleri görür.">
                <div className="flex items-center gap-2 rounded-md bg-surface py-1 pr-1 pl-3 text-small text-body">
                  <span className="min-w-0 flex-1 truncate">pusula.app/kervan{href("inbox", { sort: params.sort, dir: params.dir })}</span>
                  <CopyButton value={`https://pusula.app/kervan${href("inbox", { sort: params.sort, dir: params.dir })}`} label="Bağlantıyı Kopyala" />
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

      <div className="grid grid-cols-1 flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Klasörler" className="hidden lg:block">
          <div className="sticky top-4 rounded-xl bg-surface p-2">
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

        <div className="grid grid-cols-1 min-w-0 content-start gap-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface p-3 sm:p-4">
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
                className="w-full sm:w-64"
              />
              <SegmentedControl
                aria-label="Gruplama"
                size="sm"
                className="sm:ml-auto"
                value={view}
                onValueChange={setView}
                options={[
                  { value: "liste", label: "Liste" },
                  { value: "musteri", label: "Müşteriye Göre" },
                ]}
              />
            </div>
            <ChipGroup aria-label="Öncelik Süzgeci">
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
            {folder !== "tum" || who || query ? (
              <ChipGroup aria-label="Etkin Süzgeçler">
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
            <EmptyState
              icon={<SearchX />}
              titleAs="h2"
              title="Bu Süzgeçlere Uyan Talep Yok"
              hint={`${folderLabel(folder)}${who ? `, ${who.label}` : ""}${priorities.length ? `, ${priorities.join(" / ")} öncelik` : ""}${query ? `, “${query}” araması` : ""} için kayıt bulunamadı.`}
              action={
                <Button variant="secondary" size="sm" onClick={clearAll}>
                  Süzgeçleri Temizle
                </Button>
              }
            />
          ) : view === "liste" ? (
            <div className="grid grid-cols-1 gap-3">
              <DataTable
                caption="Talepler"
                columns={columns}
                rows={visible}
                rowKey={(t) => t.id}
                sort={sort}
                sortHref={(key, dir) => href("inbox", { sort: key, dir })}
                stickyFirst={false}
                minWidth="46rem"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
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

      <Sheet
        open={Boolean(current)}
        onOpenChange={(next) => {
          if (!next) navigate("inbox", { ...params, ticket: undefined });
        }}
        side="right"
        title={current?.subject ?? "Talep"}
        description={current ? `${current.id} · ${customer(current.customerId).name}` : undefined}
        footer={
          current ? (
            <>
              <Tooltip label="Bana Ata">
                <IconButton icon={UserRoundCheck} aria-label="Bana Ata" variant="secondary" showTitle={false} className="shrink-0" onClick={() => assignToMe(current)} />
              </Tooltip>
              <Button
                className="flex-1"
                disabled={current.status === "Çözüldü"}
                onClick={() => {
                  setStatus(current, "Çözüldü");
                  navigate("inbox", { ...params, ticket: undefined });
                }}
              >
                Çözüldü Olarak Kapat
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
              notify({ tone: "info", title: `${current.id} ${member(assignee).name.split(" ")[0]} Kişisine Atandı`, body: current.subject });
            }}
            onArchive={() => archive(current)}
          />
        ) : null}
      </Sheet>
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

function TicketDetail({ t, onAssign, onArchive }: { t: Ticket; onAssign: (id: string) => void; onArchive: () => void }) {
  const c = customer(t.customerId);
  const [watchers, setWatchers] = useState<string[]>([...t.watchers]);
  const o = t.orderId ? order(t.orderId) : undefined;
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[t.status]} dot>
          {t.status}
        </Badge>
        <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
        {t.tags.map((tag) => (
          <Badge key={tag} shape="rounded">
            {tag}
          </Badge>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-small text-muted">
          {t.id}
          <CopyButton value={t.id} label="Talep Numarasını Kopyala" />
        </span>
      </div>

      <figure className="rounded-xl bg-surface p-4">
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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-base">
        <div>
          <dt className="text-small text-muted">Kanal</dt>
          <dd className="mt-0.5 inline-flex items-center gap-1.5 text-strong [&_svg]:size-4 [&_svg]:text-muted">
            <span aria-hidden>{CHANNEL_ICON[t.channel]}</span>
            {t.channel}
          </dd>
        </div>
        <div>
          <dt className="text-small text-muted">Atanan</dt>
          <dd className="-ml-1 flex items-center gap-1">
            <AssigneePicker label="Atanan" multiple={false} people={PEOPLE} value={[t.assignee]} onValueChange={([id]) => id && id !== t.assignee && onAssign(id)} />
            <span className="truncate text-strong">{member(t.assignee).name}</span>
          </dd>
        </div>
        <div>
          <dt className="text-small text-muted">İlk Yanıt</dt>
          <dd className="mt-0.5 text-strong">{t.firstResponseMin === null ? "Henüz yok" : `${t.firstResponseMin} dakika`}</dd>
        </div>
        {t.status === "Çözüldü" ? (
          <div>
            <dt className="text-small text-muted">Kapanış Anketi</dt>
            <dd className="mt-1">
              {/* Anket yalnız önceden kapanmış talepte var; şimdi kapatılanınki henüz gelmedi. */}
              {ticket(t.id)?.status === "Çözüldü" ? <Rating value={starsOf(t)} size="sm" showValue /> : <span className="text-muted">Yanıt Bekleniyor</span>}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-small text-muted">İzleyenler</dt>
          <dd className="-ml-1">
            <AssigneePicker label="İzleyenler" people={PEOPLE} value={watchers} onValueChange={setWatchers} />
          </dd>
        </div>
        {o ? (
          <div className="col-span-2 rounded-lg bg-surface px-3 py-2.5">
            <dt className="text-small text-muted">Bağlı Sipariş</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-strong">{o.id}</span>
              <span className="text-body">{tl.format(o.total)}</span>
              <span className="text-small text-muted">{o.items}</span>
              <Badge tone={o.status === "Gecikti" ? "danger" : o.status === "Teslim Edildi" ? "success" : "warning"} className="ml-auto">
                {o.status}
              </Badge>
            </dd>
          </div>
        ) : null}
      </dl>

      <section aria-labelledby="talep-akis" className="grid grid-cols-1 gap-3">
        <h3 id="talep-akis" className="flex items-center gap-1.5 text-small font-semibold text-muted">
          <Icon icon={CheckCheck} />
          Olay Akışı
        </h3>
        <Timeline
          events={ticketEvents(t).map((e) => ({
            id: e.id,
            at: e.at.toISOString(),
            when: dateTime(e.at),
            title: e.title,
            description: e.description,
            tone: e.tone,
          }))}
        />
      </section>

      <div className="grid justify-items-start gap-1 border-t border-line-soft pt-4">
        <HoldButton onConfirm={onArchive} doneLabel="Arşivlendi" hint="Kazara arşivlenmesin diye basılı tut; bildirimden geri alınır.">
          Basılı Tutarak Arşivle
        </HoldButton>
      </div>
    </div>
  );
}
