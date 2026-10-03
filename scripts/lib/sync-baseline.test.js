import { describe, it, expect } from 'vitest'
import { loadBaseline } from './sync-baseline.mjs'
import { baselineClass } from './sync-baseline-classes.mjs'

// The ratchet (hub journal 2026-10-03-baseline-to-app.md): an accepted finding carries the reason
// it was accepted. The baseline went in on 2026-09-12 with 732 findings and no reasons; until they
// are all sorted this number may only go DOWN — lower it as entries are fixed or explained, never
// raise it. A new finding goes into the baseline with its reason, or it is fixed.
const UNEXPLAINED_CEILING = 331

describe('sync baseline', () => {
  const baseline = loadBaseline()

  it('does not gain entries without a reason', () => {
    const empty = Object.values(baseline).filter((why) => !why).length
    expect(empty).toBeLessThanOrEqual(UNEXPLAINED_CEILING)
  })

  it('files every entry under a named class', () => {
    expect(Object.keys(baseline).filter((k) => baselineClass(k) === 'other')).toEqual([])
  })
})
