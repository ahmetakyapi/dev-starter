/**
 * Kart kapakları: sitelerin KENDİ paylaşım görselleri (og:image), bağlantıyla
 * gösterilir, depoya kopyalanmaz. Bağlantı önizlemesi için yayımlanmış
 * görseldir; ekran görüntüsü değildir (`design-references.md` → Kullanım
 * Şartı). Görsel yoksa ya da yüklenmezse kart baş harfli kapağa düşer.
 *
 * Toplandı: 2026-11-04, ek üç site 2026-11-11, beş site 2026-11-18 (sayfa
 * başlığındaki `og:image` / `twitter:image`).
 *
 * GitHub deposu: GitHub'ın kendi paylaşım görseli (`opengraph.githubassets.com`).
 * Kendi projelerimiz: ahmetakyapi.com'daki ekran görüntüleri (bizim işimiz).
 * Hiçbiri yoksa kart, bölümüne göre tasarlanmış kapağa düşer (Referanslar →
 * `ConceptCover`): baş harf değil, adı ve türü söyleyen bir sahne.
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
  "meetribbon.app": "https://meetribbon.app/opengraph-image",
  "offscreen.wtf": "https://offscreen.wtf/opengraph-image",
  "secki.dev": "https://secki.dev/og.jpg?v=2",
  "keepachangelog.com": "https://keepachangelog.com/assets/images/keep-a-changelog-opengraph-851f2d20.png",
  "allo.joshpuckett.me": "https://allo.joshpuckett.me/og.png",
  "ingotui.com": "https://ingotui.com/opengraph-image",
  "patterncraft.fun": "https://patterncraft.fun/og-banner.png",
  "lottiefiles.com": "https://stp-v4-cdn.lottiefiles.com/ogimage_Homepage_b5840ac00c.png",
  "lenis.dev": "https://lenis.dev/og.png?v=1",
};

/** Kendi projelerimiz: kart adına göre, ahmetakyapi.com'daki ekran görüntüsü (açık tema, 640 px). */
const SHOT = (slug: string) => `https://www.ahmetakyapi.com/projects/${slug}/desktop-light.w640.webp`;
export const PROJECT_COVERS: Record<string, string> = {
  "Açılış Zili": SHOT("acilis-zili"),
  "Ramazan Vakitleri": SHOT("ramazan-vakitleri"),
  "Keşke Alsaydım": SHOT("keskealsaydim"),
  DigyNotes: SHOT("digynotes"),
  Mimio: SHOT("mimio"),
  "dev-starter Storybook": "./og.png",
  "ahmetakyapi.com": "https://www.ahmetakyapi.com/opengraph-image",
};

export function coverOf(href: string | undefined) {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    const host = url.hostname;
    // GitHub deposu: GitHub'ın depo paylaşım görseli (yol: /sahip/depo).
    if (host === "github.com") {
      const [owner, repo] = url.pathname.split("/").filter(Boolean);
      return owner && repo ? `https://opengraph.githubassets.com/dev-starter/${owner}/${repo}` : undefined;
    }
    // Arşivde adres bazen www'lu bazen www'suz: ikisi de aynı kapağa düşer.
    return COVERS[host] ?? COVERS[host.replace(/^www\./, "")] ?? COVERS[`www.${host}`];
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
