// Points between two Munitorum Field Manual scrapes of one faction (src/data/mfm/<slug>.js at two
// commits): units by name, each size option by its model count and its note ("1st-2nd", "3rd+"),
// and enhancements by detachment and name. Only points — the detachments' DP and dispositions are
// the app's to report (diff-bundles.mjs), and the MFM scrape changed their shape on its own.
const key = (s) => (s || '').toLowerCase().replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').trim()
const optKey = (o) => `${o.models}|${key(o.note)}`
const optLabel = (o) => ({ models: o.models, ...(o.note ? { note: o.note } : {}) })

export function diffMfm(a, b, faction) {
  const out = []
  if (!a || !b) return out
  const A = new Map((a.units || []).map((u) => [key(u.name), u]))
  const B = new Map((b.units || []).map((u) => [key(u.name), u]))
  for (const [k, u] of B) {
    const o = A.get(k)
    if (!o) { out.push({ faction, kind: 'points', name: u.name, change: 'added', options: (u.options || []).map((x) => ({ ...optLabel(x), to: x.points })) }); continue }
    const was = new Map((o.options || []).map((x) => [optKey(x), x]))
    const now = new Map((u.options || []).map((x) => [optKey(x), x]))
    const fields = []
    for (const [ok, x] of now) {
      const y = was.get(ok)
      if (!y) fields.push({ ...optLabel(x), from: null, to: x.points })
      else if (y.points !== x.points) fields.push({ ...optLabel(x), from: y.points, to: x.points })
    }
    for (const [ok, y] of was) if (!now.has(ok)) fields.push({ ...optLabel(y), from: y.points, to: null })
    if (fields.length) out.push({ faction, kind: 'points', name: u.name, change: 'changed', fields })
  }
  for (const [k, u] of A) if (!B.has(k)) out.push({ faction, kind: 'points', name: u.name, change: 'removed' })

  const enh = (m) => {
    const r = new Map()
    for (const d of m.detachments || []) for (const e of d.enhancements || []) r.set(`${key(d.name)}|${key(e.name)}`, { det: d.name, e })
    return r
  }
  const ea = enh(a)
  const eb = enh(b)
  for (const [k, { det, e }] of eb) {
    const o = ea.get(k)
    // A new enhancement arrives with its detachment, which the app's diff already reports.
    if (o && o.e.points !== e.points) out.push({ faction, kind: 'enhancementPoints', parent: det, name: e.name, change: 'changed', from: o.e.points, to: e.points })
  }
  return out
}
