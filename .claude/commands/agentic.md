---
description: Agentic UI karar agaci — tool nereye, kontrol hangi seviyede, model mi kod mu
argument-hint: "tool | kontrol | state | dsl | test | kurulum | denetle"
---

`$ARGUMENTS` konusunda agentic UI karari ver.

**Once oku**: `rules/agentic-ui.md` (10 kural), `agents/agentic-ui-agent.md`
(karar agaclari), `knowledge/patterns.md → Agentic UI`, `knowledge/mistakes.md #58-71`.

## Konular

### `tool` — Tool nereye konur?
Karar agaci: `agents/agentic-ui-agent.md → Karar Agaci 1`.
Ozet: tarayici state'i → frontend tool. Ekrana cizip turu bitiren → widget
(`followUp: false` + aciklamaya da yaz). Yetki/para/kalici etki → sunucu tool'u,
istisnasiz. Paylasilan veri → tool DEGIL, protokolun state kanali.

### `kontrol` — Onay mi, Action Card mi, hic mi?
Geri alinabilir → Action Card + Undo (sorma, yap, geri almayi sun).
Geri alinamaz → onden onay (`useHumanInTheLoop`).
Kirmizi cizgi → tool'u agent'a verme; yonlendiren bir tool ver.

### `state` — Tool mu, protokol mu?
Tool'u veri tasimak icin kullanmak her erisimi bir ag turuna cevirir. Paylasilan
state protokolun kendi kanalindan gider. Belirti: `getX`/`setX` tool'lari
sohbet gecmisini kart cop'une ceviriyorsa yanlis kanaldasin.

### `dsl` — Model tam yapiyi mi uretecek?
Cikti buyuk/tekrar eden/sablonlasabilir ise DSL siniri koy: model kompakt
tarifi uretir, kod yapiyi deterministik derler. Kazanc iki katli — performans
ve kontrol. Bedel: DSL'in ongormedigi istek imkansiz.

### `test` — Neyi test edebilirim?
Model non-deterministik, onu cagiran kod degil. Uc dikis: mock'lanmis agent,
degistirilen `fetch` (contract test), sade fonksiyon olarak frontend tool.
Hicbiri sunucu/model/API anahtari gerektirmez.
Her tool testi CIFT iddia kurar: donus degeri (modelin gordugu) + yan etki
(kullanicinin gordugu).

### `kurulum` — Yeni projede baslat
```bash
npm view @copilotkit/react-core@<surum> dependencies.@ag-ui/client   # TAM surumu al
npm i @copilotkit/react-core@<surum> @ag-ui/client@<pin> @ag-ui/core@<pin> zod
cp -r templates/agentic-chat/app/* <proje>/app/
```
Snippet'ler: `/snippet agent-tool`, `/snippet action-card`, `/snippet agent-approval`.

### `denetle` — Mevcut agentic kodu incele
`agents/agentic-ui-agent.md → Teslim Oncesi Kontrol Listesi` maddelerini tek tek
gec. Ozellikle: tool sonucu cast ediliyor mu (#58), `followUp: false` modele
soylendi mi (#59), `@ag-ui/*` surumu sabit mi (#71).

## Dogrulama Disiplini

Bu alandaki kutuphaneler haftalik degisiyor; modelin egitim bilgisi eskimis.
API hakkinda iddiada bulunmadan once **calistir**:

```bash
node -e "console.log(Object.keys(require('@copilotkit/react-core/v2')))"
npx tsc --noEmit                                   # exit kodunu goster
npm view <paket>@<surum> dependencies              # pin'i dogrula
```

`snippets/agent-*.tsx` ve `snippets/action-card.tsx` boyle yazildi. Yeni snippet
eklerken ayni yolu izle — tahminle yazilan snippet bu repoya girmez.

## Referans
```text
AG-UI:  https://docs.ag-ui.com/llms-full.txt
A2UI:   https://github.com/google/A2UI/blob/main/README.md
```
