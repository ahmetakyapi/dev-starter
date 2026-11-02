"use client";

import "@/app/palettes.css";
import {
  Bell,
  Bot,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Orbit,
  Palette,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AgentPlan, type PlanStep } from "@/components/ui/agent-plan";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
import { CommandPalette, type Command } from "@/components/ui/command-palette";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { Select } from "@/components/ui/select";
import { SettingsDialog, SettingsRow, SettingsSection, type SettingsTab } from "@/components/ui/settings-dialog";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_THEME, PALETTE } from "@/lib/theme";
import { cn } from "@/lib/utils";

/* --- Veri ---------------------------------------------------------------- */

const CURRENT = "/vitrin";

const NAV: readonly ShellNavGroup[] = [
  {
    items: [
      { href: "/vitrin?bolum=pano", label: "Pano", icon: <LayoutDashboard /> },
      { href: "/vitrin?bolum=gelen", label: "Gelen Kutusu", icon: <Inbox />, badge: 12 },
      { href: CURRENT, label: "Asistan", icon: <MessageSquare /> },
    ],
  },
  {
    label: "Çalışma Alanı",
    items: [
      { href: "/vitrin?bolum=raporlar", label: "Raporlar", icon: <FileText /> },
      { href: "/vitrin?bolum=ekip", label: "Ekip", icon: <Users /> },
      { href: "/vitrin?bolum=ajanlar", label: "Ajanlar", icon: <Bot />, badge: 3 },
    ],
  },
];

const PLAN: readonly PlanStep[] = [
  { id: "oku", title: "Destek kayıtlarını oku" },
  { id: "ayikla", title: "Yinelenen talepleri ayıkla" },
  { id: "grupla", title: "Talepleri konuya göre grupla" },
  { id: "sec", title: "En sık üç sorunu seç", detail: "1.284 talep içinde 41 konu kümesi karşılaştırılıyor" },
  { id: "ornek", title: "Her sorun için örnek talep bul" },
  { id: "yaz", title: "Özet raporu yaz" },
  { id: "paylas", title: "Ekip için paylaşım taslağı hazırla" },
];
const PLAN_LABELS = PLAN.map((step) => String(step.title));

const MODELS = ["Fable 5", "Fable 5 Mini", "Atlas 2"] as const;

const REPLIES = [
  "Not aldım. Rapor bitince bu başlığı en üste taşırım.",
  "Tamam. Son iki çeyreği karşılaştırıp farkı ayrıca yazarım.",
  "Anlaşıldı. Örnek talepleri müşteri adı olmadan veririm.",
];

const SUGGESTIONS = [
  "Bu haftanın satış özetini çıkar",
  "Açık talepleri önceliğe göre sırala",
  "Toplantı notlarından görev listesi yap",
];

/* --- Kartlar ------------------------------------------------------------- */

function Showcase({
  name,
  note,
  className,
  bodyClassName,
  children,
}: {
  name: string;
  note: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className={cn("flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-surface p-4 sm:p-8", bodyClassName)}>
        {children}
      </div>
      <figcaption className="px-1">
        <p className="text-base font-semibold text-strong">{name}</p>
        <p className="mt-0.5 text-base text-muted">{note}</p>
      </figcaption>
    </figure>
  );
}

/* --- Sohbet uygulaması --------------------------------------------------- */

function AssistantPlanMessage({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-3">
      <p>
        Geçen çeyrekte <strong>1.284 destek talebi</strong> var. Önce yinelenenleri ayıklayıp konulara göre
        grupluyorum, sonra en sık üç sorunu örnekleriyle çıkaracağım.
      </p>
      <AgentPlan steps={PLAN} activeIndex={activeIndex} stepLabels={PLAN_LABELS} />
    </div>
  );
}

function ChatApp() {
  const [planIndex, setPlanIndex] = useState(3);
  const [extra, setExtra] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [model, setModel] = useState<string>(MODELS[0]);
  const timer = useRef<number | null>(null);
  const replyCount = useRef(0);

  // Plan kendiliğinden ilerler (canlı bir ajan gibi); sonda durur.
  useEffect(() => {
    if (planIndex >= PLAN.length) return;
    const id = window.setTimeout(() => setPlanIndex((value) => value + 1), 3200);
    return () => window.clearTimeout(id);
  }, [planIndex]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const messages: ChatMessage[] = [
    {
      id: "u1",
      role: "user",
      content: "Geçen çeyreğin destek taleplerini özetle ve en sık üç sorunu çıkar.",
    },
    { id: "a1", role: "assistant", content: <AssistantPlanMessage activeIndex={planIndex} /> },
    ...extra,
  ];

  function send(text: string) {
    setExtra((list) => [...list, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setThinking(true);
    timer.current = window.setTimeout(() => {
      const reply = REPLIES[replyCount.current % REPLIES.length];
      replyCount.current += 1;
      setExtra((list) => [...list, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
      setThinking(false);
    }, 1600);
  }

  function stop() {
    if (timer.current) window.clearTimeout(timer.current);
    setThinking(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line-soft px-5">
        <h2 className="truncate text-base font-semibold text-strong">Destek Talepleri Özeti</h2>
        <span className="ml-auto shrink-0 text-small text-muted">Bugün 14:20</span>
      </div>
      <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto">
        <ChatThread messages={messages} thinking={thinking} className="mx-auto max-w-2xl" />
      </div>
      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
        <ChatComposer
          onSend={send}
          onStop={stop}
          status={thinking ? "streaming" : "idle"}
          model={model}
          models={MODELS}
          onModelChange={setModel}
          onAttach={() => undefined}
          onVoice={() => undefined}
        />
      </div>
    </div>
  );
}

/* --- Diğer bloklar ------------------------------------------------------- */

async function demoSignIn(_: AuthState, data: FormData): Promise<AuthState> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
  if (password.length < 8) return { email, error: "E-posta ya da şifre hatalı." };
  return { email };
}

async function demoSocial() {
  await new Promise((resolve) => setTimeout(resolve, 600));
}

const SETTINGS: readonly SettingsTab[] = [
  {
    value: "genel",
    label: "Genel",
    icon: <SlidersHorizontal />,
    content: (
      <>
        <SettingsSection title="Bölge" description="Tarih, saat ve sayılar bu ayarlara göre yazılır.">
          <SettingsRow label="Dil" hint="Arayüz metinleri">
            <Select
              label="Dil"
              hideLabel
              defaultValue="tr"
              items={[
                { value: "tr", label: "Türkçe" },
                { value: "en", label: "İngilizce" },
                { value: "de", label: "Almanca" },
              ]}
            />
          </SettingsRow>
          <SettingsRow label="Saat Dilimi">
            <Select
              label="Saat Dilimi"
              hideLabel
              defaultValue="ist"
              items={[
                { value: "ist", label: "İstanbul (GMT+3)" },
                { value: "lon", label: "Londra (GMT+0)" },
                { value: "ber", label: "Berlin (GMT+1)" },
              ]}
            />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="Başlangıç">
          <Switch label="Son Açık Sohbetle Başla" hint="Uygulama açılınca kaldığın sohbete döner." defaultChecked />
        </SettingsSection>
      </>
    ),
  },
  {
    value: "gorunum",
    label: "Görünüm",
    icon: <Palette />,
    content: (
      <SettingsSection title="Görünüm" description="Bu cihazda geçerli.">
        <Switch label="Sıkı Düzen" hint="Satırlar arasındaki boşluğu azaltır." />
        <Switch label="Hareketi Azalt" hint="Geçiş animasyonlarını kapatır." />
        <SettingsRow label="Yazı Boyutu">
          <Select
            label="Yazı Boyutu"
            hideLabel
            defaultValue="orta"
            items={[
              { value: "kucuk", label: "Küçük" },
              { value: "orta", label: "Orta" },
              { value: "buyuk", label: "Büyük" },
            ]}
          />
        </SettingsRow>
      </SettingsSection>
    ),
  },
  {
    value: "bildirimler",
    label: "Bildirimler",
    icon: <Bell />,
    content: (
      <SettingsSection title="Bildirimler" description="Hangi olayda haber verelim?">
        <Switch label="Ajan İşi Bitirdiğinde" hint="Uzun süren planlar tamamlanınca." defaultChecked />
        <Switch label="Onay Beklendiğinde" hint="Ajan bir işlem için iznini istediğinde." defaultChecked />
        <Switch label="Haftalık E-posta Özeti" hint="Pazartesi sabahı, 09.00." />
      </SettingsSection>
    ),
  },
  {
    value: "gizlilik",
    label: "Gizlilik",
    icon: <Shield />,
    content: (
      <SettingsSection title="Veri" description="Sohbetlerin nasıl saklandığını belirler.">
        <Switch label="Sohbet Geçmişini Sakla" hint="Kapatırsan sohbetler 30 gün sonra silinir." defaultChecked />
        <Switch label="Model Eğitimine Katkı" hint="Adı ve e-postası çıkarılmış örnekler kullanılır." />
      </SettingsSection>
    ),
  },
];

/* --- Sayfa --------------------------------------------------------------- */

export default function VitrinBloklar() {
  const [emptyNote, setEmptyNote] = useState<string | null>(null);

  const commands: Command[] = NAV.flatMap((group) =>
    group.items.map((item) => ({
      id: item.href,
      label: item.label,
      group: "Gezinme",
      onSelect: () => undefined,
    })),
  );

  return (
    <main id="icerik" className="mx-auto max-w-6xl px-4 pt-12 pb-32 sm:px-6 sm:pt-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-display font-bold tracking-tight text-strong">Bloklar</h1>
        <p className="mt-3 text-lead text-body">
          Birden çok bileşenin birleştiği hazır parçalar: uygulama kabuğu, sohbet, giriş, ayarlar ve palet seçici.
        </p>
      </header>

      <div className="grid gap-10">
        <Showcase
          name="Uygulama Kabuğu + Sohbet"
          note="Kenar çubuğu daralır (⌘B), telefonda alttan açılır; içerikte ajan planı, mesaj akışı ve giriş kutusu birlikte."
          bodyClassName="block p-2 sm:p-3"
        >
          <AppShell
            brand={{
              name: "Pusula",
              href: CURRENT,
              logo: (
                <span className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
                  <Orbit className="!size-4" strokeWidth={2} />
                </span>
              ),
            }}
            groups={NAV}
            current={CURRENT}
            user={{ name: "Elif Yıldırım", detail: "Destek Ekibi" }}
            userAction={
              <button
                type="button"
                aria-label="Çıkış Yap"
                title="Çıkış Yap"
                className="inline-grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-4"
              >
                <LogOut aria-hidden strokeWidth={1.75} />
              </button>
            }
            contentAs="div"
            className="h-[46rem] min-h-0 rounded-xl"
          >
            <ChatApp />
          </AppShell>
        </Showcase>

        <div className="grid gap-10 lg:grid-cols-2">
          <Showcase
            name="Giriş Kartı"
            note="Sağlayıcı düğmeleri, e-posta ve şifre, sunucu eylemine bağlanan hata durumu."
            bodyClassName="border border-line bg-page"
          >
            <AuthCard
              action={demoSignIn}
              socialAction={demoSocial}
              forgotHref="/vitrin?bolum=sifre"
              footer={
                <>
                  Hesabın yok mu?{" "}
                  <Link href="/vitrin?bolum=kayit" className="font-semibold text-strong underline-offset-4 hover:underline">
                    Kaydol
                  </Link>
                </>
              }
            />
          </Showcase>

          <div className="grid content-start gap-10">
            <Showcase
              name="Ajan Planı"
              note="Kalan adım sayısı, dönen gösterge, tamamlananlar üstü çizili; daraltılabilir."
              bodyClassName="border border-line bg-page"
            >
              <AgentPlan steps={PLAN} activeIndex={3} stepLabels={PLAN_LABELS} className="w-full max-w-sm" />
            </Showcase>
            <Showcase name="Ayarlar Penceresi" note="Solda sekmeler, telefonda üstte kayar; anahtar ve seçim satırları anında uygular.">
              <SettingsDialog tabs={SETTINGS} description="Pusula hesabının tercihleri." />
            </Showcase>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <Showcase
            name="Sohbet, Boş Durum"
            note="İlk açılışta ortada başlık, açıklama ve tek dokunuşla gönderilen öneriler."
            bodyClassName="block p-2"
          >
            <div className="h-80 rounded-xl bg-overlay shadow-raised ring-1 ring-line">
              <ChatThread
                messages={[]}
                empty={{
                  title: "Bugün ne yapalım?",
                  description: emptyNote ?? "Bir soru sor ya da aşağıdaki işlerden birini seç.",
                  suggestions: SUGGESTIONS,
                  onSuggestion: (text) => setEmptyNote(`Seçtin: “${text}”`),
                }}
                className="h-full"
              />
            </div>
          </Showcase>
          <Showcase name="Palet Seçici" note="On palet ve tema anahtarı; seçim sayfanın köküne ve çereze yazılır.">
            <PaletteSwitcher initialPalette={PALETTE} initialTheme={DEFAULT_THEME} floating={false} />
          </Showcase>
        </div>
      </div>

      <CommandPalette commands={commands} />
      <PaletteSwitcher initialPalette={PALETTE} initialTheme={DEFAULT_THEME} />
    </main>
  );
}
