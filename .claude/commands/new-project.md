---
description: Yeni proje sihirbazı: şablon, palet, tema, belgeler ve ilk doğrulama (Next 16, Tailwind v4, motion)
argument-hint: "<proje-adı>"
---

`$ARGUMENTS` adında yeni bir proje oluştur. Bu komut her projeden çağrılabilir;
bütün kaynak yolları mutlaktır (`~/dev-starter/...`). Hedef dizin varsayılan
olarak `$PROJECTS_DIR` (tanımsızsa `~/Desktop/Projects`) altında proje adı;
dizin yoksa kullanıcıya sor, varsayıma gömülme. Kullanıcı başka bir yer
söylediyse orası.

**Rehber:** `~/dev-starter/guides/01-kickoff.md` adım adım izlenir. Bu komut
onun ilk adımlarını otomatikleştirir; kalanları (Neon, Vercel, CI, alan adı)
sonunda kontrol listesi olarak verir.

## 0. Önce `/kickoff` var mı?

Hedef dizinde `docs/KICKOFF.md` varsa oku: şablon, palet, varsayılan tema ve
ürün açıklaması oradan gelir, tekrar sorma. Yoksa ve fikir henüz netleşmemişse
kullanıcıya `/kickoff` önermek için tek cümle yaz, sonra devam et.

## 1. Şablon seç

KICKOFF.md yoksa sor:

- `nextjs-fullstack` — oturum ve veritabanı olan uygulama: Drizzle + Neon,
  next-auth v5, `proxy.ts`, tema (çerez + `data-theme`), bileşen kataloğu
- `landing` — tek sayfalık tanıtım/vitrin: tema, motion kataloğu, yedi kahraman
  düzeni (`lib/content.ts` → `hero.variant`), SEO dosyaları, veritabanı yok
  Ürün tanıtımı (Mac uygulaması, geliştirici aracı, SaaS) ise Tanıtım grubu
  hazır: `node ~/dev-starter/scripts/add-ui.mjs . docking-nav blur-in liquid-glass trust-line app-window dock hand-callout`
  (görsel zeminli kahraman + sayfada denenen ürün maketi; `guides/10` → Ribbon Turu)
- `+ agentic-chat` overlay (isteğe bağlı, yalnızca `nextjs-fullstack` üstüne):
  LLM sohbeti. Önce `/agentic kurulum` ile karar ver; kurulum
  `~/dev-starter/templates/agentic-chat/README.md`

İki parça şablonla HAZIR gelir ya da tek komutla eklenir:

- **AI akışı** (`nextjs-fullstack` içinde, `/akis`): agent hazırlar, kullanıcı
  onaylar. Geliştirmede veritabanısız demo moduyla açılır. Üründe akış yoksa
  sil: `app/akis/`, `components/feed/`, `lib/feed*.ts`, `tests/feed.test.ts`
  ve `lib/schema.ts` → `feedItems`. Karar: `/agentic feed`.
- **Açıklayıcı figür** (anatomy, iki şablon): ürün "nasıl çalışır" diye
  anlatılacaksa `node ~/dev-starter/scripts/add-figure-kit.mjs "$TARGET"`
  (kit `components/iso/`). Şablon hazır: `<html class="iso">`, figür dizinleri
  için ESLint ayarı. Figürü anatomy skill'i yazar.

## 2. Şablonu kopyala

```bash
TARGET="${PROJECTS_DIR:-$HOME/Desktop/Projects}/$ARGUMENTS"
mkdir -p "$TARGET"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude node_modules --exclude .next \
    ~/dev-starter/templates/<şablon>/ "$TARGET"/
else   # rsync yoksa (bulut oturumu): `/.` nokta dosyalarını da taşır
  cp -R ~/dev-starter/templates/<şablon>/. "$TARGET"/
  rm -rf "$TARGET"/node_modules "$TARGET"/.next
fi
[ -f "$TARGET"/.env.local ] || cp "$TARGET"/.env.example "$TARGET"/.env.local
```

Nokta dosyaları (`.env.example`, `.gitignore`, `.nvmrc`) da kopyalanmalı;
`rsync -a kaynak/ hedef/` bunları taşır, `cp kaynak/*` taşımaz. `.env.local`
burada doğar (gitignore'da) ki overlay ona ekleyebilsin ve 6. adım yerel
değerleri yazabilsin; varsa ezilmez.

Overlay seçildiyse şablondan sonra:

```bash
cp -R ~/dev-starter/templates/agentic-chat/app/. "$TARGET"/app/
mkdir -p "$TARGET"/lib && cp ~/dev-starter/templates/agentic-chat/lib/agui-scenarios.ts "$TARGET"/lib/
cat ~/dev-starter/templates/agentic-chat/.env.example >> "$TARGET"/.env.local   # EKLE, ezme
```

ve README'deki pin'li `npm i` komutu (`@ag-ui/*` sürümü TAM pin, aralık yok).
`route.ts` `@/lib/agui-scenarios`i import eder; `lib/` kopyalanmazsa build
"Module not found" ile durur. `CopilotProvider` kök layout'a DEĞİL, yalnızca
sohbetin olduğu segmentin layout'una girer
(`~/dev-starter/templates/agentic-chat/README.md` → Bağlama).

## 3. Yer tutucuları değiştir

İki yer tutucu var: `PROJECT_NAME` (kebab-case paket adı) ve
`PROJECT_DESCRIPTION` (tek cümle, Türkçe). Açıklamayı KICKOFF.md'den al ya da sor.

```bash
cd "$TARGET"
grep -rl --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . | while read -r f; do
  sed -i.bak -e "s/PROJECT_NAME/$ARGUMENTS/g" -e "s/PROJECT_DESCRIPTION/<aciklama>/g" "$f" && rm -f "$f.bak"
done
grep -rn --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . || echo "yer tutucu kalmadı"
```

Açıklamada `/`, `&` gibi `sed` özel karakterleri varsa kaçır. (`sed -i.bak`
hem macOS hem Linux'ta aynı çalışır; `sed -i ''` yalnız macOS'tur.)

## 4. Palet ve tema

Kimlik ortak, palet projeye göre (`~/dev-starter/guides/00-brand-identity.md`):

| Palet | Ne zaman |
|-------|----------|
| `signature` (varsayılan) | Finans, araç, editoryal, kişisel site |
| `verdant` | Sağlık, terapi, doğa |
| `ember` | Oyun, eğlence, topluluk |
| `iris` | Yaratıcı araç, yapay zekâ ürünü |

Varsayılan tema: gündüz kullanılan araç → `light` (şablon varsayılanı),
portfolyo/oyun → `dark`. `lib/theme.ts` içindeki `DEFAULT_THEME` ve `PALETTE`
sabitleri buna göre ayarlanır (`<html data-palette>` oradan basılır).

Görsel dil için bir **referans tema** istenirse (isteğe bağlı) şu dosyalardan
biri okunur; kopyalanmaz, `docs/DESIGN.md`ye **farkı** yazılır:

- `acilis-zili` — `signature` paletinin kaynağı; ton farkıyla derinlik, tek grotesk aile
- `mimio` — mavi → cyan imza degradesi, üç katmanlı zemin (aurora → grain → cam)
- `ahmetakyapi` — kişisel site; eski indigo/cyan/emerald, next-themes
- `keskealsaydim` — finans paneli, emerald + cyan, yoğun veri
- `minimal` — referans yok; yalnızca şablonun token'ları

Dosyalar: `~/dev-starter/knowledge/themes/<ad>.md`. (`digynotes` arşivde; seçenek değil.)

## 5. Belgeler

```bash
mkdir -p "$TARGET/docs"
for d in PRODUCT ROUTEMAP DESIGN; do
  [ -f "$TARGET/docs/$d.md" ] || cp ~/dev-starter/templates/docs/$d.template.md "$TARGET/docs/$d.md"
done
```

`PRODUCT.md`nin başına ürün sorusunun üç cümlesi (kimin için, ne zaman, tek
ölçü). `ROUTEMAP.md` yalnızca durum tutar. Büyük projede istenirse
`ARCHITECTURE.template.md` ve `SCREENS.template.md` de kopyalanır.

## 6. Kur ve doğrula — hepsi temiz olmadan bitti deme

```bash
cd "$TARGET"
# Üretim derlemesi site adresi olmadan durur (lib/env.ts → assertSiteUrlForBuild,
# sessizce localhost yayınlamasın). Yerel deneme adresi; gerçek alan adı yayın
# ortamının env'ine yazılır, .env.local oraya gitmez.
sed -i.bak -e 's|^NEXT_PUBLIC_SITE_URL=$|NEXT_PUBLIC_SITE_URL=http://localhost:3000|' .env.local && rm -f .env.local.bak
# Yalnız nextjs-fullstack: AUTH_SECRET üretimde zorunlu ve `next build` üretimdir
if grep -q '^AUTH_SECRET=$' .env.local; then
  sed -i.bak "s|^AUTH_SECRET=\$|AUTH_SECRET=$(openssl rand -base64 32)|" .env.local && rm -f .env.local.bak
fi
npm install
npm run build        # önce build: PageProps/RouteContext tipleri .next/types'a üretilir
npm run typecheck
npm run lint
npm test
```

Biri kırmızıysa düzelt; şablon kaynaklı bir hataysa kullanıcıya söyle ve
şablonun kendisinin (`~/dev-starter/templates/<şablon>/`) düzeltilmesi gerektiğini not et.

## 7. Enforcement doğrulaması

Şablon `.claude/settings.json` ile gelir: gate-guard, quality-scan,
routemap-sync ve session-brief hook'ları `~/dev-starter/hooks/`tan mutlak
yolla çalışır. Varlığını değil DAVRANIŞINI doğrula (mistakes.md #52, #99):

```bash
test -f "$TARGET/.claude/settings.json" && grep -q gate-guard "$TARGET/.claude/settings.json"
cd "$TARGET" && printf '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}' \
  | bash ~/dev-starter/hooks/gate-guard.sh; echo "exit=$? (0 beklenir: ROUTEMAP'te aktif story yok)"
```

## 8. Git

```bash
cd "$TARGET" && git init -b main
git config user.name; git config user.email     # boşsa ya da Claude ise ÖNCE düzelt (aşağıda)
# Terminalden atılan commit'ler de Gate + sır taramasından geçsin (klon başına bir kez)
bash ~/dev-starter/hooks/git-pre-commit.sh --install
git add -A
git status --short | grep -E '\.env\.local|node_modules' && echo "DUR: sır ya da node_modules stage'lendi"
git commit -m "chore: initialize $ARGUMENTS"
```

Commit yazarı her depoda Ahmet'tir; bulut oturumunda ve taze makinede kimlik
varsayılan olarak Claude'dur. İlk committen ÖNCE kimliği
`~/dev-starter/machine/CLAUDE.md` → Commit ve Push'taki iki `git config`
satırıyla ayarla (değerler orada, tek kaynak). `grep` bir şey basarsa
commit'ten önce `.gitignore`u düzelt. Uzak depo ve push bu komutun işi
değildir; kullanıcı isterse `gh repo create`.

## 9. Özet ve kalan adımlar

Oluşturulan dosyaları kısaca listele ve yönlendir: **"Sırada `/plan` —
P1→P6 ile story'leri çıkaralım mı?"** Sonra
`~/dev-starter/guides/01-kickoff.md`den kalanları kontrol listesi olarak ver:

- [ ] `.env.local` dolduruldu (`DATABASE_URL`, istenirse OAuth; yerel
      `AUTH_SECRET` 6. adımda üretildi, üretiminki ayrı: `npx auth secret`)
- [ ] Neon projesi (eu-central-1) + geliştirme dalı, `npm run db:migrate`
- [ ] `vercel link`, env Vercel'e eklendi, boş sayfayla ilk deploy
- [ ] CI yeşil ve bir kez bilerek kırmızıya düşürüldü
- [ ] Alan adı + `NEXT_PUBLIC_SITE_URL`
- [ ] Analitik (Vercel Analytics + Speed Insights)
- [ ] Smoke betiği (rota × 390/1280)
