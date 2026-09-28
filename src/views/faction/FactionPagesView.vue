<template>
  <FactionLayout>
    <!-- The faction's three pages (rules, units, FAQ) are children of this route: the hero and its
         tabs stay where they are and only what is under them changes, sliding toward the side of
         the tab picked. Before 2026-09-28 each page was a route of its own that drew the hero again,
         so a tab switch slid the whole page, hero and tabs included, out and back in. -->
    <RouterView v-slot="{ Component }">
      <Transition
        :name="tabAxis"
        mode="out-in"
        @before-leave="pageLeaving"
        @enter="pageArrived"
      >
        <component
          :is="Component"
          :key="tabKey"
        />
      </Transition>
    </RouterView>
  </FactionLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FactionLayout from '../../components/FactionLayout.vue'
import { stripLocale } from '../../router/locale.js'
import { useAxisDirection } from '../../composables/useAxisDirection.js'
import { pageLeaving, pageArrived } from '../../composables/usePageMotion.js'

const route = useRoute()
// One page per tab; the locale prefix is not a different page.
const tabKey = computed(() => stripLocale(route.path))
// The tabs' order, as FactionLayout draws them: rules, units, FAQ.
const tabOrder = computed(() => {
  const base = `/factions/${route.params.slug}`
  return [base, `${base}/datasheets`, `${base}/faq`]
})
const tabAxis = useAxisDirection(tabKey, tabOrder)
</script>
