import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Eye, EyeOff, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ChipGroup, FilterChip } from "@/components/ui/chip";
import { CopyButton } from "@/components/ui/copy-button";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import {
  PATTERN_CATEGORIES,
  PATTERN_PRESETS,
  PatternBackground,
  presetSnippet,
  type PatternCategory,
} from "@/components/ui/pattern-bg";
import { cn } from "@/lib/utils";

/**
 * Desen kütüphanesi (patterncraft.fun'ın kütüphane deneyiminden: kategori,
 * arama, kartta canlı önizleme, "Önizle" ile bütün sayfaya uygula, tek
 * tıkla kopyala, favoriler). Onların desenleri sabit renkli; bizimkiler
 * token'dan çizilir, üst çubuktaki tema ve paletle hepsi birlikte döner.
 */

type Filter = "Tümü" | PatternCategory | "Favoriler";
const FAV_KEY = "ds-pattern-favs";

function readFavs(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(FAV_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function Library() {
  const [filter, setFilter] = useState<Filter>("Tümü");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => setFavs(readFavs()), []);

  function toggleFav(id: string) {
    setFavs((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        // Depolama kapalı: favoriler bu oturumda kalır.
      }
      return next;
    });
  }

  const shown = useMemo(
    () =>
      PATTERN_PRESETS.filter((p) =>
        filter === "Tümü" ? true : filter === "Favoriler" ? favs.includes(p.id) : p.category === filter,
      ).filter((p) => !query || matchesTr(`${p.title} ${p.category}`, query, { fold: true })),
    [favs, filter, query],
  );
  const active = PATTERN_PRESETS.find((p) => p.id === preview);
  const filters: Filter[] = ["Tümü", ...PATTERN_CATEGORIES, "Favoriler"];

  return (
    <div className="relative isolate min-h-dvh bg-page text-body">
      {active ? <PatternBackground {...active.props} className="fixed" /> : null}

      <header className="mx-auto grid max-w-6xl gap-5 px-5 pt-16 pb-10 sm:px-8">
        <p className="font-mono text-small text-muted">{PATTERN_PRESETS.length} desen · token'dan çizilir</p>
        <h1 className="max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-strong">
          Desen Kütüphanesi
        </h1>
        <p className="max-w-2xl text-lead text-body">
          Bölüm zeminleri: ışık, ızgara, nokta, çizgi, geometri, doku. Üst çubuktan temayı ya da paleti değiştir, bütün kartlar birlikte
          döner. Önizle desen bütün sayfaya serer, Kopyala hazır JSX'i verir.
        </p>
      </header>

      <div className="sticky top-0 z-10 border-y border-line bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3 sm:px-8">
          <ChipGroup aria-label="Kategori" className="flex-1">
            {filters.map((f) => (
              <FilterChip
                key={f}
                selected={filter === f}
                count={f === "Favoriler" ? favs.length : f === "Tümü" ? undefined : PATTERN_PRESETS.filter((p) => p.category === f).length}
                onClick={() => setFilter(f)}
              >
                {f}
              </FilterChip>
            ))}
          </ChipGroup>
          <SearchField label="Desen ara" placeholder="Desen ara" onValueChange={setQuery} resultCount={shown.length} className="w-full sm:w-64" shortcut="/" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="mb-4 text-small text-muted tabular-nums">{shown.length} desen</p>
        {shown.length === 0 ? (
          <p className="rounded-2xl bg-surface p-10 text-center text-base text-muted">
            {filter === "Favoriler" ? "Henüz favori yok. Kartın yıldızına bas." : "Bu aramayla eşleşen desen yok."}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => {
              const fav = favs.includes(p.id);
              const on = preview === p.id;
              return (
                <li key={p.id} className={cn("overflow-hidden rounded-2xl bg-overlay shadow-raised", on && "ring-2 ring-primary")}>
                  <div className="relative isolate aspect-[4/3] overflow-hidden bg-page">
                    <PatternBackground {...p.props} />
                    <button
                      type="button"
                      aria-pressed={fav}
                      aria-label={`Favori: ${p.title}`}
                      onClick={() => toggleFav(p.id)}
                      className="absolute top-2 left-2 grid size-11 place-items-center rounded-full text-muted hover:text-strong"
                    >
                      <span className="grid size-8 place-items-center rounded-full bg-overlay/85 shadow-raised backdrop-blur-sm">
                        <Star aria-hidden className={cn("size-4", fav && "fill-current text-warning")} />
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-3 pl-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-strong">{p.title}</p>
                      <p className="text-micro text-muted">{p.category}</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPreview(on ? null : p.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-small font-medium text-body hover:bg-surface hover:text-strong"
                    >
                      {on ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                      {on ? "Kapat" : "Önizle"}
                    </button>
                    <CopyButton value={presetSnippet(p.props)} label={`JSX'i Kopyala: ${p.title}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {active ? (
        <div role="status" className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full bg-strong py-1.5 pr-1.5 pl-4 text-small text-page shadow-floating">
          Önizleme: {active.title}
          <button type="button" onClick={() => setPreview(null)} className="min-h-9 rounded-full bg-page/15 px-3 font-medium hover:bg-page/25">
            Önizlemeyi Kapat
          </button>
        </div>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Örnek Tasarım/Desen Kütüphanesi",
  id: "pattern-library",
  tags: ["yeni"],
  parameters: { layout: "fullscreen", docs: { disable: true } },
  render: () => <Library />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  name: "Desen Kütüphanesi",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Izgara/ }));
    await expect(canvas.getByText(/^\d+ desen$/)).toHaveTextContent("10 desen");
    const previewBtn = canvas.getAllByRole("button", { name: "Önizle" })[0];
    await userEvent.click(previewBtn);
    await expect(canvas.getByText(/^Önizleme:/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Önizlemeyi Kapat" }));
  },
};
