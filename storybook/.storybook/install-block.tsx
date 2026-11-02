import { Controls, Description, Primary, Stories, Subtitle, Title, Unstyled, useOf } from "@storybook/addon-docs/blocks";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import registry from "../../snippets/ui/registry.json";

/**
 * "Projeye Al" bloğu: her bileşen belgesinin başında kurulum komutları
 * (add-ui ve shadcn) ve bileşenin bağımlılıkları. Veri tek kaynaktan,
 * `snippets/ui/registry.json` (üreten: `npm run registry:ui`); burada elle
 * yazılmış liste yok. Eşleme meta `id`sinden: kural gereği id = dosya adı,
 * istisnası (`track-bar-chart` → `bar-chart`) kayıtta `storyId` olarak durur.
 *
 * Görünüş board dili: gri kuyu, içinde beyaz karolar, kopyala düğmesi karoda.
 */

type Item = (typeof registry.items)[number];

const byStory = new Map<string, Item>();
for (const item of registry.items) {
  byStory.set(item.name, item);
  if (item.storyId) byStory.set(item.storyId, item);
}
const byName = new Map(registry.items.map((item) => [item.name, item]));

function docsHref(name: string) {
  const id = byName.get(name)?.storyId ?? name;
  return `/?path=/docs/${id}--docs`;
}

function Command({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-overlay py-1.5 pr-1.5 pl-4 shadow-raised">
      <div className="min-w-0 flex-1">
        <p className="text-micro font-medium text-muted">{label}</p>
        <code className="block overflow-x-auto font-mono text-small whitespace-nowrap text-strong">{value}</code>
      </div>
      <CopyButton value={value} label={`Kopyala: ${label}`} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <dt className="w-28 shrink-0 text-small text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap gap-1.5">{children}</dd>
    </div>
  );
}

const pill = "max-w-full rounded-md bg-overlay px-2 py-0.5 font-mono text-micro break-all text-body shadow-raised";

export function InstallBlock({ item }: { item: Item }) {
  const npm = Object.entries(item.npm);
  return (
    // Dış kat bg-page: belge sayfası temadan bağımsız beyaz; koyu temada yarı
    // saydam kuyu onun üstünde açık kalırdı (ölçüldü). Kuyu iç katta.
    <section aria-labelledby="projeye-al" className="my-6 rounded-2xl bg-page text-body">
      <div className="rounded-2xl bg-surface p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 id="projeye-al" className="text-base font-semibold text-strong">
            Projeye Al
          </h2>
          <p className="text-small text-muted">
            {item.category} · {item.client ? "istemci bileşeni" : "sunucu bileşeni"}
          </p>
        </div>
        <div className="grid gap-2">
          <Command
            label="dev-starter ile (bağımlılıklar ve eksik paketler dahil)"
            value={`node ~/dev-starter/scripts/add-ui.mjs . ${item.name}`}
          />
          <Command
            label="shadcn ile (her Next projesinde)"
            value={`npx shadcn@latest add ${registry.shadcnBase}/${item.name}.json`}
          />
        </div>
        <dl className="mt-4 grid gap-2 px-1">
          <Row label="Bileşenler">
            {item.registryDependencies.length ? (
              item.registryDependencies.map((dep) => (
                <a key={dep} href={docsHref(dep)} target="_top" className={`${pill} underline-offset-2 hover:underline`}>
                  {dep}
                </a>
              ))
            ) : (
              <span className="text-small text-muted">yok</span>
            )}
          </Row>
          <Row label="Şablondan">
            {item.templateFiles.map((f) => (
              <span key={f} className={pill}>
                {f}
              </span>
            ))}
          </Row>
          <Row label="npm">
            {npm.length ? (
              npm.map(([name, version]) => (
                <span key={name} className={pill}>
                  {name}
                  {version ? <span className="text-muted">@{version}</span> : null}
                </span>
              ))
            ) : (
              <span className="text-small text-muted">yalnız react ve next</span>
            )}
          </Row>
        </dl>
        {item.palettes ? (
          <p className="mt-3 px-1 text-small text-muted">
            <code className="font-mono">app/palettes.css</code> ister: globals.css'te{" "}
            <code className="font-mono">@import &quot;./palettes.css&quot;;</code> (add-ui hatırlatır).
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Meta kimliğine göre kayıttaki bileşen; kayıtta yoksa (tema, ekran sayfası) blok çizilmez. */
function InstallForMeta() {
  const resolved = useOf("meta", ["meta"]);
  const item = byStory.get(resolved.preparedMeta.id);
  return item ? (
    <Unstyled>
      <InstallBlock item={item} />
    </Unstyled>
  ) : null;
}

/** Storybook'un varsayılan belge sayfası + başlığın altında "Projeye Al". */
export function DocsPageWithInstall() {
  return (
    <>
      <Title />
      <InstallForMeta />
      <Subtitle />
      <Description />
      <Primary />
      <Controls />
      <Stories />
    </>
  );
}
