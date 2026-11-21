import { useMemo, useSyncExternalStore } from "react";

/**
 * Portal depo çekirdeği: TEK yayın kanalı, TEK sürüm sayacı.
 *
 * Her "dilim" (finans, müşteri, iş emri, denetim...) kendi değerini taşır ama
 * hepsi aynı `bump()` ile haber verir. Böylece:
 *   - bir sayfada yapılan işlem (ödeme, kesme, onay) başka sayfadaki türetilmiş
 *     sayıları (rozet, pano, müşteri bakiyesi) AYNI ANDA günceller;
 *   - sayfa değişince durum kaybolmaz (dilimler modül düzeyinde yaşar);
 *   - `useDerived` ile her türetilmiş değer tek yerden (`_selectors.ts`) okunur.
 *
 * Yenileyince sıfırlanır (demo). Sunucuya yazan hiçbir şey yok.
 */

const listeners = new Set<() => void>();
let version = 0;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getVersion = () => version;

/** Bir dilim değişince çağrılır: bütün abonelere haber verir. */
export function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

/** Depo sürümü: her değişiklikte artar; bağımlılık olarak kullanılır. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/** Depodan türeyen değer: depo her değişince yeniden hesaplanır. */
export function useDerived<T>(compute: () => T, deps: readonly unknown[] = []): T {
  const v = useStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(compute, [v, ...deps]);
}

export type Slice<T> = {
  get: () => T;
  /** Yeni değer ya da güncelleyici; hep yeni nesne dön (değişmezlik). */
  set: (next: T | ((previous: T) => T)) => void;
  use: () => T;
  reset: () => void;
};

const registry: Slice<unknown>[] = [];

export function createSlice<T>(initial: T): Slice<T> {
  let value = initial;
  const slice: Slice<T> = {
    get: () => value,
    set: (next) => {
      value = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      bump();
    },
    use: () => useSyncExternalStore(subscribe, () => value, () => value),
    reset: () => {
      value = initial;
      bump();
    },
  };
  registry.push(slice as Slice<unknown>);
  return slice;
}

/** Bütün dilimleri başlangıca döndürür (doğrulayıcı ve testler). */
export function resetAll() {
  for (const slice of registry) slice.reset();
}

/** Artan sayaçla kimlik üretir: `nextId("IE-")` → `IE-0001`. Tek sayaç, tek kaynak. */
const counters = new Map<string, number>();
export function nextId(prefix: string, start = 1) {
  const n = (counters.get(prefix) ?? start - 1) + 1;
  counters.set(prefix, n);
  return `${prefix}${String(n).padStart(4, "0")}`;
}
