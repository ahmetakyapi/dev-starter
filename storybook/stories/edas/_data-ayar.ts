import { createSlice } from "./_core";
import { INTEGRATIONS, READ_ROUTES_START, TEMPLATES_START, USERS, type SettingsUser, type Template } from "./_data-operasyon";

/**
 * Ayarlar sayfasının KAYDEDİLEN durumu: kullanıcılar, okuma turları, entegrasyon
 * bağlantıları, bildirim şablonları, görünüm. Sayfa yerel taslak tutar (Kaydet'e
 * kadar); Kaydet bu dilime yazar. Böylece sayfa değişince kayıtlı ayar kaybolmaz
 * ve Uyum Merkezi aynı kullanıcı listesini okur.
 *
 * Tarifeler, yetki matrisi, onay politikası ve kesme politikası burada DEĞİL:
 * onlar kendi dilimlerinde (`_settings.ts`, `_permissions.ts`, `_cutpolicy.ts`).
 */

export type Look = { theme: "light" | "dark" | "system"; density: "comfortable" | "compact"; language: string };

export type AyarState = {
  users: readonly SettingsUser[];
  forceTwoFactor: boolean;
  routes: typeof READ_ROUTES_START;
  connected: Readonly<Record<string, boolean>>;
  templates: readonly Template[];
  look: Look;
};

export const AYAR_START: AyarState = {
  users: USERS,
  forceTwoFactor: false,
  routes: READ_ROUTES_START,
  connected: Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected])),
  templates: TEMPLATES_START,
  look: { theme: "system", density: "comfortable", language: "tr" },
};

const slice = createSlice<AyarState>(AYAR_START);
export const useAyar = () => slice.use();
export const getAyar = () => slice.get();
export const saveAyar = (patch: Partial<AyarState>) => slice.set((s) => ({ ...s, ...patch }));
export const activeUsers = () => slice.get().users.filter((u) => u.active);
