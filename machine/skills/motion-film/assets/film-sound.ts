/**
 * Film sesi — dosyasız, Web Audio ile sentezlenen foley.
 *
 * Kaynak: Açılış Zili `components/ai/filmSound.ts`. Tarifler malzemeye göre
 * (lemo-opuscar ink-wash: "never a metal whoosh"): kâğıt ve mürekkep sesleri
 * süzülmüş gürültüden, çan kısmi tonlardan.
 *
 * SAYFA İÇİ FİLM KURALLARI (reference/ses.md):
 *   - Varsayılan KAPALI; görünür bir düğmeyle açılır, tercih localStorage'da.
 *   - Tarayıcı sesi yalnız kullanıcı hareketiyle başlatır: tercih açıksa
 *     filmi başlatan tıklamanın içinde `primeSound()` çağır.
 *   - Olaylar çizimle AYNI zaman çizelgesinden gelir (`cuesBetween`), her
 *     karede (son, şimdi] aralığı çalınır.
 * VİDEO İÇİN: bu dosya değil, EV listesi + çevrimdışı miks (reference/video-uretimi.md).
 */
const PREF = "film-sound";
let audio: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

export function soundPreferred() { try { return localStorage.getItem(PREF) === "1"; } catch { return false; } }
export function setSoundPreferred(on: boolean) { try { localStorage.setItem(PREF, on ? "1" : "0"); } catch { /* yalnız bu oturum */ } }

/** Bağlamı bir kullanıcı hareketinin içinde açar ya da sürdürür. */
export function primeSound(level = 0.55) {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audio) {
    audio = new Ctor();
    const comp = audio.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master = audio.createGain(); master.gain.value = level;
    master.connect(comp).connect(audio.destination);
    noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noise.getChannelData(0);
    let s = 7;
    for (let i = 0; i < data.length; i++) { s = (s * 16807) % 2147483647; data[i] = (s / 2147483647) * 2 - 1; }
  }
  if (audio.state === "suspended") void audio.resume();
  return audio;
}
export function muteSound() { if (audio?.state === "running") void audio.suspend(); }
const live = () => !!audio && audio.state === "running";

function env(g: GainNode, at: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

export function noiseBurst(at: number, o: { type: BiquadFilterType; freq: number; q?: number; peak: number; attack: number; decay: number; sweepTo?: number }) {
  if (!audio || !master || !noise) return;
  const src = audio.createBufferSource(); src.buffer = noise; src.loop = true;
  const f = audio.createBiquadFilter(); f.type = o.type; f.frequency.setValueAtTime(o.freq, at); f.Q.value = o.q ?? 0.8;
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, at + o.attack + o.decay);
  const g = audio.createGain(); env(g, at, o.peak, o.attack, o.decay);
  src.connect(f).connect(g).connect(master);
  src.start(at, Math.random() * 0.5); src.stop(at + o.attack + o.decay + 0.05);
}

export function tone(at: number, freq: number, o: { peak: number; attack?: number; decay: number; type?: OscillatorType; glideTo?: number }) {
  if (!audio || !master) return;
  const osc = audio.createOscillator(); osc.type = o.type ?? "sine"; osc.frequency.setValueAtTime(freq, at);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, at + o.decay);
  const g = audio.createGain(); env(g, at, o.peak, o.attack ?? 0.004, o.decay);
  osc.connect(g).connect(master); osc.start(at); osc.stop(at + (o.attack ?? 0.004) + o.decay + 0.05);
}

/**
 * Tarifler: her biri `at` (AudioContext zamanı) alır. Yenilerini aynı yapı taşlarıyla ekle.
 *
 * `at` sesin BAŞLANGICIDIR, senkron noktası değil. Vuruşlu tariflerde
 * (drop, thump, type) ikisi aynı ana düşer. Kabaran seslerde tepe sonradadır:
 * `rise` başlangıçtan 0,12 sn, `swellIn` 0,55 sn sonra doruğa varır.
 * Zaman çizelgesine yalnız GÖRSEL olayın anı yazılır (yazının oturduğu, selin
 * kapladığı kare); atak, sesi çalan yerde tarifin kendi süresinden çıkarılır.
 * Çizelgeye önceden kaydırılmış zaman yazılmaz: tarifin atağı değişince ses
 * olaydan sessizce kayar (reference/ses.md § senkron noktası).
 */
export const RECIPES = {
  /** Mürekkep damlası / cam "tink" + ıslak vuruş. */
  drop: (at: number, freq = 2100, peak = 0.16) => {
    tone(at, freq, { peak, decay: 0.22 }); tone(at, freq * 2.76, { peak: peak * 0.25, decay: 0.09 });
    noiseBurst(at, { type: "lowpass", freq: 700, peak: peak * 0.6, attack: 0.002, decay: 0.06 });
  },
  /** Ahşap/kâğıt vuruşu: damga, mühür, iniş. */
  thump: (at: number, peak = 0.5) => {
    tone(at, 130, { peak, decay: 0.2, glideTo: 48 });
    noiseBurst(at, { type: "lowpass", freq: 1100, peak: peak * 0.35, attack: 0.002, decay: 0.05 });
    noiseBurst(at + 0.01, { type: "highpass", freq: 3500, peak: peak * 0.08, attack: 0.002, decay: 0.12 });
  },
  /** Kalem kâğıtta: bant geçiren gürültü, düzeyi 35 ms'de bir tohumlu titrer. */
  pen: (at: number, duration: number) => {
    if (!audio || !master || !noise) return;
    const src = audio.createBufferSource(); src.buffer = noise; src.loop = true;
    const f = audio.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3600; f.Q.value = 0.7;
    const g = audio.createGain(); g.gain.setValueAtTime(0.0001, at);
    let s = 3;
    for (let x = 0; x < duration; x += 0.035) { s = (s * 16807) % 2147483647; g.gain.linearRampToValueAtTime(0.012 + (s / 2147483647) * 0.05, at + x); }
    g.gain.linearRampToValueAtTime(0.0001, at + duration + 0.05);
    src.connect(f).connect(g).connect(master); src.start(at); src.stop(at + duration + 0.1);
  },
  /** Yükselen hava (dev yazının girişi). Tepe `at + 0,12`: yazı oturduğunda doruk. */
  rise: (at: number) => noiseBurst(at, { type: "bandpass", freq: 600, q: 0.6, peak: 0.05, attack: 0.12, decay: 0.25, sweepTo: 2400 }),
  /** Sel gelir / çekilir: süzgeci açılan / kapanan gürültü (metal whoosh değil). `swellIn` tepesi `at + 0,55`. */
  swellIn: (at: number) => noiseBurst(at, { type: "lowpass", freq: 220, peak: 0.16, attack: 0.55, decay: 0.6, sweepTo: 1500 }),
  swellOut: (at: number) => noiseBurst(at, { type: "lowpass", freq: 1500, peak: 0.12, attack: 0.3, decay: 0.8, sweepTo: 200 }),
  /** Daktilo: altı kısa tık. */
  type: (at: number) => { for (let i = 0; i < 6; i++) noiseBurst(at + i * 0.07, { type: "highpass", freq: 4200, peak: 0.05, attack: 0.002, decay: 0.012 }); },
  /** Çan: kısmi tonlar (alt oktav, minör üçlü, kusurlu üst tonlar), uzun sönüm. */
  bell: (at: number, base = 784) => {
    ([[0.5, 0.1, 2.6], [1, 0.16, 2.2], [1.19, 0.08, 1.6], [1.56, 0.06, 1.3], [2, 0.07, 1.1], [2.51, 0.035, 0.8], [3.01, 0.025, 0.6]] as const)
      .forEach(([ratio, peak, decay]) => tone(at, base * ratio, { peak, decay, attack: 0.003 }));
  },
} as const;

/** Bir olayı şimdi çal (bağlam kapalıysa sessizce geç). `play("drop")`, `play("pen", 1.9)`. */
export function play<K extends keyof typeof RECIPES>(kind: K, ...args: Parameters<(typeof RECIPES)[K]> extends [number, ...infer R] ? R : never) {
  if (!live()) return;
  const fn = RECIPES[kind] as (at: number, ...rest: unknown[]) => void;
  fn(audio!.currentTime + 0.01, ...(args as unknown[]));
}
