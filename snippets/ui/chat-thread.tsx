"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Sohbet akışı: mesaj listesi, "Düşünüyor…" göstergesi ve boş durum.
 * `chat-composer.tsx` ile birlikte; ajanın planı asistan mesajının içine
 * `agent-plan.tsx` olarak girer (`content` bir ReactNode).
 *
 * Görsel dil: KULLANICI balonu sağda beyaz karo (kıl halkası + kısa gölge),
 * ASİSTAN metni balonsuz, sayfanın gövde metni gibi. Uzun yanıt bir
 * balonun içinde okunmaz; balon yalnız "bunu ben yazdım" işaretidir.
 *
 * Kaydırma: yeni mesaj gelince liste sona iner, ama YALNIZ kullanıcı zaten
 * sondaysa (son 120 piksel). Yukarıda eski bir yanıtı okuyan kullanıcıyı
 * aşağı çekmek okumayı böler. Kaydıran kap (genelde içerik alanı) bunu
 * bilsin diye `data-chat-scroll` özniteliğini taşır; yoksa otomatik
 * kaydırma yapılmaz, liste yine çalışır.
 *
 * Erişilebilirlik: liste `role="log"` (yeni öğeler kibarca okunur, eskiler
 * tekrar okunmaz); yanıt akarken `aria-busy` (yarım cümleler tek tek
 * okunmasın). Her mesajın başında gizli "Sen:" / "Asistan:" etiketi; konum
 * (sağ/sol) tek işaret değil. Düşünüyor göstergesi `role="status"`; nokta
 * dalgası hareketi azaltan kullanıcıda durağan üç nokta.
 *
 * Boş durum: ortada başlık + açıklama + öneri hapları. Hap metni olduğu
 * gibi `onSuggestion`a gider (çoğunlukla doğrudan gönderilir).
 */

export type ChatMessage = { id: string; role: "user" | "assistant"; content: ReactNode };

type ChatThreadProps = {
  messages: readonly ChatMessage[];
  thinking?: boolean;
  thinkingLabel?: string;
  /** Yanıt akıyor (metin parça parça geliyor). */
  streaming?: boolean;
  empty?: {
    title: ReactNode;
    description?: ReactNode;
    suggestions?: readonly string[];
    onSuggestion?: (text: string) => void;
  };
  label?: string;
  className?: string;
};

export function ChatThread({
  messages,
  thinking = false,
  thinkingLabel = "Düşünüyor…",
  streaming = false,
  empty,
  label = "Sohbet",
  className,
}: ChatThreadProps) {
  const end = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  useEffect(() => {
    const target = end.current;
    const scroller = target?.closest<HTMLElement>("[data-chat-scroll]") ?? null;
    if (!target || !scroller) return;
    const onScroll = () => {
      atBottom.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const target = end.current;
    const scroller = target?.closest<HTMLElement>("[data-chat-scroll]");
    if (!target || !scroller || !atBottom.current) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  if (messages.length === 0 && !thinking && empty) {
    return (
      <div className={cn("flex min-h-full flex-col items-center justify-center px-4 py-12 text-center", className)}>
        <h2 className="text-heading font-semibold tracking-tight text-balance text-strong">{empty.title}</h2>
        {empty.description ? <p className="mt-2 max-w-md text-read text-pretty text-body">{empty.description}</p> : null}
        {empty.suggestions?.length ? (
          <ul className="mt-6 flex max-w-lg flex-wrap justify-center gap-2" aria-label="Öneriler">
            {empty.suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => empty.onSuggestion?.(suggestion)}
                  className="min-h-11 rounded-full border border-line bg-overlay px-4 text-base text-strong shadow-raised transition-[border-color,translate] hover:border-line-strong active:translate-y-px pointer-fine:min-h-9"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("px-4 py-6", className)}>
      <div role="log" aria-label={label} aria-busy={streaming || undefined} className="grid gap-6">
        {messages.map((message) => (
          <m.div
            key={message.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE }}
            className={cn("min-w-0", message.role === "user" && "flex justify-end")}
          >
            {message.role === "user" ? (
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-overlay px-4 py-2.5 text-read text-strong shadow-raised ring-1 ring-line sm:max-w-[75%]">
                <span className="sr-only">Sen: </span>
                {message.content}
              </div>
            ) : (
              <div className="text-read text-body [&_strong]:font-semibold [&_strong]:text-strong">
                <span className="sr-only">Asistan: </span>
                {message.content}
              </div>
            )}
          </m.div>
        ))}
        {thinking ? <Thinking label={thinkingLabel} /> : null}
      </div>
      <div ref={end} aria-hidden />
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  const reduce = useReducedMotion();
  return (
    <div role="status" className="flex items-center gap-2.5 text-base text-muted">
      <span aria-hidden className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <m.span
            key={dot}
            className="size-1.5 rounded-full bg-muted"
            animate={reduce ? undefined : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={reduce ? undefined : { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: dot * 0.15 }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}
