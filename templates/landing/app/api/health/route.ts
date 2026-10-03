/**
 * Canlılık ucu: süreç ayakta mı. Veritabanına BİLEREK gitmez; yük
 * dengeleyici ya da izleme servisi bunu dakikada bir çağırır ve Neon'u
 * uykudan uyandırmamalı. Bağımlılık kontrolü gerekiyorsa ayrı bir uç
 * (`/api/health/ready`) yaz ve `checkBearer` ile koru.
 */
export function GET() {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
