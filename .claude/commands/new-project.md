---
description: Yeni proje sihirbazı: şablon, palet, tema, belgeler ve ilk doğrulama (Next 16, Tailwind v4, motion)
argument-hint: "<proje-adı>"
---

`$ARGUMENTS` adinda yeni bir proje olustur. Bu komut her projeden cagrilabilir;
butun kaynak yollari mutlaktir (`~/dev-starter/...`). Hedef dizin varsayilan
olarak `~/Desktop/Projects/$ARGUMENTS`; kullanici baska bir yer soylediyse orasi.

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

## 2. Sablonu kopyala

```bash
TARGET=~/Desktop/Projects/$ARGUMENTS
mkdir -p "$TARGET"
rsync -a --exclude node_modules --exclude .next \
  ~/dev-starter/templates/<sablon>/ "$TARGET"/
```

Nokta dosyalari (`.env.example`, `.gitignore`, `.nvmrc`) da kopyalanmali;
`rsync -a kaynak/ hedef/` bunlari tasir, `cp kaynak/*` tasimaz.

Overlay secildiyse sablondan sonra:

```bash
cp -R ~/dev-starter/templates/agentic-chat/app/. "$TARGET"/app/
```

ve README'deki pin'li `npm i` komutu (`@ag-ui/*` surumu TAM pin, aralik yok).

## 3. Yer tutuculari degistir

Iki yer tutucu var: `PROJECT_NAME` (kebab-case paket adi) ve
`PROJECT_DESCRIPTION` (tek cumle, Turkce). Aciklamayi KICKOFF.md'den al ya da sor.

```bash
cd "$TARGET"
grep -rl --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . | while read -r f; do
  sed -i '' -e "s/PROJECT_NAME/$ARGUMENTS/g" -e "s/PROJECT_DESCRIPTION/<aciklama>/g" "$f"
done
grep -rn --exclude-dir=node_modules -e PROJECT_NAME -e PROJECT_DESCRIPTION . || echo "yer tutucu kalmadi"
```

Aciklamada `/`, `&` gibi `sed` ozel karakterleri varsa kacir. (`sed -i ''`
macOS sozdizimi; Linux'ta `sed -i`.)

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
npm install
npm run build        # once build: PageProps/RouteContext tipleri .next/types'a uretilir
npm run typecheck
npm run lint
npm test
```

Biri kirmiziysa duzelt; sablon kaynakli bir hataysa kullaniciya soyle ve
sablonun kendisinin (`~/dev-starter/templates/<sablon>/`) duzeltilmesi gerektigini not et.

## 7. Git

```bash
git init -b main && git add -A && git commit -m "chore: initialize $ARGUMENTS"
```

`git status` ile `.env.local` ve `node_modules`un girmedigini dogrula.

## 8. Ozet ve kalan adimlar

Olusturulan dosyalari kisaca listele, sonra `~/dev-starter/guides/01-kickoff.md`den
kalanlari kontrol listesi olarak ver:

- [ ] `.env.local` dolduruldu (`AUTH_SECRET`: `npx auth secret`)
- [ ] Neon projesi (eu-central-1) + gelistirme dali, `npm run db:migrate`
- [ ] `vercel link`, env Vercel'e eklendi, bos sayfayla ilk deploy
- [ ] CI yesil ve bir kez bilerek kirmiziya dusuruldu
- [ ] Alan adi + `NEXT_PUBLIC_SITE_URL`
- [ ] Analitik (Vercel Analytics + Speed Insights)
- [ ] Smoke betigi (rota × 390/1280)
