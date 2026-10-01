<template>
  <div class="pd">
    <slot
      name="trigger"
      :open="open"
      :toggle="toggle"
    />
    <Transition name="fade">
      <div
        v-if="open"
        class="pd-backdrop"
        @click="open = false"
      />
    </Transition>
    <Transition name="fade-pop">
      <div
        v-if="open"
        class="pd-panel"
        role="dialog"
        :aria-label="label"
      >
        <slot :close="() => (open = false)" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
// A picker that drops down under its field instead of covering the screen — the desk's settings
// line (RosterSettingsBar) uses it for the faction, the detachments and the declared Force
// Disposition, which on a phone are modals. The panel holds the SAME list the modal does
// (FactionPickerList, DetachmentPickerList), so a row looks and behaves alike in both (owner,
// 2026-10-01). The account menu's recipe: a transparent backdrop takes the click outside, Escape
// closes, `fade-pop` opens it. The parent owns `open` (v-model:open) — a single pick closes it,
// a multi-pick (detachments under a DP budget) leaves it up.
import { onMounted, onUnmounted } from 'vue'

defineProps({ label: { type: String, default: '' } })
const open = defineModel('open', { type: Boolean, default: false })
const toggle = () => { open.value = !open.value }

function onEscape(e) { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onEscape))
onUnmounted(() => window.removeEventListener('keydown', onEscape))
</script>

<style scoped>
.pd { position: relative; display: inline-flex; flex-direction: column; }
.pd-backdrop { position: fixed; inset: 0; z-index: 205; }
/* The modal's surface, dropped under the field: same card ground and frame, its own scroll. */
.pd-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 210;
  width: var(--pd-width, 26rem);
  max-height: min(70dvh, 34rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.45rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}
</style>
