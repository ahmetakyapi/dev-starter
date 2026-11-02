import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLayoutEffect, useRef, useState } from "react";
import { TEXT_SIZES } from "@/lib/utils";
import fontsSource from "../../../snippets/fonts/fonts.ts?raw";
import { DocPage, Note, PageHero, Section, Token } from "./_lib/doc";

/* Punto ölçeği globals.css `@theme` bloğunda; burada boyut ve satır yüksekliği
   ÖLÇÜLÜR (getComputedStyle), elle yazılmaz. Presetler snippets/fonts/fonts.ts
   metninden ayrıştırılır. */

const SCALE: Record<(typeof TEXT_SIZES)[number], { cls: string; use: string; sample: string }> = {
  micro: { cls: "text-micro", use: "Eksen etiketi, künye", sample: "Son güncelleme 14.32" },
  small: { cls: "text-small", use: "Yardım, rozet, etiket", sample: "Geçen haftaya göre +%5,2" },
  base: { cls: "text-base", use: "Arayüz metni, düğme", sample: "Raporu indir ve ekiple paylaş" },
  read: { cls: "text-read", use: "Uzun okuma, paragraf", sample: "Işık sabah yedide salona düşer, gölge öğlene doğru kısalır." },
  lead: { cls: "text-lead", use: "Giriş paragrafı", sample: "Seans notların tek yerde, haftalık özet hazır." },
  title: { cls: "text-title", use: "Kart ve diyalog başlığı", sample: "Aylık Ziyaretçi" },
  heading: { cls: "text-heading", use: "Bölüm başlığı, büyük değer", sample: "Ödeme Hunisi" },
  display: { cls: "text-display", use: "Sayfa başlığı", sample: "Gün sonu raporu" },
  hero: { cls: "text-hero", use: "Üst bölüm başlığı, ekranda bir kez", sample: "Sakin yüzey." },
};

function ScaleRow({ name }: { name: (typeof TEXT_SIZES)[number] }) {
  const item = SCALE[name];
  const ref = useRef<HTMLParagraphElement>(null);
  const [m, setM] = useState({ size: "", line: "" });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = getComputedStyle(el);
    setM({ size: `${parseFloat(s.fontSize).toFixed(0)} px`, line: `${parseFloat(s.lineHeight).toFixed(0)} px` });
  }, []);
  const big = name === "display" || name === "hero";
  return (
    <li className="grid gap-3 border-b border-line-soft py-6 last:border-0 md:grid-cols-[13rem_1fr] md:gap-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:flex-col md:gap-1.5">
        <Token>{item.cls}</Token>
        <span className="font-mono text-small text-strong tabular-nums">
          {m.size} / {m.line}
        </span>
        <span className="text-small text-muted">{item.use}</span>
      </div>
      <p
        ref={ref}
        className={`${item.cls} min-w-0 text-strong ${big ? "font-semibold tracking-[-0.035em]" : name === "title" || name === "heading" ? "font-semibold tracking-[-0.02em]" : ""}`}
      >
        {item.sample}
      </p>
    </li>
  );
}

/* --- fonts.ts ayrıştırma -------------------------------------------------- */

type PresetRow = { name: string; sans: string; display?: string; mono: string; note: string };

function parsePresets(src: string): PresetRow[] {
  const family = new Map<string, string>();
  for (const m of src.matchAll(/const (\w+) = (\w+)\(/g)) family.set(m[1], m[2].replace(/_/g, " "));
  const block = src.slice(src.indexOf("export const FONT_PRESETS"));
  const rows: PresetRow[] = [];
  const re = /(\w+): \{\s*sans: (\w+),\s*(?:display: (\w+),\s*)?mono: (\w+),\s*note: "([^"]+)"/g;
  for (const m of block.matchAll(re)) {
    rows.push({
      name: m[1],
      sans: family.get(m[2]) ?? m[2],
      display: m[3] ? (family.get(m[3]) ?? m[3]) : undefined,
      mono: family.get(m[4]) ?? m[4],
      note: m[5],
    });
  }
  return rows;
}

const PRESETS = parsePresets(fontsSource);
const LOADED = new Set(["Inter", "JetBrains Mono"]);

function FamilyCell({ name, mono }: { name?: string; mono?: boolean }) {
  if (!name) return <span className="text-muted">gövdeyle aynı</span>;
  const live = LOADED.has(name);
  return (
    <span className={live ? `${mono ? "font-mono" : "font-sans"} font-medium text-strong` : "text-strong"}>
      {name}
      {live ? <span className="ml-1.5 text-micro font-normal text-primary-ink">çizili</span> : null}
    </span>
  );
}

const GLYPHS = "Ğğ Şş İı Öö Çç Üü: Işık, Gölge, Ağaç ₺1.240";

function TipografiSayfasi() {
  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Tipografi"
        title="Kontrastı punto kurar, ağırlık değil."
        lead="Punto adları rol taşır, piksel değil: text-small, text-heading. Tek aile, dört ağırlık, sıkı başlık aralığı. Board dilinin preseti Inter + JetBrains Mono."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-surface p-6 sm:p-10">
          <p className="text-small font-medium text-muted">Inter · sans · arayüz ve gövde</p>
          <p className="mt-4 font-sans text-[clamp(5rem,14vw,10rem)] leading-[0.9] font-semibold tracking-[-0.05em] text-strong" aria-hidden>
            Ağ
          </p>
          <p className="mt-6 text-lead text-strong">{GLYPHS}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-read text-strong">
            <span className="font-normal">Normal 400</span>
            <span className="font-medium">Orta 500</span>
            <span className="font-semibold">Yarı Kalın 600</span>
            <span className="font-bold">Kalın 700</span>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl bg-surface p-6 sm:p-10">
          <p className="text-small font-medium text-muted">JetBrains Mono · mono · kod, künye</p>
          <p className="mt-4 font-mono text-[clamp(3.5rem,9vw,6rem)] leading-none text-strong" aria-hidden>
            {"{ }"}
          </p>
          <p className="mt-6 font-mono text-base break-words text-strong">{GLYPHS}</p>
          <Note className="mt-auto pt-6">
            JetBrains Mono'da ₺ yok: işaret sistem fontuna düşer. Tutarı sans ile yaz.
          </Note>
        </div>
      </div>

      <Section
        id="olcek"
        title="Punto Ölçeği"
        description={
          <>
            micro'dan hero'ya dokuz basamak, gerçek boyutta. Değerler bu sayfada ölçülür; ölçeğe basamak eklersen{" "}
            <Token>lib/utils.ts → TEXT_SIZES</Token>e de ekle, yoksa twMerge onu renk sanar.
          </>
        }
      >
        <ol className="rounded-2xl bg-surface px-5 sm:px-8">
          {TEXT_SIZES.map((name) => (
            <ScaleRow key={name} name={name} />
          ))}
        </ol>
      </Section>

      <Section
        id="rakam"
        title="Rakamlar"
        description="Değişen değer tabular-nums ile yazılır: rakamlar eşit genişlikte, sütun hizalı kalır, sayaç dönerken satır zıplamaz."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Orantılı", cls: "" },
            { label: "tabular-nums", cls: "tabular-nums" },
          ].map((v) => (
            <div key={v.label} className="rounded-2xl bg-surface p-5">
              <p className="text-small font-medium text-muted">{v.label}</p>
              <ul className={`mt-3 rounded-xl bg-overlay p-4 text-right text-title font-semibold text-strong shadow-raised ${v.cls}`}>
                <li>₺1.111,11</li>
                <li>₺9.999,99</li>
                <li>₺4.480,50</li>
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="presetler"
        title="Font Presetleri"
        description={
          <>
            <Token>snippets/fonts/fonts.ts</Token> içindeki {PRESETS.length} preset. Storybook yalnız Inter ve JetBrains Mono'yu yükler;
            onlar gerçek çizimle, diğerleri ad ve karakter notuyla.
          </>
        }
      >
        <div className="overflow-x-auto rounded-2xl bg-surface p-2" tabIndex={0} role="region" aria-label="Font presetleri tablosu">
          <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-base">
            <thead>
              <tr className="text-small text-muted">
                <th scope="col" className="px-4 py-3 font-medium">Preset</th>
                <th scope="col" className="px-4 py-3 font-medium">Gövde</th>
                <th scope="col" className="px-4 py-3 font-medium">Başlık</th>
                <th scope="col" className="px-4 py-3 font-medium">Mono</th>
                <th scope="col" className="px-4 py-3 font-medium">Nerede</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((p) => (
                <tr key={p.name} className={p.name === "board" ? "[&>*]:bg-overlay [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg" : ""}>
                  <th scope="row" className="border-t border-line-soft px-4 py-3 align-top font-mono text-small font-medium text-strong">
                    {p.name}
                  </th>
                  <td className="border-t border-line-soft px-4 py-3 align-top">
                    <FamilyCell name={p.sans} />
                  </td>
                  <td className="border-t border-line-soft px-4 py-3 align-top">
                    <FamilyCell name={p.display} />
                  </td>
                  <td className="border-t border-line-soft px-4 py-3 align-top">
                    <FamilyCell name={p.mono} mono />
                  </td>
                  <td className="border-t border-line-soft px-4 py-3 align-top text-small text-body">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note className="mt-3">
          Hepsi <Token>latin-ext</Token> ile yüklenir: ğ, ş, İ, ı o alt kümede. ₺ yok: Geist, Geist Mono, Instrument Sans/Serif, JetBrains Mono.
        </Note>
      </Section>
    </DocPage>
  );
}

const meta = {
  title: "Tema/Tipografi",
  id: "theme-typography",
  component: TipografiSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Rol adlı punto ölçeği gerçek boyutta ve ölçülerek; font presetleri fonts.ts'ten; Türkçe glif örneği.",
      },
    },
  },
} satisfies Meta<typeof TipografiSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Typography: Story = { name: "Tipografi" };
