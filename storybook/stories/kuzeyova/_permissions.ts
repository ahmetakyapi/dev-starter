import { createSlice, nextId } from "./_core";
import { PERMISSIONS, PERMISSION_START, ROLES, USERS, type RoleId, type SettingsUser } from "./_data-operasyon";

/**
 * Yetki, oturum ve iki göz onayı: hepsi tek depoda, her sayfa aynı kaynaktan okur.
 *
 * - `can(izin)`: geçerli rolün o izni var mı. Ayarlar'daki yetki matrisi bu
 *   dilimi düzenler; butonlar `useCan` ile gizlenir ya da pasifleşir.
 * - `setViewAs(rol)`: "Şu rol olarak gör": gerçek kullanıcı değişmez, yetkiler
 *   seçilen role göre hesaplanır (denetçi tarife değiştirmeyi dener, reddedilir).
 * - İki göz (dört göz) onayı: kritik işlem (kesme emri, fatura iptali, tarife)
 *   ikinci bir kullanıcının onayını bekler; isteyen kendi isteğini onaylayamaz.
 */

export type Session = { userId: string; viewAs: RoleId | null };
const session = createSlice<Session>({ userId: "u-1", viewAs: null });
const matrix = createSlice<Record<string, readonly RoleId[]>>({ ...PERMISSION_START });

export const useSession = () => session.use();
export const getSession = () => session.get();
export const currentUser = (): SettingsUser => USERS.find((u) => u.id === session.get().userId) ?? USERS[0];
export const currentRole = (): RoleId => session.get().viewAs ?? currentUser().role;

/** Kullanıcı değiştir (giriş simülasyonu): "Şu rol olarak gör" sıfırlanır. */
export function setUser(userId: string) {
  session.set({ userId, viewAs: null });
}
export function setViewAs(role: RoleId | null) {
  session.set((s) => ({ ...s, viewAs: role }));
}

export const usePermissionMatrix = () => matrix.use();
export const getPermissionMatrix = () => matrix.get();

export function can(permission: string, role: RoleId = currentRole()): boolean {
  return matrix.get()[permission]?.includes(role) ?? false;
}
/** Bileşenlerde: yetki ya da oturum değişince yeniden çizilir. */
export function useCan(permission: string): boolean {
  matrix.use();
  session.use();
  return can(permission);
}
export const useRole = (): RoleId => {
  session.use();
  return currentRole();
};

export function setPermission(permission: string, role: RoleId, on: boolean) {
  matrix.set((m) => {
    const roles = new Set(m[permission] ?? []);
    if (on) roles.add(role);
    else roles.delete(role);
    return { ...m, [permission]: [...roles] };
  });
}
export const resetPermissions = () => matrix.set({ ...PERMISSION_START });

export { PERMISSIONS, ROLES };

/* --- İki göz onayı --------------------------------------------------------- */

export type ApprovalKind = "kesme" | "fatura-iptal" | "tarife" | "mahsup";
export const APPROVAL_LABEL: Record<ApprovalKind, string> = { kesme: "Enerji Kesme Emri", "fatura-iptal": "Fatura İptali", tarife: "Tarife Değişikliği", mahsup: "Alacak Mahsubu" };
export type ApprovalStatus = "bekliyor" | "onaylandi" | "reddedildi";
export type Approval = {
  id: string;
  kind: ApprovalKind;
  /** İlgili kayıt (abone/fatura/tarife kimliği). */
  target: string;
  summary: string;
  /** Eylemi çalıştırmak için gereken veri (`_store.ts` → `executeApproval`). */
  payload: Record<string, string | number | boolean>;
  requestedBy: string;
  requestedAt: Date;
  status: ApprovalStatus;
  decidedBy?: string;
  decidedAt?: Date;
  reason?: string;
};

const approvals = createSlice<readonly Approval[]>([]);
export const useApprovals = () => approvals.use();
export const getApprovals = () => approvals.get();

/** Hangi işlemler ikinci göz ister (Ayarlar'dan değiştirilebilir). */
const policy = createSlice<Record<ApprovalKind, boolean>>({ kesme: true, "fatura-iptal": true, tarife: true, mahsup: false });
export const useApprovalPolicy = () => policy.use();
export const requiresFourEyes = (kind: ApprovalKind) => policy.get()[kind];
export const setApprovalPolicy = (kind: ApprovalKind, on: boolean) => policy.set((p) => ({ ...p, [kind]: on }));

let clock = 0;
const stamp = () => new Date(2026, 10, 21, 10, 40 + ++clock);

export function createApproval(input: Omit<Approval, "id" | "requestedBy" | "requestedAt" | "status">): Approval {
  const a: Approval = { ...input, id: nextId("ON-"), requestedBy: currentUser().name, requestedAt: stamp(), status: "bekliyor" };
  approvals.set((list) => [a, ...list]);
  return a;
}

export type DecideResult = { ok: true; approval: Approval } | { ok: false; reason: "kendi-istegi" | "yetki" | "bulunamadi" | "karar-verilmis" };

/** Karar: isteyen kendi isteğini onaylayamaz; kararı verenin ilgili izni olmalı. */
export function decideApproval(id: string, ok: boolean, reason?: string): DecideResult {
  const a = approvals.get().find((x) => x.id === id);
  if (!a) return { ok: false, reason: "bulunamadi" };
  if (a.status !== "bekliyor") return { ok: false, reason: "karar-verilmis" };
  const me = currentUser();
  if (a.requestedBy === me.name) return { ok: false, reason: "kendi-istegi" };
  const permission = a.kind === "kesme" ? "kesme" : a.kind === "fatura-iptal" ? "fatura" : a.kind === "tarife" ? "tarife" : "odeme";
  if (!can(permission)) return { ok: false, reason: "yetki" };
  const next: Approval = { ...a, status: ok ? "onaylandi" : "reddedildi", decidedBy: me.name, decidedAt: stamp(), reason };
  approvals.set((list) => list.map((x) => (x.id === id ? next : x)));
  return { ok: true, approval: next };
}
