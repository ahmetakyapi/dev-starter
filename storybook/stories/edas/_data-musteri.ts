"use client";

import { useSyncExternalStore } from "react";
import {
  CUSTOMERS,
  INVOICES,
  KIND_LABEL,
  METERS,
  REGIONS,
  SUPPLIERS,
  TODAY_KEY,
  balanceOf,
  customerById,
  metersOf,
  type Customer,
  type CustomerKind,
  type CustomerStatus,
  type Meter,
} from "./_data";

/**
 * Müşteriler ve Müşteri Kaydı sayfalarının ortak çalışma verisi.
 *
 * `_data.ts` salt okunur; bu dosya onun ÜSTÜNE oturumluk değişiklik koyar:
 * kayıt sihirbazının eklediği yeni aboneler, ayrıntı ekranında yapılan
 * güncellemeler (iletişim, tarife, tedarikçi, kesme/bağlama, kapatma), eklenen
 * notlar ve işlem geçmişi. Küçük bir dış depo + `useSyncExternalStore`: sayfa
 * değişince (bileşen yeniden bağlanınca) değişiklikler kaybolmaz, Storybook
 * yenilenince sıfırlanır. Veri tabanı değil, demo.
 */

/* --- Doğrulama kuralları ------------------------------------------------- */

/** T.C. kimlik numarası algoritması (11 hane, ilk hane 0 değil, iki sağlama hanesi). */
export function validTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = [...value].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** Vergi kimlik numarası algoritması (10 hane, son hane sağlama). */
export function validVkn(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const d = [...value].map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const t = (d[i] + (9 - i)) % 10;
    let v = (t * 2 ** (9 - i)) % 9;
    if (t !== 0 && v === 0) v = 9;
    sum += v;
  }
  return (10 - (sum % 10)) % 10 === d[9];
}

/** TR IBAN: ülke kodu + 24 hane, mod 97 sağlama. */
export function validIban(value: string): boolean {
  const s = value.replace(/\s/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(s)) return false;
  const n = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let rem = 0;
  for (const digit of n) rem = (rem * 10 + Number(digit)) % 97;
  return rem === 1;
}

export const validPhone = (value: string) => /^05\d{9}$/.test(value.replace(/\s/g, ""));
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

/** Denemeye yardım: sihirbazda geçerli kimlikler ve zaten kayıtlı olan. */
export const DEMO_IDS = {
  tckn: "10000000146",
  vkn: "1234567808",
  iban: "TR33 0006 1005 1978 6457 8413 26",
} as const;

/** Bu kimliklerle KAYITLI abone var (yineleme uyarısını denemek için). */
export const KNOWN_IDS: Readonly<Record<string, string>> = {
  [DEMO_IDS.tckn]: CUSTOMERS.find((c) => c.kind === "bireysel")!.id,
  [DEMO_IDS.vkn]: CUSTOMERS.find((c) => c.kind === "ticari")!.id,
};

/* --- Oturum deposu -------------------------------------------------------- */

export type HistoryTone = "neutral" | "primary" | "success" | "warning" | "danger";
export type HistoryEvent = { id: string; at: string; when: string; title: string; description?: string; tone: HistoryTone };
export type Note = { id: string; author: string; when: string; text: string };
export type WorkRequest = { id: string; kind: "kesme" | "baglama"; reason: string; date: string };

export type CustomerPatch = Partial<
  Pick<Customer, "phone" | "email" | "status" | "supplierId" | "autoPay" | "address" | "tariff">
> & { pendingWork?: WorkRequest | null; closed?: boolean; supplierChange?: { supplierId: string; date: string } | null };

type Store = {
  version: number;
  added: Customer[];
  addedMeters: Meter[];
  patches: Map<string, CustomerPatch>;
  history: Map<string, HistoryEvent[]>;
  notes: Map<string, Note[]>;
  listeners: Set<() => void>;
};

const store: Store = { version: 0, added: [], addedMeters: [], patches: new Map(), history: new Map(), notes: new Map(), listeners: new Set() };

function emit() {
  store.version += 1;
  store.listeners.forEach((l) => l());
}

/** Depo her değişince sayfayı yeniden çizdirir. Dönen sayı yalnız bağımlılık içindir. */
export function useCustomerStore(): number {
  return useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.version,
    () => store.version,
  );
}

const stamp = () => ({ at: TODAY_KEY, when: "Bugün, 10:40" });
let seq = 1;

export function patchCustomer(id: string, patch: CustomerPatch, event?: Omit<HistoryEvent, "id" | "at" | "when">) {
  store.patches.set(id, { ...store.patches.get(id), ...patch });
  if (event) addHistory(id, event, false);
  emit();
}

export function addHistory(id: string, event: Omit<HistoryEvent, "id" | "at" | "when">, notify = true) {
  const list = store.history.get(id) ?? [];
  store.history.set(id, [{ id: `h-${seq++}`, ...stamp(), ...event }, ...list]);
  if (notify) emit();
}

export function addNote(id: string, text: string) {
  const list = store.notes.get(id) ?? [];
  store.notes.set(id, [{ id: `n-${seq++}`, author: "Aylin Yıldırım", when: "Bugün, 10:40", text }, ...list]);
  addHistory(id, { title: "Not eklendi", description: text.length > 70 ? `${text.slice(0, 70)}…` : text, tone: "neutral" }, false);
  emit();
}

export function addCustomer(customer: Customer, meter: Meter) {
  store.added = [customer, ...store.added];
  store.addedMeters = [meter, ...store.addedMeters];
  addHistory(customer.id, { title: "Abonelik açıldı", description: "Müşteri kaydı sihirbazıyla oluşturuldu.", tone: "success" }, false);
  emit();
}

/* --- Okuma (ek veriyle birleşik) ------------------------------------------ */

/** Oturumda eklenenler dahil bütün müşteriler (en yeni üstte). */
export const allCustomers = (): Customer[] => [...store.added, ...CUSTOMERS].map(withPatch);

export const withPatch = (c: Customer): Customer => {
  const p = store.patches.get(c.id);
  return p ? { ...c, ...p, status: p.closed ? "kapali" : (p.status ?? c.status) } : c;
};

export const findCustomer = (id: string): Customer | undefined => {
  const c = store.added.find((x) => x.id === id) ?? customerById(id);
  return c ? withPatch(c) : undefined;
};

export const patchOf = (id: string) => store.patches.get(id);
export const metersFor = (id: string): Meter[] => [...store.addedMeters.filter((m) => m.customerId === id), ...metersOf(id)];
export const historyOf = (id: string): HistoryEvent[] => store.history.get(id) ?? [];
export const notesOf = (id: string): Note[] => store.notes.get(id) ?? [];
export const isAdded = (id: string) => store.added.some((c) => c.id === id);

/** Müşteri başına açık bakiye (kuruş) ve geciken fatura sayısı; bir kez hesaplanır. */
const balances = new Map<string, { balance: number; overdue: number }>();
for (const inv of INVOICES) {
  const b = balances.get(inv.customerId) ?? { balance: 0, overdue: 0 };
  if (inv.status !== "odendi") b.balance += balanceOf(inv);
  if (inv.status === "gecikti" || (inv.status === "kismi" && inv.due < TODAY_KEY)) b.overdue += 1;
  balances.set(inv.customerId, b);
}
export const accountOf = (id: string) => balances.get(id) ?? { balance: 0, overdue: 0 };

/** Riskli: iki ya da daha çok geciken faturası olan ya da sayacında müdahale/arıza şüphesi olan abone. */
export function isRisky(c: Customer): boolean {
  if (accountOf(c.id).overdue >= 2) return true;
  return metersFor(c.id).some((m) => m.status === "mudahale" || m.status === "arizali");
}

/* --- Süzme, sıralama ------------------------------------------------------- */

export type ListQuery = {
  q: string;
  status: string;
  kind: string;
  volt: string;
  region: string;
  supplier: string;
  sort: string;
  dir: "asc" | "desc";
};

const fold = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");

export function matchesQuery(c: Customer, q: string): boolean {
  const needle = fold(q.trim());
  if (!needle) return true;
  const meters = metersFor(c.id);
  const hay = [c.name, c.id, c.installation, c.taxMasked, c.district, ...meters.map((m) => m.serial)].map(fold).join(" ");
  return needle.split(/\s+/).every((part) => hay.includes(part));
}

export function filterCustomers(rows: readonly Customer[], query: ListQuery): Customer[] {
  const out = rows.filter((c) => {
    if (query.kind && c.kind !== query.kind) return false;
    if (query.volt && c.voltage !== query.volt) return false;
    if (query.region && c.regionId !== query.region) return false;
    if (query.supplier && c.supplierId !== query.supplier) return false;
    if (query.status === "serbest" && !c.free) return false;
    if (query.status === "gorevli" && c.free) return false;
    if (query.status === "riskli" && !isRisky(c)) return false;
    if (query.status === "kesik" && c.status !== "kesik") return false;
    return matchesQuery(c, query.q);
  });
  const sign = query.dir === "desc" ? -1 : 1;
  const key: (c: Customer) => number | string = {
    name: (c: Customer) => c.name,
    id: (c: Customer) => c.id,
    usage: (c: Customer) => c.baseKwh,
    balance: (c: Customer) => accountOf(c.id).balance,
    region: (c: Customer) => c.regionId,
    since: (c: Customer) => c.since,
  }[query.sort] ?? ((c: Customer) => c.id);
  return out.sort((a, b) => {
    const x = key(a);
    const y = key(b);
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr-TR")) * sign;
  });
}

/* --- Etiketler, sözleşme ---------------------------------------------------- */

export const TAGS = ["Öncelikli Müşteri", "Hassas Abone (Tıbbi Cihaz)", "Yakın Takip", "Ödeme Planlı", "Toplu Okuma Turu"] as const;

/** Aboneye ait örnek sözleşme bilgisi (gerçek tutar ya da hüküm değildir). */
export function contractOf(c: Customer) {
  const sup = SUPPLIERS.find((s) => s.id === c.supplierId) ?? SUPPLIERS[0];
  const power = c.voltage === "OG" ? Math.max(250, Math.round(c.baseKwh / 180) * 10) : c.kind === "bireysel" ? 8 : c.kind === "tarim" ? 22 : 18;
  return {
    supplier: sup,
    power,
    start: c.since,
    end: sup.contractEnd,
    autoRenew: c.free,
    tariffLabel: c.tariff === "tek-zamanli" ? "Tek zamanlı" : "Çok zamanlı (T1 gündüz, T2 puant, T3 gece)",
  };
}

/* --- Kayıt sihirbazı için sabitler ----------------------------------------- */

export const TARIFFS = [
  { value: "mesken", label: "Mesken", kind: "bireysel" as CustomerKind, perKw: 410 },
  { value: "ticarethane", label: "Ticarethane", kind: "ticari" as CustomerKind, perKw: 530 },
  { value: "sanayi", label: "Sanayi", kind: "sanayi" as CustomerKind, perKw: 690 },
  { value: "tarimsal", label: "Tarımsal sulama", kind: "tarim" as CustomerKind, perKw: 340 },
  { value: "aydinlatma", label: "Genel aydınlatma", kind: "ticari" as CustomerKind, perKw: 300 },
] as const;

export const METER_POOL: readonly { id: string; serial: string; model: string; comm: "ami" | "gsm" | "elle"; multiZone: boolean }[] = [
  { id: "P-001", serial: "KZA-26-480112", model: "Akıllı Sayaç AS-310", comm: "ami", multiZone: false },
  { id: "P-002", serial: "KZA-26-480119", model: "Akıllı Sayaç AS-310", comm: "ami", multiZone: false },
  { id: "P-003", serial: "KZA-26-480231", model: "Akıllı Sayaç AS-330 (3 faz)", comm: "ami", multiZone: true },
  { id: "P-004", serial: "KZA-26-480305", model: "Elektronik Sayaç ES-120", comm: "elle", multiZone: false },
  { id: "P-005", serial: "KZO-26-120044", model: "OG Sayaç OS-500", comm: "gsm", multiZone: true },
];

export const METER_MODELS = ["Akıllı Sayaç AS-310", "Akıllı Sayaç AS-330 (3 faz)", "Elektronik Sayaç ES-120", "OG Sayaç OS-500"] as const;

export const CITY_DISTRICTS = REGIONS.flatMap((r) => r.districts.map((d) => ({ value: `${r.id}|${d}`, label: `${d} (${r.name})`, regionId: r.id, district: d })));

export const KIND_BY_TARIFF = (tariff: string): CustomerKind => TARIFFS.find((t) => t.value === tariff)?.kind ?? "bireysel";
export { KIND_LABEL };
export type { CustomerKind, CustomerStatus };
export { METERS };
