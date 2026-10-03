import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * Varsayılan paylaşım görseli. Alt rotalar kendi `opengraph-image.tsx`ini
 * yazarak bunu ezer.
 *
 * Satori CSS değişkeni ÇÖZMEZ: renkler sabit ve kaynağı `app/globals.css`
 * `signature` paletinin koyu teması (zemin, metin, `--display-gradient`). Birden fazla çocuğu olan her düğümde `display: flex` şart;
 * `grid` yok.
 */
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
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
    size,
  );
}
