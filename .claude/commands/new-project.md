---
description: Yeni proje sihirbazı: şablon, palet, tema, belgeler ve ilk doğrulama (Next 16, Tailwind v4, motion)
argument-hint: "<proje-adı>"
---

`$ARGUMENTS` adinda yeni bir proje olustur. Bu komut her projeden cagrilabilir;
butun kaynak yollari mutlaktir (`~/dev-starter/...`). Hedef dizin varsayilan
olarak `$PROJECTS_DIR` (tanimsizsa `~/Desktop/Projects`) altinda proje adi;
dizin yoksa kullaniciya sor, varsayima gomulme. Kullanici baska bir yer
soylediyse orasi.

**Rehber:** `~/dev-starter/guides/01-kickoff.md` adim adim izlenir. Bu komut
onun ilk adimlarini otomatiklestirir; kalanlari (Neon, Vercel, CI, alan adi)
sonunda kontrol listesi olarak verir.

## 0. Once `/kickoff` var mi?

Hedef dizinde `docs/KICKOFF.md` varsa oku: sablon, palet, varsayilan tema ve
urun aciklamasi oradan gelir, tekrar sorma. Yoksa ve fikir henuz netlesmemisse
kullaniciya `/kickoff` onermek icin tek cumle yaz, sonra devam et.

## 1. Sablon sec

KICKOFF.md yoksa sor:

- `nextjs-fullstack` — oturum ve veritabani olan uygulama: Drizzle + Neon,
  next-auth v5, `proxy.ts`, tema (cerez + `data-theme`), bilesen katalogu
- `landing` — tek sayfalik tanitim/vitrin: tema, motion katalogu, yedi kahraman
  duzeni (`lib/content.ts` → `hero.variant`), SEO dosyalari, veritabani yok
- `+ agentic-chat` overlay (istege bagli, yalnizca `nextjs-fullstack` ustune):
  LLM sohbeti. Once `/agentic kurulum` ile karar ver; kurulum
  `~/dev-starter/templates/agentic-chat/README.md`

Iki parca sablonla HAZIR gelir ya da tek komutla eklenir:

- **AI akisi** (`nextjs-fullstack` icinde, `/akis`): ajan hazirlar, kullanici
  onaylar. Gelistirmede veritabanisiz demo moduyla acilir. Urunde akis yoksa
  sil: `app/akis/`, `components/feed/`, `lib/feed*.ts`, `tests/feed.test.ts`
  ve `lib/schema.ts` → `feedItems`. Karar: `/agentic feed`.
- **Aciklayici figur** (anatomy, iki sablon): urun "nasil calisir" diye
  anlatilacaksa `node ~/dev-starter/scripts/add-figure-kit.mjs "$TARGET"`
  (kit `components/iso/`). Sablon hazir: `<html class="iso">`, figur dizinleri
  icin ESLint ayari. Figuru anatomy skill'i yazar.

## 2. Sablonu kopyala

```bash
TARGET=~/Desktop/Projects/$ARGUMENTS
mkdir -p "$TARGET"
rsync -a --exclude node_modules --exclude .next \
  ~/dev-starter/templates/<sablon>/ "$TARGET"/
[ -f "$TARGET"/.env.local ] || cp "$TARGET"/.env.example "$TARGET"/.env.local
```

Nokta dosyalari (`.env.example`, `.gitignore`, `.nvmrc`) da kopyalanmali;
`rsync -a kaynak/ hedef/` bunlari tasir, `cp kaynak/*` tasimaz. `.env.local`
burada dogar (gitignore'da) ki overlay ona ekleyebilsin ve 6. adim yerel
degerleri yazabilsin; varsa ezilmez.

Overlay secildiyse sablondan sonra:

```bash
cp -R ~/dev-starter/templates/agentic-chat/app/. "$TARGET"/app/
mkdir -p "$TARGET"/lib && cp ~/dev-starter/templates/agentic-chat/lib/agui-scenarios.ts "$TARGET"/lib/
cat ~/dev-starter/templates/agentic-chat/.env.example >> "$TARGET"/.env.local   # EKLE, ezme
```

ve README'deki pin'li `npm i` komutu (`@ag-ui/*` surumu TAM pin, aralik yok).
`route.ts` `@/lib/agui-scenarios`i import eder; `lib/` kopyalanmazsa build
"Module not found" ile durur. `CopilotProvider` kok layout'a DEGIL, yalnizca
sohbetin oldugu segmentin layout'una girer
(`~/dev-starter/templates/agentic-chat/README.md` → Baglama).

## 3. Yer tutuculari degistir

Iki yer tutucu var: `PROJECT_NAME` (kebab-case paket adi) ve
`PROJECT_DESCRIPTION` (tek cumle, Turkce). Aciklamayi KICKOFF.md'den al ya da sor.

```bash
cd "$TARGET"
grep -rl --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . | while read -r f; do
  sed -i.bak -e "s/PROJECT_NAME/$ARGUMENTS/g" -e "s/PROJECT_DESCRIPTION/<aciklama>/g" "$f" && rm -f "$f.bak"
done
grep -rn --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . || echo "yer tutucu kalmadi"
```

Aciklamada `/`, `&` gibi `sed` ozel karakterleri varsa kacir. (`sed -i.bak`
hem macOS hem Linux'ta ayni calisir; `sed -i ''` yalniz macOS'tur.)

## 4. Palet ve tema

Kimlik ortak, palet projeye gore (`~/dev-starter/guides/00-brand-identity.md`):

| Palet | Ne zaman |
|-------|----------|
| `signature` (varsayilan) | Finans, arac, editoryal, kisisel site |
| `verdant` | Saglik, terapi, doga |
| `ember` | Oyun, eglence, topluluk |
| `iris` | Yaratici arac, yapay zeka urunu |

Varsayilan tema: gunduz kullanilan arac → `light` (sablon varsayilani),
portfolyo/oyun → `dark`. `lib/theme.ts` icindeki `DEFAULT_THEME` ve `PALETTE`
sabitleri buna gore ayarlanir (`<html data-palette>` oradan basilir).

Gorsel dil icin bir **referans tema** istenirse (istege bagli) su dosyalardan
biri okunur; kopyalanmaz, `docs/DESIGN.md`ye **farki** yazilir:

- `acilis-zili` — `signature` paletinin kaynagi; ton farkiyla derinlik, tek grotesk aile
- `mimio` — mavi → cyan imza degradesi, uc katmanli zemin (aurora → grain → cam)
- `ahmetakyapi` — kisisel site; eski indigo/cyan/emerald, next-themes
- `keskealsaydim` — finans paneli, emerald + cyan, yogun veri
- `minimal` — referans yok; yalnizca sablonun token'lari

Dosyalar: `~/dev-starter/knowledge/themes/<ad>.md`. (`digynotes` arsivde; secenek degil.)

## 5. Belgeler

```bash
mkdir -p "$TARGET/docs"
for d in PRODUCT ROUTEMAP DESIGN; do
  [ -f "$TARGET/docs/$d.md" ] || cp ~/dev-starter/templates/docs/$d.template.md "$TARGET/docs/$d.md"
done
```

`PRODUCT.md`nin basina urun sorusunun uc cumlesi (kimin icin, ne zaman, tek
olcu). `ROUTEMAP.md` yalnizca durum tutar. Buyuk projede istenirse
`ARCHITECTURE.template.md` ve `SCREENS.template.md` de kopyalanir.

## 6. Kur ve dogrula — hepsi temiz olmadan bitti deme

```bash
cd "$TARGET"
# Uretim derlemesi site adresi olmadan durur (lib/env.ts → assertSiteUrlForBuild,
# sessizce localhost yayinlamasin). Yerel deneme adresi; gercek alan adi yayin
# ortaminin env'ine yazilir, .env.local oraya gitmez.
sed -i.bak -e 's|^NEXT_PUBLIC_SITE_URL=$|NEXT_PUBLIC_SITE_URL=http://localhost:3000|' .env.local && rm -f .env.local.bak
# Yalniz nextjs-fullstack: AUTH_SECRET uretimde zorunlu ve `next build` uretimdir
if grep -q '^AUTH_SECRET=$' .env.local; then
  sed -i.bak "s|^AUTH_SECRET=\$|AUTH_SECRET=$(openssl rand -base64 32)|" .env.local && rm -f .env.local.bak
fi
npm install
npm run build        # once build: PageProps/RouteContext tipleri .next/types'a uretilir
npm run typecheck
npm run lint
npm test
```

Biri kirmiziysa duzelt; sablon kaynakli bir hataysa kullaniciya soyle ve
sablonun kendisinin (`~/dev-starter/templates/<sablon>/`) duzeltilmesi gerektigini not et.

## 7. Enforcement dogrulamasi

Sablon `.claude/settings.json` ile gelir: gate-guard, quality-scan,
routemap-sync ve session-brief hook'lari `~/dev-starter/hooks/`tan mutlak
yolla calisir. Varligini degil DAVRANISINI dogrula (mistakes.md #52, #99):

```bash
test -f "$TARGET/.claude/settings.json" && grep -q gate-guard "$TARGET/.claude/settings.json"
cd "$TARGET" && printf '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}' \
  | bash ~/dev-starter/hooks/gate-guard.sh; echo "exit=$? (0 beklenir: ROUTEMAP'te aktif story yok)"
```

## 8. Git

```bash
git init -b main && git add -A && git commit -m "chore: initialize $ARGUMENTS"
```

`git status` ile `.env.local` ve `node_modules`un girmedigini dogrula.

## 9. Ozet ve kalan adimlar

Olusturulan dosyalari kisaca listele ve yonlendir: **"Sirada `/plan` —
P1→P6 ile story'leri cikaralim mi?"** Sonra
`~/dev-starter/guides/01-kickoff.md`den kalanlari kontrol listesi olarak ver:

- [ ] `.env.local` dolduruldu (`DATABASE_URL`, istenirse OAuth; yerel
      `AUTH_SECRET` 6. adimda uretildi, uretiminki ayri: `npx auth secret`)
- [ ] Neon projesi (eu-central-1) + gelistirme dali, `npm run db:migrate`
- [ ] `vercel link`, env Vercel'e eklendi, bos sayfayla ilk deploy
- [ ] CI yesil ve bir kez bilerek kirmiziya dusuruldu
- [ ] Alan adi + `NEXT_PUBLIC_SITE_URL`
- [ ] Analitik (Vercel Analytics + Speed Insights)
- [ ] Smoke betigi (rota × 390/1280)
