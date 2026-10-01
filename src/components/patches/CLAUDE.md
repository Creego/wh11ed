# Patch notes (`/patches`)

GW's updates in one place, "was → now" (owner, 2026-10-01): the app's rules data, the Munitorum
Field Manual's points, the FAQ & errata. Nothing on the page is written by hand.

- **Data** — `scripts/gen-patch-notes.mjs` (`npm run patches`) writes `src/data/patches/<id>.json`
  per update and the light `index.js` the page opens on (per-faction counts, so a filtered list
  needs no file). It reads **history only**: wh40k-appdata's git for rules, this repo's git for
  `src/data/mfm` and `src/data/factionFaq.json`. A written patch never moves when today's data does.
- **The update list** is `scripts/patch-notes/patches.mjs` — one line per update with the commit
  pairs. A data bump adds its line (the hub's `appdata-update` skill) and re-runs `npm run patches`.
- **Noise rules** live in `scripts/patch-notes/diff-*.mjs`, each pinned by a case in
  `diff-bundles.test.js`. Entities are matched **by name, not app id** (GW reissued ~2,300 ids in 963);
  texts are compared as read (markup, quotes, dashes, "(see left)"); BS `N/A`≡`-`, OC `-1`≡`-`; core
  and faction abilities by name only (their text is the core/army rule's, reported once); `Damaged N`
  is the damage bracket again; a weapon profile is named with its weapon ("Tank Kannon – Blasta" —
  two "Blasta" profiles were paired across weapons); a renamed weapon is one rename, not gone + new.
  Points come from the MFM only; a Chapter's FAQ copies of Codex: Space Marines entries are dropped.
- **Removed** entries carry no text (`from` is dropped) — the name is the news, and the 963 file
  was 650 KB with it.
- **Page** — `PatchesView.vue`: two pickers, the faction (`?f=` = slug / `mine` = pinned / `all`; the
  core rules stay in every filter) and the update (`?p=`, one on the page at a time, its file fetched
  when picked — not accordions, owner 2026-10-01; both picks push, see `pick()`), `PatchBody.vue` (faction blocks, folded when an update touches many —
  open from the start when filtered), `PatchEntry.vue` (chips for numbers, +/− for lists, a rule
  text on request), `PatchTextDiff.vue` (`utils/wordDiff.js`, word LCS; a text that only arrived
  renders through `renderRichText`). Units link to today's page (`unit` in the data, resolved by
  name through `datasheetIndex.js` at generation).
- **RU**: labels translate; rule texts are English as GW printed them (no old RU to compare
  against). From the next data bump on, the owner wants both sides translated — not built yet.
- No subnav over the page (`AppSubnav`), a navbar link on the desktop, a direct entry in the
  drawer on the phone; the bottom nav is untouched.
