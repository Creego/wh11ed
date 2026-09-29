<template>
  <div
    v-if="wide"
    ref="hostEl"
    class="roster-desk rw-host"
  >
    <RosterListView
      class="rd-list"
      in-desk
      :active-id="rosterId"
    />
    <div class="rd-main">
      <Transition
        name="fade"
        mode="out-in"
      >
        <RosterViewView
          v-if="rosterId"
          :key="rosterId"
          :roster-id="rosterId"
          in-desk
          :unit-pane="three"
        />
        <TrackerStatsView
          v-else
          in-desk
        />
      </Transition>
    </div>
  </div>
  <RosterViewView v-else-if="rosterId" />
  <RosterListView v-else />
</template>

<script setup>
// The rosters on a wide screen (owner, 2026-09-29): one screen instead of a list page and a page
// per roster. The list of lists stands in a narrow column on the left; beside it either the open
// roster (/roster/:id/view) or, with none open (/roster), the game statistics — the list's
// "Statistics" button is simply the way to /roster. From 1200px the roster's page itself splits
// again and a unit's card opens in a third column instead of a dialog (RosterViewView unitPane);
// between 901 and 1199px (a tablet) it stays two columns and the card stays a dialog.
//
// Below 901px (the bottom nav's width) both addresses are what they always were: the list page
// and the roster's page. App.vue keys the page swap by one key for both addresses on a wide
// screen, so moving between rosters keeps this screen — and the list's scroll — standing, and
// only the right-hand side fades.
//
// The desk fills the window and each column scrolls on its own (useViewportFill, the builder's
// workbench does the same). The statistics load only when shown: they read the tracker's store,
// which statically carries the mission datasets the roster routes must not.
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RosterListView from './RosterListView.vue'
import RosterViewView from './RosterViewView.vue'
import { useMediaQuery } from '../../composables/useMediaQuery.js'
import { useViewportFill } from '../../composables/useViewportFill.js'

const TrackerStatsView = defineAsyncComponent(() => import('./TrackerStatsView.vue'))

const route = useRoute()
const rosterId = computed(() => (route.params.id ? String(route.params.id) : ''))

const wide = useMediaQuery('(min-width: 901px)')
const three = useMediaQuery('(min-width: 1200px)')

const hostEl = ref(null)
const { measure } = useViewportFill(hostEl)
watch(wide, () => nextTick(measure))
</script>

<style scoped>
.roster-desk {
  display: grid;
  grid-template-columns: minmax(17rem, 21rem) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 1rem;
}
.rd-list,
.rd-main { min-height: 0; }
.rd-main {
  border-left: 1px solid var(--border);
  padding-left: 1rem;
}
</style>
