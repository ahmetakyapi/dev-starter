/**
 * JSON-LD'yi `<script>` içine güvenle gömer.
 *
 * `JSON.stringify` "<" karakterine dokunmaz; içerikten gelen bir
 * `</script>` dizisi betiği erken kapatır ve ardından gelen her şey HTML
 * olarak çalışır. "<" kaçırılınca JSON anlamı aynı kalır, HTML ayrıştırıcısı
 * ise etiketi göremez.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
