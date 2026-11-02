import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { roles } from "../../../packages/@ahmet/theme/tokens";
import { formatRatio, ratioOn, sameColor, textVerdict, type Verdict } from "./_lib/color";
import { DocPage, Note, PageHero, Section, ThemeLabel, Token, storyHref } from "./_lib/doc";
import { ThemeScope, resolveVar, useThemeVars, type ThemeName } from "./_lib/scope";

/* Değerler `tokens.ts → roles`ten (theme.css'in JS aynası, contract testiyle
   bağlı). Swatch'lar ise gerçek sınıflarla, o temanın kapsamında çizilir;
   tokens.ts ile sayfaya yüklenen globals.css ayrışırsa satır bunu söyler. */

type RoleKey = keyof (typeof roles)["light"];
type Kind = "surface" | "text" | "line" | "status" | "wash" | "warm" | "scrim";

type Row = {
  key: RoleKey;
  name: string;
  cls: string;
  /** Swatch'ın gerçek sınıfı (Tailwind'in görmesi için düz metin). */
  swatch: string;
  kind: Kind;
  use: string;
  /** Wash satırında üstündeki mürekkep. */
  ink?: RoleKey;
};

const GROUPS: { id: string; title: string; description: string; rows: Row[] }[] = [
  {
    id: "zemin",
    title: "Zemin ve Yüzeyler",
    description:
      "Derinlik gölgeyle değil ton farkıyla kurulur. Kuyu sayfadan yalnızca birkaç yüzde koyu; oran bilerek düşük, çünkü bu renkler metin taşımaz, alan ayırır.",
    rows: [
      { key: "pageBg", name: "Sayfa", cls: "bg-page", swatch: "bg-page", kind: "surface", use: "Gövde zemini, kontrastların ölçüldüğü yer" },
      { key: "surface", name: "Kuyu", cls: "bg-surface", swatch: "bg-surface", kind: "surface", use: "Kart, grafik kabı, seçim rayı" },
      { key: "surfaceRaised", name: "Yükseltilmiş", cls: "bg-surface-raised", swatch: "bg-surface-raised", kind: "surface", use: "Üzerine gelme, nötr rozet" },
      { key: "surfaceSunken", name: "Çukur", cls: "bg-surface-sunken", swatch: "bg-surface-sunken", kind: "surface", use: "Kod bloğu, giriş alanı içi" },
      { key: "overlay", name: "Karo ve Katman", cls: "bg-overlay", swatch: "bg-overlay shadow-raised", kind: "surface", use: "Kuyudaki beyaz karo, menü, diyalog" },
      { key: "scrim", name: "Örtü", cls: "bg-scrim", swatch: "bg-scrim", kind: "scrim", use: "Diyalog ve çekmecenin arkası" },
    ],
  },
  {
    id: "metin",
    title: "Metin",
    description:
      "Dört basamak, iki temada da sayfa zeminine karşı AA. Saf siyah ve saf beyaz yok: koyuda #fff parlar ve uzun metinde göz yorar.",
    rows: [
      { key: "textStrong", name: "Güçlü", cls: "text-strong", swatch: "text-strong", kind: "text", use: "Başlık, değer, etiket" },
      { key: "textBody", name: "Gövde", cls: "text-body", swatch: "text-body", kind: "text", use: "Paragraf, açıklama" },
      { key: "textSoft", name: "Yumuşak", cls: "text-soft", swatch: "text-soft", kind: "text", use: "İkincil satır (gövdeyle eş)" },
      { key: "textMuted", name: "Sessiz", cls: "text-muted", swatch: "text-muted", kind: "text", use: "Künye, yardım, zaman damgası" },
    ],
  },
  {
    id: "cizgi",
    title: "Çizgiler",
    description: "Kıl çizgisi alanı ayırır, vurgu taşımaz. Kuyu zaten ton farkıyla ayrıldığı için çoğu kartta çizgi hiç yok.",
    rows: [
      { key: "lineSoft", name: "Yumuşak Çizgi", cls: "border-line-soft", swatch: "border-2 border-line-soft", kind: "line", use: "Liste içi ayırıcı" },
      { key: "line", name: "Çizgi", cls: "border-line", swatch: "border-2 border-line", kind: "line", use: "Varsayılan kenarlık, bölüm ayırıcı" },
      { key: "lineStrong", name: "Güçlü Çizgi", cls: "border-line-strong", swatch: "border-2 border-line-strong", kind: "line", use: "Giriş alanı, onay kutusu" },
    ],
  },
  {
    id: "durum",
    title: "Durum Renkleri",
    description:
      "Mürekkepler kendi yıkamalarının üstünde AA ölçülür; oran o yüzden wash satırında mürekkep ile wash arasında. Renk tek işaret değildir: metin ve ikon her zaman yanında.",
    rows: [
      { key: "success", name: "Başarı", cls: "text-success", swatch: "text-success", kind: "status", use: "Tamamlandı, artış" },
      { key: "successWash", name: "Başarı Yıkaması", cls: "bg-success-wash", swatch: "bg-success-wash text-success", kind: "wash", ink: "success", use: "Rozet, değişim hapı" },
      { key: "warning", name: "Uyarı", cls: "text-warning", swatch: "text-warning", kind: "status", use: "Bekliyor, eşik yakın" },
      { key: "warningWash", name: "Uyarı Yıkaması", cls: "bg-warning-wash", swatch: "bg-warning-wash text-warning", kind: "wash", ink: "warning", use: "Rozet, uyarı satırı" },
      { key: "danger", name: "Tehlike", cls: "text-danger", swatch: "text-danger", kind: "status", use: "Hata, düşüş, yıkıcı eylem" },
      { key: "dangerWash", name: "Tehlike Yıkaması", cls: "bg-danger-wash", swatch: "bg-danger-wash text-danger", kind: "wash", ink: "danger", use: "Hata satırı, sil düğmesi" },
      { key: "accentWarm", name: "Sıcak Vurgu", cls: "bg-accent-warm", swatch: "bg-accent-warm", kind: "warm", use: "Seyrek tek nokta; metin rengi değil" },
    ],
  },
];

const kebab = (key: string) => "--" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function measure(row: Row, theme: ThemeName): { ratio: number | null; verdict: Verdict; against: string } {
  const set = roles[theme];
  const page = set.pageBg;
  if (row.kind === "wash" && row.ink) {
    const ratio = ratioOn(set[row.ink], page, set[row.key]);
    return { ratio, verdict: ratio ? textVerdict(ratio) : { label: "?", tone: "neutral" }, against: "mürekkep / wash" };
  }
  const ratio = ratioOn(set[row.key], page);
  if (row.kind === "text" || row.kind === "status") {
    return { ratio, verdict: ratio ? textVerdict(ratio) : { label: "?", tone: "neutral" }, against: "sayfaya karşı" };
  }
  if (row.kind === "warm") {
    const v = ratio ? textVerdict(ratio) : null;
    return { ratio, verdict: v && v.label === "AA" ? v : { label: "Nokta", tone: "neutral" }, against: "sayfaya karşı" };
  }
  return { ratio, verdict: { label: "Ton Farkı", tone: "neutral" }, against: "sayfaya karşı" };
}

function Swatch({ row }: { row: Row }) {
  const base = "grid size-12 shrink-0 place-items-center rounded-lg";
  switch (row.kind) {
    case "text":
    case "status":
      return (
        <span aria-hidden className={`${base} text-title font-semibold ${row.swatch}`}>
          Aa
        </span>
      );
    case "wash":
      return (
        <span aria-hidden className={`${base} text-small font-semibold ${row.swatch}`}>
          Aa
        </span>
      );
    case "warm":
      return (
        <span aria-hidden className={base}>
          <span className={`size-3 rounded-full ${row.swatch}`} />
        </span>
      );
    case "scrim":
      return (
        <span aria-hidden className={`${base} relative overflow-hidden border border-line bg-overlay`}>
          <span className="text-small font-semibold text-strong">Aa</span>
          <span className={`absolute inset-0 ${row.swatch}`} />
        </span>
      );
    case "line":
      return <span aria-hidden className={`${base} ${row.swatch}`} />;
    default:
      return <span aria-hidden className={`${base} border border-line-soft ${row.swatch}`} />;
  }
}

function RolePanel({ group, theme }: { group: (typeof GROUPS)[number]; theme: ThemeName }) {
  const vars = useThemeVars(theme);
  return (
    <ThemeScope theme={theme} label={theme === "light" ? "Açık tema" : "Koyu tema"} className="rounded-2xl border border-line p-2">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <ThemeLabel theme={theme} />
        <span className="font-mono text-micro text-muted">sayfa {roles[theme].pageBg}</span>
      </div>
      <ul className="rounded-xl bg-surface p-1.5">
        {group.rows.map((row) => {
          const value = roles[theme][row.key];
          const css = resolveVar(vars, kebab(row.key));
          const drift = css !== "" && !sameColor(value, css);
          const { ratio, verdict, against } = measure(row, theme);
          return (
            <li key={row.key} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 sm:gap-4">
              <Swatch row={row} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-base font-semibold text-strong">{row.name}</span>
                  <Token>{row.cls}</Token>
                </p>
                <p className="mt-1 truncate font-mono text-micro text-muted">{value}</p>
                {drift ? (
                  <p className="mt-1 flex items-center gap-1 text-micro font-medium text-warning">
                    <TriangleAlert aria-hidden className="size-3" />
                    globals.css: {css}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <span className="text-base font-semibold text-strong tabular-nums">{ratio ? formatRatio(ratio) : "—"}</span>
                <span className="sr-only">{against}</span>
                <Badge tone={verdict.tone} shape="rounded">
                  {verdict.label}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </ThemeScope>
  );
}

/** Metin merdiveni: dört basamak iki temada, büyük oranla. */
function TextLadder({ theme }: { theme: ThemeName }) {
  const steps: { key: RoleKey; name: string; cls: string }[] = [
    { key: "textStrong", name: "Güçlü", cls: "text-strong" },
    { key: "textBody", name: "Gövde", cls: "text-body" },
    { key: "textMuted", name: "Sessiz", cls: "text-muted" },
  ];
  return (
    <ThemeScope theme={theme} className="rounded-2xl border border-line p-6 sm:p-8">
      <ThemeLabel theme={theme} />
      <div className="mt-6 grid grid-cols-3 gap-4">
        {steps.map((s) => {
          const r = ratioOn(roles[theme][s.key], roles[theme].pageBg) ?? 0;
          return (
            <div key={s.key}>
              <p className={`text-display font-semibold tracking-[-0.03em] tabular-nums ${s.cls}`}>
                {formatRatio(r).replace(":1", "")}
              </p>
              <p className="mt-1 text-small text-muted">
                {s.name} · <span className="font-mono">{s.cls}</span>
              </p>
            </div>
          );
        })}
      </div>
    </ThemeScope>
  );
}

function RenklerSayfasi() {
  return (
    <DocPage>
      <PageHero
        eyebrow="Tema / Renkler"
        title="Nötr Sistem, Renk Veriden Gelir"
        lead={
          <>
            Zemin, metin ve çizgi paletten bağımsız griler; mavi tonu taşımazlar. Yeşim ya da pembe bir ürün kendi rengini
            temiz taşısın diye. Vurgu ailesi{" "}
            <a className="font-medium text-primary-ink underline underline-offset-4" href={storyHref("palettes--all")} target="_top">
              Paletler
            </a>{" "}
            sayfasında.
          </>
        }
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <TextLadder theme="light" />
        <TextLadder theme="dark" />
      </div>
      <Note className="mt-3">
        Metin basamaklarının sayfa zeminine karşı WCAG oranı. 4,5 AA, 7 AAA. Değerler <Token>tokens.ts → roles</Token>ten
        hesaplanır; yarı saydam renkler önce zemine bindirilir.
      </Note>

      {GROUPS.map((group) => (
        <Section key={group.id} id={group.id} title={group.title} description={group.description}>
          <div className="grid gap-4 lg:grid-cols-2">
            <RolePanel group={group} theme="light" />
            <RolePanel group={group} theme="dark" />
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {group.rows.map((row) => (
              <li key={row.key} className="text-small text-muted">
                <span className="font-medium text-strong">{row.name}:</span> {row.use}
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </DocPage>
  );
}

const meta = {
  title: "Tema/Renkler",
  id: "colors",
  component: RenklerSayfasi,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sistem rolleri (zemin, kuyu, karo, metin, çizgi, durum) açık ve koyu temada yan yana; her rengin sınıfı, değeri ve WCAG oranı.",
      },
    },
  },
} satisfies Meta<typeof RenklerSayfasi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "Renkler" };
