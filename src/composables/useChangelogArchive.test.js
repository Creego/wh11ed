import { describe, expect, it, vi } from 'vitest'
import { useChangelogArchive } from './useChangelogArchive.js'

// The older releases, fetched from the API only on request. What a reader would notice if it broke:
// a page that repeats itself, a release shown twice, or a button that spins forever offline.

const entry = (version) => ({ version, date: '2026-01-01', en: ['a'], ru: ['а'] })
const reply = (entries, more) => ({ ok: true, json: async () => ({ entries: entries.map(entry), more }) })

describe('useChangelogArchive', () => {
  it('asks for what is older than the page shows, then carries on from where the archive stopped', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(reply(['2.6.6', '2.6.5'], true))
      .mockResolvedValueOnce(reply(['2.6.4'], false))
    const a = useChangelogArchive({ fetchImpl, online: () => true })

    await a.loadOlder('2.7.0')
    expect(fetchImpl.mock.calls[0][0]).toMatch(/\/changelog\?limit=10&before=2\.7\.0$/)
    expect(a.status.value).toBe('idle')

    await a.loadOlder('2.7.0')
    expect(fetchImpl.mock.calls[1][0]).toMatch(/before=2\.6\.5$/)
    expect(a.entries.value.map((e) => e.version)).toEqual(['2.6.6', '2.6.5', '2.6.4'])
    expect(a.status.value).toBe('done')

    await a.loadOlder('2.7.0')
    expect(fetchImpl).toHaveBeenCalledTimes(2) // nothing older: no more requests
  })

  // A deploy whose move to the archive was skipped leaves a release in the file AND the archive.
  it('never shows a release twice, and still moves on past a page of repeats', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(reply(['2.6.6', '2.6.5'], true))
      .mockResolvedValueOnce(reply(['2.6.4'], false))
    const a = useChangelogArchive({ fetchImpl, online: () => true })
    const shown = new Set(['2.6.6', '2.6.5'])

    await a.loadOlder('2.6.5', shown)
    expect(a.entries.value).toEqual([])
    await a.loadOlder('2.6.5', shown)
    expect(fetchImpl.mock.calls[1][0]).toMatch(/before=2\.6\.5$/)
    expect(a.entries.value.map((e) => e.version)).toEqual(['2.6.4'])
  })

  it('says offline without trying, and lets the reader retry after an error', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(reply(['2.6.6'], false))
    let online = false
    const a = useChangelogArchive({ fetchImpl, online: () => online })

    await a.loadOlder('2.7.0')
    expect(a.status.value).toBe('offline')
    expect(fetchImpl).not.toHaveBeenCalled()

    online = true
    await a.loadOlder('2.7.0')
    expect(a.status.value).toBe('error')
    await a.loadOlder('2.7.0')
    expect(a.status.value).toBe('done')
    expect(a.entries.value.map((e) => e.version)).toEqual(['2.6.6'])
  })

  it('treats a server error as an error, not as the end of the archive', async () => {
    const a = useChangelogArchive({ fetchImpl: async () => ({ ok: false, status: 500 }), online: () => true })
    await a.loadOlder('2.7.0')
    expect(a.status.value).toBe('error')
  })
})
