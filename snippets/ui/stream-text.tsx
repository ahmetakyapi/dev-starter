"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Akan metin: modelin parça parça gelen yanıtı. Yalnız YENİ gelen sözcükler
 * belirir (solma ya da bulanıktan netleşme); önceden gelmiş metin hiç
 * kıpırdamaz, satır zıplamaz. Akış sürerken sonda yanıp sönen imleç.
 *
 * NASIL: metin sözcüklere bölünür, her sözcük sıra numarasıyla anahtarlanır.
 * React var olan sözcüğü yeniden çizmez; CSS animasyonu yalnız yeni takılan
 * öğede çalışır. Aynı parçada gelen sözcükler 24 ms arayla (en çok 12
 * adım): büyük parça tek blok halinde düşmesin.
 *
 * ERİŞİLEBİLİRLİK: sözcükler gerçek metin (aria-hidden değil). Akış
 * sürerken kap `aria-busy`; her parçayı okutmak gürültü, mesaj listesi
 * (`chat-thread`, `role="log"`) bitince okutur. Hareketi azaltan
 * kullanıcıda sözcükler doğrudan çizilir, imleç yanıp sönmez.
 *
 *   <StreamText text={partial} streaming={!done} />
 */

const CSS = `
@keyframes ui-stream-fade { from { opacity: 0; } }
@keyframes ui-stream-blur { from { opacity: 0; filter: blur(4px); translate: 0 2px; } }
@keyframes ui-stream-caret { 50% { opacity: 0; } }
.ui-stream-word { animation: var(--stream-anim) 0.42s var(--ease-brand) both; animation-delay: var(--stream-delay, 0ms); }
.ui-stream-caret { display: inline-block; width: 0.5em; height: 1em; margin-left: 2px; translate: 0 0.15em; border-radius: 1px;
  background: currentColor; opacity: 0.6; animation: ui-stream-caret 1s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .ui-stream-word, .ui-stream-caret { animation: none; } }`;

const STEP_MS = 24;
const MAX_STEPS = 12;

type StreamTextProps = {
  text: string;
  streaming?: boolean;
  effect?: "fade" | "blur";
  as?: ElementType;
  className?: string;
};

export function StreamText({ text, streaming = false, effect = "blur", as: Tag = "p", className }: StreamTextProps) {
  const parts = text.split(/(\s+)/);
  const seen = useRef(0);
  const before = seen.current;
  useEffect(() => {
    seen.current = parts.length;
  });

  return (
    <>
      <style href="ui-stream-text" precedence="default">
        {CSS}
      </style>
      <Tag
        aria-busy={streaming || undefined}
        className={cn("whitespace-pre-wrap", className)}
        style={{ "--stream-anim": effect === "blur" ? "ui-stream-blur" : "ui-stream-fade" } as CSSProperties}
      >
        {parts.map((part, i) =>
          /^\s+$/.test(part) || part === "" ? (
            part
          ) : (
            <span
              key={i}
              className="ui-stream-word"
              style={{ "--stream-delay": `${Math.min(Math.max(0, i - before) / 2, MAX_STEPS) * STEP_MS}ms` } as CSSProperties}
            >
              {part}
            </span>
          ),
        )}
        {streaming ? <span aria-hidden className="ui-stream-caret" /> : null}
      </Tag>
    </>
  );
}
