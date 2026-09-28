import { ref, toValue, watch } from 'vue'
import { instantly } from './useRefNavigation.js'

// Which way a side-by-side switch moved — the `axis-fwd` / `axis-back` pair in style.css, for a
// <Transition mode="out-in"> around what the switch shows. `active` is the chosen key (a ref or a
// getter), `order` the keys left to right as the switch draws them: moving right goes forward
// (the new view comes in from the right), left goes back. Decided before the new view renders.
export function useAxisDirection(active, order) {
  const name = ref('axis-fwd')
  watch(() => toValue(active), (to, from) => {
    const keys = toValue(order)
    name.value = keys.indexOf(to) < keys.indexOf(from) ? 'axis-back' : 'axis-fwd'
  })
  return name
}

// For the same <Transition>'s `@enter`: the new panel is in the document but still invisible, and
// the old one is gone — nothing on screen to jump. (Not after-leave: the old panel is already
// detached there and the document at its shortest.) If the reader had scrolled the tab strip
// up under the header (deep into a long tab), put it back just below the header, so the new tab
// opens at its start — instead of the browser clamping the scroll to a shorter panel mid-swap,
// which threw the page by hundreds of px (2026-09-28). Instant, like every programmatic scroll
// that is not the reader's own jump.
export function bringTabsIntoView(entering) {
  let host = entering?.parentElement
  while (host && !host.querySelector(':scope > .page-tabs, :scope > * > .page-tabs')) host = host.parentElement
  const strip = host?.querySelector('.page-tabs')
  if (!strip) return
  const header = Math.max(0, ...[...document.querySelectorAll('.navbar, .subnav')].map((h) => h.getBoundingClientRect().bottom))
  const top = strip.getBoundingClientRect().top
  if (top < header) instantly(() => window.scrollBy(0, top - header - 8))
}
