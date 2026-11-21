import { createSlice } from "./_core";
import type { Meter, Reading, ReadingFlag, ReadingSource } from "./_data";
import type { enterReading } from "./_ops";

/**
 * Saha okuma durumu (okuyucunun cep ekranı): çevrimdışı kuyruk, erişilemeyen
 * duraklar, kapanan turlar. Modül düzeyinde dilim: sayfa değişince ve
 * "çevrimdışı" modunda kaybolmaz. Okuma yalnız SENKRONDA depoya (`enterReading`)
 * yazılır; kuyrukta bekleyen okuma Okumalar sayfasında hâlâ "bekliyor" görünür.
 */

export type ReadingInput = Parameters<typeof enterReading>[1];

export type FieldQueueItem = {
  id: string;
  kind: "okuma" | "erisilemedi";
  meterId: string;
  readingId: string;
  at: string;
  input?: ReadingInput;
  reason?: string;
  photo?: string;
};
export type FieldState = {
  offline: boolean;
  regionId: string | null;
  queue: readonly FieldQueueItem[];
  /** Erişilemeyen duraklar: sayaç → neden (senkronlanmış). */
  skipped: Readonly<Record<string, string>>;
  closed: readonly string[];
  synced: number;
};
export const fieldState = createSlice<FieldState>({ offline: false, regionId: null, queue: [], skipped: {}, closed: [], synced: 0 });

export const SKIP_REASONS = [
  { value: "kapi", label: "Kapı Kilitli, Abone Yok" },
  { value: "ic-mekan", label: "Sayaç İç Mekanda, Girilemedi" },
  { value: "tehlike", label: "Güvenlik Riski (Köpek, Tehlikeli Ortam)" },
  { value: "hasar", label: "Sayaç Hasarlı, Okunamıyor" },
  { value: "adres", label: "Adres Bulunamadı" },
] as const;

export type CheckLine = { tone: "success" | "warning" | "danger"; text: string };

/** Saha giriş doğrulaması: Okumalar sayfasındaki kuralların aynısı (tek anlam). */
export function checkReading(args: {
  meter: Meter;
  prev: { t1: number; t2: number; t3: number };
  idx: { t1: number | null; t2: number | null; t3: number | null };
  expected: number;
  source: ReadingSource;
  hasPhoto: boolean;
}) {
  const { meter, prev, idx, expected, source, hasPhoto } = args;
  if (idx.t1 === null) return null;
  const d = (cur: number | null, old: number) => (cur === null ? null : Math.round((cur - old) * meter.multiplier));
  const u1 = d(idx.t1, prev.t1);
  const u2 = meter.multiZone ? d(idx.t2, prev.t2) : 0;
  const u3 = meter.multiZone ? d(idx.t3, prev.t3) : 0;
  if (u1 === null || u2 === null || u3 === null) return null;
  const total = u1 + u2 + u3;
  const reverse = [u1, u2, u3].some((u) => u < 0);
  const checks: CheckLine[] = [];
  let flag: ReadingFlag | null = null;
  if (reverse) {
    flag = "geri-sayim";
    checks.push({ tone: "danger", text: "Endeks önceki okumadan küçük (geri sayım). Sayaç değişmiş ya da taşmış olabilir: yerinde tekrar okuyun." });
  } else if (expected > 0 && total > expected * 2.5) {
    flag = "ani-sicrama";
    checks.push({ tone: "warning", text: `Tüketim beklenenin ${(total / expected).toFixed(1).replace(".", ",")} katı: ani sıçrama. Rakamları yeniden kontrol edin.` });
  } else if (expected > 0 && total < expected * 0.25) {
    flag = "dusuk-tuketim";
    checks.push({ tone: "warning", text: "Tüketim beklenenin çeyreğinin altında: sayaç durmuş ya da boş konut olabilir." });
  } else if (expected > 0) {
    checks.push({ tone: "success", text: "Tüketim beklenen aralıkta." });
  }
  if (source === "saha" && !hasPhoto) checks.push({ tone: "danger", text: "Fotoğraf zorunlu: endeks ekranı net görünmeli." });
  return { u1, u2, u3, total, reverse, flag, checks, anomaly: !!flag };
}

export type { Reading };
