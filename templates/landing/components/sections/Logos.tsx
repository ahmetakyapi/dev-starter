import { logos } from "@/lib/content";

/*
 * Logo şeridi: sayfadaki TEK kayan şerit. CSS animasyonu, JavaScript yok.
 * Üzerine gelince durur; hareketi azaltanda durağan ve sarılı (app/landing.css).
 *
 * İşaretler uydurma müşteri adlarından ÜRETİLİR: baş harf + dört basit
 * geometriden biri. Gerçek müşteriler gelince `LogoMark` yerine onların SVG
 * logoları konur (tek renk, `currentColor`, iki temada aynı dosya).
 */

const SHAPES = ["circle", "square", "diamond", "ring"] as const;

function LogoMark({ name, index }: { name: string; index: number }) {
  const shape = SHAPES[index % SHAPES.length];
  const initial = name.charAt(0).toLocaleUpperCase("tr-TR");
  const filled = shape !== "ring";
  return (
    <span className="flex shrink-0 items-center gap-2.5 text-muted transition-colors hover:text-strong">
      <svg viewBox="0 0 28 28" aria-hidden className="size-7">
        {shape === "circle" ? <circle cx="14" cy="14" r="13" fill="currentColor" /> : null}
        {shape === "square" ? <rect x="1" y="1" width="26" height="26" rx="7" fill="currentColor" /> : null}
        {shape === "diamond" ? <rect x="5" y="5" width="18" height="18" rx="4" transform="rotate(45 14 14)" fill="currentColor" /> : null}
        {shape === "ring" ? <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="2" /> : null}
        <text
          x="14"
          y="14"
          dy="0.35em"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          // Dolu şeklin üstünde harf zemin renginde: iki temada da okunur.
          style={{ fill: filled ? "var(--page-bg)" : "currentColor" }}
        >
          {initial}
        </text>
      </svg>
      <span className="text-read font-semibold whitespace-nowrap">{name}</span>
    </span>
  );
}

function Lap({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-12 pr-12">
      {logos.names.map((name, index) => (
        <li key={name}>
          <LogoMark name={name} index={index} />
        </li>
      ))}
    </ul>
  );
}

export function Logos() {
  return (
    <section aria-labelledby="logolar" className="border-y border-line-soft py-10 sm:py-12">
      <h2 id="logolar" className="px-4 text-center text-base font-semibold text-muted">
        {logos.title}
      </h2>
      <div className="marquee mt-7 overflow-clip">
        {/* İki özdeş tur: şerit yarısı kadar kayınca başa döner, dikiş görünmez.
            İkinci tur ekran okuyucuya gizli; isimler bir kez okunur. */}
        <div className="marquee-track gap-y-6">
          <Lap />
          <Lap hidden />
        </div>
      </div>
    </section>
  );
}
