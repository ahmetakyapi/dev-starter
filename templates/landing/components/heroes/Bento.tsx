import { RollingNumber } from "@/components/motion/RollingNumber";
import { hero, type HeroCell } from "@/lib/content";
import { cn } from "@/lib/utils";
import { HeroActions, HeroEyebrow, HeroShell, HeroTitle } from "./shared";

/*
 * Hücre yerleşimi hücre SAYISINA göre: boş hücre bırakan ızgara yanlış
 * planlanmış ızgaradır. İlk hücre her zaman büyük (2×2). Telefonda iki
 * sütun, büyük hücre tam genişlik. Sınıflar tam yazılı: Tailwind metni tarar.
 */
const LAYOUTS: Record<number, readonly string[]> = {
  3: ["col-span-2 lg:row-span-2", "lg:col-span-2", "lg:col-span-2"],
  4: ["col-span-2 lg:row-span-2", "col-span-2", "", ""],
  5: ["col-span-2 lg:row-span-2", "", "", "", ""],
};

/* Yüzey çeşitliliği: tümü aynı düz kart olmasın. Degrade yok, ton ve doku var. */
const TONES = ["bg-primary-wash border border-line", "surface dot-grid", "surface", "border border-line bg-surface-raised", "surface"] as const;

function Cell({ cell, className, index }: { cell: HeroCell; className: string; index: number }) {
  const big = index === 0;
  if (cell.kind === "stat") {
    return (
      <div className={cn("flex min-w-0 flex-col justify-between gap-6 rounded-lg p-5", className)}>
        <p className="text-small text-muted">{cell.label}</p>
        <p className={cn("font-bold tracking-tight text-strong tabular-nums", big ? "text-hero" : "text-display")}>
          <RollingNumber value={cell.value} delayMs={index * 120} />
        </p>
      </div>
    );
  }
  const Icon = cell.icon;
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 rounded-lg p-5", big && "justify-end sm:p-7", className)}>
      <span className="grid size-10 place-items-center rounded-md bg-surface-raised text-primary-ink [&_svg]:size-5">
        <Icon aria-hidden />
      </span>
      <div>
        <h2 className={cn("font-semibold", big ? "text-heading" : "text-read")}>{cell.title}</h2>
        <p className={cn("mt-1.5 text-soft", big ? "text-read" : "text-base")}>{cell.body}</p>
      </div>
    </div>
  );
}

/** Başlık ve eylem üstte, altında 3-5 hücreli asimetrik ızgara: her hücre bir özellik ya da rakam. */
export function BentoHero() {
  const cells = hero.bento.slice(0, 5);
  const layout = LAYOUTS[cells.length] ?? LAYOUTS[5];
  return (
    <HeroShell scene={false}>
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        <div className="max-w-3xl">
          <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
          <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
          <p className="mt-6 max-w-xl text-lead text-soft">{hero.description}</p>
          <HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-8" />
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(10rem,auto))]">
          {cells.map((cell, index) => (
            <Cell
              key={cell.kind === "stat" ? cell.label : cell.title}
              cell={cell}
              index={index}
              className={cn(layout[index], TONES[index])}
            />
          ))}
        </div>
      </div>
    </HeroShell>
  );
}
