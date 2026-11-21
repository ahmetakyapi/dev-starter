import { useDerived } from "./_core";
import { aging, getFinance } from "./_data-finans";
import type { AgingBucket } from "./_kit";

/** Vadesi geçmiş alacağın yaş dağılımı (canlı depodan): Pano ve Faturalar kahraman kartının alt görseli. */
export function agingBuckets(): AgingBucket[] {
  return aging(getFinance()).map((b) => ({ id: b.id, label: b.label.replace("90 gün üstü", "Daha eski"), value: b.balance, count: b.count }));
}
export const useAging = (): AgingBucket[] => useDerived(agingBuckets);
