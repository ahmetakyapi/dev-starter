/**
 * tr-text testleri — başlık satır kırma kuralları. Vakalar geo-tour'un gerçek başlıklarından:
 * her biri bir zamanlar ekranda yanlış kırılmıştı.
 */

import { describe, expect, it } from 'vitest'

import {
  headingText,
  phrases,
  prepareTitle,
  sentences,
  softGroups,
  stripPunctuation,
  textEm,
  titleCase,
  titleFitEm,
  titleLines,
  units,
} from './tr-text'

const HEADING = { keepLastPair: true, maxChars: 16 } as const
const heading = (text: string, lang: 'tr' | 'en' = 'tr') =>
  phrases(titleCase(text, lang)).map((group) =>
    softGroups(units(group.map(stripPunctuation), { ...HEADING, lang }), lang).map((soft) => soft.map((unit) => unit.join(' ')).join(' + ')),
  )

describe('titleCase', () => {
  it('Türkçe bağlaçlar küçük kalır, i büyüyünce İ olur', () => {
    expect(titleCase('bir yere gitmek ile orayı anlamak', 'tr')).toBe('Bir Yere Gitmek ile Orayı Anlamak')
    expect(titleCase('işte ilk gezi', 'tr')).toBe('İşte İlk Gezi')
  })
  it('İngilizcede kısa edatlar küçük kalır', () => {
    expect(titleCase('journeys we long to bring to life', 'en')).toBe('Journeys We Long to Bring to Life')
  })
})

describe('units', () => {
  it('mastar sonraki fiille bir bütün', () => {
    expect(heading('Tohumlar: Yaşatmak İstediğimiz Geziler')).toEqual([['Tohumlar'], ['Yaşatmak + İstediğimiz', 'Geziler']])
    expect(units(['okumak', 'istiyoruz'])).toEqual([['okumak', 'istiyoruz']])
  })
  it('kısa adlar mastar sayılmaz', () => {
    expect(units(['Ekmek', 've', 'Peynir', 'Yolu'], HEADING)).toEqual([['Ekmek'], ['ve', 'Peynir', 'Yolu']])
  })
  it('birleşik fiil ve soru eki önceki kelimeden ayrılmaz', () => {
    expect(heading('Gitmek İstediğin, Merak Ettiğin Bir Yer mi Var')).toEqual([['Gitmek İstediğin'], ['Merak Ettiğin', 'Bir Yer mi Var']])
  })
  it('edat önceki kelimeye yapışır, mastarın nesnesi mastarla kalır', () => {
    expect(units(['Bir', 'Yere', 'Gitmek', 'ile', 'Orayı', 'Anlamak'])).toEqual([['Bir', 'Yere'], ['Gitmek', 'ile'], ['Orayı', 'Anlamak']])
  })
  it('sayı adıyla, üleştirme sayısı adıyla bir bütün', () => {
    expect(units(['Bizi', 'Farklı', 'Kılan', 'Üç', 'Şey'], HEADING)).toEqual([['Bizi'], ['Farklı'], ['Kılan'], ['Üç', 'Şey']])
    expect(units(['Şimdilik', 'Sadece', 'Birer', 'Tohum'], HEADING)).toEqual([['Şimdilik'], ['Sadece'], ['Birer', 'Tohum']])
  })
  it('marka adı keep ile bölünmez', () => {
    expect(units(['Geo', 'Tour', 'Gezileri'], { keep: ['geo'] })).toEqual([['Geo', 'Tour'], ['Gezileri']])
    expect(units(['Geo', 'Tour', 'Gezileri'])).toEqual([['Geo'], ['Tour'], ['Gezileri']])
  })
  it('İngilizcede tanımlık ve edat sonraki kelimeye yapışır', () => {
    expect(heading('Seeds: Journeys We Long to Bring to Life', 'en')).toEqual([['Seeds'], ['Journeys', 'We', 'Long', 'to Bring', 'to Life']])
  })
  it('son satırda tek kelime kalmaz', () => {
    expect(units(['Bir', 'Jeolog', 've', 'Bir', 'Mühendis'], HEADING)).toEqual([['Bir', 'Jeolog'], ['ve', 'Bir', 'Mühendis']])
  })
})

describe('headingText ve sentences', () => {
  it('virgül kalır, öteki noktalama düşer', () => {
    expect(headingText('Merhaba, Konuşalım.')).toBe('Merhaba, Konuşalım')
  })
  it('her cümle ayrı satır olur', () => {
    expect(sentences('Rotalar fikir aşamasında. Tarih uydurmuyoruz! Sorun?')).toEqual(['Rotalar fikir aşamasında.', 'Tarih uydurmuyoruz!', 'Sorun?'])
  })
})

describe('başlık ölçüleri', () => {
  const lines = titleLines(prepareTitle([{ text: 'Tohumlar:' }, { text: 'Yaşatmak İstediğimiz Geziler', em: true }]))
  it('zorunlu satırlar: noktalama ve vurgulu kısım ayırır', () => {
    expect(lines.map((l) => l.join(' '))).toEqual(['Tohumlar', 'Yaşatmak İstediğimiz Geziler'])
  })
  it('uzun satır sınırda kalır, bölünmez öbek her durumda sığar', () => {
    expect(titleFitEm(lines, { maxEm: 10 })).toBe(10)
    expect(titleFitEm(lines, { maxEm: 5 })).toBeGreaterThanOrEqual(textEm('Yaşatmak İstediğimiz') - 0.01)
  })
  it('düz parçanın son kelimesi vurguya bağlanır', () => {
    const prepared = prepareTitle([{ text: 'Şimdilik Sadece Birer' }, { text: 'Tohum', em: true }])
    expect(titleLines(prepared).map((l) => l.join(' '))).toEqual(['Şimdilik Sadece', 'Birer Tohum'])
  })
})
