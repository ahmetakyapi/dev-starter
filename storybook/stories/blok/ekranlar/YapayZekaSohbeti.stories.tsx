import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Share2, SquarePen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AppShell } from "@/components/ui/app-shell";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
import { IconButton } from "@/components/ui/icon-button";
import { Screen } from "../../_lib/Frame";
import { BRAND, ContentBar, MODELS, NAV, PLAN, ROUTES, ShellCommands, SignOutButton, streamText, SUGGESTIONS, USER } from "../_shared";
import { FIRST_QUESTION, LongAnswer, PlanMessage } from "../thread-data";

/** Sahte yanıtlar: sırayla, kelime kelime akar. */
const REPLIES = [
  "Not aldım. Rapor bitince bu başlığı en üste taşırım ve her sorun için kaç müşterinin ikinci kez yazdığını ayrıca gösteririm.\n\nİstersen raporu ekiple paylaşmadan önce sana taslak olarak gönderebilirim.",
  "Tamam. Son iki çeyreği karşılaştırıp farkı ayrı bir tabloda yazarım. Kargo gecikmesi Temmuz'a göre %9 artmış görünüyor; iade süresi ise iki gün kısalmış.",
  "Anlaşıldı. Örnek talepleri müşteri adı ve sipariş numarası olmadan veririm; yalnız şehir ve tarih kalır.",
];

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="grid gap-3">
      {text.split("\n\n").map((part, index) => (
        <p key={index}>{part}</p>
      ))}
    </div>
  );
}

type ChatScreenProps = {
  /** Başlangıç: boş sohbet, ajan çalışırken, rapor hazır. */
  start: "empty" | "plan" | "done";
  /** Plan kendiliğinden ilerlesin (canlı ajan gibi). */
  livePlan?: boolean;
};

function ChatScreen({ start, livePlan = false }: ChatScreenProps) {
  const [planIndex, setPlanIndex] = useState(start === "done" ? PLAN.length : 3);
  const [extra, setExtra] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState<string>(MODELS[0]);
  const [started, setStarted] = useState(start !== "empty");
  const cancel = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);
  const replyCount = useRef(0);

  useEffect(() => {
    if (!livePlan || !started || planIndex >= PLAN.length) return;
    const id = window.setTimeout(() => setPlanIndex((value) => value + 1), 2600);
    return () => window.clearTimeout(id);
  }, [livePlan, started, planIndex]);

  useEffect(
    () => () => {
      cancel.current?.();
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const base: ChatMessage[] = started
    ? [
        { id: "u0", role: "user", content: FIRST_QUESTION },
        { id: "a0", role: "assistant", content: <PlanMessage activeIndex={planIndex} /> },
        ...(planIndex >= PLAN.length ? [{ id: "a0-son", role: "assistant" as const, content: <LongAnswer /> }] : []),
      ]
    : [];
  const messages = [...base, ...extra];

  function send(text: string) {
    const replyId = `a-${Date.now()}`;
    setExtra((list) => [...list, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setThinking(true);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      setStreaming(true);
      const reply = REPLIES[replyCount.current % REPLIES.length];
      replyCount.current += 1;
      setExtra((list) => [...list, { id: replyId, role: "assistant", content: "" }]);
      cancel.current = streamText(
        reply,
        (partial) =>
          setExtra((list) => list.map((m) => (m.id === replyId ? { ...m, content: <Paragraphs text={partial} /> } : m))),
        () => {
          setStreaming(false);
          cancel.current = null;
        },
      );
    }, 700);
  }

  function stop() {
    cancel.current?.();
    cancel.current = null;
    if (timer.current) window.clearTimeout(timer.current);
    setThinking(false);
    setStreaming(false);
  }

  function reset() {
    stop();
    setExtra([]);
    setStarted(false);
    setPlanIndex(3);
  }

  const title = started ? "Destek Talepleri Özeti" : extra.length ? "Yeni Sohbet" : "Asistan";

  return (
    <Screen>
      <AppShell
        brand={BRAND}
        groups={NAV}
        current={ROUTES.asistan}
        user={USER}
        userAction={<SignOutButton />}
        className="h-dvh min-h-0"
      >
        <div className="flex h-full flex-col">
          <ContentBar title={title} meta={started ? "Bugün 14:20 · Fable 5" : undefined}>
            {started ? <IconButton icon={Share2} aria-label="Sohbeti Paylaş" size="sm" /> : null}
            <IconButton icon={SquarePen} aria-label="Yeni Sohbet" size="sm" onClick={reset} />
          </ContentBar>
          <div data-chat-scroll tabIndex={0} role="region" aria-label="Mesajlar" className="min-h-0 flex-1 overflow-y-auto">
            <ChatThread
              messages={messages}
              thinking={thinking}
              streaming={streaming}
              thinkingLabel="Düşünüyor…"
              empty={{
                title: "Bugün Ne Yapalım, Ahmet?",
                description: "Destek kayıtları, raporlar ve ekip notları bağlı. Bir soru sor ya da aşağıdaki işlerden birini seç.",
                suggestions: SUGGESTIONS,
                onSuggestion: send,
              }}
              className={messages.length || thinking ? "mx-auto max-w-2xl sm:px-6" : "h-full"}
            />
          </div>
          <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pb-3 sm:px-6 sm:pb-5">
            <ChatComposer
              onSend={send}
              onStop={stop}
              status={thinking || streaming ? "streaming" : "idle"}
              model={model}
              models={MODELS}
              onModelChange={setModel}
              onAttach={() => undefined}
              onVoice={() => undefined}
            />
            <p className="mt-2 text-center text-micro text-muted">
              Asistan hata yapabilir; sayıları kaynak kayıtlarla karşılaştır.
            </p>
          </div>
        </div>
      </AppShell>
      <ShellCommands />
    </Screen>
  );
}

const meta = {
  title: "Ekranlar/Uygulama/Yapay Zekâ Sohbeti",
  id: "ai-chat",
  component: ChatScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Uygulama kabuğu içinde ajan sohbeti: asistan mesajında ajan planı, altta giriş kutusu. Mesaj gönderince önce düşünüyor göstergesi, sonra yanıt kelime kelime akar; akarken gönder düğmesi Durdur olur. Telefonda kenar çubuğu alttan açılan çekmece.",
      },
      story: { inline: false, height: "48rem" },
    },
  },
  args: { start: "plan", livePlan: false },
  argTypes: { start: { control: "inline-radio", options: ["empty", "plan", "done"] } },
} satisfies Meta<typeof ChatScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentWorking: Story = { name: "Ajan Çalışıyor" };

export const Interactive: Story = {
  name: "Etkileşimli",
  args: { livePlan: true },
  parameters: {
    docs: { description: { story: "Plan kendiliğinden ilerler, bitince özet gelir. Bir mesaj yaz ve gönder: sahte yanıt akar, Durdur ile kesilir." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Mesaj"), "Kargo gecikmesini en üste al{Enter}");
    const log = canvas.getByRole("log");
    await expect(within(log).getByText("Kargo gecikmesini en üste al")).toBeInTheDocument();
    const reply = await within(log).findByText(/^Not aldım\./, {}, { timeout: 4000 });
    await waitFor(() => expect(reply).toBeVisible());
  },
};

export const EmptyChat: Story = {
  name: "Boş Sohbet",
  args: { start: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Bugün Ne Yapalım, Ahmet?" })).toBeVisible();
    await expect(canvas.getByRole("list", { name: "Öneriler" })).toBeVisible();
  },
};

export const ReportReady: Story = { name: "Rapor Hazır", args: { start: "done" } };
