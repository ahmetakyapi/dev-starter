"use client";

import { Toast } from "@base-ui/react/toast";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Bildirim (toast): bir eylemin SONUCU, kısa süre ekranda ("Taslak
 * kaydedildi", "3 dosya silindi · Geri Al"). Kullanıcının karar vermesi
 * gerekiyorsa `dialog.tsx`; sayfaya bağlı kalıcı durum için
 * `banner-alert.tsx`; geçmişte biriken iletiler için `notification-center.tsx`.
 * Eski `snippets/toast.tsx` (Context + useToast) yerine bu: bileşen dışından
 * da çağrılır, yığılır, kaydırılır, promise izler.
 *
 *   // app/layout.tsx — SAYFA BAŞINA TEK
 *   <Toaster />
 *   // herhangi bir istemci kodunda (bileşen dışı da olur)
 *   toast.success("Taslak kaydedildi");
 *   toast.error("Ödeme alınamadı", { description: "Kart limiti yetersiz." });
 *   toast.undo("3 dosya silindi", () => restore(ids));
 *   toast.promise(save(), { loading: "Kaydediliyor", success: "Kaydedildi", error: "Kaydedilemedi" });
 *
 * HEADLESS KATMAN Base UI Toast: zamanlayıcı (fare üstündeyken, odaktayken
 * ve sekme arka plandayken DURUR), kaydırarak kapatma, F6 ile bildirim
 * bölgesine atlama, odak yönetimi ondan. `createToastManager` ile modül
 * düzeyinde tek yönetici: `toast()` React dışından da çağrılır. Toaster
 * takılmadan önce çağrılan bildirim (sayfa açılışı, yönlendirme sonrası)
 * sıraya girer, Toaster hazır olunca gösterilir.
 *
 * ERİŞİLEBİLİRLİK: bölge `aria-live="polite"` (konuşmayı kesmez); HATA
 * `priority: "high"` ile `role="alert"`, yani assertive. Hata kendiliğinden
 * KAPANMAZ (WCAG 2.2.1: okumadan kaybolan hata), yükleniyor da kapanmaz;
 * diğerleri 5 sn. Tür rengin yanında gizli önekle okunur ("Hata: …").
 *
 * YIĞILMA: en çok 3 görünür; yenisi önde, arkadakiler biraz küçülüp üstten
 * kenar verir. Fare gelince (ya da odak girince) yığın açılır. 3'ü aşan eski
 * bildirimler gizlenir ve yığının üstünde "+2 bildirim daha" hapı çıkar:
 * ekrandan kalktı ama yok olmadı, sırası gelince görünür.
 *
 * HAREKET: alttan kayarak gelir (EASE, 400 ms), sağa ya da aşağı
 * kaydırılınca o yöne gider. Hareketi azaltan kullanıcıda konum hiç
 * kaymaz, yalnız solar; parmakla sürükleme (doğrudan manipülasyon) kalır.
 * Yükseklik geçişi (150 ms) bilinçli: yığın açılınca arkadaki karolar
 * gerçek boylarına uzar, transform tek başına bunu yapamaz.
 *
 * GÖRÜNÜŞ ("board" dili): beyaz karo `bg-overlay` + kıl çizgisi +
 * `shadow-floating`, `rounded-xl`. Renkli zemin YOK: tür ikonun renginde
 * ve sözde; dört renkli kutu sayfada bağırırdı. Eylem ikincil karo düğme.
 *
 * TEK TOASTER: iki Toaster aynı yöneticiye abone olsa her bildirim iki kez
 * çıkardı. İkinci Toaster sessizce çizilmez, ilki kalkınca devralır
 * (Storybook belgeler sayfası gibi birden çok örneğin aynı anda durduğu
 * yerlerde de güvenli).
 */

type ToastType = "success" | "error" | "warning" | "info" | "loading";

type ToastAction = { label: string; onClick: () => void };

export type ToastOptions = {
  description?: ReactNode;
  action?: ToastAction;
  /** Milisaniye; 0 kapanmaz. Hata ve yükleniyor için varsayılan 0. */
  timeout?: number;
  /** Aynı kimlikle yeniden çağırmak bildirimi yerinde günceller. */
  id?: string;
};

const manager = Toast.createToastManager();
let seq = 0;

/* Toaster abone olmadan çağrılan bildirim (sayfa açılışında, yönlendirme
   sonrası) kaybolmasın: sıraya girer, Toaster hazır olunca çıkar. */
let ready = false;
const queue: (() => void)[] = [];
const whenReady = (run: () => void) => (ready ? run() : queue.push(run));

function actionProps(action: ToastAction | undefined, id: string) {
  if (!action) return undefined;
  return {
    children: action.label,
    onClick: () => {
      action.onClick();
      manager.close(id);
    },
  };
}

function show(type: ToastType, title: ReactNode, { description, action, timeout, id: given }: ToastOptions = {}) {
  const id = given ?? `toast-${++seq}`;
  whenReady(() =>
    manager.add({
      id,
      type,
      title,
      description,
      timeout: timeout ?? (type === "error" || type === "loading" ? 0 : undefined),
      priority: type === "error" ? "high" : "low",
      actionProps: actionProps(action, id),
    }),
  );
  return id;
}

type PromiseMessage<Value> = ReactNode | ((value: Value) => ReactNode);
const resolve = <Value,>(message: PromiseMessage<Value>, value: Value): ReactNode =>
  typeof message === "function" ? message(value) : message;

export const toast = Object.assign((title: ReactNode, options?: ToastOptions) => show("info", title, options), {
  success: (title: ReactNode, options?: ToastOptions) => show("success", title, options),
  error: (title: ReactNode, options?: ToastOptions) => show("error", title, options),
  warning: (title: ReactNode, options?: ToastOptions) => show("warning", title, options),
  info: (title: ReactNode, options?: ToastOptions) => show("info", title, options),
  loading: (title: ReactNode, options?: ToastOptions) => show("loading", title, options),
  /** Yıkıcı eylemin ardından: "Geri Al" düğmeli başarı bildirimi, 8 sn. */
  undo: (title: ReactNode, onUndo: () => void, options?: ToastOptions & { label?: string }) =>
    show("success", title, {
      timeout: 8000,
      ...options,
      action: { label: options?.label ?? "Geri Al", onClick: onUndo },
    }),
  /** Yükleniyor → başarı ya da hata; promise'in kendisini geri verir. */
  promise: <Value,>(
    promise: Promise<Value>,
    messages: {
      loading: ReactNode;
      success: PromiseMessage<Value>;
      error: PromiseMessage<unknown>;
      description?: ReactNode;
    },
  ) =>
    new Promise<void>((done) => whenReady(done)).then(() =>
      manager.promise(promise, {
        loading: { title: messages.loading, description: messages.description },
        success: (value: Value) => ({ title: resolve(messages.success, value), description: undefined }),
        error: (reason: unknown) => ({
          title: resolve(messages.error, reason),
          description: undefined,
          priority: "high",
          timeout: 0,
        }),
      }),
    ),
  update: (id: string, title: ReactNode, options: Omit<ToastOptions, "id"> & { type?: ToastType } = {}) =>
    manager.update(id, {
      title,
      description: options.description,
      type: options.type,
      timeout: options.timeout,
      actionProps: actionProps(options.action, id),
    }),
  /** Kimlik verilmezse hepsini kapatır. */
  dismiss: (id?: string) => manager.close(id),
});

/* ---- Tek Toaster: sırayla bekleyen adaylar, ilk aday çizer ---- */
const candidates: string[] = [];
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());
const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

const ICONS = {
  success: { Icon: CircleCheck, tone: "text-success", prefix: "Başarılı" },
  error: { Icon: CircleAlert, tone: "text-danger", prefix: "Hata" },
  warning: { Icon: TriangleAlert, tone: "text-warning", prefix: "Uyarı" },
  info: { Icon: Info, tone: "text-primary-ink", prefix: "Bilgi" },
} as const;

/* Yığın geometrisi Base UI'ın CSS değişkenleriyle: --toast-index (0 önde),
   --toast-offset-y (açıkken üsttekilerin toplam boyu), --toast-height,
   --toast-frontmost-height, --toast-swipe-movement-x/y. */
const ROOT = cn(
  "[--gap:0.625rem] [--peek:0.625rem]",
  "[--scale:calc(max(0,1-(var(--toast-index)*0.05)))] [--shrink:calc(1-var(--scale))]",
  "[--height:var(--toast-frontmost-height,var(--toast-height))]",
  "[--offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--gap)*-1+var(--toast-swipe-movement-y))]",
  "absolute right-0 bottom-0 left-0 z-[calc(100-var(--toast-index))] origin-bottom select-none",
  "h-(--height) data-expanded:h-(--toast-height)",
  // Kapalı yığın: arkadakiler küçülür, üstten --peek kadar görünür.
  "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-var(--toast-index)*var(--peek)-var(--shrink)*var(--height)))_scale(var(--scale))]",
  "data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
  // Giriş/çıkış: hareket serbestse alttan/yana kayar; değilse yalnız solar.
  "data-starting-style:opacity-0 data-ending-style:opacity-0 data-limited:pointer-events-none data-limited:opacity-0",
  "motion-safe:data-starting-style:[transform:translateY(150%)]",
  "motion-safe:[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
  "motion-safe:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "motion-safe:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "motion-safe:[transition:transform_0.4s_var(--ease-brand),opacity_0.4s_var(--ease-brand),height_0.15s_var(--ease-brand)]",
  "motion-reduce:[transition:opacity_0.2s_linear]",
  // Karolar arası boşlukta fare çıkınca yığın kapanmasın: görünmez köprü.
  "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
  // Görünüş
  "rounded-xl border border-line bg-overlay bg-clip-padding text-body shadow-floating",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus",
);

const ACTION =
  "relative inline-flex h-8 shrink-0 items-center rounded-md border border-line bg-overlay px-3 text-small font-semibold text-strong shadow-raised transition-[background-color,scale] duration-150 hover:bg-page active:scale-[0.97] motion-reduce:active:scale-100 before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-[''] pointer-fine:before:hidden";

function ToastList() {
  const { toasts } = Toast.useToastManager();

  // Sağlayıcı yöneticiye KENDİ effect'inde abone olur; çocuk effect'leri
  // ondan önce koşar. Bir tur bekleyip sırayı boşaltmak abonelikten sonraya düşer.
  useEffect(() => {
    const timer = setTimeout(() => {
      ready = true;
      queue.splice(0).forEach((run) => run());
    });
    return () => {
      clearTimeout(timer);
      ready = false;
    };
  }, []);
  const hidden = toasts.filter((item) => item.limited && item.transitionStatus !== "ending").length;

  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label="Bildirimler"
        className="group/viewport fixed right-4 bottom-4 left-4 z-60 outline-none sm:right-6 sm:bottom-6 sm:left-auto sm:w-[22.5rem]"
      >
        {hidden > 0 ? (
          <p
            className="absolute right-0 bottom-[calc(var(--toast-frontmost-height,4rem)+1.75rem)] rounded-full border border-line bg-overlay px-2.5 py-1 text-micro font-semibold text-muted tabular-nums shadow-raised transition-opacity duration-200 group-data-expanded/viewport:pointer-events-none group-data-expanded/viewport:opacity-0"
          >
            +{hidden.toLocaleString("tr-TR")} bildirim daha
          </p>
        ) : null}
        {toasts.map((item) => {
          const type = (item.type ?? "info") as ToastType;
          const meta = type === "loading" ? null : (ICONS[type] ?? ICONS.info);
          return (
            <Toast.Root key={item.id} toast={item} className={ROOT}>
              <Toast.Content className="relative flex items-start gap-3 overflow-hidden py-3 pr-11 pl-3.5 transition-opacity duration-200 data-behind:pointer-events-none data-behind:opacity-0 data-expanded:pointer-events-auto data-expanded:opacity-100">
                <span className="mt-px grid size-5 shrink-0 place-items-center">
                  {meta ? (
                    <meta.Icon aria-hidden className={cn("size-5", meta.tone)} strokeWidth={2} />
                  ) : (
                    <Spinner size="sm" tone="muted" label={null} />
                  )}
                </span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <Toast.Title render={<div />} className="text-small font-semibold text-pretty text-strong">
                    {meta && type !== "info" && type !== "success" ? <span className="sr-only">{meta.prefix}: </span> : null}
                    {item.title}
                  </Toast.Title>
                  {item.description ? (
                    <Toast.Description className="text-small text-pretty text-muted">{item.description}</Toast.Description>
                  ) : null}
                </div>
                {item.actionProps ? <Toast.Action className={cn(ACTION, "self-center")} /> : null}
                <Toast.Close
                  aria-label="Bildirimi Kapat"
                  className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-sm text-muted transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-surface hover:text-strong pointer-fine:before:hidden"
                >
                  <X aria-hidden className="size-4" strokeWidth={2.25} />
                </Toast.Close>
              </Toast.Content>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

type ToasterProps = {
  /** Varsayılan kapanma süresi (ms). Hata ve yükleniyor bundan bağımsız kalır. */
  timeout?: number;
  /** Aynı anda görünen en çok bildirim. */
  limit?: number;
};

export function Toaster({ timeout = 5000, limit = 3 }: ToasterProps) {
  const id = useId();
  const active = useSyncExternalStore(
    subscribe,
    () => candidates[0] === id,
    () => false,
  );

  useEffect(() => {
    candidates.push(id);
    notify();
    return () => {
      candidates.splice(candidates.indexOf(id), 1);
      notify();
    };
  }, [id]);

  if (!active) return null;
  return (
    <Toast.Provider toastManager={manager} timeout={timeout} limit={limit}>
      <ToastList />
    </Toast.Provider>
  );
}
