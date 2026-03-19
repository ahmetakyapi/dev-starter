// Server Component — pure CSS marquee, no client JS needed

const LOGOS = [
  'Vercel', 'Stripe', 'Linear', 'Notion', 'Figma',
  'Shopify', 'Slack', 'GitHub', 'Loom', 'Raycast',
]

export default function Logos() {
  // Duplicate for seamless infinite loop
  const track = [...LOGOS, ...LOGOS]

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
          {track.map((name, i) => (
            // eslint-disable-next-line react/no-array-index-key — static decorative list, order never changes
            <span
              key={`${name}-${i}`}
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
