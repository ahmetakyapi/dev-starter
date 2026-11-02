"use client";

import { Bell, Coffee, Flame, Inbox, LayoutDashboard, LogOut, MessageSquare, Package, Palette, Shield, SlidersHorizontal, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AgentPlan, type PlanStep } from "@/components/ui/agent-plan";
import { AppShell, type ShellNavGroup } from "@/components/ui/app-shell";
import { AuthCard, type AuthState } from "@/components/ui/auth-card";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
import { IconButton } from "@/components/ui/icon-button";
import { Select } from "@/components/ui/select";
import { SettingsDialog, SettingsRow, SettingsSection, type SettingsTab } from "@/components/ui/settings-dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BRAND, CAFES, ME, OCTOBER_ORDERS, ROAST_TOTAL, num } from "./_data";

/* --- Ortak kart --------------------------------------------------------- */

function BlockCell({ file, name, note, className, bodyClassName, children }: { file: string; name: string; note: string; className?: string; bodyClassName?: string; children: ReactNode }) {
  return (
    <figure id={`b-${file}`} className={cn("row-span-2 grid min-w-0 scroll-mt-24 grid-rows-subgrid gap-y-3", className)}>
      <div className={cn("flex min-w-0 items-center justify-center rounded-2xl bg-surface p-4 sm:p-8", bodyClassName)}>{children}</div>
      <figcaption className="flex items-start justify-between gap-3 px-1">
        <span>
          <span className="block text-base font-semibold text-strong">{name}</span>
          <span className="mt-0.5 block text-small text-muted">{note}</span>
        </span>
        <code className="mt-0.5 shrink-0 font-mono text-micro text-muted">{file}</code>
      </figcaption>
    </figure>
  );
}

/* --- Sohbet uygulaması --------------------------------------------------- */

const CURRENT = "#asistan";
const NAV: readonly ShellNavGroup[] = [
  {
    items: [
      { href: "#pano", label: "Pano", icon: <LayoutDashboard /> },
      { href: "#siparisler", label: "Siparişler", icon: <Inbox />, badge: 14 },
      { href: CURRENT, label: "Asistan", icon: <MessageSquare /> },
    ],
  },
  {
    label: "Atölye",
    items: [
      { href: "#kavurma", label: "Kavurma", icon: <Flame /> },
      { href: "#stok", label: "Stok", icon: <Package /> },
      { href: "#kafeler", label: "Kafeler", icon: <Store />, badge: 8 },
    ],
  },
];

const PLAN: readonly PlanStep[] = [
  { id: "oku", title: "Ekim siparişlerini oku" },
  { id: "ayir", title: "Kanallara ayır" },
  { id: "kavurma", title: "Kavurma kayıtlarıyla eşleştir", detail: `${num.format(ROAST_TOTAL)} kg geçen haftanın partileri karşılaştırılıyor` },
  { id: "stok", title: "Kasım stok ihtiyacını hesapla" },
  { id: "rapor", title: "Kurucuya özet yaz" },
];
const PLAN_LABELS = PLAN.map((s) => String(s.title));
const MODELS = ["Fable 5", "Fable 5 Mini"] as const;
const REPLIES = [
  "Not aldım. Özetin sonuna Kasım için çekirdek sipariş önerisini eklerim.",
  "Tamam. Gecikmeli teslimatları ayrı bir başlıkta toplarım.",
];

function ChatApp() {
  const [step, setStep] = useState(2);
  const [extra, setExtra] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [model, setModel] = useState<string>(MODELS[0]);
  const timer = useRef<number | null>(null);
  const replies = useRef(0);

  // Plan kendiliğinden ilerler (canlı bir ajan gibi), sonda durur. Hareket azaltmada da metin değişir, animasyon değil.
  useEffect(() => {
    if (step >= PLAN.length) return;
    const id = window.setTimeout(() => setStep((v) => v + 1), 3600);
    return () => window.clearTimeout(id);
  }, [step]);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const messages: ChatMessage[] = [
    { id: "u1", role: "user", content: "Ekim'i özetle: hangi kanal büyüdü, Kasım için ne kadar yeşil çekirdek almalıyız?" },
    {
      id: "a1",
      role: "assistant",
      content: (
        <div className="grid gap-3">
          <p>
            Ekim'de web mağazadan <strong>{num.format(OCTOBER_ORDERS)} sipariş</strong> geldi. Önce kanalları ayırıp kavurma kayıtlarıyla eşleştiriyorum,
            sonra Kasım ihtiyacını çıkaracağım.
          </p>
          <AgentPlan steps={PLAN} activeIndex={step} stepLabels={PLAN_LABELS} />
        </div>
      ),
    },
    ...extra,
  ];

  function send(text: string) {
    setExtra((list) => [...list, { id: `u-${list.length}`, role: "user", content: text }]);
    setThinking(true);
    timer.current = window.setTimeout(() => {
      const reply = REPLIES[replies.current % REPLIES.length];
      replies.current += 1;
      setExtra((list) => [...list, { id: `a-${list.length}`, role: "assistant", content: reply }]);
      setThinking(false);
    }, 1500);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line-soft px-5">
        <h3 className="truncate text-base font-semibold text-strong">Ekim Özeti</h3>
        <span className="ml-auto shrink-0 text-small text-muted">Bugün 09.40</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatThread messages={messages} thinking={thinking} className="mx-auto max-w-2xl" />
      </div>
      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
        <ChatComposer
          onSend={send}
          onStop={() => {
            if (timer.current) window.clearTimeout(timer.current);
            setThinking(false);
          }}
          status={thinking ? "streaming" : "idle"}
          model={model}
          models={MODELS}
          onModelChange={setModel}
          onAttach={() => undefined}
        />
      </div>
    </div>
  );
}

/* --- Giriş ve ayarlar --------------------------------------------------- */

async function demoSignIn(_: AuthState, data: FormData): Promise<AuthState> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const email = String(data.get("email") ?? "").trim();
  if (!email.includes("@")) return { email, fieldErrors: { email: "Geçerli bir e-posta adresi yaz." } };
  if (String(data.get("password") ?? "").length < 8) return { email, error: "E-posta ya da şifre hatalı." };
  return { email };
}

const SETTINGS: readonly SettingsTab[] = [
  {
    value: "genel",
    label: "Genel",
    icon: <SlidersHorizontal />,
    content: (
      <SettingsSection title="Atölye" description="Fatura ve irsaliyede görünen bilgiler.">
        <SettingsRow label="Varsayılan Kafe" hint="Toptan sipariş formunda ilk seçenek">
          <Select label="Varsayılan Kafe" hideLabel defaultValue="alsancak" items={CAFES.map((c) => ({ value: c.value, label: c.label }))} />
        </SettingsRow>
        <Switch label="Kavurma Tarihini Pakete Bas" hint="Etikette gün ve parti numarası." defaultChecked />
      </SettingsSection>
    ),
  },
  {
    value: "gorunum",
    label: "Görünüm",
    icon: <Palette />,
    content: (
      <SettingsSection title="Görünüm" description="Bu cihazda geçerli.">
        <Switch label="Sıkı Düzen" hint="Tablo satırları arasındaki boşluğu azaltır." />
        <Switch label="Hareketi Azalt" hint="Geçiş animasyonlarını kapatır." />
      </SettingsSection>
    ),
  },
  {
    value: "bildirim",
    label: "Bildirimler",
    icon: <Bell />,
    content: (
      <SettingsSection title="Bildirimler" description="Hangi olayda haber verelim?">
        <Switch label="Toptan Sipariş Geldiğinde" defaultChecked />
        <Switch label="Stok Kritik Seviyede" hint="Bir çekirdek iki haftalığın altına inince." defaultChecked />
      </SettingsSection>
    ),
  },
  {
    value: "guvenlik",
    label: "Güvenlik",
    icon: <Shield />,
    content: (
      <SettingsSection title="Oturum">
        <Switch label="İki Adımlı Doğrulama" hint="Girişte telefona kod gelir." defaultChecked />
      </SettingsSection>
    ),
  },
];

/* --- Bölüm -------------------------------------------------------------- */

export function Blocks() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-10 lg:grid-cols-2">
      <BlockCell
        file="app-shell"
        name="Uygulama Kabuğu"
        note="İçinde sohbet: ajan planı, mesaj akışı ve giriş kutusu. Kenar çubuğu ⌘B ile daralır, telefonda alttan açılır."
        className="lg:col-span-2"
        bodyClassName="block p-2 sm:p-3"
      >
        <AppShell
          brand={{
            name: BRAND.name,
            href: "#pano",
            logo: (
              <span className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
                <Coffee className="!size-4" strokeWidth={2} />
              </span>
            ),
          }}
          groups={NAV}
          current={CURRENT}
          user={{ name: ME.name, detail: ME.role }}
          userAction={<IconButton icon={LogOut} aria-label="Oturumu Kapat" size="sm" />}
          searchLabel="Ara ya da git"
          contentAs="div"
          className="h-[42rem] min-h-0 rounded-xl"
        >
          <ChatApp />
        </AppShell>
      </BlockCell>

      <BlockCell file="auth-card" name="Giriş Kartı" note="Sağlayıcı düğmeleri, e-posta ve şifre; sunucu eylemine bağlanır, hatası alanın altında." bodyClassName="border border-line bg-page">
        <AuthCard
          action={demoSignIn}
          socialAction={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }}
          forgotHref="#sifre"
          footer={
            <>
              Atölyende hesabın yok mu?{" "}
              <Link href="#kayit" className="font-semibold text-strong underline-offset-4 hover:underline">
                Kaydol
              </Link>
            </>
          }
        />
      </BlockCell>

      <BlockCell file="settings-dialog" name="Ayarlar Penceresi" note="Solda sekmeler, telefonda üstte kayar; her satır anında uygular.">
        <div className="grid w-full max-w-sm gap-3">
          <ul className="grid gap-1.5" aria-label="Ayar Özeti">
            {[
              ["Varsayılan Kafe", "Alsancak Demlik"],
              ["Bildirimler", "2 açık"],
              ["İki Adımlı Doğrulama", "Açık"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 rounded-xl bg-overlay px-4 py-3 text-base shadow-raised">
                <span className="text-body">{k}</span>
                <span className="font-medium text-strong">{v}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-center pt-2">
            <SettingsDialog tabs={SETTINGS} description="Kıyı Kahve hesabının tercihleri." triggerLabel="Ayarları Aç" />
          </div>
        </div>
      </BlockCell>
    </div>
  );
}
