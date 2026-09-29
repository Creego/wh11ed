import { computed, ref } from 'vue'

// How a page swap moves — the name App.vue's route <Transition> takes (2026-09-28).
//
// - Down a chain (`meta.trail` + `meta.level` in router/index.js: a list, an item, the item's
//   editor) the new page comes in from the right (`axis-fwd`); back up it comes from the left
//   (`axis-back`). In-page switches (tabs, the roster editor's modes) fade instead (2026-09-29).
// - A link can say how the NEXT swap moves (`markNextPage`): the "To game" / "To roster" chips
//   rise from the bottom (`rise`), a PageTabs row of route tabs slides by the tabs' order.
//   A mark beats the chain.
// - Everything else — across sections, the bottom nav, a page with no level — fades as always.
//
// iOS: Safari animates its own edge-swipe back and forward. A history step (popstate) there
// fades instead of sliding, or the reader would see the page move twice.

const next = ref(null) // a link's mark for the coming swap
const auto = ref('fade') // what the chain says about the swap under way

export const pageMotion = computed(() => next.value || auto.value)

// The moment in a page swap when the new page is in the document but not yet visible (its
// transition's `enter`). router/index.js waits for it before setting the scroll, so the reset
// happens while nothing is on screen — not at the click, under a page still sliding away. Not
// the old page's after-leave: between the two the document is only as tall as the chrome, a
// scroll set then is clamped to nothing, and the browser's scroll anchoring moved it again once
// the new page arrived (measured 2026-09-28).
let gapWaiters = []
let holding = null // the page container kept from shrinking through a swap, and its release

// `@before-leave`: mark the page on its way out (App.vue's sticky-bar reserve keys off it) and
// keep its container at the page's height until the next one has grown into it. Otherwise the
// document collapses to one screen between the pages, the scroll is clamped to nothing — so a
// reset to the top is a no-op — and the browser, still holding the old offset, puts it back once
// the new page's data arrives: a faction page opened from halfway down the list landed at 572px
// instead of the top (measured 2026-09-28).
export function pageLeaving(el) {
  el.classList?.add('page-leaving')
  const box = el.parentElement
  if (!box || !el.offsetHeight) return
  release()
  box.style.minHeight = `${box.offsetHeight}px`
  holding = { box }
}

// `@enter`: the new page is in the document, still invisible — the moment to set the scroll
// (router/index.js waits for it). The hold comes off as soon as the page has grown into it, or
// once it has stopped growing for 300ms (a page that is simply shorter: holding it longer only
// leaves a blank band above the footer), and after 1.5s whatever happens.
export function pageArrived(el) {
  const ws = gapWaiters
  gapWaiters = []
  ws.forEach((w) => w())
  const h = holding
  if (!h) return
  const need = parseFloat(h.box.style.minHeight) || 0
  const done = () => { if (holding === h) release() }
  h.timer = setTimeout(done, 1500)
  const settle = () => { clearTimeout(h.still); h.still = setTimeout(done, 300) }
  settle()
  if (typeof ResizeObserver !== 'undefined' && el?.nodeType === 1) {
    h.ro = new ResizeObserver(() => { if (el.offsetHeight >= need) done(); else settle() })
    h.ro.observe(el)
  }
}

function release() {
  if (!holding) return
  clearTimeout(holding.timer)
  clearTimeout(holding.still)
  holding.ro?.disconnect()
  holding.box.style.minHeight = ''
  holding = null
}
export function pageSwapGap(timeoutMs = 600) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, timeoutMs)
    gapWaiters.push(() => { clearTimeout(t); resolve() })
  })
}
export function markNextPage(name) { next.value = name }
export function clearPageMotion() { next.value = null }

const IOS = typeof navigator !== 'undefined'
  && (/iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))

export function motionFor(to, from, { fromHistory = false, ios = IOS } = {}) {
  const a = from?.meta || {}
  const b = to?.meta || {}
  if (!a.trail || a.trail !== b.trail || a.level == null || b.level == null) return 'fade'
  if (fromHistory && ios) return 'fade'
  if (b.level > a.level) return 'axis-fwd'
  if (b.level < a.level) return 'axis-back'
  return 'fade'
}

// Wires the chain into the router: once, from App.vue. A mark set by a link that then did not
// navigate is dropped rather than handed to some later, unrelated swap.
//
// A history step is told apart by vue-router's own `history.state.position`: on a back/forward
// the browser has already moved to the target entry when the guards run, so the position differs
// from the one the last navigation settled on; on a push it does not change until after them. (A
// `popstate` listener cannot tell: the router's own listener starts the navigation first.)
export function installPageMotion(router) {
  const position = () => (typeof window === 'undefined' ? null : window.history.state?.position ?? null)
  let settled = position()
  router.beforeEach((to, from) => {
    const now = position()
    auto.value = motionFor(to, from, { fromHistory: now != null && settled != null && now !== settled })
  })
  router.afterEach((_to, _from, failure) => {
    settled = position()
    if (failure) clearPageMotion()
  })
}
