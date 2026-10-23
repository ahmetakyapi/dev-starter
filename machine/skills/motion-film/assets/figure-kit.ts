/**
 * Figür kiti — sayfa içi bir filmin ya da açıklayıcı figürün ÇALIŞMA ZAMANI.
 *
 * `film-kit.ts` saf çizimdir (zaman → tuval). Bu dosya o çizimi sayfada
 * yaşatan parçalar: döngüyü ekran dışında durdurmak, değeri bir hedefe
 * yumuşakça taşımak, bir olayı zarfla çalmak, boşta tur, duyuru. Fikirler
 * wheresryan22/anatomy'nin `references/motion.md`sinden (MIT); kod bizim.
 *
 *   watchVisibility  IntersectionObserver, EN YENİ kayıtla (donma tuzağı)
 *   loop             dt'si kırpılmış tek rAF döngüsü; görünmezken ve yerleşince durur
 *   follow           üstel takip: hedef → değer (τ 0,1–0,3 sn)
 *   spring           alt adımlı yay (240 Hz); yerleşince true döner
 *   settle           kritik sönümlü yay: aşmadan varır (renk, parlaklık, frekans)
 *   burst            tek seferlik olayın zarfı: atak + sönüm, pop yok
 *   idleTour         kimse dokunmazken senaryolu tur; dokununca durur, sessizlikte döner
 *   carryLeg/walkLeg oynatma bacakları: ışınlanma yok, olaysız taşıma + olaylı yürüyüş
 *   planAt           bacak listesinin t saniyedeki değeri (Günü Oynat, seans oynat)
 *   crossings        ileri giderken geçilen işaretler (zil anı); geri sarmak olay değil
 *   quietAnnouncer   ekran okuyucuya yalnız durulunca, yalnız değişince söyle
 *   cueWindow        kaçırılan ses olaylarını üst üste çalmamak için aralık
 */

/* ----------------------------------------------------------------------- */
/* Görünürlük ve döngü                                                       */
/* ----------------------------------------------------------------------- */

/**
 * Öğe ekrana girip çıktıkça `onChange(true|false)`. KAYITLARIN SONUNCUSU
 * okunur: öğe iki çağrı arasında çıkıp geri gelirse tek çağrı iki kayıt
 * getirir (eskisi önce); ilkini okuyan film ekrandayken donar (anatomy).
 * `margin` erken sezmek için (varsayılan 120px dikey).
 */
export function watchVisibility(el: Element, onChange: (visible: boolean) => void, margin = "120px 0px") {
  const io = new IntersectionObserver((entries) => onChange(entries[entries.length - 1].isIntersecting), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Tek döngü. `tick(dt, calm)` true döndükçe sürer; false (yerleşti) ya da öğe
 * ekran dışındaysa durur, `kick()` yeniden başlatır. dt 1/30 sn'ye kırpılır:
 * arka plandaki sekme dönünce sıçrama olmaz. `calm` = hareketi azalt.
 */
export function loop(el: Element, tick: (dt: number, calm: boolean) => boolean) {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0, last = 0, visible = false;
  const frame = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const going = tick(dt, still.matches);
    raf = visible && going ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = watchVisibility(el, (v) => { visible = v; if (v) kick(); });
  return { kick, dispose: () => { cancelAnimationFrame(raf); stop(); } };
}

/* ----------------------------------------------------------------------- */
/* Değeri taşımak                                                            */
/* ----------------------------------------------------------------------- */

/** Üstel takip. İmleç hedefi koyar, parça izler; asla imlece yapışmaz. `calm`da doğrudan hedef. */
export const follow = (x: number, target: number, dt: number, tau: number, calm = false) =>
  calm ? target : x + (target - x) * (1 - Math.exp(-dt / tau));

export type SpringState = { at: number; rate: number };

/**
 * Gerçek yay (sertlik k, sürtünme c), 240 Hz alt adımla kararlı. Hata ve hız
 * 5e-4'ün altına inince hedefe oturur ve true döner. `calm`da doğrudan hedef.
 */
export function spring(s: SpringState, target: number, dt: number, k: number, c: number, calm = false) {
  if (calm) { s.at = target; s.rate = 0; return true; }
  const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
  for (let i = 0; i < steps; i++) { s.rate += (k * (target - s.at) - c * s.rate) * h; s.at += s.rate * h; }
  if (Math.abs(target - s.at) < 5e-4 && Math.abs(s.rate) < 5e-4) { s.at = target; s.rate = 0; return true; }
  return false;
}

export type SettleState = { x: number; v: number };

/**
 * Kritik sönümlü yaklaşım: aşmadan varır, hız da süreklidir (üstel takipten
 * yumuşak). Renk, parlaklık, frekans gibi "ileri geri gitmemesi" gereken
 * değerler için. Hâlâ hareket ediyorsa true (döngüyü canlı tutar).
 */
export function settle(s: SettleState, target: number, dt: number, seconds: number, calm = false) {
  if (calm) { s.x = target; s.v = 0; return false; }
  const w = 1 / seconds, h = dt / 4;
  for (let i = 0; i < 4; i++) { s.v += (w * w * (target - s.x) - 2 * w * s.v) * h; s.x += s.v * h; }
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-4) { s.x = target; s.v = 0; return false; }
  return true;
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Tek seferlik olayın zarfı (parlama, tık, sarsıntı): bir DEĞER değil, YAŞI
 * olan bir şey. Olayın başlangıcını sakla, her karede yaşından hesapla; üst
 * üste binen iki olay toplanır. Atak 40–120 ms, sıfır eğimle başlar — bir
 * karede 1'e çıkmak "pop"tur. Hareketi azaltana 0.
 */
export const burst = (age: number, rise: number, fall: number) =>
  age < 0 ? 0 : age < rise ? smooth(0, rise, age) : Math.exp(-(age - rise) / fall);

/* ----------------------------------------------------------------------- */
/* Boşta tur                                                                 */
/* ----------------------------------------------------------------------- */

/**
 * Kimse dokunmazken figürün ne anlattığını gösteren senaryolu döngü.
 * `startAfter` (1,4 sn) sonra başlar, dokunuş/odak/basışta durur, son
 * etkileşimden `resumeAfter` (3,6 sn) sonra döner. Tur, kullanıcının
 * koyacağı HEDEFLERİ sürer; başka bir yol yok. Turun ortasında basılan adım
 * tuşu turun hedefinden değil OKUYUCUNUN GÖRDÜĞÜ değerden adımlar.
 */
export function idleTour(o: { startAfter?: number; resumeAfter?: number; period: number }) {
  const startAfter = o.startAfter ?? 1.4, resumeAfter = o.resumeAfter ?? 3.6;
  let quiet = 0, clock = 0, touring = false, touched = false;
  return {
    /** Her karede çağır; tur sürüyorsa döngü içindeki zamanı (0..period), değilse null. */
    step(dt: number, calm: boolean) {
      if (calm) return null;
      quiet += dt;
      if (!touring && quiet >= (touched ? resumeAfter : startAfter)) touring = true;
      if (!touring) return null;
      clock += dt;
      return clock % o.period;
    },
    /** Her etkileşimde çağır (pointer, odak, tuş): tur durur, sessizlik sayacı sıfırlanır. */
    interrupt() { touring = false; touched = true; quiet = 0; },
    get touring() { return touring; },
  };
}

/* ----------------------------------------------------------------------- */
/* Oynatma: ışınlanmayan değer                                               */
/* ----------------------------------------------------------------------- */

/*
 * Açılış Zili → Seans Zili ("Günü Oynat", 12 Ekim 2026). Sahibinin itirazı:
 * "tıkladığı gibi değişmesin, smooth olsun; zil çalmak ne işe yarıyor".
 * Kural: düğme değeri HİÇBİR YERE KOYMAZ, bir PLAN başlatır. Plan bacaklardan
 * oluşur; her bacak yumuşak başlar, yumuşak durur. İki tür bacak var:
 *
 *   taşıma (events: false)  değeri başlangıç noktasına götürür; yolda geçilen
 *                           işaret OLAY DEĞİL (oraya gitmek zil anı değil)
 *   yürüyüş (events: true)  anlatılan süreç; yolda geçilen işaret olayı
 *                           tetikler (çan vurulur, bildirim çıkar)
 *
 * Başlangıç noktası anlatılan olayın biraz ÖNÜNDE seçilir (seans başı − 20
 * dk): olay yürüyüşün ortasında yaşansın, ilk karede değil. Plan bitince
 * birkaç saniye (4 sn) beklenir, sonra tek taşıma bacağıyla "şimdi"ye dönülür.
 * Üst bilgi ve imler HEDEFİ değil DEĞERİ izler: saat yolda akar.
 * Hareketi azaltana plan yok: değer doğrudan hedefe konur, olay yine bildirilir.
 */

export type Leg = { from: number; to: number; dur: number; events: boolean };

const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const clampTo = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Bacağın `t` saniyedeki değeri. Taşıma kübik (çabuk varır), yürüyüş sinüs
    (uçlarda yumuşak, ortada düz hız: süreç okunur). */
export function legAt(leg: Leg, t: number) {
  const p = clampTo(leg.dur > 0 ? t / leg.dur : 1, 0, 1);
  return leg.from + (leg.to - leg.from) * (leg.events ? inOutSine(p) : inOutCubic(p));
}

/**
 * Olaysız taşıma. `period` verilirse (24 saatlik kadran: 1440 dk) KISA YOLDAN
 * gider ve gece yarısını geçebilir; dönen `to` o tur değeridir, sonraki
 * bacak aynı turdan devam etmeli (`to - hedef` kadar kaydır). Süre mesafeyle
 * 0,6–1,4 sn: kısa yol kısa sürer, uzun yol sürüklenmez.
 */
export function carryLeg(from: number, to: number, o: { period?: number; min?: number; max?: number } = {}): Leg {
  const target = o.period ? to + Math.round((from - to) / o.period) * o.period : to;
  const share = o.period ? Math.abs(target - from) / o.period : Math.min(1, Math.abs(target - from));
  return { from, to: target, dur: clampTo(0.5 + share * 2.4, o.min ?? 0.6, o.max ?? 1.4), events: false };
}

/** Olaylı yürüyüş. Süre anlatılan aralığın uzunluğuyla büyür (`perUnit` sn/birim), 2–`max` sn. */
export function walkLeg(from: number, to: number, o: { perUnit: number; max?: number; min?: number }): Leg {
  return { from, to, dur: clampTo(1.4 + Math.abs(to - from) * o.perUnit, o.min ?? 2, o.max ?? 4.2), events: true };
}

/** Planın `t` saniyedeki durumu: değer, hangi bacak, olaylar açık mı, bitti mi. */
export function planAt(legs: readonly Leg[], t: number) {
  let rest = t;
  for (let index = 0; index < legs.length; index++) {
    const leg = legs[index];
    const last = index === legs.length - 1;
    if (rest <= leg.dur || last) {
      return { value: legAt(leg, rest), leg: index, events: leg.events, done: last && rest >= leg.dur };
    }
    rest -= leg.dur;
  }
  return { value: 0, leg: -1, events: false, done: true };
}

export const planLength = (legs: readonly Leg[]) => legs.reduce((sum, leg) => sum + leg.dur, 0);

/**
 * `from`dan `to`ya İLERİ giderken geçilen işaretler (zil anları), sırayla.
 * Geri gitmek olay üretmez: kadranı geri sarmak açılışı yeniden yaşatmaz.
 * `period` verilirse işaretler her turda tekrarlar; bir turdan uzun yol tek
 * tur sayılır. Her karede `crossings(önceki, şimdiki, ...)`: kare atlasa da
 * olay kaçmaz. Taşıma bacağında ÇAĞIRMA (`planAt(...).events`).
 */
export function crossings(from: number, to: number, marks: readonly number[], period?: number) {
  if (to <= from) return [];
  const span = period ? Math.min(to - from, period) : to - from;
  const out: { at: number; index: number }[] = [];
  marks.forEach((mark, index) => {
    const next = period ? mark + Math.ceil((from + 1e-9 - mark) / period) * period : mark;
    if (next > from && next - from <= span) out.push({ at: next, index });
  });
  return out.sort((a, b) => a.at - b.at);
}

/* ----------------------------------------------------------------------- */
/* Erişilebilirlik                                                           */
/* ----------------------------------------------------------------------- */

/**
 * Canlı bölgeye yalnız EVRE değişince ve girdi `quietMs` (700 ms) durulunca
 * yaz. Her karede değişen sayı (künye) ekran okuyucuda bitmeyen bir sayı
 * selidir: görsel künye ile erişilebilir değer AYRI tutulur.
 */
export function quietAnnouncer(region: HTMLElement, quietMs = 700) {
  let timer = 0, said = "";
  return (text: string) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => { if (text !== said) { region.textContent = text; said = text; } }, quietMs);
  };
}

/* ----------------------------------------------------------------------- */
/* Ses                                                                       */
/* ----------------------------------------------------------------------- */

/**
 * Bu karede çalınacak ses aralığı. Boşluk `maxGap`ten (0,5 sn) uzunsa
 * (sekme arka planda kaldı, film ekran dışındaydı) aralık boş döner:
 * kaçırılan olaylar dönüşte üst üste çalmaz. `cuesBetween(...window)` ile kullan.
 */
export const cueWindow = (last: number, now: number, maxGap = 0.5): [number, number] =>
  now - last < maxGap ? [last, now] : [now, now];
