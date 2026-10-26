/**
 * Türkçe (ve İngilizce) başlık metni: Title Case, anlam öbekleriyle satır kırma, punto sığdırma
 *
 * Kaynak: geo-tour `lib/text.ts` (Ekim 2026). Orada dev Playfair başlıklarında "Yaşatmak /
 * İstediğimiz Geziler", "Üç / Şey", "ve" ile biten satır gibi kırılmaları bitirdi.
 * `text-wrap: balance` satırları dengeler ama Türkçenin anlam birliklerini bilmez; bu dosya
 * birlikleri kurar, tarayıcı yalnızca birlikler ARASINDAN kırar.
 *
 * Kullanım: `lib/text.ts` olarak kopyala. "use client" DEĞİL: sunucu ve istemci bileşeni
 * aynı fonksiyonları kullanır. Çizim tarafı `snippets/phrases.tsx`. Testler
 * `snippets/tr-text.test.ts` (projeye `tests/text.test.ts` olarak taşı).
 *
 * Kurallar (tr):
 *  - "ve", "bir", "bu", "her", sayılar ("üç şey"), üleştirme ("birer tohum") sonraki kelimeye yapışır
 *  - "de/da", "mi", "ile", "için", "gibi", "kadar" gibi edat ve ekler önceki kelimeye yapışır
 *  - mastar sonraki fiille bir bütün: "yaşatmak istediğimiz", "okumak istiyoruz"
 *  - mastarın nesnesi mastarla: "orayı anlamak"; birleşik fiil adıyla: "merak ettiğin"
 *  - başlıkta son satırda tek kelime kalmaz (keepLastPair)
 *  - bölünmemesi gereken ad (marka, ürün) için `keep`: units(words, { keep: ['geo'] })
 */

export type Lang = 'tr' | 'en'

type Rules = {
  locale: string
  small: ReadonlySet<string>
  glueNext: ReadonlySet<string>
  gluePrev: ReadonlySet<string>
  /** Sonraki kelimeyle anlam birliği kuran kelime (Türkçede mastar). */
  bindsNext?: RegExp
  /** Önceki kelimeyle birleşik fiil kuran yardımcı ("ettiğin", "olarak"). */
  bindsPrev?: RegExp
}

const RULES: Record<Lang, Rules> = {
  tr: {
    locale: 'tr-TR',
    small: new Set(['ve', 'ile', 'için', 'de', 'da', 'ya', 'ki', 'mi', 'mı', 'mu', 'mü', 'ama', 'gibi', 'veya']),
    glueNext: new Set([
      've', 'bir', 'bu', 'şu', 'o', 'her', 'en', 'ya', 'veya', 'ama', 'hem', 'ne', 'çok', 'daha', 'hiç', 'az',
      'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on',
      'birer', 'ikişer', 'üçer', 'dörder', 'beşer', 'altışar', 'yedişer', 'sekizer', 'dokuzar', 'onar',
    ]),
    // Öbeğin başındaysalar ("Önce yakınımızdaki") sonraki kelimeye yapışırlar
    gluePrev: new Set([
      'de', 'da', 'mi', 'mı', 'mu', 'mü', 'ki', 'ile', 'gibi', 'için', 'kadar', 'sonra', 'önce', 'bile', 'değil',
      'göre', 'karşı', 'rağmen', 'boyunca', 'beri', 'dek', 'üzere', 'yana',
    ]),
    // En az altı harfli -mak/-mek: "ekmek", "yemek" gibi kısa adlar dışarıda kalır
    bindsNext: /^\p{L}{3,}m[ae]k$/u,
    // etmek / edilmek ve olmak çekimleri: ettiğin, ediyoruz, edilenler, olan, olarak, olur
    bindsPrev: /^(?:e[td]\p{L}+|ol(?:an|anlar|arak|ur|mak|du|acak|muş|ması))$/u,
  },
  en: {
    locale: 'en',
    small: new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'with', 'from', 'into', 'onto', 'over', 'than']),
    glueNext: new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'our', 'your', 'my', 'its',
      'their', 'this', 'that', 'every', 'each', 'no', 'not', 'more', 'most', 'very', 'so', 'as',
      'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    ]),
    gluePrev: new Set<string>(),
  },
}

const PHRASE_END = /[.,;:!?…]$/
const PUNCTUATION = /[.,;:!?…]+/g

const bare = (word: string, locale: string) => word.toLocaleLowerCase(locale).replace(/[^\p{L}]/gu, '')

function capitalize(word: string, locale: string): string {
  const i = word.search(/\p{L}/u)
  if (i < 0) return word
  return word.slice(0, i) + word[i].toLocaleUpperCase(locale) + word.slice(i + 1)
}

/**
 * Title Case: yalnız ilk harfi büyütür (Türkçede i → İ), kısaltmalara dokunmaz. Küçük kelimeler
 * baştaysa ya da noktalamadan sonra yeni öbek açıyorsa büyük başlar. `text-transform: capitalize`
 * yerine bu (o, Türkçede İ yerine I üretir).
 */
export function titleCase(text: string, lang: Lang = 'tr'): string {
  const { locale, small } = RULES[lang]
  const words = text.split(' ')
  return words
    .map((word, i) => {
      const opensPhrase = i === 0 || PHRASE_END.test(words[i - 1])
      const lower = word.toLocaleLowerCase(locale)
      return !opensPhrase && small.has(lower) ? lower : capitalize(word, locale)
    })
    .join(' ')
}

/** Hero başlığı için bütün noktalamayı atar. */
export function stripPunctuation(text: string): string {
  return text.replace(PUNCTUATION, '').replace(/\s+/g, ' ').trim()
}

// Başlıkta yalnız virgül kalır: hitapta doğal bir duraktır ("Merhaba, / Konuşalım")
const HEADING_DROP = /[.;:!?…]+/g

/** Başlık metni: virgül korunur, öteki noktalama düşer. */
export function headingText(text: string): string {
  return text.replace(HEADING_DROP, '').replace(/\s+/g, ' ').trim()
}

/** Metni anlam öbeklerine böler: noktalamayla biten kelime öbeği kapatır. */
export function phrases(text: string): string[][] {
  const groups: string[][] = [[]]
  for (const word of text.split(' ').filter(Boolean)) {
    groups[groups.length - 1].push(word)
    if (PHRASE_END.test(word)) groups.push([])
  }
  return groups.filter((g) => g.length > 0)
}

// Bundan uzun birlik yapıştırılmaz: dar ekranda taşma yerine normal kırılma tercih edilir
const UNIT_MAX_CHARS = 22
// Geniş ekranda birlikte kalan öbeğin üst sınırı (softGroups)
const SOFT_UNIT_MAX = 24

const length = (unit: readonly string[]) => unit.join(' ').length

export type UnitOptions = {
  /** Başlıkta son satırda tek kelime kalmasın. */
  keepLastPair?: boolean
  maxChars?: number
  lang?: Lang
  /** Sonraki kelimeye yapışacak ek kelimeler, küçük harf: marka adının ilk kelimesi ("geo"). */
  keep?: readonly string[]
}

function attachesPrev(word: string, lang: Lang): boolean {
  const { locale, gluePrev, bindsPrev } = RULES[lang]
  const key = bare(word, locale)
  return gluePrev.has(key) || (!!bindsPrev && bindsPrev.test(key))
}

function bindsNext(word: string, lang: Lang): boolean {
  const { locale, bindsNext: pattern } = RULES[lang]
  return !!pattern && !PHRASE_END.test(word) && pattern.test(bare(word, locale))
}

/**
 * Kelimeleri satır sonunda ayrılmaması gereken birliklere toplar: "ve Bir Mühendis",
 * "Yer mi", "of the Earth". Kırılma yalnızca birlikler arasında olur.
 */
export function units(words: readonly string[], { keepLastPair = false, maxChars = UNIT_MAX_CHARS, lang = 'tr', keep = [] }: UnitOptions = {}): string[][] {
  const { locale, glueNext, gluePrev } = RULES[lang]
  const extra = new Set(keep)
  const gluesNext = (key: string) => glueNext.has(key) || extra.has(key)
  const out: string[][] = []
  let pending: string[] = []
  for (const [i, word] of words.entries()) {
    const key = bare(word, locale)
    const last = out[out.length - 1]
    if (attachesPrev(word, lang) && pending.length === 0 && last && length(last) + word.length < maxChars) {
      last.push(word)
      continue
    }
    pending.push(word)
    // Mastar sonraki kelimeye, ikisi birlikte sınırı aşmıyorsa bağlanır (aşıyorsa softGroups'a kalır)
    const next = words[i + 1]
    const fits = next !== undefined && length([...pending, next]) <= maxChars
    const binds = bindsNext(word, lang) && fits
    // Mastarın nesnesi mastarla bir bütün ("Orayı Anlamak"); ardından edat geliyorsa
    // ("Gitmek ile") edat mastarda kalsın diye bağlanmaz
    const after = words[i + 2]
    const objectOf = fits && bindsNext(next, lang) && !PHRASE_END.test(word) && !(after !== undefined && attachesPrev(after, lang))
    const gluesForward = gluesNext(key) || binds || objectOf || (gluePrev.has(key) && !last && pending.length === 1)
    if (!gluesForward || length(pending) >= maxChars) {
      out.push(pending)
      pending = []
    }
  }
  if (pending.length > 0) out.push(pending)
  // Son kelimeyi korumak yalnız üç ve daha uzun kelimelik öbekte: iki kelimeyi tümden
  // yapıştırmak dev başlıkta dar ekrana sığmayabilir
  if (keepLastPair && out.length > 1 && words.length >= 3 && out[out.length - 1].length === 1) {
    const tail = out[out.length - 1]
    const before = out[out.length - 2]
    const rest = before.slice(0, -1)
    const lastWord = before[before.length - 1]
    const prevWord = rest[rest.length - 1]
    // Önceki birliğin son kelimesi ondan koparılamıyorsa ("Yer mi", "ve Bir") bütün iner
    const bound =
      prevWord !== undefined && (gluesNext(bare(prevWord, locale)) || bindsNext(prevWord, lang) || bindsNext(lastWord, lang) || attachesPrev(lastWord, lang))
    if (!bound && length([lastWord, ...tail]) <= maxChars) {
      out.splice(out.length - 2, 2, ...(rest.length > 0 ? [rest] : []), [lastWord, ...tail])
    } else if (bound && length([...before, ...tail]) <= maxChars) {
      out.splice(out.length - 2, 2, [...before, ...tail])
    }
  }
  return out
}

/**
 * Birlikleri geniş ekranda birlikte kalacak öbeklere toplar: mastarla biten birlik, kısa birlik
 * sınırını aşsa da sonrakiyle bir arada durur ("Yaşatmak İstediğimiz / Geziler"). Dar ekranda
 * öbek serbesttir, taşma olmaz.
 */
export function softGroups(list: readonly string[][], lang: Lang = 'tr', maxChars = SOFT_UNIT_MAX): string[][][] {
  const groups: string[][][] = []
  for (const unit of list) {
    const prev = groups[groups.length - 1]
    const tail = prev?.at(-1)?.at(-1)
    if (prev && tail && bindsNext(tail, lang) && length(prev.flat()) + 1 + length(unit) <= maxChars) prev.push(unit)
    else groups.push([unit])
  }
  return groups
}

/** Kelime sonraki kelimeye yapışır mı (kısa bağlaç, sayı, mastar); başlık parçaları arasında da geçerli. */
export function gluesToNext(word: string, lang: Lang = 'tr', keep: readonly string[] = []): boolean {
  const { locale, glueNext } = RULES[lang]
  if (PHRASE_END.test(word)) return false
  const key = bare(word, locale)
  return glueNext.has(key) || keep.includes(key) || bindsNext(word, lang)
}

export type TitlePart = { text: string; em?: boolean; br?: boolean }
export type PreparedPart = TitlePart & { lead?: string }

/**
 * Başlık parçalarını hazırlar: Title Case ve parçalar arası anlam bağı. Düz parçanın son kelimesi
 * sonrakine yapışıyorsa ("Şimdilik Sadece Birer" + vurgulu "Tohum") o kelime vurgulu öbeğin
 * başına geçer; "Birer Tohum" birlikte iner.
 */
export function prepareTitle(parts: readonly TitlePart[], lang: Lang = 'tr'): PreparedPart[] {
  const out: PreparedPart[] = parts.map((p) => ({ ...p, text: titleCase(p.text, lang) }))
  for (let i = 0; i < out.length - 1; i++) {
    const cur = out[i]
    const next = out[i + 1]
    if (cur.em || !next.em || next.br) continue
    const words = cur.text.trim().split(/\s+/)
    const last = words[words.length - 1]
    if (words.length < 2 || !last || !gluesToNext(last, lang)) continue
    cur.text = words.slice(0, -1).join(' ')
    next.lead = headingText(last)
  }
  return out
}

/** Başlığın zorunlu satırları (noktalama ve vurgulu kısım ayırır), kelime kelime. */
export function titleLines(prepared: readonly PreparedPart[]): string[][] {
  return prepared.flatMap((p) =>
    phrases(p.text).map((g, gi) => [...(p.lead && gi === 0 ? [p.lead] : []), ...g.map(headingText).filter(Boolean)]),
  )
}

/*
 * Harf genişliği, puntonun payı olarak. Bu tablo Playfair Display için ölçüldü (geo-tour); başka
 * bir başlık ailesinde kendi tablonu ver (`textEm(text, TABLO)`), yoksa tahmin dar ya da geniş
 * kalır. Tabloda olmayan harf için ortalama kullanılır.
 */
export const PLAYFAIR_EM: Readonly<Record<string, number>> = {
  a: 0.5, b: 0.56, c: 0.49, ç: 0.49, d: 0.58, e: 0.51, f: 0.33, g: 0.53, ğ: 0.53, h: 0.59, ı: 0.29, i: 0.29, j: 0.27, k: 0.52,
  l: 0.29, m: 0.89, n: 0.6, o: 0.55, ö: 0.55, p: 0.58, q: 0.56, r: 0.45, s: 0.45, ş: 0.45, t: 0.32, u: 0.58, ü: 0.58, v: 0.49,
  w: 0.77, x: 0.52, y: 0.5, z: 0.48, â: 0.5, î: 0.29, û: 0.58,
  A: 0.63, B: 0.62, C: 0.69, Ç: 0.69, D: 0.72, E: 0.61, F: 0.57, G: 0.7, Ğ: 0.7, H: 0.76, I: 0.34, İ: 0.34, J: 0.33, K: 0.66,
  L: 0.59, M: 0.87, N: 0.71, O: 0.74, Ö: 0.74, P: 0.59, Q: 0.74, R: 0.65, S: 0.54, Ş: 0.54, T: 0.62, U: 0.68, Ü: 0.68, V: 0.63,
  W: 0.91, X: 0.63, Y: 0.59, Z: 0.59, ' ': 0.25, ',': 0.26, '&': 0.84, "'": 0.19, '’': 0.25, '-': 0.5,
}
const GLYPH_DEFAULT = 0.55
// Alt piksel yuvarlama ve kerning payı
const GLYPH_SAFETY = 1.03

/** Metnin genişliği, puntonun katı olarak. */
export function textEm(text: string, table: Readonly<Record<string, number>> = PLAYFAIR_EM): number {
  let em = 0
  for (const ch of text) em += table[ch] ?? GLYPH_DEFAULT
  return em * GLYPH_SAFETY
}

type FitOptions = { lang?: Lang; maxEm: number; unitChars?: number; table?: Readonly<Record<string, number>> }

/**
 * Başlığın puntosunu belirleyen genişlik (punto katı): en uzun satır, en çok maxEm (daha uzun
 * satır öbeklerinden bölünür); bölünmez öbek her durumda sığar. CSS'te:
 *   font-size: min(var(--size), calc(100cqi / var(--fit-em)))   (kapta container-type: inline-size)
 */
export function titleFitEm(lines: readonly string[][], { lang = 'tr', maxEm, unitChars = 16, table }: FitOptions): number {
  const lineEm = Math.max(0, ...lines.map((words) => textEm(words.join(' '), table)))
  const unitEm = Math.max(
    0,
    ...lines.flatMap((words) =>
      softGroups(units(words, { keepLastPair: true, maxChars: unitChars, lang }), lang).map((g) => textEm(g.flat().join(' '), table)),
    ),
  )
  return Math.round(Math.max(unitEm, Math.min(lineEm, maxEm)) * 100) / 100
}

/** Paragrafı cümlelerine ayırır: kısa giriş metninde her cümle yeni satırdan başlar. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=\p{Lu})/u)
    .map((part) => part.trim())
    .filter(Boolean)
}
