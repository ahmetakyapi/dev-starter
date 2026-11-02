# storybook — dev-starter Görsel Kataloğu

Ekosistemin bileşenleri, ekranları ve temaları tek yerde, canlı: `snippets/ui`
kütüphanesinin her bileşeni bütün durumlarıyla, landing şablonunun ekranları,
uygulama ekranı kompozisyonları ve token'ların (renk, punto, yüzey, grafik,
hareket) görsel belgesi.

```bash
cd storybook && npm ci     # ilk sefer
npm run dev                # http://localhost:6006  (kökten: npm run storybook)
npm run build              # storybook-static/      (kökten: npm run storybook:build)
npm run typecheck          # hikâyeler + snippet'ler + şablon, tek tip denetimi
```

## Üst Çubuk

- **Tema** (Açık / Koyu) → `<html data-theme>`, şablonun gerçek mekanizması.
- **Palet** (10 palet) → `<html data-palette>`; değerler şablonun
  `app/palettes.css`inden (tokens.ts'ten üretilir).
- **Accessibility** sekmesi her hikâyede axe denetimini gösterir.

## Nasıl Bağlanır (tek kaynak, kopya yok)

Storybook hiçbir bileşenin ya da token'ın kopyasını tutmaz:

- CSS: `.storybook/preview.css` şablonun `globals.css`, `palettes.css` ve
  `landing.css` dosyalarını içe aktarır; Tailwind `@source` ile depo kökündeki
  snippet ve şablon dosyalarını tarar.
- `@/` takma adı içe aktaran dosyanın yerine göre çözülür
  (`.storybook/resolve-at.ts`): snippet'ler birbirini `@/components/ui/<ad>`
  ile bulur (önce `snippets/ui`, yoksa landing şablonunun `components/ui`),
  şablon dosyaları kendi kökünü görür.
- `tsconfig.json` çıplak paket adlarını (`react`, `next`, `motion`…) bu
  klasörün `node_modules`una yönlendirir: depo kökündeki dosyalar da aynı
  tipleri görür.

Bir snippet ya da token değişince hikâye kendiliğinden günceldir; kırılırsa
CI'daki **Storybook Build** işi (tip denetimi + derleme) yakalar.

## Hikâye Yazarken

`stories/_lib/Frame.tsx` → `Frame`, `Gallery`, `Cell`, `Screen` çerçeveleri:
boardui vitrini gibi büyük gri kuyu, altında ad. Başlıklar Türkçe hiyerarşi
(`Bileşenler/Katmanlar/Diyalog`), hikâye adları Türkçe, veri gerçekçi Türkçe,
renk yalnızca token sınıfından. Etkileşimli bileşende `play` ile bir
etkileşimi sına (`storybook/test`).

Sürümler sabit (`storybook` 10.6.3): 10.6.2'nin Next taklidinde
`LayoutRouterContext.parentRenderTree` yoktu ve Next 16.4'ün `useRouter`ı
çöküyordu; 10.6.3 bunu düzeltti. Yükseltmeden önce derleyip bir hikâyeyi çiz.
