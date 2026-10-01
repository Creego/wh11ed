<template>
  <!-- One text, the words that went struck through and the words that came marked: a reader sees
       the rule as it reads now and, in place, what it used to say. -->
  <!-- A text that only arrived has nothing to compare: it reads as the site prints rules. -->
  <div
    v-if="!from"
    class="ptd"
    v-html="renderRichText(to)"
  />
  <p
    v-else
    class="ptd"
  >
    <template
      v-for="(r, i) in runs"
      :key="i"
    >
      <del
        v-if="r.t === 'del'"
        class="ptd-del"
      >{{ r.s }}</del><ins
        v-else-if="r.t === 'ins'"
        class="ptd-ins"
      >{{ r.s }}</ins><span v-else>{{ r.s }}</span>{{ ' ' }}
    </template>
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { wordDiff } from '../../utils/wordDiff.js'
import { useRenderInline } from '../../composables/useRenderInline.js'

const props = defineProps({
  from: { type: String, default: '' },
  to: { type: String, default: '' },
})
const { renderRichText } = useRenderInline()
// The FAQ keeps the app's own markup (`**bold**`, `__underline__`); a diff compares the words.
const bare = (s) => (s || '').replace(/\*\*|__/g, '')
const runs = computed(() => wordDiff(bare(props.from), bare(props.to)))
</script>

<style scoped>
.ptd {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-primary);
  white-space: pre-line;
}
/* Struck in the danger tint, added in a green one — both as a wash behind the words, so the text
   stays the text colour and reads in either theme. */
.ptd-del {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  color: var(--text-muted);
  text-decoration: line-through;
}
.ptd-ins {
  --ptd-green: #2e7d32;
  background: color-mix(in srgb, var(--ptd-green) 18%, transparent);
  text-decoration: none;
}
</style>
