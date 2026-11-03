"use client";

import { AnimatePresence, m } from "motion/react";
import { ArrowUp, ChevronDown, Mic, Plus, Square } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Sohbet giriş kutusu: büyüyen metin alanı, altında ek (+), model seçici
 * hap, mikrofon ve yuvarlak gönder düğmesi. Yapay zekâ sohbeti, destek
 * kutusu, not alma. Tek satırlık arama için `search-bar` daha doğru.
 *
 * Klavye: Enter gönderir, Shift+Enter satır açar. IME ile yazarken
 * (`isComposing`) Enter seçimi onaylar, göndermez; yoksa Japonca/Çince
 * yazan kullanıcının yarım kelimesi gider.
 *
 * `status="streaming"`: gönder düğmesi DURDUR düğmesine dönüşür (aynı yer,
 * aynı boy; el aynı noktaya gider). Metin alanı kilitlenmez: kullanıcı
 * sıradaki mesajı yazmaya başlayabilir, Enter o sırada göndermez.
 *
 * Büyüme CSS ile (`field-sizing: content`, Chrome 123+, Safari 26+);
 * desteklemeyen tarayıcıda (Firefox) yükseklik girişte `scrollHeight`ten
 * hesaplanır. En fazla ~8 satır, sonra kayar.
 *
 * Model seçici menü (`dropdown-menu.tsx`, radyo öğeleri); `models`
 * verilmezse yalnız etiket olarak durur. `onAttach` / `onVoice`
 * verilmezse o düğme çizilmez: hiçbir şey yapmayan düğme bırakılmaz.
 *
 * Gönder birincil eylem: `bg-cta text-on-brand shadow-cta`; boşken soluk ve
 * devre dışı. Simge değişimi 0.85'ten gelen kısa bir ölçek + solma.
 */

type ChatComposerProps = {
  onSend: (text: string) => void;
  onStop?: () => void;
  status?: "idle" | "streaming";
  model: string;
  models?: readonly string[];
  onModelChange?: (model: string) => void;
  onAttach?: () => void;
  onVoice?: () => void;
  placeholder?: string;
  /** Metin alanının ekran okuyucu adı. */
  label?: string;
  disabled?: boolean;
  className?: string;
};

const MAX_HEIGHT = 208; // ~8 satır

export function ChatComposer({
  onSend,
  onStop,
  status = "idle",
  model,
  models,
  onModelChange,
  onAttach,
  onVoice,
  placeholder = "Bir şey sor ya da görev ver",
  label = "Mesaj",
  disabled = false,
  className,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const streaming = status === "streaming";
  const canSend = !disabled && !streaming && text.trim().length > 0;

  function grow() {
    const el = area.current;
    if (!el || CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (streaming) {
      onStop?.();
      return;
    }
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    requestAnimationFrame(() => {
      const el = area.current;
      if (el && !CSS.supports("field-sizing", "content")) el.style.height = "auto";
      el?.focus();
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!streaming) submit();
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-xl border border-line bg-overlay p-2 shadow-floating transition-[border-color,box-shadow] focus-within:border-line-focus focus-within:shadow-focus",
        className,
      )}
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        {label}
      </label>
      <textarea
        ref={area}
        id={`${id}-input`}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          grow();
        }}
        onKeyDown={onKeyDown}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        aria-describedby={`${id}-hint`}
        className="block max-h-52 min-h-11 w-full resize-none bg-transparent px-2.5 py-2 text-read leading-normal text-strong outline-none field-sizing-content placeholder:text-muted [&:focus-visible]:outline-none"
      />
      <span id={`${id}-hint`} className="sr-only">
        Enter gönderir, Shift artı Enter yeni satır açar.
      </span>

      <div className="mt-1 flex items-center gap-1">
        {onAttach ? (
          <button
            type="button"
            onClick={onAttach}
            aria-label="Dosya Ekle"
            title="Dosya Ekle"
            className="inline-grid size-11 place-items-center rounded-full text-body transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-9 [&_svg]:size-[1.125rem]"
          >
            <Plus aria-hidden strokeWidth={1.75} />
          </button>
        ) : null}

        {models && models.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Model: ${model}. Değiştir`}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-3 text-small font-medium text-strong transition-colors hover:bg-surface data-popup-open:bg-surface pointer-fine:min-h-8 [&_svg]:size-3.5 [&_svg]:text-muted"
            >
              {model}
              <ChevronDown aria-hidden strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top">
              {/* Etiket grubun İÇİNDE: Base UI GroupLabel bir grup bağlamı ister,
                  dışarıda kalınca menü açılır açılmaz "MenuGroupContext is missing"
                  (#31) fırlatır (Storybook hikâyesi yakaladı). */}
              <DropdownMenuRadioGroup value={model} onValueChange={(value) => onModelChange?.(value as string)}>
                <DropdownMenuLabel>Model</DropdownMenuLabel>
                {models.map((name) => (
                  <DropdownMenuRadioItem key={name} value={name}>
                    {name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-small font-medium text-body">
            {model}
          </span>
        )}

        <span className="flex-1" />

        {onVoice ? (
          <button
            type="button"
            onClick={onVoice}
            aria-label="Sesle Yaz"
            title="Sesle Yaz"
            className="inline-grid size-11 place-items-center rounded-full text-body transition-colors hover:bg-surface-raised hover:text-strong pointer-fine:size-9 [&_svg]:size-[1.125rem]"
          >
            <Mic aria-hidden strokeWidth={1.75} />
          </button>
        ) : null}

        <button
          type="submit"
          disabled={!streaming && !canSend}
          aria-label={streaming ? "Yanıtı Durdur" : "Gönder"}
          title={streaming ? "Yanıtı Durdur" : "Gönder"}
          className={cn(
            "relative inline-grid size-11 place-items-center rounded-full transition-[opacity,translate] active:translate-y-px pointer-fine:size-9 [&_svg]:size-[1.125rem]",
            streaming
              ? "bg-strong text-page"
              : "bg-cta text-on-brand shadow-cta disabled:opacity-40 disabled:shadow-none",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={streaming ? "stop" : "send"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: DUR.fast, ease: EASE }}
              className="inline-grid place-items-center"
            >
              {streaming ? (
                <Square aria-hidden className="!size-3 fill-current" strokeWidth={0} />
              ) : (
                <ArrowUp aria-hidden strokeWidth={2.25} />
              )}
            </m.span>
          </AnimatePresence>
        </button>
      </div>
    </form>
  );
}
