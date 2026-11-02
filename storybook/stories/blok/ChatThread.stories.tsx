import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { ChatThread } from "@/components/ui/chat-thread";
import { Cell, Gallery } from "../_lib/Frame";
import { SUGGESTIONS } from "./_shared";
import { CONVERSATION, FIRST_QUESTION, LongAnswer } from "./thread-data";

const onSuggestion = fn();

const EMPTY = {
  title: "Bugün ne yapalım?",
  description: "Bir soru sor ya da aşağıdaki işlerden birini seç.",
  suggestions: SUGGESTIONS,
  onSuggestion,
};

/** Kaydıran kap: `data-chat-scroll` taşır ki yeni mesajda liste sona insin. */
function Pane({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div className="w-[min(100vw-2rem,48rem)] rounded-2xl bg-surface p-2">
      <div
        data-chat-scroll
        tabIndex={0}
        role="region"
        aria-label="Mesajlar"
        className={tall ? "h-[36rem] overflow-y-auto rounded-xl bg-overlay shadow-raised ring-1 ring-line" : "h-[26rem] overflow-y-auto rounded-xl bg-overlay shadow-raised ring-1 ring-line"}
      >
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: "Bloklar/Mesaj Akışı",
  id: "blocks-chat-thread",
  component: ChatThread,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Mesaj akışı: kullanıcı balonu sağda beyaz karo, asistan metni balonsuz. `role=\"log\"`, akarken `aria-busy`; yeni mesajda yalnız kullanıcı zaten sondaysa aşağı kayar. Boş durumda başlık, açıklama ve tek dokunuşla gönderilen öneriler. Ajan planı asistan mesajının içine `agent-plan` olarak girer.",
      },
    },
  },
  args: {
    messages: CONVERSATION,
    thinking: false,
    thinkingLabel: "Düşünüyor…",
    streaming: false,
    label: "Sohbet",
  },
  argTypes: {
    messages: { control: false },
    empty: { control: false },
  },
  render: (args) => (
    <Pane>
      <ChatThread {...args} className={args.messages.length ? "mx-auto max-w-2xl" : "h-full"} />
    </Pane>
  ),
} satisfies Meta<typeof ChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = { name: "Konuşma" };

export const EmptyState: Story = {
  name: "Boş Durum",
  args: { messages: [], empty: EMPTY },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: SUGGESTIONS[1] }));
    await expect(onSuggestion).toHaveBeenCalledWith(SUGGESTIONS[1]);
  },
};

export const Thinking: Story = {
  name: "Düşünüyor",
  args: {
    messages: [{ id: "u1", role: "user", content: FIRST_QUESTION }],
    thinking: true,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Düşünüyor…");
  },
};

export const LongReply: Story = {
  name: "Uzun Yanıt",
  args: {
    messages: [
      { id: "u1", role: "user", content: FIRST_QUESTION },
      { id: "a1", role: "assistant", content: <LongAnswer /> },
      { id: "u2", role: "user", content: "Kargo gecikmesi için bilgilendirme metnini de taslak olarak yazar mısın? Kısa ve özür dileyen bir ton olsun." },
    ],
    thinking: true,
    thinkingLabel: "Taslak yazılıyor…",
  },
  render: (args) => (
    <Pane tall>
      <ChatThread {...args} className="mx-auto max-w-2xl" />
    </Pane>
  ),
};

export const Streaming: Story = {
  name: "Yanıt Akıyor",
  parameters: { docs: { description: { story: "`streaming`: log `aria-busy` taşır; yarım cümleler tek tek okunmaz." } } },
  args: {
    messages: [
      { id: "u1", role: "user", content: "İade süresini kısaltmak için ne önerirsin?" },
      { id: "a1", role: "assistant", content: "İade onayından sonra ödemeyi aynı gün başlatmak ve müşteriye durum sayfası" },
    ],
    streaming: true,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("log")).toHaveAttribute("aria-busy", "true");
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: (args) => (
    <Gallery cols={2}>
      <Cell label="Boş durum + öneriler" className="block p-2">
        <div className="h-80 rounded-xl bg-overlay shadow-raised ring-1 ring-line">
          <ChatThread {...args} messages={[]} empty={EMPTY} className="h-full" label="Sohbet: boş" />
        </div>
      </Cell>
      <Cell label="Düşünüyor" className="block p-2">
        <div className="h-80 overflow-y-auto rounded-xl bg-overlay shadow-raised ring-1 ring-line">
          <ChatThread {...args} messages={[{ id: "u1", role: "user", content: FIRST_QUESTION }]} thinking label="Sohbet: düşünüyor" />
        </div>
      </Cell>
    </Gallery>
  ),
};
