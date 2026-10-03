import type { NextConfig } from "next";
// Ortam değişkenleri derlemenin ilk saniyesinde doğrulanır (kaçış: SKIP_ENV_VALIDATION=1).
import "./lib/env";

/**
 * Güvenlik başlıkları: "kırılma riski sıfıra yakın, faydası somut" kümesi.
 *
 * TAM CSP BİLİNÇLİ OLARAK YOK. Next'in satır içi önyükleme betiği ve satır
 * içi stiller `unsafe-inline` ister; o da CSP'nin XSS'e karşı faydasının
 * çoğunu götürür. Doğru CSP nonce tabanlıdır ve her sayfayı dinamik çizime
 * zorlar; ayrı bir karar. Yarım yapılmış hâli yanlış bir güvenlik hissi verir.
 *
 * `frame-ancestors` CSP olarak da veriliyor: modern tarayıcılarda
 * X-Frame-Options'tan önceliklidir, eski tarayıcılar ikincisini okur.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Üst dizinlerde başka bir lockfile varsa Turbopack kökü yanlış tahmin eder.
  turbopack: { root: __dirname },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // API yanıtları hiçbir ara katmanda önbelleğe girmez ve dizine girmez.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
