import type { ReactNode } from "react";
import { AreaChart } from "@/components/ui/area-chart";
import { BarList } from "@/components/ui/bar-list";
import { ChartCard, ChartLegend } from "@/components/ui/chart-card";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Heatmap } from "@/components/ui/heatmap";
import { RadarChart } from "@/components/ui/radar-chart";
import { SankeyChart } from "@/components/ui/sankey-chart";

/* Vitrin: "board" dili grafik bileşenleri. Her grafik ChartCard içinde,
   altında adı ve tek cümlelik ne zaman notu. Veriler örnek ama gerçekçi. */

const MONTHS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
const THIS_YEAR = [
  2840, 3120, 3560, 3410, 3980, 4420, 4180, 4650, 5120, 5480, 5890, 6270,
];
const LAST_YEAR = [
  2210, 2380, 2590, 2720, 2650, 3010, 3240, 3180, 3460, 3720, 3900, 4110,
];

/* Son 26 hafta, 31 Ekim 2026'da biten günlük katkı. Tohumlu sözde rastgele:
   sunucu her derlemede aynı ızgarayı basar. */
function contributions() {
  const out: { date: string; value: number }[] = [];
  const end = Date.UTC(2026, 9, 31);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 26 * 7; i++) {
    const t = end - i * 86_400_000;
    const day = new Date(t).getUTCDay();
    const weekend = day === 0 || day === 6;
    const busy = 1 + Math.sin(i / 11) * 0.5;
    const r = rand();
    const value =
      r < (weekend ? 0.55 : 0.12)
        ? 0
        : Math.round(r * (weekend ? 4 : 11) * busy);
    out.push({ date: new Date(t).toISOString().slice(0, 10), value });
  }
  return out.reverse();
}

function Showcase({
  name,
  note,
  wide,
  children,
}: {
  name: string;
  note: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "flex h-full min-w-0 flex-col lg:col-span-2" : "flex h-full min-w-0 flex-col"}>
      {/* ChartCard hücreyi doldurur: yan yana kartlar eşit boy, lejantları dipte hizalı. */}
      <div className="flex flex-1 flex-col *:flex-1">{children}</div>
      <div className="mt-3 px-2">
        {/* Başlık değil: kartın kendi h3'ü önce gelir, h2 sırayı bozar (axe heading-order). */}
        <p className="text-base font-semibold text-strong">{name}</p>
        <p className="mt-0.5 text-small text-muted">{note}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const days = contributions();
  const sum = (values: readonly number[]) => values.reduce((a, v) => a + v, 0);
  const thisYear = sum(THIS_YEAR);
  const lastYear = sum(LAST_YEAR);
  const totalContrib = days.reduce((a, d) => a + d.value, 0);

  return (
    <main id="icerik" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-2xl px-2">
        <h1 className="text-heading font-semibold tracking-tight text-strong">
          Grafikler
        </h1>
        <p className="mt-2 text-read text-body">
          Ekrana girince çizilerek gelen, bağımlılıksız SVG grafikler. Seri
          renkleri token&apos;dan, sayılar tr-TR, her birinin verisi ekran
          okuyucuya tablo olarak da açık.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2">
        <Showcase
          name="Alan Grafiği"
          note="İki dönemi üst üste koymak için; fareyle, parmakla ya da oklarla gezilir."
          wide
        >
          <ChartCard titleAs="h2"
            id="ziyaret"
            label="Aylık Ziyaretçi"
            value={thisYear.toLocaleString("tr-TR")}
            change={Math.round(((thisYear - lastYear) / lastYear) * 1000) / 10}
            changeLabel="geçen yıla göre"
            action={
              <span className="rounded-full bg-overlay px-2.5 py-1 text-small font-medium text-body shadow-raised">
                2026
              </span>
            }
            footer={
              <ChartLegend
                className="px-1 pb-1"
                items={[
                  {
                    label: "Bu Yıl",
                    value: thisYear,
                    series: 1,
                    unit: "ziyaret",
                  },
                  {
                    label: "Geçen Yıl",
                    value: lastYear,
                    series: 2,
                    unit: "ziyaret",
                  },
                ]}
              />
            }
          >
            <AreaChart
              title="Aylık Ziyaretçi"
              labels={MONTHS}
              unit="ziyaret"
              series={[
                { label: "Bu Yıl", values: THIS_YEAR, series: 1 },
                { label: "Geçen Yıl", values: LAST_YEAR, series: 2 },
              ]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Yarım Daire Grafiği"
          note="Bir bütünün 2-4 parçası; parçalar arası boşluk yuvarlak uçların içinden hesaplanır."
        >
          <ChartCard titleAs="h2"
            id="cihaz"
            label="Cihaza Göre Ziyaret"
            value="9.000"
            change={4.1}
            footer={
              <ChartLegend
                columns={3}
                className="px-1 pb-1"
                items={[
                  { label: "Masaüstü", value: 4230, series: 2 },
                  { label: "Mobil", value: 3420, series: 3 },
                  { label: "Tablet", value: 1350, series: 1 },
                ]}
              />
            }
          >
            <GaugeChart
              title="Cihaza Göre Ziyaret"
              parts={[
                { label: "Masaüstü", value: 4230, series: 2 },
                { label: "Mobil", value: 3420, series: 3 },
                { label: "Tablet", value: 1350, series: 1 },
              ]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Huni Grafiği"
          note="Kaybın nerede olduğunu gösterir; her aşamanın ilk aşamaya göre payı hapta."
        >
          <ChartCard titleAs="h2"
            id="huni"
            label="Ödeme Hunisi"
            value="%15,6"
            change={-1.2}
            changeLabel="geçen aya göre"
          >
            <FunnelChart
              title="Ödeme Hunisi"
              stages={[
                { label: "Ürün Görüntüleme", value: 12400 },
                { label: "Sepete Ekleme", value: 5210 },
                { label: "Ödeme Başlatma", value: 2860 },
                { label: "Sipariş", value: 1940 },
              ]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Isı Haritası"
          note="Günlük bir sayının ritmi; telefonda geçmiş yatay kaydırılır, açılışta en yeni hafta görünür."
        >
          <ChartCard titleAs="h2"
            id="katki"
            label="Son 26 Hafta Katkı"
            value={totalContrib.toLocaleString("tr-TR")}
            change={9.6}
          >
            <Heatmap
              title="Son 26 Hafta Katkı"
              data={days}
              levels={[2, 5, 8]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Çubuk Listesi"
          note="Uzun adlı 3-10 kalemlik sıralama; dolgu metnin arkasında, ad kısalmaz."
        >
          <ChartCard titleAs="h2"
            id="sayfa"
            label="En Çok Ziyaret Edilen Sayfalar"
            value="18.640"
            change={7.3}
          >
            <BarList
              title="En Çok Ziyaret Edilen Sayfalar"
              columns={["Sayfa", "Ziyaret"]}
              items={[
                { label: "/fiyatlandirma", value: 4120 },
                { label: "/", value: 6380 },
                { label: "/blog/next-16-gecis-rehberi", value: 2940 },
                { label: "/dokumanlar/kurulum", value: 2310 },
                { label: "/iletisim", value: 1180 },
                { label: "/hakkimizda", value: 1710 },
              ]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Radar Grafiği"
          note="5-8 ölçütte bir ya da iki profil; şekil okunur, değerler tabloda."
        >
          <ChartCard titleAs="h2"
            id="radar"
            label="Sürüm Kalite Profili"
            value="88"
            change={6.0}
            changeLabel="önceki sürüme göre"
            footer={
              <ChartLegend
                className="px-1 pb-1"
                items={[
                  { label: "Sürüm 3.2", value: 88, series: 2, unit: "ort." },
                  { label: "Sürüm 3.1", value: 83, series: 4, unit: "ort." },
                ]}
              />
            }
          >
            <RadarChart
              title="Sürüm Kalite Profili"
              unit="puan"
              axes={[
                "Hız",
                "Erişilebilirlik",
                "SEO",
                "Güvenlik",
                "Kararlılık",
                "Kullanım",
              ]}
              series={[
                {
                  label: "Sürüm 3.2",
                  values: [92, 96, 88, 81, 90, 82],
                  series: 2,
                },
                {
                  label: "Sürüm 3.1",
                  values: [78, 90, 85, 84, 72, 89],
                  series: 4,
                },
              ]}
            />
          </ChartCard>
        </Showcase>

        <Showcase
          name="Akış Grafiği"
          note="Kaynaktan sonuca akış; bir düğüm ya da bant üstünde tutulunca yalnızca ona bağlı akış kalır."
        >
          <ChartCard titleAs="h2"
            id="akis"
            label="Kaynağa Göre Dönüşüm"
            value="9.000"
            change={3.8}
          >
            <SankeyChart
              title="Kaynağa Göre Dönüşüm"
              unit="ziyaretçi"
              sources={[
                { id: "arama", label: "Arama", series: 2 },
                { id: "sosyal", label: "Sosyal", series: 3 },
                { id: "dogrudan", label: "Doğrudan", series: 1 },
                { id: "eposta", label: "E-Posta", series: 4 },
              ]}
              targets={[
                { id: "kayit", label: "Kayıt" },
                { id: "deneme", label: "Deneme" },
                { id: "ayrildi", label: "Ayrıldı" },
              ]}
              links={[
                { source: "arama", target: "kayit", value: 1240 },
                { source: "arama", target: "deneme", value: 620 },
                { source: "arama", target: "ayrildi", value: 1540 },
                { source: "sosyal", target: "kayit", value: 380 },
                { source: "sosyal", target: "deneme", value: 290 },
                { source: "sosyal", target: "ayrildi", value: 1630 },
                { source: "dogrudan", target: "kayit", value: 520 },
                { source: "dogrudan", target: "deneme", value: 410 },
                { source: "dogrudan", target: "ayrildi", value: 870 },
                { source: "eposta", target: "kayit", value: 310 },
                { source: "eposta", target: "deneme", value: 680 },
                { source: "eposta", target: "ayrildi", value: 510 },
              ]}
            />
          </ChartCard>
        </Showcase>
      </div>
    </main>
  );
}
