#!/usr/bin/env node
// The Legends badge sits in the statline's own spare space, right of OC (DatasheetCard.vue,
// .ds-legends-tag), and steps down a row only below a container width set in CSS. That width
// was once picked by eye on one sheet on one page — and on a ~360px phone the roster builder's
// unit modal (a slightly narrower container than the page) kept the badge on the stat row, which
// then ran past the screen and the whole dialog scrolled sideways (2026-10-04, player screenshot
// of Anrakyr the Traveller). The fix is a threshold MEASURED, and this keeps it measured: every
// Legends sheet is rendered, EN and RU, and the width its stat row + badge really needs is
// compared with the breakpoint the stylesheet declares.
//
// Why the comparison holds for every host: the breakpoint asks the card's shell (`dscard`), and
// the row gets the shell minus the card's tight side padding at worst — a host may bleed the card
// wider (the page and the modal do on a phone), never narrower. So the row fits wherever the
// badge stays up as long as   need + 2 × tight padding ≤ breakpoint.
//
// Needs a fresh `dist/` (`npm run build`) and an installed Google Chrome, like `npm run a11y`.
// Usage: npm run legends-tag [-- --verbose]
/* global document, getComputedStyle -- the page.evaluate callbacks run in the browser */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const ROOT = join(import.meta.dirname, '..')
const verbose = process.argv.includes('--verbose')

// The breakpoint, read from the stylesheet itself: the container query that moves the tag to
// row 2. Read rather than copied, so tuning the CSS cannot leave this gate checking an old number.
const css = readFileSync(join(ROOT, 'src/components/DatasheetCard.vue'), 'utf8')
const bp = [...css.matchAll(/@container dscard \(max-width: (\d+)px\) \{([^}]*\{[^}]*\})*/g)]
  .find((m) => /\n\s*\.ds-legends-tag \{ grid-row: 2;/.test(m[0]))
if (!bp) {
  console.error('legends-tag: no `@container dscard (max-width: …)` block moves .ds-legends-tag to row 2 — update this gate')
  process.exit(1)
}
const breakpoint = Number(bp[1])

// Every Legends sheet a faction file carries (the Chapter files fold Space Marines' in, which are
// checked once, under space-marines).
const dir = join(ROOT, 'src/data/datasheets')
const sheets = []
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && !f.endsWith('.test.js'))) {
  const slug = file.replace(/\.js$/, '')
  const { default: list } = await import(join(dir, file))
  for (const s of list || []) if (s.legends) sheets.push({ slug, id: s.id })
}

const server = await preview({ root: ROOT, preview: { port: 4179, strictPort: false }, logLevel: 'silent' })
const base = server.resolvedUrls.local[0].replace(/\/$/, '')
const browser = await chromium.launch({ channel: 'chrome' })
// 400px: the card is in its tight (≤480px) layout and the badge is still up on the stat row.
const ctx = await browser.newContext({ viewport: { width: 400, height: 844 }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => {
  try { localStorage.setItem('wh11ed-welcome-seen', '1') } catch { /* storage blocked: the card shows, nothing measured moves */ }
})
const page = await ctx.newPage()

const results = []
let missing = 0
for (const locale of ['', '/ru']) {
  for (const s of sheets) {
    const path = `${locale}/factions/${s.slug}/datasheets/${s.id}`
    await page.goto(base + path)
    const tag = await page.waitForSelector('.ds-legends-tag', { timeout: 10000 }).catch(() => null)
    if (!tag) {
      console.error(`  ✗ ${path} — no Legends badge rendered`)
      missing++
      continue
    }
    await page.evaluate(() => document.fonts.ready)
    const m = await page.evaluate(() => {
      const t = document.querySelector('.ds-legends-tag')
      const row = t.closest('.ds-stats')
      const stats = row.querySelectorAll('.ds-stat:not(.ds-inv-box)')
      const first = stats[0]
      const last = stats[stats.length - 1]
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0
      const card = row.closest('.ds-card')
      const padX = parseFloat(getComputedStyle(card).getPropertyValue('--ds-tight-pad-x')) *
        parseFloat(getComputedStyle(document.documentElement).fontSize)
      return {
        // Six stats, a gap, the badge: what the row needs with the badge up. Summed rather than
        // read off the badge's right edge — the badge is pushed to the row's end, so its edge
        // measures the room there is, not the room it takes.
        need: last.getBoundingClientRect().right - first.getBoundingClientRect().left + gap + t.getBoundingClientRect().width,
        sameRow: Math.abs(t.getBoundingClientRect().top - first.getBoundingClientRect().top) < 30,
        padX,
      }
    })
    if (!m.sameRow) {
      console.error(`  ✗ ${path} — badge is not on the stat row at 400px; this gate measures the wrong layout`)
      missing++
      continue
    }
    const required = Math.ceil(m.need + 2 * m.padX)
    results.push({ path, required })
    if (verbose) console.log(`  ${path} — needs ${required}px`)
  }
}
await browser.close()
await server.close()

results.sort((a, b) => b.required - a.required)
const over = results.filter((r) => r.required > breakpoint)
const worst = results[0]
console.log(
  `legends-tag: ${results.length} sheet renders, breakpoint ${breakpoint}px, widest needs ${worst?.required}px (${worst?.path})`,
)
if (over.length) {
  console.error(`✗ ${over.length} render(s) need more than the ${breakpoint}px breakpoint — the stat row runs off a container that narrow:`)
  for (const r of over.slice(0, 10)) console.error(`  ${r.path} — ${r.required}px`)
  console.error('  Raise the breakpoint in DatasheetCard.vue (`.ds-legends-tag { grid-row: 2; … }`).')
}
process.exit(over.length || missing ? 1 : 0)
