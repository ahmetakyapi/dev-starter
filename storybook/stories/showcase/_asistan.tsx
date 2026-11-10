"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { AgentPlan } from "@/components/ui/agent-plan";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
import { CompareSlider } from "@/components/ui/compare-slider";
import { Reasoning } from "@/components/ui/reasoning";
import { StreamText } from "@/components/ui/stream-text";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ThinkingOrb } from "@/components/ui/thinking-orb";
import { ToolCall, type ToolCallStatus } from "@/components/ui/tool-call";
import { Button } from "@/components/ui/Button";
import {
  ASSISTANT_MODELS,
  DELAYED,
  OPEN_TICKETS,
  PLAN_STEPS,
  PRIORITIES,
  SUGGESTIONS,
  TICKETS,
  customer,
  daysBetween,
  num,
  periodStats,
  shortDate,
  tl,
  TODAY,
} from "./_data";
import { PageBar, href, useApp } from "./_ui";

const PLAN_LABELS = PLAN_STEPS.map((s) => s.title);
const STEP_MS = 2400;

/** Asistanın yanıtı: sorudaki anahtar sözcüğe göre, panodaki sayılarla. */
function answer(text: string): string {
  const q = text.toLocaleLowerCase("tr-TR");
  if (q.includes("satış") || q.includes("ciro")) {
    const s = periodStats("hafta");
    const top = s.byCustomer[0];
    return `Son 7 günde ${num.format(s.orderCount)} sipariş ve ${tl.format(s.revenue)} ciro var; önceki haftaya göre %${(s.revenueChange ?? 0).toLocaleString("tr-TR")}. En çok alan ${top.customer.name} (${tl.format(top.revenue)}). Ayrıntı Pano'da, aynı dönemle.`;
  }
  if (q.includes("talep") || q.includes("öncelik")) {
    const parts = PRIORITIES.map((p) => `${OPEN_TICKETS.filter((t) => t.priority === p).length} ${p.toLocaleLowerCase("tr-TR")}`);
    return `${num.format(OPEN_TICKETS.length)} talep yanıt bekliyor: ${parts.join(", ")}. İlk sıraya ${OPEN_TICKETS[0].id} (“${OPEN_TICKETS[0].subject}”) koydum.`;
  }
  if (q.includes("teklif") || q.includes("atlas")) {
    return "Atlas Konaklama'nın son 12 aydaki ortalama siparişi üzerinden 420 oda için havlu ve nevresim tablosunu çıkarıyorum; Mert'in taslağına ekleyeceğim.";
  }
  return "Not aldım. Taslakları onayladıktan sonra bunu da yaparım.";
}

/** İlk taslak: hazır şablon ile asistanın siparişe göre yazdığı metin. */
function DraftCompare() {
  const order = DELAYED[0];
  const c = customer(order.customerId);
  const days = daysBetween(order.date, TODAY);
  const mail = (tone: "template" | "assistant") => (
    <div className={tone === "template" ? "bg-surface-sunken p-4 pt-12" : "bg-overlay p-4 pt-12"}>
      <p className="text-small text-muted">Kime: {c.contact}</p>
      <p className="mt-2 text-base text-strong">
        {tone === "template"
          ? "Sayın müşterimiz, siparişiniz kargoya verilmiştir. Gecikme için özür dileriz. İyi günler."
          : `Merhaba ${c.contact.split(" ")[0]}, ${order.id} numaralı siparişiniz aktarma merkezinde ${days} gündür bekliyor. Kargo firmasıyla görüştük, yarın dağıtıma çıkacak; takip bağlantısını akşam ileteceğim.`}
      </p>
    </div>
  );
  return (
    <CompareSlider
      label="İlk taslak, şablon ve asistan"
      beforeLabel="Şablon"
      afterLabel="Asistan"
      defaultValue={42}
      before={mail("template")}
      after={mail("assistant")}
    />
  );
}

/** Metni sözcük sözcük büyütür: gerçek akıştaki gibi parça parça gelir, bitince durur. */
function useStreamed(full: string, wordsPerTick = 2, tickMs = 70) {
  const words = full.split(" ");
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= words.length) return;
    const id = window.setTimeout(() => setCount((n) => Math.min(words.length, n + wordsPerTick)), tickMs);
    return () => window.clearTimeout(id);
  }, [count, words.length, wordsPerTick, tickMs]);
  return { text: words.slice(0, count).join(" "), streaming: count < words.length };
}

const DRAFTS_INTRO = `${DELAYED.length} geciken sipariş için taslaklar hazır. Her biri müşterinin açık talebine yanıt olarak eklendi; gönderilmeden önce onayını bekliyor.`;

/** Gönderim aracı: model e-postayı kendisi göndermez, onay kullanıcıda (rules/agentic-ui.md). */
function SendApproval() {
  const [state, setState] = useState<"pending" | "sent" | "rejected">("pending");
  if (state === "rejected") {
    return <p className="text-small text-muted">Gönderim iptal edildi; taslaklar Gelen Kutusunda duruyor.</p>;
  }
  return (
    <ToolCall
      name="email.send"
      label="Bilgi E-postalarını Gönder"
      status={state === "sent" ? "success" : "pending"}
      durationMs={state === "sent" ? 900 : undefined}
      input={{ alici: DELAYED.map((o) => customer(o.customerId).contact), adet: DELAYED.length }}
      output={state === "sent" ? `${DELAYED.length} e-posta gönderildi, bağlı taleplere yanıt olarak eklendi.` : undefined}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => setState("rejected")}>
            Reddet
          </Button>
          <Button size="sm" onClick={() => setState("sent")}>
            Onayla ve Gönder
          </Button>
        </>
      }
    />
  );
}

function Drafts() {
  const intro = useStreamed(DRAFTS_INTRO);
  return (
    <div className="grid grid-cols-1 gap-3">
      <StreamText text={intro.text} streaming={intro.streaming} effect="fade" />
      <ul className="grid grid-cols-1 gap-1.5">
        {DELAYED.map((o) => {
          const c = customer(o.customerId);
          const t = TICKETS.find((x) => x.orderId === o.id);
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-overlay px-3 py-2 shadow-raised">
              <span className="font-medium text-strong">{c.contact}</span>
              <span className="text-small text-muted">
                {c.name} · {o.id} · {tl.format(o.total)}
              </span>
              <Badge tone="danger" className="ml-auto">
                {daysBetween(o.date, TODAY)} Gün
              </Badge>
              {t ? <span className="sr-only">Bağlı talep {t.id}</span> : null}
            </li>
          );
        })}
      </ul>
      <DraftCompare />
      <SendApproval />
      <a href={href("inbox", { tag: "gecikme" })} className="justify-self-start font-medium text-primary-ink underline underline-offset-4">
        Taslakları Gelen Kutusunda Aç
      </a>
    </div>
  );
}

const THOUGHT = `${num.format(OPEN_TICKETS.length)} açık talebin bir kısmı kargo sorusu; önce bunları siparişlerle eşleştirmeliyim. Teslim tarihi geçen ${DELAYED.length} sipariş var, en eskisi ${DELAYED[0].id}. Her müşteriye aynı şablonu göndermek yerine siparişin nerede beklediğini yazarsam ikinci bir talep açılmaz.`;

/** Planın adımlarına bağlı araç çağrıları: model ne yaptığını gösterir. */
function PlanTools({ planIndex }: { planIndex: number }) {
  const status = (step: number): ToolCallStatus => (planIndex > step ? "success" : "running");
  return (
    <div className="grid grid-cols-1 gap-2">
      <ToolCall
        name="tickets.list"
        label="Açık Talepler"
        status={status(0)}
        durationMs={640}
        input={{ durum: "açık" }}
        output={{ talep: OPEN_TICKETS.length }}
      />
      {planIndex >= 2 ? (
        <ToolCall
          name="shipping.track"
          label="Kargo Takibi"
          status={status(2)}
          durationMs={1180}
          input={{ siparis: DELAYED.map((o) => o.id) }}
          output={{ gecikmede: DELAYED.length }}
        />
      ) : null}
      {planIndex >= 4 ? (
        <ToolCall
          name="email.draft"
          label="E-posta Taslakları"
          status={status(4)}
          durationMs={2310}
          input={{ siparis: DELAYED.map((o) => o.id), ton: "bilgilendirme" }}
          output={{ taslak: DELAYED.length }}
        />
      ) : null}
    </div>
  );
}

export function AsistanPage() {
  const [planIndex, setPlanIndex] = useState(1);
  const [extra, setExtra] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [model, setModel] = useState<string>(ASSISTANT_MODELS[0]);
  const timer = useRef<number | null>(null);

  // Plan canlı bir ajan gibi kendiliğinden ilerler, sonda durur.
  useEffect(() => {
    if (fresh || planIndex >= PLAN_STEPS.length) return;
    const id = window.setTimeout(() => setPlanIndex((i) => i + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [planIndex, fresh]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const done = planIndex >= PLAN_STEPS.length;
  const base: ChatMessage[] = fresh
    ? []
    : [
        { id: "u1", role: "user", content: "Geciken siparişleri bul ve müşterilere durum e-postası taslağı hazırla." },
        {
          id: "a1",
          role: "assistant",
          content: (
            <div className="grid grid-cols-1 gap-3">
              <p>
                Yanıt bekleyen {num.format(OPEN_TICKETS.length)} talebe ve son 8 günün siparişlerine bakıyorum. Kargo durumu teslim tarihini geçenleri
                ayırıp her müşteri için kısa bir bilgi e-postası yazacağım.
              </p>
              <Reasoning streaming={!done}>{THOUGHT}</Reasoning>
              <BorderBeam active={!done} className="rounded-xl">
                <AgentPlan steps={PLAN_STEPS} activeIndex={planIndex} stepLabels={PLAN_LABELS} title="Geciken Siparişler" />
              </BorderBeam>
              <PlanTools planIndex={planIndex} />
              {done ? null : <TextShimmer live className="text-small">Taslaklar yazılıyor…</TextShimmer>}
            </div>
          ),
        },
        ...(done ? [{ id: "a2", role: "assistant" as const, content: <Drafts /> }] : []),
      ];

  function send(text: string) {
    setFresh(false);
    setExtra((list) => [...list, { id: `u-${list.length}`, role: "user", content: text }]);
    setThinking(true);
    timer.current = window.setTimeout(() => {
      setExtra((list) => [...list, { id: `a-${list.length}`, role: "assistant", content: answer(text) }]);
      setThinking(false);
    }, 1200);
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Asistan"
        description={fresh ? "Yeni Sohbet" : `Geciken Siparişler · Bugün ${shortDate.format(TODAY)}`}
        actions={
          <>
            <ThinkingOrb
              state={thinking || (!fresh && !done) ? "thinking" : "idle"}
              size={32}
              label={thinking || (!fresh && !done) ? "Asistan çalışıyor" : "Asistan hazır"}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFresh(true);
                setExtra([]);
                setThinking(false);
              }}
            >
              <MessageSquarePlus aria-hidden />
              Yeni Sohbet
            </Button>
          </>
        }
      />
      <div className="flex min-h-[40rem] flex-1 flex-col">
        <div className="flex-1">
          <ChatThread
            messages={fresh && extra.length === 0 ? [] : [...base, ...extra]}
            thinking={thinking}
            thinkingLabel="Asistan düşünüyor"
            empty={{
              title: "Bugün Ne Yapalım?",
              description: "Pusula'daki siparişler, talepler ve takvim üzerinde çalışabilirim.",
              suggestions: SUGGESTIONS,
              onSuggestion: send,
            }}
            className="mx-auto h-full max-w-3xl"
          />
        </div>
        <div className="sticky bottom-0 mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4 sm:pb-4">
          <ChatComposer
            onSend={send}
            onStop={() => {
              if (timer.current) window.clearTimeout(timer.current);
              setThinking(false);
            }}
            status={thinking ? "streaming" : "idle"}
            model={model}
            models={ASSISTANT_MODELS}
            onModelChange={setModel}
            onAttach={() => undefined}
            placeholder="Asistana yaz: “Bu haftanın satış özetini çıkar”"
          />
        </div>
      </div>
    </div>
  );
}
