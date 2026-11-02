/* Form hikâyelerinin ortak verisi. Takvimler sabit bir aya (Kasım 2026)
   bakar: ekran görüntüsü her gün aynı çıksın. */

export const NOV = (d: number) => new Date(2026, 10, d);
export const isSunday = (date: Date) => date.getDay() === 0;

/** Takvim günlerinin erişilebilir adı: `date-calendar.tsx` ile aynı biçim. */
export const dayLabel = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const TRY = { style: "currency", currency: "TRY", maximumFractionDigits: 0 } as const;

export const COLORS = [
  { value: "#a3e635", label: "Fıstık Yeşili" },
  { value: "#3b82f6", label: "Gök Mavisi" },
  { value: "#c084fc", label: "Leylak" },
  { value: "#f472b6", label: "Gül Kurusu" },
  { value: "#facc15", label: "Hardal" },
  { value: "#34d399", label: "Nane" },
  { value: "#0a0a0a", label: "Kömür" },
] as const;

export const SKILLS = [
  "Figma",
  "React",
  "Kullanıcı Araştırması",
  "Tasarım Sistemi",
  "Prototipleme",
  "Erişilebilirlik",
  "Hareket Tasarımı",
  "TypeScript",
] as const;

export const STAY_TAGS = [
  "Deniz Manzarası",
  "Sessiz Oda",
  "Erken Giriş",
  "Bebek Yatağı",
  "Vejetaryen Kahvaltı",
  "Otopark",
  "Evcil Hayvan",
] as const;
