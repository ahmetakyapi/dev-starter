/**
 * @ahmetakyapi/ui/core — sunucu-güvenli giriş
 *
 * Ana giriş (`@ahmetakyapi/ui`) tek bundle ve `'use client'` banner'ı
 * taşıyor; oradan dışa aktarılan her şey Server Component'e istemci
 * referansı olarak gelir. `cn()` çağrısı prerender'da "is on the client"
 * hatasıyla kırılır, `DUR.fast` ise hata vermeden `undefined` okunur
 * (mistakes.md #84). Saf değerler bu girişten alınır: banner yok, hook yok.
 *
 * Buraya yalnızca React/motion hook'u çağırmayan şey eklenir.
 */
export * from './variants'
export { cn } from './utils'
