import { hero } from "@/lib/content";
import { HeroActions, HeroEyebrow, HeroShell, HeroTitle } from "./shared";
import { StageFrame } from "./StageLines";

/** Yapışkan sahne: başlık sabit, altındaki üç cümle kaydırdıkça sırayla değişir. */
export function ScrollStageHero() {
  return (
    <HeroShell scene={false}>
      <StageFrame
        lines={hero.stage}
        head={
          <div className="max-w-3xl">
            <HeroEyebrow>{hero.eyebrow}</HeroEyebrow>
            <HeroTitle lines={hero.title} className="text-display sm:text-hero" />
          </div>
        }
        actions={<HeroActions primary={hero.primary} secondary={hero.secondary} className="mt-10" />}
      />
    </HeroShell>
  );
}
