import { describe, it, expect, beforeAll } from 'vitest'
import { prime, glossString } from './gloss-bold-terms.mjs'

beforeAll(prime)
const g = (s, l = 'en') => glossString(s, l)[0]

describe('gloss-bold-terms', () => {
  it('links a bold glossary term in either language', () => {
    expect(g('re-roll **hit rolls** of 1')).toBe('re-roll **[gloss:hit-roll:hit rolls]** of 1')
    expect(g('перебрасывать **броски на попадание**', 'ru')).toBe('перебрасывать **[gloss:hit-roll:броски на попадание]**')
  })

  it('makes a bold core unit ability the [core:] marker, qualifier and all', () => {
    expect(g('This model has **Feel No Pain 5+**.')).toBe('This model has [core:Feel No Pain 5+].')
    expect(g('**Stealth**.', 'ru')).toBe('[core:Stealth].')
  })

  it('links a slash list part by part, lending the shared tail word', () => {
    expect(g('an **advance/fall-back move**')).toBe('an **[gloss:advance:advance]/[gloss:fall-back-move:fall-back move]**')
  })

  it('leaves loadout headers, unknown terms and already-linked spans alone', () => {
    for (const s of ['**This model is equipped with:** 1 Bolt Rifle.', '**vowed objective**', '**[gloss:engaged:engaged]**']) expect(g(s)).toBe(s)
  })

  it('is idempotent', () => {
    const once = g('attacks have +1 **S** and are **engaged**')
    expect(g(once)).toBe(once)
  })
})
