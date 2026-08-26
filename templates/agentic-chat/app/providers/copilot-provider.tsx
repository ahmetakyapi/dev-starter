'use client'

import { HttpAgent } from '@ag-ui/client'
import { CopilotKitProvider } from '@copilotkit/react-core/v2'
import { useMemo, type ReactNode } from 'react'

export const AGENT_ID = 'ticketingAgent'

export function CopilotProvider({ children }: { children: ReactNode }) {
  const agent = useMemo(
    () => new HttpAgent({ url: process.env.NEXT_PUBLIC_AGENT_URL ?? '/api/agent' }),
    [],
  )
  return (
    <CopilotKitProvider
      selfManagedAgents={{ [AGENT_ID]: agent }}
      showDevConsole={process.env.NODE_ENV === 'development'}
      onError={({ error, code }) => console.error('[copilotkit]', code, error.message)}
    >
      {children}
    </CopilotKitProvider>
  )
}
