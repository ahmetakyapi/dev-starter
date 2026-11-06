"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { cn } from "@/lib/utils";

/**
 * Düşünce bloğu: modelin yanıttan önceki akıl yürütmesi. Akarken açık ve
 * canlı ("Düşünüyor · 4 sn", saniye işler), bitince kendiliğinden kapanıp
 * tek satıra iner: "6 sn düşündü". Kullanıcı isterse açıp okur; yanıtın
 * önünde uzun bir metin duvarı kalmaz.
 *
 * KULLANICI KARARI KAZANIR: akış sürerken bloğu kapatan ya da bittikten
 * sonra açan kullanıcının seçimine dokunulmaz; kendiliğinden kapanma yalnız
 * kullanıcı hiç dokunmadıysa.
 *
 * İçerik `text-muted`, solda yuvarlaksız ince çizgi (alıntı gibi;
 * kartın tek kenarında renkli şerit değil). Başlık düğmesi `aria-expanded`;
 * akış bitince "6 sn düşündü" canlı bölgede bir kez okunur. Hareketi
 * azaltan kullanıcıda parıltı düz metin olur.
 *
 *   <Reasoning streaming={isThinking} startedAt={t0}>{thoughts}</Reasoning>
 */

type ReasoningProps = {
  children: ReactNode;
  streaming: boolean;
  /** Akışın başladığı an (`Date.now()`); verilmezse bileşen ilk çizimde sayar. */
  startedAt?: number;
  /** Bitmiş bir düşüncenin süresi (saniye); geçmiş mesajda sayaç yerine. */
  durationSec?: number;
  className?: string;
};

export function Reasoning({ children, streaming, startedAt, durationSec, className }: ReasoningProps) {
  const [open, setOpen] = useState(streaming);
  const touched = useRef(false);
  const start = useRef(startedAt ?? 0);
  const [elapsed, setElapsed] = useState(durationSec ?? 0);

  useEffect(() => {
    if (!streaming) return;
    if (!start.current) start.current = startedAt ?? Date.now();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - start.current) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [streaming, startedAt]);

  // Akış bitince kapan; kullanıcı elle açıp kapattıysa onun kararı kalır.
  const [wasStreaming, setWasStreaming] = useState(streaming);
  if (wasStreaming !== streaming) {
    setWasStreaming(streaming);
    if (!touched.current) setOpen(streaming);
  }

  const seconds = durationSec ?? elapsed;
  const done = `${seconds} sn düşündü`;

  return (
    <div className={cn("grid gap-2", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          touched.current = true;
          setOpen((v) => !v);
        }}
        className="inline-flex min-h-9 items-center gap-1.5 justify-self-start rounded-md pr-2 text-small text-muted hover:text-strong"
      >
        {streaming ? <TextShimmer>{`Düşünüyor · ${seconds} sn`}</TextShimmer> : <span>{done}</span>}
        <ChevronRight aria-hidden className={cn("size-3.5 transition-[rotate] duration-200", open && "rotate-90")} />
      </button>
      <span role="status" className="sr-only">
        {streaming ? "" : done}
      </span>
      {open ? <div className="border-l border-line-strong pl-4 text-small leading-relaxed text-muted">{children}</div> : null}
    </div>
  );
}
