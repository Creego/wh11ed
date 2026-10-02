// What a weapon ability's KEYWORDS add to it — "[LETHAL HITS: non-MONSTER/VEHICLE]",
// "[SUSTAINED HITS 1: MONSTER/VEHICLE]", "[ANTI-non-VEHICLE 4+]". The popover looks a tag up by its
// ability name (24.23 Lethal Hits), which explains the ability and says nothing about the part
// after the colon; a player reading that it scores automatic wounds "against everything" is
// reading the wrong rule (owner, 2026-10-02). This reads the qualifier off the tag and says it in
// words, from the two rules that define it:
//   · 24.01 — "If a weapon ability is followed by one or more keywords, … that ability only applies
//     if the target unit has one or more of those keywords" (`/` lists them);
//   · the [ANTI] FAQ in 24.03 — "ANTI-non-(any keyword) triggers on any unit that does not have
//     the specified keyword", and the core rules' general "non-KEYWORD" reading (basicRules.js:
//     a rule for non-VEHICLE units applies to units without that keyword) for the colon form.
// Plain tags ("[LETHAL HITS]", "[ANTI-VEHICLE 4+]", "[SUSTAINED HITS 2]") have nothing to add and
// return null: their own rule already says it.

const KW = /^[A-Z][A-Z' ’-]*$/

function keywords(list) {
  const kws = list.split('/').map((s) => s.trim().toUpperCase())
  return kws.length && kws.every((k) => KW.test(k)) ? kws : null
}

const or = (kws, word) => (kws.length === 1 ? kws[0] : `${kws.slice(0, -1).join(', ')} ${word} ${kws[kws.length - 1]}`)

// → { ability, keywords, negated, anti } or null
export function parseQualifier(tag) {
  const t = String(tag || '').replace(/^\[|\]$/g, '').trim()
  // "ABILITY: KEYWORD/KEYWORD" or "ABILITY: non-KEYWORD/KEYWORD" (24.01)
  const colon = t.match(/^([A-Z][A-Z \-0-9]*?)\s*:\s*(non-)?(.+)$/i)
  if (colon) {
    const kws = keywords(colon[3])
    if (kws) return { ability: colon[1].trim().toUpperCase(), keywords: kws, negated: !!colon[2], anti: false }
  }
  // "ANTI-non-KEYWORD 4+", "ANTI-MONSTER/VEHICLE 4+" — the anti keyword itself can carry a list
  // or a negation. A single plain keyword is what 24.03 already explains.
  const anti = t.match(/^ANTI-(non-)?(.+?)\s+(\d\+)$/i)
  if (anti) {
    const kws = keywords(anti[2])
    if (kws && (anti[1] || kws.length > 1)) return { ability: 'ANTI', keywords: kws, negated: !!anti[1], anti: anti[3] }
  }
  return null
}

// The sentence the popover leads with, in the reader's language. Markup is the rule text's own
// (`**`), rendered by renderRichText.
export function qualifierNote(tag, locale = 'en') {
  const q = parseQualifier(tag)
  if (!q) return null
  const ru = locale === 'ru'
  if (q.anti) {
    return ru
      ? (q.negated
        ? `**Здесь:** срабатывает на ${q.anti} против любого юнита, у которого **нет** ключевого слова ${or(q.keywords, 'или')}.`
        : `**Здесь:** срабатывает на ${q.anti} против юнита с ключевым словом ${or(q.keywords, 'или')}.`)
      : (q.negated
        ? `**Here:** triggers on ${q.anti} against any unit that does **not** have the ${or(q.keywords, 'or')} keyword.`
        : `**Here:** triggers on ${q.anti} against a unit with the ${or(q.keywords, 'or')} keyword.`)
  }
  return ru
    ? (q.negated
      ? `**Здесь:** действует только в атаках по юниту **без** ключевого слова ${or(q.keywords, 'и без')} (24.01). По юниту ${or(q.keywords, 'или')} — не действует.`
      : `**Здесь:** действует только в атаках по юниту ${or(q.keywords, 'или')} (24.01). По остальным целям — не действует.`)
    : (q.negated
      ? `**Here:** applies only to attacks that target a unit with **none** of these keywords: ${q.keywords.join(', ')} (24.01). Against a ${or(q.keywords, 'or')} unit it does nothing.`
      : `**Here:** applies only to attacks that target a ${or(q.keywords, 'or')} unit (24.01). Against any other target it does nothing.`)
}
