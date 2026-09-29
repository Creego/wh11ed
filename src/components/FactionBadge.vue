<template>
  <span
    class="tone-badge"
    :class="{ 'has-icon': faction?.icon }"
    :style="faction?.icon ? { '--icon': `url(${faction.icon})` } : null"
  >{{ faction?.icon ? '' : faction?.abbr || '' }}</span>
</template>

<script setup>
// A faction's badge in its row — the emblem when the faction has one (factionsIndex.js `icon`),
// else the monogram. The emblem is a mask filled with the badge's own text colour, so it takes the
// faction's tone and the theme like the letters do, and the SVG stays one runtime-cached file
// rather than markup in every chunk. The name always stands beside the badge, so neither form is
// the row's only label. Needs a `.tone` ancestor, like `.tone-badge`.
defineProps({
  // An entry of factionsIndex.js (or anything with its `abbr` / `icon`).
  faction: { type: Object, default: null },
})
</script>

<style scoped>
/* Same box as a monogram's, so the names beside a column of badges stay in line; the emblem is
   wide and short, so it takes the box's padding too. */
.has-icon { width: 2.1rem; padding: 0.12rem; }
.has-icon::before {
  content: '';
  width: 100%;
  height: 100%;
  background: currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat;
  mask: var(--icon) center / contain no-repeat;
}
</style>
