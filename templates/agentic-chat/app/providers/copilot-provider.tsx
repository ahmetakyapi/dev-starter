'use client'

import { HttpAgent } from '@ag-ui/client'
import { CopilotKitProvider } from '@copilotkit/react-core/v2'
import { useMemo, type ReactNode } from 'react'

const SAME_ORIGIN = 'http://ayni-koken.invalid'

/**
 * Tarayici YALNIZCA ayni kokene konusur (rules/agentic-ui.md 1, 2, 9).
 * NEXT_PUBLIC_ degiskeni pakete gomulur: dis bir agent adresi yazilirsa agent
 * kimliksiz, butcesiz herkese acilir. Degisken yalnizca ayni kokendeki yolu
 * secer (/api/agent?scenario=tool); gercek agent'a /api/agent route'u vekil olur.
 *
 * Bos dizgi = tanimsiz: `.env.example`ten gelen `NEXT_PUBLIC_AGENT_URL=` ""
 * olarak gomulur ve `??` onu yakalamaz — HttpAgent fetch("") ile sayfanin
 * kendisine POST ederdi (nextjs-fullstack lib/env.ts ayni tuzagi anlatir).
 */
function agentUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AGENT_URL?.trim()
  if (!raw) return '/api/agent'
  // Metin on-ekiyle degil URL cozumuyle: "//kotu.site" ve "/\kotu.site" de
  // tarayicida baska kokene gider, ikisi de "/" ile baslar.
  try {
    const url = new URL(raw, SAME_ORIGIN)
    if (url.origin === SAME_ORIGIN) return `${url.pathname}${url.search}`
  } catch {
    // Cozulemeyen adres: asagidaki varsayilana duser
  }
  if (process.env.NODE_ENV === 'development') {
    console.warn('[agent] NEXT_PUBLIC_AGENT_URL ayni kokende degil; yok sayildi, /api/agent kullaniliyor')
  }
  return '/api/agent'
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  // Kayit adi 'default', bilerek: CopilotChat ve useAgent agentId verilmezse
  // 'default'u arar. Baska bir ad her sohbet bileseninde agentId ister;
  // unutulursa "Agent 'default' not found" ile route hata sinirina duser.
  const agents = useMemo(() => ({ default: new HttpAgent({ url: agentUrl() }) }), [])
  // selfManagedAgents: CopilotKit 1.69.2 bunu "Enterprise Intelligence" katmani
  // sayip publicLicenseKey olmadan her yuklemede uyari basar. Paket MIT, bugun
  // bir sey kilitlenmiyor; yayina cikmadan once karar ver -> templates README.
  return (
    <CopilotKitProvider
      selfManagedAgents={agents}
      showDevConsole={process.env.NODE_ENV === 'development'}
      onError={({ error, code }) => console.error('[copilotkit]', code, error.message)}
    >
      {children}
    </CopilotKitProvider>
  )
}
