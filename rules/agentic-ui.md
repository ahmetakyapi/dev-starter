# Agentic UI Kuralları

**Bu kurallar, LLM'in uygulama içinde tool çağırdığı, state değiştirdiği veya
UI ürettiği her özellikte geçerlidir. İstisna yoktur.**

> **Durum: benimsenmedi, ama araçlar hazır.** Ekosistemde henüz agentic bir
> özellik yok. Buna karşılık iskelet, snippet'ler ve API haritası
> `@copilotkit/react-core@1.69.2` tip tanımlarına karşı **doğrulandı**
> (`tsc --noEmit`, 2026-08-27).
>
> Kaynak: Manfred Steyer, *Agentic UI with Angular* (v1.0.0, Ağustos 2026).
> Desenler + API haritası: `knowledge/patterns.md → Agentic UI`.
> Tuzaklar: `knowledge/mistakes.md #58–71`.
> Rol ve karar ağaçları: `agents/agentic-ui-agent.md`. Komut: `/agentic`.

---

## Temel Ayrım — Model ve Harness

LLM hiçbir şey **çalıştırmaz**; sadece metin üretir. Onu çağıran, çıktısını
yorumlayan, tool'u gerçekten çalıştıran ve ne zaman duracağına karar veren
uygulama koduna **harness** denir.

Bu ayrım aşağıdaki her kuralın kaynağıdır: **modeli değiştiremeyiz, harness'ı
tamamen değiştirebiliriz.** Bir davranışı garanti altına almak istiyorsan onu
prompt'a değil harness'a yaz.

---

## 1. Guardrail Sunucuda Durur

- Kurcalanmış bir istemcinin atlayabildiği kontrol, kontrol değildir
- Giriş/çıkış kontrolleri, oran sınırları, bütçe tavanları: hepsi sunucuda
- İstemci tarafı kontroller yalnızca **UX** içindir, güvenlik için değil
- Bloklanan istek istemciye sıradan bir metin mesajı olarak ulaşmalı — böylece
  guardrail eklemek/değiştirmek tamamen sunucu işi kalır

## 2. Model Asla Yetkilendirme Kararı Vermez

- Model **ne çağıracağını** seçer; **kimin yapabileceğine** klasik backend
  mantığı karar verir
- Tool'lar oturum açmış kullanıcının yetkileriyle çalışır, sistemin değil
- Yetki kontrolü tool'un **içinde**, prompt'ta değil
- Prompt talimatları (`"sadece uçuşlarla ilgili soruları yanıtla"`) en zayıf
  guardrail biçimidir — **rica**dır, garanti değil. İlk savunma hattı olarak
  makul, tek savunma hattı olarak ihmal

## 3. Least Privilege — Verilmeyen Tool Kötüye Kullanılamaz

- En etkili kontrol, hiç gerekmeyen kontroldür
- Rol başına ayrı tool seti: planlama agent'ında sadece okuma tool'ları,
  yazma tool'ları yalnız ilgili agent'ta
- Bu ayrım her prompt talimatından **yapısal olarak** daha sağlamdır:
  `deleteAccountTool`'a sahip olmayan bir agent hesap silmeye kandırılamaz
- **Kırmızı çizgiler** (hesap silme, toplu veri silme, para transferi): agent'a
  tool verme. Bunun yerine sonuçları anlatan ve kullanıcıyı ilgili sayfaya
  yönlendiren bir tool ver

## 4. Aksiyon Sınıfına Göre Kontrol Seviyesi

| Aksiyon | Desen | Neden |
|---------|-------|-------|
| Geri alınabilir | **Action Card + Undo** | Onay yorgunluğunu önler; Undo modele uğramaz |
| Geri alınamaz | **Önden onay (interrupt)** | Bir kez yapıldı mı dönüşü yok |
| Kırmızı çizgi | **Tool verme** | Hızlıca tıklanmış bir "Tamam" yeterli koruma değil |

- Karar **uygulama** seviyesinde değil, **aksiyon** seviyesinde verilir
- Her aksiyondan önce onay soran uygulama, kullanıcıyı tıklayıp geçmeye eğitir
  ve deseni var eden kontrolü yok eder
- Acil durdurma (`abortRun`) her zaman erişilebilir olmalı — tek satırlık
  implementasyonun güvene etkisi büyüktür

## 5. Tool Sonucu Tel Üzerinde String'dir

- Tool **argümanları** şema sayesinde tiplidir; **sonuçlar değildir**
- `JSON.parse` → `unknown`. Doğrulamadan domain nesnesi gibi davranmak yasak
- Üç durumu ayrı ele al: henüz tamamlanmadı / geçerli JSON değil / geçerli ama
  beklenen alanlar yok
- Kullanıcıya bir sonucu **onaylayan** her UI (rezervasyon kartı, "kaydedildi"
  bildirimi) bu doğrulamayı yapmak zorundadır → `mistakes.md #58`

## 6. Üretilen Kod Sandbox'ta Çalışır

- Model kod üretiyorsa o kod **asla** host süreçte çalıştırılmaz
- Kod kullanıcı girdisinden doğar: prompt'u kontrol eden kodu etkiler
- İzole çalışma ortamı (WASM/QuickJS gibi) + bellek, yığın ve süre sınırları
- Dışarıya açılan **her kapı elle verilir**: `fetch`, `require`, `process`,
  dosya sistemi, ağ — hiçbiri varsayılan olarak bulunmaz
- Dar kapsamlı bir ifade dili yeterliyse (JSONata gibi) genel amaçlı dil verme:
  saldırı yüzeyi "rastgele kod"tan "sabit gramerden bir ifade"ye iner

## 7. Model Hesaplamaz — Nasıl Hesaplanacağını Tarif Eder

- Aritmetik ve agregasyon modelin yapısal zayıflığıdır; asıl sorun hata oranı
  değil hatanın **görünmezliği**dir
- Ham veri context'e sokulmaz: sandbox/kod veriyi işler, modele yalnızca
  agrega döner. Sandbox aynı zamanda bir **maliyet sınırıdır**
- Aynı ilke sunumda da geçerli: kullanıcının gördüğü sıra, gruplama ve
  filtreleme **kod** olmalı, model çıktısı değil → `patterns.md → Deterministik
  Doğrulama Katmanı`

## 8. Belge ve Görsel Tool'ları URL Döndürür

- Tool sonucu modelin context'ine geri girer; base64 bir görsel orada yüz
  binlerce token yer — hem de modelin bakmayacağı veri için
- Dosya sunucuda saklanır, tool referans döndürür
- Bağlayıcı belgeler (fatura, biniş kartı, sözleşme) üretken modelle
  **üretilmez**: içeriği model verir, şablon deterministik render eder

## 9. Token Bütçesi Bir Guardrail'dir

- Oturum ve kullanıcı başına token tavanı **zorunlu**
- Toplam bütçe + alarm eşiği
- Oran sınırı ve zaman aşımı
- Bütçesini tüketen oturum, bloklanan herhangi bir istek gibi nazik bir
  mesajla sonlandırılır
- Gerekçe: her mesaj **senin** token'ını harcar. Limitsiz bir sistemde tek bir
  konuşkan ziyaretçi — ya da bütçeni kasten yakan biri — şaşırtıcı bir fatura
  çıkarabilir

## 10. Şeffaflık Pazarlık Konusu Değil

- Çalışan her tool ve her workflow adımı kullanıcıya görünür olmalı
- Karanlıkta tool çağıran agent kara kutudur — her şeyi doğru yapsa bile
  huzursuzluk bırakır
- **UX notu**: iç tool adlarını olduğu gibi gösterme.
  `Tool Call: getBookedFlights` değil, *"Rezervasyonların getiriliyor…"*
- Dakikalarca süren işlerde ilerleme göstergesi lüks değil, dürüstlüktür:
  donmuş bir spinner ile çalışan bir uygulama arasındaki fark budur

---

## Mimari Tercihler — Kural Değil, Varsayılan

Aşağıdakiler ihlal edilebilir ama **gerekçesi yazılmalıdır**:

- **Protokol kullan, kendi formatını icat etme.** AG-UI gibi açık bir protokol,
  agent framework'ünü istemciye sızdırmaz. Sunucu tarafını değiştirmek
  istediğinde istemci tek satır bile değişmez
- **State'i protokolden geçir, tool'dan değil.** Tool'lar aksiyon içindir. Veri
  okuma/yazmayı tool'a bindirmek her erişimi bir ağ turuna çevirir
- **Sabit olan kod olsun.** Süreçte önceden bilinen sıra, veri çekimi ve
  doğrulama deterministik adımlar olur; model yalnızca dil anlama ve muhakeme
  gereken yerde devreye girer
- **Tek büyük agent yerine uzman ekip.** Otuz tool'lu bir agent isabetsizleşir
  ve context'i dolar. Alt görevler ayrı prompt, ayrı tool seti ve gerekirse
  ayrı (ucuz) modelle çalışır
- **DSL sınırı.** Model tam yapıyı değil, uygulamaya özel kompakt bir tarifi
  üretir; kod o tarifi deterministik olarak derler → `patterns.md → DSL Sınırı`

---

## Test Zorunlulukları

Agentic bir özellik, aşağıdakiler olmadan **Gate'ten geçmez**:

1. **Her frontend tool için birim testi** — hem dönüş değeri (modelin gördüğü)
   hem yan etki (kullanıcının gördüğü) iddia edilir
2. **Protokol contract testi** — giden payload'ın formatı ve gelen olay
   akışının çözümlenmesi, gerçek sunucu ve model olmadan sabitlenir
3. Bu testler API anahtarı ve ağ **gerektirmez**; CI'da çalışır

**Çalışan referanslar** — kopyala, uyarlar:

| Dosya | Hangi zorunluluğu karşılar |
|-------|---------------------------|
| `snippets/agent-tool.test.ts` | #1 — tool birim testi, çift iddia |
| `templates/agentic-chat/__tests__/agui-contract.test.ts` | #2 — protokol contract testi |
| `templates/agentic-chat/__tests__/agui-scenarios.test.ts` | Fixture'lar AG-UI'ın kendi Zod şemalarına uyuyor mu |

Fixture'lar `templates/agentic-chat/lib/agui-scenarios.ts`'ten gelir — aynı
kaynak hem mock endpoint'i hem testleri besler, böylece test ile çalışan
uygulama ayrışamaz.

Model davranışı (doğru tool'u seçiyor mu, prompt'a uyuyor mu) bu testlerin
kapsamı dışındadır — o sunucu tarafı eval'lerin ve birkaç E2E testinin işidir.

**Neden zorunlu**: Agent yanlış davrandığında refleks prompt'u kurcalamaktır.
Oysa sıklıkla tool, açıklamasının vaat ettiğinden farklı bir şey döndürür.
Tool davranışını açıklamasına karşı sabitleyen bir test hata ayıklamayı ikili
hale getirir: **tool'lar doğruysa sorun prompt'tadır.**

---

## Doğrulanmış Tech Stack

Bu ekosistemde agentic bir özellik yazılırken varsayılan tech stack:

| Katman | Seçim | Not |
|--------|-------|-----|
| İstemci | `@copilotkit/react-core@1.69.2` **`/v2` girişi** | v2 AG-UI-native; v1 farklı imzalara sahip, karıştırma |
| Protokol | `@ag-ui/client` + `@ag-ui/core`, **CopilotKit'in pin'lediği sürüm** | Aralık (`^`/`~`) yazma → `mistakes.md #71` |
| Şema | Zod v4 | `parameters` Standard Schema V1 alır, Zod doğrudan çalışır |
| Sunucu | Açık — Mastra / LangGraph / kendi route'un | AG-UI arkasında olduğu sürece istemci umursamaz |

Doğru pin'i **her zaman** komutla al, ezberden yazma:

```bash
npm view @copilotkit/react-core@<surum> dependencies.@ag-ui/client
```

**Başlangıç noktaları** — hepsi derlendi:

- `templates/agentic-chat/` — anahtarsız, modelsiz çalışan AG-UI iskeleti
- `snippets/agent-tool.tsx` — frontend tool + widget
- `snippets/action-card.tsx` — sunucu tool'u kartı + Undo + güvenli sonuç çözümü
- `snippets/agent-approval.tsx` — geri alınamaz aksiyon onayı

Kural 6'nın (üretilen kod sandbox'ta çalışır) hazır implementasyonu React
tarafında mevcut: `CopilotKitProvider`'ın `openGenerativeUI.sandboxFunctions`
alanı. Kendi sandbox'ını yazmadan önce ona bak.

---

## Referans Dokümantasyon

Hızlı değişen bir alan; modelin eğitim bilgisi çoğu zaman eskimiş oluyor.
Agentic koda dokunan oturumlarda şunlara başvur:

```text
AG-UI protokolü / agent iletişimi:
https://docs.ag-ui.com/llms-full.txt

A2UI (agent'ın ürettiği UI yapıları):
https://github.com/google/A2UI/blob/main/README.md
```

CopilotKit, MCP, MCP Apps ve Mastra için hazır agent skill paketleri yayınlanıyor;
proje `.claude/skills/` altına kurulduğunda asistan güncel API'yi görür.

---

## Protokol Haritası — Hangi Sınır Hangi Protokol

| Protokol | Neyi neye bağlar | Ne zaman |
|----------|------------------|----------|
| **AG-UI** | Agent ↔ Kullanıcı | Tarayıcıya giden **tek** kablo. Run, streaming, tool call, adım, interrupt, state |
| **MCP** | Agent → Araçlar | Süreç kontrolü bende kalsın, sadece veri/aksiyon lazım |
| **A2A** | Agent → Agent | Bütün bir alt görevi, kendi zekâsı ve yaşam döngüsü olan bir sisteme devrediyorum |
| **A2UI** | Agent → UI yapısı | Model bileşen seçer, istemci nasıl göründüğüne karar verir. AG-UI içinde taşınır |
| **MCP Apps** | Araç sonucu → Widget | Üçüncü taraf UI'ı sandbox'lı iframe'de göstermek. AG-UI içinde taşınır |

Ayrım için pratik kural: **veri veya aksiyon istiyorsan tool → MCP. Sorumluluk
devrediyorsan agent → A2A.** Geri dönüşü fonksiyon çıktısı olan bir şey tool'dur;
geri dönüşü bir *sonuç* olan bir şey agent'tır.
