import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * Varsayılan paylaşım görseli. Alt rotalar kendi `opengraph-image.tsx`ini
 * yazarak bunu ezer.
 *
 * Satori CSS değişkeni ÇÖZMEZ: renkler sabit ve kaynağı `app/globals.css`
 * `signature` paletinin koyu teması (zemin, metin, `--display-gradient`).
 * Birden fazla çocuğu olan her düğümde `display: flex` şart; `grid` yok.
 */
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Başlığın ailesi: şablonda `app/layout.tsx`teki sans; font preset'i seçilince (guides/09 § 1, adım 6) presetin başlık ailesi. */
const FONT_FAMILY = "Manrope";

async function get(url: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

/*
 * Satori yalnızca kendisine verilen fontu çizer: next/og'un tek gömülü fontu
 * Geist Regular, orada `fontWeight: 700` etkisiz kalır ve başlık ince çıkar.
 * Rota statik; font derlemede, yalnızca gereken harflerle iner (next/font da
 * derlemede Google'a gidiyor). İnmezse Geist'e düşer, derleme kırılmaz;
 * zaman aşımı ağı kesik bir derlemenin takılıp kalmasını önler.
 */
async function loadFonts(text: string) {
  try {
    const query = `family=${FONT_FAMILY}:wght@400;700&text=${encodeURIComponent(text)}`;
    const css = await (await get(`https://fonts.googleapis.com/css2?${query}`)).text();
    const faces = [...css.matchAll(/font-weight:\s*(\d+);\s*src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/g)];
    const fonts = await Promise.all(
      faces.map(async ([, weight, src]) => ({
        name: FONT_FAMILY,
        data: await (await get(src)).arrayBuffer(),
        weight: Number(weight) as 400 | 700,
        style: "normal" as const,
      })),
    );
    return fonts.length > 0 ? fonts : undefined;
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage() {
  const fonts = await loadFonts(`${SITE_NAME}${SITE_DESCRIPTION}`);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: FONT_FAMILY,
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background:
            "radial-gradient(800px 500px at 0% 0%, rgba(53,184,255,0.18), transparent 60%), radial-gradient(700px 500px at 100% 100%, rgba(53,184,255,0.12), transparent 60%), #070d16",
          color: "#eaf1f8",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: -3,
            paddingBottom: 8,
            backgroundImage: "linear-gradient(112deg, #f2f7fc 0%, #b6e2ff 44%, #74caff 76%, #3fbcff 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "#94a7ba", maxWidth: 900 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
