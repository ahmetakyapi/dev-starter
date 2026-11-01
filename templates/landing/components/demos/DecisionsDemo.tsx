"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { FeatureDemo } from "@/lib/content";
import { chartBg, initials, TILE } from "./styles";

type Decisions = Extract<FeatureDemo, { kind: "decisions" }>;

/*
 * Hikâye: "Karar notu harf harf silinir, yerine yenisi yazılır."
 * guides/04 § 14 kural 7: metin yalnızca konu oysa değişir; yazma 55 ms,
 * silme daha hızlı ama yine harf harf (düz silme değil). İmleç saniyede bir
 * yanıp söner (CSS, `.caret`).
 *
 * Dinlenme karesi ilk notun TAMAMI: sunucu çizimi ve hareketi azaltan
 * okuyucu yarım cümle görmez. Notun kutusu en uzun notun boyunu ayırır
 * (görünmez kopya): yazarken kart boyu zıplamaz.
 */
const HOLD_MS = 2800;
const ERASE_MS = 18;
const TYPE_MS = 55;

type Phase = "hold" | "erase" | "type";

export function DecisionsDemo({ demo }: { demo: Decisions }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.3 });
  const reduce = useMotionPreference();
  const [state, setState] = useState<{ index: number; length: number; phase: Phase }>({
    index: 0,
    length: demo.notes[0].text.length,
    phase: "hold",
  });

  useEffect(() => {
    if (!visible || reduce) return;
    const full = demo.notes[state.index].text.length;
    const delay = state.phase === "hold" ? HOLD_MS : state.phase === "erase" ? ERASE_MS : TYPE_MS;
    const timer = setTimeout(() => {
      setState(({ index, length, phase }) => {
        if (phase === "hold") return { index, length, phase: "erase" };
        if (phase === "erase") {
          if (length > 0) return { index, length: length - 1, phase };
          return { index: (index + 1) % demo.notes.length, length: 0, phase: "type" };
        }
        if (length + 1 >= full) return { index, length: full, phase: "hold" };
        return { index, length: length + 1, phase };
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, reduce, state, demo.notes]);

  const note = reduce ? demo.notes[0] : demo.notes[state.index];
  const shown = reduce ? note.text : note.text.slice(0, state.length);
  const longest = demo.notes.reduce((a, b) => (b.text.length > a.text.length ? b : a)).text;

  return (
    <div ref={ref} className={`flex h-full flex-col p-4 ${TILE}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-base font-semibold text-strong">{demo.task}</span>
        <span className="shrink-0 rounded-full bg-warning-wash px-2.5 py-0.5 text-small font-medium text-warning">{demo.status}</span>
      </div>
      <div className="mt-3 flex-1 border-t border-line-soft pt-3">
        <p className="text-small text-muted">{demo.noteTitle}</p>
        <div className="mt-1.5 grid text-base text-strong">
          <span aria-hidden className="invisible col-start-1 row-start-1">
            {longest}
          </span>
          <span className="col-start-1 row-start-1">
            {shown}
            <span className="caret ml-px inline-block h-[1.1em] w-px translate-y-[0.2em] bg-strong" />
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-small">
        <span className={`grid size-6 place-items-center rounded-full text-micro font-semibold text-chart-ink ${chartBg(demo.notes.indexOf(note) + 3)}`}>
          {initials(note.author)}
        </span>
        <span className="font-medium text-strong">{note.author}</span>
        <span className="ml-auto text-muted">{note.date}</span>
      </div>
    </div>
  );
}
