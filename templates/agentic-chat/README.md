# agentic-chat — AG-UI overlay

Mevcut bir `nextjs-fullstack` projesine eklenen **overlay**. Tam proje degil:
kendi `next.config`, `tailwind.config` veya `app/layout` getirmez.

Amac: **anahtarsiz, modelsiz calisan** bir AG-UI iskeleti. Kitaptaki
`ag-ui-simple` demosunun mantigi — once protokolu gor, model sonra gelsin.

## Kurulum

```bash
npm i @copilotkit/react-core@1.69.2 @ag-ui/client@0.0.57 @ag-ui/core@0.0.57 zod
cp -r templates/agentic-chat/app/* <proje>/app/
cp templates/agentic-chat/.env.example <proje>/.env.local
```

> **Surumleri elle degistirmeyin.** `@ag-ui/client` **tam olarak** CopilotKit'in
> bagimli oldugu surum olmali. `latest` kurmak ikinci bir kopya yaratir ve
> `HttpAgent` tipi `AbstractAgent`e atanamaz hale gelir. → `mistakes.md #71`
>
> Dogru surumu su komut verir:
> ```bash
> npm view @copilotkit/react-core@<surum> dependencies.@ag-ui/client
> ```

## Baglama

```tsx
// app/layout.tsx
import { CopilotProvider } from './providers/copilot-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <CopilotProvider>{children}</CopilotProvider>
      </body>
    </html>
  )
}
```

Tool'lari, kartlari ve onaylari kaydetmek icin `snippets/` altindaki uc dosyayi
kullanin — hepsi `tsc --noEmit` ile dogrulanmistir:

| Snippet | Ne kaydeder | Ne zaman |
|---------|-------------|----------|
| `agent-tool.tsx` | `useFrontendTool` | Agent'in tarayicida calistirdigi is + widget |
| `action-card.tsx` | `useRenderTool` | Sunucu tool'unun sonucu + Geri Al |
| `agent-approval.tsx` | `useHumanInTheLoop` | Geri alinamaz aksiyon oncesi onay |

Kaydeden bilesen `CopilotProvider` agacinin **icinde** render edilmeli:

```tsx
'use client'
function AgentWiring() {
  useFindFlightsTool(handleSearch)
  useFlightWidget()
  useBookFlightCard(undoBooking)
  useCancelFlightApproval()
  useDefaultRenderTool()   // kendi karti olmayan tool'lar icin varsayilan kart
  return null
}
```

## `app/api/agent/route.ts` — senaryo secilebilir mock endpoint

Gecerli AG-UI olaylarini SSE olarak yayinlar. Model yok, anahtar yok.
Senaryo query string ile secilir:

```
POST /api/agent?scenario=tool
```

| Senaryo | Ne yayinlar | Neyi calistirir |
|---------|-------------|-----------------|
| `text` *(varsayilan)* | Parca parca akan metin | Streaming |
| `tool` | Sunucu tool'u: cagri + sonuc + metin | Seffaflik / varsayilan tool karti |
| `widget` | Frontend tool cagrisi (sonucsuz) | `useFrontendTool` + `render` |
| `card` | Sunucu tool'u + sonuc | `useRenderTool` (action card) |
| `interrupt` | `RUN_FINISHED` + `outcome.interrupt` | `useHumanInTheLoop` |
| `steps` | `STEP_STARTED` / `STEP_FINISHED` | Workflow ilerleme gostergesi |
| `state` | `STATE_SNAPSHOT` | Paylasilan state — tool karti YOK |

Ne ise yarar:

- Protokolu **gorunur** kilar — devtools'ta Network > EventStream
- Snippet'lerin her birini **anahtarsiz** ucdan uca calistirir
- Ayni senaryolar testlerde fixture olarak kullanilir (`lib/agui-scenarios.ts`),
  yani test ile calisan uygulama ayrisamaz
- Gercek agent'a gecis tek satir: `NEXT_PUBLIC_AGENT_URL` doldurulur

## Testler

```bash
npx vitest run
```

| Dosya | Ne dogrular |
|-------|-------------|
| `__tests__/agui-scenarios.test.ts` | Fixture'lar AG-UI'in **kendi Zod semalarina** uyuyor mu |
| `__tests__/agui-contract.test.ts` | Gercek `HttpAgent` + sahte `fetch` + gercek SSE byte'lari — protokolun **iki yonu** |
| `snippets/agent-tool.test.ts` | Tool handler'i: **cift iddia** (donus degeri + yan etki) |

`vitest.config.ts` `@copilotkit/react-core`'u inline'a alir; almazsa Node paketin
CSS import'unu cozemez. → `mistakes.md #72`

## Gercek agent'a gecerken — ONCE bunu olcun

`maxDuration = 60` route'ta bilincli olarak duruyor. Agent run'lari dakikalara
uzayabilir; serverless fonksiyonun bir ust siniri var.

**POC'nin ilk isi**: gercek bir agent'la en uzun run'i olc ve hesabinin
fonksiyon sure limitiyle karsilastir. Asiyorsa agent ayri, uzun omurlu bir
serviste calismali — Next.js route'u yalnizca proxy olur.

Bu olculmeden protokol secimi yapilmasin. → `knowledge/decisions.md`
