import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SquarePen } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AgentPlan } from "@/components/ui/agent-plan";
import { AppShell } from "@/components/ui/app-shell";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Screen } from "../../_lib/Frame";
import { BRAND, ContentBar, NAV, ROUTES, ShellCommands, SignOutButton, USER } from "../_shared";

/* --- Ekip ---------------------------------------------------------------- */

const AGENTS = [
  { id: "tasarim", name: "Tasarım", role: "Arayüz, Görsel Dil, Erişilebilirlik" },
  { id: "pazarlama", name: "Pazarlama", role: "Kampanya, Metin, Kanal" },
  { id: "urun", name: "Ürün", role: "Öncelik, Ölçüm, Yol Haritası" },
] as const;
type AgentId = (typeof AGENTS)[number]["id"];
type Recipient = "hepsi" | AgentId;

const RECIPIENTS = [
  { value: "hepsi", label: "Hepsi" },
  ...AGENTS.map((agent) => ({ value: agent.id, label: agent.name })),
] as const satisfies readonly { value: Recipient; label: string }[];

const agentOf = (id: AgentId) => AGENTS.find((agent) => agent.id === id)!;

const STARTERS = [
  "Kasım kampanyası için açılış sayfasını yenileyelim",
  "Deneme süresinden ücretliye geçişi neden düşük?",
  "Yeni fiyat sayfası için üç seçenek çıkarın",
] as const;

/* --- Mesaj içerikleri ------------------------------------------------------ */

/** Ajan mesajı: avatar, ad ve rol üstte; gövde balonsuz. */
function AgentMessage({ id, time, children }: { id: AgentId; time: string; children: ReactNode }) {
  const agent = agentOf(id);
  return (
    <div className="flex gap-3">
      <Avatar name={agent.name} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-base">
          <span className="font-semibold text-strong">{agent.name}</span>
          <span className="text-small text-muted">{agent.role}</span>
          <span className="text-small text-muted">· {time}</span>
        </p>
        <div className="mt-1 grid gap-3">{children}</div>
      </div>
    </div>
  );
}

const PRODUCT_PLAN = [
  { id: "olc", title: "Son 90 Günün Deneme Kayıtlarını Çıkar" },
  { id: "kirilim", title: "Kanallara Göre Dönüşümü Karşılaştır", detail: "Arama, sosyal ve e-posta; 3.412 kayıt" },
  { id: "hedef", title: "%20 Artış için Gereken Trafiği Hesapla" },
  { id: "deney", title: "İki Varyantlı Deney Taslağı Yaz" },
];

const GOAL = "Kasım kampanyası için açılış sayfasını yenileyelim. Hedef: deneme kaydını %20 artırmak, bütçe değişmiyor.";

function conversation(productStep: number): ChatMessage[] {
  return [
    { id: "u1", role: "user", content: GOAL },
    {
      id: "a-urun",
      role: "assistant",
      content: (
        <AgentMessage id="urun" time="14:02">
          <p>
            Önce bugünkü durumu ölçüyorum: deneme kaydı ayda ortalama <strong>1.180</strong>, ziyaretçinin{" "}
            <strong>%2,4</strong>'ü. %20 artış, aynı trafikte %2,9 demek.
          </p>
          <AgentPlan
            steps={PRODUCT_PLAN}
            activeIndex={productStep}
            stepLabels={PRODUCT_PLAN.map((step) => step.title)}
            defaultOpen
          />
        </AgentMessage>
      ),
    },
    {
      id: "a-pazarlama",
      role: "assistant",
      content: (
        <AgentMessage id="pazarlama" time="14:03">
          <p>Başlık için üç yön; hepsi ürünün ne yaptığını söylüyor, indirim vaat etmiyor:</p>
          <ol className="grid list-decimal gap-1.5 pl-5 marker:text-muted">
            <li>“Destek taleplerini ajanın ayıklasın, ekibin çözmeye odaklansın.”</li>
            <li>“Her sabah, dünün talepleri tek sayfada özetli.”</li>
            <li>“İlk yanıt süresini yarıya indiren çalışma alanı.”</li>
          </ol>
          <p>Üçüncüsü ölçülebilir bir vaat; Ürün'ün verisi doğrularsa onu öneririm.</p>
        </AgentMessage>
      ),
    },
    {
      id: "a-tasarim",
      role: "assistant",
      content: (
        <AgentMessage id="tasarim" time="14:04">
          <p>
            Üst bölümde ekran görüntüsü yerine <strong>canlı pano</strong> öneriyorum: ziyaretçi ürünü ilk
            ekranda çalışırken görür. Deneme düğmesini kaydırınca da görünür tutarım; telefonda alt kenarda sabit.
          </p>
          <p>Kontrast ve dokunma hedefleri iki temada da AA; taslak yarın 11.00'de hazır.</p>
        </AgentMessage>
      ),
    },
  ];
}

const REPLIES: Record<AgentId, string> = {
  urun: "Not aldım. Deneyi iki hafta koşturursak 0,05 anlamlılıkla sonucu okuyabiliriz; ilk haftanın verisini cuma paylaşırım.",
  pazarlama: "E-posta listesine aynı başlıkla bir duyuru hazırlarım; gönderimi deney başladıktan iki gün sonraya koyalım.",
  tasarim: "Varyant B'de düğme metnini “Ücretsiz Dene” yerine “14 Gün Dene” yapıyorum; süre yazınca tıklama artıyor.",
};

/* --- Ekran ---------------------------------------------------------------- */

type MultiAgentScreenProps = {
  start: "empty" | "conversation";
};

function MultiAgentScreen({ start }: MultiAgentScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(start === "conversation" ? conversation(1) : []);
  const [recipient, setRecipient] = useState<Recipient>("hepsi");
  const [busy, setBusy] = useState<AgentId | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function send(text: string) {
    stop();
    const order: AgentId[] = recipient === "hepsi" ? ["urun", "pazarlama", "tasarim"] : [recipient];
    const now = Date.now();
    setMessages((list) => [...list, { id: `u-${now}`, role: "user", content: text }]);
    order.forEach((agent, index) => {
      timers.current.push(window.setTimeout(() => setBusy(agent), index * 1300 + 200));
      timers.current.push(
        window.setTimeout(() => {
          setMessages((list) => [
            ...list,
            {
              id: `a-${agent}-${now}`,
              role: "assistant",
              content: (
                <AgentMessage id={agent} time="Az önce">
                  <p>{REPLIES[agent]}</p>
                </AgentMessage>
              ),
            },
          ]);
          if (index === order.length - 1) setBusy(null);
        }, index * 1300 + 1100),
      );
    });
  }

  function stop() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setBusy(null);
  }

  const empty = messages.length === 0 && !busy;

  return (
    <Screen>
      <AppShell brand={BRAND} groups={NAV} current={ROUTES.ekip} user={USER} userAction={<SignOutButton />} className="h-dvh min-h-0">
        <div className="flex h-full flex-col">
          <ContentBar title={empty ? "Ajan Ekibi" : "Kasım Kampanyası"} meta={empty ? undefined : "3 ajan · Bugün 14:01"}>
            <AvatarGroup people={AGENTS} size="sm" label="Sohbetteki ajanlar" className="mr-1 hidden sm:flex [&>*]:ring-overlay" />
            <IconButton icon={SquarePen} aria-label="Yeni Sohbet" size="sm" onClick={() => {
                stop();
                setMessages([]);
              }} />
          </ContentBar>

          <div data-chat-scroll tabIndex={0} role="region" aria-label="Mesajlar" className="min-h-0 flex-1 overflow-y-auto">
            {empty ? (
              <EmptyTeam onStart={send} />
            ) : (
              <ChatThread
                messages={messages}
                thinking={busy !== null}
                thinkingLabel={busy ? `${agentOf(busy).name} yazıyor…` : undefined}
                label="Ekip sohbeti"
                className="mx-auto max-w-2xl sm:px-6"
              />
            )}
          </div>

          <div className="mx-auto grid w-full max-w-2xl shrink-0 gap-2 px-3 pb-3 sm:px-6 sm:pb-5">
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
              <span className="shrink-0 text-small font-medium text-muted">Kime</span>
              <SegmentedControl<Recipient>
                options={RECIPIENTS}
                value={recipient}
                onValueChange={setRecipient}
                aria-label="Mesajın alıcısı"
                size="sm"
              />
            </div>
            <ChatComposer
              onSend={send}
              onStop={stop}
              status={busy ? "streaming" : "idle"}
              model="Fable 5"
              placeholder={recipient === "hepsi" ? "Ekibe bir hedef ya da soru yaz" : `${agentOf(recipient).name} ajanına yaz`}
              label="Ekibe mesaj"
              onAttach={() => undefined}
            />
          </div>
        </div>
      </AppShell>
      <ShellCommands />
    </Screen>
  );
}

function EmptyTeam({ onStart }: { onStart: (text: string) => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <AvatarGroup people={AGENTS} size="lg" label="Hazır ajanlar" className="[&>*]:ring-4 [&>*]:ring-overlay" />
      <h2 className="mt-5 text-heading font-semibold tracking-tight text-balance text-strong">
        Tasarım, Pazarlama ve Ürün Hazır
      </h2>
      <p className="mt-2 max-w-md text-read text-pretty text-body">
        Bir hedef yaz; üç ajan kendi açısından plan çıkarsın, sen birleştir. Tek bir ajana yazmak için aşağıdan seç.
      </p>

      <ul className="mt-7 grid w-full gap-2 text-start sm:grid-cols-3">
        {AGENTS.map((agent) => (
          <li key={agent.id} className="flex items-center gap-3 rounded-xl bg-surface p-3 sm:flex-col sm:items-start sm:gap-2">
            <Avatar name={agent.name} size="sm" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-strong">{agent.name}</p>
              <p className="text-small text-muted">{agent.role}</p>
            </div>
          </li>
        ))}
      </ul>

      <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Öneriler">
        {STARTERS.map((text) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onStart(text)}
              className="min-h-11 rounded-full border border-line bg-overlay px-4 text-base text-strong shadow-raised transition-[border-color,translate] hover:border-line-strong active:translate-y-px pointer-fine:min-h-9"
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta = {
  title: "Ekranlar/Uygulama/Çoklu Asistan Sohbeti",
  id: "multi-agent-chat",
  component: MultiAgentScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Birkaç ajanlı çalışma sohbeti: boş durumda ekip tanıtılır, konuşmada her ajan kendi adı ve rolüyle yazar; Ürün ajanının mesajında plan ilerler. Kime seçimiyle tek ajana ya da hepsine yazılır. Ajanların kimliği baş harfli avatar; marka ya da emoji yok.",
      },
      story: { inline: false, height: "48rem" },
    },
  },
  args: { start: "empty" },
  argTypes: { start: { control: "inline-radio", options: ["empty", "conversation"] } },
} satisfies Meta<typeof MultiAgentScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = { name: "Boş Durum" };

export const Conversation: Story = { name: "Konuşma", args: { start: "conversation" } };

export const Interactive: Story = {
  name: "Etkileşimli",
  parameters: { docs: { description: { story: "Bir öneriye tıkla: ajanlar sırayla yazar; Kime ile tek ajan seçilebilir." } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Pazarlama" }));
    await userEvent.click(canvas.getByRole("button", { name: STARTERS[0] }));
    const log = await canvas.findByRole("log");
    await expect(within(log).getByText(STARTERS[0])).toBeInTheDocument();
    // Mesaj solarak girer: önce DOM'da, sonra görünür.
    const reply = await within(log).findByText(REPLIES.pazarlama, {}, { timeout: 4000 });
    await waitFor(() => expect(reply).toBeVisible());
  },
};
