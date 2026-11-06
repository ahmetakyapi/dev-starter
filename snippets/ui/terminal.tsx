"use client";

import { useInView, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/**
 * Terminal: komutların yazıldığı, çıktının satır satır geldiği pencere.
 * Geliştirici aracının tanıtım sayfası ("üç komutta kurulum"), belgede
 * kurulum akışı, değişiklik günlüğünde yeni CLI bayrağı. Kopyalanacak tek
 * komut için `code-block` yeter; bu bileşen bir AKIŞI anlatır: komut,
 * bekleme, sonuç.
 *
 * OYNATMA: görünür olunca başlar (`startOnView`). Komut harf harf yazılır
 * (`typingSpeed` ms/harf), sonra çıktılar 220 ms arayla düşer. Bitince
 * "Yeniden Oynat" düğmesi gelir; döngü yok (WCAG 2.2.2: kendiliğinden
 * hareket eden içerik durdurulabilir olmalı, en kolayı hiç döngüye
 * girmemek).
 *
 * GÖRÜNÜŞ: board kuyusu (`bg-surface`), başlık çubuğunda üç nötr nokta;
 * trafik ışığı renkleri yok (sabit renk ve dikkat dağıtıcı). Komut satırı
 * `text-strong`, istem `text-primary-ink`, çıktı tonları `muted`, `success`,
 * `danger`. Kopyala düğmesi yalnız komutları kopyalar, istem ve çıktıyı değil.
 *
 * ERİŞİLEBİLİRLİK: canlandırılan katman `aria-hidden`; ekran okuyucu
 * dökümün tamamını baştan, tek seferde okur (`sr-only` liste). Hareketi
 * azaltan kullanıcıda bütün satırlar doğrudan çizilir.
 *
 *   <Terminal title="kurulum" lines={[{ kind: "command", text: "npm i @ahmetakyapi/ui" }, { kind: "output", text: "eklendi 3 paket", tone: "success" }]} />
 */

export type TerminalLine =
  | { kind: "command"; text: string }
  | { kind: "output"; text: string; tone?: "muted" | "body" | "success" | "danger" }
  | { kind: "comment"; text: string };

const TONE = { muted: "text-muted", body: "text-body", success: "text-success", danger: "text-danger" } as const;
const OUTPUT_GAP = 220;
const COMMAND_PAUSE = 420;

type TerminalProps = {
  lines: readonly TerminalLine[];
  title?: string;
  prompt?: string;
  /** Harf başına milisaniye. */
  typingSpeed?: number;
  startOnView?: boolean;
  copyable?: boolean;
  className?: string;
};

/** Oynatma durumu: kaç satır bitti, yazılmakta olan komutun kaç harfi göründü. */
type Cursor = { line: number; chars: number };

export function Terminal({
  lines,
  title = "terminal",
  prompt = "$",
  typingSpeed = 32,
  startOnView = true,
  copyable = true,
  className,
}: TerminalProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [cursor, setCursor] = useState<Cursor>({ line: 0, chars: 0 });
  const playing = !reduce && (startOnView ? inView : true);
  const done = reduce || cursor.line >= lines.length;

  useEffect(() => {
    if (!playing || cursor.line >= lines.length) return;
    const line = lines[cursor.line];
    let delay: number;
    let next: Cursor;
    if (line.kind === "command" && cursor.chars < line.text.length) {
      delay = cursor.chars === 0 ? COMMAND_PAUSE : typingSpeed;
      next = { line: cursor.line, chars: cursor.chars + 1 };
    } else {
      delay = line.kind === "command" ? COMMAND_PAUSE : OUTPUT_GAP;
      next = { line: cursor.line + 1, chars: 0 };
    }
    const id = window.setTimeout(() => setCursor(next), delay);
    return () => window.clearTimeout(id);
  }, [cursor, lines, playing, typingSpeed]);

  const commands = lines.filter((l) => l.kind === "command").map((l) => l.text).join("\n");
  const visible = done ? lines.length : cursor.line + 1;

  return (
    <div ref={ref} role="group" aria-label={title} className={cn("overflow-hidden rounded-xl bg-surface edge-lit", className)}>
      <div className="flex h-10 items-center gap-3 border-b border-line px-4">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="flex-1 truncate text-center font-mono text-micro text-muted">{title}</span>
        <span className="flex items-center gap-1">
          {done && !reduce ? (
            <button
              type="button"
              onClick={() => setCursor({ line: 0, chars: 0 })}
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-overlay hover:text-strong"
              aria-label="Yeniden Oynat"
            >
              <RotateCcw aria-hidden className="size-3.5" />
            </button>
          ) : null}
          {copyable && commands ? <CopyButton value={commands} label="Komutları Kopyala" className="size-8" /> : null}
        </span>
      </div>

      <ol className="sr-only">
        {lines.map((l, i) => (
          <li key={i}>{l.kind === "command" ? `${prompt} ${l.text}` : l.text}</li>
        ))}
      </ol>

      <div aria-hidden className="min-h-24 overflow-x-auto px-4 py-3.5 font-mono text-small leading-relaxed">
        {lines.slice(0, visible).map((l, i) => {
          const current = !done && i === cursor.line;
          if (l.kind === "command") {
            const text = current ? l.text.slice(0, cursor.chars) : l.text;
            return (
              <div key={i} className="whitespace-pre text-strong">
                <span className="text-primary-ink select-none">{prompt} </span>
                {text}
                {current ? <span className="ui-term-caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] bg-strong" /> : null}
              </div>
            );
          }
          if (current) return null;
          return (
            <div key={i} className={cn("whitespace-pre", l.kind === "comment" ? "text-muted italic" : TONE[l.tone ?? "muted"])}>
              {l.kind === "comment" ? `# ${l.text}` : l.text}
            </div>
          );
        })}
        {done ? (
          <div className="whitespace-pre text-strong">
            <span className="text-primary-ink">{prompt} </span>
            <span className="ui-term-caret inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] bg-strong" />
          </div>
        ) : null}
      </div>
      <style href="ui-terminal" precedence="default">
        {`@keyframes ui-caret { 50% { opacity: 0; } } .ui-term-caret { animation: ui-caret 1.05s steps(1) infinite; } @media (prefers-reduced-motion: reduce) { .ui-term-caret { animation: none; } }`}
      </style>
    </div>
  );
}
