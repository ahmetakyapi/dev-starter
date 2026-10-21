#!/usr/bin/env node
/**
 * film-video — sözleşme sayfasını (window.render(t), DUR, READY) MP4'e çevirir.
 *
 * Video modeli yok: her kare render(t) ile tarayıcıda çizilir, JPEG olarak
 * ffmpeg'e akar (shipvideo ve lemo-opuscar'ın aynı yolu). Kare saf
 * fonksiyon olduğu için sıra ve hız önemsiz; çıktı her seferinde aynı.
 *
 *   node film-video.mjs film.html --fps=24 --size=1920x1080 --out=out/film.mp4
 *   node film-video.mjs film.html --subframes=8 --shutter=0.5     # hareket bulanıklığı
 *   node film-video.mjs film.html --from=3 --to=6 --audio=mix.wav  # sesli deneme klibi
 *   node film-video.mjs film.html --scale=2 --workers=3            # 4K, üç tarayıcı
 *
 * --subframes=N  her kare N alt karenin ortalaması. Alt kareler karenin anına
 *                ORTALANIR: t = (f + shutter·((s+0.5)/N − 0.5)) / fps. Her
 *                çıktı karesi kendi N alt karesinden oluşur (kayan pencere değil)
 *                ve ortalama doğrusal ışıkta alınır. Süre N katı.
 * --shutter=0.5  obtüratör açıklığı, kare süresinin oranı (0,5 = 180° film obtüratörü).
 * --from=a --to=b  yalnız bir aralık (hızlı deneme). --audio ile ses de aynı aralıktan kesilir.
 * --audio=yol    sesi bindirir (AAC 320k, -shortest): aralık klibi senkron kalır.
 * --grain        x264'ü grenli/dokulu görüntüye ayarlar (-tune grain, aq-mode=3).
 * --scale=N      yerleşim mantıksal pikselde (--size), çıktı N katı fiziksel piksel.
 * --workers=N    N ayrı tarayıcı; kareler <out>.frames/ dizinine yazılır, kesilen
 *                render kaldığı yerden sürer. --frames-dir=yol ile tek işçide de açılır.
 * --events       DUR ve EV'yi out yanına .events.json olarak yazar (miks için).
 * --gif          MP4 yerine tek paletli GIF (out .gif). GIF gecikmeleri yüzde bir
 *                saniyedir: 24 fps (41,7 ms) yazılamaz, 40'a yuvarlanınca döngü %4
 *                hızlı koşar ve vuruştan kayar. Bu yüzden GIF 25 fps'e (tam 40 ms)
 *                sabitlenir. Tek palet kareler arası renk titremesini önler.
 * ffmpeg: PATH'te ya da FFMPEG ortam değişkeni. Tarayıcı: film-browser.mjs.
 *
 * Merkezli obtüratör ve sabit gruplu ortalama mg-styles-15'in harness/render.mjs'inden
 * (MIT, © 2026 Vincentwei1021); BT.709 etiketi ve ses mux'u pdoom-video'nun
 * app/scripts/render.ts'inden (MIT, © 2026 Giacomo Magnanini); yarım dosya
 * bırakmayan temizlik lemo-opuscar'ın core/render/video.mjs'inden (MIT, © 2026 LemoLab).
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { filmUrl, launch, newPage, parseArgs, renderAt, waitReady, warnSoftwareGL, watchPage } from "./film-browser.mjs";

const { args, target } = parseArgs();
if (!target) {
  console.error("Kullanım: film-video.mjs <html|url> [--fps=24] [--size=1920x1080] [--scale=1] [--subframes=1] [--shutter=0.5]\n" +
    "                     [--from=a] [--to=b] [--audio=ses.wav] [--grain] [--workers=1] [--events] [--gif] [--out=out/film.mp4]");
  process.exit(2);
}
const url = filmUrl(target, true);
const [W, H] = String(args.size || "1920x1080").split("x").map(Number);
const scale = Number(args.scale || 1);
const gif = Boolean(args.gif);
/** Asıl çıktı: GIF kipinde uzantı .gif. */
const outOf = (o) => (gif ? o.replace(/\.mp4$/, ".gif") : o);
const fps = gif ? 25 : Number(args.fps || 24), sub = Math.max(1, Math.round(Number(args.subframes || 1)));
const shutter = Number(args.shutter ?? 0.5);
const out = resolve(args.out || "out/film.mp4"), final = outOf(out);
const workers = Math.max(1, Math.round(Number(args.workers || 1)));
const audio = args.audio ? resolve(String(args.audio)) : null;
const readyTimeout = Number(args["ready-timeout"] || 20) * 1000;

const PW = Math.round(W * scale), PH = Math.round(H * scale);
const bad = (m) => { console.error(m); process.exit(2); };
if (!(W > 0 && H > 0 && scale > 0 && fps > 0)) bad("--size, --scale ve --fps pozitif olmalı.");
// yuv420p rengi 2×2 blokta paylaşır: tek boyutlu kare kodlayıcıda düşer.
if (!gif && (PW % 2 || PH % 2)) bad(`çıktı ${PW}×${PH}: yuv420p için iki boyut da çift olmalı.`);
if (!(shutter > 0 && shutter <= 1)) bad("--shutter 0 ile 1 arasında (0,5 = 180°).");
if (audio && !existsSync(audio)) bad(`ses dosyası yok: ${audio}`);
if (audio && gif) console.warn("--audio GIF'te yok sayıldı (GIF ses taşımaz).");

// —— Temizlik: hata ya da kesintide bitmiş görünen yarım dosya kalmasın ——
// ffmpeg gizli bir .partial dosyasına yazar, yalnız başarıda asıl ada taşınır:
// başarısız koşu önceki iyi çıktıyı da ezmez.
const partial = join(dirname(final), `.${basename(final, extname(final))}.partial${extname(final)}`);
const procs = new Set(), browsers = new Set();
let failing = false, framesDir = null;
async function fail(msg, code = 1) {
  if (failing) return; failing = true;
  console.error(`\n${msg}`);
  for (const p of procs) p.kill("SIGKILL");
  rmSync(partial, { force: true });
  await Promise.race([Promise.allSettled([...browsers].map(b => b.close())), new Promise(r => setTimeout(r, 3000))]);
  if (framesDir) console.error(`kareler ${framesDir} içinde duruyor; aynı komut kaldığı yerden sürer.`);
  process.exit(code);
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => fail(`kesildi (${sig}).`, sig === "SIGINT" ? 130 : 143));

/** Bir işçi: kendi tarayıcısı, kendi sayfası. Aynı tarayıcıdaki sayfalar tek kompozitörü
    paylaşır ve paralel çizmez; paralellik ancak ayrı tarayıcıyla gelir (mg-styles-15). */
async function openWorker(label) {
  const env = await launch();
  browsers.add(env.browser);
  const page = await newPage(env, { w: W, h: H, dpr: scale });
  const watch = watchPage(page, { fatal: (m) => fail(m), label });
  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  await waitReady(page, env.kind, watch, readyTimeout);
  return { env, page, watch };
}

// Alt kare zamanı. Merkezli: karenin anı obtüratörün ortasında, yani bulanık iz
// nesnenin iki yanına eşit uzar ve nesne keskin karedekiyle aynı yerde görünür.
const subT = (f, s) => (sub > 1 ? (f + shutter * ((s + 0.5) / sub - 0.5)) / fps : f / fps);
const shoot = async (page, t) => { await renderAt(page, t); return Buffer.from(await page.screenshot({ type: "jpeg", quality: 92 })); };

// —— Kodlayıcı ——
// sRGB → doğrusal: alt kareler ışık olarak toplanır. sRGB değerinin ortalaması
// açık nesnenin izini koyu zeminde olduğundan karanlık ve ince gösterir.
// 16 bit: doğrusal değer 8 bite sığdırılınca koyu tonlar bantlanır.
const TO_LIN = "if(lte(val/65535\\,0.04045)\\,val/12.92\\,65535*pow((val/65535+0.055)/1.055\\,2.4))";
const TO_SRGB = "if(lte(val/65535\\,0.0031308)\\,val*12.92\\,65535*(1.055*pow(val/65535\\,1/2.4)-0.055))";
const blur = sub > 1
  ? `format=gbrp16le,lutrgb=r='${TO_LIN}':g='${TO_LIN}':b='${TO_LIN}',tmix=frames=${sub}:weights='${Array(sub).fill(1).join(" ")}',` +
    // tmix kayan penceredir; her N. kareyi seçmek çıktı karesini yalnız kendi N alt karesine bağlar.
    `select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB),lutrgb=r='${TO_SRGB}':g='${TO_SRGB}':b='${TO_SRGB}',format=gbrp`
  : "format=gbrp";
// Tarayıcı kareyi sRGB çizer. Açıkça BT.709 matrisiyle çevrilip etiketlenmezse
// ffmpeg BT.601 matrisiyle çevirir, oynatıcılar ve YouTube ise etiketsiz HD'yi
// BT.709 diye çözer: kırmızı ve yeşil kayar. scale matrisi ve aralığı yazar;
// birincil renkler ve aktarım eğrisi akışa yalnız setparams ile geçer, çıktı
// bayrakları (-color_*) kapsayıcıdaki etiketi tamamlar.
const COLOR = "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709";
const range = { from: 0, frames: 0 };

function startEncoder() {
  const vin = ["-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps * sub), "-i", "-"];
  const ain = audio && !gif ? ["-ss", String(range.from / fps), "-t", String(range.frames / fps), "-i", audio] : [];
  const enc = gif
    ? ["-filter_complex", `[0:v]${blur},split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a`, "-r", String(fps), "-loop", "0", partial]
    : ["-vf", `${blur},${COLOR}`, "-r", String(fps), "-frames:v", String(range.frames),
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
      ...(args.grain ? ["-tune", "grain", "-x264-params", "aq-mode=3"] : []),
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      ...(ain.length ? ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "320k", "-shortest"] : []),
      "-movflags", "+faststart", partial];
  // Girdi kodlayıcısı AÇIK (mjpeg): verilmezse ffmpeg borudan akışı tanıyamadı ve
  // "Output file does not contain any stream" ile düştü (11 Ekim, ffmpeg 6).
  const ff = spawn(process.env.FFMPEG || "ffmpeg", ["-y", "-loglevel", "error", ...vin, ...ain, ...enc], { stdio: ["pipe", "inherit", "inherit"] });
  procs.add(ff);
  let dead = null;
  const closed = new Promise(r => ff.on("close", c => { procs.delete(ff); r(c); }));
  ff.on("error", e => { dead = e.code === "ENOENT" ? "ffmpeg bulunamadı (PATH ya da FFMPEG)" : e.message; });
  ff.stdin.on("error", () => { dead ??= "ffmpeg girdiyi erken kapattı (kendi mesajı yukarıda)"; });
  return {
    async write(buf) {
      if (dead) throw new Error(dead);
      if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once("drain", r)), closed]);
      if (dead) throw new Error(dead);
    },
    async end() {
      ff.stdin.end();
      const c = await closed;
      if (dead || c !== 0) throw new Error(`ffmpeg: ${dead || "çıkış kodu " + c}`);
    },
  };
}

// —— Kaynak izi: kesilmiş render'a dönüldüğünde sayfa değişmişse eski kareler kullanılmaz ——
function sourcesHash(requests) {
  const h = createHash("sha1");
  for (const u of [...new Set(requests)].filter(u => u.startsWith("file:")).sort()) {
    try { h.update(u).update(readFileSync(fileURLToPath(u.split(/[?#]/)[0]))); } catch { h.update(u); }
  }
  return h.digest("hex");
}

const started = Date.now();
try {
  const first = await openWorker(workers > 1 ? "[w0] " : "");
  await warnSoftwareGL(first.page);
  const { DUR, EV } = await first.page.evaluate(() => ({ DUR: window.DUR, EV: window.EV ?? [] }));
  if (!(DUR > 0)) await fail(`window.DUR pozitif bir saniye olmalı (gelen: ${DUR}).`);
  const from = Number(args.from ?? 0), to = Math.min(Number(args.to ?? DUR), DUR);
  range.from = Math.round(from * fps);
  range.frames = Math.round(to * fps) - range.from;
  if (range.frames < 1) await fail(`aralık boş: --from=${from} --to=${to}.`);
  mkdirSync(dirname(out), { recursive: true });
  // Uzantı ne olursa olsun değiştirilir: yalnız .mp4 değişseydi --out=x.gif'te JSON videonun yoluna yazılır, ffmpeg -y onu ezerdi.
  if (args.events) writeFileSync(out.replace(/\.[^./\\]+$/, "") + ".events.json", JSON.stringify({ DUR, EV }, null, 2));

  const f0 = range.from, F = range.frames, total = F * sub;
  const progress = (n) => process.stdout.write(`\r${(n / total * 100).toFixed(0)}% (${n}/${total} alt kare)`);

  if (workers === 1 && !args["frames-dir"]) {
    // Tek işçi: kareler diske uğramadan sırayla kodlayıcıya akar.
    const enc = startEncoder();
    let n = 0;
    for (let f = f0; f < f0 + F && !failing; f++) {
      for (let s = 0; s < sub; s++) { await enc.write(await shoot(first.page, subT(f, s))); n++; }
      if ((f - f0) % fps === 0) progress(n);
    }
    await enc.end();
  } else {
    // Çok işçi: her alt kare kendi dosyası. Mutlak alt kare sırasıyla adlanır, yani
    // başka bir --from/--to aynı kareleri yeniden kullanır. Yazım .tmp + rename:
    // kesilen yazım yarım JPEG bırakmaz; 1 KB altı dosya bozuk sayılıp yeniden çizilir.
    const dir = resolve(String(args["frames-dir"] || out.replace(/\.[^./\\]+$/, "") + ".frames"));
    const meta = { url: filmUrl(target, false), W, H, scale, fps, sub, shutter, sources: sourcesHash(first.watch.requests) };
    const metaPath = join(dir, "meta.json");
    if (existsSync(dir) && readdirSync(dir).length) {
      if (!existsSync(metaPath)) await fail(`${dir} boş değil ve film-video'nun değil (meta.json yok): başka bir --frames-dir ver.`);
      else if (readFileSync(metaPath, "utf8") !== JSON.stringify(meta)) {
        console.log(`not: ${dir} başka ayarla ya da sayfanın eski sürümüyle çizilmiş; silinip baştan çiziliyor.`);
        rmSync(dir, { recursive: true, force: true });
      }
    }
    mkdirSync(dir, { recursive: true });
    framesDir = dir;
    writeFileSync(metaPath, JSON.stringify(meta));
    const file = (g) => join(framesDir, `f${String(g).padStart(7, "0")}.jpg`);
    const ok = (p) => { try { return statSync(p).size >= 1024; } catch { return false; } };

    // Sıra: işçiler kısa parçaları baştan sona sırayla çeker (pdoom-video). Kesilen
    // koşu baştan bitişik bir blok bırakır, ilerleme yüzdesi gerçeği söyler.
    const CHUNK = 8, chunks = [];
    for (let f = f0; f < f0 + F; f += CHUNK) chunks.push([f, Math.min(f0 + F, f + CHUNK)]);
    const done0 = Array.from({ length: total }, (_, i) => ok(file(f0 * sub + i))).filter(Boolean).length;
    if (done0) console.log(`${done0}/${total} alt kare zaten çizili, kalanı çiziliyor.`);
    let next = 0, n = done0;
    const run = async (w) => {
      const wk = w === 0 ? first : await openWorker(`[w${w}] `);
      while (!failing && next < chunks.length) {
        const [a, b] = chunks[next++];
        for (let f = a; f < b && !failing; f++) for (let s = 0; s < sub; s++) {
          const p = file(f * sub + s);
          if (ok(p)) continue;
          writeFileSync(p + ".tmp", await shoot(wk.page, subT(f, s)));
          renameSync(p + ".tmp", p);
          if (++n % (fps * sub) === 0) progress(n);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(workers, chunks.length) }, (_, w) => run(w)));
    const enc = startEncoder();
    for (let g = f0 * sub; g < (f0 + F) * sub && !failing; g++) await enc.write(readFileSync(file(g)));
    await enc.end();
  }
  renameSync(partial, final);
  await Promise.allSettled([...browsers].map(b => b.close()));
  if (framesDir && !args["keep-frames"]) rmSync(framesDir, { recursive: true, force: true });
  console.log(`\r${F} kare${sub > 1 ? ` × ${sub} alt kare (obtüratör ${shutter})` : ""} · ${PW}×${PH} · ${workers} işçi (${first.env.name}) → ${final} · ${((Date.now() - started) / 1000).toFixed(1)} sn`);
} catch (e) {
  // Yığının ilk iki satırı yeter: hata ve sayfadaki yeri; gerisi kütüphanenin içi.
  await fail(`render durdu: ${String(e?.message || e).split("\n").slice(0, 2).join("\n")}`);
}
