# Ahmet Akyapı — Global Claude Code Kuralları

Bu dosya tüm projelerde geçerlidir. Proje seviyesindeki CLAUDE.md dosyaları bunu override eder.

**Bu dosyanın sözleşmesi:** her oturumda, her projede yüklenir; yalnız her
projede gereken kural burada durur. Belirli dosyalara ait kurallar
`~/.claude/rules/dev-starter/` altında (kaynak `~/dev-starter/machine/rules/`,
`bootstrap.sh` bağlar) `paths:` frontmatter'ıyla, ilgili dosya okununca
yüklenir. Yeni kural eklerken önce "her projede, her işte gerekli mi?" diye
sor; değilse yol kapsamlı kurala ya da skill'e yaz. Tavan ~200 satır
(`scripts/health-check.sh`). Karar: `~/dev-starter/knowledge/decisions.md` →
"Bağlam Dosyaları".

| Yol kapsamlı kural (`machine/rules/`) | Ne zaman yüklenir | İçerik |
|---|---|---|
| `nextjs-react.md` | `*.tsx`, `app/`, `components/`, `hooks/`, `proxy.ts` | React/Next standartları, dosya yapısı, arayüz hataları |
| `data-env.md` | `lib/db*`, şema, migration, `.env.example`, API, action | Veritabanı, ortam değişkeni, yayın hataları |
| `visual-language.md` | `*.css`, `*.tsx`, `THEME.md`, tema belgeleri | Kimlik/palet DNA'sı, proje tema tablosu |
| `design-skills.md` | `*.css`, `*.tsx`, `app/`, `components/` | taste-skill tablosu, mod tespiti, öncelik, çakışmalar |
| `admin-live-preview.md` | `admin/`, `panel/`, `yonetim/` | Canlı önizleme kuralının ayrıntısı |

---

## Kimlik

Ahmet Akyapı — Full-Stack & AI Developer (web ürünleri + yapay zekâ katmanı: Claude API, agent arayüzleri).
Kişisel projeler: ahmetakyapi.com, Açılış Zili, Mimio, Keskealsaydım, ElevenForge, simayahi
Ekosistem referansı: `~/dev-starter/`

---

## Temel Tech Stack

Proje konfigürasyonu aksini belirtmediği sürece:

- **Framework**: Next.js 16 (App Router) + React 19.2 — `proxy.ts`, Turbopack
- **Stil**: Tailwind CSS v4 — `@theme inline`, `tailwind.config.ts` YOK, `dark:` yok
- **Animasyon**: `motion` (`motion/react`, LazyMotion + `m.*`) — basit hareket CSS, GSAP değil
- **Tema**: `data-theme` + çerez, sunucuda basılır — next-themes yalnız eski projelerde
- **Veritabanı**: PostgreSQL — Neon serverless tercih edilir
- **ORM**: Drizzle ORM — Prisma değil (unless project uses it already)
- **Auth**: next-auth v5 (JWT); tek yöneticili panelde HMAC çerez yeter
- **Doğrulama**: zod 4 — env, form, Server Action girdisi
- **Deployment**: Vercel
- **Dil**: TypeScript — `strict: true`
- **İkonlar**: lucide-react
- **Paket Yöneticisi**: npm · **Node**: 24 (`.nvmrc`), en az 20.9
- **Lint/Test**: ESLint 9 flat config (`next lint` yok) · `node --test` + tsx

---

## Kod Standartları

### TypeScript
- `as const` — literal type'lar için her zaman kullan
- `unknown` tercih et `any` yerine
- Interface yerine `type` — union/intersection'lar için
- Bağımlılık dizilerini (`useCallback`, `useMemo`, `useEffect`) eksiksiz doldur

### Her Projede Akılda Tutulacak Üç Kural
- **Server Action herkese açık POST ucudur**: her birinde `auth()` + zod + sahiplik (ayrıntı `nextjs-react.md`)
- **Migration her zaman yeni dosya**, deploy'da uygulanmaz; env ve migration deploy'dan ÖNCE (ayrıntı `data-env.md`)
- **Yönetim paneli canlı önizlemesiz olmaz**: sitede görünen bir şeyi düzenleyen her ekranın yanında
  sitenin kendisi (masaüstü + telefon, açık/koyu, yazdıkça) — `~/dev-starter/rules/live-preview.md` (ayrıntı `admin-live-preview.md`)

React/Next, veritabanı, ortam değişkeni ve görsel dil kurallarının tamamı
yukarıdaki tablodaki dosyalarda. Hatalar: `~/dev-starter/knowledge/mistakes.md`.

---

## Metin Yazımı

### Başlık büyük harf düzeni — Title Case
Başlıklar, alt başlıklar, düğme etiketleri, sekme adları, kart başlıkları ve
menü satırları **Title Case** yazılır:

- ✅ `Yeni Danışan`, `Seansı Başlat`, `Haftalık Plan`, `Gelişim Eğrisi`
- ❌ `Yeni danışan`, `Seansı başlat`, `Haftalık plan`

**Kapsam dışı** (cümle düzeni korunur):
- Gövde metni ve açıklama satırları — `Skor sütunu son 8 seansın eğilimini gösterir.`
- Veri altındaki mono mikro etiketler — `bağımsızlık 4/5`, `birincil hedef`, `3 gün önce`
- Boş durum cümleleri ve yardım metinleri

**Türkçe tuzağı:** `title()` / `text-transform: capitalize` kullanma —
`i → I` üretir, `İ` değil. Küçük bağlaçlar (`ve`, `ile`, `için`, `de`, `da`)
başta değilse küçük kalır. Kısaltmalar olduğu gibi durur: `CSV`, `AOTA`, `SOAP`.

### Çeviri kokan ifade yok
İngilizceden kelime kelime çevrilmiş, Türkçede tuhaf çağrışım yapan ifade
kullanılmaz — arayüzde de, belgede de, yanıtta da:

- ❌ `çıplak sayı`, `çıplak alan adı` → ✅ `birimsiz sayı`, `kök alan adı`, `yalın`, `süssüz`
- ❌ `olay ateşlenir` → ✅ `olay tetiklenir`, `çalışır`
- ❌ `kutudan çıktığı gibi` → ✅ `varsayılan olarak`
- ❌ her şeye `yüzey` → ✅ ne olduğunu söyle: `kart`, `panel`, `zemin`

## Yasaklı Yaklaşımlar

- CSS-in-JS (styled-components, emotion) — Tailwind yeter
- Class-based React bileşenleri
- `var` — sadece `const`/`let`
- `console.log` commit'e gitmemeli (dev debug dışında)
- Gereksiz `any` kullanımı
- `// @ts-ignore` — gerçek sorunu çöz
- Magic number'lar — named constant kullan
- `eslint-disable` yorum satırı — sorunu düzelt
- Hardcoded renk ve `dark:` varyantı — her zaman token (ayrıntı `visual-language.md`)

---

## Commit ve Push

Biçim `<tip>(<kapsam>): <açıklama>`; kapsam isteğe bağlı. Tipler: `feat`,
`fix`, `refactor`, `style`, `perf`, `test`, `docs`, `chore`, `ci` (`hotfix`
tip değildir, `fix` yazılır). Tek kaynak
`~/dev-starter/rules/commit-conventions.md`; `quality-scan` hook'u konu
satırını aynı listeyle denetler. Örnek: `feat(auth): Google ile giriş`.

**"Commitle" push'u da kapsar.** Ahmet commit istediğinde aynı turda düz
`git push` de yapılır. "Push edeyim mi?" diye SORMA, onay bekleme — tek kişilik
özel repolarda çalışıyor, arada bekletmek boş bir tur. `main`'e push'un otomatik
Vercel deploy tetiklediği projelerde sonuç canlı dağıtımdır; bunu bilerek
kabul etti, ayrıca uyarma.

**Öncelik (iki kural çatışmaz):** "onaysız production deploy yok" kuralı
(`/deploy`, deploy agent'ı, `AGENT_PROTOCOL.md` → Onay Noktaları) AÇIKÇA
çalıştırılan geri alınması zor komutlar içindir: `vercel --prod`,
`npm publish`, üretim veritabanında migration, `git push --force`. Bunlar her
seferinde açık onay ister (proje ayarlarında `permissions.ask`). "Commitle"nin
getirdiği düz push o onayın kendisidir; kapsamı yalnız o commit'tir.

Koruma onay sorusu değil, commit ÖNCESİ kontroldür: `git status` ile yalnızca
amaçlanan dosyaların girdiğini doğrula, `typecheck` ve `build` çalıştır.

**Commit yazarı her depoda Ahmet.** Yazarı yalnızca "Claude" olan commit
atılmaz; Claude mesajın sonundaki `Co-Authored-By:` satırıyla görünür. Bulut
oturumunda ve taze klonda git kimliği varsayılan olarak Claude'dur; ilk
committen ÖNCE:

```bash
git config user.name "Ahmet Akyapı"
git config user.email "ahmetakyapii@gmail.com"
```

(Kural 9 Ekim 2026'dan beri Açılış Zili'nin CLAUDE.md'sinde yazılıydı ama
burada değildi; 26 Ekim'de bulut oturumu dev-starter'a iki "Claude" commit'i attı.)

---

## Görsel Dil ve Tasarım Skill'leri — Özet

- Proje kendi temasını söylemiyorsa Açılış Zili referanstır (`signature` paleti, token mimarisi).
  Kimlik ortak, palet projeye göre: `~/dev-starter/guides/00-brand-identity.md` · ayrıntı `visual-language.md`.
- **VARSAYILAN:** tanıtım sayfası, portfolyo ya da pazarlama sayfası içeren HER frontend işinde
  KOD YAZMADAN ÖNCE `design-taste-frontend` çağrılır, kullanıcı anmasa bile. Panolar, yönetim
  panelleri, veri tabloları kapsam dışı (yalnız pazarlama bölümleri). Var olan sitede mod
  "Redesign — Preserve". Öncelik: proje teması > ekosistem kuralları > skill. Tablo, mod tespiti
  ve bilinen çakışmalar `design-skills.md`de.

## Paralel Oturumlar — cmux Önerisi

Kullanıcı **kendi Mac'inde aynı anda birden fazla Claude Code oturumu**
yürütüyorsa ("öbür oturumda", "diğer projede de çalışıyor", "hangisi
bitmişti" gibi) cmux'u **bir kez, tek cümleyle** öner: hangi oturumun onu
beklediğini halka ve rozetle gösterir, agent'ın kullanabildiği bir tarayıcı
paneli vardır. Kurulum ve gerekçe `~/dev-starter/machine/README.md →
Paralel Oturumlar`.

- Önerme: bulut oturumunda (cmux yalnız yerel terminali yönetir), zaten
  cmux içindeyken (`CMUX_WORKSPACE_ID` tanımlı) ya da kullanıcı bir kez
  reddettiyse.
- Kurmayı kullanıcı yapar; agent kurmaz, ayar dosyasına dokunmaz.
- Orkestrasyonun yerine geçmez: subagent'lar ve Görev Tanımı aynen sürer.

## Yeni Proje Başlarken

```
/kickoff       — fikirden plana: pazar, yön, palet, MVP (strategist)
/new-project   — şablon seç ve kur (nextjs-fullstack · landing · + agentic-chat)
/plan          — P1→P6: belgeler + story'ler · /theme — palet/tema uygula
/story         — story'yi uçtan uca işle (dağıt → gate → commit)
/status        — kaldığın yer + sıradaki işler · /gate — commit kontrolü
/fix           — TDD bugfix · /research — benzer çözümler · /retro — ders kaydı
/check         — sağlık kontrolü · /deploy — Vercel checklist · /roadmap — sıradaki işler
```

Sırayla izlenecek rehber: `~/dev-starter/guides/` (00 kimlik → 01 ilk gün → 08 yayına çıkış).
Ekosistem: `~/dev-starter/` · Knowledge base: `~/dev-starter/knowledge/`
