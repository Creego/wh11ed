import { ref } from 'vue'
import { API_BASE_URL } from '../config.js'

// The older part of "What's new". The app ships only its last few releases in
// src/data/changelog.js; everything older lives in the API's archive (wh11ed-api, GET /changelog,
// moved there by deploy.sh — see DEPLOY.md "Release notes archive") and is fetched here page by
// page, only when the reader asks for it. Notes almost nobody reads stay out of the first load and
// out of the installed app's offline download (owner's call, 2026-09-27).
//
// The site works without the API, and so does this page: offline or with the API down, the recent
// releases are all there and the button says why the rest is not.

export const ARCHIVE_PAGE = 10

// 'idle' — nothing asked yet · 'loading' · 'error' — the request failed, retry offered ·
// 'offline' — no network, nothing tried · 'done' — the archive has nothing older
export function useChangelogArchive({ fetchImpl = (...a) => fetch(...a), online = () => navigator.onLine } = {}) {
  const entries = ref([])
  const status = ref('idle')
  // Where the archive left off — the last version it RETURNED, not the last one shown: a page of
  // nothing but already-shown entries must still move the cursor, or the next click asks again.
  let cursor = null

  // `oldest` is the oldest version already on the page; the archive returns what is older still.
  // Entries the page already shows are skipped: a deploy whose move to the archive was skipped
  // leaves a version in both places, and it must not appear twice.
  async function loadOlder(oldest, shown = new Set()) {
    if (status.value === 'loading' || status.value === 'done') return
    if (!online()) {
      status.value = 'offline'
      return
    }
    status.value = 'loading'
    try {
      const qs = new URLSearchParams({ limit: String(ARCHIVE_PAGE) })
      const before = cursor ?? oldest
      if (before) qs.set('before', before)
      const res = await fetchImpl(`${API_BASE_URL}/changelog?${qs}`)
      if (!res.ok) throw new Error(`changelog ${res.status}`)
      const page = await res.json()
      const got = page.entries || []
      if (got.length) cursor = got[got.length - 1].version
      const fresh = got.filter((e) => !shown.has(e.version))
      entries.value = [...entries.value, ...fresh]
      status.value = page.more ? 'idle' : 'done'
    } catch {
      status.value = 'error'
    }
  }

  return { entries, status, loadOlder }
}
