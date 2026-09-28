import { describe, it, expect } from 'vitest'
import { motionFor } from './usePageMotion.js'
import { router } from '../router/index.js'

const at = (path) => router.resolve(path)

describe('motionFor — which way a page swap moves', () => {
  it('slides forward going down a chain and back coming up', () => {
    expect(motionFor(at('/factions'), at('/factions/orks'))).toBe('axis-back')
    expect(motionFor(at('/factions/orks'), at('/factions'))).toBe('axis-fwd')
    expect(motionFor(at('/factions/orks/datasheets/boyz'), at('/factions/orks/datasheets'))).toBe('axis-fwd')
  })

  // The editor is deeper than the view although its path is shorter — levels, not path depth.
  it('reads depth from the route, not from the path', () => {
    expect(motionFor(at('/roster/abc'), at('/roster/abc/view'))).toBe('axis-fwd')
    expect(motionFor(at('/roster/abc/view'), at('/roster/abc'))).toBe('axis-back')
  })

  it('holds for the Russian paths too', () => {
    expect(motionFor(at('/ru/factions/orks'), at('/ru/factions'))).toBe('axis-fwd')
  })

  it('fades between chains, between siblings and for a page with no level', () => {
    expect(motionFor(at('/roster'), at('/factions'))).toBe('fade')
    expect(motionFor(at('/factions/orks/faq'), at('/factions/orks'))).toBe('fade')
    expect(motionFor(at('/tracker/game'), at('/tracker'))).toBe('fade')
    expect(motionFor(at('/'), at('/factions'))).toBe('fade')
  })

  // Safari animates its own edge-swipe; a history step on iOS must not slide on top of that.
  it('fades a history step on iOS, and only there', () => {
    const to = at('/factions'); const from = at('/factions/orks')
    expect(motionFor(to, from, { fromHistory: true, ios: true })).toBe('fade')
    expect(motionFor(to, from, { fromHistory: true, ios: false })).toBe('axis-back')
    expect(motionFor(to, from, { fromHistory: false, ios: true })).toBe('axis-back')
  })
})
