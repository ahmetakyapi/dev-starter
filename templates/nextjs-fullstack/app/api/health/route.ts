/**
 * Canlılık ucu: süreç ayakta mı. Hiçbir dış bağımlılığa BİLEREK gitmez; yük
 * dengeleyici ya da izleme servisi bunu dakikada bir çağırır, ucuz kalmalı
 * ve varsa uyuyan veritabanını (Neon) uyandırmamalı. Bağımlılık kontrolü
 * gerekiyorsa ayrı bir hazırlık ucu (`/api/health/ready`) yazılır ve korunur:
 * nextjs-fullstack şablonundaki `lib/api-auth.ts` → `checkBearer`.
 */
export function GET() {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
