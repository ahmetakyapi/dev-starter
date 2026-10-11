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
