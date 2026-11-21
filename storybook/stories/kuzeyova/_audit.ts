import { createSlice, nextId } from "./_core";
import { AUDIT_LOG, USERS, type RoleId } from "./_data-operasyon";
import { currentRole, currentUser } from "./_permissions";

/**
 * Denetim izi: portalda yapılan HER değişiklik buraya yazılır (ödeme, kesme,
 * onay, tarife...). Günlük değişmezdir: kayıt eklenir, silinmez ya da düzenlenmez.
 * Açılışta Ayarlar'ın eski tohum günlüğü ("seed") altta durur; yeni işlemler
 * üstüne "portal" kaynağıyla eklenir.
 */

export type AuditRecord = {
  id: string;
  at: Date;
  user: string;
  role: RoleId;
  action: string;
  target: string;
  /** Önce/sonra özeti (kısa metin). */
  before?: string;
  after?: string;
  ip: string;
  ok: boolean;
  origin: "seed" | "portal";
};

const roleOf = new Map(USERS.map((u) => [u.name, u.role] as const));

const log = createSlice<readonly AuditRecord[]>(
  AUDIT_LOG.map((e) => ({ id: e.id, at: e.at, user: e.user, role: roleOf.get(e.user) ?? "yonetici", action: e.action, target: e.target, ip: e.ip, ok: e.ok, origin: "seed" as const })),
);

export const useAuditLog = () => log.use();
export const getAuditLog = () => log.get();

let clock = 0;

/** Bir işlemi günlüğe yazar. `ok: false` reddedilen deneme (yetki yok vb.). */
export function audit(action: string, target: string, before?: string, after?: string, ok = true): AuditRecord {
  const me = currentUser();
  const rec: AuditRecord = {
    id: nextId("AL-", 9100),
    at: new Date(2026, 10, 21, 10, 40 + ++clock),
    user: me.name,
    role: currentRole(),
    action,
    target,
    before,
    after,
    ip: "10.24.1.*",
    ok,
    origin: "portal",
  };
  log.set((list) => [rec, ...list]);
  return rec;
}

/** Yetkisiz deneme: işlem yapılmaz, yalnız reddedildiği kaydedilir. */
export const auditDenied = (action: string, target: string) => audit(action, target, undefined, "Yetki yok, reddedildi", false);
