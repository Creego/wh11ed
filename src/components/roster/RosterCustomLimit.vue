<template>
  <!-- A custom points limit: the number, and the player's own Detachment Points,
       enhancements, copies of a unit and copies of a Battleline unit (owner, 2026-10-03). Each one
       left alone is borrowed from the size the points fall within (rosterEngine's effectiveBattle),
       so opening the dialog changes nothing until a number is moved; "Back to <size>" drops them all.
       The number stands under the phone's field; the limits are in a dialog on both widths,
       behind the sliders beside the field (RosterBattleSizeField). -->
  <div class="rcl">
    <!-- In the dialog the number is a row like the four under it; under the phone's field it
         stands alone, the field's own label above it. -->
    <component
      :is="pointsOnly ? 'div' : 'label'"
      :class="pointsOnly ? 'rcl-solo' : 'rcl-row'"
    >
      <span
        v-if="!pointsOnly"
        class="rcl-name"
      >{{ labels.rosterPointsLimitLabel }}</span>
      <RosterLimitStepper
        ref="points"
        class="rcl-points"
        :value="limit.customPoints"
        :step="50"
        :unit="labels.rosterPointsLabel"
        :label="labels.rosterPointsLimitLabel"
        @update="update({ customPoints: $event })"
      />
    </component>

    <div
      v-if="!pointsOnly"
      class="rcl-own"
    >
      <label
        v-for="row in rows"
        :key="row.key"
        class="rcl-row"
      >
        <span class="rcl-name">{{ row.label }}</span>
        <RosterLimitStepper
          :value="row.value"
          :label="row.label"
          :own="row.own"
          @update="setOwn(row.key, $event)"
        />
      </label>
      <button
        v-if="battle.ownLimits"
        type="button"
        class="rcl-reset"
        @click="reset"
      >
        <i class="bi bi-arrow-counterclockwise" /> {{ labels.rosterLimitResetTo.replace('{size}', baseName) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import RosterLimitStepper from './RosterLimitStepper.vue'
import { ui } from '../../i18n/ui.js'
import { useLocale } from '../../composables/useLocale.js'
import { CUSTOM_LIMIT_KEYS, effectiveBattle } from '../../composables/rosterEngine.js'
import rosterCore from '../../data/roster/core.js'

const props = defineProps({
  // The whole limit (rosterLimit.js's limitOf), battleSize 'custom'.
  limit: { type: Object, required: true },
  // Under the phone's field: the number alone — the limits are the dialog's, behind the sliders.
  pointsOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:limit'])
const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const points = ref(null)

const battle = computed(() => effectiveBattle(props.limit, rosterCore))
const baseName = computed(() => rosterCore.battleSizes.find((b) => b.id === battle.value.base)?.name || '')

const own = computed(() => props.limit.customLimits || {})
const rows = computed(() => {
  const l = labels.value
  const b = battle.value
  return [
    { key: 'dp', label: l.rosterLimitOwnDp, value: b.dp },
    { key: 'enh', label: l.rosterLimitOwnEnh, value: b.enhLimit },
    { key: 'dup', label: l.rosterLimitOwnDup, value: b.dupLimit },
    { key: 'line', label: l.rosterLimitOwnLine, value: b.lineLimit },
  ].map((r) => ({ ...r, own: own.value[r.key] != null }))
})

function update(patch) { emit('update:limit', { ...props.limit, ...patch }) }
function setOwn(key, v) {
  const next = { ...own.value, [key]: v }
  // Only the keys the engine reads, so nothing stray travels in a share link or a snapshot.
  update({ customLimits: Object.fromEntries(CUSTOM_LIMIT_KEYS.filter((k) => next[k] != null).map((k) => [k, next[k]])) })
}
function reset() {
  const { customLimits: _, ...rest } = props.limit
  emit('update:limit', rest)
}
defineExpose({ focus: () => points.value?.focus() })
</script>

<style scoped>
.rcl { display: flex; flex-direction: column; align-items: flex-start; gap: 0.45rem; width: 100%; position: relative; z-index: 1; }
.rcl-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0;
  background: none;
  border: none;
  font: inherit;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
}
@media (hover: hover) { .rcl-reset:hover { color: var(--accent); } }
.rcl-own { display: flex; flex-direction: column; gap: 0.35rem; width: 100%; }
.rcl > .rcl-row { width: 100%; }
.rcl-row { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; }
.rcl-name { font-size: 0.82rem; color: var(--text-muted); }
</style>
