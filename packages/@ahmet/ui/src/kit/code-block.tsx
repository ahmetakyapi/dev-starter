// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { cn } from "../utils";

/**
 * Kod bloğu: kurulum komutu, yapılandırma parçası, API örneği. Başlıkta dosya
 * adı ya da sekmeler (npm / pnpm / yarn / bun, cURL / JavaScript), sağda
 * kopyala. Belge sayfası, geliştiriciye dönük ayar ekranı ("Webhook'u
 * Bağla") ve landing'in "tek komutla kur" satırı için.
 *
 * SEKMELER BİR SEKME LİSTESİ: ok tuşları seçimi taşır, Tab panele geçer
 * (gezici tabindex). Kopyala düğmesi HER ZAMAN görünen sekmenin kodunu alır.
 *
 * TERCİH HATIRLANIR (`persist`): kullanıcı bir blokta pnpm'i seçince aynı
 * anahtarı taşıyan bütün bloklar pnpm'e geçer ve sonraki ziyarette de pnpm
 * açılır. Depo `localStorage`; özel pencerede ya da engellenmişse sessizce
 * bellekte kalır, sayfa kırılmaz. Sunucu çizimi ilk sekmeyi basar, tercih
 * hidrasyondan sonra gelir (`useSyncExternalStore`, uyuşmazlık uyarısı yok).
 *
 * KAYDIRILABİLİR ALAN ODAKLANIR: uzun satır yatay kayar, `pre` klavyeyle
 * kaydırılabilsin diye `tabIndex={0}` ve adla gelir (axe
 * scrollable-region-focusable). Satır kırmak için `wrap`.
 *
 * KABUK İSTEMİ (`prompt`): her satırın başındaki `$` görsel ipucu; seçilmez,
 * kopyalanmaz, ekran okuyucu okumaz.
 *
 * GÖRÜNÜŞ: gri kuyu + üstten ışıklı kenar (`edge-lit`); kod `font-mono`,
 * `text-small`. Sözdizimi renklendirme YOK, bilerek: tek renk okunur, iki
 * temada da AA; renklendirme gerekiyorsa sunucuda (shiki) üretip `code`
 * yerine hazır düğüm ver (`children`).
 *
 *   <CodeBlock tabs={installTabs("motion")} persist="pm" />
 *   <CodeBlock title="app/globals.css" code={css} />
 *   <CodeBlock code="npx dev-starter add code-block" prompt />
 */

export type CodeTab = { label: string; code: string };

/** Dört paket yöneticisinde kurulum komutu: `installTabs("motion", { dev: true })`. */
export function installTabs(pkg: string, { dev = false }: { dev?: boolean } = {}): CodeTab[] {
  return [
    { label: "npm", code: `npm install ${dev ? "-D " : ""}${pkg}` },
    { label: "pnpm", code: `pnpm add ${dev ? "-D " : ""}${pkg}` },
    { label: "yarn", code: `yarn add ${dev ? "-D " : ""}${pkg}` },
    { label: "bun", code: `bun add ${dev ? "-d " : ""}${pkg}` },
  ];
}

// ─── Paylaşılan tercih ────────────────────────────────────────────────────────
// Aynı `persist` anahtarlı bloklar tek kaynaktan okur. Olay yalnız bu sekmede;
// başka sekmedeki değişiklik `storage` olayıyla gelir.
const memory = new Map<string, string>();
const EVENT = "code-block-pref";

function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(`code-block:${key}`) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function writePref(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(`code-block:${key}`, value);
  } catch {
    // Depo kapalı: bellekte kalır.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

type CodeBlockProps = {
  /** Tek parça kod. `tabs` verilirse yok sayılır. */
  code?: string;
  /** Sekmeli kod; 2-5 sekme. */
  tabs?: readonly CodeTab[];
  /** Sekmesiz blokta başlık: dosya adı ("app/page.tsx") ya da kısa ad. */
  title?: ReactNode;
  /** Sekme tercihini bu anahtarla hatırla ve aynı anahtarlı bloklarla paylaş. */
  persist?: string;
  /** Satır başında `$`. */
  prompt?: boolean;
  /** Uzun satırı kaydırma yerine kır. */
  wrap?: boolean;
  /** Kod alanının adı; verilmezse başlık ya da etkin sekme. */
  "aria-label"?: string;
  /** Hazır (renklendirilmiş) düğüm; kopyalanan metin yine `code`/sekmeden. */
  children?: ReactNode;
  className?: string;
};

export function CodeBlock({ code = "", tabs, title, persist, prompt = false, wrap = false, children, className, ...props }: CodeBlockProps) {
  const id = useId();
  const hasTabs = Boolean(tabs && tabs.length > 1);
  const labels = hasTabs ? tabs!.map((tab) => tab.label) : [];
  const [local, setLocal] = useState(labels[0] ?? "");
  const stored = useSyncExternalStore(
    subscribe,
    () => (persist ? readPref(persist) : null),
    () => null,
  );
  const active = stored && labels.includes(stored) ? stored : labels.includes(local) ? local : labels[0];
  const current = hasTabs ? tabs!.find((tab) => tab.label === active)! : null;
  const text = current ? current.code : code;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusNext, setFocusNext] = useState<number | null>(null);

  useEffect(() => {
    if (focusNext === null) return;
    refs.current[focusNext]?.focus();
    setFocusNext(null);
  }, [focusNext]);

  function select(label: string) {
    setLocal(label);
    if (persist) writePref(persist, label);
  }

  function onKey(event: KeyboardEvent, index: number) {
    const last = labels.length - 1;
    const next =
      event.key === "ArrowRight" ? (index + 1) % labels.length
      : event.key === "ArrowLeft" ? (index - 1 + labels.length) % labels.length
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    select(labels[next]);
    setFocusNext(next);
  }

  const lines = text.split("\n");
  const name = props["aria-label"] ?? (typeof title === "string" ? title : current ? `${current.label} komutu` : "Kod");

  return (
    <div className={cn("edge-lit min-w-0 overflow-hidden rounded-lg bg-surface", className)}>
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-line-soft py-1 pr-1 pl-2">
        {hasTabs ? (
          <div role="tablist" aria-label="Komut Biçimi" className="flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none]">
            {labels.map((label, index) => {
              const selected = label === active;
              return (
                <button
                  key={label}
                  ref={(node) => {
                    refs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${index}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(label)}
                  onKeyDown={(event) => onKey(event, index)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-sm px-2.5 font-mono text-small transition-[background-color,color,box-shadow] duration-150",
                    selected ? "bg-overlay text-strong shadow-raised" : "text-muted hover:text-strong",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="min-w-0 truncate px-1 font-mono text-small text-muted">{title}</span>
        )}
        <CopyButton value={text} label={hasTabs ? `${active} Komutunu Kopyala` : "Kodu Kopyala"} />
      </div>
      <pre
        id={`${id}-panel`}
        role={hasTabs ? "tabpanel" : undefined}
        aria-labelledby={hasTabs ? `${id}-tab-${labels.indexOf(active!)}` : undefined}
        aria-label={hasTabs ? undefined : name}
        tabIndex={0}
        className={cn(
          "overflow-x-auto p-4 font-mono text-small leading-relaxed text-strong focus-visible:outline-offset-[-2px]",
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        )}
      >
        <code>
          {children ??
            lines.map((line, index) => (
              <span key={index} className="block">
                {prompt && line.trim() !== "" ? (
                  <span aria-hidden className="mr-2 text-muted select-none">
                    $
                  </span>
                ) : null}
                {line || "​"}
              </span>
            ))}
        </code>
      </pre>
    </div>
  );
}
