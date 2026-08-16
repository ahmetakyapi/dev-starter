import { NextResponse } from 'next/server'

// GET /api/health — deployment sonrası kontrol için.
// force-dynamic ŞART: dinamik API kullanılmadığı için Next bu rotayı build
// zamanında değerlendirir ve timestamp donar — yani deploy doğrulamasının tek
// otomatik kontrolü her koşulda aynı cevabı verirdi.
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
}
