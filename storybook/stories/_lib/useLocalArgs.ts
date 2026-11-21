import { useRef, useState } from "react";
import { useArgs } from "storybook/preview-api";

/**
 * Hikaye argümanlarını güncelleyen kanca. `useArgs` yalnız Storybook arayüzünde
 * (kanal bağlıyken) çalışır; Vitest koşusunda (taşınabilir hikaye) hikaye bağlamı
 * olmadığı için ya atar ya da sessizce yutulur ve kontrollü bileşen (açık/kapalı,
 * seçili değer) hiç değişmez. Bu kanca değişikliği yerelde de tutar; kontrol
 * panelinden gelen yeni değer yerel değerin önüne geçer.
 */
const IN_VITEST = typeof (globalThis as { __vitest_browser__?: unknown }).__vitest_browser__ !== "undefined";

function useStorybookUpdate(): (patch: Record<string, unknown>) => void {
  // Koşu ortamı süreç boyunca sabit: kanca sırası bozulmaz.
  if (IN_VITEST) return () => {};
  return useArgs()[1] as (patch: Record<string, unknown>) => void; // eslint-disable-line react-hooks/rules-of-hooks
}

export function useLocalArgs<T extends Record<string, unknown>>(args: T) {
  const updateStorybook = useStorybookUpdate();
  const [local, setLocal] = useState<Partial<T>>({});
  const seen = useRef<Partial<T>>({});
  const merged: T = { ...args };
  for (const key of Object.keys(local) as (keyof T)[]) {
    // Panel aynı anahtarı ayrıca değiştirdiyse (args değişti) yerel değer geçersiz.
    if (Object.is(args[key], seen.current[key])) merged[key] = local[key] as T[keyof T];
  }
  const update = (patch: Partial<T>) => {
    seen.current = { ...seen.current, ...Object.fromEntries(Object.keys(patch).map((k) => [k, args[k as keyof T]])) } as Partial<T>;
    setLocal((current) => ({ ...current, ...patch }));
    updateStorybook(patch as Record<string, unknown>);
  };
  return [merged, update] as const;
}
