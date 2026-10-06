<template>
  <!-- A detachment's enhancements as the rules print them — name, Russian name, points, text — and,
       given the list, who in it wears each one or could (enhancementBearers). The rules panel over
       the builder and the read-only list's Rules tab draw the same thing. -->
  <div class="enh-list">
    <article
      v-for="e in enhancements"
      :key="e.name"
      class="enh"
    >
      <div class="enh-head">
        <span class="enh-name">{{ e.name }}</span>
        <span
          v-if="e.nameRu"
          class="enh-ru"
        >{{ e.nameRu }}</span>
        <span
          v-if="e.points != null"
          class="enh-pts"
        >{{ e.points }}{{ labels.rosterPointsLabel }}</span>
      </div>
      <div
        class="enh-body"
        v-html="renderRichText(e.body)"
      />
      <p
        v-if="bearers(e)"
        class="enh-who"
        :class="{ taken: bearers(e).taken.length }"
      >
        <template v-if="bearers(e).taken.length">
          <i
            class="bi bi-check-lg"
            aria-hidden="true"
          /> {{ labels.rosterEnhTaken }} {{ bearers(e).taken.join(', ') }}<span
            v-if="bearers(e).can.length"
            class="enh-more"
          > · {{ labels.rosterEnhCanMore }} {{ bearers(e).can.join(', ') }}</span>
        </template>
        <template v-else-if="bearers(e).can.length">
          {{ labels.rosterEnhCan }} {{ bearers(e).can.join(', ') }}
        </template>
        <template v-else>
          {{ labels.rosterEnhNobody }}
        </template>
      </p>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ui } from '../../i18n/ui.js'
import { useLocale } from '../../composables/useLocale.js'
import { useRenderInline } from '../../composables/useRenderInline.js'
import { enhancementBearers } from '../../composables/rosterEngine.js'

const props = defineProps({
  // The rules bundle's enhancements (name, nameRu, points, body).
  enhancements: { type: Array, required: true },
  // The list, to say who wears each one: { units, defOf, detachments (roster data), factionSlug }.
  // Without it the texts alone.
  list: { type: Object, default: null },
})
const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
const { renderRichText } = useRenderInline()

const answers = computed(() => {
  const out = new Map()
  if (!props.list) return out
  for (const e of props.enhancements) out.set(e.name, enhancementBearers(e.name, props.list))
  return out
})
const bearers = (e) => answers.value.get(e.name) || null
</script>

<style scoped>
.enh { padding: 0.35rem 0; border-top: 1px dashed var(--border); }
.enh:first-child { border-top: none; padding-top: 0; }
.enh-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.35rem; }
.enh-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
.enh-ru { font-size: 0.72rem; color: var(--text-muted); }
.enh-pts { margin-left: auto; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
.enh-body { font-size: 0.8rem; line-height: 1.4; color: var(--text-primary); }
.enh-who { margin: 0.3rem 0 0; font-size: 0.78rem; color: var(--text-muted); }
.enh-who.taken { color: var(--accent-ink); font-weight: 600; }
.enh-more { color: var(--text-muted); font-weight: 400; }
</style>
