"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Gezinme göstergesi: üstte ince çubuk, gecikirse "Yükleniyor" hapı.
 *
 * NEDEN: tıklama ile yeni ekranın belirmesi arasında hiçbir işaret yoksa
 * okuyucu dokunuşunun kaydedilip kaydedilmediğini bilemez ve çoğu zaman
 * ikinci kez basar. `loading.tsx` yalnızca segment ASKIYA ALINDIĞINDA girer;
 * hızlı çözülen sunucu bileşenlerinde arada sessiz bir boşluk kalır.
 *
 * ÇUBUK YÜZDE GÖSTERMEZ. Ne kadar kaldığını bilmiyoruz; süresiz salınım
 * "çalışıyor" der, "%70" demez.
 *
 * HAP GECİKİNCE ÇIKAR (`SLOW_AFTER`, 420 ms). Ön yüklenmiş bağlantılar
 * 100 ms'de açılıyor; her birinde ekrana bir kutu düşseydi arayüz kendi
 * kendine seğiriyor gibi görünürdü.
 *
 * KURULUM (kök layout):
 *   <Suspense fallback={null}><RouteProgress /></Suspense>
 * `useSearchParams` okuduğu için `<Suspense>` ŞART; yoksa altındaki bütün
 * rota statik ön çizimden düşer.
 *
 * Sunucu eylemi gibi adresi değiştirmeyen bir bekleme için
 * `startRouteProgress()` / `stopRouteProgress()` elle çağrılır.
 *
 * TUZAK, SIĞ ADRES GÜNCELLEMESİ: Next'in yamalı `history.replaceState`i O
 * SIRADA UÇUŞTA OLAN bir gezinmeyi sessizce iptal eder: geri gelmez, yeniden
 * denenmez, hata da vermez. Adresi sığ güncelleyen bir denetim (filtre,
 * aralık seçici) gezinme sürerken kendini kapatmalı: `useRouteNavigating()`.
 * Böyle bir denetimin bağlantısına `data-shallow` koy; dinleyici onu gezinme
 * saymaz (yakalama evresinde koştuğu için `defaultPrevented` işe yaramaz).
 */

/** Hapın çıkması için gereken bekleme; altındaki gezinmeler sessiz geçer. */
const SLOW_AFTER = 420;
/** Emniyet freni: hiçbir sinyal gelmezse çubuk sonsuza kadar dönmesin. */
const MAX_RUN = 10_000;

/* Modül düzeyinde küçük bir mağaza: göstergeyi hem tıklama dinleyicisi hem
   ağacın herhangi bir yerindeki bir sunucu eylemi tetikleyebilmeli; context
   sağlayıcısı kurmaya değmez. Durum bayrak değil KOŞU NUMARASI: 0 boşta,
   her pozitif sayı ayrı bir gezinme. "Hap çıktı mı" bilgisi numaradan
   türetilir; yeni koşu başlayınca eski hap kendiliğinden düşer. */
let runId = 0;
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function startRouteProgress() {
  runId = ++counter;
  emit();
}

export function stopRouteProgress() {
  if (runId === 0) return;
  runId = 0;
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const getRun = () => runId;
const getServerRun = () => 0;

/** Gezinme sürüyor mu: sığ adres güncelleyen denetimler kendini kapatsın diye. */
export function useRouteNavigating(): boolean {
  return useSyncExternalStore(subscribe, getRun, getServerRun) !== 0;
}

const KEYFRAMES = `
@keyframes rp-slide {
  0% { transform: translateX(-100%) scaleX(0.35) }
  60% { transform: translateX(60%) scaleX(0.6) }
  100% { transform: translateX(110%) scaleX(0.35) }
}
`;

type RouteProgressProps = {
  /** Gecikince çıkan hapın metni. */
  label?: string;
  className?: string;
};

export function RouteProgress({ label = "Yükleniyor", className }: RouteProgressProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const run = useSyncExternalStore(subscribe, getRun, getServerRun);
  const running = run !== 0;
  const [slowRun, setSlowRun] = useState(0);
  // Hap yalnızca ŞU ANKİ koşu için; sonraki gezinmede eşleşme bozulur.
  const slow = running && slowRun === run;
  const settled = useRef(`${pathname}?${search}`);

  /* Bağlantı tıklamaları belge düzeyinde, YAKALAMA evresinde: her `<Link>`e
     prop geçmek, göstergeyi onlarca dosyaya bağlamak olurdu. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("data-shallow")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Aynı adrese basmak gezinme değil: çubuk yanar ve hiç sönmezdi.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      startRouteProgress();
    };

    const onPopState = () => {
      if (`${window.location.pathname}?${window.location.search.slice(1)}` !== settled.current) startRouteProgress();
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Hedef ekran bağlandı: adres ya da sorgu değiştiyse iş bitmiştir.
  useEffect(() => {
    const key = `${pathname}?${search}`;
    if (key === settled.current) return;
    settled.current = key;
    stopRouteProgress();
  }, [pathname, search]);

  useEffect(() => {
    if (run === 0) return;
    const slowTimer = window.setTimeout(() => setSlowRun(run), SLOW_AFTER);
    const brake = window.setTimeout(stopRouteProgress, MAX_RUN);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(brake);
    };
  }, [run]);

  return (
    <>
      <style href="ui-route-progress" precedence="default">
        {KEYFRAMES}
      </style>
      {running ? (
        <span aria-hidden className={cn("pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden", className)}>
          <span className="block h-full w-full origin-left animate-[rp-slide_1.1s_var(--ease-brand)_infinite] bg-primary motion-reduce:w-1/3 motion-reduce:animate-none" />
        </span>
      ) : null}
      {/* Canlı bölge HER ZAMAN DOM'da: sonradan eklenen bir `role="status"`
          bazı ekran okuyucularda hiç okunmuyor. Katman tıklamayı engellemez;
          gösterge takılırsa ekranı kilitlemesin. */}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex justify-center"
      >
        {slow ? (
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-semibold text-strong shadow-floating">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
            {label}
          </span>
        ) : null}
      </div>
    </>
  );
}
