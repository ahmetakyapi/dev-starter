import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Neden dislaniyor: agentic testler @copilotkit/react-core ve @ag-ui/*
    // paketlerini import eder. Bu paketler bilincli olarak kok bagimlilik
    // DEGIL — dev-starter bir bilgi ve sablon deposu, agentic bir uygulama
    // degil. Kurulmalari kilit dosyasini ve kurulum suresini gereksiz sisirir.
    //
    // Bu testler yine de CI'da CALISIR: `npm run verify:agentic` gecici bir
    // dizinde pin'li bagimliliklari kurup tsc + vitest calistirir ve CI'da
    // kendi isi olarak kosar.
    //
    // Bu dosya var olmasaydi `npm test` templates/ altini tarar ve CI ilk
    // pushta kirmiziya duserdi. -> knowledge/mistakes.md #55, #73
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'templates/**',
      'snippets/agent-tool.test.ts',
    ],
  },
})
