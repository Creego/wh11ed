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
  line-height: 1.45;
  color: var(--text-primary);
  white-space: pre-line;
}
/* Struck and added, each in its theme's pair (--diff-* in style.css). */
.ptd-del {
  background: var(--diff-del-bg);
  color: var(--diff-del-ink);
  text-decoration: line-through;
}
.ptd-ins {
  background: var(--diff-ins-bg);
  color: var(--diff-ins-ink);
  text-decoration: none;
}
</style>
