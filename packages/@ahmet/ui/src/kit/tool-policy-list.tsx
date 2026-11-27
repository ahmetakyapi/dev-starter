// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { ChevronDown, TriangleAlert } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Araç politikası listesi: bir ajanın (ya da entegrasyonun) her aracı için
 * kalıcı izin düzeyi. Üç düzey:
 *
 * - **İzin Ver** (`allow`): araç kullanılabilir; yazan araçta yine de
 *   harness'ın onay kuralı geçerli olabilir.
 * - **Sor** (`ask`): her çağrıda insan onayı (`approval-card` /
 *   `ApprovalStrip` ya da `tool-call` onay yuvası).
 * - **Otomatik** (`auto`): onay beklemeden çalışır. Yazan/silen araçta satırın
 *   altında uyarı çıkar: "Bu araç onay beklemeden çalışır."
 *
 * Gruplar okuyan ve yazan/silen araçlar diye ayrılır (`kind: "read" |
 * "write"`); grup başlığındaki seçici gruptaki hepsini birden ayarlar
 * (karışıksa "Karışık" gösterir). `defaultToolPolicies(groups)` güvenli
 * başlangıcı üretir: okuyan araçlar İzin Ver, yazan araçlar Sor.
 *
 * Sakin Akış turu (kişisel portfolyo dili); yalnız davranış, kod alınmadı.
 *
 * NE ZAMAN: ajan ayarları, beceri/iş akışı düzenleyicisi, entegrasyon
 * ayrıntısı. NE ZAMAN DEĞİL: bağlanmadan önce okunacak izin dökümü
 * (`permission-list`), tek seferlik karar (`approval-card`).
 *
 * KURAL (rules/agentic-ui.md § 2): bu liste kullanıcının TERCİHİNİ toplar;
 * uygulayan sunucudur. Politika sunucuda saklanır ve her araç çağrısında
 * orada denetlenir; istemcideki seçici güvenlik değildir. Model bu ayarı
 * değiştiremez.
 *
 * Erişilebilirlik: seçici yerel `<select>` (klavye ve ekran okuyucu tam;
 * adı "<araç> izni"); grup `section` + başlık, liste `ul role="list"`; uyarı
 * metinle söylenir, renk tek işaret değil. Kontrollü API.
 *
 *   const [policy, setPolicy] = useState(() => defaultToolPolicies(GROUPS));
 *   <ToolPolicyList groups={GROUPS} value={policy} onValueChange={setPolicy} />
 */

export type ToolPolicy = "allow" | "ask" | "auto";
export type PolicyTool = { id: string; name: string; description?: ReactNode; icon?: ReactNode };
export type PolicyGroup = { id: string; label: string; kind: "read" | "write"; tools: readonly PolicyTool[] };

const DEFAULT_LABELS: Record<ToolPolicy, string> = { allow: "İzin Ver", ask: "Sor", auto: "Otomatik" };
const ORDER: readonly ToolPolicy[] = ["allow", "ask", "auto"];

export function defaultToolPolicies(groups: readonly PolicyGroup[]): Record<string, ToolPolicy> {
  const out: Record<string, ToolPolicy> = {};
  for (const g of groups) for (const t of g.tools) out[t.id] = g.kind === "write" ? "ask" : "allow";
  return out;
}

const SELECT =
  "h-11 cursor-pointer appearance-none rounded-lg bg-overlay py-0 pr-7 pl-2.5 text-small font-medium text-strong ring-1 ring-line outline-none transition-colors duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-line-focus pointer-fine:h-8";

function PolicySelect({
  value,
  onChange,
  label,
  labels,
  mixedLabel,
}: {
  value: ToolPolicy | "mixed";
  onChange: (next: ToolPolicy) => void;
  label: string;
  labels: Record<ToolPolicy, string>;
  mixedLabel?: string;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as ToolPolicy)} className={SELECT}>
        {value === "mixed" && (
          <option value="mixed" disabled>
            {mixedLabel}
          </option>
        )}
        {ORDER.map((p) => (
          <option key={p} value={p}>
            {labels[p]}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-soft" />
    </span>
  );
}

type ToolPolicyListProps = {
  groups: readonly PolicyGroup[];
  value: Record<string, ToolPolicy>;
  onValueChange: (next: Record<string, ToolPolicy>) => void;
  labels?: Partial<Record<ToolPolicy, string>>;
  mixedLabel?: string;
  /** Yazan araçta Otomatik seçilince satır altındaki uyarı. */
  autoWarning?: string;
  /** Grup seçicisinin adı: "<grup>: hepsi". */
  bulkLabel?: (group: string) => string;
  className?: string;
};

export function ToolPolicyList({
  groups,
  value,
  onValueChange,
  labels: labelsProp,
  mixedLabel = "Karışık",
  autoWarning = "Bu araç onay beklemeden çalışır.",
  bulkLabel = (g) => `${g}: hepsi`,
  className,
}: ToolPolicyListProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const id = useId();
  const fallback = (g: PolicyGroup): ToolPolicy => (g.kind === "write" ? "ask" : "allow");

  return (
    <div className={cn("grid gap-6", className)}>
      {groups.map((g) => {
        const values = g.tools.map((t) => value[t.id] ?? fallback(g));
        const bulk: ToolPolicy | "mixed" = values.length && values.every((v) => v === values[0]) ? values[0]! : "mixed";
        return (
          <section key={g.id} aria-labelledby={`${id}-${g.id}`} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 px-1">
              <h3 id={`${id}-${g.id}`} className="text-small font-medium text-strong">
                {g.label}
              </h3>
              <PolicySelect
                value={bulk}
                label={bulkLabel(g.label)}
                labels={labels}
                mixedLabel={mixedLabel}
                onChange={(next) => onValueChange({ ...value, ...Object.fromEntries(g.tools.map((t) => [t.id, next])) })}
              />
            </div>
            <ul role="list" className="divide-y divide-line-soft overflow-hidden rounded-[0.875rem] bg-overlay ring-1 ring-line">
              {g.tools.map((t) => {
                const current = value[t.id] ?? fallback(g);
                const warn = g.kind === "write" && current === "auto";
                return (
                  <li key={t.id} className="grid gap-1.5 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {t.icon && (
                        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-muted [&_svg]:size-3.5">
                          {t.icon}
                        </span>
                      )}
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-small font-medium text-strong">{t.name}</span>
                        {t.description && <span className="truncate text-micro text-muted">{t.description}</span>}
                      </span>
                      <PolicySelect value={current} label={`${t.name} izni`} labels={labels} onChange={(next) => onValueChange({ ...value, [t.id]: next })} />
                    </div>
                    {warn && (
                      <p className="flex items-center gap-1.5 rounded-md bg-warning-wash px-2 py-1 text-micro text-strong">
                        <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
                        {autoWarning}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
