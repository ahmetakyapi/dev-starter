// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
// token-ok-file: duvar kâğıdı bir illüstrasyon varlığıdır; sahnelerin renk setleri elle seçildi (palet token'larıyla karıştırma çamurlu, bulanık sonuç veriyordu — 2026-11-07 kullanıcı geri bildirimi). Arayüz rengi değil, resim rengi.
import { useId, type ReactNode } from "react";
import { cn } from "../utils";

/**
 * Duvar kâğıdı: çözünürlükten bağımsız (SVG) sekiz illüstrasyon sahnesi.
 * Masaüstü maketinin arkası (`app-window` + `dock`), tanıtım sayfasının
 * görsel zemini ya da `downloadWallpaper()` ile indirilen gerçek duvar kâğıdı
 * (Retina masaüstü 2880×1800, telefon 1290×2796). Storybook → Tanıtım/Duvar Kâğıdı.
 *
 * RENK: arayüz token'ı DEĞİL, her sahnenin elle seçilmiş renk seti. İlk
 * sürüm paletin tek tonunu beyaz/siyahla karıştırıyordu; sonuç bulanık ve
 * kahverengiye çalan sahnelerdi. Resim temayla dönmez (gece sahnesi açık
 * temada da gece); arayüz paletiyle uyum için sahne seçilir (signature →
 * Lagün, Şafak; ember → Altın Saat; iris → Gün Batımı, İpek).
 *
 * İŞÇİLİK: her katmanın kendi dikey ışık degradesi (üst kenar aydınlık,
 * etek gölgede), katmanlar arası sis, gün ışığında geniş hale, kumda
 * aydınlık/gölge yüzü ve sırt çizgisi, kutup ışığında dikey huzmeler.
 * Eğriler Catmull-Rom → kübik Bézier (kırık çizgi yok). Rastgelelik sabit
 * tohumlu: sunucu ve istemci aynı resmi çizer. Filtre kimlikleri `useId`.
 *
 * `viewBox="0 0 1600 1000"` + `preserveAspectRatio="xMidYMid slice"`: kap
 * hangi oranda olursa olsun boşluksuz doldurur (telefon dikeyinde de). Süs:
 * `aria-hidden`. Hareket yok.
 *
 *   <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
 *     <Wallpaper scene="lagoon" className="absolute inset-0" />
 *   </div>
 */

export const WALLPAPER_SCENES = ["sunset", "dunes", "lagoon", "alpine", "aurora", "silk", "mesh", "paper"] as const;
export type WallpaperScene = (typeof WALLPAPER_SCENES)[number];

export const WALLPAPER_NAMES: Record<WallpaperScene, string> = {
  sunset: "Gün Batımı Tepeleri",
  dunes: "Altın Saat",
  lagoon: "Lagün",
  alpine: "Şafak Dağları",
  aurora: "Kutup Işığı",
  silk: "İpek",
  mesh: "Gece Ağı",
  paper: "Kâğıt Katmanları",
};

/* --- Geometri ------------------------------------------------------------ */

function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = readonly [number, number];
const f = (n: number) => n.toFixed(1);

/** Noktalardan geçen yumuşak eğri (Catmull-Rom → kübik Bézier). */
function smooth(pts: readonly Pt[]) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Tepe sırtı noktaları: üç sinüsün toplamı + tohumlu küçük dalgalanma. */
function ridgePts(base: number, amp: number, seed: number, count = 9, sharp = 0): Pt[] {
  const rnd = seeded(seed);
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const x = -60 + t * 1720;
    const y =
      base -
      amp * (0.55 * Math.sin(t * 5.1 + ph[0]) + 0.3 * Math.sin(t * 11.3 + ph[1]) + 0.15 * Math.sin(t * 23 + ph[2])) -
      (sharp ? (i % 2 ? -1 : 1) * rnd() * sharp : 0);
    return [x, y] as Pt;
  });
}

/** Sırttan alt kenara kapanan alan. */
const fillBelow = (pts: readonly Pt[]) => `${smooth(pts)} L1700 1100 L-100 1100 Z`;
/** Kırık (sivri) sırttan alt kenara kapanan alan: dağ için. */
const peaksBelow = (pts: readonly Pt[]) => `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")} L1700 1100 L-100 1100 Z`;

/* --- Ortak tanımlar ------------------------------------------------------ */

type Stop = readonly [offset: number, color: string, opacity?: number];

function Linear({ id, stops, x2 = 0, y2 = 1, user }: { id: string; stops: readonly Stop[]; x2?: number; y2?: number; user?: [number, number, number, number] }) {
  return (
    <linearGradient
      id={id}
      {...(user
        ? { gradientUnits: "userSpaceOnUse", x1: user[0], y1: user[1], x2: user[2], y2: user[3] }
        : { x1: 0, y1: 0, x2, y2 })}
    >
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </linearGradient>
  );
}

function Radial({ id, stops }: { id: string; stops: readonly Stop[] }) {
  return (
    <radialGradient id={id}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </radialGradient>
  );
}

function Grain({ id, amount = 0.07 }: { id: string; amount?: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${amount} 0`} />
    </filter>
  );
}

/* --- Sahneler ------------------------------------------------------------ */

function Scene({ scene, id }: { scene: WallpaperScene; id: string }) {
  const g = (n: string) => `${id}-${n}`;
  const u = (n: string) => `url(#${g(n)})`;

  switch (scene) {
    case "sunset": {
      const layers = [
        { base: 600, amp: 40, seed: 3, top: "#f9a8d4", bottom: "#c084fc", op: 0.9 },
        { base: 660, amp: 55, seed: 8, top: "#e879f9", bottom: "#8b5cf6", op: 1 },
        { base: 740, amp: 60, seed: 13, top: "#a855f7", bottom: "#5b21b6", op: 1 },
        { base: 830, amp: 55, seed: 21, top: "#7c3aed", bottom: "#3b0764", op: 1 },
        { base: 930, amp: 45, seed: 34, top: "#4c1d95", bottom: "#1e0b3b", op: 1 },
      ];
      return (
        <>
          <defs>
            <Linear id={g("sky")} user={[0, 0, 0, 700]} stops={[[0, "#1e1b4b"], [0.32, "#5b21b6"], [0.58, "#db2777"], [0.8, "#fb923c"], [1, "#fde68a"]]} />
            <Radial id={g("sun")} stops={[[0, "#fff7d6"], [0.25, "#fde68a", 0.9], [0.55, "#fb923c", 0.35], [1, "#fb923c", 0]]} />
            <Linear id={g("haze")} stops={[[0, "#f9a8d4", 0], [1, "#f9a8d4", 0.45]]} />
            {layers.map((l, i) => (
              <Linear key={i} id={g(`h${i}`)} stops={[[0, l.top], [1, l.bottom]]} />
            ))}
            <Grain id={g("grain")} amount={0.05} />
          </defs>
          <rect width="1600" height="1000" fill={u("sky")} />
          <circle cx="1040" cy="590" r="420" fill={u("sun")} />
          <circle cx="1040" cy="590" r="78" fill="#fffbeb" />
          {layers.map((l, i) => (
            <g key={i}>
              <path d={fillBelow(ridgePts(l.base, l.amp, l.seed))} fill={u(`h${i}`)} opacity={l.op} />
              {i < 3 ? <path d={smooth(ridgePts(l.base, l.amp, l.seed))} fill="none" stroke="#fde68a" strokeOpacity={0.35 - i * 0.1} strokeWidth="2" /> : null}
              {i < 3 ? <rect y={l.base - 40} width="1600" height="90" fill={u("haze")} opacity={0.5 - i * 0.15} /> : null}
            </g>
          ))}
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );
    }

    case "dunes": {
      const dunes = [
        { base: 640, amp: 50, seed: 5, lit: "#fcd5a5", shade: "#e8945a" },
        { base: 710, amp: 70, seed: 9, lit: "#f7b977", shade: "#c96a35" },
        { base: 800, amp: 80, seed: 17, lit: "#ef9a55", shade: "#9a3f17" },
        { base: 900, amp: 70, seed: 27, lit: "#d97436", shade: "#5c2009" },
      ];
      return (
        <>
          <defs>
            <Linear id={g("sky")} user={[0, 0, 0, 720]} stops={[[0, "#fde7c8"], [0.55, "#fbbf8a"], [1, "#f78d5c"]]} />
            <Radial id={g("sun")} stops={[[0, "#fffdf2"], [0.2, "#fff1c9", 0.95], [0.5, "#fdba74", 0.4], [1, "#fdba74", 0]]} />
            {dunes.map((d, i) => (
              <Linear key={i} id={g(`d${i}`)} x2={1} y2={0.35} stops={[[0, d.lit], [0.45, d.lit], [0.62, d.shade], [1, d.shade]]} />
            ))}
            <Grain id={g("grain")} amount={0.06} />
          </defs>
          <rect width="1600" height="1000" fill={u("sky")} />
          <circle cx="400" cy="560" r="360" fill={u("sun")} />
          <circle cx="400" cy="560" r="62" fill="#fffdf2" />
          {dunes.map((d, i) => (
            <g key={i}>
              <path d={fillBelow(ridgePts(d.base, d.amp, d.seed, 7))} fill={u(`d${i}`)} />
              <path d={smooth(ridgePts(d.base, d.amp, d.seed, 7))} fill="none" stroke="#fff1d6" strokeOpacity={0.55 - i * 0.1} strokeWidth="2.5" />
            </g>
          ))}
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );
    }

    case "lagoon": {
      const rnd = seeded(41);
      const glints = Array.from({ length: 60 }, () => ({ x: rnd() * 1600, y: 535 + rnd() * 140, w: 6 + rnd() * 22 }));
      const cloud = (cx: number, cy: number, s: number) => (
        <g transform={`translate(${cx} ${cy}) scale(${s})`}>
          <ellipse cx="0" cy="0" rx="120" ry="34" />
          <circle cx="-50" cy="-24" r="44" />
          <circle cx="20" cy="-40" r="58" />
          <circle cx="80" cy="-18" r="40" />
        </g>
      );
      return (
        <>
          <defs>
            <Linear id={g("sky")} user={[0, 0, 0, 540]} stops={[[0, "#38bdf8"], [0.6, "#a5e3fb"], [1, "#e9f8ff"]]} />
            <Linear id={g("sea")} user={[0, 530, 0, 800]} stops={[[0, "#0e6c8e"], [0.35, "#0aa5c0"], [0.75, "#2dd4bf"], [1, "#99f6e4"]]} />
            <Linear id={g("sand")} user={[0, 780, 0, 1000]} stops={[[0, "#f4dcb4"], [1, "#e9c38d"]]} />
            <filter id={g("soft")} x="-30%" y="-60%" width="160%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <rect width="1600" height="1000" fill={u("sky")} />
          <g fill="#ffffff" opacity="0.92" filter={u("soft")}>
            {cloud(320, 230, 1.1)}
            {cloud(1180, 170, 0.8)}
            {cloud(860, 330, 0.55)}
            {cloud(1450, 380, 0.45)}
          </g>
          <rect y="530" width="1600" height="470" fill={u("sea")} />
          <rect y="530" width="1600" height="2" fill="#ffffff" opacity="0.5" />
          {glints.map((s, i) => (
            <rect key={i} x={f(s.x)} y={f(s.y)} width={f(s.w)} height="2" rx="1" fill="#ffffff" opacity="0.55" />
          ))}
          <path d={fillBelow(ridgePts(800, 18, 44, 6))} fill="#7ee8d6" opacity="0.7" />
          <path d={fillBelow(ridgePts(822, 16, 45, 6))} fill={u("sand")} />
          <path d={smooth(ridgePts(816, 16, 45, 6))} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
          <path d={fillBelow(ridgePts(905, 14, 47, 6))} fill="#e2b77d" opacity="0.55" />
        </>
      );
    }

    case "alpine": {
      const ranges = [
        { base: 560, amp: 210, seed: 61, color: "#c4b5fd", op: 0.75 },
        { base: 640, amp: 190, seed: 67, color: "#a5b4fc", op: 0.9 },
        { base: 730, amp: 170, seed: 71, color: "#6366f1", op: 1 },
        { base: 830, amp: 140, seed: 79, color: "#3730a3", op: 1 },
        { base: 940, amp: 110, seed: 83, color: "#1e1b4b", op: 1 },
      ];
      // Düzensiz zirveler: ara mesafe ve yükseklik tohumlu, zirve ile vadi
      // arasına omuz noktası (tek eğimli testere dişi değil, kayalık sırt).
      const peaks = (base: number, amp: number, seed: number) => {
        const rnd = seeded(seed);
        const pts: Pt[] = [];
        let x = -80;
        while (x < 1700) {
          const w = 110 + rnd() * 170;
          const h = amp * (0.3 + rnd() * 0.7);
          pts.push([x, base - amp * rnd() * 0.18]);
          pts.push([x + w * (0.25 + rnd() * 0.15), base - h * (0.45 + rnd() * 0.2)]);
          pts.push([x + w * (0.45 + rnd() * 0.1), base - h]);
          pts.push([x + w * (0.7 + rnd() * 0.1), base - h * (0.5 + rnd() * 0.2)]);
          x += w;
        }
        return pts;
      };
      return (
        <>
          <defs>
            <Linear id={g("sky")} user={[0, 0, 0, 700]} stops={[[0, "#a5b4fc"], [0.45, "#f5c2e7"], [0.8, "#fed7aa"], [1, "#fff1dc"]]} />
            <Radial id={g("sun")} stops={[[0, "#fff8e7"], [0.3, "#ffe4c4", 0.8], [1, "#ffe4c4", 0]]} />
            <Linear id={g("mist")} stops={[[0, "#fdf2f8", 0], [0.6, "#fdf2f8", 0.75], [1, "#fdf2f8", 0]]} />
            {ranges.map((r, i) => (
              <Linear key={i} id={g(`m${i}`)} stops={[[0, r.color], [1, i < 2 ? "#e0e7ff" : r.color]]} />
            ))}
            <Grain id={g("grain")} amount={0.04} />
          </defs>
          <rect width="1600" height="1000" fill={u("sky")} />
          <circle cx="1180" cy="420" r="300" fill={u("sun")} />
          <circle cx="1180" cy="420" r="54" fill="#fffaf0" />
          {ranges.map((r, i) => (
            <g key={i}>
              <path d={peaksBelow(peaks(r.base, r.amp, r.seed))} fill={u(`m${i}`)} opacity={r.op} />
              {i < 4 ? <rect y={r.base - 30} width="1600" height="120" fill={u("mist")} opacity={0.65 - i * 0.12} /> : null}
            </g>
          ))}
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );
    }

    case "aurora": {
      const rnd = seeded(7);
      const stars = Array.from({ length: 320 }, () => ({ x: rnd() * 1600, y: rnd() * 600, r: rnd() ** 4 * 2 + 0.35, o: rnd() * 0.6 + 0.25 }));
      const bright = stars.filter((st) => st.r > 1.3);
      // Işık perdesi: kıvrılan bir taban eğrisi boyunca yüzlerce dikey huzme.
      // Huzme dipte parlak, yukarı doğru söner; boy ve parlaklık iki yavaş
      // dalgayla kümelenir: perde düz bir tarak değil, katlanan bir kumaş.
      // Degradeler sahne koordinatında (userSpaceOnUse): dikey çizginin
      // genişliği 0, nesneye göre degrade orada tanımsız kalıp çizgiyi siler.
      const rays = (y0: number, amp: number, len: number, seed: number, count: number, from = 0, to = 1) => {
        const r = seeded(seed);
        const ph = r() * 6;
        return Array.from({ length: count }, (_, i) => {
          const t = from + (i / count) * (to - from);
          const x = -40 + t * 1680 + (r() - 0.5) * 8;
          const y = y0 + Math.sin(t * 5.4 + ph) * amp + Math.sin(t * 13 + ph) * amp * 0.3;
          const fold = 0.35 + 0.65 * Math.sin(t * 7.5 + ph * 2) ** 2;
          // Perde ucu sert kesilmesin: aralığın iki kenarına doğru söner.
          const taper = Math.sin(Math.PI * ((t - from) / (to - from))) ** 0.6;
          const l = len * (0.6 + r() * 0.5) * (0.55 + 0.45 * fold) * (0.5 + 0.5 * taper);
          return { x, y, l, o: (0.18 + r() * 0.4) * (0.45 + 0.55 * fold) * taper };
        });
      };
      const green = rays(470, 75, 270, 91, 300, -0.15, 1.15);
      const lime = rays(500, 70, 120, 93, 160, 0.1, 0.95);
      const teal = rays(530, 45, 170, 95, 150, 0.35, 1);
      const pink = rays(300, 80, 150, 99, 140, 0.05, 0.75);
      const curtain = (list: ReturnType<typeof rays>, grad: string, w: number) => (
        <g stroke={u(grad)} strokeWidth={w} strokeLinecap="round">
          {list.map((ray, i) => (
            <line key={i} x1={f(ray.x)} y1={f(ray.y)} x2={f(ray.x)} y2={f(ray.y - ray.l)} opacity={ray.o.toFixed(2)} />
          ))}
        </g>
      );
      const lights = (
        <>
          <g filter={u("haze")} opacity="0.75">
            {curtain(pink, "pink", 34)}
            {curtain(green, "green", 30)}
          </g>
          <g filter={u("glow")} opacity="0.9">
            {curtain(pink, "pink", 12)}
            {curtain(green, "green", 14)}
            {curtain(teal, "teal", 12)}
          </g>
          <g filter={u("fine")} opacity="0.75">
            {curtain(pink, "pink", 2.4)}
            {curtain(green, "green", 2.8)}
            {curtain(lime, "lime", 2.2)}
            {curtain(teal, "teal", 2.4)}
          </g>
        </>
      );
      // Kıyı çamları: tohumlu boy ve aralık, üç katlı üçgen gövde.
      const pines = (fromX: number, toX: number, base: number, seed: number, scale: number) => {
        const r = seeded(seed);
        const out: string[] = [];
        let x = fromX;
        while (x < toX) {
          const h = (34 + r() * 60) * scale;
          const w = h * 0.36;
          const tiers = [0, 0.3, 0.55].map((k, j) => {
            const top = base - h + h * k;
            const half = w * (0.55 + j * 0.25);
            const bottom = top + h * 0.48;
            return `M${f(x)} ${f(top)} L${f(x + half)} ${f(bottom)} L${f(x - half)} ${f(bottom)} Z`;
          });
          out.push(...tiers, `M${f(x - 1.5)} ${f(base - h * 0.1)} h3 v${f(h * 0.12)} h-3 Z`);
          x += w * (0.55 + r() * 0.9);
        }
        return out.join(" ");
      };
      const far = ridgePts(745, 105, 101, 34, 16);
      const near = ridgePts(805, 45, 107, 7);
      return (
        <>
          <defs>
            <Linear id={g("sky")} user={[0, 0, 0, 830]} stops={[[0, "#01040f"], [0.45, "#05122a"], [0.8, "#0a2c45"], [1, "#0f4a55"]]} />
            <Linear id={g("green")} user={[0, 170, 0, 560]} stops={[[0, "#4ade80", 0], [0.55, "#34d399", 0.55], [0.85, "#86efac", 0.95], [1, "#ecfccb"]]} />
            <Linear id={g("lime")} user={[0, 380, 0, 575]} stops={[[0, "#bef264", 0], [1, "#f7fee7", 0.9]]} />
            <Linear id={g("teal")} user={[0, 330, 0, 590]} stops={[[0, "#22d3ee", 0], [0.75, "#2dd4bf", 0.75], [1, "#a5f3fc"]]} />
            <Linear id={g("pink")} user={[0, 60, 0, 390]} stops={[[0, "#f0abfc", 0], [0.55, "#e879f9", 0.45], [1, "#a78bfa", 0.15]]} />
            <radialGradient id={g("horizon")} cx="0.5" cy="1" r="0.75">
              <stop offset="0" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
            <Linear id={g("lake")} user={[0, 830, 0, 1000]} stops={[[0, "#0b3140"], [1, "#020812"]]} />
            <Linear id={g("rim")} user={[0, 600, 0, 820]} stops={[[0, "#a7f3d0", 0.55], [1, "#a7f3d0", 0]]} />
            <filter id={g("haze")} x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
            <filter id={g("glow")} x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <filter id={g("fine")} x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
            <filter id={g("milky")} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="50" />
            </filter>
            <filter id={g("reflect")} x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="6 2" />
            </filter>
            <clipPath id={g("lakeClip")}>
              <rect y="832" width="1600" height="168" />
            </clipPath>
          </defs>
          <rect width="1600" height="1000" fill={u("sky")} />
          <ellipse cx="800" cy="260" rx="900" ry="90" transform="rotate(-18 800 260)" fill="#c7d2fe" opacity="0.07" filter={u("milky")} />
          {stars.map((st, i) => (
            <circle key={i} cx={f(st.x)} cy={f(st.y)} r={st.r.toFixed(2)} fill="#ffffff" opacity={st.o.toFixed(2)} />
          ))}
          {bright.map((st, i) => (
            <circle key={`b${i}`} cx={f(st.x)} cy={f(st.y)} r={(st.r * 2.2).toFixed(1)} fill="#e0f2fe" opacity="0.07" />
          ))}
          <rect y="430" width="1600" height="400" fill={u("horizon")} />
          {lights}
          <path d={peaksBelow(far)} fill="#0b1b2e" />
          <path d={`M${far.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")}`} fill="none" stroke={u("rim")} strokeWidth="1.6" />
          <path d={fillBelow(near)} fill="#06111f" />
          <path d={fillBelow(ridgePts(826, 10, 109, 6))} fill="#030a14" />
          <path d={pines(-20, 430, 834, 113, 1)} fill="#02070f" />
          <path d={pines(1180, 1640, 834, 127, 0.85)} fill="#02070f" />
          <rect y="832" width="1600" height="168" fill={u("lake")} />
          {/* Kırpma DIŞ grupta: dönüşümlü öğede clipPath da dönüşür, göl kayardı. */}
          <g clipPath={u("lakeClip")}>
            <g opacity="0.45" filter={u("reflect")} transform="translate(0 1150) scale(1 -0.6)">
              {lights}
            </g>
          </g>
          {[852, 870, 893, 921, 954].map((y, i) => (
            <rect key={y} x={180 + i * 120} y={y} width={720 - i * 90} height="1.4" fill="#d9f99d" opacity={0.28 - i * 0.045} />
          ))}
        </>
      );
    }

    case "silk": {
      const lines = Array.from({ length: 72 }, (_, k) => {
        const t = k / 71;
        const pts = Array.from({ length: 9 }, (_, i) => {
          const x = -80 + (i / 8) * 1760;
          const twist = Math.sin(i * 0.8 + 1.2) * (1 - 2 * t);
          const y = 520 + Math.sin(i * 0.75 + t * 1.6) * 210 + twist * 120 + (t - 0.5) * 160;
          return [x, y] as Pt;
        });
        return { d: smooth(pts), o: 0.12 + Math.sin(t * Math.PI) * 0.55 };
      });
      return (
        <>
          <defs>
            <radialGradient id={g("bg")} cx="0.5" cy="0.5" r="0.75">
              <stop offset="0" stopColor="#1b1035" />
              <stop offset="1" stopColor="#07050f" />
            </radialGradient>
            <Linear id={g("ink")} user={[0, 0, 1600, 0]} stops={[[0, "#6366f1"], [0.35, "#a855f7"], [0.65, "#ec4899"], [1, "#fb923c"]]} />
            <filter id={g("bloom")} x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <Grain id={g("grain")} amount={0.05} />
          </defs>
          <rect width="1600" height="1000" fill={u("bg")} />
          <g filter={u("bloom")} opacity="0.55">
            {lines.filter((_, i) => i % 6 === 0).map((l, i) => (
              <path key={i} d={l.d} fill="none" stroke={u("ink")} strokeWidth="14" />
            ))}
          </g>
          <g fill="none" stroke={u("ink")} strokeWidth="1.3">
            {lines.map((l, i) => (
              <path key={i} d={l.d} opacity={l.o.toFixed(2)} />
            ))}
          </g>
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );
    }

    case "mesh":
      return (
        <>
          <defs>
            <filter id={g("blur")} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="120" />
            </filter>
            <Grain id={g("grain")} amount={0.08} />
          </defs>
          <rect width="1600" height="1000" fill="#0b0920" />
          <g filter={u("blur")}>
            <circle cx="380" cy="300" r="360" fill="#7c3aed" />
            <circle cx="1180" cy="230" r="320" fill="#ec4899" />
            <circle cx="1050" cy="800" r="330" fill="#f97316" />
            <circle cx="260" cy="860" r="300" fill="#0ea5e9" />
            <circle cx="760" cy="520" r="240" fill="#2563eb" opacity="0.9" />
            <circle cx="1450" cy="600" r="200" fill="#a855f7" opacity="0.8" />
          </g>
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );

    case "paper": {
      const sheets = [
        { base: 300, amp: 60, seed: 111, color: "#ddd6fe" },
        { base: 420, amp: 70, seed: 113, color: "#c7d2fe" },
        { base: 540, amp: 70, seed: 117, color: "#bae6fd" },
        { base: 660, amp: 65, seed: 121, color: "#fbcfe8" },
        { base: 780, amp: 60, seed: 127, color: "#fed7aa" },
        { base: 900, amp: 50, seed: 131, color: "#fde68a" },
      ];
      return (
        <>
          <defs>
            <filter id={g("shadow")} x="-5%" y="-20%" width="110%" height="140%">
              <feDropShadow dx="0" dy="-6" stdDeviation="9" floodColor="#4c1d95" floodOpacity="0.16" />
            </filter>
            <Linear id={g("bg")} stops={[[0, "#f5f3ff"], [1, "#ede9fe"]]} />
            {sheets.map((s, i) => (
              <Linear key={i} id={g(`p${i}`)} stops={[[0, s.color], [1, s.color, 0.85]]} />
            ))}
            <Grain id={g("grain")} amount={0.045} />
          </defs>
          <rect width="1600" height="1000" fill={u("bg")} />
          {sheets.map((s, i) => (
            <path key={i} d={fillBelow(ridgePts(s.base, s.amp, s.seed, 6))} fill={u(`p${i}`)} filter={u("shadow")} />
          ))}
          <rect width="1600" height="1000" filter={u("grain")} />
        </>
      );
    }
  }
}

type WallpaperProps = {
  scene: WallpaperScene;
  className?: string;
  /** Sahnenin üstüne (ör. masaüstü maketinin pencereleri). */
  children?: ReactNode;
};

export function Wallpaper({ scene, className, children }: WallpaperProps) {
  const id = `ui-wp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svg = (
    <svg
      aria-hidden
      data-wallpaper={scene}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block size-full", children ? "absolute inset-0" : className)}
    >
      <Scene scene={scene} id={id} />
    </svg>
  );
  if (!children) return svg;
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      {svg}
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Sahneyi PNG olarak indirir (yalnız tarayıcıda, kullanıcı tıklamasıyla çağır).
 * SVG serileştirilip tuvale çizilir; `width × height` oranı sahneden farklıysa
 * sahne kırpılarak doldurur (telefon dikeyinde merkezden).
 */
export async function downloadWallpaper(svg: SVGSVGElement, width: number, height: number, name = "duvar-kagidi") {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const src = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("PNG üretilemedi");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(png);
    a.download = `${name}-${width}x${height}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(src);
  }
}
