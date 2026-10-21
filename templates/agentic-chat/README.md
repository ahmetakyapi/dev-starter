# agentic-chat — AG-UI overlay

Mevcut bir `nextjs-fullstack` projesine eklenen **overlay**. Tam proje degil:
kendi `next.config`, `tailwind.config` veya `app/layout` getirmez.

Amac: **anahtarsiz, modelsiz calisan** bir AG-UI iskeleti. Kitaptaki
`ag-ui-simple` demosunun mantigi — once protokolu gor, model sonra gelsin.

## Kurulum

```bash
npm i @copilotkit/react-core@1.69.2 @ag-ui/client@0.0.57 @ag-ui/core@0.0.57 zod
cp -R templates/agentic-chat/app/. <proje>/app/
mkdir -p <proje>/lib && cp templates/agentic-chat/lib/agui-scenarios.ts <proje>/lib/
cat templates/agentic-chat/.env.example >> <proje>/.env.local   # EKLE, ezme
```

`route.ts` `@/lib/agui-scenarios`i import eder; `lib/` kopyalanmazsa build
"Module not found" ile durur. `.env.local` mevcut projenin sirlarini
(DATABASE_URL, AUTH_SECRET, OAuth) tasir: uzerine `cp` degil, sonuna `>>`.

> **Surumleri elle degistirmeyin.** `@ag-ui/client` **tam olarak** CopilotKit'in
> bagimli oldugu surum olmali. `latest` kurmak ikinci bir kopya yaratir ve
> `HttpAgent` tipi `AbstractAgent`e atanamaz hale gelir. → `mistakes.md #71`
>
> Dogru surumu su komut verir:
> ```bash
> npm view @copilotkit/react-core@<surum> dependencies.@ag-ui/client
> ```

## Baglama

Provider'i **yalnizca sohbetin oldugu segmente** koyun, kok layout'a degil:

```tsx
// app/sohbet/layout.tsx — YALNIZCA sohbet olan segment
import { CopilotProvider } from '@/app/providers/copilot-provider'

export default function SohbetLayout({ children }: { children: React.ReactNode }) {
  return <CopilotProvider>{children}</CopilotProvider>
}
```

```tsx
// app/sohbet/chat-panel.tsx
'use client'
import { CopilotChat } from '@copilotkit/react-core/v2'

export function ChatPanel() {
  return <CopilotChat />   // agentId gerekmez: provider agent'i 'default' adiyla kaydeder
}
```

> **Kok layout'a koymayin.** `@copilotkit/react-core/v2` tek bir `'use client'`
> girisidir; yalnizca `CopilotKitProvider`i import etmek bile markdown, radix,
> lit bilesenleri ve sanal liste grafini getirir. Kok layout'ta bu, sohbeti
> olmayan her sayfaya ~2,4 MB JS (~640 KB gzip) ekler (`next build` ile
> olculdu). Sohbet site genelinde lazimsa (popup) sohbet adasini kullanici
> istediginde yukleyin: `next/dynamic(() => import('./chat-island'), { ssr: false })`
> + "Sohbeti Ac" dugmesi.

> **Lisans notu.** CopilotKit 1.69.2, `selfManagedAgents` icin "Enterprise
> Intelligence katmani" uyarisi basar ve uretimde `publicLicenseKey` ister.
> Paketler MIT'tir, bugun hicbir ozellik kilitlenmiyor; ama yayina cikmadan
> once karar verin: lisans anahtari
> (`publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY}`),
> `runtimeUrl` ile CopilotKit runtime'i ya da CopilotKit'in React katmani
> olmadan `@ag-ui/client`i dogrudan surmek.

Tool'lari, kartlari ve onaylari kaydetmek icin `snippets/` altindaki uc dosyayi
kullanin — hepsi `tsc --noEmit` ile dogrulanmistir:

| Snippet | Ne kaydeder | Ne zaman |
|---------|-------------|----------|
| `agent-tool.tsx` | `useFrontendTool` | Agent'in tarayicida calistirdigi is + widget |
| `action-card.tsx` | `useRenderTool` | Sunucu tool'unun sonucu + Geri Al |
| `agent-approval.tsx` | `useHumanInTheLoop` | Geri alinamaz aksiyon oncesi onay |

Kaydeden bilesen `CopilotProvider` agacinin **icinde**, yani ayni segmentte
render edilmeli:

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
| `interrupt` | Sonucsuz frontend tool cagrisi (`cancelFlight`: hedef + aciklama) | `useHumanInTheLoop` (onay karti) |
| `steps` | `STEP_STARTED` / `STEP_FINISHED` | Workflow ilerleme gostergesi |
| `state` | `STATE_SNAPSHOT` | Paylasilan state — tool karti YOK |

Ne ise yarar:

- Protokolu **gorunur** kilar — devtools'ta Network > EventStream
- Snippet'lerin her birini **anahtarsiz** ucdan uca calistirir
- Ayni senaryolar testlerde fixture olarak kullanilir (`lib/agui-scenarios.ts`),
  yani test ile calisan uygulama ayrisamaz
- Son mesaj bir tool sonucuysa (onay cevabi, frontend tool'un donusu) senaryo
  ne olursa olsun metinle kapanir: `?scenario=interrupt` sabitken her cevap
  yeni bir onay sorusu dogurmaz

Onay senaryosunda `RUN_FINISHED` interrupt outcome'u **tasimaz**:
`useHumanInTheLoop` cevabi bir sonraki run'a tool mesaji olarak yollar,
`resume` gondermez; acik kalan interrupt `@ag-ui/client`te sonraki her run'i
durdurur. AG-UI'in standart interrupt'i (`reason: 'tool_call'` + `toolCallId`)
`useInterrupt` ile tuketilir; o ayri bir akis.

## Gercek agent'a gecis — tarayici ayni kokende kalir

Tarayici her zaman `/api/agent`a konusur. Gercek agent'a (Mastra, LangGraph,
Spring AI...) gecerken bu route **silinmez, kimlik dogrulayan vekile donusur**:

- `await auth()` — oturum yoksa 401
- kullanici basina `rateLimit` + token butcesi (rules/agentic-ui.md 9)
- istek sunucu tarafi `AGENT_URL`e sunucu sirri ve kullanici kimligiyle iletilir;
  tool'lar o kullanicinin yetkisiyle calisir (kural 2)

`NEXT_PUBLIC_AGENT_URL`e dis adres yazmayin: deger pakete gomulur ve agent'i
kimliksiz, butcesiz herkese acar. Bu yuzden `CopilotProvider` yalnizca ayni
kokendeki yolu kabul eder; dis adresi yok sayar (gelistirmede uyari basar).

## Testler

Overlay testleri projede degil, **dev-starter'da** kosar:

```bash
npm run verify:agentic   # CI 'agentic' isi de bunu calistirir
```

Komut pin'li bagimliliklari gecici bir dizine kurar ve `src/` duzeninde
`tsc --noEmit` + `vitest run` calistirir; `vitest.config.ts` o duzene goredir
(`@` -> `./src`). Testleri projeye tasimak isterseniz `__tests__/`u ve
config'i kopyalayin, `npm i -D vitest` kurun ve alias'i projenin kokune (`./`)
cevirin. `nextjs-fullstack` kendi testlerini `node --test` ile kosar.

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
