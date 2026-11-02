import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DocPage, Note, PageHero, Section, ThemeLabel, Token } from "./_lib/doc";
import { ThemeScope, useThemeVars, type ThemeName } from "./_lib/scope";

/* Yüzey hiyerarşisi, köşe ölçeği ve gölgeler. İki tema yan yana: değişkenler
   gerçek stil sayfasından okunup alt ağaca basılır (_lib/scope.tsx). */

function Marker({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-full bg-strong font-mono text-micro font-semibold text-page"
    >
      {n}
    </span>
  );
}

function Hierarchy({ theme }: { theme: ThemeName }) {
  return (
    <ThemeScope theme={theme} label={theme === "light" ? "Açık tema" : "Koyu tema"} className="relative rounded-2xl border border-line p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <ThemeLabel theme={theme} />
        <span className="flex items-center gap-1.5 text-micro text-muted">
          <Marker n={1} /> Sayfa
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-surface p-2">
        <div className="flex items-center gap-1.5 px-2 pt-1 pb-2 text-micro text-muted">
          <Marker n={2} /> Kuyu
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-overlay p-4 shadow-raised">
            <p className="flex items-center gap-1.5 text-micro text-muted">
              <Marker n={3} /> Karo
            </p>
            <p className="mt-3 text-small text-muted">Aktif Danışan</p>
            <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">128</p>
          </div>
          <div className="relative rounded-xl bg-overlay p-4 shadow-raised">
            <p className="text-small text-muted">Bu Hafta Seans</p>
            <p className="text-heading font-semibold tracking-tight text-strong tabular-nums">46</p>
            <div className="absolute top-10 -right-1 z-10 w-40 rounded-xl border border-line bg-overlay p-1 shadow-modal sm:right-2">
              <p className="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-micro text-muted">
                <Marker n={4} /> Katman
              </p>
              {[
                { icon: Pencil, label: "Düzenle" },
                { icon: Copy, label: "Çoğalt" },
                { icon: Trash2, label: "Sil" },
              ].map(({ icon: Icon, label }, i) => (
                <p
                  key={label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-small ${i === 0 ? "bg-surface-raised text-strong" : label === "Sil" ? "text-danger" : "text-body"}`}
                >
                  <Icon aria-hidden className="size-3.5" />
                  {label}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 h-14 rounded-xl bg-overlay shadow-raised" aria-hidden />
      </div>
    </ThemeScope>
  );
}

const LAYERS = [
  { n: 1, name: "Sayfa", cls: "bg-page", text: "Saf beyaz; koyuda #0c0c0d, saf siyah değil." },
  { n: 2, name: "Kuyu", cls: "bg-surface", text: "Kart ve grafik kabı. Kenarlık yok, ton farkı sınırı çizer." },
  { n: 3, name: "Karo", cls: "bg-overlay shadow-raised", text: "Kuyunun içindeki parça. Kıl kadar gölge." },
  { n: 4, name: "Katman", cls: "bg-overlay shadow-modal", text: "Gerçekten yüzen: menü, diyalog. Opak, kıl çizgili." },
];

const RADII = [
  { cls: "rounded-sm", box: "rounded-sm", use: "Seçim karosu, köşeli rozet" },
  { cls: "rounded-md", box: "rounded-md", use: "Düğme, giriş alanı" },
  { cls: "rounded-lg", box: "rounded-lg", use: "Lejant karosu, kod bloğu" },
  { cls: "rounded-xl", box: "rounded-xl", use: "Grafik kartı, menü, açılır" },
  { cls: "rounded-2xl", box: "rounded-2xl", use: "Vitrin kuyusu, büyük kart" },
  { cls: "rounded-full", box: "rounded-full", use: "Hap, avatar, anahtar" },
];

function RadiusTile({ cls, box, use }: (typeof RADII)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState("");
  useLayoutEffect(() => {
    if (!ref.current) return;
    const v = parseFloat(getComputedStyle(ref.current).borderTopLeftRadius);
    setPx(v > 500 ? "9999 px" : `${v} px`);
  }, []);
  return (
    <figure className="rounded-2xl bg-surface p-4">
      <div ref={ref} aria-hidden className={`aspect-square w-full border-2 border-line-strong bg-overlay shadow-raised ${box}`} />
      <figcaption className="mt-3">
        <Token>{cls}</Token>
        <span className="mt-1.5 block font-mono text-micro text-strong">{px}</span>
        <span className="mt-0.5 block text-micro text-muted">{use}</span>
      </figcaption>
    </figure>
  );
}

const SHADOWS = [
  { cls: "shadow-raised", v: "--shadow-sm", tile: "rounded-xl bg-overlay shadow-raised", use: "Karo, lejant" },
  { cls: "shadow-floating", v: "--shadow-md", tile: "rounded-xl bg-overlay shadow-floating", use: "Sürüklenen, öne çıkan" },
  { cls: "shadow-modal", v: "--shadow-overlay", tile: "rounded-xl bg-overlay shadow-modal", use: "Menü, diyalog" },
  { cls: "shadow-cta", v: "--shadow-button", tile: "rounded-md bg-cta shadow-cta", use: "Dolgulu düğme" },
];

function Shadows({ theme }: { theme: ThemeName }) {
  const vars = useThemeVars(theme);
  return (
    <ThemeScope theme={theme} label={theme === "light" ? "Açık tema" : "Koyu tema"} className="rounded-2xl border border-line p-5 sm:p-6">
      <ThemeLabel theme={theme} />
      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-7">
        {SHADOWS.map((s) => (
          <figure key={s.cls}>
            <div aria-hidden className={`h-20 ${s.tile}`} />
            <figcaption className="mt-3">
              <Token>{s.cls}</Token>
              <span className="mt-1 block text-micro text-muted">{s.use}</span>
              <span className="mt-1 block font-mono text-micro break-all text-muted">{vars[s.v]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </ThemeScope>
  );
}

/** Karonun üst kenarı ×8: koyuda ışık çizgisi, açıkta yok. */
function EdgeZoom({ theme }: { theme: ThemeName }) {
  return (
    <ThemeScope theme={theme} className="overflow-hidden rounded-2xl border border-line">
      <div className="relative h-44 overflow-hidden bg-surface" aria-hidden>
        <div className="absolute top-1/2 left-[8%] h-10 w-24 origin-top-left scale-[8] rounded-[3px] bg-overlay shadow-raised" />
        <span className="absolute top-3 left-4 font-mono text-micro text-muted">Kuyu</span>
        <span className="absolute bottom-3 left-4 font-mono text-micro text-muted">Karo, Üst Kenar</span>
      </div>
      <p className="border-t border-line px-4 py-3 text-small text-body">
        <span className="font-medium text-strong">{theme === "light" ? "Açık" : "Koyu"}, ×8 büyütme. </span>
        {theme === "light"
          ? "Üst kenar düz: derinliği karonun altındaki yumuşak gölge taşır."
          : "Gölge koyu zeminde görünmez; derinliği üst kenardaki 1 piksellik ışık taşır (inset, beyaz %5)."}
      </p>
    </ThemeScope>
  );
}

function YuzeylerSayfasi() {
  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Yüzeyler"
        title="Sayfa, Kuyu, Karo, Katman"
        lead="Board dilinin iskeleti dört basamak. Derinlik ton farkıyla kurulur; gölge yalnızca gerçekten sayfanın üstünde yüzen katmanda belirgin. Koyuda yüzeyler yükseldikçe açılır."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Hierarchy theme="light" />
        <Hierarchy theme="dark" />
      </div>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map((l) => (
          <li key={l.n} className="flex gap-3">
            <Marker n={l.n} />
            <div>
              <p className="text-base font-semibold text-strong">{l.name}</p>
              <p className="mt-1">
                <Token>{l.cls}</Token>
              </p>
              <p className="mt-2 text-small text-muted">{l.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Section id="kose" title="Köşe Ölçeği" description="Beş basamak ve hap. İç içe yüzeyde iç köşe dış köşeden küçük: kuyu rounded-xl ise karo rounded-lg.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RADII.map((r) => (
            <RadiusTile key={r.cls} {...r} />
          ))}
        </div>
      </Section>

      <Section
        id="golge"
        title="Gölgeler"
        description="Kısa ve katmanlı. Değerler temaya göre değişir; sınıf adı aynı kalır. Koyuda her gölgenin başında bir üst kenar ışığı var."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Shadows theme="light" />
          <Shadows theme="dark" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <EdgeZoom theme="light" />
          <EdgeZoom theme="dark" />
        </div>
      </Section>

      <Section
        id="kart-icinde-kart"
        title="Kart İçinde Kart Yok"
        description="Bir kuyu, içinde karolar. Üçüncü bir çerçeve hiyerarşiyi gürültüye çevirir: hangi kutunun neyi kapsadığı okunmaz."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <figure>
            <div className="rounded-2xl bg-surface p-2">
              <p className="px-3 pt-2 pb-3 text-small font-medium text-muted">Bekleyen Ödemeler</p>
              <div className="rounded-xl bg-overlay shadow-raised">
                {[
                  { who: "Derya Aksoy", amount: "₺2.400" },
                  { who: "Kerem Yıldız", amount: "₺1.150" },
                  { who: "Selin Başaran", amount: "₺860" },
                ].map((r, i) => (
                  <div key={r.who} className={`flex items-center justify-between px-4 py-3 text-base ${i ? "border-t border-line-soft" : ""}`}>
                    <span className="text-strong">{r.who}</span>
                    <span className="font-semibold text-strong tabular-nums">{r.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="mt-3 flex items-center gap-2 text-small text-body">
              <Badge tone="success" shape="rounded">
                <Check aria-hidden className="size-3" /> Doğru
              </Badge>
              Tek kuyu, tek karo, satırlar ayırıcıyla.
            </figcaption>
          </figure>
          <figure>
            <div className="rounded-2xl border border-line-strong p-3">
              <p className="px-1 pb-3 text-small font-medium text-muted">Bekleyen Ödemeler</p>
              <div className="space-y-2 rounded-xl border border-line-strong p-2">
                {[
                  { who: "Derya Aksoy", amount: "₺2.400" },
                  { who: "Kerem Yıldız", amount: "₺1.150" },
                  { who: "Selin Başaran", amount: "₺860" },
                ].map((r) => (
                  <div key={r.who} className="flex items-center justify-between rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base shadow-floating">
                    <span className="text-strong">{r.who}</span>
                    <span className="font-semibold text-strong tabular-nums">{r.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="mt-3 flex items-center gap-2 text-small text-body">
              <Badge tone="danger" shape="rounded">
                <X aria-hidden className="size-3" /> Yanlış
              </Badge>
              Çerçeve içinde çerçeve içinde çerçeve.
            </figcaption>
          </figure>
        </div>
        <Note className="mt-4">
          Kural: <Token>rules/design-tokens.md → AI-Slop Yasakları</Token>. Gruplama gerekiyorsa ayırıcı ya da başlık; yeni çerçeve değil.
        </Note>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Yüzeyler",
  id: "surfaces",
  component: YuzeylerSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sayfa → kuyu → karo → katman hiyerarşisi iki temada, köşe ölçeği, gölgeler (koyuda üst kenar ışığı) ve kart içinde kart yasağının doğru/yanlış örneği.",
      },
    },
  },
} satisfies Meta<typeof YuzeylerSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Yüzeyler" };
