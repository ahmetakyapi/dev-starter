# snippets/live-preview — Yazdıkça Güncellenen Canlı Önizleme

Yönetim panelinde içerik, metin, görsel ya da yazı tipi düzenlenen her ekranın
yanında sitenin **kendisi** durur: masaüstü (1440 × 900) ve telefon (390 × 844)
çerçevesinde, açık ve koyu temada, yazdıkça güncellenerek. Kural:
[`rules/live-preview.md`](../../rules/live-preview.md). Kaynak: Geo Tour
yönetim paneli (`ahmetakyapi/geo-tour`, Ekim 2026), projeden bağımsız hâle
getirildi.

| Dosya | Nereye | Ne yapar |
|-------|--------|----------|
| `drafts.ts` | `lib/drafts.ts` | Oturuma özel taslak: yaz, oku, temizle, `overlay()` (sunucu) |
| `draft-session.ts` | `lib/draft-session.ts` | Oturum kimliği, `previewSrc()` (istemci) |
| `use-live-draft.ts` | `components/live-preview/` | Formun iki şeridi: içerik (taslak → yeniden çizim), görünüm (CSS değişkeni, anında) |
| `site-preview.tsx` | `components/live-preview/` | Çerçeve: cihaz, tema, sayfa sekmeleri, durum rozeti, büyüt, bölüm çerçeveleri |
| `preview-bridge.tsx` | `components/live-preview/` | iframe içindeki köprü: yenile, tema, değişken, odak, tıklanan bölüm |
| `live-preview.css` | `app/(admin)/live-preview.css` | Token'lı stiller + düzenleyici düzeni (`.lp-editor`) |

Bağımlılık: Next 16 App Router, Drizzle + Neon (`@/lib/db`, `@/lib/schema`),
`lucide-react`, `server-only`. Şablon token'ları (`--color-page`,
`--color-strong`, `--color-primary`…) ve `--ease-brand`.

## Akış

```text
Form alanı değişti
  ├─ görünüm (font, punto, renk) ──► preview.vars()  ──► lp:vars ──► :root { --font-display-face … }   anında
  └─ içerik (metin, görsel, sıra) ─► 320 ms bekle ──► saveDraft (Server Action) ──► content_drafts
                                                     └─► preview.refresh() ──► lp:refresh ──► router.refresh()
                                                                                    (sayfa tam yüklenmez, kaydırma yerinde)
Kaydet ──► yayındaki tablo + geçmiş ──► clearDraft ──► markSaved() ──► önizleme "Yayındaki Hâli"
```

Önizleme sitenin gerçek görünüm bileşenini (`HomeView`, `PostView`…) çizer;
taslak yalnız **veri** olarak girer. Ayrı bir "önizleme bileşeni" yazılmaz:
o, sitenin kendisinden bir hafta içinde ayrışır.

## 1. Şema

```ts
// lib/schema.ts
export const contentDrafts = pgTable(
  "content_drafts",
  {
    key: text("key").notNull(),
    session: text("session").notNull(),
    data: jsonb("data").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.key, t.session] }), index("content_drafts_updated_idx").on(t.updatedAt)],
);
```

Yeni migration dosyası (`drizzle-kit generate`). Tablo yokken `readDraft`
sessizce `undefined` döner: önizleme yayındakini çizer, panel kırılmaz.

## 2. Siteyi taslağa açmak

Görünüm bileşeni verisini prop'tan alabilmeli. Sitenin sayfası yayındakini
okur, önizleme rotası taslakla birleşmişini verir:

```tsx
// app/(site)/_views/home.tsx: sayfa ve önizleme AYNI bileşeni çizer
export async function HomeView({ draft }: { draft?: { copy?: HomeCopy } }) {
  const copy = draft?.copy ?? (await getHomeCopy());
  return (
    <>
      <section data-edit="hero">…{copy.title}…</section>
      <section data-edit="faq">…</section>
      <footer data-edit="footer" data-edit-page="footer">…</footer>
    </>
  );
}
```

`data-edit="<bölüm>"` panelin bölüm kimliğiyle aynı: önizlemede tıklanan bölüm
paneldeki aynı adlı grubu açar, paneldeki alana odaklanmak önizlemeyi o bölüme
kaydırır. Başka sayfanın metnini taşıyan bölüm `data-edit-page` alır.

## 3. Taslak Server Action'ı

Server Action herkese açık bir POST ucudur: auth + zod + oturum + boyut sınırı.

```ts
// app/(admin)/_lib/draft-actions.ts
"use server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDraftSession, writeDraft } from "@/lib/drafts";

const DraftInput = z.object({
  key: z.string().regex(/^[a-z]+:[a-z0-9-]+(:[a-z]{2})?$/),
  session: z.string().refine(isDraftSession),
  title: z.string().max(200),
  body: z.string().max(20_000),
  fontPreset: z.enum(["signature", "editorial", "longform"]),
});

export async function saveDraft(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return { ok: false, message: "Yetki yok." };
  const parsed = DraftInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Geçersiz alan." };
  const { key, session: draftSession, ...data } = parsed.data;
  await writeDraft(key, draftSession, data);
  return { ok: true };
}
```

Kaydet eylemi yayındaki kaydı yazdıktan sonra `clearDraft(key, session)` çağırır.

## 4. Önizleme rotası

**Önce güvenlik başlığı.** Şablonlar her yola `X-Frame-Options: DENY` ve
`frame-ancestors 'none'` basar; aynı kökenden iframe'i de engeller, önizleme
sonsuza dek "Önizleme Hazırlanıyor" der (`mistakes.md` #114). İki Next şablonu
(2026-10-27'den beri) `/admin/onizleme/:path*` için istisnayı **hazır taşır**;
önizleme rotası bu yoldaysa yapılacak bir şey yok. Başka yol ya da eski proje
için genel kuraldan SONRA (Next aynı anahtarda sonuncuyu uygular):

```ts
// next.config.ts → headers()
{ source: "/:path*", headers: SECURITY_HEADERS },
{
  source: "/admin/onizleme/:path*",
  headers: [
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
    { key: "X-Robots-Tag", value: "noindex" },
  ],
},
```

Doğrulama: `curl -sI localhost:3000/admin/onizleme/home | grep -i frame` →
`SAMEORIGIN`; `curl -sI localhost:3000/ | grep -i frame` → hâlâ `DENY`.

```tsx
// app/(admin)/admin/onizleme/[page]/page.tsx
export const metadata = { title: "Önizleme", robots: { index: false, follow: false } };

export default function PreviewPage(props: PageProps<"/admin/onizleme/[page]">) {
  return (
    <Suspense fallback={null}>
      <Preview {...props} />
    </Suspense>
  );
}

async function Preview({ params, searchParams }: PageProps<"/admin/onizleme/[page]">) {
  await requireAdmin();                                   // yalnız yönetici
  const [{ page }, query] = await Promise.all([params, searchParams]);
  const session = typeof query.oturum === "string" ? query.oturum : undefined;
  const live = await getHomeCopy();
  const copy = overlay(live, await readDraft<Partial<HomeCopy>>(draftKey("page", page), session));
  return (
    <>
      <PreviewBridge
        page={page}
        labels={LABELS}
        focus={typeof query.odak === "string" ? query.odak : undefined}
        rootClassName={fontOptionClass}                   // § 6: yazı tipi seçenekleri köke
      />
      <SiteFrame>
        <HomeView draft={{ copy }} />
      </SiteFrame>
    </>
  );
}
```

`LABELS`: `JSON.stringify({ home: { title: "Ana Sayfa", sections: { hero: "Açılış", faq: "Sık Sorulan Sorular" } } })`.
Panelin bölüm başlıklarıyla aynı adlar.

## 5. Düzenleyici

```tsx
"use client";
import { useLiveDraft } from "@/components/live-preview/use-live-draft";
import { SitePreview } from "@/components/live-preview/site-preview";
import { previewSrc } from "@/lib/draft-session";
import { saveDraft } from "../_lib/draft-actions";

export function HomeEditor({ initial }: { initial: HomeCopy }) {
  const [values, setValues] = useState(initial);
  const { session, preview, status, markSaved } = useLiveDraft("page:home", values, {
    save: saveDraft,
    vars: FONT_OPTIONS[values.fontPreset].vars,          // yazı tipi anında değişir
  });
  const src = previewSrc("/admin/onizleme/home", { oturum: session });

  return (
    <div className="lp-editor">
      <form onFocusCapture={(e) => {
        const group = (e.target as HTMLElement).closest<HTMLElement>("[data-section]");
        if (group) preview.current?.focus(group.dataset.section!);
      }}>
        <fieldset data-section="hero">…</fieldset>
        {/* Dar ekranda kaydet çubuğunda: <button onClick={() => preview.current?.expand()}>Önizle</button> */}
      </form>
      <aside className="lp-editor-aside">
        {session ? (
          <SitePreview
            ref={preview}
            status={status}
            views={[{ id: "home", label: "Ana Sayfa", src, href: "/" }]}
            onSelect={(section) => openSection(section)}
          />
        ) : null}
      </aside>
    </div>
  );
}
```

`session` hidrasyonda boş, hemen ardından dolar: `SitePreview`i yalnız
`session` varken çiz (`session ? <SitePreview …/> : null`), yoksa iframe
oturumsuz adresi bir kez boşuna yükler. Aynı kayıt sitede birkaç yerde görünüyorsa (`kendi sayfası`, `liste`,
`ana sayfa`) her biri bir `views` sekmesi.

## 6. Yazı tipi ve görünüm şeridi

**Ön koşul:** başlıklar bir değişkenden okunmalı. Şablonların globals.css'i
(2026-10-27'den beri) `--font-display` köprüsünü ve `h1, h2, .font-display`
kuralını taşır; preset başlık ailesi vermezse gövde fontuna düşer. Eski
projede `snippets/fonts/theme-fonts.css`teki `@theme inline` + `@layer base`
bloğu eklenmeden `--font-display-face` değiştirmek hiçbir şeyi değiştirmez
(ölçüldü). Yalnız gövde fontu seçilecekse hedef `--font-sans-face`.

Yazı tipi, punto, satır aralığı, renk vurgusu sunucuya gitmeden değişir. Önizleme
rotası **seçeneklerin hepsini** yükler (yalnız bu rotada; site seçili olanı),
her biri ayrı değişken adıyla; seçim yalnız köprü değişkenini yönlendirir:

```ts
// app/(admin)/_lib/font-options.ts — fonts.ts presetlerinden seçilenler
const newsreader = Newsreader({ subsets: ["latin", "latin-ext"], variable: "--font-opt-newsreader", display: "swap" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-opt-instrument", display: "swap" });

export const FONT_OPTIONS = {
  signature: { label: "Signature", vars: { "--font-display-face": "var(--font-sans-face)" } },
  editorial: { label: "Editoryal", vars: { "--font-display-face": "var(--font-opt-instrument)" } },
  longform: { label: "Uzun Okuma", vars: { "--font-display-face": "var(--font-opt-newsreader)" } },
} as const;
export const fontOptionClass = [newsreader.variable, instrumentSerif.variable].join(" ");
```

`fontOptionClass` köprüye `rootClassName` olarak verilir: hem sınıf hem `lp:vars`
`<html>`e yazılır, `var(--font-opt-*)` orada çözülür. (Sarmalayıcı `div`e
konursa kök, tanımsız değişkene başvurur ve sessizce sistem fontuna düşer.)
Panel önizlemeyi değişkenler ve tema uygulandıktan sonra gösterir: yayındaki
yazı tipiyle bir an bile görünmez. Punto için
aynı yol: `{ "--title-scale": "1.15" }` ve sitede `font-size: calc(var(--text-display) * var(--title-scale, 1))`.
Seçim `fields` içinde de taşınır (`fontPreset`): yeniden çizimde ve sitede aynı
sonuç çıkar.

## 7. Giriş hareketleri

Önizleme her yeniden çizimde sayfayı yeniden kurar; yazdıkça eklenen kart giriş
hareketini baştan oynatırsa saniyelerce görünmez. Köprü 1,8 sn sonra kökte
`data-preview-settled` açar: CSS hareketleri `live-preview.css`in son
bloğundaki kuralla durur. Şablonların `Reveal`i bayrağı kendisi okur
(`usePreviewSettled`, hidrasyonda sunucu değeri) ve sonradan bağlanan öğeyi
hareketi azaltan kullanıcıdaki gibi hedefte başlatır; `initial={false}` YAZMA
(`mistakes.md` #87). Eski projede aynı satırları Reveal'ine ekle.

## Doğrulama Kaydı

Next 16.4 + React 19.2 şablon kopyasında (2026-10-27): `build`, `tsc --noEmit`,
`eslint` temiz. Playwright: çerçeve masaüstü ve telefonda yüklendi, koyu tema
iframe'e geçti, "Uzun Okuma" seçimi başlığı 150 ms içinde Manrope'tan
Newsreader'a çevirdi (istek yok), veritabanı yokken rozet "Hatalı Alan Var"a
düştü. İkinci tur, şablonun kendisinde elle düzeltme olmadan: başlık
istisnası `/admin/onizleme`de `SAMEORIGIN`, `/`de `DENY`; font köprüsü ve
Reveal hazır geldi; hidrasyon hatası yok (önceki `useState(createDraftSession)`
#418 veriyordu, `useDraftSession` ile düzeldi).

## Kabul

- [ ] Yazmayı bırakınca ≤ 0,5 sn içinde önizleme güncel, kaydırma yerinde.
- [ ] Yazı tipi ve punto seçimi istek beklemeden değişiyor.
- [ ] Masaüstü ve telefon, açık ve koyu; seçim sayfa yenilenince hatırlanıyor.
- [ ] Rozet: Yayındaki Hâli → Güncelleniyor → Kaydedilmemiş → (Kaydet) Yayındaki Hâli; hatalı alanda Hatalı Alan Var.
- [ ] Önizlemede bölüme tıklamak paneldeki alanı açıyor; alana odaklanmak önizlemeyi kaydırıyor.
- [ ] Taslak canlı sitede görünmüyor (gizli pencerede kontrol); ikinci sekmedeki taslak birinciye karışmıyor.
- [ ] Önizleme rotası oturumsuz 401/yönlendirme, `noindex`.
- [ ] 1280 px altında önizleme formun altında, "Önizle" tam ekran açıyor, Esc kapatıyor.
