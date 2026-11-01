"use client";

import { Settings } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Ayarlar penceresi: solda sekme listesi (Genel, Görünüm, Bildirimler…),
 * sağda o bölümün satırları. Sayfa değiştirmeden açılan, anında etki eden
 * tercihler için. Ayar sayfası çok uzunsa ya da derin bağlantı gerekiyorsa
 * ayrı bir rota (`/ayarlar/[bolum]`) ve `tabs.tsx → TabLinks` daha doğru.
 *
 * Temel `dialog.tsx`: odak tuzağı, Escape, odak dönüşü ve kaydırma kilidi
 * oradan. Sekme listesi gri bir KUYU, seçili sekme içinde beyaz KARO
 * (board dili); diyalog zaten beyaz olduğu için karo ancak kuyunun içinde
 * okunur.
 *
 * Telefonda (< sm) liste ÜSTTE yatay kayar; masaüstünde solda dikey durur.
 * Klavye her iki yönü de kabul eder (←/→ ve ↑/↓, Home/End): ekran
 * genişliğine göre değişen bir tuş haritası kullanıcıyı şaşırtır.
 * `aria-orientation` görünüme göre değil masaüstü düzenine göre "vertical".
 *
 * Paneller gizlenir, sökülmez (`hidden`): sekme değiştirince yarım kalan
 * bir alan sıfırlanmaz. Satırlar için `SettingsSection` + mevcut
 * `switch.tsx` ve `select.tsx`; anahtar anında uygular, Kaydet düğmesi yok.
 *
 * Kontrollü (`open` + `onOpenChange`) ya da kendi düğmesiyle
 * (`triggerLabel`) kullanılır.
 */

export type SettingsTab = { value: string; label: string; icon?: ReactNode; content: ReactNode };

type SettingsDialogProps = {
  tabs: readonly SettingsTab[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Kontrolsüz kullanımda tetikleyici düğmenin metni. */
  triggerLabel?: string;
  title?: string;
  description?: string;
  defaultTab?: string;
};

export function SettingsDialog({
  tabs,
  open,
  onOpenChange,
  triggerLabel = "Ayarlar",
  title = "Ayarlar",
  description,
  defaultTab,
}: SettingsDialogProps) {
  const [ownOpen, setOwnOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : ownOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.value);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const id = useId();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.value === active);
    const last = tabs.length - 1;
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    const next = forward
      ? (index + 1) % tabs.length
      : back
        ? (index - 1 + tabs.length) % tabs.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? last
            : -1;
    if (next < 0) return;
    event.preventDefault();
    const target = tabs[next];
    setActive(target.value);
    const node = refs.current.get(target.value);
    node?.focus();
    // Telefonda yatay listede seçilen sekme görünür kalsın.
    node?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <>
      {controlled ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-overlay px-3.5 text-base font-medium text-strong shadow-raised transition-[border-color,background-color] hover:border-line-strong active:translate-y-px pointer-fine:min-h-10 [&_svg]:size-4 [&_svg]:text-muted"
        >
          <Settings aria-hidden strokeWidth={1.75} />
          {triggerLabel}
        </button>
      )}
      <Dialog open={isOpen} onOpenChange={setOpen} title={title} description={description} size="lg">
        <div className="grid gap-4 pb-2 sm:h-[26rem] sm:grid-cols-[11.5rem_1fr] sm:gap-6">
          <div
            role="tablist"
            aria-label={title}
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="flex gap-0.5 self-start overflow-x-auto rounded-lg bg-surface p-1 [scrollbar-width:none] sm:flex-col"
          >
            {tabs.map((tab) => {
              const selected = tab.value === active;
              return (
                <button
                  key={tab.value}
                  ref={(node) => {
                    if (node) refs.current.set(tab.value, node);
                    else refs.current.delete(tab.value);
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${tab.value}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel-${tab.value}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(tab.value)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-base whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 pointer-fine:min-h-9 [&_svg]:size-4 [&_svg]:shrink-0 [&:focus-visible]:outline-offset-[-2px]",
                    selected
                      ? "bg-overlay font-medium text-strong shadow-raised ring-1 ring-line"
                      : "text-body hover:bg-surface-raised hover:text-strong",
                  )}
                >
                  {tab.icon ? (
                    <span aria-hidden className={selected ? "text-strong" : "text-muted"}>
                      {tab.icon}
                    </span>
                  ) : null}
                  {tab.label}
                </button>
              );
            })}
          </div>
          {tabs.map((tab) => (
            <div
              key={tab.value}
              role="tabpanel"
              id={`${id}-panel-${tab.value}`}
              aria-labelledby={`${id}-tab-${tab.value}`}
              hidden={tab.value !== active}
              tabIndex={0}
              className="min-w-0 sm:overflow-y-auto sm:pr-1 [&:focus-visible]:outline-offset-4"
            >
              {tab.content}
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}

/** Bir paneldeki başlıklı satır grubu; satırlar arasında kıl çizgisi. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="text-base font-semibold text-strong">{title}</h3>
      {description ? <p className="mt-0.5 text-small text-muted">{description}</p> : null}
      <div className="mt-2 divide-y divide-line-soft">{children}</div>
    </section>
  );
}

/** Solda etiket + açıklama, sağda denetim (Select, düğme). Anahtar için doğrudan `Switch`. */
export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-base font-medium text-strong">{label}</p>
        {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
