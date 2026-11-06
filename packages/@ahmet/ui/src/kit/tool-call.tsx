// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Check, ChevronRight, Hand, Wrench, X } from "lucide-react";
import type { ReactNode } from "react";
import { BorderBeam } from "./border-beam";
import { TextShimmer } from "./text-shimmer";
import { cn } from "../utils";

/**
 * Araç çağrısı: asistanın bir aracı (takvim araması, e-posta taslağı,
 * veritabanı sorgusu) çağırdığı anın sohbet içindeki kaydı. Kapalıyken tek
 * satır: ne yaptı, durumu, süresi. Açınca girdi ve çıktı. Kullanıcı modelin
 * NE YAPTIĞINI görür (rules/agentic-ui.md: şeffaflık), ama ayrıntı onu
 * boğmaz.
 *
 * DURUMLAR: `pending` onay bekliyor (el ikonu, `actions` yuvasında Onayla /
 * Reddet; onay mantığı `snippets/agent-approval.tsx`te, burada yalnız yuva),
 * `running` sürüyor (etiket parıltılı, çerçevede ışık), `success`, `error`.
 * Durum metinle de yazılır ("Çalışıyor", "Tamamlandı"); renk tek işaret değil.
 *
 * AÇMA `<details>`: JavaScript'siz çalışır, Ctrl+F kapalı içeriği bulur,
 * ekran okuyucu `summary`yi düğme olarak okur. Girdi nesne verilirse JSON
 * olarak biçimlenir; çıktı metin, nesne ya da hazır bileşen olabilir.
 * Sunucu bileşeni.
 *
 *   <ToolCall name="calendar.search" label="Takvim Araması" status="success" durationMs={840} input={{ gün: "perşembe" }} output="3 boş aralık" />
 */

export type ToolCallStatus = "pending" | "running" | "success" | "error";

const STATUS = {
  pending: { text: "Onay bekliyor", icon: Hand, tone: "bg-warning-wash text-warning" },
  running: { text: "Çalışıyor", icon: Wrench, tone: "bg-primary-wash text-primary-ink" },
  success: { text: "Tamamlandı", icon: Check, tone: "bg-success-wash text-success" },
  error: { text: "Hata", icon: X, tone: "bg-danger-wash text-danger" },
} as const;

type ToolCallProps = {
  /** Aracın makine adı: `calendar.search`. */
  name: string;
  /** İnsan adı: "Takvim Araması". */
  label: string;
  status: ToolCallStatus;
  input?: unknown;
  output?: ReactNode | Record<string, unknown> | unknown[];
  durationMs?: number;
  /** `pending` halinde Onayla / Reddet düğmeleri. */
  actions?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

const pretty = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value, null, 2));
const isPlain = (value: unknown): value is Record<string, unknown> | unknown[] =>
  Array.isArray(value) || (typeof value === "object" && value !== null && !("$$typeof" in value));

export function ToolCall({ name, label, status, input, output, durationMs, actions, defaultOpen = false, className }: ToolCallProps) {
  const s = STATUS[status];
  const Icon = s.icon;
  const seconds =
    durationMs !== undefined ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(durationMs / 1000) : null;

  return (
    <BorderBeam active={status === "running"} duration={3} className={cn("rounded-xl bg-surface edge-lit", className)}>
      <details open={defaultOpen || status === "pending"} className="group/tool">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-md", s.tone)}>
            <Icon className="size-3.5" strokeWidth={2.25} />
          </span>
          <span className="grid min-w-0 flex-1">
            {status === "running" ? (
              <TextShimmer className="text-small">{label}</TextShimmer>
            ) : (
              <span className="truncate text-small font-medium text-strong">{label}</span>
            )}
            <code className="truncate font-mono text-micro text-muted">{name}</code>
          </span>
          <span className="shrink-0 text-micro text-muted tabular-nums">
            {s.text}
            {seconds && status !== "running" && status !== "pending" ? ` · ${seconds} sn` : ""}
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-muted transition-[rotate] duration-200 group-open/tool:rotate-90" />
        </summary>
        <div className="grid gap-3 px-3 pt-1 pb-3">
          {input !== undefined ? (
            <section className="grid gap-1">
              <p className="text-micro font-medium text-muted">Girdi</p>
              <pre tabIndex={0} className="max-h-48 overflow-auto rounded-md bg-overlay p-3 font-mono text-micro text-body shadow-raised">
                {pretty(input)}
              </pre>
            </section>
          ) : null}
          {output !== undefined && status !== "pending" ? (
            <section className="grid gap-1">
              <p className="text-micro font-medium text-muted">{status === "error" ? "Hata" : "Çıktı"}</p>
              {isPlain(output) || typeof output === "string" ? (
                <pre
                  tabIndex={0}
                  className={cn(
                    "max-h-48 overflow-auto rounded-md p-3 font-mono text-micro whitespace-pre-wrap shadow-raised",
                    status === "error" ? "bg-danger-wash text-danger" : "bg-overlay text-body",
                  )}
                >
                  {pretty(output)}
                </pre>
              ) : (
                <div className="rounded-md bg-overlay p-3 text-small text-body shadow-raised">{output as ReactNode}</div>
              )}
            </section>
          ) : null}
          {status === "pending" && actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
        </div>
      </details>
    </BorderBeam>
  );
}
