import { describe, it, expect } from 'vitest'
import { diffBundles, diffCore, plain } from './diff-bundles.mjs'
import { diffMfm } from './diff-mfm.mjs'
import { diffFaq } from './diff-faq.mjs'

// Each case below is noise a real app update produced and a player would have read as a change.
const sheet = (over = {}) => ({
  name: 'Kill Tank',
  statlines: [{ name: 'Kill Tank', M: '10"', T: '11', Sv: '3+', W: '18', Ld: '7+', OC: '5' }],
  keywords: ['Vehicle', 'Kill Tank'],
  abilities: [
    { name: 'Deadly Demise D6', type: 'core', rules: 'When this model is destroyed…' },
    { name: 'Big Red', type: 'datasheet', rules: 'This model’s <b>attacks</b> have +1 to hit.' },
  ],
  wargear: [
    { name: 'Rokkit Launcha', profiles: [{ name: 'Blasta', type: 'ranged', range: '24"', A: '2', BS: '5+', S: '4', AP: '0', D: '1', tags: [] }] },
    { name: 'Tank Kannon', profiles: [{ name: 'Blasta', type: 'ranged', range: '48"', A: '10', BS: '5+', S: '6', AP: '-1', D: '1', tags: [] }] },
    { name: 'Deff Rolla', profiles: [{ name: 'Deff Rolla', type: 'melee', range: 'Melee', A: '6', BS: 'N/A', WS: '3+', S: '10', AP: '-1', D: '2', tags: [] }] },
  ],
  points: [{ models: 1 }],
  ...over,
})
const bundle = (ds) => ({ datasheets: [ds] })
const diff = (a, b) => diffBundles(bundle(a), bundle(b), 'orks')

describe('patch notes: what is not a change', () => {
  it('reads the same sheet as unchanged', () => {
    expect(diff(sheet(), sheet())).toEqual([])
  })

  it('ignores markup, quotes, dashes, and a pointer at the printed layout', () => {
    const b = sheet({ abilities: [sheet().abilities[0], { name: 'Big Red', type: 'datasheet', rules: "This model's attacks have +1 to hit (see left)" }] })
    expect(diff(sheet(), b)).toEqual([])
    expect(plain('fall‑back <b>move</b>')).toBe('fall-back move')
  })

  // Two weapons both have a "Blasta" profile; matching by profile name alone paired them and
  // reported the Kill Tank's Blasta as 48" → 24".
  it('keeps two profiles of the same name apart by their weapon', () => {
    const b = sheet({ wargear: [...sheet().wargear].reverse() })
    expect(diff(sheet(), b)).toEqual([])
  })

  it('reads BS "N/A" and "-", OC "-1" and "-", as the same', () => {
    const a = sheet({ statlines: [{ ...sheet().statlines[0], OC: '-1' }] })
    const b = sheet({
      statlines: [{ ...sheet().statlines[0], OC: '-' }],
      wargear: sheet().wargear.map((w) => ({ ...w, profiles: w.profiles.map((p) => ({ ...p, BS: p.BS === 'N/A' ? '-' : p.BS })) })),
    })
    expect(diff(a, b)).toEqual([])
  })

  it('does not count the unit’s own name among its keywords, nor a "(…)" note on an ability', () => {
    const b = sheet({ keywords: ['Vehicle'], abilities: [sheet().abilities[0], { ...sheet().abilities[1], name: 'Big Red (Aura)' }] })
    expect(diff(sheet(), b)).toEqual([])
  })

  // A core ability carries the core rule's text on every sheet: a change to that text is the core
  // rule's, reported once — not on every sheet that has the ability.
  it('compares core abilities by name only', () => {
    const b = sheet({ abilities: [{ ...sheet().abilities[0], rules: 'Reworded.' }, sheet().abilities[1]] })
    expect(diff(sheet(), b)).toEqual([])
  })

  it('leaves out the "Damaged N" ability that only restates the damage bracket', () => {
    const b = sheet({ abilities: [...sheet().abilities, { name: 'Damaged 6', type: 'core', rules: '…' }] })
    expect(diff(sheet(), b)).toEqual([])
  })
})

describe('patch notes: what is a change', () => {
  it('reports a characteristic, a weapon number and a tag', () => {
    const b = sheet({
      statlines: [{ ...sheet().statlines[0], T: '12' }],
      wargear: [sheet().wargear[0], { ...sheet().wargear[1], profiles: [{ ...sheet().wargear[1].profiles[0], A: '12', tags: ['BLAST'] }] }, sheet().wargear[2]],
    })
    const [x] = diff(sheet(), b)
    expect(x.fields).toEqual([
      { field: 'stat', model: 'Kill Tank', stat: 'T', from: '11', to: '12' },
      { field: 'weapon', change: 'changed', name: 'Tank Kannon – Blasta', type: 'ranged', stats: [{ stat: 'A', from: '10', to: '12' }], tags: { added: ['BLAST'], removed: [] } },
    ])
  })

  it('reports a renamed weapon once, as a rename', () => {
    const b = sheet({ wargear: [sheet().wargear[0], sheet().wargear[1], { ...sheet().wargear[2], name: 'Deff Rollas', profiles: [{ ...sheet().wargear[2].profiles[0], name: 'Deff Rollas', D: '3' }] }] })
    const [x] = diff(sheet(), b)
    expect(x.fields).toEqual([{ field: 'weapon', change: 'changed', name: 'Deff Rollas', type: 'melee', from: 'Deff Rolla', stats: [{ stat: 'D', from: '2', to: '3' }], tags: { added: [], removed: [] } }])
  })

  it('reports a core ability swapped for another', () => {
    const b = sheet({ abilities: [{ ...sheet().abilities[0], name: 'Deadly Demise D3' }, sheet().abilities[1]] })
    expect(diff(sheet(), b)[0].fields).toEqual([{ field: 'coreAbilities', added: ['Deadly Demise D3'], removed: ['Deadly Demise D6'] }])
  })

  it('reports a changed core rule once', () => {
    const r = (text) => ({ rules: [{ num: '10.01', title: 'Hit Roll', text }] })
    expect(diffCore(r('A 1 always fails.'), r('An unmodified 1 always fails.'))).toHaveLength(1)
  })

  it('reports points by size and note, and a new unit with its points', () => {
    const a = { units: [{ name: 'Immortals', options: [{ models: 5, points: 70 }, { models: 10, points: 140 }] }] }
    const b = { units: [{ name: 'Immortals', options: [{ models: 5, points: 65 }, { models: 10, points: 140 }] }, { name: 'Psychomancer', options: [{ models: 1, points: 55 }] }] }
    expect(diffMfm(a, b, 'necrons')).toEqual([
      { faction: 'necrons', kind: 'points', name: 'Immortals', change: 'changed', fields: [{ models: 5, from: 70, to: 65 }] },
      { faction: 'necrons', kind: 'points', name: 'Psychomancer', change: 'added', options: [{ models: 1, to: 55 }] },
    ])
  })

  // A Chapter's FAQ file repeats every Codex: Space Marines entry — reported once, under SM.
  it('reports an FAQ entry once, not again under every Chapter', () => {
    const e = { type: 'qa', q: 'Can I?', a: 'Yes.' }
    const b = { 'space-marines': { entries: [e] }, 'blood-angels': { entries: [e] } }
    expect(diffFaq({}, b).map((x) => x.faction)).toEqual(['space-marines'])
  })
})
