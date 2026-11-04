/**
 * Kart kapakları: sitelerin KENDİ paylaşım görselleri (og:image), bağlantıyla
 * gösterilir, depoya kopyalanmaz. Bağlantı önizlemesi için yayımlanmış
 * görseldir; ekran görüntüsü değildir (`design-references.md` → Kullanım
 * Şartı). Görsel yoksa ya da yüklenmezse kart baş harfli kapağa düşer.
 *
 * Toplandı: 2026-11-04 (sayfa başlığındaki `og:image` / `twitter:image`).
 * Site görselini değiştirirse adres kırılabilir; kırılan kapak sessizce
 * yedeğe döner, sayfa bozulmaz.
 */
export const COVERS: Record<string, string> = {
  "bencho.dev": "https://bencho.dev/share-cover-ring.png",
  "easyui.site": "https://easyui.site/og-image.webp",
  "ui.wensity.com": "https://ui.wensity.com/og/wensity-ui-og.jpg",
  "developer.apple.com": "https://developer.apple.com/tutorials/developer-og.jpg",
  "shojimac.com": "https://shojimac.com/og.jpg",
  "www.boardui.com": "https://www.boardui.com/og_image.png",
  "aciliszili.com": "https://aciliszili.com/opengraph-image",
  "www.navbar.gallery": "https://cdn.prod.website-files.com/65676438ff1c480b81cf0085/65d0d08ee366dcfc3c73aa94_ogimage%20(2).webp",
  "www.cta.gallery": "https://framerusercontent.com/images/yXhxFS3RMgsD2U3vLGvsjBaE4Q.jpg",
  "www.footer.design": "https://cdn.prod.website-files.com/64fe0870e6e4f3a42a145c1c/6514c4e3bcde78421b541de9_open-graph.webp",
  "www.404s.design": "https://cdn.prod.website-files.com/65ba70a4bb6f912baf009423/6899c6b37147b1d3587301c5_2533.webp",
  "bentogrids.com": "https://bentogrids.com/images/og.png",
  "scrolltide.co": "https://www.scrolltide.co/og/home-v2.jpg",
  "unsection.com": "https://www.unsection.com/images/og-default.png",
  "60fps.design": "https://framerusercontent.com/images/ICYS2f0rsJ9iOphXyUh94ULRS8Y.gif",
  "base-ui.com": "https://base-ui.com/opengraph-image-j8qpfc.png",
  "keepachangelog.com": "https://keepachangelog.com/assets/images/keep-a-changelog-opengraph-851f2d20.png",
};

export function coverOf(href: string | undefined) {
  if (!href) return undefined;
  try {
    return COVERS[new URL(href).hostname];
  } catch {
    return undefined;
  }
}

export function hostOf(href: string | undefined) {
  if (!href) return undefined;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
