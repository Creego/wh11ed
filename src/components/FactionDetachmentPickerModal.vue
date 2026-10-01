<template>
  <BaseModal
    :title="title || labels.factionDetachments"
    max-width="480px"
    @close="$emit('close')"
  >
    <!-- `modal-body` is not cosmetic: it carries the global `overscroll-behavior: contain`
         (style.css) that keeps a scroll at the list's end from chaining to the page behind.
         There is deliberately no body scroll-lock, so this class is what contains it. -->
    <FactionDetachmentList
      class="modal-body"
      :detachments="detachments"
      :active-id="activeId"
      @pick="(id) => $emit('pick', id)"
    />
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import FactionDetachmentList from './FactionDetachmentList.vue'
import { ui } from '../i18n/ui.js'
import { useLocale } from '../composables/useLocale.js'

// Also reused as a generic option picker (e.g. the Chapter picker in FactionPickerBar) — pass plain
// { id, name } items and a `title`. The rows are FactionDetachmentList.
defineProps({
  detachments: { type: Array, required: true },
  activeId: { type: String, default: null },
  title: { type: String, default: null },
})
defineEmits(['pick', 'close'])

const { locale } = useLocale()
const labels = computed(() => ui[locale.value])
</script>

<style scoped>
/* Narrow phones: BaseModal itself goes edge-to-edge (bottom sheet) at this breakpoint,
   so shrink the body's own gutter too — cards get closer to the full screen width
   instead of being inset by a fixed 0.75rem regardless of how little room there is. */
@media (max-width: 560px) {
  .modal-body {
    padding: 0.5rem 0.4rem;
  }
}
</style>
