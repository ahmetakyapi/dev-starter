// Önizleme taslağının oturum kimliği (bkz. drafts.ts). Her düzenleyici açılışı yenisini üretir;
// yalnız tarayıcıda: sunucuda boş döner, iframe zaten tarayıcıda kurulur.
const SESSION_BYTES = 12;

export function createDraftSession(): string {
  if (typeof window === "undefined") return "";
  const bytes = crypto.getRandomValues(new Uint8Array(SESSION_BYTES));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Önizleme rotasının adresi: oturum, dil, kayıt ve açılışta kayılacak bölüm (odak). */
export function previewSrc(base: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const search = query.toString();
  return `${base}${search ? `?${search}` : ""}`;
}
