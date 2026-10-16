# Agent Haberleşme Protokolü

Bu dosya tüm agent'ların nasıl iletişim kurduğunu tanımlar. İki tür agent var:

- **Kayıtlı subagent** (`.claude/agents/` altında ince sarmalayıcı; bootstrap
  ile `~/.claude/agents/`a symlink'lenir): `strategist`, `gate`, `deploy`,
  `design-reviewer`, `content-editor`, `frontend`, `backend`, `qa`,
  `researcher`. Kendi context penceresinde, kısıtlı tool setiyle çalışır;
  paralel dağıtılabilir.
- **Ana oturum rolü**: BA, UI ve AG — ana oturum ilgili rol dosyasını okur ve
  o rolü üstlenir. BA aynı zamanda **orkestratördür** (aşağıda).

---

## Agent Ekibi

| Agent | Dosya | Alan | Kısaltma | Tür |
|-------|-------|------|----------|-----|
| Business Analyst | `business-analyst-agent.md` | Planlama, onay, yönlendirme, orkestrasyon | **BA** | rol |
| UI/UX | `uiux-agent.md` | Tasarım, animasyon, görsel sistem | **UI** | rol |
| Frontend | `frontend-agent.md` | Next.js, React, TypeScript | **FE** | subagent |
| Backend | `backend-agent.md` | DB, API, auth | **BE** | subagent |
| Agentic UI | `agentic-ui-agent.md` | LLM tool/state/UI kararları — FE ile BE arasındaki boşluk | **AG** | rol |
| QA | `qa-agent.md` | Test stratejisi, test-first, regression | **QA** | subagent |
| Gate | `gate-agent.md` | 6+1 pass kalite denetimi, rapor | **GATE** | subagent |
| Deploy | `deploy-agent.md` | Vercel, CI/CD, production | **DP** | subagent |
| Strategist | `strategist-agent.md` | Fikirden plana: pazar, yön, palet, MVP; yol haritası | **ST** | subagent |
| Researcher | `researcher-agent.md` | Teknik araştırma: benzer çözümler, kütüphane seçimi | **RS** | subagent |
| Design Reviewer | `design-reviewer-agent.md` | Kurulmuş arayüzü ekrandan ölçer, puanlar | **DR** | subagent |
| Content Editor | `content-editor-agent.md` | Türkçe metin editörlüğü | **CE** | subagent |

---

## Orkestrasyon — İşi Kim, Nasıl Dağıtır

Ana oturum (BA rolü) orkestratördür: işi böler, kayıtlı subagent'lara dağıtır,
sonuçları birleştirir, ROUTEMAP'i günceller. Dalga planı ve faz kuralları:
`phases/development.md`.

### Efor Ölçekleme

| İş | Yürütme |
|----|---------|
| Tek dosyalık düzeltme, kozmetik | Ana oturum kendisi yapar — subagent açma |
| Tek story, tek alan | İlgili rol ana oturumda ya da tek subagent |
| Çok story / çok alan / dosya çakışması riski | Paralel subagent'lar, gerekirse `isolation: worktree` |
| Belirsiz / keşif | Önce `researcher` ya da `/kickoff` — uygulama sonra |

Paralelde aynı anda en fazla 3-4 subagent: koordinasyon maliyeti dağıtım
kazancını yutmasın.

### Görev Zarfı (subagent'a dağıtırken ZORUNLU)

```text
GOREV_ZARFI
  to:    [FE | BE | QA | GATE | DP | ST | RS | DR | CE]
  task:  [tek cümle görev tanımı]
  oku:   [story dosyası + yalnız gereken bağlam adresleri — context-curation tablosuna göre]
  sinir: [dokunulmayacak dosyalar/alanlar; kapsam story kadardır]
  cikti: [beklenen adres — kod için değişen dosya listesi, rapor için dosya yolu]
  kabul: [story'nin kabul kriterleri ya da işin bitti tanımı]
```

### Referansla Aktarım

Subagent üretimini DOSYAYA yazar; ana oturuma yalnız **yol + üç satır özet**
döner. Rapor/kod gövdesi sohbete yapıştırılmaz — context bütçesi korunur,
session resume dosyadan devam eder.

> **Tek istisna — GATE**: gate'in Write yetkisi bilinçli olarak yok
> (denetleyen, kayıt değiştirmez). Gate rapor gövdesini döndürür; ana oturum
> `docs/gate/<story>.md`ye yazar ve ROUTEMAP'i günceller (`/gate` adım 3).

### Çıktı Adresleri

| Üretici | Adres |
|---------|-------|
| GATE raporu | `docs/gate/<story>.md` |
| RS araştırması | `docs/research/<konu>.md` |
| DR denetimi | `docs/review/<tarih>-<kapsam>.md` |
| ST kickoff/yol haritası | `docs/KICKOFF.md` / `docs/ROADMAP-ONERI.md` |
| FE/BE/QA kodu | doğrudan dosyalar; teslimde değişen dosya listesi |
| Kararlar | `docs/ROUTEMAP.md → Kararlar Logu` |

### Onay Noktaları

Faz çıktıları (KICKOFF, PRODUCT, ARCHITECTURE, SCREENS, story listesi) ve
ESCALATED durumlar kullanıcıya sunulur; onay ROUTEMAP Kararlar Logu'na işlenir.
Geri dönüşü zor işler (migration, deploy, silme) onaysız yürütülmez.

---

## Akış

```text
Kullanıcı talebi
      ↓
   BA Agent
  (doğrula)
      ↓
  Onay? ─── Hayır ──→ Geri dön, revizyon iste
      │
      Evet
      ↓
 İlgili agent(lar) paralel/sıralı çalışır
      ↓
  FE/BE Agent self-check
      ↓
  Gate Agent — 6+1 pass kalite kontrolü
      ↓
  PASSED? ─── Hayır ──→ İlgili agent'a düzeltme talimatıyla geri gönder (max 2 döngü)
      │
      Evet
      ↓
  Commit (conventional commit)
      ↓
  BA Agent çıktıyı inceler
      ↓
  Deploy → DP Agent
```

### Bugfix Akışı

```text
Bug bildirimi
      ↓
   BA Agent (triage: HOTFIX/BUGFIX/REGRESSION)
      ↓
   Bugfix Protocol (TDD): Failing test → Fix → Green → Regression
      ↓
   Gate Agent
      ↓
   Commit + mistakes.md güncelle
```

---

## Standart Handoff Mesajı

Ana oturum rolleri (BA/UI/AG) arasında iş geçerken bu formatta ilet; kayıtlı
subagent'a dağıtımda bunun yerine **Görev Zarfı** kullanılır (yukarıda):

```text
AGENT_HANDOFF
  from: [BA | UI | FE | BE | AG | QA | GATE | DP | ST | RS | DR | CE]
  to:   [BA | UI | FE | BE | AG | QA | GATE | DP | ST | RS | DR | CE]
  task: [tek cümle görev tanımı]
  context:
    - proje: [proje adı]
    - ilgili dosyalar: [dosya yolları]
    - bağımlılıklar: [önceki agent çıktısı varsa yol + özet]
  acceptance_criteria:
    - [kriter 1]
    - [kriter 2]
```

---

## Paralel Çalışma Kuralı

Dalga planının tamamı `phases/development.md`dedir. Özet:

```text
Wave 1 (paralel, kayıtlı subagent'lar — Görev Zarfı ile):
  → backend: API/DB + testleri
  → qa:      test planı + failing testler
  → UI rolü: tasarım kararları (ana oturum)

Wave 2 (Wave 1 çıktıları girince):
  → frontend: UI + API entegrasyonu

Wave 3:
  → gate: 6+1 pass → docs/gate/<story>.md
  → ana oturum: sonucu ROUTEMAP'e işler, commit, review
```

Wave arası: build + typecheck; dosya çakışması riski varsa subagent'lar
`isolation: worktree` ile açılır ve Gate PASSED sonrası merge edilir.

---

## Doğrulama Disiplini — Tüm Agent'lar İçin Birinci Kural

> Bu bölüm 2026-08-16'da eklendi. Sebebi: ekosistem denetimi sırasında
> "baktım, doğru görünüyor" ile geçilen **altı ayrı iddia yanlış çıktı**.
> Hiçbiri dikkatsizlik değildi; hepsi makul görünen varsayımlardı.

**Kural**: Bir iddiada bulunuyorsan onu kanıtlayan komutu çalıştır ve çıktısını
göster. Çalıştırmadıysan "yaptım" deme — "yapmadım, şu sebeple" de.

| Yerine | Bunu |
|--------|------|
| "Build geçiyor" | `npm run build` çıktısını göster |
| "Tipler doğru" | `tsc --noEmit`, exit kodunu göster |
| "Token'a çevirdim, görünüm aynı" | Üretilen CSS'ten eski/yeni değeri karşılaştır |
| "Paket yayına hazır" | `npm pack --dry-run` + temiz dizinde `require()` |
| "Tarama temiz" | Exit kodunu göster — çıktı stderr'e gidiyor olabilir |
| "Lint geçiyor" | Config dosyasının **var olduğunu** da doğrula |

### Bu oturumda bu kuralın yakaladıkları

Somut örnekler; hepsi "baktım iyi görünüyor" ile kaçardı:

1. **Detector "0 bulgu" dedi, 2 bulgu vardı.** İnsan-okunur çıktı stderr'e
   gidiyor, stdout boş kalıyordu. `--json` + exit kodu doğruyu verdi.
2. **`ls a* b*` mevcut ESLint config'ini gizledi.** Eşleşmeyen ilk glob yüzünden
   `ls` non-zero dönüyor, ikinci dosya bulunsa bile kontrol "yok" diyordu.
3. **npm paketi 5 aydır kırıktı.** Build başarılıydı, CI yeşildi — çünkü CI
   build'in *ürettiği* dosyayı test ediyordu, manifest'in *işaret ettiğini*
   değil. Temiz dizinde `require()` etmek 10 saniyede ortaya çıkardı.
4. **`npm ci --omit=optional` bariz çözüm gibiydi, build'i kırdı.** Rollup
   platform binary'sini optional olarak dağıtıyor.
5. **Kontrast tarayıcısı dark-only projelerde 108 sahte bulgu üretti.**
   `text-white` tek temalı projede doğru kullanımdır.
6. **"80 mor kullanımı bilinçli tema olmalı" varsayımı yanlıştı.** Paleti
   okumak yetti: mor tanımlı değildi, sızıntıydı.

### Kontrolün kendisini de kontrol et

Bir kontrol yazdıysan **başarısız olması gereken bir durumda çalıştır.** Geçen
bir kontrol, çalışan bir kontrol değildir.

`scripts/verify-package-exports.mjs` yazıldıktan sonra `dist/index.js` eski
hatalı adına döndürülüp negatif test yapıldı: 3 hata, non-zero exit. Bu yapılmasa
script'in gerçekten yakalayıp yakalamadığı bilinmezdi.

### Araçlar yanılır — detector'ın son sözü yoktur

Otomatik tarayıcılar (eskiden impeccable detector'ı, bugün `hooks/quality-scan.sh`
ve `scripts/audit-project.sh`) yalnızca kalıp görür; brief kazanır. Bir bulgu
her zaman hata değildir:

- **Yanlış pozitif**: `gray-on-color` alfa kanalını hesaplamıyor —
  `bg-indigo-500/15` neredeyse sayfa zemini, ama saturated sanılıyor
- **Kasıtlı karar**: `acilis-zili`nin degrade metni token'lanmış, `@supports`
  korumalı, fallback'li ve descender düzeltmeli — yasağın çözmek istediği her
  sorunu zaten çözmüş
- **İçerik verisi**: `onepiece-hub`da 15 ekibin kimlik rengi marka sistemi değil

Bulguyu düzeltmeden önce **oku ve anla**. Kasıtlıysa gerekçesini yaz ve bırak —
ama gerekçe "böyle daha güzel" değil, "şu sorunu şöyle çözüyor" olmalı.

### Sayı iyileşmesi başarı ölçütü değildir

`ahmetakyapi.com`da koyu mod kontrastı düzeltildi ve `gray-on-color` **4'ten 6'ya
çıktı** — çünkü `dark:` eşi eklemek satıra ikinci bir renk kattı, detector çift
saydı. Kontrast gerçekten düzelmişti.

Ölçüt bulgu sayısı değil, **kullanıcının gördüğü şeyin doğru olması**.

---

## Kurallar (Tüm Agent'lar İçin Zorunlu)

Her agent bu kurallara uyar, istisnası yoktur:

| Kural Dosyası | İçerik | Özellikle Kim |
|---------------|--------|---------------|
| `rules/immutable-architecture.md` | Server-first, performance, DB, state, auth | FE, BE, GATE |
| `rules/design-tokens.md` | Hardcoded değer yasağı, token enforcement | UI, FE, GATE |
| `rules/commit-conventions.md` | Conventional commit standardı | Herkes |
| `rules/bugfix-protocol.md` | TDD bugfix akışı | FE, BE, GATE |
| `rules/dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline | Herkes |
| `rules/routemap-discipline.md` | ROUTEMAP tek kaynak prensibi | Herkes |
| `rules/context-curation.md` | Agent bazlı context seviyeleri | Herkes |
| `rules/agentic-ui.md` | LLM tool çağırıyorsa: guardrail, yetki, sandbox, test | FE, BE, GATE |

---

## Yaşam Döngüsü Fazları

Proje bu fazları sırasıyla takip eder:

| Faz | Protokol Dosyası | Yöneten Agent |
|-----|-----------------|---------------|
| **Planning** (P1→P6) | `phases/planning.md` | BA Agent |
| **Development** | `phases/development.md` (story içi: `rules/dev-cycle.md`) | BA (orkestratör) → FE/BE/QA/UI → GATE |
| **E2E & Polish** (E0→E5) | `phases/e2e-polish.md` | BA + QA + GATE |
| **Release & Maintenance** | `phases/release-maintenance.md` | BA + DP |

### Session Resume

Her yeni session'da:

1. `docs/ROUTEMAP.md` oku (varsa)
2. Aktif faz ve son tamamlanan adımı bul
3. Kullanıcıya özet sun: "Kaldığımız yer: [faz] — [son story]"
4. Onay al, devam et

---

## Enforcement Hook'ları

Kuralların kağıt üstünde kalmaması için bash hook'ları:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `hooks/gate-guard.sh` | PreToolUse:Bash (git commit) | Aktif story Gate PASSED değilse commit bloklar (kolonu başlıktan bulur, docs-only muaf) |
| `hooks/quality-scan.sh` | PreToolUse:Bash (git commit) | Secret (AWS/PEM/JWT/URL dahil), .env, debug kodu, `@ts-ignore`, kilit, agentic cast, TDD/commit-format/test-zayıflatma uyarıları |
| `hooks/routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP tazelik + DONE⇒Gate PASSED değişmezi |
| `hooks/session-brief.sh` | SessionStart | ROUTEMAP özetini ve sıradaki iş önerisini bağlama basar |

Kayıt yeri: `.claude/settings.json` (paylaşılan, versiyonlanır). impeccable
3.0.0'da kaldırıldı.

Hook'un çalıştığını varsayma — `bash scripts/health-check.sh` ile doğrula.

---

## Context Curation

Her agent sadece ihtiyacı olan bilgiyi alır (`rules/context-curation.md`):

| Agent | Seviye | Max Token | Ne Okur |
|-------|--------|-----------|---------|
| BA | FULL | ~50k | Tüm dokümanlar |
| UI | FOCUSED | ~15k | Tema + ekranlar |
| FE | TASK-SPECIFIC | ~10k | Story + ilgili dosyalar |
| BE | TASK-SPECIFIC | ~10k | Story + schema + API |
| QA | TASK-SPECIFIC | ~10k | Story + tests/ + bugfix-protocol |
| AG | FOCUSED | ~15k | Story + agentic-ui kuralları + tool şemaları |
| GATE | REVIEW | ~20k | Story + diff + rules |
| RS | TASK-SPECIFIC | ~10k | Soru + tech-radar + decisions |
| ST | FULL | ~30k | Ürün belgeleri + radar + canlı durum |
| DR | FOCUSED | ~15k | Tema belgesi + ekran görüntüleri |
| CE | TASK-SPECIFIC | ~10k | İncelenen metin + yazım kuralları |
| DP | MINIMAL | ~5k | Config + env |

Token bütçesi yalnız **kayıtlı subagent'larda** fiziksel sınırdır; ana oturum
rollerinde (BA/UI/AG) okuma-sırası disiplinidir.

---

## Proje Bağlamı (Her Agent İçin Zorunlu)

Her agent bir göreve başlamadan önce şunları kontrol et:

1. `docs/ROUTEMAP.md` — proje durumu (varsa)
2. `~/dev-starter/knowledge/mistakes.md` — bilinen hatalar
3. `~/dev-starter/knowledge/patterns.md` — test edilmiş desenler
4. `~/dev-starter/knowledge/themes/[proje].md` — görsel tema (UI işlerinde)
5. `~/dev-starter/rules/` — kural dosyaları (context seviyesine göre)
6. Projenin `CLAUDE.md` (varsa)

### Ahmet'in Repo'ları

`~/Desktop/Projects/` altında **12 aktif proje** var; altısının görsel hafızası
belgeli. Durum ve standart uyumu: `knowledge/live-projects-audit.md`.

| Repo | Tema Dosyası | Stack / Not |
|------|-------------|-------------|
| ahmetakyapi.com | `themes/ahmetakyapi.md` | Next 14, Three.js, next-themes — kişisel site; eski indigo/emerald paleti |
| Açılış Zili | `themes/acilis-zili.md` | Next 16, Tailwind v4, motion, Neon — **ekosistemin referansı**: `signature` paleti ve token mimarisi buradan |
| Mimio | `themes/mimio.md` | Next.js, custom `data-theme`, varsayılan açık |
| Keskealsaydım | `themes/keskealsaydim.md` | Go backend + `frontend/` içinde Next.js (monorepo) |
| Ramazan Vakitleri | `themes/ramazan-vakitleri.md` | React + Vite, dark-only, mor–pembe–mavi (token'lı) |
| DigyNotes | `themes/digynotes.md` | Belgeli ama `~/Desktop/Projects/` altında **yok** — taşınmış olabilir |
| onepiece-hub | *(belgesiz)* | Next 14, dark-only, `ocean/gold/sea/luffy/fruit` paleti |
| simayahi | *(belgesiz)* | Next.js — **denetimde en temiz proje** |
| derinay · dungeon-mates · elevenforge · harfiyen · karalama | *(belgesiz)* | Next.js |

> Belgesiz bir projede çalışıyorsan önce `bash scripts/audit-project.sh <yol>`
> çalıştır — paletini ve mevcut durumunu bilmeden değişiklik yapma.

---

## Skills Referans Tablosu

| Skill | Kullanım | Hangi Agent |
|-------|----------|-------------|
| `/check` | Proje sağlık kontrolü | BA, FE, BE, GATE, DP |
| `/review-ui` | UI/UX kod incelemesi | UI, FE, GATE |
| `/reference <bölüm>` | Gerçek sitenin bölümünden yapı al, kendi token'larınla kur | UI, FE |
| `/snippet [tip]` | Hızlı bileşen üret | UI, FE |
| `/theme [proje]` | Görsel tema uygula | UI |
| `/deploy` | Vercel deploy checklist | DP, BA |
| `/release [patch\|minor\|major]` | npm paketi yayınla | DP |
| `/new-project [ad]` | Yeni proje sihirbazı | BA |
| `/clone-website <url>` | Pixel-perfect site klonlama | UI |
| `/kickoff [fikir]` | Fikirden plana: pazar, yön, palet, MVP (strategist) | BA |
| `/roadmap` | Var olan projeye sıradaki işler (strategist) | BA |
| `/agentic [konu]` | Agentic UI karar ağacı | FE, BE |
| `/plan` | Planning fazını yürüt (P1→P6) | BA |
| `/story [id]` | Tek story'yi uçtan uca işle (dalga planıyla) | BA |
| `/gate [story]` | Gate denetimi + sonucu ROUTEMAP'e işle | GATE, BA |
| `/fix [tarif]` | Bugfix protokolü (TDD) | QA, FE, BE |
| `/research [konu]` | Benzer çözümleri araştır (researcher) | RS |
| `/status` | Kaldığın yer + sıradaki iş önerisi | BA |
| `/retro` | Oturum/iş retrospektifi → bilgi tabanı taslakları | BA |
| `/evolve` | Ekosistemin kendi bakım/gelişim turu | BA, RS |

### Doğrulama Komutları

Kontrol listesi okumak yerine bunları **çalıştır**:

| Komut | Ne doğrular | Kim |
|-------|-------------|-----|
| `bash scripts/audit-project.sh <yol>` | Bir projeyi 8 standarda karşı denetler | UI, GATE, BA |
| `npm run verify:exports` | Paket manifest'inin vaat ettiği yollar gerçekten var mı | DP, GATE |
| `bash scripts/health-check.sh` | Ekosistem bütünlüğü — 15 kategori | BA, GATE |
| `npm pack --dry-run -w <paket>` | Yayınlanacak tarball içeriği | DP |

---

## Teknoloji Referansları

> **Ekosistem tek sürümde değil.** Aşağıdaki tabloyu okumadan sürüme özgü
> desen yazma — v4 sözdizimini v3 projesine uygulamak sessizce çalışmaz.
> **Her zaman önce projenin `package.json`'ına bak.**

### Gerçek durum (2026-08-16 ölçümü)

| Proje | Next | React | Tailwind |
|-------|------|-------|----------|
| acilis-zili | **16.2** | **19.2** | **v4** |
| elevenforge | **16.2** | **19.2** | **v4** |
| Mimio | 15.5 | 18.2 | **v4** |
| ahmetakyapi.com · onepiece-hub · derinay · harfiyen · simayahi · dungeon-mates | 14.2 | 18 | v3.4 |
| ramazan-vakitleri | *(Vite)* | 18.2 | *(saf CSS)* |

Çoğunluk hâlâ **Next 14 + React 18 + Tailwind v3**. **Yeni proje şablonları
3.0.0'dan (2026-10-03) beri Next 16 + React 19.2 + Tailwind v4 + `motion`**:
yeni kod bu tech stack'e göre yazılır, eski projeler dokunuldukça yükseltilir.
Yeni tech stack'in kuralları: `guides/` (özellikle `06-nextjs-16.md`).

### Sürüme göre farklar

**Next 15+** — `params` / `searchParams` `Promise` döner, `await` şart.
`after()` API'si response sonrası iş için. Next 14'te ikisi de yok.

**Next 16** — `middleware.ts` yerine `proxy.ts` (`export function proxy`, yalnız
Node); `next lint` yok, ESLint CLI + flat config; Turbopack varsayılan.
`PageProps` ve `RouteContext` tipleri `.next/types` altına
**build sırasında** üretiliyor ve gitignore'da. Temiz bir kopyada `npm run
typecheck` öncesi **`npm run build` çalıştır**, yoksa onlarca sahte
"Cannot find name 'PageProps'" hatası alırsın (`acilis-zili` CLAUDE.md).

**React 19** — `use(promise)`, `useActionState`, `useOptimistic`,
`useFormStatus`. `ref` artık prop, `forwardRef` gereksiz. React 18
projelerinde bunların hiçbiri yok.

**Tailwind v4** — `tailwind.config.ts` **yok**; token'lar CSS'te iki katman:
ham rol değişkenleri `:root[data-theme]`, köprü `@theme inline`. `@import "tailwindcss"`,
PostCSS eklentisi `@tailwindcss/postcss`. `dark:` kullanılmaz (`guides/02-design-tokens.md`).

**motion** — `motion/react`, kökte `LazyMotion strict` → bileşende `m.*`; `framer-motion`
yeni projeye kurulmaz (`guides/04-motion.md`).
**v3'te tam tersi**: config dosyası var, `@tailwind base/components/utilities`
direktifleri kullanılır ve `postcss.config.js` olmadan utility'ler işlenmez
(`mistakes.md` #28).

**Tailwind — her iki sürümde**: `@layer components` içindeki özel sınıflar
kullanılmıyorsa **purge edilir**, üretilen CSS'e hiç girmez. Bir sınıfın
çalıştığını varsayma; `dist`/`.next` CSS'inde ara.

### TypeScript

`satisfies`, `const` type parameters, inferred type predicates kullanılabilir.
Projelerin tamamı `strict: true`.

### Claude Agent SDK

- `Agent` tool — yeni agent spawn et
- `SendMessage` — mevcut agent'a mesaj gönder
- `subagent_type` — hangi agent tipi kullanılacak
- `isolation: "worktree"` — izole git worktree

---

## Hata Yönetimi

Bir agent görevi tamamlayamazsa:

```text
AGENT_ERROR
  agent: [agent adı]
  task:  [görev]
  error: [hata açıklaması]
  blocker: [ne engel oluyor]
  needs: [neye ihtiyaç var]
```

Bu mesajı BA Agent'a ilet, yeniden yönlendirme yapacaktır.

Gate Agent FAILED döndürdüğünde rapor yapılandırılmıştır ve story dosyasının
altına **GATE-LOG** bölümü olarak eklenir (bir sonraki deneme bunu OKUR —
aynı kök nedene ikinci kez düşmek başlı başına bulgudur):

```text
GATE_FAILED
  story: [görev adı]
  pass: [hangi pass fail etti]
  severity: [CRITICAL | HIGH]
  beklenen: [ne olmalıydı]
  bulunan: [ne bulundu — komut + çıktı]
  kok_neden: [sınıf: tip hatası | eksik test | token ihlali | kapsam dışı | ...]
  duzeltme: [ilgili agent'tan beklenen somut adım]
  kacin: [bir sonraki denemede yapılmaması gereken]
```

Döngü sayacı ROUTEMAP Gate kolonunda tutulur: FAILED → FIX_1 → FIX_2 →
ESCALATED. ESCALATED'da ana oturum durur, kullanıcıya seçenekli özet sunar.
Gate sonucunu ROUTEMAP'e **ana oturum** işler (gate'in Write yetkisi yok —
denetleyen, denetlediği kaydı değiştirmez).
