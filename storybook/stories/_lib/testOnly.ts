import { settle } from "../kuzeyova/_settle";

/**
 * Oynatma (play) betiği YALNIZ test koşusunda (Vitest) çalışır; Storybook arayüzünde
 * hikaye açılınca ekran kendi kendine gezinmez.
 *
 * Neden (26 Kasım 2026, sahibinin geri bildirimi): Portal ve Pusula'nın gezinme testleri
 * arayüzde de oynuyordu: Pano → Faturalar → Sayaçlar → ⌘K arama kutusu açılıp yazılıyor →
 * Aboneler → Pano. Ziyaretçi bunu "sayfalar arası saçma geçişler, arama kutusu gelip gidiyor"
 * diye gördü. Testin kapsamı aynı kalır (npm run test:stories), arayüzde yükleme ekranından
 * sonra doğrudan bitmiş ekran gelir. Arayüzde yalnız `settle` koşar: tema ve animasyonlar
 * otursun, a11y denetimi yarı geçiş rengi okumasın.
 */
export const IN_TEST_RUNNER = typeof (globalThis as { __vitest_browser__?: unknown }).__vitest_browser__ !== "undefined";

type PlayContext = { globals: Record<string, unknown> };

export function testOnly<C extends PlayContext>(play: (context: C) => Promise<void>): (context: C) => Promise<void> {
  return (context) => (IN_TEST_RUNNER ? play(context) : settle(context.globals));
}
