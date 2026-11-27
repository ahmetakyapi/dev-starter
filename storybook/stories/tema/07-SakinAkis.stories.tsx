import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { expect, within } from "storybook/test";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusIcon, STATUSES, STATUS_LABEL } from "@/components/ui/status-icon";
import { DocPage, Note, PageHero, Section, Token, storyHref } from "./_lib/doc";

/**
 * Sakin Akış Ritmi: yönün (knowledge/design-directions.md → sakin-akis) ölçülen
 * değerleri tek sayfada ve CANLI. Punto ölçeği, yarıçap merdiveni, halka ve gölge,
 * hareket tablosu ve ürün ekranı dili; her örnek gerçek token sınıflarıyla çizilir,
 * palet ve temayla döner. Değerler decisions.md → "Sakin Akış Turu"ndaki ölçümle aynı.
 */

const TYPE: { px: number; role: string; sample: string; weight: 400 | 500 }[] = [
  { px: 12, role: "Künye, sayaç, ikinci satır", sample: "Hedef 4 sa · 2 dk önce", weight: 400 },
  { px: 13, role: "Ürün içi gövde, satır", sample: "Bordro ve Vergi Kaydını Tamamla", weight: 400 },
  { px: 14, role: "Kart başlığı, ad", sample: "Yan Haklara Kayıt", weight: 500 },
  { px: 15, role: "Okuma gövdesi", sample: "Kurulum bir öğleden sonra sürer.", weight: 400 },
  { px: 17, role: "Sayfa adı (kişi, ürün)", sample: "Deniz Aydın", weight: 500 },
  { px: 20, role: "Sayı (KPI)", sample: "3,4 sa", weight: 400 },
  { px: 28, role: "Büyük sayı", sample: "₺1,09 Mn", weight: 400 },
];

const RADII: { px: number; role: string }[] = [
  { px: 6, role: "Çip" },
  { px: 8, role: "Öğe" },
  { px: 10, role: "Kontrol" },
  { px: 12, role: "Menü" },
  { px: 14, role: "Kart" },
  { px: 16, role: "Panel" },
  { px: 20, role: "Sahne" },
  { px: 28, role: "Akış Karesi" },
];

const MOTION: { cls: string; ms: string; ease: string; use: string; demo: "fade" | "press" | "enter" | "slide" | "pop" }[] = [
  { cls: "Renk ve Zemin", ms: "150 ms", ease: "ease", use: "Hover yıkama, halka", demo: "fade" },
  { cls: "Basma", ms: "150 ms", ease: "(.2, 0, 0, 1)", use: "scale .97-.98", demo: "press" },
  { cls: "İçerik Girişi", ms: "480 ms + 80", ease: "--ease-brand", use: "Sekme paneli: y 6, blur 2", demo: "enter" },
  { cls: "Kayan Gösterge", ms: "560 ms", ease: "--ease-brand", use: "Sekme hapı, seçim karosu", demo: "slide" },
  { cls: "Vurgu Pop", ms: "240-260 ms", ease: "(.2, 0, 0, 1)", use: "Beğeni .82 → 1.18 → 1.04", demo: "pop" },
];

const CSS = `
@keyframes sr-enter { from { opacity: 0; translate: 0 6px; filter: blur(2px); } }
@keyframes sr-pop { 0% { scale: .82; } 58% { scale: 1.18; } 100% { scale: 1.04; } }
@keyframes sr-fade { from { background-color: var(--surface); } }
.sr-enter { animation: sr-enter 480ms var(--ease-brand) 80ms both; }
.sr-pop { animation: sr-pop 260ms cubic-bezier(.2,0,0,1) both; }
.sr-fade { animation: sr-fade 600ms ease both; }
.sr-press:active { scale: .97; }
@media (prefers-reduced-motion: reduce) { .sr-enter, .sr-pop, .sr-fade { animation: none; } }
`;

function MotionDemo({ kind, run }: { kind: (typeof MOTION)[number]["demo"]; run: number }) {
  const [tab, setTab] = useState<"gun" | "hafta">("gun");
  if (kind === "slide")
    return (
      <SegmentedControl
        aria-label="Kayan gösterge örneği"
        size="sm"
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "gun", label: "Gün" },
          { value: "hafta", label: "Hafta" },
        ]}
      />
    );
  if (kind === "press")
    return (
      <button type="button" className="sr-press rounded-full bg-strong px-3 py-1.5 text-small text-page transition-[scale] duration-150">
        Bas Tut
      </button>
    );
  const cls = kind === "enter" ? "sr-enter" : kind === "pop" ? "sr-pop" : "sr-fade";
  return (
    <span key={run} className={`${cls} inline-flex rounded-lg bg-overlay px-3 py-1.5 text-small text-strong ring-1 ring-line-soft`}>
      {kind === "pop" ? "♥ 221" : kind === "enter" ? "Yeni Panel" : "Satır"}
    </span>
  );
}

function RitimSayfasi() {
  const [run, setRun] = useState(0);
  return (
    <DocPage>
      <style href="tema-sakin-ritim" precedence="default">
        {CSS}
      </style>
      <PageHero
        eyebrow="Tema · Sakin Akış"
        title={
          <>
            Hiyerarşi Tonla <span className="text-muted">Boyla Değil</span>
          </>
        }
        lead="Sakin Akış yönünün ölçülen ritmi: tek grotesk, 400 ve 500 ağırlık, yalnız sayılar büyür; gri kuyu ve beyaz karo; renk yalnız bilgi taşır; hareket her zaman bir işe yarar."
      >
        <p className="mt-4 text-small text-muted">
          Yönün tam tarifi <Token>knowledge/design-directions.md → sakin-akis</Token>; canlı örnek{" "}
          <a href={storyHref("demo-app--portfolio")} target="_top" className="text-strong underline decoration-line-strong underline-offset-4 hover:decoration-strong">
            Portfolyo
          </a>
          .
        </p>
      </PageHero>

      <Section id="punto" title="Punto Ölçeği" description="Ürün içinde metin 12-15 px; başlık gövdeyle aynı boyda, ayrım ağırlık ve tonla. Harf aralığı −0.02em.">
        <ul className="grid gap-px overflow-hidden rounded-2xl bg-line-soft ring-1 ring-line-soft">
          {TYPE.map((t) => (
            <li key={t.px} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-4 bg-overlay px-4 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_14rem]">
              <span className="font-mono text-small text-muted tabular-nums">{t.px} px</span>
              <span className="truncate text-strong" style={{ fontSize: t.px, fontWeight: t.weight, letterSpacing: "-0.02em" } as CSSProperties}>
                {t.sample}
              </span>
              <span className="text-small text-muted max-sm:col-start-2">{t.role}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="yaricap" title="Yarıçap Merdiveni" description="İçteki yarıçap = dıştaki − boşluk. Kuyu içindeki karo her zaman bir basamak küçük.">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {RADII.map((r) => (
            <figure key={r.px} className="grid justify-items-center gap-2">
              <span aria-hidden className="block size-16 bg-surface ring-1 ring-line-soft" style={{ borderRadius: r.px }} />
              <figcaption className="text-center text-small leading-tight">
                <span className="block text-strong tabular-nums">{r.px}</span>
                <span className="text-muted">{r.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="katman" title="Gri Kuyu ve Beyaz Karo" description="Derinlik gölgeyle değil ton ve kıl halkayla. Yüzen yüzey (menü, çubuk) tek yumuşak gölge taşır.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 rounded-[20px] bg-surface p-2.5 ring-1 ring-line-soft">
            <span className="px-1.5 text-small text-muted">Kuyu · 20 px</span>
            <div className="grid gap-1 rounded-[14px] bg-overlay p-3 ring-1 ring-line-soft">
              <span className="text-[14px] font-medium text-strong">Karo · 14 px</span>
              <span className="text-[13px] text-muted">Kıl halka, gölge yok.</span>
            </div>
          </div>
          <div className="grid place-items-center rounded-[20px] bg-surface p-6 ring-1 ring-line-soft">
            <span className="rounded-full bg-overlay px-4 py-2 text-small text-strong shadow-floating ring-1 ring-line">Yüzen Çubuk · Tek Gölge</span>
          </div>
        </div>
      </Section>

      <Section id="durum" title="Durum Şekille" description="İş durumu ikonun şekliyle; renk ikinci işaret. Kayıt kimliği 2 px renkli çizgi, asla durum.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ul className="grid gap-2 rounded-2xl bg-overlay p-4 ring-1 ring-line-soft">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-2 text-[13px] text-strong">
                <StatusIcon status={s} /> {STATUS_LABEL[s]}
              </li>
            ))}
          </ul>
          <ul className="grid content-start gap-2 rounded-2xl bg-overlay p-4 ring-1 ring-line-soft">
            {[
              ["bg-chart-1", "Kısa Yanıt", "5 dk"],
              ["bg-chart-2", "İade Süreci", "15 dk"],
              ["bg-chart-4", "Kargo Gecikmesi", "30 dk"],
            ].map(([bar, name, dur]) => (
              <li key={name} className="flex items-center gap-2 text-[13px]">
                <span aria-hidden className={`h-3.5 w-0.5 rounded-full ${bar}`} />
                <span className="flex-1 text-strong">{name}</span>
                <span className="text-muted tabular-nums">{dur}</span>
              </li>
            ))}
            <li className="pt-1 text-[12px] text-muted">
              Gecikme yalnız metin rengiyle: <span className="text-danger">5 Gün Gecikti</span>
            </li>
          </ul>
        </div>
      </Section>

      <Section
        id="hareket"
        title="Hareket Tablosu"
        description="Her hareket bir işe yarar; eğri --ease-brand. Hareketi azaltan kullanıcıda gösterge zıplar, içerik yalnız solar, döngü durur."
        aside={
          <Button variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>
            <RotateCcw /> Tekrar Oynat
          </Button>
        }
      >
        <div className="overflow-x-auto rounded-2xl ring-1 ring-line-soft">
          <table className="w-full min-w-[40rem] text-left text-[13px]">
            <caption className="sr-only">Sakin Akış hareket tablosu</caption>
            <thead className="bg-surface text-small text-muted">
              <tr>
                {["Sınıf", "Süre", "Eğri", "Ne İçin", "Örnek"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-overlay">
              {MOTION.map((m) => (
                <tr key={m.cls} className="border-t border-line-soft">
                  <th scope="row" className="px-4 py-3 font-medium text-strong">
                    {m.cls}
                  </th>
                  <td className="px-4 py-3 text-body tabular-nums">{m.ms}</td>
                  <td className="px-4 py-3 font-mono text-small text-muted">{m.ease}</td>
                  <td className="px-4 py-3 text-body">{m.use}</td>
                  <td className="px-4 py-3">
                    <MotionDemo kind={m.demo} run={run} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note className="mt-4">Kaydırmaya bağlı netleşme (`scroll-focus`): opaklık .34 → 1, buğu 8 → 0 px, kayma 18 → 0, ölçek 1.012 → 1.</Note>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Sakin Akış Ritmi",
  id: "calm-rhythm",
  component: RitimSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sakin Akış yönünün ölçülen ritmi canlı: punto ölçeği (12-17 + sayılar 20/28), yarıçap merdiveni (6-28), gri kuyu ve beyaz karo, şekille durum, hareket tablosu. Bütün örnekler token sınıflarıyla, palet ve temayla döner.",
      },
    },
  },
} satisfies Meta<typeof RitimSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Sakin Akış Ritmi",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Hiyerarşi Tonla Boyla Değil");
    await expect(canvas.getByRole("table", { name: "Sakin Akış hareket tablosu" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("listitem").length).toBeGreaterThan(10);
  },
};
