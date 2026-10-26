/**
 * Phrases — kısa metni anlam öbekleriyle çizer (kaynak: geo-tour)
 *
 * Kullanım: `components/phrases.tsx` olarak kopyala, `snippets/tr-text.ts`i `lib/text.ts` yap.
 *
 *   <h2 className="text-balance"><Phrases text={title} heading /></h2>
 *   <p className="text-pretty"><Phrases text={body} glue /></p>
 *
 * Birlik içindeki boşluk bölünmez boşluk (U+00A0) olur: tarayıcı yalnızca birlikler
 * arasından kırar. Noktalamaya kadar süren öbek `inline-block` bir span'de tek parça alt
 * satıra iner. Metin DOM'da düz kalır: ekran okuyucu ve kopyalama etkilenmez.
 *
 * Sunucu bileşeni: "use client" gerekmez.
 *
 * CSS (globals.css, @layer components):
 *   .phrase { display: inline-block; }
 */

import { Fragment } from 'react'

import { phrases, units, type Lang } from '@/lib/text'

const NBSP = ' '
// Kart başlıklarında birlik kısa kalır: büyük puntoda dar karta sığsın
const HEADING_UNIT_MAX = 16
// Bundan uzun öbek bütün tutulmaz: sığmayan uzun öbek önceki satırı erken bitirip boşluk bırakır
const PHRASE_KEEP_MAX = 34

type Props = {
  text: string
  /** Yalnız kısa kelimeleri yapıştır, öbekleri serbest bırak (dar kart metinleri). */
  glue?: boolean
  /** Son iki kelime birlikte kalır (kart başlığı). */
  heading?: boolean
  lang?: Lang
  /** Bölünmeyecek adın ilk kelimesi, küçük harf ("geo" → "Geo Tour"). */
  keep?: readonly string[]
}

export function Phrases({ text, glue = false, heading = false, lang = 'tr', keep }: Props) {
  const groups = glue ? [text.split(' ').filter(Boolean)] : phrases(text)
  return groups.map((group, i) => {
    const content = units(group, heading ? { keepLastPair: true, maxChars: HEADING_UNIT_MAX, lang, keep } : { lang, keep })
      .map((unit) => unit.join(NBSP))
      .join(' ')
    return (
      <Fragment key={i}>
        {i > 0 && ' '}
        {glue || content.length > PHRASE_KEEP_MAX ? content : <span className="phrase">{content}</span>}
      </Fragment>
    )
  })
}
