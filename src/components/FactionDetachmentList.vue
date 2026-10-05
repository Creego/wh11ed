<template>
  <div class="modal-list">
    <template
      v-for="(d, i) in detachments"
      :key="d.id"
    >
      <!-- Another faction's detachments this army may field (useFactionPage's `from`) come after
           its own, under that faction's name — a Chapter's two or eight would otherwise drown in
           the Codex's fifteen (owner, 2026-10-05). -->
      <p
        v-if="d.from && d.from !== detachments[i - 1]?.from"
        class="fdl-group"
      >
        {{ labels.factionDetachmentsFrom.replace('{faction}', d.from) }}
      </p>
      <DetachmentOption
        :name="d.name"
        :name-ru="d.nameRu || ''"
        :force-dispositions="d.forceDispositions || []"
        :unique="d.unique || ''"
        :tag="d.tag || ''"
        :dp="d.dp || 0"
        :on="d.id === activeId"
        :compact="compact"
        @click="$emit('pick', d.id)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DetachmentOption from './DetachmentOption.vue'
import { ui } from '../i18n/ui.js'
import { useLocale } from '../composables/useLocale.js'

// A single-pick list of detachments — or of anything else with an `id` and a `name` (the Chapter
// picker in FactionPickerBar passes plain items; the detachment-only fields simply don't render).
// An optional `tag` renders as a quiet corner keyword (the chapter lock on SM detachments). Drawn
// inside an AdaptivePicker: in its modal on a phone, compact in its dropdown on a wide screen.
defineProps({
  detachments: { type: Array, required: true },
  activeId: { type: String, default: null },
  compact: { type: Boolean, default: false },
})
defineEmits(['pick'])

const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
</script>

<style scoped>
.fdl-group {
  margin: 0.45rem 0 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>
