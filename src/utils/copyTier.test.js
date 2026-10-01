import { describe, it, expect } from 'vitest'
import { copyTierLabel, modelsLabel } from './copyTier.js'

describe('copyTier', () => {
  it('names a copy tier in either language', () => {
    expect(copyTierLabel('1st-2nd', 'ru')).toBe('1–2-я копия')
    expect(copyTierLabel('3rd+', 'ru')).toBe('3-я+ копия')
    expect(copyTierLabel('3rd+', 'en')).toBe('3rd+ copy')
  })

  it('counts models with the Russian plural', () => {
    expect([1, 2, 5, 11, 21, 22, 12].map((n) => modelsLabel(n, 'ru'))).toEqual(['1 модель', '2 модели', '5 моделей', '11 моделей', '21 модель', '22 модели', '12 моделей'])
    expect(modelsLabel(1, 'en')).toBe('1 model')
  })
})
