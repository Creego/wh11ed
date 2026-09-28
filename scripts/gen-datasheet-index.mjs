// Generate src/data/datasheetIndex.js — the compact unit-name index the global search
// (Ctrl+K) uses to find datasheets by unit name. Names only (~1500 units), so the chunk
// stays tiny; the heavy per-faction datasheet files are never imported by the search.
//
// Run whenever a datasheet file changes:  node scripts/gen-datasheet-index.mjs
// (adding/renaming a unit changes the search index — re-run this after such an edit.)
//
// Only `ready` factions with a data file are included, mirroring the gate used by
// FactionsListView / gen-seo-routes.mjs — units of unpublished factions shouldn't
// surface in search results pointing at "coming soon" pages.
//
// Each unit also carries its optional `aliasesRu` — hand-authored transliterations/community
// nicknames (e.g. Ghazghkull Thraka → "Газгкулл Трака"/"Газя") that let a Russian-speaking user
// find a unit without knowing its English spelling. Purely a search-matching aid: the unit's
// displayed name stays English everywhere else, per the "unit names stay English" convention
// (see CLAUDE.md's Bilingual content conventions). Two sources, merged per unit:
//   - per-unit: authored in the unit's own RU datasheet overlay (src/data/datasheets/ru/<slug>.js)
//   - by name pattern: src/data/datasheetAliasRulesRu.js — a whole CLASS of unit sharing one
//     widespread nickname (Terminator-anything → "термосы"), applied to any datasheet whose EN
//     name matches the rule's pattern, across every faction.
// See src/data/CLAUDE.md (RU search aliases) for the curation guidelines and sourcing.
//
// A fourth slot, `legacy`, carries the retired unit names a Legends publication proxies onto this
// datasheet (src/data/factionLegends.json's Legendary Proxies — "Ufthak Blackhawk" → Warboss), so
// the old name typed into the palette lands on the sheet it is fielded as, with a subline saying
// why. null for the vast majority of units, like aliasesRu.
//
// A second file, src/data/datasheetTagIndex.js, carries what a unit can be FOUND BY besides its
// name: its ability names (its own, wargear, core, the faction rule) and its keywords, in English
// and, where the RU overlay renames the header, in Russian. Separate from the name index because
// the faction subnav and the datasheet page load the name index for names alone — the tags ride
// only with a typed search (src/composables/datasheetTags.js). The unit's RU aliases ride there
// too, so the faction page and the roster catalogue — which match tags, not the name index — find
// "бойз" the way the palette does.
//
// A third file, src/data/datasheetSearchExamples.js, holds what the faction-scoped unit searches
// type into their empty box (useTypingPlaceholder): per faction, a unit name, an ability of the
// faction's own, a core ability, a keyword — and, for the RU box, an alias. Picked here from the
// same data the search matches, so every example finds something (datasheetSearchExamples.test.js).

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { datasheetAliasRulesRu } from '../src/data/datasheetAliasRulesRu.js'
import { localizeSheet } from '../src/data/datasheets/ru/localize.js'

// Merge a unit's personal aliases (may be undefined) with any name-pattern rule aliases that
// match its EN name, de-duped, `null` if the result is empty (JSON.stringify can't omit an
// array slot, so the index consistently uses null — not [] — for "no aliases").
function aliasesFor(name, personal) {
  const merged = new Set(personal || [])
  for (const rule of datasheetAliasRulesRu) {
    if (rule.pattern.test(name)) for (const a of rule.aliasesRu) merged.add(a)
  }
  return merged.size ? [...merged] : null
}

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// Dynamic import() needs a file:// URL, not a raw path — a bare Windows path
// (C:\...) throws ERR_UNSUPPORTED_ESM_URL_SCHEME.
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const { factionGroups } = await imp('src/data/factionsIndex.js')
const factionLegends = JSON.parse(readFileSync(join(ROOT, 'src/data/factionLegends.json'), 'utf8'))

// slug → { unitId → [retired names] } from the Legendary Proxies tables.
function legacyNamesFor(slug) {
  const out = {}
  for (const p of factionLegends[slug]?.proxies || []) {
    if (p.id) (out[p.id] ??= []).push(...p.legacy)
  }
  return out
}

// The 5 SM-Chapter codex files don't duplicate datasheets identical to space-marines.js —
// they list those ids in `sharedUnitIds` instead (see src/data/datasheets/index.js). Fold
// them back in so search still finds those units under each Chapter.
let smUnits = null
async function loadSpaceMarines() {
  if (!smUnits) smUnits = (await imp('src/data/datasheets/space-marines.js')).default
  return smUnits
}
// Same fold, for the RU overlay's aliasesRu: a shared unit's aliases (if any) live under
// ru/space-marines.js, never re-listed under the Chapter's own ru/<slug>.js file.
let smAliases = null
async function loadSpaceMarinesAliases() {
  if (!smAliases) smAliases = await loadAliases('space-marines')
  return smAliases
}

// `ru/<slug>.js` is a sparse overlay (only units with a translated field get an entry at
// all) — most units carry no `aliasesRu`, so this returns {} for factions/units that don't.
async function loadAliases(slug) {
  const ruFile = join(ROOT, `src/data/datasheets/ru/${slug}.js`)
  if (!existsSync(ruFile)) return {}
  const mod = await import(pathToFileURL(ruFile).href)
  const overlay = mod.default ?? {}
  const out = {}
  for (const [id, entry] of Object.entries(overlay)) {
    if (entry?.aliasesRu?.length) out[id] = entry.aliasesRu
  }
  return out
}

// The whole RU overlay module (the id→overlay map and `abilityNamesRu`), Chapters folding in
// space-marines.js's entries for the shared ids — the same merge as ru/index.js's loadDatasheetsRu.
async function loadRuModule(slug) {
  const file = join(ROOT, `src/data/datasheets/ru/${slug}.js`)
  return existsSync(file) ? await import(pathToFileURL(file).href) : {}
}
async function ruFor(slug, sharedIds) {
  const own = await loadRuModule(slug)
  if (!sharedIds?.length) return { overlay: own.default || {}, names: own.abilityNamesRu || {} }
  const sm = await loadRuModule('space-marines')
  const ids = new Set(sharedIds)
  const shared = Object.fromEntries(Object.entries(sm.default || {}).filter(([id]) => ids.has(id)))
  return { overlay: { ...shared, ...(own.default || {}) }, names: { ...(sm.abilityNamesRu || {}), ...(own.abilityNamesRu || {}) } }
}

// Every ability name on a sheet: the four ability lists, the pick-one sets and their options.
function abilityNames(sheet) {
  const out = []
  for (const key of ['abilities', 'wargearAbilities', 'specialAbilities', 'rules']) {
    for (const a of sheet[key] || []) out.push(a.name)
  }
  for (const set of sheet.abilitySets || []) out.push(set.name, ...set.options.map((o) => o.name))
  return out
}
// What a unit is found by besides its name. `core` and `faction` are comma-joined strings
// ("Deep Strike, Scouts 6\""); the RU names are only those the overlay actually renames.
const split = (s) => (s || '').split(',').map((t) => t.trim()).filter(Boolean)
function tagsFor(sheet, ru, aliases) {
  const en = [...split(sheet.core), ...split(sheet.faction), ...abilityNames(sheet), ...(sheet.keywords || [])]
  const local = abilityNames(localizeSheet(sheet, ru.overlay[sheet.id], ru.names))
  return [...new Set([...en, ...local, ...(aliases || [])].filter(Boolean))]
}

// The examples a faction's unit search types out. Each is one kind of thing the box finds, and
// each must fit the roster catalogue's box on a 320px phone (~30 characters there; 22 leaves room). Deterministic: the same data gives
// the same examples, so a regenerated file only changes when the faction's data does.
const EXAMPLE_MAX = 22
// Core abilities worth showing, in order of preference; the first one the faction fields on at
// least two units wins. Leader and Deadly Demise are on nearly everything and say little.
const CORE_EXAMPLES = ['Deep Strike', 'Infiltrators', 'Stealth', 'Lone Operative', 'Scouts', 'Feel No Pain', 'Fights First', 'Firing Deck']
const KEYWORD_EXAMPLES = ['Fly', 'Psyker', 'Monster', 'Walker', 'Mounted', 'Vehicle', 'Infantry']
const fits = (s) => s && s.length <= EXAMPLE_MAX
function pickExamples(units, aliasesOf) {
  const live = units.filter((u) => !u.legends)
  const count = (has) => live.filter(has).length
  const byCount = (list) => [...list].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0]))
  // A Battleline unit of the faction's own — the one a new player of it is most likely to own.
  // "Own" is its most common faction keyword: Aeldari list Ynnari Battleline and Death Guard
  // Plaguebearers, which would make a strange first example.
  const kwCount = new Map()
  for (const u of live) for (const k of u.factionKeywords || []) if (k) kwCount.set(k, (kwCount.get(k) || 0) + 1)
  const main = byCount([...kwCount])[0]?.[0]
  const ownUnits = live.filter((u) => fits(u.name) && (!main || (u.factionKeywords || []).includes(main)))
  const shortest = (list) => [...list].sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name))[0]?.name
  const unit = shortest(ownUnits.filter((u) => (u.keywords || []).includes('Battleline'))) || shortest(ownUnits)
  // An ability of the faction's own, on two units or more: not the army rule (on every sheet), not
  // a core ability, not a "Damaged:" line.
  // "Scouts 6\"" in `core`, "Scouts" as a sheet's own ability header — the same core rule.
  const coreNames = [...new Set(live.flatMap((u) => split(u.core)))]
  const isCore = (a) => coreNames.some((c) => c === a || c.startsWith(`${a} `))
  const armyRule = new Set(live.flatMap((u) => split(u.faction)))
  const own = new Map()
  for (const u of live) {
    for (const a of new Set((u.abilities || []).map((x) => x.name))) {
      if (!fits(a) || isCore(a) || armyRule.has(a) || /^damaged/i.test(a)) continue
      own.set(a, (own.get(a) || 0) + 1)
    }
  }
  const ability = byCount([...own].filter(([, n]) => n >= 2))[0]?.[0]
  const core = CORE_EXAMPLES.find((c) => count((u) => split(u.core).some((x) => x.startsWith(c))) >= 2)
  const keyword = KEYWORD_EXAMPLES.find((k) => count((u) => (u.keywords || []).includes(k)) >= 2)
  // The RU alias that finds the most units (a class nickname like «термосы» shows the idea best).
  const aliasHits = new Map()
  for (const u of live) for (const a of aliasesOf(u) || []) if (fits(a) && a.length >= 3) aliasHits.set(a, (aliasHits.get(a) || 0) + 1)
  const alias = byCount([...aliasHits])[0]?.[0] || null
  return [[unit, ability, core, keyword].filter(Boolean), alias]
}

const out = []
const tagOut = {}
const examplesOut = {}
let tagged = 0
for (const group of factionGroups) {
  for (const f of group.factions) {
    if (!f.ready || !existsSync(join(ROOT, `src/data/factions/${f.slug}.js`))) continue
    const sheetsFile = join(ROOT, `src/data/datasheets/${f.slug}.js`)
    if (!existsSync(sheetsFile)) continue
    const mod = await import(pathToFileURL(sheetsFile).href)
    let units = mod.default ?? []
    let aliases = await loadAliases(f.slug)
    if (mod.sharedUnitIds?.length) {
      const idSet = new Set(mod.sharedUnitIds)
      const sm = await loadSpaceMarines()
      units = [...units, ...sm.filter((u) => idSet.has(u.id))]
      aliases = { ...aliases, ...(await loadSpaceMarinesAliases()) }
    }
    const legacy = legacyNamesFor(f.slug)
    // Per faction: one table of distinct tags, each unit a list of indices into it — the same
    // "Infantry" or "Deep Strike" is written once, not once per unit.
    const ru = await ruFor(f.slug, mod.sharedUnitIds)
    const table = []
    const at = new Map()
    const byUnit = {}
    const aliasesOf = (u) => aliasesFor(u.name, aliases[u.id])
    for (const u of units) {
      const idx = tagsFor(u, ru, aliasesOf(u)).map((t) => {
        if (!at.has(t)) { at.set(t, table.length); table.push(t) }
        return at.get(t)
      })
      if (idx.length) { byUnit[u.id] = idx; tagged++ }
    }
    tagOut[f.slug] = [table, byUnit]
    examplesOut[f.slug] = pickExamples(units, aliasesOf)
    out.push([f.slug, f.name, units.map((u) => [u.id, u.name, aliasesOf(u), legacy[u.id] || null, u.legends ? 1 : null])])
  }
}
out.sort((a, b) => a[0].localeCompare(b[0]))

const total = out.reduce((n, [, , units]) => n + units.length, 0)
const withAliases = out.reduce((n, [, , units]) => n + units.filter((u) => u[2]).length, 0)
const withLegacy = out.reduce((n, [, , units]) => n + units.filter((u) => u[3]).length, 0)
const withLegends = out.reduce((n, [, , units]) => n + units.filter((u) => u[4]).length, 0)
const body = `// Generated by scripts/gen-datasheet-index.mjs — do not edit by hand.
// Compact unit-name index for the global search (Ctrl+K): one entry per faction,
// [slug, factionName, [[unitId, unitName, aliasesRu, legacy, legends], …]]. aliasesRu (RU nicknames)
// and legacy (retired Legends unit names proxied onto this sheet) are null (not an empty array —
// JSON.stringify can't omit an array slot) for the vast majority of units that carry none;
// legends is 1 on a Warhammer Legends sheet (the search result wears the same badge as the
// datasheet grid) and null otherwise.
// Loaded on demand by useSearch.js (dynamic import) so it never rides in the entry bundle.
export const datasheetIndex = ${JSON.stringify(out)}
`
writeFileSync(join(ROOT, 'src/data/datasheetIndex.js'), body)
const tagBody = `// Generated by scripts/gen-datasheet-index.mjs — do not edit by hand.
// What a unit is found by besides its name — ability names (EN, and RU where the overlay renames
// the header) and keywords — for the unit searches (src/composables/datasheetTags.js):
// { slug: [tagTable, { unitId: [index into tagTable, …] }] }. Loaded on demand, only once a
// search is typed.
export const datasheetTagIndex = ${JSON.stringify(Object.fromEntries(Object.entries(tagOut).sort(([a], [b]) => a.localeCompare(b))))}
`
writeFileSync(join(ROOT, 'src/data/datasheetTagIndex.js'), tagBody)
const examplesBody = `// Generated by scripts/gen-datasheet-index.mjs — do not edit by hand.
// What the faction page's and the roster catalogue's unit search type into their empty box
// (useTypingPlaceholder): { slug: [[unit, own ability, core ability, keyword], ruAlias | null] }.
// Names stay English in both locales; the alias is added to the RU box only.
export const datasheetSearchExamples = ${JSON.stringify(Object.fromEntries(Object.entries(examplesOut).sort(([a], [b]) => a.localeCompare(b))))}
`
writeFileSync(join(ROOT, 'src/data/datasheetSearchExamples.js'), examplesBody)
console.log(`gen-datasheet-index: ${tagged} units with tags → src/data/datasheetTagIndex.js`)
console.log(`gen-datasheet-index: ${out.length} factions, ${total} units (${withAliases} with aliasesRu, ${withLegacy} with legacy names, ${withLegends} Legends) → src/data/datasheetIndex.js`)
