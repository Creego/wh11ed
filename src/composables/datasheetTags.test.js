import { describe, expect, it } from 'vitest'
import { foldName, preloadDatasheetTags, unitTagHit } from './datasheetTags.js'

describe('unit tags', () => {
  it('finds a unit by its own ability, a core ability, a keyword and an RU ability name', async () => {
    await preloadDatasheetTags()
    expect(unitTagHit('orks', 'boyz', foldName('Tide'))).toBe('Tide of Muscle')
    expect(unitTagHit('orks', 'boyz', foldName('Mob'))).toBe('Mob')
    expect(unitTagHit('orks', 'boyz', foldName('Вал мус'))).toBe('Вал мускулов')
    expect(unitTagHit('space-marines', 'terminator-squad', foldName('deep strike'))).toBe('Deep Strike')
  })

  it("finds a Chapter's folded-in Space Marines sheet under the Chapter", async () => {
    await preloadDatasheetTags()
    expect(unitTagHit('blood-angels', 'terminator-squad', foldName('deep strike'))).toBe('Deep Strike')
  })

  it('stays silent below three characters, and for an unknown unit', async () => {
    await preloadDatasheetTags()
    expect(unitTagHit('orks', 'boyz', 'mo')).toBe(null)
    expect(unitTagHit('orks', 'no-such-unit', 'mob')).toBe(null)
  })
})
