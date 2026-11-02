"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { AgentPlan } from "@/components/ui/agent-plan";
import { Badge } from "@/components/ui/badge";
import { ChatComposer } from "@/components/ui/chat-composer";
import { ChatThread, type ChatMessage } from "@/components/ui/chat-thread";
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

function Drafts() {
  return (
    <div className="grid grid-cols-1 gap-3">
      <p>
        {DELAYED.length} geciken sipariş için taslaklar hazır. Her biri müşterinin açık talebine yanıt olarak eklendi; gönderilmeden önce
        onayını bekliyor.
      </p>
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
                {daysBetween(o.date, TODAY)} gün
              </Badge>
              {t ? <span className="sr-only">Bağlı talep {t.id}</span> : null}
            </li>
          );
        })}
      </ul>
      <a href={href("gelen", { etiket: "Gecikme" })} className="justify-self-start font-medium text-primary-ink underline underline-offset-4">
        Taslakları gelen kutusunda aç
      </a>
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
              <AgentPlan steps={PLAN_STEPS} activeIndex={planIndex} stepLabels={PLAN_LABELS} title="Geciken Siparişler" />
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
        description={fresh ? "Yeni sohbet" : `Geciken siparişler · bugün ${shortDate.format(TODAY)}`}
        actions={
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
        }
      />
      <div className="flex min-h-[40rem] flex-1 flex-col">
        <div className="flex-1">
          <ChatThread
            messages={fresh && extra.length === 0 ? [] : [...base, ...extra]}
            thinking={thinking}
            thinkingLabel="Asistan düşünüyor"
            empty={{
              title: "Bugün ne yapalım?",
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
