/**
 * Film kiti — `ink-engine.ts` üstüne kurulan, filmden filme taşınan parçalar.
 *
 * Kaynak: Açılış Zili'nin Claude analizi bekleme filmi (`lib/ink/analysis-film.ts`).
 * Orada tek bir filme gömülüydü; burada genel API ile. Her fonksiyon SAF:
 * girdisi zaman ve geometri, çıktısı tuvaldeki çizim ya da bir sayı.
 *
 * İçindekiler (ayrıntı: reference/*.md):
 *   kinetic        dev yazı, harf harf maskeden yükselir, hızlıyken iz bırakır
 *   tag            küçük künye, kâğıt renginde haleyle
 *   followCamera   ucu geriden + önden ortalamayla izleyen kamera
 *   withCamera     dünya → ekran dönüşümü (tek fonksiyon)
 *   penTiming      kalem zamanı eğriliğe göre, basınç hıza göre
 *   floodPath      mürekkep seli kenarı (periyodik dalga)
 *   inverted       aynı dünyayı ters paletle selin içine çizme
 *   teardrop       kalemin durduğu yerde sarkık damla
 *   seal           oyma yazılı mühür, basılınca ezilip toparlanır
 *   fibres         dünyaya bağlı kâğıt lifleri
 *   cuesBetween    (t0, t1] aralığındaki ses olayları
 *   glyphX         kerning'li koşuda i. harfin x'i (parça parça çizim, silme)
 *   beatAt / timeOfBeat   ölçülmüş vuruş ızgarasında zaman ↔ kesirli vuruş
 *   hit            onset listesinden sönen darbe (vuruşa tepki, durumsuz)
 *   wordProgress   kelimenin söylenen kesri, hece hece parçalı
 *   lyric          sözü İÇERİĞİYLE bul; yoksa fırlat
 *   cutAt / downbeatAfter  kurgu sınırını sözden ve ızgaradan türet
 */
import { clamp, damped, ease, noise1, rng, span, splatter, type Point } from "./ink-engine";

type Ctx = CanvasRenderingContext2D;
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Önce geri, sonra ileri (anticipation); sonda taşma YOK. */
export const backIn = (x: number) => 2.2 * x * x * x - 1.2 * x * x;

/* ----------------------------------------------------------------------- */
/* Dev yazı                                                                  */
/* ----------------------------------------------------------------------- */

export const displayFont = (family: string, size: number, weight = 850) => `${weight} ${size}px ${family}`;

/** Genişliğe ve tavana göre dev yazının puntosu. */
export function fitSize(ctx: Ctx, family: string, text: string, width: number, max: number, weight = 850) {
  ctx.font = displayFont(family, 100, weight);
  return Math.min(max, (width / (ctx.measureText(text).width || 1)) * 100);
}

/**
 * Kinetik kelime: harfler satırın maskesinden sırayla yükselir; çıkışta önce
 * hafifçe çöker (anticipation) sonra yukarı kaçar. Harf yerleri `glyphX`ten:
 * sol komşusuyla kerning çifti dahil. Hızlı harfin arkasında iki soluk kopya:
 * hareket bulanıklığının bulanıksız karşılığı (smear).
 *
 * Maske: üstte 1,02em, altta 0,3em — Türkçe imler (İ, Ü, Ö) ve kuyruklar
 * (ğ, ş, ç) kesilmesin.
 */
export function kinetic(ctx: Ctx, text: string, o: {
  x: number; y: number; size: number; family: string; color: string; t: number;
  inAt: number; outAt?: number; align?: "left" | "center" | "right"; stagger?: number; alpha?: number; weight?: number;
}) {
  const stagger = o.stagger ?? 0.045, dur = 0.55, outDur = 0.42;
  if (o.t < o.inAt) return null;
  if (o.outAt !== undefined && o.t > o.outAt + (text.length - 1) * stagger + outDur) return null;
  ctx.save();
  ctx.font = displayFont(o.family, o.size, o.weight);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const total = ctx.measureText(text).width;
  const x0 = o.align === "left" ? o.x : o.align === "right" ? o.x - total : o.x - total / 2;
  ctx.beginPath();
  ctx.rect(x0 - o.size * 0.2, o.y - o.size * 1.02, total + o.size * 0.4, o.size * 1.32);
  ctx.clip();
  ctx.fillStyle = o.color;
  const rise = o.size * 1.05;
  const at = (tt: number, i: number) => {
    const k = span(tt, o.inAt + i * stagger, o.inAt + i * stagger + dur);
    const l = o.outAt === undefined ? 0 : span(tt, o.outAt + i * stagger, o.outAt + i * stagger + outDur);
    return { k, y: rise * (1 - ease.out(k)) - rise * backIn(l) };
  };
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") continue;
    const now = at(o.t, i), v = at(o.t + 0.03, i).y - now.y;
    const lx = x0 + glyphX(ctx, text, i);
    const a = (o.alpha ?? 1) * (0.35 + 0.65 * ease.out(now.k));
    if (Math.abs(v) > o.size * 0.02) for (const [m, ga] of [[2.2, 0.16], [1.1, 0.3]] as const) {
      ctx.globalAlpha = a * ga; ctx.fillText(text[i], lx, o.y + now.y - v * m);
    }
    ctx.globalAlpha = a;
    ctx.fillText(text[i], lx, o.y + now.y);
  }
  ctx.restore();
  return { x0, width: total };
}

/**
 * Tek kerning'li koşu olarak dizilmiş `text`te i. harfin başladığı x (font
 * `ctx.font`ta kurulu olmalı). `text[i..]` ayrı çizilecekse oraya konur.
 *
 * `measureText(text.slice(0, i))` YANLIŞ: ön ek i−1'de biter ve sonraki harfi
 * görmez, (i−1, i) kerning çifti düşer ("AV", "Yo", "Ta" arası açılır). Harfi
 * ön eke katıp kendi ilerlemesini çıkarınca çift ölçünün içinde kalır. Her
 * harf tek ölçüden hesaplandığı için hata birikmez; son harfin x'i + ilerlemesi
 * bütün koşunun genişliğine eşittir. Ligatür (fi, fl) ve bağlamsal biçim
 * bölünmez: silme gerekiyorsa koşuyu parçalama, bütününü kırp (kinetik-yazi.md).
 * `ctx.letterSpacing` ölçerken "0px" kalsın; izleme gerekiyorsa `i × izleme` ekle.
 */
export function glyphX(ctx: Ctx, text: string, i: number) {
  if (i <= 0) return 0;
  if (i >= text.length) return ctx.measureText(text).width;
  return ctx.measureText(text.slice(0, i + 1)).width - ctx.measureText(text[i]).width;
}

/** Küçük künye: maskeden yükselen tek satır, altında kâğıt renginde hale (çizgi içinden geçse de okunur). */
export function tag(ctx: Ctx, text: string, x: number, y: number, k: number, o: { family: string; color: string; halo: string; size?: number; align?: CanvasTextAlign; alpha?: number }) {
  if (k <= 0) return;
  const size = o.size ?? 12;
  ctx.save();
  ctx.font = `700 ${size}px ${o.family}`;
  ctx.textAlign = o.align ?? "left";
  ctx.beginPath(); ctx.rect(x - 400, y - size * 1.1, 800, size * 1.45); ctx.clip();
  ctx.globalAlpha = (o.alpha ?? 1) * ease.out(k);
  const ty = y + size * 1.1 * (1 - ease.out(k));
  ctx.strokeStyle = o.halo; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.strokeText(text, x, ty);
  ctx.fillStyle = o.color; ctx.fillText(text, x, ty);
  ctx.restore();
}

/* ----------------------------------------------------------------------- */
/* Kamera                                                                    */
/* ----------------------------------------------------------------------- */

export type Cam = { x: number; y: number; z: number };

/** Dünya noktası (cam.x, cam.y) ekranın ortasına; ölçek z. Sel, iris gibi ekran efektleri `toScreen` ile. */
export function withCamera(ctx: Ctx, cam: Cam, w: number, h: number, draw: () => void) {
  ctx.save();
  ctx.translate(w / 2, h / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  draw();
  ctx.restore();
}
export const toScreen = (p: Point, cam: Cam, w: number, h: number) => ({ x: (p.x - cam.x) * cam.z + w / 2, y: (p.y - cam.y) * cam.z + h / 2 });

/**
 * Ucu izleyen kamera: `subjectAt(t)` noktasının t−lag … t+lead ortalaması
 * (geride kalma + önden sezme; kilitli takip mekanik durur). Görünür alan
 * dünyanın dışına taşmasın diye merkez kenardan yarım pencere içeride.
 *
 * DERS (Açılış Zili, 640 ölçümü): yakın planda HIZLI giden bir nesneyi geniş
 * pencereyle izleme — kamera geride kalır, nesne kadrajdan çıkar. Hızlı yolda
 * pencereyi daralt (lag ~0,12, lead ~0,08) VE kamerayı aç (zoom'u düşür).
 */
export function followCamera(subjectAt: (t: number) => Point, t: number, o: { z: number; w: number; h: number; lag?: number; lead?: number; samples?: number }): Cam {
  const lag = o.lag ?? 0.45, lead = o.lead ?? 0.25, n = o.samples ?? 8;
  let x = 0, y = 0;
  for (let k = 0; k < n; k++) { const q = subjectAt(t - lag + (k / (n - 1)) * (lag + lead)); x += q.x / n; y += q.y / n; }
  const hw = o.w / 2 / o.z, hh = o.h / 2 / o.z;
  return {
    x: clamp(x, Math.min(hw, o.w / 2), Math.max(o.w - hw, o.w / 2)),
    y: clamp(y, Math.min(hh, o.h / 2), Math.max(o.h - hh, o.h / 2)),
    z: o.z,
  };
}

/* ----------------------------------------------------------------------- */
/* Kalem                                                                     */
/* ----------------------------------------------------------------------- */

/**
 * Kalemin zamanı ve basıncı. Gerçek el keskin dönüşte yavaşlar, düzlükte
 * hızlanır; yavaş çizgi kalın, hızlı çizgi ince (lemo-opuscar one-line).
 *
 * `at(k)`: zaman kesri (0–1, istediğin easing'den geçmiş) → yay kesri (fırçanın
 * `progress`i) ve kesirli nokta sırası (uç, çentik, kamera için).
 * `pressure`: nokta başına çarpan; `brush({ pressure })`a ver.
 * `pools`: mürekkebin göllendiği keskin dönüşlerin sırası.
 */
export function penTiming(pts: Point[], o: { turnWeight?: number; poolTurn?: number } = {}) {
  const n = pts.length, K = o.turnWeight ?? 2.5;
  const seg = pts.map((q, i) => i ? Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0);
  const turn = pts.map((q, i) => {
    if (!i || i === n - 1) return 0;
    const a1 = Math.atan2(q.y - pts[i - 1].y, q.x - pts[i - 1].x), a2 = Math.atan2(pts[i + 1].y - q.y, pts[i + 1].x - q.x);
    return Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1)));
  });
  const cumT = [0], cumA = [0];
  for (let i = 1; i < n; i++) { cumA.push(cumA[i - 1] + seg[i]); cumT.push(cumT[i - 1] + seg[i] * (1 + K * turn[i])); }
  const at = (k: number) => {
    const target = clamp(k) * cumT[n - 1];
    let i = 1;
    while (i < n - 1 && cumT[i] < target) i++;
    const f = clamp((target - cumT[i - 1]) / (cumT[i] - cumT[i - 1] || 1));
    return { arc: (cumA[i - 1] + f * seg[i]) / (cumA[n - 1] || 1), idx: i - 1 + f };
  };
  const pressure = turn.map((_, i) => {
    const tv = (turn[Math.max(0, i - 1)] + turn[i] * 2 + turn[Math.min(n - 1, i + 1)]) / 4;
    return 0.7 + 0.75 * Math.exp(-2.2 / (1 + K * tv));
  });
  const pools = turn.map((v, i) => (v >= (o.poolTurn ?? 0.75) ? i : -1)).filter(i => i > 0);
  /** Kesirli sıradan uç noktası. */
  const nib = (idx: number, along: Point[] = pts) => {
    const i = Math.min(n - 2, Math.floor(idx)), f = idx - i;
    return { x: lerp(along[i].x, along[i + 1].x, f), y: lerp(along[i].y, along[i + 1].y, f) };
  };
  return { at, pressure, pools, nib, turn };
}

/** Kalemin kâğıda düşen düz gölgesi (bulanık değil): ışık sol üstten, kalem sağ üste uzanır. */
export function penShadow(ctx: Ctx, nib: Point, color: string, alpha = 0.075) {
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(nib.x + 3, nib.y + 2); ctx.lineTo(nib.x + 88, nib.y - 52); ctx.lineTo(nib.x + 96, nib.y - 40); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ----------------------------------------------------------------------- */
/* Sel: sert açık/koyu geçiş                                                  */
/* ----------------------------------------------------------------------- */

/** Selin kenarı: açının periyodik dalgası (değer gürültüsü 0/2π'de kırık bırakır, küçükken çiçek gibi okunur). */
export function floodPath(ctx: Ctx, x: number, y: number, r: number, seed: number, t: number) {
  ctx.beginPath();
  const n = 96, jag = Math.min(0.07, 4 / Math.max(r, 1));
  const ph = [noise1(seed, 0.5), noise1(seed, 1.5), noise1(seed, 2.5)].map(v => v * Math.PI);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + jag * (0.55 * Math.sin(3 * a + ph[0] + t * 0.9) + 0.3 * Math.sin(5 * a + ph[1] - t * 0.6) + 0.15 * Math.sin(8 * a + ph[2] + t * 1.3));
    const px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Ekranın en uzak köşesine uzaklık: sel bu yarıçapta ekranı tamamen kaplar. */
export const coverRadius = (x: number, y: number, w: number, h: number) =>
  Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) * 1.06;

/**
 * Selin "sınırı geçen çizgi rengini orada değiştirir" etkisi: dünya bir kez
 * normal paletle, bir kez de TERS paletle selin içine kırpılarak çizilir.
 * Sel tamamen kaplıyorsa ilk geçiş atlanır (maliyet tek geçiş).
 */
export function inverted<P extends { ink: string; paper: string }>(ctx: Ctx, flood: { x: number; y: number; r: number; R: number } | null, pal: P, swap: (p: P) => P, draw: (p: P) => void, seed: number, t: number) {
  if (!flood || flood.r < flood.R) draw(pal);
  if (!flood) return 0;
  ctx.save();
  floodPath(ctx, flood.x, flood.y, flood.r, seed, t);
  ctx.fillStyle = pal.ink; ctx.fill(); ctx.clip();
  draw(swap(pal));
  ctx.restore();
  return clamp(flood.r / flood.R);
}

/* ----------------------------------------------------------------------- */
/* Damla, mühür, kâğıt                                                       */
/* ----------------------------------------------------------------------- */

/** Kalemin durduğu yer: ucu yukarıda, karnı sarkan damla ve kenarında gelgit çizgisi (yuvarlak leke ben gibi okunur). */
export function teardrop(ctx: Ctx, x: number, y: number, r: number, o: { color: string; alpha?: number; boil?: number; seed: number }) {
  if (r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1; ctx.fillStyle = o.color;
  ctx.beginPath();
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, top = Math.max(0, -Math.sin(a));
    const rr = r * (1 + noise1(o.seed + (o.boil ?? 0) * 7919, (i % n) * 0.5) * 0.06);
    const px = x + Math.cos(a) * rr * (1 - top * 0.72), py = y + Math.sin(a) * rr * (a > Math.PI ? 1.55 : 1.12) + r * 0.25;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = (o.alpha ?? 1) * 0.35; ctx.lineWidth = Math.max(0.6, r * 0.18); ctx.strokeStyle = o.color; ctx.stroke();
  ctx.restore();
}

/**
 * Mühür: köşeleri hafif düzensiz kare, yazı içinden OYULUR (tuval delinir,
 * arkadaki kâğıt görünür). `k` basılıştan bu yana saniye: büyükten iner
 * (0–0,42), değince ezilip toparlanır (tek küçük öğe, yaylı taşma serbest),
 * kenarından boya sıçrar. Pürüzler yalnız kenar bandında (ortada harf yanında
 * nokta gibi okunur).
 */
export function seal(ctx: Ctx, x: number, y: number, size: number, k: number, o: { text: string; fill: string; family: string; seed: number; boil?: number }) {
  if (k <= 0) return;
  const land = span(k, 0, 0.42), settle = k - 0.42;
  const scale = land < 1 ? lerp(1.7, 1, ease.in(land)) : 1 + damped(settle, 2.6, 7) * -0.12;
  const squash = land < 1 ? 1 : 1 - damped(settle, 2.6, 7) * 0.18;
  const s = size * scale;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(-0.06); ctx.scale(1 / squash, squash);
  ctx.globalAlpha = ease.out(span(k, 0, 0.2));
  const r = rng(o.seed + (o.boil ?? 0));
  const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([px, py]) => ({ x: px * s / 2 + (r() - 0.5) * s * 0.05, y: py * s / 2 + (r() - 0.5) * s * 0.05 }));
  ctx.beginPath(); ctx.moveTo((c[0].x + c[1].x) / 2, c[0].y);
  for (let i = 0; i < 4; i++) { const a = c[(i + 1) % 4], b = c[(i + 2) % 4]; ctx.arcTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2, s * 0.14); }
  ctx.closePath(); ctx.fillStyle = o.fill; ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.font = `850 ${s * 0.4}px ${o.family}`;
  const fs = s * 0.4 * Math.min(1, (s * 0.76) / (ctx.measureText(o.text).width || 1));
  ctx.font = `850 ${fs}px ${o.family}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(o.text, 0, s * 0.03);
  for (let i = 0; i < 9; i++) {
    const side = Math.floor(r() * 4), along = (r() - 0.5) * s * 0.85, inset = s * (0.36 + r() * 0.08);
    const [px, py] = side === 0 ? [along, -inset] : side === 1 ? [inset, along] : side === 2 ? [along, inset] : [-inset, along];
    ctx.beginPath(); ctx.arc(px, py, s * (0.006 + r() * 0.012), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (settle > 0 && settle < 0.6) splatter(ctx, x + size * 0.5, y + size * 0.5, settle, { seed: o.seed + 5, count: 7, reach: size * 0.5, size: size * 0.035, color: o.fill, fade: 0.3 });
}

/** Kâğıt lifleri: DÜNYA koordinatında (kamera kayınca kâğıt da kayar), yakında belirgin, kalınlık zoom'la büyümez. */
const FIBRES = new Map<string, { x: number; y: number; dx: number; dy: number; a: number }[]>();
export function fibres(ctx: Ctx, w: number, h: number, color: string, zoom: number, seed: number) {
  const key = `${Math.round(w)}x${Math.round(h)}:${seed}`;
  let list = FIBRES.get(key);
  if (!list) {
    const r = rng(seed);
    list = Array.from({ length: Math.round((w * h) / 1400) }, () => {
      const ang = r() * Math.PI, len = 3 + r() * 9;
      return { x: -w * 0.2 + r() * w * 1.4, y: -h * 0.2 + r() * h * 1.4, dx: Math.cos(ang) * len, dy: Math.sin(ang) * len, a: 0.3 + r() * 0.7 };
    });
    if (FIBRES.size > 8) FIBRES.clear();
    FIBRES.set(key, list);
  }
  const k = clamp((zoom - 1) / 1.6) * 0.025 + 0.03;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 0.7 / zoom; ctx.lineCap = "round";
  for (const f of list) { ctx.globalAlpha = k * f.a; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + f.dx, f.y + f.dy); ctx.stroke(); }
  ctx.restore();
}

/* ----------------------------------------------------------------------- */
/* Ses olayları                                                              */
/* ----------------------------------------------------------------------- */

export type Cue = { kind: string; at: number; [extra: string]: unknown };

/**
 * (t0, t1] aralığına düşen olaylar. Her karede (son, şimdi] sorulur; aralık
 * nasıl bölünürse bölünsün olay bir kez çalar (testle doğrula). Periyodik
 * olaylar (dönen sahne) `every` ile.
 */
export function cuesBetween(t0: number, t1: number, fixed: Cue[], periodic: { kind: string; from: number; every: number; until?: number; extra?: Record<string, unknown> }[] = []) {
  const out = fixed.filter(c => c.at > t0 && c.at <= t1);
  for (const p of periodic) {
    for (let d = Math.max(0, Math.floor((t0 - p.from) / p.every)); ; d++) {
      const at = p.from + d * p.every;
      if (at > t1 || (p.until !== undefined && at > p.until)) break;
      if (at > t0) out.push({ kind: p.kind, at, ...p.extra });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/* ----------------------------------------------------------------------- */
/* Müzik: ölçülmüş ızgara, sözler, vuruş darbesi (reference/muzik-klibi.md)  */
/* kaynak: mexicat/pdoom-video, MIT — API fikri; kod bizim                   */
/* ----------------------------------------------------------------------- */

/**
 * Şarkı analizinden gelen vuruş ızgarası (saniye, gapless çözüm zamanında).
 * `beats` ölçülür, elle BPM'den üretilmez: elle yazılan tempo birkaç ms'lik
 * hatayı her vuruşta biriktirir, şarkının sonunda kesmeler vuruştan kayar.
 */
export type BeatGrid = { beats: readonly number[]; downbeats: readonly number[]; bpm?: number };

/** Izgaranın ortalama periyodu; uçların dışına bununla uzatılır (tek vuruşlu ızgarada `bpm`). */
function beatPeriod(g: BeatGrid) {
  const b = g.beats, n = b.length;
  if (n > 1) return (b[n - 1] - b[0]) / (n - 1);
  return 60 / (g.bpm ?? 120);
}

/** İkili arama: `list[i] <= t` olan son i (yoksa −1). Liste artan sırada olmalı. */
function lastAtOrBefore(list: readonly number[], t: number) {
  let lo = 0, hi = list.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (list[m] <= t) lo = m + 1; else hi = m; }
  return lo - 1;
}

/**
 * Sürekli vuruş sırası: ilk vuruşta 0, aradaki zamanda kesirli (iki ölçülmüş
 * vuruş arasında doğrusal — tempo hafif kayıyorsa ızgara onu izler). Uçların
 * dışında ortalama periyotla uzatılır. `floor(beatAt(t))` = içinde bulunulan vuruş.
 */
export function beatAt(t: number, g: BeatGrid) {
  const b = g.beats, n = b.length;
  if (n === 0) return (t * (g.bpm ?? 120)) / 60;
  const p = beatPeriod(g);
  if (t <= b[0]) return (t - b[0]) / p;
  if (t >= b[n - 1]) return n - 1 + (t - b[n - 1]) / p;
  const i = lastAtOrBefore(b, t);
  return i + (t - b[i]) / (b[i + 1] - b[i]);
}

/** `beatAt`ın tersi: (kesirli) vuruş sırasının zamanı. `timeOfBeat(beatAt(t)) === t` (ızgara içinde). */
export function timeOfBeat(n: number, g: BeatGrid) {
  const b = g.beats, len = b.length;
  if (len === 0) return (n * 60) / (g.bpm ?? 120);
  const p = beatPeriod(g);
  if (n <= 0) return b[0] + n * p;
  if (n >= len - 1) return b[len - 1] + (n - (len - 1)) * p;
  const k = Math.floor(n);
  return b[k] + (b[k + 1] - b[k]) * (n - k);
}

/** Onset: [zaman, güç 0..1]. Analizden gelir (kick, snare, hat, vokal), zamana göre artan. */
export type Onset = readonly [t: number, strength: number];

/**
 * Vuruşa tepki: t'den önceki onset'lerin üstel sönen darbelerinin en büyüğü
 * (onset anında güç, her `halfLife` saniyede yarıya). Durumsuz: kare sırası,
 * ileri-geri sarma ve alt kare örneklemesi aynı sonucu verir — "her kickte
 * değeri artır" gibi kare sayan tepkinin tersine. Toplam değil en büyük:
 * sık hat darbeleri üst üste binip doymasın. Yarı ömür tipik: kick 0,12,
 * snare 0,14, hat 0,06, vokal 0,15 sn.
 */
export function hit(onsets: readonly Onset[], t: number, halfLife = 0.11) {
  let lo = 0, hi = onsets.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (onsets[m][0] <= t) lo = m + 1; else hi = m; }
  let v = 0;
  for (let i = lo - 1; i >= 0; i--) {
    const dt = t - onsets[i][0];
    if (dt > halfLife * 8) break; // 2^-8 < 0,004: görünmez
    v = Math.max(v, onsets[i][1] * Math.pow(0.5, dt / halfLife));
  }
  return v;
}

/** Hizalanmış söz verisi (lyrics.json). `syl`: hece [başla, bit] çiftleri; `conf`: 0..1 hizalama güveni. */
export type LyricWord = { w: string; start: number; end: number; conf?: number; syl?: readonly (readonly [number, number])[] };
export type LyricLine = { text: string; start: number; end: number; words: readonly LyricWord[] };

/**
 * Kelimenin söylenen kesri: başlangıçta tam 0, bitişte tam 1 (vurgu sesin
 * önüne geçmez, kelime sesle birlikte biter). Hece zamanı varsa parçalı:
 * her hece kendi aralığında ilerler, heceler arası boşlukta vurgu bekler —
 * uzun tutulan hecede silme sesle birlikte yavaşlar. `weights` heceye düşen
 * pay (ör. harf sayısı; verilmezse eşit), görsel silmeyi harflere oturtur.
 */
export function wordProgress(word: LyricWord, t: number, weights?: readonly number[]) {
  if (t <= word.start) return 0;
  if (t >= word.end) return 1;
  const syl = word.syl;
  if (!syl || syl.length < 2) return (t - word.start) / Math.max(1e-3, word.end - word.start);
  const wsum = syl.reduce((s, _, i) => s + (weights?.[i] ?? 1), 0);
  let done = 0;
  for (let i = 0; i < syl.length; i++) {
    const [a, b] = syl[i], share = (weights?.[i] ?? 1) / wsum;
    if (t < a) return done;
    if (t < b) return done + share * ((t - a) / Math.max(1e-3, b - a));
    done += share;
  }
  return Math.min(1, done);
}

/** Karşılaştırma için katla: Türkçe küçük harf, düz/kıvrık tırnak bir, boşluk tek. */
const foldLyric = (s: string) =>
  s.toLocaleLowerCase("tr-TR").replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim();

/**
 * Sözü İÇERİĞİYLE bul: metninde `query` geçen `nth`. satır (tekrarlanan nakarat
 * için 0, 1, 2…). Bulamazsa FIRLATIR — hizalama yeniden koşup zamanlar
 * değişince ya da söz düzeltilince kurgu sessizce yanlış yere kaymasın,
 * yazarken patlasın. Kodda saniye yazma; sahne sınırı buradan türer.
 */
export function lyric(lines: readonly LyricLine[], query: string, nth = 0): LyricLine {
  const q = foldLyric(query);
  const hits = lines.filter(l => foldLyric(l.text).includes(q));
  const l = hits[nth];
  if (!l) throw new Error(`söz bulunamadı: "${query}" (${nth}. eşleşme; ${hits.length} eşleşme var)`);
  return l;
}

/**
 * Kesme: satırın ilk kelimesinden önceki (ya da onunla aynı) SON vuruş — kesme
 * kelimeyi asla ortadan bölmez, görüntü sesten önce değişir. `tol` vuruşun
 * hemen ardından (onset gecikmesi kadar) başlayan kelimeyi o vuruşa bağlar.
 */
export function cutAt(line: LyricLine, g: BeatGrid, tol = 0.02) {
  const s = line.words[0]?.start ?? line.start;
  return timeOfBeat(Math.floor(beatAt(s + tol, g)), g);
}

/**
 * Satır bittikten sonraki ilk ölçü başı (downbeat). Uzun tutulan son hece
 * ölçüyü taşabilir; sınır sesten önce gelmesin diye "en yakın" değil "sonraki".
 * Izgaranın sonundaysa satır sonu döner.
 */
export function downbeatAfter(line: LyricLine, g: BeatGrid, tol = 0.02) {
  const d = g.downbeats, i = lastAtOrBefore(d, line.end - tol) + 1;
  return i < d.length ? d[i] : line.end;
}
