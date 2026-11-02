import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Archive, ArrowLeft, Bot, CircleCheck, Clock, CreditCard, Sparkles, UserPlus } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AppShell } from "@/components/ui/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/icon-button";
import { NotificationCenter, type NotificationItem } from "@/components/ui/notification-center";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Screen } from "../../_lib/Frame";
import { BRAND, ContentBar, NAV, ROUTES, ShellCommands, SignOutButton, USER } from "../_shared";

/* --- Veri ---------------------------------------------------------------- */

type Priority = "yuksek" | "orta" | "dusuk";
type Ticket = {
  id: string;
  from: string;
  email: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  topic: string;
  priority: Priority;
  unread: boolean;
  mine: boolean;
  suggestion?: string;
};

const TICKETS: readonly Ticket[] = [
  {
    id: "T-4821",
    from: "Burak Şahin",
    email: "burak.sahin@ornekmail.com",
    subject: "Siparişim 6 gündür aynı şubede bekliyor",
    preview: "Kargo takipte 'aktarma merkezinde' yazıyor ama hiç ilerlemiyor…",
    body: [
      "Merhaba, 27 Ekim'de verdiğim sipariş 6 gündür Ankara aktarma merkezinde görünüyor. Kargo firmasını aradım, sizinle görüşmemi söylediler.",
      "Hediye olarak alınmıştı, cumartesiye yetişmesi gerekiyor. İptal edip yeniden sipariş vermem mi daha hızlı olur?",
    ],
    time: "14:12",
    topic: "Kargo",
    priority: "yuksek",
    unread: true,
    mine: true,
    suggestion:
      "Merhaba Burak Bey, bekleme için özür dileriz. Siparişiniz aktarma merkezindeki yoğunluk nedeniyle gecikti; kargo firmasına öncelikli çıkış talebi açtık. Cuma akşamına kadar teslim edilmezse ücretsiz yeniden gönderim yapacağız.",
  },
  {
    id: "T-4818",
    from: "Ayşe Demir",
    email: "ayse.demir@ornekmail.com",
    subject: "İadem onaylandı ama hesabıma geçmedi",
    preview: "İade onayı 9 gün önce geldi, bankam henüz bir şey görünmüyor diyor.",
    body: [
      "İade talebim 24 Ekim'de onaylandı ama tutar hâlâ kartıma yansımadı. Bankam kendilerine bir işlem gelmediğini söylüyor.",
      "İşlemin referans numarasını paylaşabilir misiniz?",
    ],
    time: "13:40",
    topic: "İade",
    priority: "yuksek",
    unread: true,
    mine: false,
    suggestion:
      "Merhaba Ayşe Hanım, iadeniz 24 Ekim'de bankanıza iletildi; referans numarası RF-209384. Bankalar bu tutarı genellikle 3–10 iş gününde yansıtıyor; bu numarayla bankanıza sorabilirsiniz.",
  },
  {
    id: "T-4815",
    from: "Can Öztürk",
    email: "can.ozturk@ornekmail.com",
    subject: "Şifre sıfırlama e-postası gelmiyor",
    preview: "Üç kez denedim, istenmeyen kutusunda da yok.",
    body: ["Şifremi sıfırlamak istiyorum ama e-posta hiç gelmiyor. İstenmeyen kutusuna da baktım."],
    time: "11:05",
    topic: "Hesap",
    priority: "orta",
    unread: false,
    mine: true,
  },
  {
    id: "T-4809",
    from: "Selin Arslan",
    email: "selin.arslan@ornekmail.com",
    subject: "Fatura adresimi değiştirmek istiyorum",
    preview: "Şirket unvanımız değişti, yeni faturalar yeni unvanla kesilebilir mi?",
    body: ["Şirket unvanımız değişti. Kasım ayından itibaren faturaların yeni unvanla kesilmesini rica ediyorum."],
    time: "Dün",
    topic: "Fatura",
    priority: "dusuk",
    unread: false,
    mine: false,
  },
  {
    id: "T-4802",
    from: "Emre Koç",
    email: "emre.koc@ornekmail.com",
    subject: "Ürün kutusu hasarlı geldi",
    preview: "Kutunun bir köşesi ezik, ürünün kendisi sağlam görünüyor ama…",
    body: ["Kutu hasarlı geldi; ürün sağlam görünüyor ama hediye olduğu için değişim istiyorum."],
    time: "Dün",
    topic: "Kargo",
    priority: "orta",
    unread: true,
    mine: true,
  },
  {
    id: "T-4797",
    from: "Deniz Aydın",
    email: "deniz.aydin@ornekmail.com",
    subject: "Toplu sipariş için fiyat teklifi",
    preview: "Ofisimiz için 40 adet sipariş vermek istiyoruz, kurumsal fiyat var mı?",
    body: ["Ofisimiz için 40 adet sipariş vermeyi düşünüyoruz. Kurumsal fiyatınız ve teslim süreniz nedir?"],
    time: "31 Eki",
    topic: "Satış",
    priority: "dusuk",
    unread: false,
    mine: false,
  },
];

const PRIORITY: Record<Priority, { label: string; tone: "danger" | "warning" | "neutral" }> = {
  yuksek: { label: "Yüksek", tone: "danger" },
  orta: { label: "Orta", tone: "warning" },
  dusuk: { label: "Düşük", tone: "neutral" },
};

const now = Date.now();
const MIN = 60_000;
const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "Mert Aksoy talebi sana atadı", body: "T-4821 · Siparişim 6 gündür aynı şubede bekliyor", at: new Date(now - 8 * MIN), read: false, actor: "Mert Aksoy" },
  { id: "n2", title: "Planlama Ajanı özeti bitirdi", body: "Destek talepleri özeti paylaşıma hazır.", at: new Date(now - 42 * MIN), read: false, icon: Bot },
  { id: "n3", title: "Onay bekleniyor: toplu iade", body: "Rapor Ajanı 12 iade için onayını istiyor.", at: new Date(now - 3 * 60 * MIN), read: false, icon: CreditCard },
  { id: "n4", title: "Zeynep Kaya yorum yaptı", body: "“Kargo şablonunu güncelledim, bakar mısın?”", at: new Date(now - 26 * 60 * MIN), read: true, actor: "Zeynep Kaya" },
  { id: "n5", title: "Haftalık rapor gönderildi", at: new Date(now - 4 * 24 * 60 * MIN), read: true, icon: CircleCheck },
];

type Filter = "tumu" | "okunmamis" | "bana";
const FILTERS = [
  { value: "tumu", label: "Tümü" },
  { value: "okunmamis", label: "Okunmamış" },
  { value: "bana", label: "Bana Atanan" },
] as const satisfies readonly { value: Filter; label: string }[];

/* --- Ekran genişliği (kabukla aynı eşik: lg) ------------------------------- */

const WIDE = "(min-width: 64rem)";
function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);

/* --- Parçalar ------------------------------------------------------------- */

function TicketRow({ ticket, selected, onSelect }: { ticket: Ticket; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full gap-3 rounded-lg px-3 py-3 text-start transition-[background-color,box-shadow] duration-150",
          selected ? "bg-overlay shadow-raised ring-1 ring-line" : "hover:bg-surface-raised",
        )}
      >
        <Avatar name={ticket.from} size="sm" className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("min-w-0 flex-1 truncate text-base", ticket.unread ? "font-semibold text-strong" : "text-body")}>
              {ticket.from}
            </span>
            <span className="shrink-0 text-small text-muted tabular-nums">{ticket.time}</span>
          </span>
          <span className={cn("mt-0.5 block truncate text-base", ticket.unread ? "font-medium text-strong" : "text-body")}>
            {ticket.subject}
          </span>
          <span className="mt-0.5 block truncate text-small text-muted">{ticket.preview}</span>
          <span className="mt-2 flex items-center gap-1.5">
            <Badge tone={PRIORITY[ticket.priority].tone} dot>
              {PRIORITY[ticket.priority].label}
            </Badge>
            <Badge variant="outline">{ticket.topic}</Badge>
            {ticket.unread ? (
              <>
                <span aria-hidden className="ml-auto size-2 rounded-full bg-primary" />
                <span className="sr-only">Okunmadı</span>
              </>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

function TicketDetail({ ticket, onBack, onArchive }: { ticket: Ticket; onBack?: () => void; onArchive: () => void }) {
  const [reply, setReply] = useState("");
  return (
    <article aria-labelledby={`${ticket.id}-konu`} className="flex min-h-full flex-col">
      <div className="flex items-center gap-1 border-b border-line-soft px-3 py-2 sm:px-4">
        {onBack ? <IconButton icon={ArrowLeft} aria-label="Listeye Dön" size="sm" onClick={onBack} /> : null}
        <span className="text-small font-medium text-muted tabular-nums">{ticket.id}</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={UserPlus} aria-label="Ata" size="sm" />
          <IconButton icon={Clock} aria-label="Ertele" size="sm" />
          <IconButton icon={Archive} aria-label="Arşivle" size="sm" onClick={onArchive} />
        </div>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-6">
        <header className="grid gap-3">
          <h2 id={`${ticket.id}-konu`} className="text-heading font-semibold tracking-tight text-balance text-strong">
            {ticket.subject}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={PRIORITY[ticket.priority].tone} dot>
              {PRIORITY[ticket.priority].label} Öncelik
            </Badge>
            <Badge variant="outline">{ticket.topic}</Badge>
            {ticket.mine ? <Badge tone="primary">Sana Atandı</Badge> : null}
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={ticket.from} size="md" />
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-strong">{ticket.from}</p>
              <p className="truncate text-small text-muted">
                {ticket.email} · Bugün {ticket.time}
              </p>
            </div>
          </div>
        </header>

        <div className="grid max-w-prose gap-3 text-read text-body">
          {ticket.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {ticket.suggestion ? (
          <section aria-labelledby={`${ticket.id}-oneri`} className="rounded-xl bg-surface p-4">
            <h3 id={`${ticket.id}-oneri`} className="flex items-center gap-2 text-small font-semibold text-strong [&_svg]:size-4">
              <Sparkles aria-hidden strokeWidth={1.75} className="text-primary-ink" />
              Asistanın Yanıt Önerisi
            </h3>
            <p className="mt-2 text-base text-body">{ticket.suggestion}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setReply(ticket.suggestion ?? "")}>
                Yanıta Ekle
              </Button>
              <Button variant="ghost" size="sm">
                Daha Kısa Yaz
              </Button>
            </div>
          </section>
        ) : null}

        <form onSubmit={(event) => event.preventDefault()} className="grid gap-3">
          <Textarea
            label={`${ticket.from.split(" ")[0]} için yanıt`}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Yanıtını yaz"
            minRows={3}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary">Ajana Devret</Button>
            <Button type="submit" variant="brand" disabled={!reply.trim()}>
              Yanıtla ve Çöz
            </Button>
          </div>
        </form>
      </div>
    </article>
  );
}

function ListHeader({ filter, onFilter, count }: { filter: Filter; onFilter: (f: Filter) => void; count: number }) {
  return (
    <div className="grid gap-2 px-3 pt-3 pb-2">
      <SegmentedControl<Filter> options={FILTERS} value={filter} onValueChange={onFilter} aria-label="Talepleri süz" size="sm" />
      <p className="px-1 text-small text-muted" aria-live="polite">
        {count.toLocaleString("tr-TR")} talep
      </p>
    </div>
  );
}

/* --- Ekran ---------------------------------------------------------------- */

function InboxScreen({ initialSelected }: { initialSelected?: string }) {
  const wide = useWide();
  const [filter, setFilter] = useState<Filter>("tumu");
  const [tickets, setTickets] = useState<readonly Ticket[]>(TICKETS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected ?? TICKETS[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = tickets.filter((t) => (filter === "okunmamis" ? t.unread : filter === "bana" ? t.mine : true));
  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId(id);
    setTickets((list) => list.map((t) => (t.id === id ? { ...t, unread: false } : t)));
    if (!wide) setSheetOpen(true);
  }

  function archive(id: string) {
    const rest = tickets.filter((t) => t.id !== id);
    setTickets(rest);
    setSelectedId(rest[0]?.id ?? null);
    setSheetOpen(false);
  }

  const unreadCount = tickets.filter((t) => t.unread).length;

  return (
    <Screen>
      <AppShell
        brand={BRAND}
        groups={NAV.map((group) => ({
          ...group,
          items: group.items.map((item) => (item.href === ROUTES.gelen ? { ...item, badge: unreadCount } : item)),
        }))}
        current={ROUTES.gelen}
        user={USER}
        userAction={<SignOutButton />}
        className="h-dvh min-h-0"
      >
        <div className="flex h-full flex-col">
          <ContentBar title="Gelen Kutusu" meta={`${unreadCount.toLocaleString("tr-TR")} okunmamış`}>
            <NotificationCenter
              items={notifications}
              onMarkRead={(ids) => setNotifications((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))}
            />
          </ContentBar>

          <div className="flex min-h-0 flex-1">
            <section
              aria-label="Talepler"
              className="flex min-h-0 w-full shrink-0 flex-col border-line-soft bg-surface lg:w-[23rem] lg:border-r"
            >
              <ListHeader filter={filter} onFilter={setFilter} count={visible.length} />
              <ul className="grid min-h-0 flex-1 grid-cols-1 content-start gap-0.5 overflow-y-auto px-2 pb-2">
                {visible.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} selected={wide && ticket.id === selectedId} onSelect={() => select(ticket.id)} />
                ))}
              </ul>
            </section>

            {wide ? (
              <div className="hidden min-w-0 flex-1 overflow-y-auto lg:block">
                {selected ? (
                  <TicketDetail key={selected.id} ticket={selected} onArchive={() => archive(selected.id)} />
                ) : (
                  <p className="grid h-full place-items-center text-base text-muted">Bir talep seç.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </AppShell>

      {!wide && selected ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={selected.id} className="max-h-[92dvh]">
          <TicketDetail key={selected.id} ticket={selected} onArchive={() => archive(selected.id)} />
        </Sheet>
      ) : null}
      <ShellCommands />
    </Screen>
  );
}

const meta = {
  title: "Ekranlar/Uygulama/Gelen Kutusu",
  id: "screens-app-inbox",
  component: InboxScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Destek gelen kutusu: solda süzülebilir talep listesi, sağda seçili talebin ayrıntısı, asistanın yanıt önerisi ve yanıt alanı; üst çubukta bildirim merkezi. Telefonda liste tam genişlik, ayrıntı alttan açılan çekmecede.",
      },
      story: { inline: false, height: "52rem" },
    },
  },
  args: { initialSelected: TICKETS[0].id },
  argTypes: { initialSelected: { control: "select", options: TICKETS.map((t) => t.id) } },
} satisfies Meta<typeof InboxScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Filtering: Story = {
  name: "Süzme ve Seçim",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Bana Atanan" }));
    const list = canvas.getByRole("region", { name: "Talepler" });
    await waitFor(() => expect(within(list).getByText("3 talep")).toBeVisible());
    await expect(within(list).queryByText("İadem onaylandı ama hesabıma geçmedi")).toBeNull();
  },
};

export const NotificationsOpen: Story = {
  name: "Bildirim Merkezi Açık",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Bildirimler, 3 okunmamış/ }));
    const popup = await within(document.body).findByRole("dialog", { name: /Bildirimler/ });
    await waitFor(() => expect(within(popup).getByText("Mert Aksoy talebi sana atadı")).toBeVisible());
  },
};

export const MobileDetail: Story = {
  name: "Telefonda Ayrıntı",
  parameters: { docs: { description: { story: "Telefon genişliğinde talebe dokununca ayrıntı alttan açılan çekmecede. Masaüstünde ayrıntı zaten sağda." } } },
  play: async ({ canvasElement }) => {
    if (window.matchMedia(WIDE).matches) return;
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Ayşe Demir/ }));
    const sheet = await within(document.body).findByRole("dialog", { name: "T-4818" });
    await waitFor(() => expect(within(sheet).getByRole("heading", { name: "İadem onaylandı ama hesabıma geçmedi" })).toBeVisible());
  },
};
