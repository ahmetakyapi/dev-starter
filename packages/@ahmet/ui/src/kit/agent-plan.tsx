// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Ajan planı: bir yapay zekâ ajanının çok adımlı işini adım adım gösteren
 * liste ("4 Adım Kaldı"). Sohbette asistan mesajının içinde ya da bir görev
 * panelinin üstünde. Ajanın tek tek ARAÇ çağrılarını ve onaylarını göstermek
 * için `snippets/agent-feed.tsx`, `agent-approval.tsx`; bu bileşen planın
 * KUŞBAKIŞI.
 *
 * Durum tek sayıdan türer: `activeIndex`ten öncekiler tamamlandı, kendisi
 * sürüyor, sonrakiler bekliyor. `activeIndex >= steps.length` → plan bitti.
 * Ajan akışından gelen adım olaylarını bu sayıya indirmek çağıranın işi;
 * bileşen durum tutmaz, SUNUCU BİLEŞENİ olarak da çizilir.
 *
 * Görsel dil ("board"): kart gri kuyu; etkin adım beyaz karo + kıl halkası
 * içinde dönen halka, tamamlananlar üstü çizili + tik (yapılmış iş geri
 * çekilir, göz sıradakine gider), bekleyenler kesik çizgili daire ("henüz
 * yok" demenin en sessiz yolu).
 *
 * Daraltma yerel `<details>`: JavaScript'siz çalışır, Ctrl+F kapalı adımı
 * da bulur. `defaultOpen` yalnız ilk çizimde okunur.
 *
 * Erişilebilirlik: liste `<ol>`, etkin adım `aria-current="step"`, her
 * adımın durumu gizli metinle ("Tamamlandı", "Sürüyor", "Bekliyor") okunur;
 * renk ya da ikon tek işaret değil. Adım değişimi görünmez bir
 * `aria-live="polite"` bölgede duyurulur ("Adım 4 / 7 sürüyor: …"); bölge
 * hep DOM'da, yalnız metni değişir (yeni eklenen canlı bölge okunmaz).
 * Dönen halka hareketi azaltan kullanıcıda durur.
 */

export type PlanStep = { id: string; title: ReactNode; detail?: ReactNode };

type AgentPlanProps = {
  steps: readonly PlanStep[];
  activeIndex: number;
  /** Başlığı ez; verilmezse "N Adım Kaldı" / "Plan Tamamlandı". */
  title?: ReactNode;
  /** Duyuru için düz metin adlar (title ReactNode ise). Verilmezse sayı duyurulur. */
  stepLabels?: readonly string[];
  defaultOpen?: boolean;
  className?: string;
};

export function AgentPlan({ steps, activeIndex, title, stepLabels, defaultOpen = true, className }: AgentPlanProps) {
  const done = activeIndex >= steps.length;
  const remaining = Math.max(0, steps.length - activeIndex);
  const heading = title ?? (done ? "Plan Tamamlandı" : `${remaining.toLocaleString("tr-TR")} Adım Kaldı`);
  const activeLabel = stepLabels?.[activeIndex] ?? (typeof steps[activeIndex]?.title === "string" ? steps[activeIndex].title : "");
  const announcement = done
    ? `Plan tamamlandı, ${steps.length} adım.`
    : `Adım ${activeIndex + 1} / ${steps.length} sürüyor${activeLabel ? `: ${String(activeLabel)}` : ""}.`;

  return (
    <div className={cn("rounded-xl bg-surface p-1.5", className)}>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <details open={defaultOpen} className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-lg px-2.5 text-base font-medium text-strong select-none hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
          {done ? (
            <span aria-hidden className="inline-grid size-4 place-items-center rounded-full bg-strong text-page">
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
          ) : (
            <RingSpinner />
          )}
          <span className="flex-1">{heading}</span>
          <span className="text-small font-normal text-muted tabular-nums">
            {Math.min(activeIndex, steps.length).toLocaleString("tr-TR")} / {steps.length.toLocaleString("tr-TR")}
          </span>
          <ChevronDown
            aria-hidden
            className="size-4 text-muted transition-transform duration-200 group-open:rotate-180"
            strokeWidth={1.75}
          />
        </summary>

        <ol className="mt-1 grid gap-0.5">
          {steps.map((step, index) => {
            const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
            return (
              <li
                key={step.id}
                aria-current={state === "active" ? "step" : undefined}
                className={cn(
                  "flex gap-3 rounded-lg px-2.5 py-2.5 transition-[background-color,box-shadow] duration-200",
                  state === "active" && "bg-overlay shadow-raised ring-1 ring-line",
                )}
              >
                <span aria-hidden className="mt-0.5 inline-grid size-[1.125rem] shrink-0 place-items-center">
                  {state === "done" ? (
                    <span className="inline-grid size-4 place-items-center rounded-full bg-surface-raised text-muted">
                      <Check className="size-2.5" strokeWidth={3.5} />
                    </span>
                  ) : state === "active" ? (
                    <RingSpinner />
                  ) : (
                    <span className="size-4 rounded-full border-[1.5px] border-dashed border-line-strong" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-base",
                      state === "done" && "text-muted line-through decoration-line-strong",
                      state === "active" && "font-medium text-strong",
                      state === "pending" && "text-body",
                    )}
                  >
                    <span className="sr-only">
                      {state === "done" ? "Tamamlandı: " : state === "active" ? "Sürüyor: " : "Bekliyor: "}
                    </span>
                    {step.title}
                  </span>
                  {step.detail && state === "active" ? (
                    <span className="mt-0.5 block text-small text-muted">{step.detail}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}

/** Dönen halka: kıl gri iz + üstünde kısa koyu yay. Hareketi azaltanda durur. */
function RingSpinner() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 shrink-0 animate-spin text-strong motion-reduce:animate-none">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
