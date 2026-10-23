/**
 * Karakter kiti — kodla çizilen bir karakterin kuklası (rig): görünüşler,
 * duygular, oynanan geçişler, el hook'ları. Karakter "Mürekkep": yere
 * oturmuş, tepesi arkaya yatan bir mürekkep damlası; iki göz, kısa iki
 * kol, iki ayak. Kendi karakterini kurarken tabloları değiştir, mimariyi tut.
 *
 * Mimari: JohnHeibel/ClaudeAnimationBase `src/clawd.js` + `src/core.js`
 * (MIT © 2026 John Heibel) — çizilmiş görünüş tablosu + sekizde bire
 * oturan dönüş, veri olarak duygu tablosu, oynanan duygu geçişi, kol ucu
 * hook'ları, parça başına kaynama tohumu. Oradaki maskotun görünüşü, rengi,
 * adı ve çizimleri ALINMADI; karakter, palet ve kod bizim.
 *
 * Her şey t'nin SAF fonksiyonu (Math.random / Date yok, kareden kareye durum
 * yok). Renk hex değil TEMA TOKEN adı: `readPalette` çizimden önce çözer.
 * Kullanım ve sahneleme kuralları: reference/karakter.md.
 *
 *   VIEWS / spinView / turn   çizilmiş anahtar görünüşler; dönüş görünüşten görünüşe ADIM atar
 *   EMO / feel                duygu = yüz + renk + kendi boşta hareketi
 *   emotions                  oynanan geçiş: kısılma → yüz değişimi → tepki → oturma → renk → işaret
 *   take                      tepki ezilmesi (hazırlık + sönen squash/stretch)
 *   drawCharacter             bir kare; armL/armR/draw hook'ları
 *   handAt                    elin dünya konumu (atılan şey elden çıksın)
 */
import { blot, boilFrame, brush, clamp, ease, noise1, segment, span, type Point } from "./ink-engine";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Küçük öğe varışı (karakter tek küçük öğedir): ζ'si düşük, bir kez taşar. Renk ve opaklıkta KULLANMA. */
const backOut = ease.back;

/* ----------------------------------------------------------------------- */
/* Palet: token adları                                                       */
/* ----------------------------------------------------------------------- */

/** Tema token adı (`@ahmetakyapi/theme`): `--color-danger`, `--color-warning`… Hex yazılmaz. */
export type ToneToken = `--${string}`;

export type CharacterPalette = {
  ink: string;
  body: string;
  paper: string;
  blush: string;
  /** Token adını renge çevirir (duygu tonu, işaret rengi). */
  tone: (token: ToneToken) => string;
};

/** Token'ları kökten bir kez okur; filmin başında çağır, her karede değil. */
export function readPalette(
  el: Element,
  names: { ink?: ToneToken; body?: ToneToken; paper?: ToneToken; blush?: ToneToken } = {},
): CharacterPalette {
  const css = getComputedStyle(el);
  const cache = new Map<string, string>();
  const tone = (token: ToneToken) => {
    let v = cache.get(token);
    if (v === undefined) cache.set(token, (v = css.getPropertyValue(token).trim() || "currentColor"));
    return v;
  };
  return {
    ink: tone(names.ink ?? "--color-strong"),
    body: tone(names.body ?? "--color-surface"),
    paper: tone(names.paper ?? "--color-page"),
    blush: tone(names.blush ?? "--color-danger-wash"),
    tone,
  };
}

/* ----------------------------------------------------------------------- */
/* Görünüşler                                                                */
/* ----------------------------------------------------------------------- */

export type ViewName = "front" | "q" | "side" | "qback" | "back";
/** px: omuz x'i (u) · dir: −1 sola, 1 sağa, 0 profilde öne · layer 0 arkada, 1 önde, 2 arkada ve gölgede. */
type ArmSpec = { px: number; dir: -1 | 0 | 1; which: "L" | "R"; layer: 0 | 1 | 2 };
type ViewSpec = {
  /** Damla tepesinin x'i (u): dönüşte arkaya yatar, dönüş bununla okunur. */
  tipX: number;
  /** Yüz: merkez x, genişlik çarpanı, görünen gözler (−1 sol, 1 sağ), ağız x'i. Arkadan null. */
  face: { cx: number; fw: number; sides: number[]; mx: number } | null;
  /** [x, uzak mı] — uzak ayak soluk. */
  feet: [number, boolean][];
  arms: ArmSpec[];
};

/** Hepsi ekranın SAĞINA bakar; `flip` sola çevirir. Sayılar u biriminde. */
export const VIEWS: Record<ViewName, ViewSpec> = {
  front: { tipX: 0, face: { cx: 0, fw: 1, sides: [-1, 1], mx: 0 }, feet: [[-1.8, false], [1.8, false]],
           arms: [{ px: -4, dir: -1, which: "L", layer: 0 }, { px: 4, dir: 1, which: "R", layer: 0 }] },
  q:     { tipX: -1, face: { cx: 1.3, fw: 0.78, sides: [-1, 1], mx: 0.4 }, feet: [[-1.4, true], [1.6, false]],
           arms: [{ px: 3.8, dir: 1, which: "R", layer: 2 }, { px: -3.6, dir: -1, which: "L", layer: 1 }] },
  side:  { tipX: -1.8, face: { cx: 2.2, fw: 0.5, sides: [1], mx: 2.6 }, feet: [[-0.8, true], [0.9, false]],
           arms: [{ px: 0.8, dir: 0, which: "L", layer: 1 }] },
  qback: { tipX: -1, face: null, feet: [[1.4, true], [-1.6, false]],
           arms: [{ px: -3.8, dir: -1, which: "R", layer: 2 }, { px: 3.6, dir: 1, which: "L", layer: 1 }] },
  back:  { tipX: 0, face: null, feet: [[-1.8, false], [1.8, false]],
           arms: [{ px: -4, dir: -1, which: "R", layer: 0 }, { px: 4, dir: 1, which: "L", layer: 0 }] },
};

/** Yön (tur): 0 ön, 0,25 sağa, 0,5 arka, 0,75 (−0,25) sola. EN YAKIN SEKİZDE BİRE oturur: çizilmiş dönüş böyle çalışır. */
export function spinView(a: number): { view: ViewName; flip: boolean } {
  const K: [ViewName, boolean][] = [["front", false], ["q", false], ["side", false], ["qback", false],
    ["back", false], ["qback", true], ["side", true], ["q", true]];
  const [view, flip] = K[mod(Math.round(a * 8), 8)];
  return { view, flip };
}

/** t0–t1 arasında a0'dan a1'e dönüş: görünüşten görünüşe adım + arada smear. 3D izdüşüm YOK. */
export function turn(t: number, t0: number, t1: number, a0: number, a1: number) {
  const k = ease.inOut(span(t, t0, t1));
  return { ...spinView(lerp(a0, a1, k)), smear: t > t0 && t < t1 ? 0.55 * Math.sin(k * Math.PI) : 0, smearDir: 0 as const };
}

/* ----------------------------------------------------------------------- */
/* Görünüm seçenekleri                                                       */
/* ----------------------------------------------------------------------- */

export type EyeKind = "normal" | "wide" | "happy" | "closed" | "narrow" | "sad" | "angry";
export type MouthKind = "none" | "smile" | "frown" | "open" | "o" | "flat" | "wobble";
/** Boyanmış tepki işaretleri — HARF DEĞİL. */
export type EmoteKind = "bang" | "question" | "sweat" | "spark" | "heart" | "dots" | "cloud" | "sleep";
/** Hook'lar: kol ucunda kol uzayında (+x kol boyunca dışa), `draw` gövde uzayında. */
export type Hook = (ctx: Ctx, u: number, sw: number) => void;

type PoseField = "dx" | "dy" | "sq" | "rot" | "aL" | "aR" | "lookX" | "lookY";
export type Look = Partial<Record<PoseField, number>> & {
  view?: ViewName; flip?: boolean;
  /** Filmin kare hızı: boil tohumu kare sırasından türer (varsayılan 30). */
  fps?: number;
  /** 0–1 hızlı hareketin izi; smearDir ±1 (0 = iki yan, dönüş). */
  smear?: number; smearDir?: -1 | 0 | 1;
  /** Yürüyüş fazı (tur); null duruş. */
  walk?: number | null;
  eyes?: EyeKind | [EyeKind, EyeKind]; mouth?: MouthKind; squint?: number; blush?: number;
  tint?: ToneToken | null; tintK?: number; tintFrom?: ToneToken | null; tintFromK?: number;
  emote?: EmoteKind | null; emoteK?: number; emoteAge?: number;
  draw?: Hook; armL?: Hook; armR?: Hook;
  /** Kaynama anahtarı: karakter başına SABİT. Sahneye girip çıkan karakter varsa mutlaka ver. */
  id?: string;
  /** Göz kırpma fazı; iki karakter aynı anda kırpmasın. */
  seed?: number;
};

/* ----------------------------------------------------------------------- */
/* Duygular                                                                  */
/* ----------------------------------------------------------------------- */

const osc = (t: number, hz: number, ph = 0) => Math.sin((t * hz + ph) * TAU);

type Emotion = {
  eyes: EyeKind | [EyeKind, EyeKind]; mouth: MouthKind;
  tint?: ToneToken; tintK?: number; blush?: number; emote?: EmoteKind;
  /** Bu duyguya GİRERKEN tepkinin boyu (0,2 sakin … 1,3 sıçrama). */
  take: number;
  /** İşaret tek seferlik: 1,4–1,8 sn'de söner. */
  fade?: boolean;
  /** Boşta hareket: hiçbir duygu donmaz. */
  body: (t: number) => Look;
};

export const EMO = {
  neutral:   { eyes: "normal", mouth: "none", take: 0.3,
               body: (t) => ({ dy: -0.2 * Math.abs(osc(t, 0.5)), aL: 0.15 + 0.05 * osc(t, 0.5), aR: 0.15 - 0.05 * osc(t, 0.5) }) },
  happy:     { eyes: "happy", mouth: "smile", blush: 0.3, take: 0.6,
               body: (t) => ({ dy: -1 * Math.abs(osc(t, 1)), sq: 0.08 * Math.max(0, -osc(t, 2)), aL: 0.4 + 0.4 * osc(t, 1), aR: 0.4 - 0.4 * osc(t, 1) }) },
  excited:   { eyes: "wide", mouth: "open", emote: "spark", take: 1,
               body: (t) => ({ dy: -2 * Math.abs(osc(t, 2)), sq: -0.05 * Math.abs(osc(t, 2)), aL: 1 + 0.5 * osc(t, 4), aR: 1 - 0.5 * osc(t, 4) }) },
  sad:       { eyes: "sad", mouth: "frown", tint: "--color-primary-soft", tintK: 0.4, emote: "cloud", take: 0.3,
               body: (t) => ({ sq: 0.08 + 0.02 * osc(t, 0.25), rot: 0.03 * osc(t, 0.25), aL: -0.75, aR: -0.75, lookY: 0.5 }) },
  angry:     { eyes: "angry", mouth: "flat", tint: "--color-danger", tintK: 0.45, emote: "bang", take: 0.8,
               body: (t) => ({ dx: 0.1 * osc(t, 18), sq: 0.1 * Math.max(0, osc(t, 2)), aL: -0.3, aR: -0.3 }) },
  scared:    { eyes: "wide", mouth: "wobble", tint: "--color-muted", tintK: 0.5, emote: "sweat", take: 1.1,
               body: (t) => ({ dx: 0.1 * osc(t, 22), sq: -0.06, aL: 1 + 0.08 * osc(t, 17), aR: 1 + 0.08 * osc(t, 19) }) },
  surprised: { eyes: "wide", mouth: "o", emote: "bang", fade: true, take: 1.3,
               body: (t) => ({ sq: -0.12, dy: -0.3 - 0.15 * Math.abs(osc(t, 1)), aL: 1.1, aR: 1.1 }) },
  thinking:  { eyes: "normal", mouth: "flat", emote: "dots", take: 0.4,
               body: (t) => ({ lookX: 0.5, lookY: -0.8, rot: 0.05, aR: 0.9, aL: -0.3 + 0.2 * osc(t, 0.4), dy: -0.1 * Math.abs(osc(t, 0.5)) }) },
  proud:     { eyes: "closed", mouth: "smile", tint: "--color-warning", tintK: 0.3, emote: "spark", take: 0.5,
               body: (t) => ({ sq: -0.1 - 0.03 * Math.abs(osc(t, 0.5)), aL: -0.9, aR: -0.9, rot: 0.02 * osc(t, 0.5) }) },
  shy:       { eyes: "normal", mouth: "wobble", blush: 1, take: 0.3,
               body: (t) => ({ lookX: -0.7, lookY: 0.8, sq: 0.06, rot: -0.05 + 0.02 * osc(t, 0.25), aL: -0.55 + 0.15 * osc(t, 1.5), aR: -0.6 - 0.12 * osc(t, 1.5) }) },
  confused:  { eyes: ["narrow", "wide"], mouth: "wobble", emote: "question", take: 0.6,
               body: (t) => ({ rot: 0.1 * osc(t, 0.25), aL: 0.1, aR: 1.5 + 0.15 * osc(t, 3) }) },
  sleepy:    { eyes: "closed", mouth: "o", emote: "sleep", take: 0.2,
               body: (t) => ({ sq: 0.05 + 0.05 * osc(t, 0.3), rot: 0.06 * Math.sin(t * 0.8), aL: -0.6, aR: -0.6 }) },
  relieved:  { eyes: "closed", mouth: "smile", emote: "sweat", take: 0.4,
               body: (t) => ({ sq: 0.05 + 0.05 * osc(t, 0.35), aL: -0.7 + 0.1 * osc(t, 0.35), aR: -0.7 + 0.1 * osc(t, 0.35) }) },
} satisfies Record<string, Emotion>;

export type EmotionName = keyof typeof EMO;
const emo = (name: EmotionName): Emotion => EMO[name] ?? EMO.neutral;

/** Bir duygu, t anında canlı: yüz + renk + beden. Önce duygu, sonra poz: `{ ...feel("happy", t), view: "q" }`. */
export function feel(name: EmotionName, t: number, over: Look = {}): Look {
  const E = emo(name);
  return { eyes: E.eyes, mouth: E.mouth, tint: E.tint ?? null, tintK: E.tintK ?? 1, blush: E.blush ?? 0,
           emote: E.emote ?? null, ...E.body(t), ...over };
}

/** Tepki: 0,1 sn önce çökme (hazırlık), sonra sönen squash/stretch ve küçük sıçrama. */
export function take(t: number, t0: number, amt = 1) {
  if (t < t0 - 0.1) return { sq: 0, dy: 0 };
  if (t < t0) return { sq: 0.12 * amt * ease.inOut(span(t, t0 - 0.1, t0)), dy: 0 };
  const a = t - t0;
  return { sq: -0.26 * amt * Math.exp(-6 * a) * Math.cos(16 * a), dy: -1.2 * amt * Math.exp(-7 * a) * Math.max(0, Math.cos(9 * a)) };
}

export type EmoKey = [time: number, name: EmotionName, over?: Look];

/**
 * Oynanan duygu çizelgesi: `[[0, "sleepy"], [1.9, "surprised", { lookX: 0.8 }], [2.5, "happy"]]`.
 * Her değişimde: 0,1 sn önce gözler kısılır ve beden çöker → yüz kısılmanın ALTINDA değişir →
 * yeni duygunun boyunda tepki → beden 0,4 sn'de taşarak oturur → renk 0,3 sn'de geçer (taşmaz) →
 * işaret 0,06–0,32 sn'de belirir. `o.take` bütün tepkileri ölçekler. Yüzü elle iki kare arasında değiştirme.
 */
export function emotions(t: number, keys: EmoKey[], o: { take?: number } = {}): Look {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const [tc, name, over] = keys[i];
  const age = t - tc, E = emo(name), s = o.take ?? 1;
  const cur = feel(name, t, over);
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity;

  let squint = cur.squint ?? 0;
  if (tn - t < 0.1) squint = Math.max(squint, 1 - (tn - t) / 0.1);
  if (i > 0 && age < 0.14) squint = Math.max(squint, 1 - age / 0.14);

  const prev = i > 0 ? feel(keys[i - 1][1], t, keys[i - 1][2]) : null;
  if (prev && age < 0.5) {
    const base: Record<PoseField, number> = { dx: 0, dy: 0, sq: 0, rot: 0, aL: 0.2, aR: 0.2, lookX: 0, lookY: 0 };
    const k = backOut(span(age, 0, 0.4)), kc = ease.inOut(span(age, 0, 0.3));
    for (const f of Object.keys(base) as PoseField[]) cur[f] = lerp(prev[f] ?? base[f], cur[f] ?? base[f], k);
    cur.tintFrom = prev.tint ?? null;
    cur.tintFromK = (prev.tintK ?? 1) * (1 - kc);
    cur.tintK = (cur.tintK ?? 1) * kc;
    cur.blush = lerp(prev.blush ?? 0, cur.blush ?? 0, kc);
  }
  const t1 = prev ? take(t, tc, E.take * s) : { sq: 0, dy: 0 };
  const t2 = i + 1 < keys.length ? take(t, tn, emo(keys[i + 1][1]).take * s) : { sq: 0, dy: 0 };
  cur.sq = (cur.sq ?? 0) + t1.sq + t2.sq;
  cur.dy = (cur.dy ?? 0) + t1.dy + t2.dy;
  cur.squint = squint;

  const same = prev !== null && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : span(age, 0.06, 0.32) * (E.fade && !over?.emote ? 1 - span(age, 1.4, 1.8) : 1);
  cur.emoteAge = age;
  return cur;
}

/* ----------------------------------------------------------------------- */
/* Çizim                                                                     */
/* ----------------------------------------------------------------------- */

/** Parça başına sabit tohum (FNV-1a): kıpırdayan kol gövdeyi ya da öbür karakteri yeniden kaynatmaz. */
export function partSeed(id: string, part: string) {
  let h = 2166136261;
  for (const c of `${id}|${part}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 100000;
}

const BODY_CY = -5.2, BODY_R = 4.2, TIP_Y = -11, SHOULDER_Y = -5.2, ARM_LEN = 2.4;

/** Damla gövdesi: alt daire + arkaya yatan tepe; kenar kaynar. */
function dropPts(u: number, tipX: number, seed: number, boil: number, n = 48): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const r = BODY_R * u * (1 + noise1(seed + boil * 7919, (i % n) * 0.45) * 0.025);
    const f = Math.pow(Math.max(0, -Math.sin(a)), 6);
    pts.push({ x: lerp(Math.cos(a) * r, tipX * u, f), y: lerp(BODY_CY * u + Math.sin(a) * r, TIP_Y * u, f) });
  }
  return pts;
}

function fillPath(ctx: Ctx, pts: Point[], color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha; // çağıranın opaklığını çarpar, restore geri verir
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Kolun açısı (tuval, y aşağı): +a kaldırır. */
const armAngle = (dir: number, a: number) => (dir < 0 ? Math.PI + a : -(a * 0.8 + 0.2));

function armTipLocal(spec: ArmSpec, a: number, u: number): Point & { th: number } {
  const lift = spec.dir === 0 ? 0 : spec.dir * 0.5 * clamp((Math.abs(a) - 0.7) / 0.9);
  const px = (spec.px + lift) * u, py = SHOULDER_Y * u;
  const th = armAngle(spec.dir, a), len = ARM_LEN * u * (spec.dir === 0 ? 1.1 : 1);
  return { x: px + Math.cos(th) * len, y: py + Math.sin(th) * len, th };
}

/** Gövde uzayı → dünya: drawCharacter'ın tuval dönüşümüyle AYNI sıra (öteleme → dönüş → ölçek). */
function bodyFrame(x: number, y: number, u: number, o: Look) {
  const sq = o.sq ?? 0, sm = clamp(o.smear ?? 0);
  const ox = x + (o.dx ?? 0) * u, oy = y + (o.dy ?? 0) * u, rot = o.rot ?? 0;
  const sx = (o.flip ? -1 : 1) * (1 + sq * 0.6) * (1 + sm * 0.35), sy = 1 - sq;
  return { ox, oy, rot, sx, sy, toWorld: (p: Point): Point => {
    const qx = p.x * sx, qy = p.y * sy, c = Math.cos(rot), s = Math.sin(rot);
    return { x: ox + qx * c - qy * s, y: oy + qx * s + qy * c };
  } };
}

/** Elin dünya konumu: tutulan şey elde, atılan şey buradan çıkar (karakter.md § temaslar). */
export function handAt(x: number, y: number, u: number, o: Look, which: "L" | "R"): Point {
  const V = VIEWS[o.view ?? "front"], spec = V.arms.find((a) => a.which === which) ?? V.arms[0];
  const a = which === "L" ? (o.aL ?? 0.2) : (o.aR ?? 0.2);
  return bodyFrame(x, y, u, o).toWorld(armTipLocal(spec, a, u));
}

function eye(ctx: Ctx, kind: EyeKind, side: number, u: number, sw: number, o: Look, pal: CharacterPalette, seed: number, bf: number, blink: boolean) {
  const lx = (o.lookX ?? 0) * u * 0.45, ly = (o.lookY ?? 0) * u * 0.35, sq = clamp(o.squint ?? 0);
  const line = (pts: [number, number][], w = 1.2) =>
    brush(ctx, pts.map(([a, b]) => ({ x: a * u + lx, y: b * u + ly })), { width: sw * w, taper: 0.3, seed, boil: bf, color: pal.ink });
  if (blink || sq > 0.8) return line([[-0.55, 0.1], [0, 0.18], [0.55, 0.1]]);
  const oval = (rx: number, ry: number) => {
    const r = Math.sqrt(rx * ry) * u;
    blot(ctx, lx, ly, r, { seed, boil: bf, color: pal.ink, squash: Math.sqrt(ry / rx), scaleY: 1 - sq });
    if (u > 9 && sq < 0.5) blot(ctx, lx - rx * 0.3 * u, ly - ry * 0.35 * u, u * 0.14, { seed: seed + 1, color: pal.paper });
  };
  switch (kind) {
    case "normal": return oval(0.45, 0.9);
    case "wide": return oval(0.58, 1.2);
    case "narrow": return oval(0.55, 0.32);
    case "happy": return line([[-0.6, 0.35], [0, -0.35], [0.6, 0.35]]);
    case "closed": return line([[-0.6, 0], [0, 0.35], [0.6, 0]]);
    // Kaş yönü tek ters çevirmeyle "üzgün"den "kızgın"a döner: iç uç YUKARI üzgün, AŞAĞI kızgın.
    case "sad": oval(0.42, 0.75); return line([[-side * 0.7, -1.05], [side * 0.6, -1.35]], 0.9);
    case "angry": oval(0.45, 0.8); return line([[-side * 0.7, -1.4], [side * 0.6, -0.95]], 1.1);
  }
}

function mouth(ctx: Ctx, kind: MouthKind, u: number, sw: number, pal: CharacterPalette, seed: number, bf: number) {
  const line = (pts: [number, number][]) => brush(ctx, pts.map(([a, b]) => ({ x: a * u, y: b * u })), { width: sw, taper: 0.4, seed, boil: bf, color: pal.ink });
  switch (kind) {
    case "none": return;
    case "smile": return line([[-0.8, -3.6], [0, -3.1], [0.8, -3.6]]);
    case "frown": return line([[-0.7, -3.1], [0, -3.5], [0.7, -3.1]]);
    case "flat": return line([[-0.6, -3.4], [0.6, -3.35]]);
    case "wobble": return line([[-0.8, -3.35], [-0.4, -3.55], [0, -3.35], [0.4, -3.55], [0.8, -3.35]]);
    case "open": return blot(ctx, 0, -3.3 * u, 0.6 * u, { seed, boil: bf, color: pal.ink, scaleY: 0.8 });
    case "o": return blot(ctx, 0, -3.35 * u, 0.32 * u, { seed, boil: bf, color: pal.ink });
  }
}

/** Boyanmış işaret; k 0–1 beliriş (tek küçük öğe: taşabilir), age döngülü olanları sürer. */
function emote(ctx: Ctx, kind: EmoteKind, x: number, y: number, s: number, k: number, age: number, pal: CharacterPalette, seed: number, bf: number) {
  const p = backOut(clamp(k));
  if (p < 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  const stroke = (pts: [number, number][], w: number, color = pal.ink) =>
    brush(ctx, pts.map(([a, b]) => ({ x: a * s, y: b * s })), { width: w * s, taper: 0.8, taperStart: 0.2, seed, boil: bf, color });
  const dot = (dx: number, dy: number, r: number, color = pal.ink) => blot(ctx, dx * s, dy * s, r * s, { seed: seed + 3, boil: bf, color });
  switch (kind) {
    case "bang": ctx.rotate(0.1 + 0.08 * Math.sin(age * 16) * Math.exp(-age * 3)); stroke([[0, -2.3], [0, -0.6]], 0.9); dot(0, 0.4, 0.38); break;
    case "question": stroke([[-0.9, -1.5], [-0.3, -2.3], [0.7, -2], [0.6, -1.1], [0, -0.6], [0, -0.1]], 0.6); dot(0, 0.6, 0.32); break;
    case "sweat": blot(ctx, 0, 0, 0.55 * s, { seed, boil: bf, color: pal.tone("--color-primary-soft"), scaleY: 1.4 }); break;
    case "spark": for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + age * 0.6; stroke([[0, 0], [Math.cos(a) * 1.3, Math.sin(a) * 1.3]], 0.45, pal.tone("--color-warning")); } break;
    case "heart": { const h: [number, number][] = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; h.push([Math.pow(Math.sin(a), 3), -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]); }
      fillPath(ctx, h.map(([a, b]) => ({ x: a * s, y: b * s })), pal.tone("--color-danger")); break; }
    case "dots": for (let i = 0; i < 3; i++) if (mod(age, 1.2) > i * 0.3) dot(-1 + i, 0, 0.28); break;
    case "cloud": [[-0.8, 0, 0.7], [0, -0.4, 0.9], [0.9, 0, 0.65]].forEach(([a, b, r], i) => blot(ctx, a * s, b * s, r * s, { seed: seed + i, boil: bf, color: pal.tone("--color-muted") })); break;
    case "sleep": for (let i = 0; i < 3; i++) { const z = mod(age * 0.5 + i / 3, 1), r = 0.25 + 0.3 * z; stroke([[-r + z, -z * 2.4], [z, -z * 2.4 + r * 0.6], [r + z, -z * 2.4]], 0.35 * (1 - z)); } break;
  }
  ctx.restore();
}

const TOP_EMOTES: EmoteKind[] = ["cloud", "sleep", "spark"];

/** Bir kare. (x, y) iki ayak arasındaki yer noktası; u boy birimi (gövde ~8,4u × 11u). */
export function drawCharacter(ctx: Ctx, t: number, x: number, y: number, u: number, o: Look, pal: CharacterPalette) {
  const id = o.id ?? "murekkep", seed = (part: string) => partSeed(id, part);
  const bf = boilFrame(t, o.fps ?? 30); // kaynama: saniyede 12, kare sırasından (obtüratör boyunca sabit)
  const V = VIEWS[o.view ?? "front"], sm = clamp(o.smear ?? 0), sw = clamp(u / 12, 0.6, 5);
  const F = bodyFrame(x, y, u, o);

  // Gölge yerde kalır, sıçrayınca küçülür.
  const f = 1 - Math.min(0.5, Math.abs(o.dy ?? 0) * 0.06);
  blot(ctx, x + (o.dx ?? 0) * u, y + 0.15 * u, Math.sqrt(4.6 * 0.8) * u * f, { seed: seed("shadow"), color: pal.ink, alpha: 0.16, squash: Math.sqrt(0.8 / 4.6) });

  if (sm > 0.05) {
    const sides = (o.smearDir ?? (o.flip ? -1 : 1)) === 0 ? [-1, 1] : [-(o.smearDir ?? (o.flip ? -1 : 1))];
    for (const s of sides) for (let i = 0; i < 4; i++) {
      const yy = F.oy - (9 - i * 1.8) * u, x0 = F.ox + s * 4 * u, len = (2.5 + 2 * mod(i * 0.618 + s, 1)) * u * sm;
      brush(ctx, segment({ x: x0, y: yy }, { x: x0 + s * len, y: yy }), { width: 0.5 * u * sm, dry: 0.6, seed: seed("smear" + i), boil: bf, color: pal.ink, alpha: 0.35 });
    }
  }

  ctx.save();
  ctx.translate(F.ox, F.oy);
  ctx.rotate(F.rot);
  ctx.scale(F.sx, F.sy);

  const arm = (spec: ArmSpec) => {
    const a = spec.which === "L" ? (o.aL ?? 0.2) : (o.aR ?? 0.2), hook = spec.which === "L" ? o.armL : o.armR;
    const tip = armTipLocal(spec, a, u);
    const root = { x: (spec.px + (spec.dir === 0 ? 0 : spec.dir * 0.5 * clamp((Math.abs(a) - 0.7) / 0.9))) * u, y: SHOULDER_Y * u };
    brush(ctx, segment(root, tip), { width: 0.85 * u, taper: 0.45, taperStart: 0, seed: seed("arm" + spec.which), boil: bf, color: pal.ink, alpha: spec.layer === 2 ? 0.7 : 1 });
    if (hook) {
      ctx.save();
      ctx.translate(tip.x, tip.y);
      ctx.rotate(tip.th);
      if (spec.dir < 0) ctx.scale(1, -1); // kol uzayında "yukarı" hep yukarı
      hook(ctx, u, sw);
      ctx.restore();
    }
  };

  V.arms.filter((a) => a.layer !== 1).forEach(arm);
  V.feet.forEach(([fx, far], i) => {
    const lift = o.walk == null ? 0 : Math.max(0, Math.sin((o.walk + (i % 2 ? 0.5 : 0)) * TAU)) * 0.8;
    blot(ctx, fx * u, (-0.55 - lift) * u, 0.75 * u, { seed: seed("foot" + i), boil: bf, color: pal.ink, alpha: far ? 0.7 : 1, squash: 0.75 });
  });

  const body = dropPts(u, V.tipX, seed("body"), bf);
  fillPath(ctx, body, pal.body);
  if (o.tintFrom && (o.tintFromK ?? 0) > 0.01) fillPath(ctx, body, pal.tone(o.tintFrom), 0.55 * (o.tintFromK ?? 0));
  if (o.tint && (o.tintK ?? 0) > 0.01) fillPath(ctx, body, pal.tone(o.tint), 0.55 * (o.tintK ?? 0));
  brush(ctx, body, { width: sw * 1.6, taper: 0, wobble: 0.1, seed: seed("outline"), boil: bf, color: pal.ink });

  if (V.face) {
    const Fc = V.face;
    ctx.save();
    ctx.translate(Fc.cx * u, 0);
    ctx.scale(Fc.fw, 1);
    if ((o.blush ?? 0) > 0.01) for (const s of Fc.sides) blot(ctx, s * 2.6 * u, -4.4 * u, 0.7 * u, { seed: seed("blush" + s), color: pal.blush, alpha: clamp(o.blush ?? 0), squash: 0.7 });
    const kinds: [EyeKind, EyeKind] = Array.isArray(o.eyes) ? o.eyes : [o.eyes ?? "normal", o.eyes ?? "normal"];
    const blinkable = (k: EyeKind) => k === "normal" || k === "wide";
    const blinkOn = mod(t * 0.9 + (o.seed ?? 0) * 1.7, 3.3) < 0.12;
    for (const s of Fc.sides) {
      ctx.save();
      ctx.translate(s * 1.6 * u, -6 * u);
      if (sm > 0.5) brush(ctx, segment({ x: -0.7 * u, y: 0 }, { x: 0.7 * u, y: 0 }), { width: sw * 1.4, seed: seed("eye" + s), boil: bf, color: pal.ink });
      else { const k = kinds[s < 0 ? 0 : 1]; eye(ctx, k, s, u, sw, o, pal, seed("eye" + s), bf, blinkable(k) && blinkOn); }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(Fc.mx * u, 0);
    mouth(ctx, o.mouth ?? "none", u, sw, pal, seed("mouth"), bf);
    ctx.restore();
    ctx.restore();
  }

  V.arms.filter((a) => a.layer === 1).forEach(arm);
  o.draw?.(ctx, u, sw);
  ctx.restore();

  if (o.emote) {
    const top = TOP_EMOTES.includes(o.emote), dir = o.flip ? -1 : 1;
    const at = top ? F.toWorld({ x: V.tipX * u, y: (TIP_Y - 2.2) * u }) : F.toWorld({ x: 5.2 * u, y: -9.4 * u });
    emote(ctx, o.emote, top ? at.x : F.ox + dir * 5.2 * u, at.y, u * 0.9, o.emoteK ?? 1, o.emoteAge ?? t, pal, seed("emote"), bf);
  }
}
