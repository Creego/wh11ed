<template>
  <!-- The mark of a list held to the player's own limits (battleLimitFacts.js's ownLimitsLines):
       a small sliders icon beside its points. A tap — a hover tooltip never opens under a finger —
       lists the limits in the popover the rule glossary uses. Renders nothing for a list held to a
       printed size. -->
  <!-- `inert` inside another button (the tracker's roster picker row): the same mark as plain text,
       with its limits in the tooltip, since a button may not hold a button. -->
  <!-- It opens by sliding the points beside it aside (ExpandTransition), and closes the same way. -->
  <ExpandTransition>
    <span
      v-if="lines.length && inert"
      class="olm inert"
      :title="lines.join(' · ')"
    ><i class="bi bi-sliders" /> {{ labels.rosterLimitOwnShort }}</span>
    <button
      v-else-if="lines.length"
      type="button"
      class="olm"
      data-kw-open
      :title="lines.join(' · ')"
      :aria-label="`${labels.rosterLimitOwnTitle}: ${lines.join(', ')}`"
      @click.stop="show"
    >
      <i class="bi bi-sliders" />
    </button>
  </ExpandTransition>
</template>

<script setup>
import { computed } from 'vue'
import ExpandTransition from '../ExpandTransition.vue'
import { ui } from '../../i18n/ui.js'
import { useLocale } from '../../composables/useLocale.js'
import { useKeywordPopover } from '../../composables/useKeywordPopover.js'
import { effectiveBattle } from '../../composables/rosterEngine.js'
import { ownLimitsLines } from '../../composables/battleLimitFacts.js'
import rosterCore from '../../data/roster/core.js'

const props = defineProps({
  // Anything carrying the limit's keys — a roster, or rosterLimit.js's limitOf.
  roster: { type: Object, default: null },
  inert: { type: Boolean, default: false },
})
const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const lines = computed(() => ownLimitsLines(effectiveBattle(props.roster || {}, rosterCore), labels.value))
const { openRule } = useKeywordPopover()
function show(e) {
  openRule(labels.value.rosterLimitOwnTitle, lines.value.map((l) => `▪ ${l}`).join('\n'), e.currentTarget.getBoundingClientRect())
}
</script>

<style scoped>
.olm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  padding: 0 0.2rem;
  background: none;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  color: var(--accent);
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  vertical-align: middle;
}
@media (hover: hover) { .olm:not(.inert):hover { border-color: var(--accent); } }
.olm.inert { gap: 0.25rem; padding: 0 0.3rem; cursor: inherit; font-size: 0.72rem; }
</style>
