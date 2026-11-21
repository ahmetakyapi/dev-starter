import { createSlice } from "./_core";
import { DEFAULT_LATE_RATES, DEFAULT_PARAMS, type BillingParams, type LateRateRow } from "./_billing";
import { TARIFFS_START, TARIFF_HISTORY, type Tariff, type TariffChange } from "./_data-operasyon";
import { FREE_LIMIT_KWH } from "./_data";

/**
 * Ayarlar → Tarifeler'in TEK kaynağı. Fatura çekirdeği (`_billing.ts`), tahakkuk
 * taslakları ve tedarikçi teklifleri buradaki güncel parametreleri okur; bir
 * tarife değişince sonraki tahakkuk yeni değerle hesaplanır.
 *
 * Bütün değerler ÖRNEK PARAMETREDİR (gerçek mevzuat sayısı değil): bkz. `_billing.ts`.
 */

export type SettingsState = {
  params: BillingParams;
  lateRates: readonly LateRateRow[];
  freeLimitKwh: number;
  tariffs: readonly Tariff[];
  history: readonly TariffChange[];
};

const settings = createSlice<SettingsState>({
  params: DEFAULT_PARAMS,
  lateRates: DEFAULT_LATE_RATES,
  freeLimitKwh: FREE_LIMIT_KWH,
  tariffs: TARIFFS_START,
  history: TARIFF_HISTORY,
});

export const useSettings = () => settings.use();
export const getSettings = () => settings.get();
export const getBillingParams = (): BillingParams => settings.get().params;
export const getLateRates = (): readonly LateRateRow[] => settings.get().lateRates;

/** Tarife satırı → fatura parametresi eşlemesi. */
function apply(params: BillingParams, id: string, value: number): BillingParams {
  const p: BillingParams = { ...params, distribution: { ...params.distribution }, fundPct: { ...params.fundPct }, btvPct: { ...params.btvPct }, vatPct: { ...params.vatPct }, zoneMultiplier: { ...params.zoneMultiplier } };
  switch (id) {
    case "dist-bireysel": p.distribution.bireysel = value; break;
    case "dist-ticari": p.distribution.ticari = value; break;
    case "dist-sanayi": p.distribution.sanayi = value; break;
    case "dist-tarim": p.distribution.tarim = value; break;
    case "yekdem": p.yekdem = value; break;
    case "fon-konut": p.fundPct.bireysel = value; break;
    case "fon-diger": p.fundPct.ticari = value; p.fundPct.sanayi = value; p.fundPct.tarim = value; break;
    case "btv": p.btvPct.bireysel = value; p.btvPct.ticari = value; break;
    case "kdv": p.vatPct.bireysel = value; p.vatPct.ticari = value; p.vatPct.sanayi = value; break;
    case "iletim": p.transmission = value; break;
    case "reaktif-endukt": p.reactiveInductiveLimit = value / 100; break;
    case "reaktif-kapasitif": p.reactiveCapacitiveLimit = value / 100; break;
    case "reaktif-bedel": p.reactiveRate = value; break;
    case "guc-asim": p.powerOverRate = value; break;
    case "t2-carpan": p.zoneMultiplier.t2 = value; break;
    case "t3-carpan": p.zoneMultiplier.t3 = value; break;
    default: break;
  }
  return p;
}

/**
 * Tarifeyi günceller (yürürlük tarihli): satırı, geçmişi ve fatura parametresini
 * birlikte değiştirir. Çağıran yetki ve iki göz onayını denetler (`_store.ts` → `updateTariff`).
 */
export function applyTariff(id: string, value: number, effective: string, by: string) {
  settings.set((s) => {
    const row = s.tariffs.find((t) => t.id === id);
    if (!row) return s;
    const change: TariffChange = { id: `h${s.history.length + 1}`, label: row.label, from: row.value, to: value, effective, by };
    return {
      ...s,
      params: apply(s.params, id, value),
      lateRates: id === "gecikme" ? [...s.lateRates, { from: effective, monthlyPct: value }] : s.lateRates,
      freeLimitKwh: id === "serbest-limit" ? value : s.freeLimitKwh,
      tariffs: s.tariffs.map((t) => (t.id === id ? { ...t, value, effective, by } : t)),
      history: [change, ...s.history],
    };
  });
}
