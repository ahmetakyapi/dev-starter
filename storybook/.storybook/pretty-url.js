/* Okunur adresler (26 Kasım 2026, sahibinin isteği: "?path=/story/cover--overview kabul
   edilemez; tek / sonrası, iç içe olanlar ev/oda gibi").

   Şema:  /                  → Tanıtım (kapak)
          /area-chart        → bileşenin sayfası (belgesi; belgesi yoksa ilk hikaye)
          /area-chart/stacked→ o bileşenin bir hikayesi
          /portal/customers  → Portal'ın Aboneler ekranı
   Diğer sorgular (tema, args) olduğu gibi kalır: /portal?globals=theme:dark

   Storybook'un yönlendiricisi yalnız `?path=` anlar. Bu betik derlemede (scripts/seo-head.mjs)
   index.html'in <head>'ine, Storybook'tan ÖNCE gömülür ve üç yerde çevirir:
   1. Açılışta: okunur adres → `?path=` (Storybook doğru hikayeyi açsın).
   2. Her gezinmeden sonra: Storybook'un yazdığı `?path=` → okunur adres (adres çubuğu temiz).
   3. Geri/ileri tuşunda: okunur adres → `?path=`, Storybook okumadan önce (yakalama dinleyicisi).
   `window.__SB_LANDING__` = { grup: açılış kimliği }, derlemede index.json'dan üretilir.
   Eski `?path=` bağlantıları çalışmaya devam eder (açılınca okunur adrese döner). */
(function () {
  var L = window.__SB_LANDING__ || {};
  var HOME = "cover--overview";
  var nativeReplace = history.replaceState.bind(history);
  var nativePush = history.pushState.bind(history);
  // Storybook önizleme çerçevesinin adresini sayfanın YOLUNDAN üretir ("/portal/customers/iframe.html"
  // → 404). Bu değişken varsa onu kullanır (runtime: `scope.PREVIEW_URL || …`).
  window.PREVIEW_URL = "/iframe.html";
  // Storybook yönlendiricisi açılışta `?path=`i GEÇ okur (dizin yüklenince). Ondan önce adresi
  // toparlarsak hikaye seçilmez (çerçeve "id=*"). İlk gerçek hikaye çerçeveye gelene dek bekle.
  var ready = false;

  function toPath(id) {
    if (id === HOME) return "/";
    var i = id.indexOf("--");
    var group = id.slice(0, i);
    return L[group] === id ? "/" + group : "/" + group + "/" + id.slice(i + 2);
  }
  function fromPath(pathname) {
    var parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (!parts[0] || !L[parts[0]] || parts.length > 2) return null;
    return parts.length === 1 ? L[parts[0]] : parts[0] + "--" + parts[1];
  }
  function query(search, drop) {
    var out = search.replace(/^\?/, "").split("&").filter(function (kv) { return kv && kv.split("=")[0] !== drop; });
    return out.length ? "?" + out.join("&") : "";
  }
  /* Okunur adres → Storybook'un anladığı adres. */
  function toStorybook(loc) {
    if (/[?&]path=/.test(loc.search)) return null;
    var id = fromPath(loc.pathname);
    if (!id) return null;
    var kind = /--docs$/.test(id) ? "docs" : "story";
    var rest = query(loc.search, "path").replace(/^\?/, "");
    return "/?path=/" + kind + "/" + id + (rest ? "&" + rest : "") + loc.hash;
  }
  /* Storybook'un yazdığı adres → okunur adres. */
  function toPretty(loc) {
    var m = loc.search.match(/[?&]path=\/(story|docs)\/([a-z0-9-]+--[a-z0-9-]+)/);
    if (!m) return null;
    return toPath(m[2]) + query(loc.search, "path") + loc.hash;
  }
  function tidy() {
    if (!ready) return;
    var next = toPretty(location);
    if (next && next !== location.pathname + location.search + location.hash) nativeReplace(history.state, "", next);
  }

  // 1. Açılış. Tanınmayan yol (/eski-bir-ad) ana sayfaya düşer; Storybook kapakla açılır.
  var start = toStorybook(location);
  if (start) nativeReplace(history.state, "", start);
  else if (location.pathname !== "/" && !/[?&]path=/.test(location.search)) nativeReplace(history.state, "", "/" + location.search + location.hash);

  // 2. Storybook her adres yazdığında, yazdıktan hemen sonra toparla.
  history.pushState = function () { nativePush.apply(null, arguments); setTimeout(tidy, 0); };
  history.replaceState = function () { nativeReplace.apply(null, arguments); setTimeout(tidy, 0); };

  // 3. Geri/ileri: Storybook'un dinleyicisinden önce (yakalama evresi) çevir.
  window.addEventListener("popstate", function () {
    var back = toStorybook(location);
    if (back) nativeReplace(history.state, "", back);
    setTimeout(tidy, 0);
  }, true);

  // Hazır işareti: kenar çubuğunda seçili satır (yönlendirici hikayeyi seçti). Çerçevenin adresi
  // güvenilmez: kökten açılınca "id=*" kalır, hikaye kanaldan gelir.
  var wait = setInterval(function () {
    if (document.querySelector('#storybook-explorer-tree [data-selected="true"]')) { ready = true; clearInterval(wait); tidy(); }
  }, 100);
})();
