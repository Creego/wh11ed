<template>
  <li
    class="pe"
    :class="`pe-${item.change}`"
  >
    <div class="pe-head">
      <span
        v-if="kindLabel"
        class="pe-kind"
      >{{ kindLabel }}</span>
      <RouterLink
        v-if="unitPath"
        :to="unitPath"
        class="pe-name"
      >
        {{ item.name }}
      </RouterLink>
      <span
        v-else
        class="pe-name"
      >{{ item.name }}</span>
      <span
        v-if="item.change === 'added'"
        class="pe-badge pe-badge-new"
      >{{ labels.patchesNew }}</span>
      <span
        v-else-if="item.change === 'removed'"
        class="pe-badge pe-badge-gone"
      >{{ labels.patchesRemoved }}</span>
      <span
        v-if="item.kind === 'publication' && item.date"
        class="pe-note"
      >{{ item.change === 'changed' ? `${labels.patchesErrata} ` : '' }}{{ item.date }}</span>
    </div>

    <!-- The numbers: one chip each, "T 4 → 5". -->
    <div
      v-if="chips.length"
      class="pe-chips"
    >
      <span
        v-for="(c, i) in chips"
        :key="i"
        class="pe-chip"
      >{{ c }}</span>
    </div>

    <!-- Lists that gained or lost entries: keywords, the units a Leader can join, core abilities. -->
    <p
      v-for="(s, i) in sets"
      :key="'s' + i"
      class="pe-line"
    >
      <span class="pe-label">{{ s.label }}:</span>
      <span
        v-for="k in s.added"
        :key="'+' + k"
        class="pe-plus"
      >+ {{ k }}</span>
      <span
        v-for="k in s.removed"
        :key="'-' + k"
        class="pe-minus"
      >− {{ k }}</span>
    </p>

    <!-- Weapons: a profile whose numbers moved, a renamed one, one that came or went. -->
    <p
      v-for="(w, i) in weapons"
      :key="'w' + i"
      class="pe-line"
    >
      <span
        v-if="w.change === 'added'"
        class="pe-plus"
      >+ {{ w.name }}</span>
      <span
        v-else-if="w.change === 'removed'"
        class="pe-minus"
      >− {{ w.name }}</span>
      <template v-else>
        <span class="pe-label">{{ w.name }}<template v-if="w.from"> ({{ labels.patchesWas }}: {{ w.from }})</template>:</span>
        <span
          v-for="s in w.stats"
          :key="s.stat"
          class="pe-chip"
        >{{ s.stat }} {{ s.from || '–' }} → {{ s.to || '–' }}</span>
        <span
          v-for="t in w.tags.added"
          :key="'+' + t"
          class="pe-plus"
        >+ {{ t }}</span>
        <span
          v-for="t in w.tags.removed"
          :key="'-' + t"
          class="pe-minus"
        >− {{ t }}</span>
      </template>
    </p>

    <!-- Rule texts: what came is shown as it reads; what changed, on request, struck and marked. -->
    <div
      v-for="(t, i) in texts"
      :key="'t' + i"
      class="pe-text"
    >
      <button
        type="button"
        class="pe-toggle"
        :aria-expanded="openText === i"
        @click="openText = openText === i ? null : i"
      >
        <span
          v-if="t.prefix"
          :class="t.prefixClass"
        >{{ t.prefix }}</span>
        {{ t.label }}
        <i
          class="bi bi-chevron-down pe-chev"
          :class="{ open: openText === i }"
        />
      </button>
      <CollapseTransition :show="openText === i">
        <PatchTextDiff
          v-if="openText === i"
          :from="t.from"
          :to="t.to"
        />
      </CollapseTransition>
    </div>
  </li>
</template>

<script setup>
// One change in a GW update, as scripts/gen-patch-notes.mjs wrote it (the shapes are documented in
// scripts/patch-notes/). Numbers are chips, lists are +/− words, rule texts open on request — a
// datasheet rewrite would otherwise put a screen of struck words between two unit names.
import { computed, ref } from 'vue'
import CollapseTransition from '../CollapseTransition.vue'
import PatchTextDiff from './PatchTextDiff.vue'
import { ui } from '../../i18n/ui.js'
import { useLocale } from '../../composables/useLocale.js'

const props = defineProps({
  item: { type: Object, required: true },
  // A detachment's own entries are listed under its name, so they name their kind instead.
  inDetachment: { type: Boolean, default: false },
})
const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const openText = ref(null)

const fields = computed(() => props.item.fields || [])

const kindLabel = computed(() => {
  const l = labels.value
  const k = props.item.kind
  if (k === 'stratagem') return l.patchesStratagem
  if (k === 'enhancement' || k === 'enhancementPoints') return l.patchesEnhancement
  if (k === 'detachmentRule') return l.patchesRule
  if (k === 'faq') return props.item.type === 'qa' ? l.patchesQuestion : l.patchesErrataEntry
  if (k === 'coreRule' && props.item.num) return props.item.num
  return ''
})

// Today's page of a unit named here (null for one that is gone).
const unitPath = computed(() => {
  const u = props.item.unit
  if (!u) return null
  return Array.isArray(u) ? `/factions/${u[0]}/datasheets/${u[1]}` : `/factions/${props.item.faction}/datasheets/${u}`
})

const arrow = (from, to) => `${from || '–'} → ${to || '–'}`
const chips = computed(() => {
  const l = labels.value
  const x = props.item
  const out = []
  if (x.kind === 'points') {
    const size = (o) => `${o.models} ${l.patchesModels}${o.note ? ` (${o.note})` : ''}`
    for (const o of x.fields || []) out.push(`${size(o)}: ${arrow(o.from, o.to)}`)
    for (const o of x.options || []) out.push(`${size(o)}: ${o.to} ${l.patchesPts}`)
    return out
  }
  if (x.kind === 'enhancementPoints') return [`${arrow(x.from, x.to)} ${l.patchesPts}`]
  // A stat that moved the same way on every model line is one chip; otherwise each names its model.
  const stats = fields.value.filter((f) => f.field === 'stat')
  const models = new Set(stats.map((f) => f.model))
  const seen = new Set()
  for (const f of stats) {
    const same = stats.filter((g) => g.stat === f.stat && g.from === f.from && g.to === f.to)
    const k = `${f.stat}|${f.from}|${f.to}`
    if (same.length === models.size && models.size > 1) {
      if (!seen.has(k)) out.push(`${f.stat} ${arrow(f.from, f.to)}`)
      seen.add(k)
    } else {
      out.push(`${models.size > 1 ? `${f.model}: ` : ''}${f.stat} ${arrow(f.from, f.to)}`)
    }
  }
  const named = { invul: l.patchesInvul, damaged: l.patchesDamaged, sizes: l.patchesSizes, dp: 'DP', forceDisposition: 'Force Disposition', cp: 'CP' }
  for (const f of fields.value) if (named[f.field]) out.push(`${named[f.field]} ${arrow(f.from, f.to)}`)
  return out
})

const sets = computed(() => {
  const l = labels.value
  const named = { keywords: l.patchesKeywords, factionKeywords: l.patchesKeywords, leaderOf: l.patchesLeads, coreAbilities: l.patchesAbilities }
  const out = fields.value.filter((f) => named[f.field]).map((f) => ({ label: named[f.field], added: f.added || [], removed: f.removed || [] }))
  // An ability that went has no text left to show — it is a line of names, like a keyword.
  const gone = fields.value.filter((f) => f.field === 'ability' && f.change === 'removed').map((f) => f.name)
  if (gone.length) out.push({ label: l.patchesAbilities, added: [], removed: gone })
  return out
})

const weapons = computed(() => fields.value.filter((f) => f.field === 'weapon'))

const texts = computed(() => {
  const l = labels.value
  const x = props.item
  const out = []
  const part = { when: l.patchesWhen, target: l.patchesTarget, effect: l.patchesEffect, restriction: l.patchesRestriction }
  for (const f of fields.value) {
    if (f.field === 'ability') {
      if (f.change !== 'removed') out.push({ label: f.name, prefix: f.change === 'added' ? '+' : '', prefixClass: 'pe-plus', from: f.from || '', to: f.to || '' })
    } else if (f.field === 'text') out.push({ label: l.patchesTextChanged, from: f.from, to: f.to })
    else if (part[f.field]) out.push({ label: part[f.field], from: f.from, to: f.to })
  }
  // An added rule, FAQ answer or core rule: its text as it reads.
  if (x.change === 'added' && x.to) out.push({ label: labels.value.patchesShowText, from: '', to: x.to })
  return out.filter((t) => t.from || t.to)
})
</script>

<style scoped>
.pe {
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--border-light);
  list-style: none;
}
.pe:last-child { border-bottom: none; }
.pe-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.5rem;
}
.pe-kind {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
}
.pe-name {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text-primary);
}
a.pe-name { color: var(--link-accent); }
.pe-removed .pe-name { color: var(--text-muted); text-decoration: line-through; }
.pe-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0.3rem;
  border: 1px solid currentColor;
}
.pe-badge-new { color: var(--accent); }
.pe-badge-gone { color: var(--text-dim); }
.pe-note { font-size: 0.78rem; color: var(--text-muted); }

.pe-chips,
.pe-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.45rem;
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
}
.pe-chip {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.05rem 0.35rem;
  background: var(--bg-row-alt);
  border: 1px solid var(--border-light);
  white-space: nowrap;
}
.pe-label { color: var(--text-muted); }
.pe-plus { color: var(--accent); }
.pe-minus { color: var(--text-dim); text-decoration: line-through; }

.pe-text { margin-top: 0.2rem; }
.pe-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0;
  background: none;
  border: none;
  font: inherit;
  font-size: 0.82rem;
  color: var(--text-muted);
  cursor: pointer;
}
.pe-toggle:hover { color: var(--text-primary); }
.pe-chev { font-size: 0.7rem; transition: transform var(--motion-fast) ease; }
.pe-chev.open { transform: rotate(180deg); }
</style>
