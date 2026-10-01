// A Munitorum Field Manual price note's copy tier — '1st-2nd', '3rd+', '2nd' — as a reader reads
// it: "1st–2nd copy" / «1–2-я копия». Which copy of a datasheet in the army the price applies to.
// Shared by the datasheet card's points table and the patch notes' price changes.
export function copyTierLabel(tier, locale) {
  if (locale === 'ru') {
    const nums = (tier.match(/\d+/g) || []).join('–')
    return `${nums}-я${tier.includes('+') ? '+' : ''} копия`
  }
  return `${tier.replace('-', '–')} copy`
}

// "6 models" / «6 моделей» — a unit's size, with the Russian plural it takes.
export function modelsLabel(n, locale) {
  if (locale !== 'ru') return `${n} ${n === 1 ? 'model' : 'models'}`
  const d = n % 10
  const dd = n % 100
  const word = d === 1 && dd !== 11 ? 'модель' : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 'модели' : 'моделей'
  return `${n} ${word}`
}
