import { createSlice } from "./_core";

/**
 * Sayaç stok sayımı kayıtları: sayfa değişince korunur (modül düzeyinde dilim).
 * Her sayım depo başına "sistem" ve "sayılan" adedi ile farkı tutar.
 */
export type CountLine = { depot: string; system: number; counted: number };
export type CountReport = { id: string; at: string; by: string; lines: readonly CountLine[] };

export const countReports = createSlice<readonly CountReport[]>([]);
export const useCountReports = () => countReports.use();

export const countDiff = (r: CountReport) => r.lines.reduce((s, l) => s + (l.counted - l.system), 0);

/** Stok sayfası liste durumu (görünüm, arama, süzgeç). */
export type StockUi = { view: string; query: string; filters: Readonly<Record<string, readonly string[]>> };
export const stockListUi = createSlice<StockUi>({ view: "hepsi", query: "", filters: {} });
