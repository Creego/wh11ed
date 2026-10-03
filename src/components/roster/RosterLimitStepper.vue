<template>
  <!-- One number of a custom points limit: − [ N unit ] + as one joined control, typed or stepped.
       The points step by 50, the limits by 1 (RosterCustomLimit). -->
  <div
    class="rls"
    :class="{ own }"
  >
    <button
      type="button"
      class="rls-step"
      :aria-label="`${label} −${step}`"
      :disabled="value <= min"
      @click="set(value - step)"
    >
      <i class="bi bi-dash" />
    </button>
    <input
      ref="input"
      class="rls-num"
      type="number"
      inputmode="numeric"
      :min="min"
      :step="step"
      :aria-label="label"
      :value="value"
      @input="set($event.target.value)"
    >
    <span
      v-if="unit"
      class="rls-unit"
    >{{ unit }}</span>
    <button
      type="button"
      class="rls-step"
      :aria-label="`${label} +${step}`"
      @click="set(value + step)"
    >
      <i class="bi bi-plus" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  step: { type: Number, default: 1 },
  min: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  label: { type: String, default: '' },
  // A number the player set, against one borrowed from a size: the frame says which.
  own: { type: Boolean, default: true },
})
const emit = defineEmits(['update'])
const input = ref(null)
function set(v) { emit('update', Math.max(props.min, Math.round(Number(v) || 0))) }
defineExpose({ focus: () => input.value?.focus() })
</script>

<style scoped>
.rls {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}
.rls.own { border-color: var(--accent); }
.rls-step {
  width: 2.25rem;
  min-height: 2.25rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
}
.rls-step:disabled { opacity: 0.4; cursor: default; }
@media (hover: hover) { .rls-step:not(:disabled):hover { color: var(--accent); } }
.rls-num {
  width: 3.5rem;
  padding: 0 0.25rem;
  background: none;
  border: none;
  border-left: 1px solid var(--border);
  font: inherit;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-align: right;
  appearance: textfield;
  -moz-appearance: textfield;
}
.rls:not(:has(.rls-unit)) .rls-num { border-right: 1px solid var(--border); text-align: center; }
.rls-num::-webkit-inner-spin-button,
.rls-num::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.rls-num:focus { outline: none; }
.rls-unit {
  display: flex;
  align-items: center;
  padding: 0 0.4rem 0 0.25rem;
  border-right: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
