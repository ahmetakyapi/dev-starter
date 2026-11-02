/// <reference types="vite/client" />
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { CircleCheck, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Meter } from "@/components/ui/meter";
import { settle } from "./_settle";

/**
 * Kapsam ELLE YAZILMAZ. İki liste derleme anında okunur:
 *   1. `snippets/ui/*.tsx`: kataloğun bütün bileşen dosyaları (alt klasör `vitrin/` hariç).
 *   2. Pusula'nın kaynak dosyaları (`./_*.tsx`, ham metin): içlerindeki
 *      `@/components/ui/<ad>` içe aktarımları.
 * Bir snippet eklenip Pusula'da kullanılmazsa satırı kırmızı olur, oran düşer.
 */
const SNIPPETS = Object.keys(import.meta.glob("../../../snippets/ui/*.tsx"))
  .map((path) => path.split("/").pop()!.replace(/\.tsx$/, ""))
  .sort((a, b) => a.localeCompare(b, "tr-TR"));

const SOURCES = import.meta.glob("./_*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Kaynak dosya → kullanıcıya görünen sayfa adı. */
const PAGE_OF: Record<string, string> = {
  _app: "Kabuk",
  _ui: "Kabuk",
  _pano: "Pano",
  _gelen: "Gelen Kutusu",
  _takvim: "Takvim",
  _asistan: "Asistan",
  _raporlar: "Raporlar",
  _ayarlar: "Ayarlar",
  _giris: "Oturum Kapalı",
};

const USED = new Map<string, Set<string>>();
for (const [path, text] of Object.entries(SOURCES)) {
  const file = path.split("/").pop()!.replace(/\.tsx$/, "");
  const page = PAGE_OF[file] ?? file;
  for (const match of text.matchAll(/from\s+["']@\/components\/ui\/([\w-]+)["']/g)) {
    const name = match[1];
    if (!SNIPPETS.includes(name)) continue; // şablonun kendi bileşenleri (Button) kapsam dışı
    USED.set(name, (USED.get(name) ?? new Set()).add(page));
  }
}

type Row = { name: string; pages: readonly string[] };
const ROWS: Row[] = SNIPPETS.map((name) => ({ name, pages: [...(USED.get(name) ?? [])].sort((a, b) => a.localeCompare(b, "tr-TR")) }));
const COVERED = ROWS.filter((r) => r.pages.length > 0).length;
const RATIO = SNIPPETS.length ? Math.round((COVERED / SNIPPETS.length) * 100) : 0;
const PAGES = [...new Set(Object.values(PAGE_OF))];

const COLUMNS: Column<Row>[] = [
  {
    key: "ad",
    header: "Bileşen",
    sortable: true,
    sortValue: (r) => r.name,
    render: (r) => <code className="font-mono text-small text-strong">{r.name}.tsx</code>,
  },
  {
    key: "sayfa",
    header: "Kullanıldığı Sayfalar",
    render: (r) =>
      r.pages.length ? (
        <span className="flex flex-wrap gap-1">
          {r.pages.map((p) => (
            <Badge key={p} shape="rounded">
              {p}
            </Badge>
          ))}
        </span>
      ) : (
        <span className="text-danger">Hiçbir sayfada yok</span>
      ),
  },
  {
    key: "durum",
    header: "Durum",
    sortable: true,
    sortValue: (r) => r.pages.length,
    render: (r) =>
      r.pages.length ? (
        <Badge tone="success">
          <CircleCheck aria-hidden className="size-3.5" />
          Kullanılıyor
        </Badge>
      ) : (
        <Badge tone="danger">
          <CircleX aria-hidden className="size-3.5" />
          Kullanılmıyor
        </Badge>
      ),
  },
  { key: "adet", header: "Sayfa", numeric: true, render: (r) => r.pages.length, bar: { value: (r) => r.pages.length } },
];

function Coverage() {
  // Kullanılmayanlar en üstte: kırmızı satır aranmadan görülür.
  const rows = [...ROWS].sort((a, b) => Math.min(a.pages.length, 1) - Math.min(b.pages.length, 1) || a.name.localeCompare(b.name, "tr-TR"));
  return (
    <main className="min-h-dvh bg-page px-4 py-8 text-body sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header>
          <p className="text-small font-medium text-muted">Örnek Tasarım</p>
          <h1 className="mt-1 text-heading font-semibold tracking-tight text-strong">Bileşen Kapsamı</h1>
          <p className="mt-2 max-w-2xl text-read text-body">
            Kataloğun her dosyası Pusula'nın hangi sayfasında kullanılıyor. Liste <code className="font-mono text-small">snippets/ui</code>{" "}
            klasöründen ve Pusula'nın kaynak dosyalarındaki içe aktarımlardan derleme anında çıkarılır; elle yazılmaz.
          </p>
        </header>

        <section aria-labelledby="kapsam-ozet" className="grid gap-4 rounded-xl bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-3">
            <h2 id="kapsam-ozet" className="sr-only">
              Özet
            </h2>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-display font-semibold tracking-tight text-strong tabular-nums">%{RATIO}</span>
              <span className="text-read text-body">
                {COVERED} / {SNIPPETS.length} bileşen kullanılıyor
              </span>
            </p>
            <Meter
              label="Kapsam"
              value={COVERED}
              max={SNIPPETS.length}
              valueText={`${COVERED} / ${SNIPPETS.length}`}
              inverted
              thresholds={{ warn: 0.001, danger: 0.1 }}
              statusText={{ warn: "Eksik Var", danger: "Çok Eksik" }}
            />
          </div>
          <dl className="grid grid-cols-2 gap-1.5 sm:w-72">
            <div className="rounded-lg bg-overlay px-3 py-2 shadow-raised">
              <dt className="text-small text-muted">Sayfa</dt>
              <dd className="text-base font-semibold text-strong tabular-nums">{PAGES.length}</dd>
            </div>
            <div className="rounded-lg bg-overlay px-3 py-2 shadow-raised">
              <dt className="text-small text-muted">Kullanılmayan</dt>
              <dd className={COVERED === SNIPPETS.length ? "text-base font-semibold text-strong tabular-nums" : "text-base font-semibold text-danger tabular-nums"}>
                {SNIPPETS.length - COVERED}
              </dd>
            </div>
          </dl>
        </section>

        <DataTable caption="Bileşen Kapsamı" columns={COLUMNS} rows={rows} rowKey={(r) => r.name} on="page" minWidth="34rem" density="compact" />
      </div>
    </main>
  );
}

const meta = {
  title: "Örnek Tasarım/Bileşen Kapsamı",
  id: "showcase-component-coverage",
  component: Coverage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pusula vitrininin kapsam denetimi: `snippets/ui` altındaki her bileşen dosyası hangi sayfada kullanılıyor. Liste derleme anında `import.meta.glob` ile okunur; yeni bir snippet eklenip vitrinde kullanılmazsa satırı kırmızı görünür ve oran %100'ün altına düşer.",
      },
    },
  },
} satisfies Meta<typeof Coverage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CoverageTable: Story = {
  name: "Kapsam Tablosu",
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(`%${RATIO}`)).toBeInTheDocument();
    await expect(RATIO).toBe(100);
    await expect(canvas.queryByText("Kullanılmıyor")).toBeNull();
    await settle(globals);
  },
};
