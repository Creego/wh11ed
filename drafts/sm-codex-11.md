# Codex: Space Marines (11th) — release-day skeleton

Read off the leaked photo PDF (pp. 156–173) on 2026-09-24. **Names and mechanics only** — the rule
text comes from appdata on release day, never from the photos. Branch-only (`Leak-Guard: sm-codex`).

Use: on release day, diff this list against appdata's detachments for the faction. A name here that
appdata lacks (or spells differently) is the first thing to check; the mechanics column says which
code already waits for it.

## Army rules

| Rule | What it is | Code waiting for it |
|------|------------|---------------------|
| Combat Doctrines | Assault / Devastator / Tactical; one at the start of your Command phase, until your next; each once per battle; one per unit (a later one replaces) | tracker `armyTrackers/space-marines.js`; conditions `doctrine-*` (SOFT_AUTO) |
| Librarius | psyker level / psychic level — same wording as Orks' Unstable energies (946) | none needed (prose) |
| Transhuman Strategist | +1CP at the start of the battle round if the bearer is your WARLORD — same as Orks' Da Boss | none (tracker CP is manual) |
| Space Marine Chapters | second Faction keyword = Chapter; one Chapter per army. BT/SW/DW restrictions from the old block are **not** on the page — check appdata | the chapter picker (`chapters`) |
| Special Move Types | Shock Disembark / Assault Disembark — already core (advancedRules 18.06), reprinted | none |

Oath of Moment is gone. Every place still naming it: journal §8 map (hub).

## Detachments (15) — rule · enhancements · stratagems

UNIQUE tags come from MFM (`scrape-mfm.py` → `d.unique`), checked by `detachmentTagClash`.

1. **Gladius Task Force** — Codex Discipline (one doctrine once more, any) → `spareUses: 1`
   - Enh: Standard of the Emperor Ascendant (ANCIENT; once-per-battle +1A), Laurels of Triumph (assault-doctrine bonus → `doctrine-assault`), Adept of the Codex (CAPTAIN; tactical **in addition** to another — breaks the one-per-unit group, footnote it), Artificer Armour
   - Strat: Armour of Contempt 1, Adaptive Strategy 1 (doctrine for one unit — unit switch), A Worthy Death 1, Storm of Devastation 1, Might of Angels 1, Responsive Tactics 1
2. **Assault Brethren** — UNIQUE: DOCTRINES — Assault Mastery → `bonusUses.assault`
   - Enh: Imperium's Sword (grants a weapon profile), Furious Assault (Upgrade)
   - Strat: Armour of Contempt 1, Gene-wrought Might 1 (assault-doctrine variant), Duty in Death 1 (assault-doctrine +1)
3. **Tactical Brethren** — UNIQUE: DOCTRINES — Tactical Mastery → `bonusUses.tactical`
   - Enh: Laurels of Vigilance (−1CP on Fire Overwatch / Heroic Intervention for BATTLELINE), Tactical Insight (CAPTAIN; tactical in addition)
   - Strat: Armour of Contempt 1, Domination Fire 1 (new state **suppressed**), Masterful Tactics 1 (tactical-doctrine variant)
4. **Devastator Brethren** — UNIQUE: DOCTRINES — Devastator Mastery → `bonusUses.devastator`
   - Enh: Master-forged Firearms, Honour of Vigilance (devastator-doctrine clause)
   - Strat: Armour of Contempt 1, Storm of Fire 1 (devastator variant → `doctrine-devastator`), Hail of Vengeance 2
5. **Terminator Storm Force** — Death Blow
   - Enh: Champion of the First Company, Corporeum Reliquary (ingress move)
   - Strat: Tactical Dreadnought Fortitude 2, Merciless Veterans 1, Gunship Extraction 1
6. **Tacticus Attack Force** — UNIQUE: TACTICUS — Wrath of the Chapter
   - Enh: Martial Paragon, Spearpoint War Leader (Scouts)
   - Strat: Relentless Assault 1, Transhuman Swiftness 1, Tactical Focus 1
7. **Tacticus Firestorm Force** — UNIQUE: TACTICUS — Codex Fire-patterns
   - Enh: Cyber-familiar (redeploy), Tempered in Battle (Aura)
   - Strat: For the Emperor! 1, Relentless Assault 1, Point-blank Brutality 1
8. **Phobos Shadow Force** — UNIQUE: PHOBOS — Shadow Masters (hidden)
   - Enh: Venator Omni-auspex (assault-doctrine clause), Execute and Redeploy
   - Strat: Strike from the Shadows 1, Mortis Snares 1 (new state **snared**, on an objective), Tactical Withdrawal 1
9. **Phobos Shock Force** — UNIQUE: PHOBOS — Vanguard Ambushers
   - Enh: Seal of Shrouding (snap shooting), Venator Omni-auspex (the same enhancement in two detachments)
   - Strat: Strike from the Shadows 1, Transhuman Reactions 1 (tactical-doctrine variant), Umbral Evasion 1
10. **Gravis Linebreaker Force** — UNIQUE: GRAVIS — Walking Fortress
    - Enh: Indefatigable Fortitude, Relentless Advance (Scouts)
    - Strat: Annihilating Force 1, Purgation Push 1, Armoured Impact 1
11. **Gravis Siege Force** — UNIQUE: GRAVIS — Indomitable Defence
    - Enh: Immovable Conquerors (Upgrade), Narthecis Gauntlet (APOTHECARY BIOLOGIS)
    - Strat: Annihilating Force 1, Stand Unyielding 1 (objective **secured**), Suppression Volleys 1
12. **Stormlance Task Force** — Lightning-fast Strike
    - Enh: Supercharged Engines (Upgrade), Auspex Triangulation Shrines (Upgrade; **spotted**)
    - Strat: Wind-swift Evasion 1, Sudden Onslaught 1, Hurtling Targets 1
13. **Ironclad Champions** — Enduring Vengeance
    - Enh: Artificer Sarcophagus (Upgrade), Venerable Champion (Aura, Upgrade)
    - Strat: Adamantine Terror 1, Mercy is Weakness 1, Unstoppable Advance 1
14. **Gauntlet Task Force** — Combined Deployment (new state **assailed**)
    - Enh: Linebreaker Onslaught, Damocles-class Uplink (CAPTAIN; doctrine for one unit)
    - Strat: Aggressive Disembarkation 1, Duty is Never Done 1, Storm and Secure 1 (objective **secured**)
15. **Ironstorm Spearhead** — Ironstorm Auto-targeters
    - Enh: Redoubtable Machine Spirit (Upgrade), Gunnery Honours (Upgrade)
    - Strat: Layered Ceramite 1, Might of the Machine Spirit 1, Headhunter Doctrine 1

Three-stratagem detachments (all but Gladius's six): check appdata's count before assuming a page
was cropped.

## Gone on release (in our data today)

Every current detachment except Gladius, Stormlance and Ironstorm (names kept, rules new): the other
four codex ones and the fifteen Faction Pack / Vengeful Hosts ones — unless appdata keeps the pack.
Saved lists naming one now get `detachmentGone` (commit cd01830).

## New vocabulary → glossary (RU)

| EN | RU (proposal) | Note |
|----|---------------|------|
| combat doctrine | боевая доктрина | `sm-combat-doctrine` — rewrite from detachment rule to army rule |
| assailed | под натиском | Gauntlet; until end of turn |
| suppressed | подавлен | Domination Fire; until the start of your next turn |
| snared | заминирован (о цели) | Mortis Snares; an objective state |
| psyker level / psychic level | уровень псайкера / психический уровень | shared with Orks 946 — the entry can go to main now |

Keywords, rule / detachment / enhancement / stratagem names stay English (wh11ed convention).

## Release-day checklist beyond the pipeline

- `rosterModifiers/space-marines.js`: replace the Oath of Moment `armyRule` record with the three
  doctrines' own effects (Devastator → ranged `grant ASSAULT`, `cond: ['doctrine-devastator']`;
  Assault / Tactical are eligibility rules — footnotes). Add `doctrine-tactical` to conditions.js
  once a record uses it (Masterful Tactics, Transhuman Reactions). Without this the changelog's
  last sentence is false — check it on a real card.
- Adept of the Codex / Tactical Insight: "in addition to any other" — the `combat-doctrine` group
  would evict it; leave those as footnotes (`never`) or give the group an exception.
- Glossary: new states from the table above; `RosterViewView.test.js` looks for «Клятва момента».
- Divergent chapters (BA/DA/SW/DW/BT): does appdata give them Combat Doctrines? The tracker and
  SOFT_AUTO check `factionSlug === 'space-marines'` only.

## Changelog draft (skill `changelog-entry`; numbers to re-check against appdata on the day)

RU:
- { h: 'Кодекс Space Marines' }
- Вышел новый кодекс Space Marines. Oath of Moment больше нет — армейское правило теперь Combat Doctrines. На сайте новые правила армии, 15 детачментов и очки из MFM. Сохранённый список с исчезнувшим детачментом подскажет выбрать новый.
- { h: 'Трекер: Combat Doctrines' }
- В партии за Space Marines можно отмечать доктрину каждого раунда. Использованные доктрины остаются на карточке и показывают раунд. Лишние выборы от Gladius и Brethren-детачментов учитываются. Список в партии применяет эффекты доктрины сам.

EN:
- { h: 'Codex: Space Marines' }
- The new Space Marines codex is out. Oath of Moment is gone — the army rule is now Combat Doctrines. The site has the new army rules, 15 detachments and MFM points. A saved list naming a detachment that is gone asks you to pick a new one.
- { h: 'Tracker: Combat Doctrines' }
- In a Space Marines game you can mark each round’s doctrine. Spent doctrines stay on the card with the round they were used in. The extra picks from Gladius and the Brethren detachments count. The list in the game applies the doctrine’s effects itself.
