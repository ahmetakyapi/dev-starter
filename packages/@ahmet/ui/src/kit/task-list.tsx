// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronRight, Eye, EyeOff, Flag, Plus } from "lucide-react";
import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { cn } from "../utils";
import { Checkbox } from "./checkbox";

/**
 * Görev listesi: tek kişinin ya da küçük bir ekibin yapılacakları (bugünün
 * işleri, bir projenin kontrol listesi). İş kolonlar arasında akıyorsa
 * `kanban-board.tsx`; listede yalnızca sıra ve tamamlanma var.
 *
 * SATIR: onay kutusu (`checkbox.tsx`, tik çizilerek gelir), başlık
 * (`label`, tıklanınca da işaretler), altında öncelik, son tarih ve alt
 * görev ilerlemesi. Tamamlanınca başlığın üstü çizilir: çizgi rengi
 * saydamdan metin rengine geçer (`text-decoration-color`), çok satırlı
 * başlıkta da doğru yerde durur. Satır silinmez, `text-muted`a söner.
 *
 * ÖNCELİK VE TARİH METİNLE: "Yüksek" bayrak + tehlike yıkaması, geciken
 * tarih "Gecikti · 2 Kas" diye yazılır; renk yalnızca hızlandırır.
 * Tamamlanmış görevde gecikme gösterilmez (geçmişte kalmış bir işi
 * kırmızıyla bağırmak gürültü). "Bugün" `today` prop'undan; verilmezse
 * istemcide hesaplanır, sunucu çiziminde yok (hidrasyon farkı çıkmaz).
 *
 * ALT GÖREVLER: üst satırda "2 / 4" sayaçlı açma düğmesi
 * (`aria-expanded`). Kısmen bitmişse üst kutu BELİRSİZ (`indeterminate`,
 * çizgi). Üstü işaretlemek bütün altları bitirir, kaldırmak hepsini açar;
 * son alt görev işaretlenince üst de tamamlanır. Kurallar tek yerde
 * (`toggleTask`, `toggleSub`; saf).
 *
 * "Tamamlananları Gizle" bir `aria-pressed` düğme; gizlenen satır kısa bir
 * kayma + solmayla çıkar (yükseklik animasyonu yok: düzen titremesi).
 * Altta satır içi ekleme: yaz, Enter; Escape temizler. Ekleme, işaretleme
 * ve gizleme canlı bölgede duyurulur.
 *
 * Durum içeride: `defaultTasks` + `onChange(tasks)`.
 */

export type Priority = "high" | "medium" | "low";
export type Subtask = { id: string; title: string; done: boolean };
export type Task = {
  id: string;
  title: string;
  done: boolean;
  priority?: Priority;
  /** `YYYY-MM-DD` */
  due?: string;
  subtasks?: readonly Subtask[];
};

const PRIORITY: Record<Priority, { label: string; className: string }> = {
  high: { label: "Yüksek", className: "bg-danger-wash text-danger" },
  medium: { label: "Orta", className: "bg-warning-wash text-warning" },
  low: { label: "Düşük", className: "bg-surface-raised text-body" },
};

const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
const parse = (iso: string) => {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1);
};
const pad = (n: number) => String(n).padStart(2, "0");
const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const noop = () => () => {};
const EASE = [0.22, 1, 0.36, 1] as const;

/** Üst görevi işaretler/kaldırır; alt görevler onu izler. Saf. */
export function toggleTask(tasks: readonly Task[], id: string): Task[] {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const done = !t.done;
    return { ...t, done, subtasks: t.subtasks?.map((s) => ({ ...s, done })) };
  });
}

/** Alt görevi işaretler; hepsi bitince üst tamamlanır, biri açılınca üst açılır. Saf. */
export function toggleSub(tasks: readonly Task[], id: string, subId: string): Task[] {
  return tasks.map((t) => {
    if (t.id !== id || !t.subtasks) return t;
    const subtasks = t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    return { ...t, subtasks, done: subtasks.every((s) => s.done) };
  });
}

export function TaskList({
  defaultTasks,
  onChange,
  title = "Görevler",
  today: todayProp,
  defaultHideCompleted = false,
  className,
}: {
  defaultTasks: readonly Task[];
  onChange?: (tasks: Task[]) => void;
  title?: string;
  /** `YYYY-MM-DD`; gecikme buna göre. Hikâye ve testte sabitle. */
  today?: string;
  defaultHideCompleted?: boolean;
  className?: string;
}) {
  const uid = useId();
  const reduce = useReducedMotion();
  const clientToday = useSyncExternalStore(noop, isoToday, () => null);
  const today = todayProp ?? clientToday;
  const [tasks, setTasks] = useState<Task[]>(() => [...defaultTasks]);
  const [hideDone, setHideDone] = useState(defaultHideCompleted);
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState("");
  const created = useRef(0);

  const update = (next: Task[]) => {
    setTasks(next);
    onChange?.(next);
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const shown = hideDone ? tasks.filter((t) => !t.done) : tasks;

  function onToggle(task: Task) {
    update(toggleTask(tasks, task.id));
    setLive(`${task.title}: ${task.done ? "yeniden açıldı" : "tamamlandı"}`);
  }

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    created.current += 1;
    update([...tasks, { id: `${uid}-yeni-${created.current}`, title: text, done: false, priority: "medium" }]);
    setDraft("");
    setLive(`${text} eklendi`);
  }

  return (
    <section aria-labelledby={`${uid}-title`} className={cn("rounded-xl bg-surface p-2", className)}>
      <header className="flex items-start justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h3 id={`${uid}-title`} className="text-small font-medium text-muted">
            {title}
          </h3>
          <p className="mt-1 text-heading font-semibold tracking-tight whitespace-nowrap text-strong tabular-nums">
            {doneCount} / {tasks.length}
            <span className="ml-2 text-small font-medium tracking-normal text-muted">tamamlandı</span>
          </p>
        </div>
        <button
          type="button"
          aria-pressed={hideDone}
          onClick={() => {
            setHideDone((v) => !v);
            setLive(hideDone ? "Tamamlananlar gösteriliyor" : `${doneCount} tamamlanan görev gizlendi`);
          }}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-line bg-overlay px-3 text-small font-medium text-body shadow-raised transition-[background-color,color] duration-150 hover:text-strong pointer-fine:h-9"
        >
          {hideDone ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          Tamamlananları Gizle
        </button>
      </header>

      {/* İlerleme: metin zaten başlıkta, çubuk yalnız göz için */}
      <div aria-hidden className="mx-3 mb-3 h-1.5 overflow-hidden rounded-full bg-chart-track">
        <m.div
          className="h-full origin-left rounded-full bg-primary"
          initial={false}
          animate={{ scaleX: tasks.length ? doneCount / tasks.length : 0 }}
          transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
        />
      </div>

      <div className="rounded-lg bg-overlay shadow-raised">
        {shown.length ? (
          <ul className="divide-y divide-line-soft">
            <AnimatePresence initial={false}>
              {shown.map((task) => {
                const cb = `${uid}-${task.id}`;
                const subs = task.subtasks ?? [];
                const subDone = subs.filter((s) => s.done).length;
                const partial = !task.done && subDone > 0 && subDone < subs.length;
                const late = !task.done && !!task.due && !!today && task.due < today;
                const isToday = !task.done && !!task.due && task.due === today;
                const expanded = open.has(task.id);
                const panel = `${cb}-subs`;
                return (
                  <m.li
                    key={task.id}
                    initial={reduce ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: 12, transition: { duration: 0.18, ease: EASE } }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="px-3 py-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-[0.1875rem] grid min-h-6 place-items-center">
                        <Checkbox
                          id={cb}
                          checked={task.done}
                          onChange={() => onToggle(task)}
                          ref={(el: HTMLInputElement | null) => {
                            if (el) el.indeterminate = partial;
                          }}
                          aria-describedby={`${cb}-meta`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={cb}
                          className={cn(
                            "block cursor-pointer text-base font-medium text-pretty underline-offset-0 line-through decoration-transparent decoration-2 transition-[color,text-decoration-color] duration-300",
                            task.done ? "text-muted decoration-current" : "text-strong",
                          )}
                        >
                          {task.title}
                        </label>
                        <p id={`${cb}-meta`} className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-micro">
                          {task.priority ? (
                            <span className={cn("inline-flex h-5 items-center gap-1 rounded-sm px-1.5 font-medium", task.done ? "bg-surface-raised text-body" : PRIORITY[task.priority].className)}>
                              <Flag aria-hidden className="size-3" />
                              <span className="sr-only">Öncelik: </span>
                              {PRIORITY[task.priority].label}
                            </span>
                          ) : null}
                          {task.due ? (
                            <span
                              className={cn(
                                "inline-flex h-5 items-center gap-1 rounded-sm px-1.5 font-medium tabular-nums",
                                late ? "bg-danger-wash text-danger" : isToday ? "bg-warning-wash text-warning" : "text-muted",
                              )}
                            >
                              <CalendarDays aria-hidden className="size-3" />
                              <span className="sr-only">Son tarih: </span>
                              {late ? "Gecikti · " : isToday ? "Bugün · " : ""}
                              {shortDate.format(parse(task.due))}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      {subs.length ? (
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-controls={panel}
                          aria-label={`Alt görevler, ${subDone} / ${subs.length} tamamlandı`}
                          onClick={() =>
                            setOpen((prev) => {
                              const next = new Set(prev);
                              if (next.has(task.id)) next.delete(task.id);
                              else next.add(task.id);
                              return next;
                            })
                          }
                          className="-my-1 inline-flex h-11 shrink-0 items-center gap-1 rounded-md px-2 text-micro font-semibold text-body tabular-nums transition-colors duration-150 hover:bg-surface hover:text-strong pointer-fine:h-8"
                        >
                          {subDone} / {subs.length}
                          <ChevronRight aria-hidden className={cn("size-4 transition-transform duration-200", expanded && "rotate-90")} />
                        </button>
                      ) : null}
                    </div>

                    {subs.length ? (
                      <ul id={panel} hidden={!expanded} aria-label={`${task.title}: alt görevler`} className="mt-1 ml-[1.875rem] border-l border-line-soft pl-3">
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <Checkbox
                              label={<span className={cn("text-small", sub.done ? "text-muted line-through" : "text-body")}>{sub.title}</span>}
                              checked={sub.done}
                              onChange={() => {
                                update(toggleSub(tasks, task.id, sub.id));
                                setLive(`${sub.title}: ${sub.done ? "yeniden açıldı" : "tamamlandı"}`);
                              }}
                              className="min-h-10 py-2"
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-small text-muted">
            {tasks.length ? "Hepsi tamam. Gizlenen görevleri görmek için düğmeyi kapat." : "Henüz görev yok. İlkini aşağıya yaz."}
          </p>
        )}

        <form onSubmit={onAdd} className="flex items-center gap-2 rounded-b-lg border-t border-line-soft px-3 py-2 transition-[box-shadow] duration-150 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-line-focus has-[input:focus-visible]:ring-inset">
          <Plus aria-hidden className="size-4 shrink-0 text-muted" />
          <label htmlFor={`${uid}-new`} className="sr-only">
            Yeni görev
          </label>
          <input
            id={`${uid}-new`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setDraft("")}
            placeholder="Görev ekle, Enter ile kaydet"
            enterKeyHint="done"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-strong outline-none placeholder:text-muted pointer-fine:h-9 pointer-fine:text-small"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-11 shrink-0 items-center rounded-md bg-cta px-3 text-small font-semibold text-on-brand shadow-cta transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 pointer-fine:h-8"
          >
            Ekle
          </button>
        </form>
      </div>

      {hideDone && doneCount ? <p className="px-3 pt-2.5 pb-1 text-micro text-muted">{doneCount} tamamlanan görev gizli</p> : null}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </section>
  );
}
