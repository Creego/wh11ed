// What a player would call "the patch": the rules differences between two wh40k-appdata faction
// bundles (factions/<slug>.json at two data versions), as a list a page can print as "was → now".
//
// Not appdata's own changes.mjs: that one matches entities by app id, and GW reissues ids
// wholesale (946 → 963 re-keyed ~2,300 entities that did not change at all) and rewrites prose
// markup between releases ("■ **1 X**" became "<ul><li>1 X model</li></ul>"). A player cares
// about neither. So entities are matched by NAME within their parent, and every text is compared
// after folding markup, quotes, dashes and whitespace — what is left is a difference in the rule.
//
// Points are not read here: the Munitorum Field Manual is the points canon (src/data/mfm), and
// its history is diffed on its own. Combat Patrol content is a separate game mode and is skipped.
import { appdataToMarkup, bodyText, norm, looseName } from '../lib/sync-common.mjs'

// Text as a player reads it: no markup, one kind of quote, dash and space.
export function plain(s) {
  return appdataToMarkup(s || '')
    .replace(/\*\*|__/g, '')
    .replace(/[▪▫■•]\s*/g, '• ')
    .replace(/[‘’‚‛`]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\u00a0/g, ' ')
    // A pointer at the printed card's layout ("…listed in the Psychic Abilities section (see
    // left)"), dropped when the app stopped drawing that layout — not a rule.
    .replace(/\s*\(see (?:left|right|above|below)\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
// Two texts are the same rule when they read the same, case and a closing full stop aside.
const sameText = (a, b) => plain(a).toLowerCase().replace(/\.$/, '') === plain(b).toLowerCase().replace(/\.$/, '')
const key = (s) => plain(s).toLowerCase()
// An entity's identity: its name without a trailing "(…)" note — "Psychic Hood (Psychic)" and
// "Teleport Homer (Once per battle, per unit)" are the abilities they were before the note.
const nameKey = (s) => norm(plain(s))

function byName(list) {
  const m = new Map()
  for (const x of list || []) if (x?.name && !m.has(nameKey(x.name))) m.set(nameKey(x.name), x)
  return m
}

// Added / removed / kept, by name.
function pair(a, b) {
  const A = byName(a)
  const B = byName(b)
  const out = { added: [], removed: [], both: [] }
  for (const [k, x] of B) (A.has(k) ? out.both.push([A.get(k), x]) : out.added.push(x))
  for (const [k, x] of A) if (!B.has(k)) out.removed.push(x)
  return out
}

const setDiff = (a, b) => {
  const A = new Set((a || []).map(key))
  const B = new Set((b || []).map(key))
  return {
    added: (b || []).filter((x) => !A.has(key(x))),
    removed: (a || []).filter((x) => !B.has(key(x))),
  }
}

const STATS = ['M', 'T', 'Sv', 'W', 'Ld', 'OC']
const PROFILE = ['range', 'A', 'BS', 'WS', 'S', 'AP', 'D']
const val = (v) => (v === null || v === undefined ? '' : String(v).trim())
// An aircraft's OC was printed "-1" until 963 and "-" since: no Objective Control either way.
// A melee profile's BS (and a ranged one's WS) was "N/A" before 925 and "-" since.
const statVal = (st, v) => {
  const x = val(v)
  if (st === 'OC' && x === '-1') return '-'
  if ((st === 'BS' || st === 'WS') && /^(n\/a|)$/i.test(x)) return '-'
  return x
}

// A profile under its weapon: "Plasma gun – supercharge", not a bare "supercharge".
function profileName(w, p) {
  if (!p.name || key(p.name) === key(w.name)) return w.name
  return key(p.name).includes(key(w.name)) ? p.name : `${w.name} – ${p.name}`
}
// "Damaged 4" became an ability in 963 beside the damage bracket it states — the bracket is
// compared on its own (`damaged`), so the ability would only say the same thing twice.
const isDamagedAbility = (a) => /^damaged\b/i.test(plain(a?.name))

// One datasheet's differences — each a { field, ... } a page renders as one line or chip.
function diffDatasheet(a, b) {
  const f = []
  // Characteristics, model line by model line.
  const sa = byName(a.statlines)
  for (const s of b.statlines || []) {
    const o = sa.get(key(s.name)) || (a.statlines?.length === 1 && b.statlines.length === 1 ? a.statlines[0] : null)
    if (!o) continue
    for (const st of STATS) {
      if (statVal(st, o[st]) !== statVal(st, s[st])) f.push({ field: 'stat', model: s.name, stat: st, from: val(o[st]), to: val(s[st]) })
    }
  }
  const inv = (d) => (d.invulnerableSaves || []).map((x) => plain(typeof x === 'string' ? x : x.value || x.save || JSON.stringify(x))).join(', ')
  if (inv(a) !== inv(b)) f.push({ field: 'invul', from: inv(a), to: inv(b) })

  // A unit's own name sits among its keywords in some versions and not in others.
  const selfName = new Set([key(a.name), key(b.name)])
  const kwOf = (d) => (d.keywords || []).filter((k) => !selfName.has(key(k)))
  const kw = setDiff(kwOf(a), kwOf(b))
  if (kw.added.length || kw.removed.length) f.push({ field: 'keywords', ...kw })
  const fk = setDiff(a.factionKeywords, b.factionKeywords)
  if (fk.added.length || fk.removed.length) f.push({ field: 'factionKeywords', ...fk })

  const leads = (d) => (d.leaderOf || []).flatMap((l) => l.units || [])
  const ld = setDiff(leads(a), leads(b))
  if (ld.added.length || ld.removed.length) f.push({ field: 'leaderOf', ...ld })

  const sizes = (d) => [...new Set((d.points || []).map((p) => p.models).filter(Boolean))].sort((x, y) => x - y).join(' / ')
  if (sizes(a) !== sizes(b)) f.push({ field: 'sizes', from: sizes(a), to: sizes(b) })

  // Core and faction abilities by name only: their text is the core rule's or the army rule's,
  // printed again on every sheet — a change to Deadly Demise would otherwise be reported on all
  // 386 sheets that carry it, not once where the rule itself is (core rules, army rules). The
  // name carries the parameter ("Deadly Demise D3" → "D6", "Feel No Pain 5+").
  const shared = (d) => (d.abilities || []).filter((x) => (x.type === 'core' || x.type === 'faction') && !isDamagedAbility(x)).map((x) => x.name)
  const sh = setDiff(shared(a), shared(b))
  if (sh.added.length || sh.removed.length) f.push({ field: 'coreAbilities', ...sh })
  const own = (d) => (d.abilities || []).filter((x) => x.type !== 'core' && x.type !== 'faction' && !isDamagedAbility(x))
  const ab = pair(own(a), own(b))
  for (const x of ab.added) f.push({ field: 'ability', change: 'added', name: x.name, to: plain(x.rules) })
  for (const x of ab.removed) f.push({ field: 'ability', change: 'removed', name: x.name })
  for (const [o, n] of ab.both) {
    if (!sameText(o.rules, n.rules)) f.push({ field: 'ability', change: 'changed', name: n.name, from: plain(o.rules), to: plain(n.rules) })
  }
  const dmg = (d) => (d.damageAbility || []).map((x) => [x.damagedAt ? `1-${x.damagedAt}` : '', plain(x.rules || '')].filter(Boolean).join(': ')).join(' ')
  if (!sameText(dmg(a), dmg(b))) f.push({ field: 'damaged', from: dmg(a), to: dmg(b) })

  // Weapons: one row per profile, by weapon + profile name.
  const rows = (d) => {
    const m = new Map()
    for (const w of d.wargear || []) for (const p of w.profiles || []) m.set(key(`${profileName(w, p)}|${p.type}`), { w, p })
    return m
  }
  const ra = rows(a)
  const rb = rows(b)
  const compare = (o, n, extra = {}) => {
    const stats = PROFILE.filter((st) => statVal(st, o.p[st]) !== statVal(st, n.p[st])).map((st) => ({ stat: st, from: val(o.p[st]), to: val(n.p[st]) }))
    const tags = setDiff(o.p.tags, n.p.tags)
    if (stats.length || tags.added.length || tags.removed.length || extra.from) {
      f.push({ field: 'weapon', change: 'changed', name: profileName(n.w, n.p), type: n.p.type, ...extra, stats, tags })
    }
  }
  const added = []
  for (const [k, n] of rb) (ra.has(k) ? compare(ra.get(k), n) : added.push(n))
  const removed = [...ra].filter(([k]) => !rb.has(k)).map(([, o]) => o)
  // A second pass for a weapon the new version spells differently: "Dread klaw" → "Dread Klaws",
  // "Flamestorm gauntlets" → "Flamestorm Gauntlets – Ranged". Same kind of profile, and one loose
  // name (no hyphens, no plurals) is the other or starts it. Reported once, as a rename with any
  // number that moved — not as one weapon gone and another arrived.
  const loose = (r) => looseName(profileName(r.w, r.p))
  for (const o of [...removed]) {
    const i = added.findIndex((n) => n.p.type === o.p.type && (loose(n) === loose(o) || loose(n).startsWith(`${loose(o)} `) || loose(o).startsWith(`${loose(n)} `)))
    if (i < 0) continue
    const [n] = added.splice(i, 1)
    removed.splice(removed.indexOf(o), 1)
    const renamed = key(profileName(o.w, o.p)) !== key(profileName(n.w, n.p))
    compare(o, n, renamed ? { from: profileName(o.w, o.p) } : {})
  }
  for (const n of added) f.push({ field: 'weapon', change: 'added', name: profileName(n.w, n.p), type: n.p.type })
  for (const o of removed) f.push({ field: 'weapon', change: 'removed', name: profileName(o.w, o.p), type: o.p.type })
  return f
}

const STRAT_TEXT = ['when', 'target', 'effect', 'restriction']

function diffStratagem(a, b) {
  const f = []
  if (val(a.cp) !== val(b.cp)) f.push({ field: 'cp', from: val(a.cp), to: val(b.cp) })
  for (const t of STRAT_TEXT) if (!sameText(a[t], b[t])) f.push({ field: t, from: plain(a[t]), to: plain(b[t]) })
  return f
}

function diffDetachment(a, b, out, faction) {
  const det = b.name
  if (val(a.dp) !== val(b.dp)) out.push({ faction, kind: 'detachment', name: det, change: 'changed', fields: [{ field: 'dp', from: val(a.dp), to: val(b.dp) }] })
  const fd = (d) => [].concat(d.forceDisposition || []).map(plain).sort().join(', ')
  if (fd(a) !== fd(b)) out.push({ faction, kind: 'detachment', name: det, change: 'changed', fields: [{ field: 'forceDisposition', from: fd(a), to: fd(b) }] })

  const rules = pair(a.rules, b.rules)
  for (const x of rules.added) out.push({ faction, kind: 'detachmentRule', parent: det, name: x.name, change: 'added', to: bodyPlain(x.body) })
  for (const x of rules.removed) out.push({ faction, kind: 'detachmentRule', parent: det, name: x.name, change: 'removed' })
  for (const [o, n] of rules.both) {
    if (!sameText(bodyPlain(o.body), bodyPlain(n.body))) out.push({ faction, kind: 'detachmentRule', parent: det, name: n.name, change: 'changed', fields: [{ field: 'text', from: bodyPlain(o.body), to: bodyPlain(n.body) }] })
  }
  const st = pair(a.stratagems, b.stratagems)
  for (const x of st.added) out.push({ faction, kind: 'stratagem', parent: det, name: x.name, change: 'added' })
  for (const x of st.removed) out.push({ faction, kind: 'stratagem', parent: det, name: x.name, change: 'removed' })
  for (const [o, n] of st.both) {
    const fields = diffStratagem(o, n)
    if (fields.length) out.push({ faction, kind: 'stratagem', parent: det, name: n.name, change: 'changed', fields })
  }
  const en = pair(a.enhancements, b.enhancements)
  for (const x of en.added) out.push({ faction, kind: 'enhancement', parent: det, name: x.name, change: 'added' })
  for (const x of en.removed) out.push({ faction, kind: 'enhancement', parent: det, name: x.name, change: 'removed' })
  for (const [o, n] of en.both) {
    if (!sameText(o.rules, n.rules)) out.push({ faction, kind: 'enhancement', parent: det, name: n.name, change: 'changed', fields: [{ field: 'text', from: plain(o.rules), to: plain(n.rules) }] })
  }
}

const bodyPlain = (body) => plain(bodyText(body))
const notCP = (x) => !x?.isCombatPatrol

// Every difference between two bundles of one faction. Either side may be null (a faction that
// arrived or left with this version).
//
// A side that is missing is read as empty, so a faction that arrived lists what it brought. A Codex
// Supplement (one detachment, its own bundle since 963) arrives under its parent faction, and its
// arrival is told by its publication rather than as a new faction.
export function diffBundles(a, b, faction, { announce = true } = {}) {
  const out = []
  if ((!a || !b) && announce) out.push({ faction, kind: 'faction', name: (b || a).faction?.name || faction, change: a ? 'removed' : 'added' })
  a ||= {}
  b ||= {}
  // New books: a Codex, a Faction Pack, an errata publication. A new errata date on a book that
  // stayed is the same book re-issued — reported with its date.
  const pubs = (d) => (d.publications || []).filter((p) => !p.isCombatPatrol)
  const pp = pair(pubs(a), pubs(b))
  for (const x of pp.added) out.push({ faction, kind: 'publication', name: x.name, change: 'added', date: x.errataDate || null })
  for (const [o, n] of pp.both) {
    if (val(o.errataDate) !== val(n.errataDate) && n.errataDate) out.push({ faction, kind: 'publication', name: n.name, change: 'changed', date: n.errataDate })
  }
  const ar = pair(a.armyRules, b.armyRules)
  for (const x of ar.added) out.push({ faction, kind: 'armyRule', name: x.name, change: 'added', to: bodyPlain(x.body) })
  for (const x of ar.removed) out.push({ faction, kind: 'armyRule', name: x.name, change: 'removed' })
  for (const [o, n] of ar.both) {
    if (!sameText(bodyPlain(o.body), bodyPlain(n.body))) out.push({ faction, kind: 'armyRule', name: n.name, change: 'changed', fields: [{ field: 'text', from: bodyPlain(o.body), to: bodyPlain(n.body) }] })
  }

  const dt = pair((a.detachments || []).filter(notCP), (b.detachments || []).filter(notCP))
  for (const x of dt.added) out.push({ faction, kind: 'detachment', name: x.name, change: 'added' })
  for (const x of dt.removed) out.push({ faction, kind: 'detachment', name: x.name, change: 'removed' })
  for (const [o, n] of dt.both) diffDetachment(o, n, out, faction)

  const ds = pair((a.datasheets || []).filter(notCP), (b.datasheets || []).filter(notCP))
  for (const x of ds.added) out.push({ faction, kind: 'datasheet', name: x.name, change: 'added' })
  for (const x of ds.removed) out.push({ faction, kind: 'datasheet', name: x.name, change: 'removed' })
  for (const [o, n] of ds.both) {
    const fields = diffDatasheet(o, n)
    if (fields.length) out.push({ faction, kind: 'datasheet', name: n.name, change: 'changed', fields })
  }
  return out
}

// The core rules (factions/_core-rules.json): one entry per rule, by number and title.
export function diffCore(a, b) {
  const id = (r) => `${r.num || ''}|${nameKey(r.title)}`
  const A = new Map((a?.rules || []).map((r) => [id(r), r]))
  const B = new Map((b?.rules || []).map((r) => [id(r), r]))
  const out = []
  for (const [k, r] of B) {
    const o = A.get(k)
    if (!o) out.push({ faction: null, kind: 'coreRule', num: r.num, name: r.title, section: r.section, change: 'added', to: plain(r.text) })
    else if (!sameText(o.text, r.text)) out.push({ faction: null, kind: 'coreRule', num: r.num, name: r.title, section: r.section, change: 'changed', fields: [{ field: 'text', from: plain(o.text), to: plain(r.text) }] })
  }
  for (const [k, r] of A) if (!B.has(k)) out.push({ faction: null, kind: 'coreRule', num: r.num, name: r.title, section: r.section, change: 'removed' })
  return out
}
