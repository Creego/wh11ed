<template>
  <div class="patches-view">
    <div class="hero">
      <h1 class="hero-title">
        {{ labels.patchesTitle }}
      </h1>
      <p class="hero-sub">
        {{ labels.patchesSubtitle }}
      </p>
    </div>

    <div class="pv-bar">
      <!-- The faction filter: a dropdown under it on a wide screen, the sheet on a phone. -->
      <AdaptivePicker
        v-model:open="pickerOpen"
        panel-width="30rem"
        :title="labels.patchesFaction"
      >
        <template #trigger="{ toggle: togglePicker, open }">
          <button
            type="button"
            class="pv-trigger"
            :aria-expanded="open"
            @click="togglePicker"
          >
            <span class="pv-trigger-label">{{ labels.patchesFaction }}</span>
            <span class="pv-trigger-name">{{ filterName }}</span>
            <i class="bi bi-chevron-down" />
          </button>
        </template>
        <template #default="{ compact, bodyClass }">
          <div :class="bodyClass">
            <div class="pv-scopes">
              <button
                type="button"
                class="pv-scope"
                :class="{ on: filter === 'all' }"
                @click="pick('all')"
              >
                {{ labels.patchesAll }}
              </button>
              <button
                v-if="pinned.length"
                type="button"
                class="pv-scope"
                :class="{ on: filter === 'mine' }"
                @click="pick('mine')"
              >
                {{ labels.patchesMine }}
              </button>
            </div>
            <FactionPickerList
              :compact="compact"
              :selected="filter"
              @pick="pick"
            />
          </div>
        </template>
      </AdaptivePicker>
    </div>

    <p
      v-if="!shown.length"
      class="pv-empty"
    >
      {{ labels.patchesNothing }}
    </p>

    <section
      v-for="p in shown"
      :id="`patch-${p.id}`"
      :key="p.id"
      class="pv-patch"
    >
      <button
        type="button"
        class="pv-head"
        :aria-expanded="openId === p.id"
        @click="toggle(p.id)"
      >
        <span class="pv-head-main">
          <span class="pv-title">
            <template v-if="p.labels.app">{{ labels.patchesAppData }} {{ p.labels.app }}</template>
            <template v-if="p.labels.app && p.labels.mfm"> · </template>
            <template v-if="p.labels.mfm">MFM v{{ p.labels.mfm }}</template>
          </span>
          <span class="pv-meta">
            <time :datetime="p.date">{{ formatDate(p.date) }}</time>
            · {{ labels.patchesChanges }}: {{ p.count }}
          </span>
        </span>
        <i
          class="bi bi-chevron-down pv-chev"
          :class="{ open: openId === p.id }"
        />
      </button>
      <CollapseTransition :show="openId === p.id">
        <div
          v-if="loaded[p.id] || failed[p.id]"
          class="pv-body"
        >
          <p
            v-if="failed[p.id]"
            class="pv-empty"
            role="status"
          >
            {{ labels.patchesLoadError }}
          </p>
          <PatchBody
            v-else
            :items="itemsOf(p.id)"
            :expanded="filter !== 'all'"
          />
        </div>
      </CollapseTransition>
    </section>
  </div>
</template>

<script setup>
// GW's updates in one place (/patches, owner 2026-10-01): the app's rules data, the Munitorum Field
// Manual's points and the FAQ, update by update, "was → now". Generated from the data history by
// scripts/gen-patch-notes.mjs — nothing here is written by hand. The list (index.js) is light; an
// update's changes load when it is opened, the newest one at once. Narrowing to a faction (or to
// the pinned ones) is in the address, so a link to "what changed for Orks" can be shared.
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdaptivePicker from '../components/AdaptivePicker.vue'
import CollapseTransition from '../components/CollapseTransition.vue'
import FactionPickerList from '../components/tracker/FactionPickerList.vue'
import PatchBody from '../components/patches/PatchBody.vue'
import { patches } from '../data/patches/index.js'
import { factionGroups, factionIndexBySlug } from '../data/factionsIndex.js'
import { useFavorites } from '../composables/useFavorites.js'
import { useFormatDate } from '../composables/useFormatDate.js'
import { useLocale } from '../composables/useLocale.js'
import { ui } from '../i18n/ui.js'

const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const { formatDate } = useFormatDate()
const route = useRoute()
const router = useRouter()
const { pinnedFactionsFrom } = useFavorites()

const pinned = computed(() => pinnedFactionsFrom(factionGroups).map((f) => f.slug))

// `?f=` — a faction slug, `mine` (the pinned ones) or nothing (all). With no choice made, a reader
// who pinned factions sees theirs.
const filter = computed(() => {
  const f = route.query.f
  if (f === 'all' || (f && factionIndexBySlug(f))) return f
  if (f === 'mine' || !f) return pinned.value.length ? 'mine' : 'all'
  return 'all'
})
const filterSlugs = computed(() => (filter.value === 'all' ? null : filter.value === 'mine' ? pinned.value : [filter.value]))
const filterName = computed(() => (filter.value === 'all' ? labels.value.patchesAll
  : filter.value === 'mine' ? labels.value.patchesMine
    : factionIndexBySlug(filter.value)?.name || filter.value))

const pickerOpen = ref(false)
// A push, not a replace: on a phone the picker is a sheet whose closing steps Back over its own
// history entry (useBackToClose) — a replace swapped that very entry and the step undid the pick.
// As a push it is also what Back should undo: the previous filter.
function pick(f) {
  pickerOpen.value = false
  if (f !== filter.value) router.push({ query: { ...route.query, f } })
}

// The core rules belong to every army, so they stay in a narrowed list.
const counted = (p) => {
  const s = filterSlugs.value
  if (!s) return p.total
  return (p.byFaction.core || 0) + s.reduce((n, slug) => n + (p.byFaction[slug] || 0), 0)
}
const shown = computed(() => patches.map((p) => ({ ...p, count: counted(p) })).filter((p) => p.count))

// Each update's file, loaded on first open; a failed load (offline, a stale tab) says so and is
// tried again on the next open.
const files = import.meta.glob(['../data/patches/*.json'])
const loaded = reactive({})
const failed = reactive({})
async function load(id) {
  if (loaded[id]) return
  delete failed[id]
  try {
    const mod = await files[`../data/patches/${id}.json`]()
    loaded[id] = mod.default || mod
  } catch {
    failed[id] = true
  }
}
function itemsOf(id) {
  const s = filterSlugs.value
  const items = loaded[id]?.items || []
  return s ? items.filter((x) => !x.faction || s.includes(x.faction)) : items
}

const openId = ref(null)
function toggle(id) {
  openId.value = openId.value === id ? null : id
  if (openId.value) load(id)
}
// The newest update is open from the start — and again when a narrower filter drops the open one.
watch(shown, (list) => {
  if (!list.some((p) => p.id === openId.value) && list[0]) toggle(list[0].id)
}, { immediate: true })
</script>

<style scoped>
.patches-view { padding-top: 0.5rem; }

.hero {
  text-align: center;
  padding: 0.6rem 0 0.5rem;
  border-bottom: 2px solid var(--accent);
  margin-bottom: 0.6rem;
}
.hero-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}
.hero-sub {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.pv-bar,
.pv-empty,
.pv-patch {
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}
.pv-bar { display: flex; margin-bottom: 0.5rem; }
.pv-trigger {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.7rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  font: inherit;
  color: var(--text-primary);
  cursor: pointer;
}
.pv-trigger-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}
.pv-trigger-name { font-weight: 600; font-size: 0.9rem; }
.pv-trigger .bi { font-size: 0.75rem; color: var(--text-muted); }

.pv-scopes {
  display: flex;
  gap: 0.4rem;
  padding: 0 0 0.5rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
}
.pv-scope {
  flex: 1;
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--border);
  font: inherit;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
}
.pv-scope.on {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

.pv-empty {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 0;
}

.pv-patch {
  background: var(--bg-card);
  border: 1px solid var(--border);
  margin-bottom: 0.4rem;
}
/* Every fold on the page reads the same way: what it is on the left, the chevron on the right
   edge, the whole line the button. */
.pv-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
}
.pv-head-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pv-title { font-weight: 700; font-size: 0.95rem; line-height: 1.3; }
.pv-meta { font-size: 0.75rem; color: var(--text-muted); }
.pv-chev { font-size: 0.8rem; color: var(--text-muted); transition: transform var(--motion-fast) ease; }
.pv-chev.open { transform: rotate(180deg); }
.pv-body { padding: 0 0.75rem 0.3rem; border-top: 1px solid var(--border-light); }
</style>
