"use client";

import { createSlice } from "./_core";
import { TAGS } from "./_data-musteri";

/**
 * Abone listesinin kayıtlı görünümleri (kullanıcıya özel, oturumluk).
 * Sabit görünümler listenin sorusudur ("kimden başlamalıyım?"): Tümü, Riskli,
 * Serbest tüketici, Enerjisi kesik, Hassas abone. Kullanıcı kendi süzgeç
 * birleşimini adla kaydeder; adres parametreleri olarak saklanır (derin bağlantıyla aynı dil).
 */
export const HASSAS_TAG = TAGS[1];

export type CustomerView = { id: string; label: string; params: Record<string, string>; builtin?: boolean };

export const BUILTIN_VIEWS: readonly CustomerView[] = [
  { id: "all", label: "Tümü", params: {}, builtin: true },
  { id: "riskli", label: "Riskli", params: { status: "riskli" }, builtin: true },
  { id: "serbest", label: "Serbest Tüketici", params: { status: "serbest" }, builtin: true },
  { id: "kesik", label: "Enerjisi Kesik", params: { status: "kesik" }, builtin: true },
  { id: "hassas", label: "Hassas Abone", params: { tag: HASSAS_TAG }, builtin: true },
];

const saved = createSlice<readonly CustomerView[]>([]);
export const useSavedCustomerViews = () => saved.use();

export function saveCustomerView(label: string, params: Record<string, string>) {
  const view: CustomerView = { id: `v-${saved.get().length + 1}-${label.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}`, label, params };
  saved.set((list) => [...list, view]);
  return view;
}
export const deleteCustomerView = (id: string) => saved.set((list) => list.filter((v) => v.id !== id));

/** Süzgeç anahtarları (sıralama ve sayfa görünümün parçası DEĞİL). */
export const FILTER_KEYS = ["q", "status", "kind", "volt", "region", "supplier", "tag"] as const;

const same = (a: Record<string, string>, b: Record<string, string>) => FILTER_KEYS.every((k) => (a[k] ?? "") === (b[k] ?? ""));

/** Adres parametreleri hangi görünüme denk geliyor ("" = hiçbiri). */
export function activeViewId(params: Readonly<Record<string, string>>, views: readonly CustomerView[]): string {
  return views.find((v) => same(params as Record<string, string>, v.params))?.id ?? "";
}
