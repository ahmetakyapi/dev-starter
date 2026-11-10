---
description: Agentic arayüz karar ağacı: araç nerede, kontrol hangi seviyede, model mi kod mu
argument-hint: "tool | kontrol | state | dsl | feed | test | kurulum | denetle"
---

`$ARGUMENTS` konusunda agentic UI kararı ver.

**Önce oku**: `~/dev-starter/rules/agentic-ui.md` (10 kural), `~/dev-starter/agents/agentic-ui-agent.md`
(karar ağaçları), `~/dev-starter/knowledge/patterns.md → Agentic UI`, `~/dev-starter/knowledge/mistakes.md #58-73`.

## Konular

### `tool` — Tool nereye konur?
Karar ağacı: `~/dev-starter/agents/agentic-ui-agent.md → Karar Ağacı 1`.
Özet: tarayıcı state'i → frontend tool. Ekrana çizip turu bitiren → widget
(`followUp: false` + açıklamaya da yaz). Yetki/para/kalıcı etki → sunucu tool'u,
istisnasız. Paylaşılan veri → tool DEĞİL, protokolün state kanalı.

### `kontrol` — Onay mı, Action Card mı, hiç mi?
Geri alınabilir → Action Card + Undo (sorma, yap, geri almayı sun).
Geri alınamaz → önden onay (`useHumanInTheLoop`). Düğmeler ve id → anlam KODDA
sabit; model yalnız hedefi ve açıklamayı yazar, argüman `safeParse` edilir.
Kırmızı çizgi → tool'u agent'a verme; yönlendiren bir tool ver.

### `state` — Tool mu, protokol mu?
Tool'u veri taşımak için kullanmak her erişimi bir ağ turuna çevirir. Paylaşılan
state protokolün kendi kanalından gider. Belirti: `getX`/`setX` tool'ları
sohbet geçmişini kart çöpüne çeviriyorsa yanlış kanaldasın.

### `dsl` — Model tam yapıyı mı üretecek?
Çıktı büyük/tekrar eden/şablonlaşabilir ise DSL sınırı koy: model kompakt
tarifi üretir, kod yapıyı deterministik derler. Kazanç iki katlı — performans
ve kontrol. Bedel: DSL'in öngörmediği istek imkânsız.

### `feed` — Sohbet mi, akış mı?
Kullanıcı ne isteyeceğini biliyorsa sohbet. Sistem kullanıcıyı tanıyor ve
sıradaki işi kendisi bulabiliyorsa akış: agent hazırlar (taslak, özet, çözüm
önerisi), kullanıcı onaylar / düzenler / geçer / sohbete atlar. Üç kulvar:
`needs-you` (kart = önden onay), `suggestion`, `handled` (yalnız geri
alınabilir iş + Geri Al). Sıralama ve öncelik KOD; model yalnız metni yazar.
Sponsorlu öğe ayrı bölümde, etiketli, aksiyonsuz.
`/snippet agent-feed` · `~/dev-starter/knowledge/patterns.md → AI Feed`.
Çalışan uygulama: `nextjs-fullstack` şablonunda `/akis` (şema, sunucu
eylemleri, `lib/feed-rules.ts` yetki kuralları + testleri, demo modu).

### `test` — Neyi test edebilirim?
Model non-deterministik, onu çağıran kod değil. Üç dikiş: mock'lanmış agent,
değiştirilen `fetch` (contract test), sade fonksiyon olarak frontend tool.
Hiçbiri sunucu/model/API anahtarı gerektirmez.
Her tool testi ÇİFT iddia kurar: dönüş değeri (modelin gördüğü) + yan etki
(kullanıcının gördüğü).

### `kurulum` — Yeni projede başlat
```bash
npm view @copilotkit/react-core@<sürüm> dependencies.@ag-ui/client   # TAM sürümü al
npm i @copilotkit/react-core@<sürüm> @ag-ui/client@<pin> @ag-ui/core@<pin> zod
cp -R ~/dev-starter/templates/agentic-chat/app/. <proje>/app/
mkdir -p <proje>/lib && cp ~/dev-starter/templates/agentic-chat/lib/agui-scenarios.ts <proje>/lib/
cat ~/dev-starter/templates/agentic-chat/.env.example >> <proje>/.env.local   # EKLE, ezme
```
Provider'i kök layout'a değil, sohbetin olduğu segmente koy (her sayfaya
~2,4 MB JS eklemesin): `~/dev-starter/templates/agentic-chat/README.md → Baglama`.
Snippet'ler: `/snippet agent-tool`, `/snippet action-card`, `/snippet agent-approval`.

### `denetle` — Mevcut agentic kodu incele
`~/dev-starter/agents/agentic-ui-agent.md → Teslim Öncesi Kontrol Listesi` maddelerini tek tek
geç. Özellikle: tool sonucu cast ediliyor mu (#58), `followUp: false` modele
söylendi mi (#59), `@ag-ui/*` sürümü sabit mi (#71), tool argümanı `safeParse`
ediliyor mu, onay düğmeleri modelden mi geliyor.

## Doğrulama Disiplini

Bu alandaki kütüphaneler haftalık değişiyor; modelin eğitim bilgisi eskimiş.
API hakkında iddiada bulunmadan önce **çalıştır**:

```bash
node -e "console.log(Object.keys(require('@copilotkit/react-core/v2')))"
npx tsc --noEmit                                   # exit kodunu göster
npm view <paket>@<sürüm> dependencies              # pin'i doğrula
```

`~/dev-starter/snippets/agent-*.tsx` ve `action-card.tsx` böyle yazıldı. Yeni snippet
eklerken aynı yolu izle — tahminle yazılan snippet bu repoya girmez.

Çıktı: karar (tek cümle) + gerekçesi (hangi karar ağacı dalı, hangi kural
numarası), etkilenen dosyalar, yazılması gereken testler
(`~/dev-starter/rules/agentic-ui.md` → Test Zorunlulukları) ve varsa çalıştırılan
doğrulama komutlarının çıktısı. `denetle` konusunda madde madde ✅ / ❌ +
dosya:satır.

## Referans
```text
AG-UI:  https://docs.ag-ui.com/llms-full.txt
A2UI:   https://github.com/google/A2UI/blob/main/README.md
```
