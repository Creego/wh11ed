import { describe, it, expect } from 'vitest'
import { parseQualifier, qualifierNote } from './weaponTagQualifier.js'

describe('weaponTagQualifier', () => {
  it('reads the colon form, with and without "non-", in either case', () => {
    expect(parseQualifier('[LETHAL HITS: non-MONSTER/VEHICLE]')).toEqual({ ability: 'LETHAL HITS', keywords: ['MONSTER', 'VEHICLE'], negated: true, anti: false })
    expect(parseQualifier('LETHAL HITS: NON-MONSTER/VEHICLE')).toMatchObject({ negated: true, keywords: ['MONSTER', 'VEHICLE'] })
    expect(parseQualifier('SUSTAINED HITS 1: MONSTER/VEHICLE')).toEqual({ ability: 'SUSTAINED HITS 1', keywords: ['MONSTER', 'VEHICLE'], negated: false, anti: false })
    expect(parseQualifier('LETHAL HITS: CHARACTER/MONSTER/VEHICLE').keywords).toEqual(['CHARACTER', 'MONSTER', 'VEHICLE'])
  })

  it('reads an ANTI tag only when its keyword is negated or a list', () => {
    expect(parseQualifier('ANTI-non-VEHICLE 4+')).toEqual({ ability: 'ANTI', keywords: ['VEHICLE'], negated: true, anti: '4+' })
    expect(parseQualifier('ANTI-MONSTER/VEHICLE 4+')).toMatchObject({ negated: false, keywords: ['MONSTER', 'VEHICLE'] })
    expect(parseQualifier('ANTI-VEHICLE 4+')).toBe(null)
  })

  it('has nothing to add to a plain tag', () => {
    for (const t of ['LETHAL HITS', 'SUSTAINED HITS 2', 'RAPID FIRE 1', 'BLAST', 'CLEAVE 1']) expect(parseQualifier(t)).toBe(null)
  })

  it('says in words whom the tag works against, in both languages', () => {
    expect(qualifierNote('LETHAL HITS: non-MONSTER/VEHICLE')).toContain('**none** of these keywords: MONSTER, VEHICLE')
    expect(qualifierNote('LETHAL HITS: VEHICLE')).toContain('target a VEHICLE unit')
    expect(qualifierNote('LETHAL HITS: non-MONSTER/VEHICLE', 'ru')).toContain('**без** ключевого слова MONSTER и без VEHICLE')
    expect(qualifierNote('ANTI-non-VEHICLE 4+', 'ru')).toContain('**нет** ключевого слова VEHICLE')
    expect(qualifierNote('BLAST', 'ru')).toBe(null)
  })
})
