/**
 * İş günü takvimi (saf; hiçbir şeye bağımlı değil). Kesme/bağlama emirleri,
 * banka ödemeleri ve saha işleri iş gününe oturur.
 *
 * Resmi tatil listesi ÖRNEKTİR (gerçek takvim değil): Ayarlar → Kesme Kuralları
 * kendi listesini taşır; bu liste yalnız başlangıç değeridir.
 */

export const SAMPLE_HOLIDAYS: readonly string[] = ["2026-12-31", "2027-01-01"];

const pad = (n: number) => String(n).padStart(2, "0");
export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isWeekend = (key: string) => [0, 6].includes(dateOf(key).getDay());

export function isBusinessDay(key: string, holidays: readonly string[] = SAMPLE_HOLIDAYS) {
  return !isWeekend(key) && !holidays.includes(key);
}

/** Verilen gün iş günüyse kendisi, değilse sonraki iş günü. */
export function nextBusinessDay(key: string, holidays: readonly string[] = SAMPLE_HOLIDAYS) {
  let d = dateOf(key);
  while (!isBusinessDay(keyOf(d), holidays)) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return keyOf(d);
}

/** Verilen gün iş günüyse kendisi, değilse önceki iş günü. */
export function prevBusinessDay(key: string, holidays: readonly string[] = SAMPLE_HOLIDAYS) {
  let d = dateOf(key);
  while (!isBusinessDay(keyOf(d), holidays)) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return keyOf(d);
}

/** `n` iş günü sonrası (n=0: bugün iş günüyse bugün). */
export function addBusinessDays(key: string, n: number, holidays: readonly string[] = SAMPLE_HOLIDAYS) {
  let d = dateOf(nextBusinessDay(key, holidays));
  let left = n;
  while (left > 0) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (isBusinessDay(keyOf(d), holidays)) left -= 1;
  }
  return keyOf(d);
}

/** Mesai içinde mi (saat 0-23). */
export const inWorkHours = (hour: number, start = 8, end = 17) => hour >= start && hour < end;
