// Server Component — pure CSS marquee, no client JS needed

const LOGOS = [
  'Vercel', 'Stripe', 'Linear', 'Notion', 'Figma',
  'Shopify', 'Slack', 'GitHub', 'Loom', 'Raycast',
]

export default function Logos() {
  // Seamless infinite loop — iki tur çizilir. Her öğeye tur öneki verilir ki
  // key index'e dayanmasın (react/no-array-index-key disable'ına gerek kalmaz).
  const track = ['a', 'b'].flatMap((lap) =>
    LOGOS.map((name) => ({ id: `${lap}-${name}`, name })),
  )

  return (
    <section className="relative z-10 border-y border-slate-800/40 py-14">
      <p className="mb-10 animate-[fade-in_0.8s_ease_forwards] text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600">
        Trusted by teams at
      </p>

      {/* Marquee — mask-image for theme-independent fade edges */}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="flex animate-marquee gap-14 whitespace-nowrap">
          {track.map(({ id, name }) => (
            <span
              key={id}
              className="text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-slate-400"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
