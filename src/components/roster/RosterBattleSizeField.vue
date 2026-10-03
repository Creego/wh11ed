<template>
  <!-- The list's points limit: the three battle sizes, a number of the player's own, or none at
       all (owner, 2026-10-03). A picker in the shape of the faction and detachment fields beside it
       — a dropdown on a wide screen, a sheet on a phone (AdaptivePicker) — and every option says
       what it decides besides the points (DP, enhancements, copies of a unit), in the list AND
       under the chosen value, because those limits are what the choice is really about.
       Two shapes: `row` is a row of the phone form's settings card (RosterSetupFields, the label
       inside and the whole row one target), `bar` is a field of the desk's settings line
       (RosterSettingsBar, which draws the label itself and carries the limits on it). -->
  <div
    class="bsf"
    :class="variant"
  >
    <AdaptivePicker
      v-model:open="open"
      :title="labels.rosterPointsLimitLabel"
      panel-width="22rem"
    >
      <template #trigger="{ toggle }">
        <button
          type="button"
          class="bsf-trigger"
          :aria-expanded="open"
          @click="toggle"
        >
          <span
            v-if="variant === 'row'"
            class="bsf-label"
          >{{ labels.rosterPointsLimitLabel }}</span>
          <span class="bsf-value">
            <span
              class="bsf-head"
              :class="{ word: !current.points }"
            >{{ headOf(current) }}</span>
            <span
              v-if="current.name"
              class="bsf-name"
            >{{ current.name }}</span>
          </span>
          <i class="bi bi-chevron-down" />
        </button>
      </template>
      <template #default="{ bodyClass, close }">
        <div
          class="modal-list bsf-list"
          :class="bodyClass"
        >
          <button
            v-for="o in options"
            :key="o.id"
            type="button"
            class="bsf-opt"
            :class="{ on: o.id === battleSize }"
            :data-limit="o.id"
            @click="pick(o.id, close)"
          >
            <span class="bsf-opt-head">
              <span
                class="bsf-head"
                :class="{ word: !o.points }"
              >{{ headOf(o) }}</span>
              <span
                v-if="o.name"
                class="bsf-name"
              >{{ o.name }}</span>
            </span>
            <span class="bsf-facts-line">
              <span
                v-for="(f, i) in o.facts"
                :key="i"
                :class="f.plain ? 'bsf-fact-text' : ['bsf-chip', { mono: f.mono }]"
              >{{ f.text }}</span>
            </span>
          </button>
        </div>
      </template>
    </AdaptivePicker>

    <!-- A custom limit's own numbers are set in a dialog (owner, 2026-10-03), opened from the
         sliders to the right of the field — and on the desk by picking "Custom" too. -->
    <button
      v-if="battleSize === 'custom'"
      type="button"
      class="bsf-own-btn"
      :class="{ own: current.ownLimits }"
      :aria-label="labels.rosterLimitOwnTitle"
      :title="labels.rosterLimitOwnTitle"
      @click="customOpen = true"
    >
      <i class="bi bi-sliders" />
    </button>
    <BaseModal
      v-if="customOpen"
      :title="labels.rosterLimitOwnTitle"
      max-width="420px"
      initial-focus=".rcl-points .rls-num"
      @close="customOpen = false"
    >
      <div class="modal-body bsf-modal">
        <RosterCustomLimit
          :limit="limit"
          @update:limit="$emit('update:limit', $event)"
        />
        <button
          type="button"
          class="btn-primary bsf-done"
          @click="customOpen = false"
        >
          {{ labels.rosterLimitDone }}
        </button>
      </div>
    </BaseModal>

    <!-- A custom number and the player's own limits: under the field on a phone; on the desk they
         are inside the picker, so the line keeps one row. -->
    <Transition name="fade">
      <RosterCustomLimit
        v-if="battleSize === 'custom' && variant !== 'bar'"
        ref="customEditor"
        points-only
        :limit="limit"
        @update:limit="$emit('update:limit', $event)"
      />
    </Transition>

    <!-- The desk's line shows the value alone (owner, 2026-10-03): its picker says the rest. -->
    <span
      v-if="variant !== 'bar'"
      class="bsf-facts-line"
    >
      <span
        v-for="(f, i) in current.facts"
        :key="i"
        :class="f.plain ? 'bsf-fact-text' : ['bsf-chip', { mono: f.mono }]"
      >{{ f.text }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import AdaptivePicker from '../AdaptivePicker.vue'
import RosterCustomLimit from './RosterCustomLimit.vue'
import BaseModal from '../BaseModal.vue'
import { ui } from '../../i18n/ui.js'
import { useLocale } from '../../composables/useLocale.js'
import { UNLIMITED_BATTLE, effectiveBattle } from '../../composables/rosterEngine.js'
import { limitOf } from '../../composables/rosterLimit.js'
import rosterCore from '../../data/roster/core.js'
import { factsOf as factsOfBattle } from '../../composables/battleLimitFacts.js'

// The whole limit as one value (rosterEngine's limitOf); every change comes back as a new one.
const props = defineProps({
  limit: { type: Object, default: () => limitOf(null) },
  variant: { type: String, default: 'row' },
})
const emit = defineEmits(['update:limit'])
const battleSize = computed(() => props.limit.battleSize)
const update = (patch) => emit('update:limit', { ...props.limit, ...patch })

const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const open = ref(false)
const customEditor = ref(null)

const factsOf = (battle) => factsOfBattle(battle, labels.value)

const options = computed(() => [
  ...rosterCore.battleSizes.map((b) => ({
    id: b.id, points: b.points, name: b.name, facts: factsOf(effectiveBattle({ battleSize: b.id }, rosterCore)),
  })),
  { id: 'custom', label: labels.value.rosterCustom, facts: [{ text: labels.value.rosterLimitCustomHint, plain: true }] },
  { id: UNLIMITED_BATTLE, label: labels.value.rosterBattleNone, facts: factsOf({ unlimited: true }) },
])

// The chosen value as the field shows it: a custom one by its own number.
const current = computed(() => {
  const battle = effectiveBattle(props.limit, rosterCore)
  // The desk's trigger names its number (the stepper is inside the picker); the phone's has the
  // stepper right under it, so the word alone.
  if (battle.custom) {
    const own = { ownLimits: battle.ownLimits, facts: factsOf(battle) }
    return props.variant === 'bar'
      ? { ...own, points: battle.points, name: labels.value.rosterCustom }
      : { ...own, label: labels.value.rosterCustom }
  }
  const o = options.value.find((x) => x.id === battleSize.value) || options.value[1]
  return { ...o, facts: factsOf(battle) }
})
function headOf(o) { return o.points ? String(o.points) : o.label }

// Custom has more answers to give: on a phone the cursor goes to the number under the field, on
// the desk its dialog opens.
const customOpen = ref(false)
function pick(id, close) {
  close()
  update({ battleSize: id })
  if (id !== 'custom') return
  if (props.variant === 'bar') customOpen.value = true
  else nextTick(() => customEditor.value?.focus())
}

</script>

<style scoped>
.bsf { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }

.bsf-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}
.bsf-trigger .bi { flex-shrink: 0; margin-left: auto; color: var(--text-dim); font-size: 0.7rem; }
.bsf-value { display: flex; align-items: baseline; gap: 0.45rem; min-width: 0; }
.bsf-head { font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
/* "Custom" and "No limit" are words, not figures: the text face, at the figures' weight. */
.bsf-head.word { font-family: inherit; font-size: 0.9rem; font-weight: 600; }
.bsf-name { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }

/* `row`: one row of the phone form's card — the label above the value, the whole row the target
   (the card's own rows do the same with a stretched ::after). */
.row .bsf-trigger { flex-wrap: wrap; column-gap: 0; }
.row .bsf-trigger::after { content: ''; position: absolute; inset: 0; }
.row .bsf-label {
  flex: 0 0 100%;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  margin-bottom: 0.15rem;
}
.row .bsf-trigger .bi { position: absolute; right: 0.6rem; top: 0.6rem; }
/* On the phone's row the sliders stand at the right of the value line, above the row's stretched
   target (a button cannot sit inside the field's own button). */
.row .bsf-own-btn { position: absolute; right: 0.6rem; top: 1.45rem; z-index: 1; }

/* `bar`: a field of the desk's settings line, the recessed box its neighbours wear. The line is
   one row of fields, so a custom number stands BESIDE the box — under it, it made this field
   taller than its neighbours and lifted its label off the row. */
.bsf.bar { flex-direction: row; align-items: center; gap: 0.6rem; }
.bar .bsf-trigger { width: auto; }

.bar .bsf-trigger {
  min-width: 11rem;
  padding: 0.35rem 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}
.bar .bsf-trigger .bi { color: var(--text-muted); font-size: inherit; }
/* The line's own type size, or the box comes out a hair taller than its neighbours. */
.bar .bsf-trigger .bsf-head { font-size: 0.9rem; line-height: inherit; }

/* The options: the detachment picker's rows (DetachmentOption) — a headline, then what it means. */
.bsf-list { gap: 0.3rem; }
.bsf-opt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-shrink: 0;
  gap: 0.3rem;
  width: 100%;
  min-height: 44px;
  padding: 0.45rem 0.6rem;
  text-align: left;
  font: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--motion-fast), border-color var(--motion-fast);
}
@media (hover: hover) { .bsf-opt:hover { border-color: var(--accent); } }
.bsf-opt.on { background: color-mix(in srgb, var(--accent) 16%, transparent); border-color: var(--accent); }
.bsf-opt-head { display: flex; align-items: baseline; gap: 0.5rem; }
.bsf-opt .bsf-head { font-size: 1.05rem; }

.bsf-facts-line { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
.bsf-chip {
  padding: 0.05rem 0.35rem;
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--text-muted);
  border: 1px solid var(--border);
  white-space: nowrap;
}
.bsf-chip.mono { font-family: var(--font-mono); font-weight: 700; color: var(--accent); }
.bsf-fact-text { font-size: 0.75rem; line-height: 1.35; color: var(--text-muted); }

/* The sliders to the right of the field: a square the field's own height (0.9rem type, 1.5 line,
   0.35rem padding, its border). Lit in the accent once the player's own limits are in force. */
.bsf-own-btn {
  --bsf-own: calc(0.9rem * 1.5 + 0.7rem + 2px);
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--bsf-own);
  height: var(--bsf-own);
  padding: 0;
  font-size: 0.9rem;
  line-height: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
}
.bsf-own-btn.own { color: var(--accent); border-color: var(--accent); }
@media (hover: hover) { .bsf-own-btn:hover { color: var(--accent); border-color: var(--accent); } }
.bsf-modal { padding: 0.9rem 1rem 1rem; display: flex; flex-direction: column; gap: 1rem; }
.bsf-done { align-self: flex-end; }
</style>
