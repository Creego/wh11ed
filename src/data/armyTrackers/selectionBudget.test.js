import { describe, it, expect } from 'vitest'
import { selectionBudget } from './selectionBudget.js'
import { resolveArmyTracker } from './index.js'

const sm = (dets = []) => resolveArmyTracker('space-marines', dets)
const open = (b) => Object.keys(b).filter((id) => b[id].open)

describe('selectionBudget — Combat Doctrines', () => {
  it('is null for a selection with no per-battle limit', () => {
    expect(selectionBudget(resolveArmyTracker('adeptus-mechanicus'), { 1: 'protector' }, 2)).toBeNull()
  })

  it('spends each doctrine once, and names the round it went in', () => {
    const b = selectionBudget(sm(), { 1: 'devastator', 2: 'tactical' }, 3)
    expect(open(b)).toEqual(['assault'])
    expect(b.devastator.usedIn).toEqual([1])
  })

  // The round on screen never counts against itself — its pick can be kept or swapped — but a
  // later round does: scrolling back to round 1 must not reopen what round 3 took.
  it('leaves the shown round out and counts every other, later ones included', () => {
    expect(open(selectionBudget(sm(), { 1: 'devastator' }, 1))).toEqual(['assault', 'devastator', 'tactical'])
    expect(open(selectionBudget(sm(), { 1: 'devastator', 3: 'assault' }, 1))).toEqual(['devastator', 'tactical'])
  })

  it('gives a Brethren detachment one more of its own doctrine only', () => {
    const b = selectionBudget(sm(['Tactical Brethren']), { 1: 'tactical', 2: 'assault' }, 3)
    expect(open(b)).toEqual(['devastator', 'tactical'])
    expect(open(selectionBudget(sm(['Tactical Brethren']), { 1: 'tactical', 2: 'tactical' }, 3))).toEqual(['assault', 'devastator'])
  })

  it('gives Gladius one more of any, once', () => {
    const one = selectionBudget(sm(['Gladius Task Force']), { 1: 'devastator', 2: 'tactical', 3: 'assault' }, 4)
    expect(open(one)).toEqual(['assault', 'devastator', 'tactical'])
    const spentSpare = selectionBudget(sm(['Gladius Task Force']), { 1: 'devastator', 2: 'devastator', 3: 'assault' }, 4)
    expect(open(spentSpare)).toEqual(['tactical'])
  })

  // An army can field several detachments; their extra picks add up rather than overwrite.
  it('adds up the extras of several detachments', () => {
    const spec = sm(['Gladius Task Force', 'Tactical Brethren', 'Assault Brethren'])
    expect(spec.spareUses).toBe(1)
    expect(spec.bonusUses).toEqual({ tactical: 1, assault: 1 })
    const b = selectionBudget(spec, { 1: 'tactical', 2: 'tactical', 3: 'tactical' }, 4)
    expect(open(b)).toEqual(['assault', 'devastator'])
  })
})
